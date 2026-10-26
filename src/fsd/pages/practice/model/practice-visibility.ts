import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import type { WordMeaningVariant } from './word-meaning'

/** 仅真实文本作答模式；词块、纯展示和笔记编辑不属于此输入契约。 */
export function hasPracticeAnswerInput(
    mode: PracticeMode,
    wordMeaningVariant?: WordMeaningVariant,
): boolean {
    if (mode === 'meaning' && wordMeaningVariant === 'context') return false
    return ['spell', 'dictate', 'translate', 'meaning', 'typing'].includes(mode)
}

/** 答错仍是可编辑阶段；演示状态不推导正式判题结果。 */
export function isPracticeAnswerVisible(phase: PracticePhase): boolean {
    return phase === 'revealed' || phase === 'correct'
}

/** 快捷口语的按钮、命令和V按键共用门控，单词拼读不提供此能力。 */
export function canShowQuickOral(
    family: PracticeFamily,
    mode: PracticeMode,
    phase: PracticePhase,
    hasTarget: boolean,
    enabled: boolean,
    wordMeaningVariant?: WordMeaningVariant,
): boolean {
    if (
        !enabled ||
        !hasTarget ||
        mode === 'oral' ||
        family === 'typing' ||
        family.endsWith('-reader')
    )
        return false
    if (family === 'word' && mode === 'pronounce') return false
    if (family === 'guess') return false
    if (family === 'word' && mode === 'meaning')
        return wordMeaningVariant === 'context' || phase === 'correct'
    if (mode === 'spell' || mode === 'dictate' || mode === 'typing') return phase === 'correct'
    if (mode === 'pronounce' || mode === 'listen' || mode === 'read') return true
    return isPracticeAnswerVisible(phase)
}
