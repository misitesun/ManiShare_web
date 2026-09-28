import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextNotebookPageCount, getNotebookPaginationStatus } from './pagination'

test('notebook pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextNotebookPageCount(1, 2), 2)
    assert.equal(getNextNotebookPageCount(2, 2), 2)
})

test('notebook pagination is exhausted after the final page', (): void => {
    assert.equal(getNotebookPaginationStatus(1, 2), 'idle')
    assert.equal(getNotebookPaginationStatus(2, 2), 'exhausted')
})
