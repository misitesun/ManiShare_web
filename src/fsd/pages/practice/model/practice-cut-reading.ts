import { getAdditionalToolbarRows } from './additional-toolbar-options'
import { isSentenceGameFamily } from './sentence-game-family'
import { audioToolbarRows, isAudioToolbarMode } from './audio-toolbar-options'
import { practiceMediaSource } from './media-controller'
import type { PracticeFamily, PracticeMode } from './practice-demo'
import { isSentenceToolbarMode, sentenceToolbarRows } from './sentence-toolbar-options'
import { isWordToolbarMode, wordToolbarRows } from './word-toolbar-options'

export interface PracticeCutReadingVisit {
    readonly scope: string
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly questionId: string
    readonly index: number
    readonly revision: number
}

export interface PracticeCutReadingState {
    readonly visitKey: string | null
    readonly consumed: boolean
    /** 已发出自动播放意图的音源；不是媒体已经 playing 的证明。 */
    readonly requestedSource: string | null
}

export interface PracticeCutReadingInput {
    readonly visitKey: string
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    /** 当前访问的朗读意图来自局部切读或显式自动播放，不读取全局兼容字段。 */
    readonly enabled: boolean
    /** 阅读显式播放、看图听力入场／选题可开放本次访问朗读，不伪造切读控件。 */
    readonly sequenceEnabled?: boolean
    readonly ready: boolean
    readonly blocked: boolean
    readonly source?: string
}

export type PracticeCutReadingAction = 'none' | 'play' | 'stop'
export type PracticeCutReadingPresentation = 'hidden' | 'pending-source' | 'ready'

export interface PracticeCutReadingTransition {
    readonly state: PracticeCutReadingState
    readonly action: PracticeCutReadingAction
    /** 新访问可在同一步先取消旧请求，再发出本次唯一播放请求。 */
    readonly stopPrevious: boolean
    readonly source: string | null
    /** 仅描述自动朗读的展示资格；声纹运动仍以真实媒体 playing 为准。 */
    readonly presentation: PracticeCutReadingPresentation
}

/** 以真实控件白名单为准，避免把无控件模式的默认 true 当成产品能力。 */
export function hasPracticeCutReadingControl(family: PracticeFamily, mode: PracticeMode): boolean {
    if (family === 'word')
        return isWordToolbarMode(mode) && wordToolbarRows[mode].includes('cutReading')
    if (family === 'sentence')
        return isSentenceToolbarMode(mode) && sentenceToolbarRows[mode].includes('cutReading')
    if (family === 'audio')
        return isAudioToolbarMode(mode) && audioToolbarRows[mode].includes('cutReading')
    return getAdditionalToolbarRows(family, mode).includes('cutReading')
}

export function isPracticeCutReadingEnabled(
    family: PracticeFamily,
    mode: PracticeMode,
    localValue: boolean,
): boolean {
    return localValue && hasPracticeCutReadingControl(family, mode)
}

/** 不拼接分隔符，避免课程/题目 ID 中的冒号等字符形成同一个访问标识。 */
export function createPracticeCutReadingVisitKey(visit: PracticeCutReadingVisit): string {
    return JSON.stringify([
        visit.scope,
        visit.family,
        visit.mode,
        visit.questionId,
        visit.index,
        visit.revision,
    ])
}

export function createPracticeCutReadingState(): PracticeCutReadingState {
    return { visitKey: null, consumed: false, requestedSource: null }
}

/**
 * 纯策略：每次题目访问最多发出一次自动播放请求，不创建音频、timer 或接口请求。
 * 有效音源到达前不消费；发出请求即消费，失败/暂停后仅允许手动重试。
 * 宿主执行 play 时负责绑定本次 source，并在 stopPrevious 时先停旧媒体。
 */
export function getPracticeCutReadingTransition(
    state: PracticeCutReadingState,
    input: PracticeCutReadingInput,
): PracticeCutReadingTransition {
    const sameVisit = state.visitKey === input.visitKey
    const source = practiceMediaSource(input.source)
    const allowed =
        (isPracticeCutReadingEnabled(input.family, input.mode, input.enabled) ||
            (((isSentenceGameFamily(input.family) && input.mode === 'read') ||
                (input.family === 'picture' && input.mode === 'listen')) &&
                input.enabled &&
                input.sequenceEnabled === true)) &&
        input.ready &&
        !input.blocked
    const presentation: PracticeCutReadingPresentation = !allowed
        ? 'hidden'
        : source === null
          ? 'pending-source'
          : 'ready'
    const stopPrevious =
        state.requestedSource !== null &&
        (!sameVisit || !allowed || state.requestedSource !== source)
    let next = sameVisit
        ? state
        : { visitKey: input.visitKey, consumed: false, requestedSource: null }
    if (stopPrevious && next.requestedSource !== null) next = { ...next, requestedSource: null }
    if (allowed && !next.consumed && source !== null)
        return {
            state: { ...next, consumed: true, requestedSource: source },
            action: 'play',
            stopPrevious,
            source,
            presentation,
        }
    return {
        state: next,
        action: stopPrevious ? 'stop' : 'none',
        stopPrevious,
        source,
        presentation,
    }
}
