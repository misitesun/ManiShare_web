import assert from 'node:assert/strict'
import test from 'node:test'
import { getBranchCompanyPaginationStatus, getNextBranchCompanyPageCount } from './pagination'

test('branch company pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextBranchCompanyPageCount(1, 2), 2)
    assert.equal(getNextBranchCompanyPageCount(2, 2), 2)
})

test('branch company pagination is exhausted after the final page', (): void => {
    assert.equal(getBranchCompanyPaginationStatus(1, 2), 'idle')
    assert.equal(getBranchCompanyPaginationStatus(2, 2), 'exhausted')
})
