import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextWithdrawalRecordPageCount, getWithdrawalRecordPaginationStatus } from './pagination'

test('withdrawal record pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextWithdrawalRecordPageCount(1, 2), 2)
    assert.equal(getNextWithdrawalRecordPageCount(2, 2), 2)
})

test('withdrawal record pagination is exhausted after the final page', (): void => {
    assert.equal(getWithdrawalRecordPaginationStatus(1, 2), 'idle')
    assert.equal(getWithdrawalRecordPaginationStatus(2, 2), 'exhausted')
})
