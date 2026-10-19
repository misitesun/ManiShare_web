export type WordToolbarMode = 'pronounce' | 'spell' | 'dictate' | 'meaning' | 'typing' | 'oral'

export interface WordToolbarOptions {
    cutReading: boolean
    translationVisible: boolean
    imageVisible: boolean
    phoneticsVisible: boolean
    copy: boolean
    order: 'sequential' | 'random' | 'alphabetical'
    language: 'translate' | 'interpret' | 'bilingual'
    phonetics: 'original' | 'syllables' | 'phonics' | 'none'
}

export type WordToolbarRow =
    'copy' | 'cutReading' | 'translationVisible' | 'imageVisible' | 'phoneticsVisible'

export const wordToolbarRows: Readonly<Record<WordToolbarMode, readonly WordToolbarRow[]>> = {
    pronounce: ['cutReading'],
    spell: ['copy', 'translationVisible', 'cutReading'],
    dictate: ['copy', 'cutReading', 'translationVisible', 'imageVisible', 'phoneticsVisible'],
    meaning: ['cutReading', 'imageVisible', 'phoneticsVisible'],
    typing: ['imageVisible', 'copy', 'cutReading'],
    oral: ['imageVisible', 'translationVisible', 'cutReading'],
}

export function isWordToolbarMode(value: string): value is WordToolbarMode {
    return (
        value === 'pronounce' ||
        value === 'spell' ||
        value === 'dictate' ||
        value === 'meaning' ||
        value === 'typing' ||
        value === 'oral'
    )
}

/** 截图初值仅用于本轮局部演示，不读取或写回全局学习偏好。 */
export function createWordToolbarOptions(mode: WordToolbarMode): WordToolbarOptions {
    const options: WordToolbarOptions = {
        cutReading: true,
        translationVisible: true,
        imageVisible: true,
        phoneticsVisible: true,
        copy: false,
        order: 'sequential',
        language: 'bilingual',
        phonetics: 'original',
    }
    if (mode === 'pronounce') return { ...options, order: 'random' }
    if (mode === 'spell') return { ...options, phonetics: 'syllables' }
    if (mode === 'dictate')
        return { ...options, copy: true, cutReading: false, phoneticsVisible: false }
    if (mode === 'typing') return { ...options, copy: true }
    return options
}

export interface WordToolbarReference {
    readonly left: number
    readonly top: number
    readonly timerWidth: number
    readonly timerHeight: number
    readonly settingsSize: number
    readonly gap: number
    readonly popoverWidth: number
    readonly rowHeight: number
}

/** 1920×1080 CSS 视口、100% 缩放下，相对练习画板左上角的原稿几何。 */
export function getWordToolbarReference(mode: WordToolbarMode): WordToolbarReference {
    return {
        left: mode === 'pronounce' ? 12 : 16,
        top: mode === 'pronounce' ? 96 : 95,
        timerWidth: 84,
        timerHeight: 26,
        settingsSize: 26,
        gap: 12,
        popoverWidth: 64,
        rowHeight: 24,
    }
}
