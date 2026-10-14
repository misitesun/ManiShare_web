import { sharedConfig } from '../../config'

export function getCurrentDayKey(): string {
    return getDayKey(Date.now())
}

export function getDayKey(timestamp: number): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: sharedConfig.time.defaultTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(timestamp)
    return ['year', 'month', 'day']
        .map((type) => parts.find((part) => part.type === type)?.value ?? '')
        .join('-')
}

export function isDayKey(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(value + 'T00:00:00Z')
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
