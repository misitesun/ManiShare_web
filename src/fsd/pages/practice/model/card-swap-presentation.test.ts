import assert from 'node:assert/strict'
import test from 'node:test'
import {
    cardSwapPresentation,
    getCardSwapMembershipIdentity,
    getCardSwapPresentationPose,
    getCardSwapRetryPresentation,
} from './card-swap-presentation'

test('业务重排保留相同物理成员身份，删除题目才重建', (): void => {
    const keys = ['a', 'b', 'c']
    assert.equal(
        getCardSwapMembershipIdentity(keys),
        getCardSwapMembershipIdentity(['b', 'c', 'a']),
    )
    assert.notEqual(getCardSwapMembershipIdentity(keys), getCardSwapMembershipIdentity(['a', 'b']))
    assert.deepEqual(keys, ['a', 'b', 'c'])
})

test('四层使用原组件32/2/80位姿，hover展开不改变卡面比例', (): void => {
    assert.equal(cardSwapPresentation.visible, 4)
    assert.deepEqual(getCardSwapPresentationPose(3, 0), {
        x: 96,
        y: -6,
        z: -240,
        r: 0,
        p: 3,
        sx: 1,
        sy: 1,
    })
    const hover = getCardSwapPresentationPose(3, 0.12)
    assert.ok(Math.abs(hover.x - 107.52) < 0.001)
    assert.equal(hover.z, -240)
    assert.equal(hover.sx, hover.sy)
    assert.equal(getCardSwapPresentationPose(12, 0).p, 4)
})

test('十条数据只轮转四张展示卡，下一条不提前补成第五张', (): void => {
    const logical = Array.from({ length: 10 }, (_, index): number => index)
    const result = getCardSwapRetryPresentation(logical, logical, 0)
    assert.deepEqual(result, [1, 2, 3, 0, 4, 5, 6, 7, 8, 9])
    assert.equal(result.indexOf(0), 3)
    assert.equal(result.indexOf(4), 4)
    assert.deepEqual(
        logical,
        Array.from({ length: 10 }, (_, index): number => index),
    )
})

test('宽卡按500px参考宽度保持后卡露边比例，默认单词位姿不变', (): void => {
    for (const width of [320, 680]) {
        let previousRightEdge = width
        for (const depth of [1, 2, 3]) {
            const word = getCardSwapPresentationPose(depth, 0)
            const card = getCardSwapPresentationPose(depth, 0, width)
            assert.ok(Math.abs(card.x / width - word.x / 500) < 0.00001)
            assert.equal(card.y, word.y)
            assert.equal(card.z, word.z)
            assert.equal(card.sx, 1)
            assert.equal(card.sy, 1)
            const projection = 900 / (900 - card.z)
            const rightEdge = width / 2 + (width / 2 + card.x) * projection
            assert.ok(rightEdge > previousRightEdge)
            previousRightEdge = rightEdge
        }
    }
    for (const width of [0, -1, Number.NaN, Number.POSITIVE_INFINITY])
        assert.deepEqual(
            getCardSwapPresentationPose(1, 0, width),
            getCardSwapPresentationPose(1, 0),
        )
})

test('连续再来补入真正后续题目，回插尾槽不会提前成为下一题', (): void => {
    const physical = [1, 2, 3, 0, 4, 5, 6, 7, 8, 9]
    const business = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    assert.deepEqual(
        getCardSwapRetryPresentation(physical, business, 1),
        [2, 3, 4, 1, 0, 5, 6, 7, 8, 9],
    )
})

test('末位再来可回队首，少于四张不填假卡，单张保持', (): void => {
    assert.deepEqual(getCardSwapRetryPresentation([2, 0, 1], [0, 1, 2], 2), [0, 1, 2])
    assert.deepEqual(getCardSwapRetryPresentation([1, 2, 0], [0, 1, 2], 1), [2, 1, 0])
    assert.deepEqual(getCardSwapRetryPresentation([1, 0], [0, 1], 1), [0, 1])
    assert.deepEqual(getCardSwapRetryPresentation([0], [0], 0), [0])
})
