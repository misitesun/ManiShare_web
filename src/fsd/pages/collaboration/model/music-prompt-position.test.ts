import assert from 'node:assert/strict'
import test from 'node:test'
import { getMusicPromptPosition } from './music-prompt-position'

test('空间充足时向上弹出，尖角中心指向音乐按钮', (): void => {
    const anchor = { left: 600, top: 250, bottom: 278, width: 28 }
    const position = getMusicPromptPosition(anchor, 1920, 1080, 140)
    assert.equal(position.below, false)
    assert.equal(position.top + 140 + 10, anchor.top)
    assert.equal(position.left + position.arrowLeft, anchor.left + anchor.width / 2)
})
test('顶部空间不足时翻到下方', (): void => {
    const position = getMusicPromptPosition(
        { left: 400, top: 40, bottom: 68, width: 28 },
        1440,
        900,
        160,
    )
    assert.equal(position.below, true)
    assert.equal(position.top, 78)
})
test('窄屏和左右边缘不溢出，尖角留在浮层边缘内', (): void => {
    for (const left of [0, 170, 292]) {
        const position = getMusicPromptPosition(
            { left, top: 200, bottom: 228, width: 28 },
            320,
            600,
            140,
        )
        assert.ok(position.left >= 12)
        assert.ok(position.left + position.width <= 308)
        assert.ok(position.arrowLeft >= 12 && position.arrowLeft <= position.width - 12)
    }
    assert.equal(
        getMusicPromptPosition({ left: 0, top: 100, bottom: 128, width: 28 }, 240, 400, 140).width,
        216,
    )
})
test('窗口变矮或文字变高时限制高度，正文和按钮可局部滚动', (): void => {
    const position = getMusicPromptPosition(
        { left: 500, top: 180, bottom: 208, width: 28 },
        1000,
        280,
        260,
    )
    assert.equal(position.below, false)
    assert.equal(position.maxHeight, 158)
    assert.ok(position.top >= 12)
    assert.ok(position.top + position.maxHeight <= 268)
})
