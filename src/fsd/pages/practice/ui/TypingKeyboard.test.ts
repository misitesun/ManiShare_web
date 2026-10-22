import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TypingKeyboard } from './TypingKeyboard'

function renderKeyboard(targetText: string | undefined, input = '', active = true): string {
    return renderToStaticMarkup(
        createElement(TypingKeyboard, {
            width: 848,
            height: 315,
            inputRef: createRef<HTMLInputElement>(),
            targetText,
            input,
            active,
            sessionKey: 'test-question:typing',
        }),
    )
}

function targetCodes(markup: string): string[] {
    return Array.from(
        markup.matchAll(/data-keyboard-key="([^"]+)"[^>]*data-target="true"/g),
        (match) => match[1] ?? '',
    )
}

test('完整五行键盘保留特殊键，键帽为展示语义且不会创建第二套输入控件', (): void => {
    const markup = renderKeyboard('A')
    assert.equal(Array.from(markup.matchAll(/data-keyboard-row=/g)).length, 5)
    for (const code of [
        'CapsLock',
        'Space',
        'Minus',
        'Quote',
        'Semicolon',
        'ShiftLeft',
        'ShiftRight',
        'Enter',
        'Backspace',
    ]) {
        assert.match(markup, new RegExp('data-keyboard-key="' + code + '"'))
    }
    assert.match(markup, />CapsLock<\/text>/)
    assert.match(markup, />Backspace<\/text>/)
    assert.match(markup, />Space<\/text>/)
    const visibleLabels = Array.from(
        markup.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g),
        (match) => match[1] ?? '',
    )
    assert.equal(visibleLabels.length, 31)
    assert.deepEqual(visibleLabels.filter((label) => !/^[A-Z]$/.test(label)).sort(), [
        '&#x27;',
        '-',
        'Backspace',
        'CapsLock',
        'Space',
    ])
    assert.doesNotMatch(markup, /<(button|input|textarea)\b/)
    assert.doesNotMatch(markup, /tabindex=/)
    assert.deepEqual(targetCodes(markup), ['KeyA'])
    assert.match(markup, /data-keyboard-key="ShiftRight"[^>]*data-shift-target="true"/)
})

test('键盘目标由当前原始输入派生，完成后不提前进入下一题', (): void => {
    assert.deepEqual(targetCodes(renderKeyboard("a-' ", 'a')), ['Minus'])
    assert.deepEqual(targetCodes(renderKeyboard("a-' ", 'a-')), ['Quote'])
    assert.deepEqual(targetCodes(renderKeyboard("a-' ", "a-'")), ['Space'])
    const completed = renderKeyboard('ab', 'ab')
    assert.deepEqual(targetCodes(completed), [])
    assert.match(completed, /已完成输入，请确认/)
})

test('暂停不输出下一目标，猜词复用键盘不泄露目标字符', (): void => {
    const paused = renderKeyboard('Secret', '', false)
    assert.deepEqual(targetCodes(paused), [])
    assert.match(paused, /键盘提示已暂停/)
    const guess = renderKeyboard(undefined, 'x')
    assert.deepEqual(targetCodes(guess), [])
    assert.doesNotMatch(guess, /data-shift-target="true"|Secret/)
    assert.match(guess, /data-hand-side="left"/)
    assert.match(guess, /data-hand-side="right"/)
})
