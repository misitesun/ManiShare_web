export interface PracticePlaybackListEntry {
    readonly id: string
    readonly marker: string
    readonly english: string
    readonly translation: string
}

export interface PracticePlaybackListContent {
    readonly title: string
    readonly label: string
    readonly closeLabel: string
    readonly entries: readonly PracticePlaybackListEntry[]
}
