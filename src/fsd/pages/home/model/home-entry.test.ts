import assert from 'node:assert/strict'
import test from 'node:test'
import { initialCheckinRecord, completeCheckin } from '../../../features/daily-checkin'
import {
    getHomeEntryStep,
    initialClubPreference,
    closeHomeEntryStep,
    parseClubPreference,
} from './home-entry'

test('定位确认后才进入每日签到，签到后展示俱乐部，同日已展示不重复', (): void => {
    const today = '2026-10-14'
    assert.equal(
        getHomeEntryStep(false, initialCheckinRecord, initialClubPreference, today),
        'location',
    )
    assert.equal(
        getHomeEntryStep(true, initialCheckinRecord, initialClubPreference, today),
        'checkin',
    )
    const checked = completeCheckin(initialCheckinRecord, today)
    assert.equal(getHomeEntryStep(true, checked, initialClubPreference, today), 'club')
    assert.equal(
        getHomeEntryStep(true, checked, { ...initialClubPreference, lastShownDay: today }, today),
        'idle',
    )
    assert.equal(getHomeEntryStep(true, checked, initialClubPreference, '2026-10-15'), 'checkin')
})
test('永久关闭只停止俱乐部，签到不可被关闭绕过，俱乐部关闭进入确认', (): void => {
    const preference = { ...initialClubPreference, permanentlyClosed: true }
    assert.equal(getHomeEntryStep(true, initialCheckinRecord, preference, '2026-10-14'), 'checkin')
    assert.equal(
        getHomeEntryStep(
            true,
            completeCheckin(initialCheckinRecord, '2026-10-14'),
            preference,
            '2026-10-14',
        ),
        'idle',
    )
    assert.equal(closeHomeEntryStep('checkin'), 'checkin')
    assert.equal(closeHomeEntryStep('club'), 'club-dismiss')
    assert.equal(closeHomeEntryStep('club-dismiss'), 'idle')
    for (const value of [
        null,
        {},
        { version: 1, permanentlyClosed: 'true', lastShownDay: null },
        { version: 1, permanentlyClosed: true, lastShownDay: '2026-02-30' },
    ])
        assert.equal(parseClubPreference(value), initialClubPreference)
    assert.deepEqual(parseClubPreference(preference), preference)
})
