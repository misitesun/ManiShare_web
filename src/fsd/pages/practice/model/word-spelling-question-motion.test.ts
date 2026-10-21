import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getWordSpellingQuestionDirection,
    getWordSpellingQuestionPose,
} from './word-spelling-question-motion'

test('相邻切题及内容列表跨题按真实题号判定方向，同题不启动翻转', (): void => {
    assert.equal(getWordSpellingQuestionDirection(0, 1), 'next')
    assert.equal(getWordSpellingQuestionDirection(1, 0), 'previous')
    assert.equal(getWordSpellingQuestionDirection(2, 8), 'next')
    assert.equal(getWordSpellingQuestionDirection(8, 2), 'previous')
    assert.equal(getWordSpellingQuestionDirection(0, 0), null)
    assert.equal(getWordSpellingQuestionDirection(11, 11), null)
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
        assert.equal(getWordSpellingQuestionDirection(invalid, 0), null)
        assert.equal(getWordSpellingQuestionDirection(0, invalid), null)
    }
})

test('前后题使用完整180度翻面，下一题向右、上一题向左，进入面始终正向', (): void => {
    const next = getWordSpellingQuestionPose('next')
    const previous = getWordSpellingQuestionPose('previous')
    assert.equal(next.rotation, 180)
    assert.equal(previous.rotation, -180)
    assert.equal(next.incomingRotation + next.rotation, 0)
    assert.equal(previous.incomingRotation + previous.rotation, 0)
    assert.equal(previous.incomingRotation, -next.incomingRotation)
})
