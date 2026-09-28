import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextWorkPageCount, getWorkPaginationStatus } from './pagination'

test('works pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextWorkPageCount(1, 2), 2)
    assert.equal(getNextWorkPageCount(2, 2), 2)
})

test('works pagination is exhausted after the final page', (): void => {
    assert.equal(getWorkPaginationStatus(1, 2), 'idle')
    assert.equal(getWorkPaginationStatus(2, 2), 'exhausted')
})
