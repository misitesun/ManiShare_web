import assert from 'node:assert/strict'
import test from 'node:test'
import { getLearningProgressPaginationStatus, getNextLearningProgressPageCount } from './pagination'

test('learning progress pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextLearningProgressPageCount(1, 2), 2)
    assert.equal(getNextLearningProgressPageCount(2, 2), 2)
})

test('learning progress pagination is exhausted after the final page', (): void => {
    assert.equal(getLearningProgressPaginationStatus(1, 2), 'idle')
    assert.equal(getLearningProgressPaginationStatus(2, 2), 'exhausted')
})
