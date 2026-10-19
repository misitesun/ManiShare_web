import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'

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
): boolean {
    if (!enabled || !hasTarget || mode === 'oral' || family.endsWith('-reader')) return false
    if (family === 'word' && mode === 'pronounce') return false
    if (mode === 'spell' || mode === 'dictate' || mode === 'typing') return phase === 'correct'
    if (mode === 'pronounce' || mode === 'listen' || mode === 'read') return true
    return isPracticeAnswerVisible(phase)
}
