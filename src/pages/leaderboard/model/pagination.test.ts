import assert from 'node:assert/strict'
import test from 'node:test'
import { getLeaderboardPaginationStatus, getNextLeaderboardPageCount } from './pagination'

test('leaderboard pagination advances one page without exceeding the total', (): void => {
    assert.equal(getNextLeaderboardPageCount(1, 3), 2)
    assert.equal(getNextLeaderboardPageCount(3, 3), 3)
})

test('leaderboard pagination reports exhaustion after the final page', (): void => {
    assert.equal(getLeaderboardPaginationStatus(1, 3), 'idle')
    assert.equal(getLeaderboardPaginationStatus(3, 3), 'exhausted')
})
