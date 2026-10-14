export type HomeStatsRange = 'total' | 'today' | 'yesterday' | 'week' | 'month'
export interface HomeStatsValues {
    readonly sentences: number
    readonly words: number
    readonly hours: number
    readonly sentenceErrors: number
    readonly wordErrors: number
    readonly checkinDays: number
}
export const homeStatsRanges = [
    { id: 'total', label: '总计' },
    { id: 'today', label: '今天' },
    { id: 'yesterday', label: '昨天' },
    { id: 'week', label: '本周' },
    { id: 'month', label: '本月' },
] as const
export const homeStatsSamples: Readonly<Record<HomeStatsRange, HomeStatsValues>> = {
    total: {
        sentences: 400,
        words: 390,
        hours: 8.5,
        sentenceErrors: 400,
        wordErrors: 390,
        checkinDays: 12,
    },
    today: {
        sentences: 24,
        words: 32,
        hours: 0.8,
        sentenceErrors: 6,
        wordErrors: 9,
        checkinDays: 1,
    },
    yesterday: {
        sentences: 36,
        words: 45,
        hours: 1.2,
        sentenceErrors: 8,
        wordErrors: 12,
        checkinDays: 1,
    },
    week: {
        sentences: 168,
        words: 182,
        hours: 4.6,
        sentenceErrors: 38,
        wordErrors: 49,
        checkinDays: 5,
    },
    month: {
        sentences: 320,
        words: 350,
        hours: 7.4,
        sentenceErrors: 72,
        wordErrors: 96,
        checkinDays: 10,
    },
}
export function isHomeStatsRange(value: string): value is HomeStatsRange {
    return homeStatsRanges.some(({ id }) => id === value)
}
export interface HomeGardenMonth {
    readonly year: number
    readonly month: number
}
export const initialGardenMonth: HomeGardenMonth = { year: 2026, month: 8 }
export function calendarMonthDays({ year, month }: HomeGardenMonth): number {
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12)
        return 0
    if (month === 2) return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 29 : 28
    return [4, 6, 9, 11].includes(month) ? 30 : 31
}
export function moveGardenMonth(current: HomeGardenMonth, direction: -1 | 1): HomeGardenMonth {
    if (calendarMonthDays(current) === 0) return current
    const ordinal = current.year * 12 + current.month - 1 + direction
    if (ordinal < 12) return current
    return { year: Math.floor(ordinal / 12), month: (ordinal % 12) + 1 }
}
export function selectHomeSlide(current: number, action: 'previous' | 'next' | number): number {
    if (action === 'previous') return (current + 4) % 5
    if (action === 'next') return (current + 1) % 5
    return Number.isInteger(action) && action >= 0 && action < 5 ? action : current
}
