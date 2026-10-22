export type ImmersiveListeningFamily = 'sentence' | 'audio'

export interface SentenceListeningPlaybackOptions {
    readonly blind: boolean
    readonly autoAdvance: boolean
    readonly chapterLoop: boolean
    readonly autoNextChapter: boolean
}

export type SentenceListeningPlaybackToggle = keyof SentenceListeningPlaybackOptions

export function createSentenceListeningPlaybackOptions(): SentenceListeningPlaybackOptions {
    return { blind: false, autoAdvance: false, chapterLoop: false, autoNextChapter: false }
}

/** 章节末尾只能选择一种自动去向；这些开关不参与手动下一题的完成流程。 */
export function toggleSentenceListeningPlayback(
    options: SentenceListeningPlaybackOptions,
    key: SentenceListeningPlaybackToggle,
): SentenceListeningPlaybackOptions {
    const enabled = !options[key]
    return {
        ...options,
        [key]: enabled,
        ...(key === 'chapterLoop' && enabled ? { autoNextChapter: false } : {}),
        ...(key === 'autoNextChapter' && enabled ? { chapterLoop: false } : {}),
    }
}

export type SentenceListeningNavigationOrigin = 'manual' | 'automatic'

interface SentenceListeningNavigationResult {
    readonly options: SentenceListeningPlaybackOptions
    /** 仅撤销自动切题意图；新题朗读继续由切读偏好决定。 */
    readonly interruptAutoAdvance: boolean
}

/** 手动接管时同步退出自动切题；切读独立，真实 ended 的自动推进保持原状态。 */
export function resolveSentenceListeningNavigation(
    options: SentenceListeningPlaybackOptions,
    origin: SentenceListeningNavigationOrigin,
): SentenceListeningNavigationResult {
    const interruptAutoAdvance = origin === 'manual' && options.autoAdvance
    return {
        options: interruptAutoAdvance ? { ...options, autoAdvance: false } : options,
        interruptAutoAdvance,
    }
}

export type SentenceListeningEndAction = 'none' | 'next' | 'repeat' | 'next-chapter' | 'finish'

interface SentenceListeningEndInput {
    readonly options: SentenceListeningPlaybackOptions
    readonly index: number
    readonly total: number
    readonly nextChapterAvailable: boolean
}

/** 真实 ended 后的有效访问判定去向；页面宿主负责等待，不估算音频结束时间。 */
export function resolveSentenceListeningEnd({
    options,
    index,
    total,
    nextChapterAvailable,
}: SentenceListeningEndInput): SentenceListeningEndAction {
    if (!options.autoAdvance || total <= 0 || index < 0 || index >= total) return 'none'
    if (index < total - 1) return 'next'
    if (options.chapterLoop) return 'repeat'
    if (options.autoNextChapter && nextChapterAvailable) return 'next-chapter'
    return 'finish'
}
