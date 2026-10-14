import assert from 'node:assert/strict'
import test from 'node:test'
import { getDayKey, isDayKey } from './day-key'

test('上海自然日在 UTC 16 点换日，包括跨年', (): void => {
    assert.equal(getDayKey(1791907199999), '2026-10-13')
    assert.equal(getDayKey(1791907200000), '2026-10-14')
    assert.equal(getDayKey(1735660800000), '2025-01-01')
})
test('日期键拒绝不存在的日期及非法存储值', (): void => {
    assert.equal(isDayKey('2024-02-29'), true)
    for (const value of ['2023-02-29', '2026-13-01', '2026-10-32', '2026-1-1', 12, null])
        assert.equal(isDayKey(value), false)
})
