import assert from 'node:assert/strict'
import test from 'node:test'
import { getCardSwapSeed } from './card-swap-seed'
import { getCardSwapLayout, getCardSwapOrder } from './card-swap-sequence'

test('普通前进/上一题保留渲染种子，不重建正在运行的卡堆', (): void => {
    const seed = { identity: JSON.stringify(['a', 'b', 'c', 'd']), index: 0 }
    assert.equal(getCardSwapSeed(seed, seed.identity, 3), seed)
    assert.equal(getCardSwapSeed(seed, seed.identity, 1), seed)
})

test('删除后种子跟随受控当前索引，剩余末卡仍是完整可见前卡', (): void => {
    const original = { identity: JSON.stringify(['a', 'b', 'c', 'd', 'e']), index: 0 }
    const four = getCardSwapSeed(original, JSON.stringify(['a', 'b', 'c', 'e']), 3)
    const three = getCardSwapSeed(four, JSON.stringify(['a', 'b', 'e']), 2)
    for (const [seed, count] of [
        [four, 4],
        [three, 3],
    ] as const) {
        const order = getCardSwapOrder(seed.index, count)
        const frontPosition = order.indexOf(seed.index)
        assert.equal(order[0], seed.index)
        assert.deepEqual(getCardSwapLayout(frontPosition, 500, 500), {
            x: 0,
            y: 0,
            sx: 1,
            sy: 1,
        })
        assert.equal(frontPosition < 3, true)
    }
    assert.equal(original.index, 0)
    assert.equal(four.index, 3)
    assert.equal(three.index, 2)
})

test('同数量再来重排也生成新种子，保留宿主选中的接位索引', (): void => {
    const first = { identity: JSON.stringify(['a', 'b', 'c']), index: 0 }
    const retried = getCardSwapSeed(first, JSON.stringify(['b', 'c', 'a']), 0)
    assert.notEqual(retried, first)
    assert.equal(retried.index, 0)
    const middle = getCardSwapSeed(retried, JSON.stringify(['b', 'a', 'c']), 1)
    assert.equal(middle.index, 1)
    assert.notEqual(middle.identity, retried.identity)
})
