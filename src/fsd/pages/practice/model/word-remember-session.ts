import type { PracticeSession } from './practice-demo'

export interface WordRememberSession {
    readonly remainingIds: readonly string[]
    readonly rememberedIds: readonly string[]
    readonly index: number
}

export interface WordRememberProgress {
    readonly total: number
    readonly remaining: number
    readonly remembered: number
    /** 0–100 的百分比；导航或普通切题不改变此值。 */
    readonly percent: number
    /** 仅表示全部单词已记住，不作为章节完成的唯一条件。 */
    readonly complete: boolean
}

/** 拼读题号来自待练队列；章节是否结束保留会话状态，不由记住比例覆盖。 */
export function getWordPronunciationSession(
    session: PracticeSession,
    words: WordRememberSession,
): PracticeSession {
    return { ...session, index: words.index }
}

/** 同一题目 ID 只占一题，保留课程提供的首次出现顺序。 */
export function createWordRememberSession(ids: readonly string[]): WordRememberSession {
    return { remainingIds: [...new Set(ids)], rememberedIds: [], index: 0 }
}

/** 按完整题库的排序重排剩余词，从首张继续，已记住的词不会重新加入。 */
export function reorderWordRememberSession(
    state: WordRememberSession,
    orderedIds: readonly string[],
): WordRememberSession {
    const ranks = new Map<string, number>(orderedIds.map((id, index) => [id, index]))
    const remainingIds = [...state.remainingIds].sort(
        (left, right) =>
            (ranks.get(left) ?? orderedIds.length) - (ranks.get(right) ?? orderedIds.length),
    )
    if (state.index === 0 && remainingIds.every((id, index) => id === state.remainingIds[index]))
        return state
    return { ...state, remainingIds, index: 0 }
}

/** 仅导航剩余题目，越界停在首尾，不循环、不增加记住进度。 */
export function moveWordRememberSession(
    state: WordRememberSession,
    targetIndex: number,
): WordRememberSession {
    if (state.remainingIds.length === 0 || Number.isNaN(targetIndex)) return state
    const index = Math.max(0, Math.min(state.remainingIds.length - 1, Math.trunc(targetIndex)))
    return index === state.index ? state : { ...state, index }
}

/** 再来把当前卡放到待练队尾；末卡从队首继续，已记住进度不变。 */
export function retryWord(state: WordRememberSession, id: string): WordRememberSession {
    if (state.remainingIds[state.index] !== id || state.remainingIds.length <= 1) return state
    const remainingIds = [
        ...state.remainingIds.slice(0, state.index),
        ...state.remainingIds.slice(state.index + 1),
        id,
    ]
    return {
        ...state,
        remainingIds,
        index: state.index === remainingIds.length - 1 ? 0 : state.index,
    }
}

/** 只接收当前卡的记住动作，迟到、重复或其他题目的动作保持原状态。 */
export function rememberWord(state: WordRememberSession, id: string): WordRememberSession {
    if (state.remainingIds[state.index] !== id || state.rememberedIds.includes(id)) return state
    const remainingIds = state.remainingIds.filter((_, index) => index !== state.index)
    return {
        remainingIds,
        rememberedIds: [...state.rememberedIds, id],
        index: remainingIds.length === 0 ? 0 : Math.min(state.index, remainingIds.length - 1),
    }
}

export function getWordRememberProgress(state: WordRememberSession): WordRememberProgress {
    const remaining = state.remainingIds.length
    const remembered = state.rememberedIds.length
    const total = remaining + remembered
    return {
        total,
        remaining,
        remembered,
        percent: total === 0 ? 0 : (remembered / total) * 100,
        complete: total > 0 && remaining === 0,
    }
}
