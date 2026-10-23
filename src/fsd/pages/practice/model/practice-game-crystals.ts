import { initialPracticeSession, reducePracticeSession } from './practice-demo'
import type {
    PracticeFamily,
    PracticeMode,
    PracticeQuestion,
    PracticeSession,
    PracticeSessionAction,
} from './practice-demo'

export interface PracticeCrystalSession extends PracticeSession {
    readonly rewardedQuestionIds: readonly string[]
}

export interface PracticeCrystalContext {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly questions: readonly PracticeQuestion[]
}

export const initialPracticeCrystalSession: PracticeCrystalSession = {
    ...initialPracticeSession,
    rewardedQuestionIds: [],
}

export function supportsPracticeGameCrystals(family: PracticeFamily, mode: PracticeMode): boolean {
    return (
        (family === 'typing' && mode === 'typing') ||
        (family === 'video' && (mode === 'translate' || mode === 'blocks' || mode === 'typing'))
    )
}

/** 仅为本轮演示计分，分值由已答对题目派生，不写账户或持久化状态。 */
export function getPracticeGameCrystals(session: PracticeCrystalSession): number {
    return session.rewardedQuestionIds.length * 10
}

/** 委托原判题后记录首次答对；切题保留，整轮重置清空，不从渲染或反馈音效推断奖励。 */
export function reducePracticeCrystalSession(
    state: PracticeCrystalSession,
    action: PracticeSessionAction,
    context: PracticeCrystalContext,
): PracticeCrystalSession {
    if (action.type === 'reset') return initialPracticeCrystalSession
    const next = reducePracticeSession(state, action)
    if (next === state) return state
    const isSubmission =
        (context.mode === 'translate' && action.type === 'submit-sentence-answer') ||
        (context.mode === 'typing' && action.type === 'submit-sentence-typing') ||
        (context.mode === 'blocks' &&
            (action.type === 'edit-sentence-blocks' || action.type === 'submit-sentence-blocks'))
    const question = context.questions[state.index]
    const earnsCrystals =
        supportsPracticeGameCrystals(context.family, context.mode) &&
        isSubmission &&
        !state.finished &&
        state.phase !== 'correct' &&
        state.phase !== 'revealed' &&
        next.phase === 'correct' &&
        question !== undefined &&
        !state.rewardedQuestionIds.includes(question.id)
    return {
        ...next,
        rewardedQuestionIds:
            earnsCrystals && question
                ? [...state.rewardedQuestionIds, question.id]
                : state.rewardedQuestionIds,
    }
}
