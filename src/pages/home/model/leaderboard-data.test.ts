import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createLeaderboardRows } from './leaderboard-data'

describe('home leaderboard rows', () => {
    it('creates fifty scrollable rows after the three podium positions', () => {
        const rows = createLeaderboardRows()

        assert.equal(rows.length, 50)
        assert.equal(rows[0]?.rank, 4)
        assert.equal(rows.at(-1)?.rank, 53)
        assert.equal(new Set(rows.map((entry) => entry.rank)).size, 50)
    })

    it('preserves the visible design entries before filling the remaining rows', () => {
        const rows = createLeaderboardRows()

        assert.equal(rows[0]?.name, '一颗草莓')
        assert.equal(rows[0]?.time, '4小时56分钟')
        assert.equal(rows[8]?.name, '两百斤土豆')
        assert.equal(rows[9]?.rank, 13)
    })

    it('returns an empty collection for an invalid requested size', () => {
        assert.deepEqual(createLeaderboardRows(0), [])
        assert.deepEqual(createLeaderboardRows(1.5), [])
    })
})
