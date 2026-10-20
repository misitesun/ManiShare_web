import assert from 'node:assert/strict'
import test from 'node:test'
import { getPracticeKeydownDecision } from './usePracticeCommands'
import type { PracticeKeyInput, PracticeShortcutContext } from './practice-shortcuts'

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

test('其他模式与内容区不扩大重复按键的消费策略', (): void => {
    const enter = { ...event, key: 'Enter', shiftKey: false, repeat: true }
    assert.deepEqual(
        getPracticeKeydownDecision(enter, { ...context, mode: 'dictate' }, 'answer-input', true),
        { preventDefault: false, command: null },
    )
    assert.deepEqual(getPracticeKeydownDecision(enter, context, 'content', true), {
        preventDefault: false,
        command: null,
    })
})
