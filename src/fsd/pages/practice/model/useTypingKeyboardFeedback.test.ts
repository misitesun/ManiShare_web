import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    createTypingKeyboardFeedbackController,
    useTypingKeyboardFeedback,
} from './useTypingKeyboardFeedback'
import type { TypingKeyboardFeedbackSnapshot } from './useTypingKeyboardFeedback'

function fixture(targetText: string | undefined = 'Ab c'): {
    readonly controller: ReturnType<typeof createTypingKeyboardFeedbackController>
    readonly snapshots: TypingKeyboardFeedbackSnapshot[]
    readonly timers: Map<number, () => void>
} {
    const snapshots: TypingKeyboardFeedbackSnapshot[] = []
    const timers = new Map<number, () => void>()
    let timerId = 0
    const controller = createTypingKeyboardFeedbackController({
        initialInput: '',
        targetText,
        onChange: (snapshot): void => {
            snapshots.push(snapshot)
        },
        schedule: (callback, milliseconds): number => {
            assert.equal(milliseconds, 220)
            timerId += 1
            timers.set(timerId, callback)
            return timerId
        },
        cancel: (timer): void => {
            timers.delete(timer)
        },
    })
    return { controller, snapshots, timers }
}

function physical(
    code: string,
    shiftKey = false,
    capsLock: boolean | null = false,
): {
    readonly code: string
    readonly shiftKey: boolean
    readonly capsLock: boolean | null
    readonly isComposing: boolean
    readonly keyCode: number
} {
    return { code, shiftKey, capsLock, isComposing: false, keyCode: 0 }
}

test('实体 keydown 不产生字符反馈，原生输入结果才产生一次反馈并短暂清理', (): void => {
    const { controller, snapshots, timers } = fixture()
    controller.keydown(physical('KeyA', true))
    assert.equal(snapshots.at(-1)?.feedback, null)
    controller.input('A', false)
    assert.equal(snapshots.at(-1)?.feedback?.character, 'A')
    assert.equal(snapshots.at(-1)?.feedback?.kind, 'actual')
    const length = snapshots.length
    controller.input('A', false)
    assert.equal(snapshots.length, length)
    assert.equal(timers.size, 1)
    for (const callback of timers.values()) callback()
    assert.equal(snapshots.at(-1)?.feedback, null)
})

test('IME 中间结果不映射，compositionend 只消费最终值一次', (): void => {
    const { controller, snapshots } = fixture('a')
    controller.compositionStart()
    controller.input('n', true)
    controller.input('ni', true)
    assert.equal(snapshots.at(-1)?.composing, true)
    assert.equal(snapshots.at(-1)?.feedback, null)
    controller.compositionEnd('你')
    assert.equal(snapshots.at(-1)?.composing, false)
    assert.equal(snapshots.at(-1)?.feedback?.character, '你')
    assert.equal(snapshots.at(-1)?.feedback?.key, null)
    assert.equal(snapshots.at(-1)?.feedback?.kind, 'error')
    const length = snapshots.length
    controller.input('你', false)
    assert.equal(snapshots.length, length)
})

test('粘贴、选择替换和删除依据输入结果反馈，新反馈取消旧清理任务', (): void => {
    const { controller, snapshots, timers } = fixture('abcd')
    controller.input('abcd', false)
    const firstId = snapshots.at(-1)?.feedback?.id
    controller.input('aXcd', false)
    assert.equal(snapshots.at(-1)?.feedback?.character, 'X')
    assert.equal(snapshots.at(-1)?.feedback?.kind, 'error')
    assert.notEqual(snapshots.at(-1)?.feedback?.id, firstId)
    assert.equal(timers.size, 1)
    controller.input('acd', false)
    assert.equal(snapshots.at(-1)?.feedback?.kind, 'delete')
    assert.equal(timers.size, 1)
})

