import { getWordSlotView } from './word-slot-input'
import type { WordSpellingJudgment } from './word-spelling'

export interface SentenceAnswerSlot {
    readonly id: string
    readonly target: string
    readonly prefix: string
    readonly suffix: string
}

export interface SentenceAnswerLayout {
    readonly target: string
    readonly slots: readonly SentenceAnswerSlot[]
}

export type SentenceAnswerFeedback = 'pending' | 'correct' | 'incorrect'

export interface SentenceAnswerState {
    readonly values: readonly string[]
    readonly activeIndex: number
    readonly feedback: readonly SentenceAnswerFeedback[]
    readonly attempts: number
    readonly completed: boolean
}

export interface SentenceAnswerSubmission {
    readonly values: readonly string[]
    readonly value: string
}

export interface SentenceAnswerResult {
    readonly state: SentenceAnswerState
    readonly submission: SentenceAnswerSubmission | null
}

export interface SentenceAnswerInputSelection {
    readonly start: number
    readonly end: number
}

export interface SentenceAnswerEditingSnapshot {
    readonly slotId: string
    readonly target: string
    readonly value: string
    /** 供只读指法键盘使用的Unicode字符位置，不是整句序列化后的偏移。 */
    readonly cursor: number
}

/** 键盘提示只跟随当前真实词段；跳过空段或回到错段均不能按整句长度猜位置。 */
export function getSentenceAnswerEditingSnapshot(
    layout: SentenceAnswerLayout,
    state: SentenceAnswerState,
): SentenceAnswerEditingSnapshot {
    const slot = layout.slots[state.activeIndex]
    const value = state.values[state.activeIndex] ?? ''
    return {
        slotId: slot?.id ?? '',
        target: slot?.target ?? '',
        value,
        cursor: state.feedback[state.activeIndex] === 'incorrect' ? 0 : Array.from(value).length,
    }
}

/** 错段整体待替换；普通编辑仍在段尾，原生选区偏移使用UTF-16。 */
export function getSentenceAnswerInputSelection(
    state: SentenceAnswerState,
): SentenceAnswerInputSelection {
    const end = state.values[state.activeIndex]?.length ?? 0
    return { start: state.feedback[state.activeIndex] === 'incorrect' ? 0 : end, end }
}

export function createSentenceAnswerLayout(target: string): SentenceAnswerLayout {
    return {
        target,
        slots: getWordSlotView(target, '').map(({ id, target, prefix, suffix }) => ({
            id,
            target,
            prefix,
            suffix,
        })),
    }
}

export function createSentenceAnswerState(
    layout: SentenceAnswerLayout,
    value = '',
): SentenceAnswerState {
    return {
        values: getWordSlotView(layout.target, value).map((slot) => slot.value),
        activeIndex: 0,
        feedback: layout.slots.map(() => 'pending'),
        attempts: 0,
        completed: false,
    }
}

/** 空段保留自己的位置；串行文本只用于原会话展示，不承担分段判题。 */
export function serializeSentenceAnswer(
    layout: SentenceAnswerLayout,
    values: readonly string[],
): string {
    return layout.slots
        .map((slot, index) => `${slot.prefix}${values[index] ?? ''}${slot.suffix}`)
        .join(' ')
}

export function hasSentenceAnswerContent(values: readonly string[]): boolean {
    return values.some((value) => value.trim().length > 0)
}

export function isSentenceAnswerComplete(
    layout: SentenceAnswerLayout,
    values: readonly string[],
): boolean {
    return (
        layout.slots.length > 0 &&
        values.length === layout.slots.length &&
        values.every((value) => value.trim().length > 0)
    )
}

export function judgeSentenceAnswerValues(
    layout: SentenceAnswerLayout,
    values: readonly string[],
    ignoreCase: boolean,
): WordSpellingJudgment {
    if (!hasSentenceAnswerContent(values) || layout.slots.length === 0) return 'empty'
    return values.length === layout.slots.length &&
        layout.slots.every((slot, index) => {
            const value = values[index] ?? ''
            return ignoreCase
                ? value.toLowerCase() === slot.target.toLowerCase()
                : value === slot.target
        })
        ? 'correct'
        : 'incorrect'
}

/** 仅改变活动段，不移动、补齐或合并其他段的原文。 */
export function selectSentenceAnswerSlot(
    state: SentenceAnswerState,
    index: number,
): SentenceAnswerState {
    if (state.completed || state.values.length === 0) return state
    return { ...state, activeIndex: Math.max(0, Math.min(index, state.values.length - 1)) }
}

