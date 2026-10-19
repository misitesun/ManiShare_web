import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TypingHands } from './TypingHands'

interface HandTransform {
    readonly x: number
    readonly y: number
    readonly scaleX: number
    readonly scaleY: number
}

function renderHands(
    targetCode: string | null,
    shiftCode: 'ShiftLeft' | 'ShiftRight' | null = null,
): string {
    return renderToStaticMarkup(createElement(TypingHands, { targetCode, shiftCode }))
}

function readHandTransform(markup: string, side: 'left' | 'right'): HandTransform {
    const hand = markup.match(
        new RegExp(
            `data-hand-side="${side}"[^>]*transform="translate\\(([-\\d.]+) ([-\\d.]+)\\) scale\\(([-\\d.]+) ([-\\d.]+)\\)"`,
        ),
    )
    assert.ok(hand, `${side} hand should expose a finite transform`)
    const result = {
        x: Number(hand[1]),
        y: Number(hand[2]),
        scaleX: Number(hand[3]),
        scaleY: Number(hand[4]),
    }
    assert.ok(Object.values(result).every(Number.isFinite))
    return result
}

test('无目标及不支持的目标保留两侧中立手，不沿用上一目标姿势', () => {
    const neutral = renderHands(null)
    assert.match(neutral, /data-hand-side="left" data-hand-shape="neutral-left"/)
    assert.match(neutral, /data-hand-side="right" data-hand-shape="neutral-right"/)
    assert.equal(renderHands('Unidentified'), neutral)
    assert.equal(renderHands('Backspace'), neutral)
    assert.notEqual(renderHands('KeyA'), neutral)
    assert.equal(renderHands(null), neutral)
})

test('空格使用右拇指，同时保留左侧中立手', () => {
    const markup = renderHands('Space')
    assert.match(markup, /data-hand-side="left" data-hand-shape="neutral-left"/)
    assert.match(markup, /data-hand-side="right" data-hand-shape="space" data-hand-key="Space"/)
    assert.equal((markup.match(/data-hand-side=/g) ?? []).length, 2)
})

test('左手字母和右侧Shift独立显示，右手符号和左侧Shift独立显示', () => {
    const uppercaseLetter = renderHands('KeyA', 'ShiftRight')
    assert.match(uppercaseLetter, /data-hand-side="left" data-hand-shape="a" data-hand-key="KeyA"/)
    assert.match(
        uppercaseLetter,
        /data-hand-side="right" data-hand-shape="shift-right" data-hand-key="ShiftRight"/,
    )
    const shiftedQuote = renderHands('Quote', 'ShiftLeft')
    assert.match(
        shiftedQuote,
        /data-hand-side="left" data-hand-shape="shift-left" data-hand-key="ShiftLeft"/,
    )
    assert.match(
        shiftedQuote,
        /data-hand-side="right" data-hand-shape="single-quote" data-hand-key="Quote"/,
    )
    assert.equal((uppercaseLetter.match(/data-hand-side=/g) ?? []).length, 2)
    assert.equal((shiftedQuote.match(/data-hand-side=/g) ?? []).length, 2)
})

test('CapsLock借用相邻小指轮廓时保留近似标记，不把它冒充独立资产', () => {
    const markup = renderHands('CapsLock')
    assert.match(
        markup,
        /data-hand-side="left" data-hand-shape="a" data-hand-key="CapsLock" data-hand-approximation="adjacent-pinky"/,
    )
    assert.match(markup, /data-hand-side="right" data-hand-shape="neutral-right"/)
    assert.doesNotMatch(renderHands('KeyA'), /data-hand-approximation=/)
})

test('原图已核实的A键和单引号指尖分别落在键盘基准的目标键中心', () => {
    // 原资源指尖坐标与720×260 ANSI基准的独立几何样例，避免仅验证同一个计算函数。
    const left = readHandTransform(renderHands('KeyA'), 'left')
    assert.ok(Math.abs(left.x + 171.1 * left.scaleX - 112.2) < 0.01)
    assert.ok(Math.abs(left.y + 156.5 * left.scaleY - 130) < 0.01)
    const right = readHandTransform(renderHands('Quote'), 'right')
    assert.ok(Math.abs(right.x + 471.8 * right.scaleX - 584.2) < 0.01)
    assert.ok(Math.abs(right.y + 157 * right.scaleY - 130) < 0.01)
})

test('左右Shift同时可有独立目标变换，未知目标也不会丢失任一只手', () => {
    const markup = renderHands('Unidentified', 'ShiftLeft')
    assert.match(markup, /data-hand-side="left" data-hand-shape="shift-left"/)
    assert.match(markup, /data-hand-side="right" data-hand-shape="neutral-right"/)
    const shifted = renderHands('Quote', 'ShiftLeft')
    const left = readHandTransform(shifted, 'left')
    const right = readHandTransform(shifted, 'right')
    assert.notDeepEqual(left, right)
    assert.ok(Math.abs(left.x + 141.6 * left.scaleX - 59.1) < 0.01)
    assert.ok(Math.abs(left.y + 184 * left.scaleY - 178) < 0.01)
})
