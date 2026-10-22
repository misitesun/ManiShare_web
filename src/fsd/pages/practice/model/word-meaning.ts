import type { PracticePhase } from './practice-demo'

export type WordMeaningVariant = 'fill' | 'context'

/** 页面本地样例的显式语境片段，不推断后台字段或自动分词。 */
export interface WordMeaningContent {
    readonly before: string
    readonly after: string
    readonly translationBefore: string
    readonly translationTarget: string
    readonly translationAfter: string
    readonly illustration: 'park-woman'
    readonly imageAlt: string
    /** 本地语境整句朗读，与题目目标单词的readingSource分离。 */
    readonly readingSource?: string
}

export interface WordMeaningState {
    readonly variant: WordMeaningVariant
    readonly translationVisible: boolean
}

export type WordMeaningAction =
    | { readonly type: 'variant'; readonly value: WordMeaningVariant }
    | { readonly type: 'question' }
    | { readonly type: 'reveal-translation' }

export const initialWordMeaningState: WordMeaningState = {
    variant: 'fill',
    translationVisible: false,
}

export function reduceWordMeaningState(
    state: WordMeaningState,
    action: WordMeaningAction,
): WordMeaningState {
    if (action.type === 'variant')
        return action.value === state.variant
            ? state
            : { variant: action.value, translationVisible: false }
    if (action.type === 'question')
        return state.translationVisible ? { ...state, translationVisible: false } : state
    return state.variant === 'context' && !state.translationVisible
        ? { ...state, translationVisible: true }
        : state
}

/** 两种玩法的主操作同源；揭示中文不构造一次正确提交。 */
export function resolveWordMeaningAction(
    state: WordMeaningState,
    phase: PracticePhase,
): 'answer' | 'reveal-translation' | 'next' {
    if (state.variant === 'context') return state.translationVisible ? 'next' : 'reveal-translation'
    return phase === 'correct' || phase === 'revealed' ? 'next' : 'answer'
}

export function getWordMeaningSentence(target: string, content: WordMeaningContent): string {
    return `${content.before}${target}${content.after}`
}

export function getWordMeaningTranslation(content: WordMeaningContent): string {
    return `${content.translationBefore}${content.translationTarget}${content.translationAfter}`
}
