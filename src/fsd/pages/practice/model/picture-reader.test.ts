import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getPictureReaderDirection,
    getPictureReaderIndex,
    getPictureReaderSwipe,
} from './picture-reader'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'

test('五张图片与会话共用顺序，首尾循环不触发练习完成或答案', (): void => {
    const questions = getDemoQuestions('picture-reader', 'read')
    assert.equal(questions.length, 5)
    assert.equal(new Set(questions.map((question) => question.id)).size, 5)
    assert.ok(
        questions.every(
            (question) =>
                question.english === '' && !question.readingSource && question.tokens.length === 0,
        ),
    )
    let session = initialPracticeSession
    for (let turn = 0; turn < 11; turn += 1) {
        const index = getPictureReaderIndex(session.index, questions.length, 1)
        session = reducePracticeSession(session, {
            type: 'move',
            delta: index - session.index,
            total: questions.length,
        })
        assert.equal(session.index, (turn + 1) % 5)
        assert.equal(session.finished, false)
        assert.equal(session.phase, 'answering')
    }
    assert.equal(getPictureReaderIndex(0, 5, -1), 4)
    assert.equal(getPictureReaderIndex(4, 5, 1), 0)
    assert.equal(getPictureReaderIndex(1, 5, 3), 4)
    assert.equal(getPictureReaderIndex(4, 5, -4), 0)
})

test('空图集与单图不越界，非法索引不产生非数值状态', (): void => {
    assert.equal(getPictureReaderIndex(0, 0, 1), 0)
    assert.equal(getPictureReaderIndex(0, 1, -1), 0)
    assert.equal(getPictureReaderIndex(0, 1, 1), 0)
    for (const [index, total, delta] of [
        [-1, 5, 1],
        [5, 5, 1],
        [0, 5, NaN],
        [0, 5, Infinity],
        [0, 2.5, 1],
    ] as const)
        assert.equal(getPictureReaderIndex(index, total, delta), 0)
})

test('首尾相邻保持单步滑动方向，圆点可以跨图切换', (): void => {
    assert.equal(getPictureReaderDirection(0, 1, 5), 1)
    assert.equal(getPictureReaderDirection(3, 1, 5), -1)
    assert.equal(getPictureReaderDirection(4, 0, 5), 1)
    assert.equal(getPictureReaderDirection(0, 4, 5), -1)
    assert.equal(getPictureReaderDirection(2, 2, 5), 0)
})

test('横向手势翻页，点击抖动、纵向滚动与无效几何不翻页', (): void => {
    const start = { startX: 180, startY: 200, width: 358 }
    assert.equal(getPictureReaderSwipe({ ...start, endX: 80, endY: 210 }), 1)
    assert.equal(getPictureReaderSwipe({ ...start, endX: 280, endY: 190 }), -1)
    assert.equal(getPictureReaderSwipe({ ...start, endX: 170, endY: 200 }), 0)
    assert.equal(getPictureReaderSwipe({ ...start, endX: 100, endY: 300 }), 0)
    assert.equal(getPictureReaderSwipe({ ...start, endX: 110, endY: 260 }), 0)
    assert.equal(getPictureReaderSwipe({ ...start, width: 0, endX: 80, endY: 200 }), 0)
    assert.equal(getPictureReaderSwipe({ ...start, endX: NaN, endY: 200 }), 0)
})
