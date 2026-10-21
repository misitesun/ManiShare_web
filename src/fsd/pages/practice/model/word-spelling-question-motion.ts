import type { PracticePhase, PracticeQuestion } from './practice-demo'

export type WordSpellingQuestionDirection = 'next' | 'previous'

export interface WordSpellingQuestionPose {
    readonly rotation: number
    readonly incomingRotation: number
}

/** 仅保留离场题的展示与身份，不保留控制器、音源或业务回调。 */
export interface WordSpellingQuestionTransition {
    readonly direction: WordSpellingQuestionDirection
    readonly previous: {
        readonly key: string
        readonly question: PracticeQuestion
        readonly phase: PracticePhase
        readonly input: string
    }
}

/** 实际题号变化决定方向；同题、首次进入和无效题号不触发切题翻转。 */
export function getWordSpellingQuestionDirection(
    previousIndex: number,
    nextIndex: number,
): WordSpellingQuestionDirection | null {
    if (
        !Number.isInteger(previousIndex) ||
        !Number.isInteger(nextIndex) ||
        previousIndex < 0 ||
        nextIndex < 0 ||
        previousIndex === nextIndex
    )
        return null
    return nextIndex > previousIndex ? 'next' : 'previous'
}

/** 下一题向右完整翻面，上一题镜像；背面抵消转角后正向显示新题。 */
export function getWordSpellingQuestionPose(
    direction: WordSpellingQuestionDirection,
): WordSpellingQuestionPose {
    return direction === 'next'
        ? { rotation: 180, incomingRotation: -180 }
        : { rotation: -180, incomingRotation: 180 }
}
