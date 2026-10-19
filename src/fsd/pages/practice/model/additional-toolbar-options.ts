import type { PracticeFamily, PracticeMode } from './practice-demo'

export type AdditionalToolbarFamily = Exclude<PracticeFamily, 'word' | 'sentence' | 'audio'>

export interface AdditionalToolbarOptions {
    copy: boolean
    imageVisible: boolean
    translationVisible: boolean
    cutReading: boolean
    keyboardVisible: boolean
    naturalPhonics: boolean
    sentenceAnalysisVisible: boolean
}

export type AdditionalToolbarRow =
    | 'copy'
    | 'imageVisible'
    | 'translationVisible'
    | 'cutReading'
    | 'keyboardVisible'
    | 'sentenceAnalysisVisible'

export function isAdditionalToolbarFamily(value: PracticeFamily): value is AdditionalToolbarFamily {
    return value !== 'word' && value !== 'sentence' && value !== 'audio'
}

export function getAdditionalToolbarRows(
    family: AdditionalToolbarFamily,
    mode: PracticeMode,
    answerVisible = false,
): readonly AdditionalToolbarRow[] {
    if (family === 'video') {
        if (mode === 'translate') return ['copy', 'translationVisible', 'cutReading']
        if (mode === 'typing') return ['copy', 'cutReading']
        if (mode === 'check' || mode === 'oral') return ['translationVisible', 'cutReading']
        if (mode === 'blocks')
            return answerVisible
                ? ['sentenceAnalysisVisible', 'translationVisible', 'cutReading']
                : ['translationVisible', 'cutReading']
        return []
    }
    if (family === 'guess') {
        if (mode === 'guess') return ['imageVisible', 'cutReading']
        if (mode === 'spell') return ['copy', 'imageVisible', 'keyboardVisible', 'cutReading']
        return []
    }
    if (family === 'picture') {
        if (mode === 'translate') return ['copy', 'translationVisible', 'cutReading']
        if (mode === 'typing') return ['copy', 'cutReading']
        if (mode === 'oral') return ['translationVisible', 'cutReading']
    }
    return []
}

/** 只提供已确认选项初值；没有控件的显示字段保持原题面可见默认值。 */
export function createAdditionalToolbarOptions(
    family: AdditionalToolbarFamily,
    mode: PracticeMode,
): AdditionalToolbarOptions {
    return {
        copy: getAdditionalToolbarRows(family, mode).includes('copy'),
        imageVisible: true,
        translationVisible: true,
        cutReading: true,
        keyboardVisible: true,
        naturalPhonics: true,
        sentenceAnalysisVisible: true,
    }
}

export function getAdditionalToolbarTranslationOverride(
    family: AdditionalToolbarFamily,
    mode: PracticeMode,
    options: AdditionalToolbarOptions,
): boolean | undefined {
    return getAdditionalToolbarRows(family, mode).includes('translationVisible')
        ? options.translationVisible
        : undefined
}
