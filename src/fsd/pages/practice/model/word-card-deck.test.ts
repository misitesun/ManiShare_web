import assert from 'node:assert/strict'
import test from 'node:test'
import { getWordCardStackPose } from './word-card-deck'

test('真实后卡从原稿堆叠位置连续补位并沿同一路径回退，几何随容器变化', (): void => {
    const near = getWordCardStackPose('near', 0, 500, 500)
    assert.deepEqual(near, { x: 22, y: 14, scaleX: 0.984, scaleY: 0.944 })
    assert.deepEqual(getWordCardStackPose('far', 0, 500, 500), {
        x: 36,
        y: 28,
        scaleX: 0.984,
        scaleY: 0.888,
    })
    assert.deepEqual(getWordCardStackPose('near', 1, 500, 500), {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
    })
    assert.deepEqual(getWordCardStackPose('far', 1, 500, 500), near)
    const middle = getWordCardStackPose('near', 0.5, 500, 500)
    assert.equal(middle.x, 11)
    assert.equal(middle.y, 7)
    assert.equal(middle.scaleX, 0.992)
    assert.equal(middle.scaleY, 0.972)
    const narrow = getWordCardStackPose('near', 0, 250, 400)
    assert.equal(narrow.x, 11)
    assert.ok(Math.abs(narrow.y - 11.2) < 0.0001)
    assert.deepEqual(getWordCardStackPose('near', -1, 500, 500), near)
    assert.deepEqual(
        getWordCardStackPose('near', 2, 500, 500),
        getWordCardStackPose('near', 1, 500, 500),
    )
})
