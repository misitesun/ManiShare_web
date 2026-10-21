import assert from 'node:assert/strict'
import test from 'node:test'
import { getPracticeKeydownDecision, subscribePracticeKeydown } from './usePracticeCommands'
import type {
    PracticeKeyboardTarget,
    PracticeKeyInput,
    PracticeShortcutContext,
} from './practice-shortcuts'
import { getPracticeAnswerKeyAction } from './word-spelling-input'
import { practiceDemos } from './practice-demo'
import { hasPracticeAnswerInput } from './practice-visibility'

const context: PracticeShortcutContext = {
    family: 'word',
    mode: 'spell',
    phase: 'answering',
    oralStage: 'idle',
    hasTarget: true,
    showEvaluation: true,
    panelVisible: true,
    scope: 'question',
    ready: true,
    answerInputCommands: true,
    values: {
        previousShortcut: 'Shift + ArrowLeft',
        nextShortcut: 'Shift + ArrowRight',
        playShortcut: 'Shift + L',
        masteredShortcut: 'Shift + J',
        unfamiliarShortcut: 'Shift + K',
    },
}
const event: PracticeKeyInput = {
    key: 'L',
    shiftKey: true,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
}

test('局部左右键停止冒泡前页面已处理切题，其他编辑器仍保持冒泡顺序，卸载清理两侧', (): void => {
    const listeners: { readonly listener: (event: Event) => void; readonly capture: boolean }[] = []
    const source = {
        addEventListener(
            _type: 'keydown',
            listener: (event: Event) => void,
            capture = false,
        ): void {
            listeners.push({ listener, capture })
        },
        removeEventListener(
            _type: 'keydown',
            listener: (event: Event) => void,
            capture = false,
        ): void {
            const index = listeners.findIndex(
                (entry) => entry.listener === listener && entry.capture === capture,
            )
            if (index >= 0) listeners.splice(index, 1)
        },
    }
    let target: PracticeKeyboardTarget = 'answer-input'
    const stages: string[] = []
    const key = {
        ...event,
        key: 'ArrowRight',
        isComposing: false,
        keyCode: 0,
        defaultPrevented: false,
    }
    const unsubscribe = subscribePracticeKeydown<Event>(
        source,
        () => target,
        (input): void => {
            const decision = getPracticeKeydownDecision(key, context, target, false)
            if (decision.preventDefault) input.preventDefault()
            if (decision.command) stages.push(decision.command)
            else stages.push(target)
        },
    )
    const input = new Event('keydown', { bubbles: true, cancelable: true })
    for (const entry of listeners.filter((entry) => entry.capture)) entry.listener(input)
    const action = getPracticeAnswerKeyAction({ ...key, defaultPrevented: input.defaultPrevented })
    if (action === 'block-position') input.stopPropagation()
    if (!input.cancelBubble)
        for (const entry of listeners.filter((entry) => !entry.capture)) entry.listener(input)
    assert.deepEqual(stages, ['question.next'], '捕获前置，且同一快捷键不能在冒泡阶段重复派发')
    assert.equal(action, 'native', '页面命中后不再进入输入器定位拦截')

    target = 'editor'
    stages.length = 0
    const editor = new Event('keydown', { bubbles: true, cancelable: true })
    for (const entry of listeners.filter((entry) => entry.capture)) entry.listener(editor)
    stages.push('local-editor')
    for (const entry of listeners.filter((entry) => !entry.capture)) entry.listener(editor)
    assert.deepEqual(stages, ['local-editor', 'editor'])
    assert.equal(editor.defaultPrevented, false)
    unsubscribe()
    assert.equal(listeners.length, 0)
})

test('Escape先交给浮层处理，未被局部消费时才进入页面冒泡命令', (): void => {
    class EscapeEvent extends Event {
        readonly key = 'Escape'
    }
    const listeners: {
        readonly listener: (event: EscapeEvent) => void
        readonly capture: boolean
    }[] = []
    const source = {
        addEventListener(
            _type: 'keydown',
            listener: (event: EscapeEvent) => void,
            capture = false,
        ): void {
            listeners.push({ listener, capture })
        },
        removeEventListener(
            _type: 'keydown',
            listener: (event: EscapeEvent) => void,
            capture = false,
        ): void {
            const index = listeners.findIndex(
                (entry) => entry.listener === listener && entry.capture === capture,
            )
            if (index >= 0) listeners.splice(index, 1)
        },
    }
    let calls = 0
    const unsubscribe = subscribePracticeKeydown<EscapeEvent>(
        source,
        () => 'answer-input',
        (): void => {
            calls += 1
        },
    )
    const event = new EscapeEvent('keydown', { cancelable: true, bubbles: true })
    for (const entry of listeners.filter((entry) => entry.capture)) entry.listener(event)
    assert.equal(calls, 0)
    event.preventDefault()
    event.stopPropagation()
    if (!event.cancelBubble)
        for (const entry of listeners.filter((entry) => !entry.capture)) entry.listener(event)
    assert.equal(calls, 0)
    const withoutPopover = new EscapeEvent('keydown', { cancelable: true, bubbles: true })
    for (const entry of listeners) entry.listener(withoutPopover)
    assert.equal(calls, 1)
    unsubscribe()
    assert.equal(listeners.length, 0)
})

