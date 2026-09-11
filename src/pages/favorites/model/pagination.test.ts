import assert from 'node:assert/strict'
import test from 'node:test'
import { getFavoritePaginationStatus, getNextFavoritePageCount } from './pagination'

test('favorites pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextFavoritePageCount(1, 2), 2)
    assert.equal(getNextFavoritePageCount(2, 2), 2)
})

test('favorites pagination is exhausted after the final page', (): void => {
    assert.equal(getFavoritePaginationStatus(1, 2), 'idle')
    assert.equal(getFavoritePaginationStatus(2, 2), 'exhausted')
})
