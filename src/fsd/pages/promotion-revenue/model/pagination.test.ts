import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextPromotionRevenuePageCount, getPromotionRevenuePaginationStatus } from './pagination'

test('promotion revenue pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextPromotionRevenuePageCount(1, 2), 2)
    assert.equal(getNextPromotionRevenuePageCount(2, 2), 2)
})

test('promotion revenue pagination is exhausted after the final page', (): void => {
    assert.equal(getPromotionRevenuePaginationStatus(1, 2), 'idle')
    assert.equal(getPromotionRevenuePaginationStatus(2, 2), 'exhausted')
})
