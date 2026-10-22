import type {
    PracticeSelectionMode,
    SelectablePracticeFamily,
} from '../../../features/practice-mode-selection'

/** 当前页面的本地展示分类，不作为后台章节枚举。 */
export type AwakeningChapterKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'picture-word'

export interface AwakeningChapter {
    readonly id: string
    readonly number: number
    readonly kind: AwakeningChapterKind
    readonly locked: boolean
}

const chapterPreviewKinds: readonly AwakeningChapterKind[] = [
    0,
    1,
    2,
    0,
    3,
    4,
    5,
    7,
    6,
    8,
    9,
    10,
    'picture-word',
]

export const awakeningChapters: readonly AwakeningChapter[] = chapterPreviewKinds.map(
    (kind, index) => ({
        id: `chapter-${index + 1}`,
        number: index + 1,
        kind,
        locked: index >= 2,
    }),
)

export interface AwakeningPracticeEntry {
    readonly demoId: string
    readonly defaultMode: PracticeSelectionMode
    readonly label: string
    readonly selectorFamily: SelectablePracticeFamily | null
}

export interface AwakeningPracticeChapter extends AwakeningPracticeEntry {
    readonly chapterId: string
    readonly number: number
}

const practiceEntries: Record<AwakeningChapterKind, AwakeningPracticeEntry> = {
    0: {
        demoId: 'sentence-basic',
        defaultMode: 'listen',
        label: '句子游戏',
        selectorFamily: 'sentence',
    },
    1: {
        demoId: 'word-basic',
        defaultMode: 'pronounce',
        label: '单词游戏',
        selectorFamily: 'word',
    },
    2: {
        demoId: 'audio-basic',
        defaultMode: 'listen',
        label: '音频游戏',
        selectorFamily: 'audio',
    },
    3: {
        demoId: 'video-basic',
        defaultMode: 'listen',
        label: '视频游戏',
        selectorFamily: 'video',
    },
    4: {
        demoId: 'typing-basic',
        defaultMode: 'typing',
        label: '指法游戏',
        selectorFamily: null,
    },
    5: {
        demoId: 'phonetics-basic',
        defaultMode: 'pronounce',
        label: '音标游戏',
        selectorFamily: null,
    },
    6: {
        demoId: 'guess-basic',
        defaultMode: 'guess',
        label: '猜词游戏',
        selectorFamily: 'guess',
    },
    7: {
        demoId: 'picture-reader',
        defaultMode: 'read',
        label: '纯图片',
        selectorFamily: null,
    },
    8: {
        demoId: 'video-reader',
        defaultMode: 'read',
        label: '纯视频',
        selectorFamily: null,
    },
    9: {
        demoId: 'audio-reader',
        defaultMode: 'read',
        label: '纯音频',
        selectorFamily: null,
    },
    10: {
        demoId: 'text-reader',
        defaultMode: 'read',
        label: '纯文章',
        selectorFamily: null,
    },
    'picture-word': {
        demoId: 'picture-basic',
        defaultMode: 'listen',
        label: '看图学词',
        selectorFamily: 'picture',
    },
}

/** 本地示例允许体验全部类型；locked 只决定 VIP 角标，不作为真实权限。 */
export function getAwakeningPracticeEntry(chapter: AwakeningChapter): AwakeningPracticeEntry {
    return practiceEntries[chapter.kind]
}

/** 校验本地预览章节来源，不代表正式题库或权限。 */
export function isAwakeningPracticeSource(
    courseId: string,
    chapterId: string,
    demoId: string,
): boolean {
    return (
        hasAwakeningCourseDetail(courseId) &&
        awakeningChapters.some(
            (chapter) =>
                chapter.id === chapterId && getAwakeningPracticeEntry(chapter).demoId === demoId,
        )
    )
}

/** 只沿已校验的本地预览课程顺序前进，不猜测正式章节、题库或权限。 */
export function getNextAwakeningPracticeChapter(
    courseId: string,
    chapterId: string,
    demoId: string,
): AwakeningPracticeChapter | null {
    if (!isAwakeningPracticeSource(courseId, chapterId, demoId)) return null
    const index = awakeningChapters.findIndex((chapter) => chapter.id === chapterId)
    const chapter = awakeningChapters[index + 1]
    return chapter
        ? { ...getAwakeningPracticeEntry(chapter), chapterId: chapter.id, number: chapter.number }
        : null
}

export function hasAwakeningCourseDetail(id: string | undefined): boolean {
    return supportedCourseIds.some((courseId) => courseId === id)
}

export const supportedCourseIds = ['phonetics', 'phonetics-continuation'] as const
export function getAwakeningCourseParams(): { courseId: string }[] {
    return supportedCourseIds.map((courseId) => ({ courseId }))
}
