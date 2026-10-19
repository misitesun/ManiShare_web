import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import { isPracticeAnswerVisible } from './practice-visibility'

export type SentenceExerciseMode = 'translate' | 'check' | 'blocks'

export interface SentenceExerciseReference {
    readonly node: string
    readonly mediaTop: number | null
    readonly englishTop: number | null
    readonly annotationTop: number | null
    readonly translationTop: number | null
    readonly translationOffset: number
    readonly inputLineTop: number | null
    readonly revealTop: number | null
    readonly trayTop: number | null
    readonly candidatesTop: number | null
}

/** 坐标为 1920×1080 画板全局 CSS px；组件放入 75px 顶栏以下时扣除 75。 */
export function getSentenceExerciseReference(
    mode: SentenceExerciseMode,
    phase: PracticePhase,
): SentenceExerciseReference {
    if (isPracticeAnswerVisible(phase))
        return {
            node: mode === 'translate' ? '546:33834' : mode === 'check' ? '546:34045' : '546:34554',
            mediaTop: null,
            englishTop: null,
            annotationTop: 316,
            translationTop: 559,
            translationOffset: -1,
            inputLineTop: null,
            revealTop: null,
            trayTop: null,
            candidatesTop: null,
        }
    if (mode === 'check')
        return {
            node: '546:33970',
            mediaTop: 245,
            englishTop: 532,
            annotationTop: null,
            translationTop: null,
            translationOffset: -1,
            inputLineTop: null,
            revealTop: 635,
            trayTop: null,
            candidatesTop: null,
        }
    if (mode === 'blocks')
        return {
            node: '546:34436',
            mediaTop: 157,
            englishTop: null,
            annotationTop: null,
            translationTop: 449,
            translationOffset: 0,
            inputLineTop: null,
            revealTop: null,
            trayTop: 565,
            candidatesTop: 817,
        }
    return {
        node: '546:33717',
        mediaTop: 336,
        englishTop: null,
        annotationTop: null,
        translationTop: 602,
        translationOffset: -14,
        inputLineTop: 723,
        revealTop: null,
        trayTop: null,
        candidatesTop: null,
    }
}

export interface PracticeReferenceLayout {
    readonly node: string
    readonly top: number
    readonly mediaWidth: number
    readonly mediaHeight: number
    readonly textGap: number
    readonly translationGap: number
    readonly keyboardGap: number
    readonly keyboardWidth: number
    readonly keyboardHeight: number
}
// CSS px；来源为 Figma 节点相对 1920×1080 画板坐标。top 已扣除 75px 顶栏及轨道。
export function getPracticeReference(
    family: PracticeFamily,
    mode: PracticeMode,
    phase: PracticePhase,
): PracticeReferenceLayout {
    const base = {
        node: '546:33602',
        top: 108,
        mediaWidth: 430,
        mediaHeight: 242,
        textGap: 109,
        translationGap: 25,
        keyboardGap: 43,
        keyboardWidth: 848,
        keyboardHeight: 315,
    }
    if (family === 'typing')
        return { ...base, node: '546:41770', top: 306, textGap: 0, keyboardGap: 91 }
    if (mode === 'typing' && family === 'picture')
        return {
            ...base,
            node: '2651:10404',
            top: 46,
            mediaWidth: 520,
            mediaHeight: 360,
            textGap: 20,
            translationGap: 5,
            keyboardGap: 35,
        }
    if (mode === 'typing' && family === 'video')
        return {
            ...base,
            node: '1719:9529',
            top: 85,
            mediaWidth: 600,
            mediaHeight: 337,
            textGap: 26,
            keyboardWidth: 758,
            keyboardHeight: 282,
        }
    if (mode === 'typing')
        return {
            ...base,
            node: family === 'word' ? '546:31762' : '546:34280',
            top: 81,
            textGap: family === 'word' ? 25 : 26,
            translationGap: family === 'word' ? 9 : 26,
            keyboardGap: family === 'word' ? 27 : 43,
        }
    if (family === 'word' && mode === 'pronounce')
        return {
            ...base,
            node: '546:31237',
            top: 153,
            mediaWidth: 500,
            mediaHeight: 281,
            textGap: 24,
            translationGap: 20,
        }
    if (family === 'word' && mode === 'spell')
        return {
            ...base,
            node: '546:31334',
            top: 153,
            mediaWidth: 500,
            mediaHeight: 281,
            textGap: 24,
        }
    if (family === 'word')
        return {
            ...base,
            node: phase === 'correct' && mode === 'dictate' ? '2389:5125' : '546:31470',
            top: 145,
            textGap: 24,
            translationGap: 25,
        }
    if (family === 'sentence' && (mode === 'translate' || mode === 'check' || mode === 'blocks')) {
        const sentence = getSentenceExerciseReference(mode, phase)
        return {
            ...base,
            node: sentence.node,
            top: (sentence.mediaTop ?? sentence.annotationTop ?? 75) - 75,
            textGap: mode === 'check' ? 45 : mode === 'blocks' ? 50 : 24,
        }
    }
    if (family === 'picture' && mode === 'oral')
        return {
            ...base,
            node: '2653:10644',
            top: 75,
            mediaWidth: 520,
            mediaHeight: 360,
            textGap: 91,
            translationGap: 19,
        }
    if (family === 'picture' && mode === 'translate')
        return {
            ...base,
            node: '2651:10015',
            top: 185,
            mediaWidth: 957,
            mediaHeight: 663,
            textGap: 0,
        }
    if (family === 'picture')
        return {
            ...base,
            node: '2647:9783',
            top: 59,
            mediaWidth: 844,
            mediaHeight: 565,
            textGap: 54,
            translationGap: 11,
        }
    if (family === 'video' && mode === 'listen')
        return {
            ...base,
            node: '546:40208',
            top: 63,
            mediaWidth: 1100,
            mediaHeight: 618,
            textGap: 18,
        }
    if (family === 'video')
        return {
            ...base,
            node: '546:40368',
            top: 212,
            mediaWidth: phase === 'correct' ? 600 : 900,
            mediaHeight: phase === 'correct' ? 337 : 506,
            textGap: 24,
        }
    if (mode === 'translate') return { ...base, node: '546:33717', top: 261, textGap: 24 }
    if (family === 'picture-reader')
        return { ...base, node: '546:43565', top: 98, mediaWidth: 1100, mediaHeight: 733 }
    if (family === 'video-reader')
        return { ...base, node: '546:43497', top: 151, mediaWidth: 1200, mediaHeight: 700 }
    if (family === 'audio-reader')
        return { ...base, node: '546:43531', top: 200, mediaWidth: 496, mediaHeight: 280 }
    return base
}
