import { isDayKey } from '../../../shared/lib/time'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'

export interface CheckinRecord {
    readonly version: 1
    readonly totalDays: number
    readonly lastDay: string | null
}

export const initialCheckinRecord: CheckinRecord = { version: 1, totalDays: 3, lastDay: null }

export function parseCheckinRecord(value: unknown): CheckinRecord {
    if (typeof value !== 'object' || value === null) return initialCheckinRecord
    const candidate = value as Record<string, unknown>
    if (
        candidate.version !== 1 ||
        typeof candidate.totalDays !== 'number' ||
        !Number.isSafeInteger(candidate.totalDays) ||
        candidate.totalDays < 3 ||
        (candidate.lastDay !== null && !isDayKey(candidate.lastDay))
    )
        return initialCheckinRecord
    return { version: 1, totalDays: candidate.totalDays, lastDay: candidate.lastDay }
}

export function completeCheckin(record: CheckinRecord, day: string): CheckinRecord {
    if (!isDayKey(day) || record.lastDay === day || record.totalDays === Number.MAX_SAFE_INTEGER)
        return record
    return { version: 1, totalDays: record.totalDays + 1, lastDay: day }
}

export function loadCheckinRecord(): CheckinRecord {
    try {
        return parseCheckinRecord(storage.get(sharedConfig.storageKeys.dailyCheckin))
    } catch {
        return initialCheckinRecord
    }
}

export function saveCheckinRecord(record: CheckinRecord): boolean {
    try {
        storage.set(sharedConfig.storageKeys.dailyCheckin, record)
        return true
    } catch {
        return false
    }
}
