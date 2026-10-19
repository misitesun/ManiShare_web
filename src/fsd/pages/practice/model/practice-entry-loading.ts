export const practiceEntryLoadingDurationMs = 2000

export interface PracticeEntryLoadingState {
    readonly entryKey: string | null
    readonly ready: boolean
}

export function reconcilePracticeEntryLoading(
    current: PracticeEntryLoadingState,
    entryKey: string | null,
): PracticeEntryLoadingState {
    return current.entryKey === entryKey ? current : { entryKey, ready: false }
}

export function completePracticeEntryLoading(
    current: PracticeEntryLoadingState,
    entryKey: string | null,
): PracticeEntryLoadingState {
    return entryKey !== null && current.entryKey === entryKey && !current.ready
        ? { entryKey, ready: true }
        : current
}

export function getPracticeEntryLoadingProgress(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs)) return 0
    return Math.floor(Math.min(1, Math.max(0, elapsedMs / practiceEntryLoadingDurationMs)) * 100)
}
