import type { CheckinRecord } from '../../../features/daily-checkin'
import { isDayKey } from '../../../shared/lib/time'

export type HomeEntryStep = 'idle' | 'location' | 'checkin' | 'club' | 'club-dismiss'
export interface ClubPromptPreference {
    readonly version: 1
    readonly permanentlyClosed: boolean
    readonly lastShownDay: string | null
}
export const initialClubPreference: ClubPromptPreference = {
    version: 1,
    permanentlyClosed: false,
    lastShownDay: null,
}

export function parseClubPreference(value: unknown): ClubPromptPreference {
    if (typeof value !== 'object' || value === null) return initialClubPreference
    const candidate = value as Record<string, unknown>
    if (
        candidate.version !== 1 ||
        typeof candidate.permanentlyClosed !== 'boolean' ||
        (candidate.lastShownDay !== null && !isDayKey(candidate.lastShownDay))
    )
        return initialClubPreference
    return {
        version: 1,
        permanentlyClosed: candidate.permanentlyClosed,
        lastShownDay: candidate.lastShownDay,
    }
}

export function getHomeEntryStep(
    locationConfirmed: boolean,
    checkin: CheckinRecord,
    club: ClubPromptPreference,
    today: string,
): HomeEntryStep {
    if (!locationConfirmed) return 'location'
    if (checkin.lastDay !== today) return 'checkin'
    return club.permanentlyClosed || club.lastShownDay === today ? 'idle' : 'club'
}

export function closeHomeEntryStep(step: HomeEntryStep): HomeEntryStep {
    return step === 'checkin' ? 'checkin' : step === 'club' ? 'club-dismiss' : 'idle'
}