test('所有作答模式先执行Shift方向切题，输入位置拦截只处理未命中的按键', (): void => {
    const inputs = practiceDemos.flatMap(({ family, modes }) =>
        modes.filter(hasPracticeAnswerInput).map((mode) => ({ family, mode })),
    )
    assert.ok(inputs.length > 0)
    for (const { family, mode } of inputs)
        for (const [key, command] of [
            ['ArrowLeft', 'question.previous'],
            ['ArrowRight', 'question.next'],
        ] as const) {
            const keyEvent = {
                key,
                shiftKey: true,
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                isComposing: false,
                keyCode: 0,
                defaultPrevented: false,
            }
            const current = { ...context, family, mode }
            const decision = getPracticeKeydownDecision(keyEvent, current, 'answer-input', false)
            assert.deepEqual(decision, { command, preventDefault: true })
            assert.equal(
                getPracticeAnswerKeyAction({
                    ...keyEvent,
                    defaultPrevented: decision.preventDefault,
                }),
                'native',
                '已执行的页面命令不能再次进入输入器光标分支',
            )
            assert.deepEqual(
                getPracticeKeydownDecision(
                    { ...keyEvent, repeat: true },
                    current,
                    'answer-input',
                    true,
                ),
                { command: null, preventDefault: true },
            )
            const plain = { ...keyEvent, shiftKey: false }
            assert.deepEqual(getPracticeKeydownDecision(plain, current, 'answer-input', false), {
                command: null,
                preventDefault: false,
            })
            assert.equal(getPracticeAnswerKeyAction(plain), 'block-position')
        }
})

test('没有绑定到页面命令的修饰方向键仍不能选区定位，IME继续让行', (): void => {
    const keyEvent = {
        key: 'ArrowLeft',
        shiftKey: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        isComposing: false,
        keyCode: 0,
        defaultPrevented: false,
    }
    const custom = { ...context, values: { ...context.values, previousShortcut: 'Shift + P' } }
    assert.deepEqual(getPracticeKeydownDecision(keyEvent, custom, 'answer-input', false), {
        command: null,
        preventDefault: false,
    })
    assert.equal(getPracticeAnswerKeyAction(keyEvent), 'block-position')
    const composing = { ...keyEvent, isComposing: true, keyCode: 229 }
    assert.deepEqual(getPracticeKeydownDecision(composing, context, 'answer-input', false), {
        command: null,
        preventDefault: false,
    })
    assert.equal(getPracticeAnswerKeyAction(composing), 'native')
})

test('命中后长按继续拦截字符但不重复派发，释放后允许下一次动作', (): void => {
    assert.deepEqual(getPracticeKeydownDecision(event, context, 'answer-input', false), {
        preventDefault: true,
        command: 'practice.readAloud',
    })
    for (const repeat of [true, false])
        assert.deepEqual(
            getPracticeKeydownDecision({ ...event, repeat }, context, 'answer-input', true),
            { preventDefault: true, command: null },
        )
    assert.deepEqual(getPracticeKeydownDecision(event, context, 'answer-input', false), {
        preventDefault: true,
        command: 'practice.readAloud',
    })
})

test('普通字符、原生编辑、IME、弹窗和普通编辑器都不被长按记录误吞', (): void => {
    for (const current of [
        { ...event, isComposing: true },
        { ...event, key: 'a', ctrlKey: true },
        { ...event, defaultPrevented: true },
    ])
        assert.deepEqual(getPracticeKeydownDecision(current, context, 'answer-input', true), {
            preventDefault: false,
            command: null,
        })
    assert.deepEqual(
        getPracticeKeydownDecision({ ...event, key: 'A' }, context, 'answer-input', false),
        { preventDefault: false, command: null },
    )
    assert.deepEqual(getPracticeKeydownDecision(event, context, 'editor', true), {
        preventDefault: false,
        command: null,
    })
    assert.deepEqual(
        getPracticeKeydownDecision(event, { ...context, scope: 'blocked' }, 'answer-input', true),
        { preventDefault: false, command: null },
    )
})

test('收起答案后同次长按仍不移动原生选区', (): void => {
    const arrow = { ...event, key: 'ArrowUp', shiftKey: false, repeat: true }
    assert.deepEqual(
        getPracticeKeydownDecision(
            arrow,
            { ...context, panelVisible: false },
            'answer-input',
            true,
        ),
        { preventDefault: true, command: null },
    )
})

test('所有作答输入去重并阻止默认行为，内容区沿用原策略', (): void => {
    const enter = { ...event, key: 'Enter', shiftKey: false, repeat: true }
    assert.deepEqual(
        getPracticeKeydownDecision(enter, { ...context, mode: 'meaning' }, 'answer-input', true),
        { preventDefault: true, command: null },
    )
    assert.deepEqual(getPracticeKeydownDecision(enter, context, 'content', true), {
        preventDefault: false,
        command: null,
    })
})

test('默写显式启用作答命令时与拼写相同，未启用时保留原生输入', (): void => {
    const dictation = { ...context, mode: 'dictate' as const }
    assert.deepEqual(getPracticeKeydownDecision(event, dictation, 'answer-input', false), {
        preventDefault: true,
        command: 'practice.readAloud',
    })
    assert.deepEqual(getPracticeKeydownDecision(event, dictation, 'answer-input', true), {
        preventDefault: true,
        command: null,
    })
    const arrow = { ...event, key: 'ArrowDown', shiftKey: false }
    assert.deepEqual(
        getPracticeKeydownDecision(
            arrow,
            { ...dictation, answerInputCommands: false },
            'answer-input',
            false,
        ),
        { preventDefault: false, command: null },
    )
    assert.deepEqual(
        getPracticeKeydownDecision(
            { ...event, isComposing: true },
            dictation,
            'answer-input',
            false,
        ),
        { preventDefault: false, command: null },
    )
})
