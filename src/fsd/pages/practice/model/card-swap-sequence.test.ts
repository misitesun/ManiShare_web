import assert from 'node:assert/strict'
import test from 'node:test'
import { getCardSwapLayout, getCardSwapNavigation, getCardSwapOrder } from './card-swap-sequence'

test('原组件队列只允许顺序前进和显式上一题，末题完成而不循环', (): void => {
    assert.deepEqual(getCardSwapNavigation(0, 10, 'previous'), { kind: 'none' })
    assert.deepEqual(getCardSwapNavigation(0, 10, 'next'), { kind: 'move', index: 1 })
    assert.deepEqual(getCardSwapNavigation(8, 10, 'next'), { kind: 'move', index: 9 })
    assert.deepEqual(getCardSwapNavigation(9, 10, 'next'), { kind: 'finish', index: 9 })
    assert.deepEqual(getCardSwapNavigation(9, 10, 'previous'), { kind: 'move', index: 8 })
    assert.deepEqual(getCardSwapNavigation(0, 1, 'next'), { kind: 'finish', index: 0 })
    assert.deepEqual(getCardSwapNavigation(0, 0, 'next'), { kind: 'none' })
    assert.deepEqual(getCardSwapNavigation(10, 10, 'next'), { kind: 'none' })
})

test('队列保留原卡片身份和历史，访问限制不依赖删除题目', (): void => {
    assert.deepEqual(getCardSwapOrder(2, 4), [2, 3, 0, 1])
    assert.deepEqual(getCardSwapOrder(1, 4), [1, 2, 3, 0])
    assert.deepEqual(getCardSwapOrder(0, 1), [0])
    assert.deepEqual(getCardSwapOrder(-1, 4), [])
})

test('原组件布局口保留原稿静止几何及连续补位，不缩放整个页面', (): void => {
    assert.deepEqual(getCardSwapLayout(0, 500, 500), { x: 0, y: 0, sx: 1, sy: 1 })
    const near = getCardSwapLayout(1, 500, 500)
    const far = getCardSwapLayout(2, 500, 500)
    assert.ok(Math.abs(near.x - 18) < 0.0001)
    assert.ok(Math.abs(near.y) < 0.0001)
    assert.equal(near.sx, 0.984)
    assert.equal(near.sy, 0.944)
    assert.ok(Math.abs(far.x - 32) < 0.0001)
    assert.ok(Math.abs(far.y) < 0.0001)
    assert.equal(far.sy, 0.888)
    assert.ok(Math.abs(getCardSwapLayout(0.5, 500, 500).x - 9) < 0.0001)
    assert.ok(Math.abs(getCardSwapLayout(1, 250, 500).x - 9) < 0.0001)
})
