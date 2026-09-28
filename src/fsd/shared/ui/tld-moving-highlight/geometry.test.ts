import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    getHighlightDirection,
    getHighlightEdges,
    getHighlightRect,
    getHighlightRectFromEdges,
    getLayoutScale,
    getRubberSquashEdges,
    getRubberStretchEdges,
} from './geometry'

const container = {
    left: 100,
    top: 50,
    width: 600,
    height: 400,
    scrollLeft: 0,
    scrollTop: 0,
    clientLeft: 1,
    clientTop: 1,
}
test('定位支持横排和多行网格，不依赖索引或固定间距', () => {
    assert.deepEqual(
        getHighlightRect(container, { left: 321, top: 181, width: 200, height: 100 }),
        { left: 220, top: 130, width: 200, height: 100 },
    )
})
test('内部滚动与容器边框不改变选中项的内容坐标', () => {
    assert.deepEqual(
        getHighlightRect(
            { ...container, scrollLeft: 20, scrollTop: 150 },
            { left: 81, top: -25, width: 180, height: 62 },
        ),
        { left: 0, top: 74, width: 180, height: 62 },
    )
})
test('响应式尺寸与小数坐标保持精度', () => {
    assert.deepEqual(
        getHighlightRect(container, { left: 101.5, top: 51.25, width: 140.5, height: 46 }),
        { left: 0.5, top: 0.25, width: 140.5, height: 46 },
    )
})
test('容器入场缩放还原为布局尺寸，小数布局误差不误判为缩放', () => {
    assert.equal(getLayoutScale(145.35, 153), 0.95)
    assert.equal(getLayoutScale(153.3, 153), 1)
    assert.equal(getLayoutScale(0, 0), 1)
})

test('橡皮高亮按目标轴读取边缘并覆盖新旧位置', () => {
    const current = { left: 12, top: 20, width: 1, height: 16 }
    const target = { left: 12, top: 116, width: 1, height: 16 }
    const currentEdges = getHighlightEdges(current, 'vertical')
    const targetEdges = getHighlightEdges(target, 'vertical')

    assert.deepEqual(currentEdges, { start: 20, end: 36 })
    assert.deepEqual(targetEdges, { start: 116, end: 132 })
    assert.equal(getHighlightDirection(currentEdges, targetEdges), 1)
    assert.deepEqual(getRubberStretchEdges(currentEdges, targetEdges), {
        start: 20,
        end: 132,
    })
})

test('橡皮高亮在落点处按方向压缩并还原为目标矩形', () => {
    const target = { left: 12, top: 116, width: 1, height: 16 }
    const targetEdges = getHighlightEdges(target, 'vertical')
    const squashed = getRubberSquashEdges(targetEdges, 1, 3)

    assert.deepEqual(squashed, { start: 119, end: 132 })
    assert.deepEqual(getHighlightRectFromEdges(target, 'vertical', squashed), {
        left: 12,
        top: 119,
        width: 1,
        height: 13,
    })
    assert.deepEqual(getHighlightRectFromEdges(target, 'horizontal', { start: 4, end: 40 }), {
        left: 4,
        top: 116,
        width: 36,
        height: 16,
    })
})
