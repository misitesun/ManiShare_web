import assert from 'node:assert/strict'
import test from 'node:test'
import {
    completeCheckin,
    initialCheckinRecord,
    parseCheckinRecord,
    loadCheckinRecord,
    saveCheckinRecord,
} from './checkin'

test('同一天签到一次，次日累加一次，累计超过目标仍保留真实示例次数', (): void => {
    const first = completeCheckin(initialCheckinRecord, '2026-10-14')
    assert.deepEqual(first, { version: 1, totalDays: 4, lastDay: '2026-10-14' })
    assert.equal(completeCheckin(first, '2026-10-14'), first)
    assert.equal(completeCheckin(first, 'bad'), first)
    assert.equal(completeCheckin(first, '2026-10-15').totalDays, 5)
    assert.equal(completeCheckin({ ...first, totalDays: 1000 }, '2026-10-15').totalDays, 1001)
})

test('本地签到保存后可恢复，存储读写异常不会虚称保存成功', (): void => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const data = new Map<string, string>()
    let failed = false
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            localStorage: {
                getItem(key: string): string | null {
                    if (failed) throw new Error('blocked')
                    return data.get(key) ?? null
                },
                setItem(key: string, value: string): void {
                    if (failed) throw new Error('blocked')
                    data.set(key, value)
                },
            },
        },
    })
    try {
        const checked = completeCheckin(initialCheckinRecord, '2026-10-14')
        assert.equal(saveCheckinRecord(checked), true)
        assert.deepEqual(loadCheckinRecord(), checked)
        failed = true
        assert.equal(saveCheckinRecord(checked), false)
        assert.equal(loadCheckinRecord(), initialCheckinRecord)
    } finally {
        if (original) Object.defineProperty(globalThis, 'window', original)
        else Reflect.deleteProperty(globalThis, 'window')
    }
})
test('本地记录校验版本、日期、累计整数，非法值恢复初始示例', (): void => {
    for (const value of [
        null,
        'bad',
        {},
        { version: 2, totalDays: 3, lastDay: null },
        { version: 1, totalDays: 2, lastDay: null },
        { version: 1, totalDays: 3.5, lastDay: null },
        { version: 1, totalDays: 4, lastDay: '2026-02-30' },
    ])
        assert.equal(parseCheckinRecord(value), initialCheckinRecord)
    assert.deepEqual(parseCheckinRecord({ version: 1, totalDays: 4, lastDay: '2026-10-14' }), {
        version: 1,
        totalDays: 4,
        lastDay: '2026-10-14',
    })
})
