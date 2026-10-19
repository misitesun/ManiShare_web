import type { PracticeFamily } from './practice-demo'
import { PRACTICE_PAUSE_ENABLED } from './practice-pause'

export type PracticeNavigationAction =
    | 'answer'
    | 'content'
    | 'mode'
    | 'pause'
    | 'reset'
    | 'report'
    | 'draft'
    | 'settings'
    | 'fullscreen'

const gameActions = Object.freeze([
    'answer',
    'content',
    'mode',
    ...(PRACTICE_PAUSE_ENABLED ? (['pause'] as const) : []),
    'reset',
    'report',
    'draft',
    'settings',
    'fullscreen',
] as const)

const focusedActions = Object.freeze([
    'content',
    ...(PRACTICE_PAUSE_ENABLED ? (['pause'] as const) : []),
    'reset',
    'draft',
    'settings',
    'fullscreen',
] as const)

const guessActions = Object.freeze([
    'answer',
    'mode',
    'reset',
    'draft',
    'settings',
    'fullscreen',
] as const)

const readerActions = Object.freeze(['draft', 'settings', 'fullscreen'] as const)

const navigationByFamily: Readonly<Record<PracticeFamily, readonly PracticeNavigationAction[]>> = {
    word: gameActions,
    sentence: gameActions,
    audio: gameActions,
    video: gameActions,
    picture: gameActions,
    typing: focusedActions,
    phonetics: focusedActions,
    guess: guessActions,
    'audio-reader': readerActions,
    'video-reader': readerActions,
    'picture-reader': readerActions,
    'text-reader': readerActions,
}

/** 同一内容族的全部小模式共用导航；不根据题态或局部设置临时开放操作。 */
export function getPracticeNavigationActions(
    family: PracticeFamily,
): readonly PracticeNavigationAction[] {
    return navigationByFamily[family]
}
