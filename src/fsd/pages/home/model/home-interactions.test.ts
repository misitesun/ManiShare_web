import assert from 'node:assert/strict'
import test from 'node:test'
import {
    calendarMonthDays,
    homeStatsRanges,
    homeStatsSamples,
    initialGardenMonth,
    isHomeStatsRange,
    moveGardenMonth,
    selectHomeSlide,
} from './home-interactions'
test('五个统计范围分别提供六项模拟值，拒绝无效键，总计保持稿中示例', (): void => {
    assert.deepEqual(homeStatsSamples.total, {
        sentences: 400,
        words: 390,
        hours: 8.5,
        sentenceErrors: 400,
        wordErrors: 390,
        checkinDays: 12,
    })
    for (const { id } of homeStatsRanges) {
        assert.equal(isHomeStatsRange(id), true)
        assert.equal(Object.keys(homeStatsSamples[id]).length, 6)
    }
    assert.equal(isHomeStatsRange('unknown'), false)
    assert.notDeepEqual(homeStatsSamples.today, homeStatsSamples.yesterday)
})
test('月份支持大小月、闰年和跨年，往返不修改初始月份', (): void => {
    assert.equal(calendarMonthDays(initialGardenMonth), 31)
    for (const month of [4, 6, 9, 11]) assert.equal(calendarMonthDays({ year: 2026, month }), 30)
    for (const [year, days] of [
        [2024, 29],
        [2026, 28],
        [1900, 28],
        [2000, 29],
    ] as const)
        assert.equal(calendarMonthDays({ year, month: 2 }), days)
    assert.deepEqual(moveGardenMonth({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 })
    assert.deepEqual(moveGardenMonth({ year: 2026, month: 1 }, -1), { year: 2025, month: 12 })
    assert.deepEqual(
        moveGardenMonth(moveGardenMonth(initialGardenMonth, 1), -1),
        initialGardenMonth,
    )
    assert.equal(calendarMonthDays({ year: 2026, month: 13 }), 0)
    assert.deepEqual(moveGardenMonth({ year: 1, month: 1 }, -1), { year: 1, month: 1 })
})
test('五张占位轮播左右循环，直接选位一致，拒绝非法位置', (): void => {
    assert.equal(selectHomeSlide(0, 'previous'), 4)
    assert.equal(selectHomeSlide(4, 'next'), 0)
    for (let i = 0; i < 5; i++) assert.equal(selectHomeSlide(2, i), i)
    for (const value of [-1, 5, 1.5, Number.NaN]) assert.equal(selectHomeSlide(2, value), 2)
})
