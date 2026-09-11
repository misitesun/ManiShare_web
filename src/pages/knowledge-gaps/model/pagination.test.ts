import assert from 'node:assert/strict'
import test from 'node:test'
import { getKnowledgeGapPaginationStatus, getNextVisiblePageCount } from './pagination'

test('knowledge-gap pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextVisiblePageCount(1, 3), 2)
    assert.equal(getNextVisiblePageCount(3, 3), 3)
})

test('knowledge-gap pagination is exhausted after the final page', (): void => {
    assert.equal(getKnowledgeGapPaginationStatus(1, 2), 'idle')
    assert.equal(getKnowledgeGapPaginationStatus(2, 2), 'exhausted')
})
