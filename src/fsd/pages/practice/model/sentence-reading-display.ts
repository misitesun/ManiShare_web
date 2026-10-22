export interface SentenceReadingDisplayOptions {
    readonly english: boolean
    readonly translation: boolean
    readonly phonetics: boolean
    readonly partOfSpeech: boolean
    readonly syntax: boolean
}

export type SentenceReadingDisplayKey = keyof SentenceReadingDisplayOptions

interface SentenceReadingDisplayItem {
    readonly key: SentenceReadingDisplayKey
    readonly label: string
}

export const sentenceReadingDisplayItems: readonly SentenceReadingDisplayItem[] = [
    { key: 'english', label: '英文原文' },
    { key: 'translation', label: '翻译' },
    { key: 'phonetics', label: '音标' },
    { key: 'partOfSpeech', label: '词性' },
    { key: 'syntax', label: '句子成分' },
]

/** 阅读显示项只在当前页面内组合，不改写全局学习偏好。 */
export function createSentenceReadingDisplayOptions(): SentenceReadingDisplayOptions {
    return { english: true, translation: true, phonetics: true, partOfSpeech: true, syntax: true }
}
