export interface AwakeningChapter {
    readonly id: string
    readonly number: number
    readonly kind: number
    readonly locked: boolean
}

export const awakeningChapters: readonly AwakeningChapter[] = [
    0, 1, 2, 0, 3, 4, 5, 7, 6, 8, 9, 10,
].map((kind, index) => ({
    id: `chapter-${index + 1}`,
    number: index + 1,
    kind,
    locked: index >= 2,
}))

export function hasAwakeningCourseDetail(id: string | undefined): boolean {
    return id === 'phonetics' || id === 'phonetics-continuation'
}