export function moveSentenceAnswerSlot(
    state: SentenceAnswerState,
    delta: number,
): SentenceAnswerState {
    return selectSentenceAnswerSlot(state, state.activeIndex + delta)
}

/** 提交后的首错定位不属于跳格；只有未提交且实际换到另一词格才发出导航反馈。 */
export function isSentenceAnswerNavigation(
    previous: SentenceAnswerState,
    result: SentenceAnswerResult,
): boolean {
    return result.submission === null && previous.activeIndex !== result.state.activeIndex
}

/** 正常向后跳段；到末段仍有空项时回到首个空段，不改答案、反馈和提交次数。 */
function advanceSentenceAnswerSlot(state: SentenceAnswerState): SentenceAnswerState {
    const next = state.activeIndex + 1
    const firstEmpty = state.values.findIndex((value) => value.trim().length === 0)
    return selectSentenceAnswerSlot(
        state,
        next < state.values.length ? next : Math.max(0, firstEmpty),
    )
}

/** 原生粘贴/软键盘产生空格时按段分配；超出段数的原文保留在末段供判错。 */
export function editSentenceAnswerSlot(
    state: SentenceAnswerState,
    layout: SentenceAnswerLayout,
    value: string,
): SentenceAnswerState {
    if (state.completed || state.values.length === 0) return state
    const parts = value.split(/\s/u)
    const values = [...state.values]
    const feedback = [...state.feedback]
    let activeIndex = state.activeIndex
    for (const [offset, part] of parts.entries()) {
        const index = Math.min(state.activeIndex + offset, values.length - 1)
        const slot = layout.slots[index]
        if (!slot) continue
        if (state.activeIndex + offset >= values.length) {
            values[index] = `${values[index] ?? ''} ${part}`
        } else {
            const withoutPrefix =
                slot.prefix && part.startsWith(slot.prefix) ? part.slice(slot.prefix.length) : part
            values[index] =
                slot.suffix && withoutPrefix.endsWith(slot.suffix)
                    ? withoutPrefix.slice(0, -slot.suffix.length)
                    : withoutPrefix
        }
        feedback[index] = 'pending'
        activeIndex = index
    }
    return { ...state, values, feedback, activeIndex }
}

export function submitSentenceAnswer(
    state: SentenceAnswerState,
    layout: SentenceAnswerLayout,
    ignoreCase: boolean,
): SentenceAnswerResult {
    if (state.completed || state.values.length === 0) return { state, submission: null }
    if (!isSentenceAnswerComplete(layout, state.values))
        return { state: advanceSentenceAnswerSlot(state), submission: null }
    const feedback = layout.slots.map((slot, index): SentenceAnswerFeedback => {
        const value = state.values[index] ?? ''
        return (
            ignoreCase ? value.toLowerCase() === slot.target.toLowerCase() : value === slot.target
        )
            ? 'correct'
            : 'incorrect'
    })
    const firstWrong = feedback.indexOf('incorrect')
    return {
        state: {
            ...state,
            feedback,
            activeIndex: firstWrong < 0 ? state.activeIndex : firstWrong,
            attempts: state.attempts + 1,
            completed: judgeSentenceAnswerValues(layout, state.values, ignoreCase) === 'correct',
        },
        submission: {
            values: [...state.values],
            value: serializeSentenceAnswer(layout, state.values),
        },
    }
}

/** 首次作答仍在末段提交；纠错后，后续已全部判对则当前位置可直接提交。 */
export function spaceSentenceAnswer(
    state: SentenceAnswerState,
    layout: SentenceAnswerLayout,
    ignoreCase: boolean,
): SentenceAnswerResult {
    if (state.completed || state.values.length === 0) return { state, submission: null }
    const correctedBeforeConfirmedTail =
        state.attempts > 0 &&
        state.feedback[state.activeIndex] === 'pending' &&
        isSentenceAnswerComplete(layout, state.values) &&
        state.feedback.slice(state.activeIndex + 1).every((feedback) => feedback === 'correct')
    if (state.activeIndex === state.values.length - 1 || correctedBeforeConfirmedTail)
        return submitSentenceAnswer(state, layout, ignoreCase)
    return {
        state: advanceSentenceAnswerSlot(state),
        submission: null,
    }
}