test('左右 Shift 和 CapsLock 仅消费可靠物理状态，软键盘大写不伪造修饰键', (): void => {
    const { controller, snapshots } = fixture()
    controller.input('A', false)
    assert.equal(snapshots.at(-1)?.shiftLeft, false)
    assert.equal(snapshots.at(-1)?.shiftRight, false)
    assert.equal(snapshots.at(-1)?.capsLock, null)
    controller.keydown(physical('ShiftRight', true, true))
    assert.equal(snapshots.at(-1)?.shiftRight, true)
    assert.equal(snapshots.at(-1)?.capsLock, true)
    controller.keydown(physical('ShiftLeft', true, true))
    controller.keyup(physical('ShiftRight', true, true))
    assert.equal(snapshots.at(-1)?.shiftLeft, true)
    assert.equal(snapshots.at(-1)?.shiftRight, false)
    controller.keyup(physical('ShiftLeft', false, false))
    assert.equal(snapshots.at(-1)?.shiftLeft, false)
    assert.equal(snapshots.at(-1)?.capsLock, false)
    const length = snapshots.length
    controller.keydown({ ...physical('ShiftLeft', true), keyCode: 229 })
    controller.keydown({ ...physical('ShiftLeft', true), isComposing: true })
    assert.equal(snapshots.length, length)
})

test('失焦清空短暂反馈、组合及修饰状态，销毁取消任务且不再发布', (): void => {
    const { controller, snapshots, timers } = fixture()
    controller.keydown(physical('ShiftLeft', true, true))
    controller.input('A', false)
    controller.compositionStart()
    controller.release('A')
    assert.deepEqual(snapshots.at(-1), {
        feedback: null,
        shiftLeft: false,
        shiftRight: false,
        capsLock: null,
        composing: false,
    })
    assert.equal(timers.size, 0)
    controller.input('Ab', false)
    assert.equal(timers.size, 1)
    controller.dispose()
    assert.equal(timers.size, 0)
    const length = snapshots.length
    controller.input('Ab c', false)
    controller.keydown(physical('ShiftLeft', true, true))
    assert.equal(snapshots.length, length)
})

test('受控输入重置同步基线，原生输入同值同步不清掉反馈且不消费 IME 中间值', (): void => {
    const { controller, snapshots } = fixture('abc')
    controller.input('ab', false)
    const feedback = snapshots.at(-1)?.feedback
    controller.synchronize('ab')
    assert.equal(snapshots.at(-1)?.feedback, feedback)
    controller.synchronize('')
    assert.equal(snapshots.at(-1)?.feedback, null)
    controller.input('a', false)
    assert.equal(snapshots.at(-1)?.feedback?.kind, 'actual')
    assert.equal(snapshots.at(-1)?.feedback?.character, 'a')
    controller.compositionStart()
    controller.input('a你', true)
    controller.synchronize('a你')
    assert.equal(snapshots.at(-1)?.composing, true)
    controller.compositionEnd('a你')
    assert.equal(snapshots.at(-1)?.feedback?.character, '你')
})

test('Hook 首次服务端渲染确定且不读取 DOM，猜词无目标不泄露答案', (): void => {
    function Probe({
        active,
        guess,
    }: {
        readonly active: boolean
        readonly guess: boolean
    }): ReactElement {
        const feedback = useTypingKeyboardFeedback({
            inputRef: { current: null },
            ...(guess ? {} : { targetText: 'A' }),
            input: '',
            active,
            sessionKey: 'example',
        })
        return createElement('span', {
            'data-target': feedback.target?.character ?? '',
            'data-caps': String(feedback.capsLock),
            'data-feedback': feedback.feedback?.kind ?? '',
        })
    }
    assert.match(
        renderToStaticMarkup(createElement(Probe, { active: true, guess: false })),
        /data-target="A"/,
    )
    assert.match(
        renderToStaticMarkup(createElement(Probe, { active: false, guess: false })),
        /data-target=""/,
    )
    assert.match(
        renderToStaticMarkup(createElement(Probe, { active: true, guess: true })),
        /data-target=""/,
    )
})
