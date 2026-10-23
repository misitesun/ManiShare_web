import type { ImmersiveListeningFamily } from './sentence-listening-playback'
import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import { isPracticeAnswerVisible } from './practice-visibility'
import type { WordMeaningVariant } from './word-meaning'

export interface WordMeaningReference {
    readonly node: string
    readonly viewport: { readonly width: number; readonly height: number }
    readonly top: number
    readonly mediaWidth: number
    readonly mediaHeight: number
    readonly sentenceGap: number
}

/** 两个1920×1080原稿的同一题图槽；top相对75px顶栏后的内容区。 */
export function getWordMeaningReference(variant: WordMeaningVariant): WordMeaningReference {
    return {
        node: variant === 'fill' ? '546:31574' : '546:31673',
        viewport: { width: 1920, height: 1080 },
        top: 108,
        mediaWidth: 430,
        mediaHeight: 242,
        sentenceGap: variant === 'fill' ? 96 : 48,
    }
}

export type SentenceExerciseMode = 'translate' | 'check' | 'blocks'

export interface SentenceListeningReference {
    readonly node: string
    readonly viewport: { readonly width: number; readonly height: number }
    readonly media: {
        readonly x: number
        readonly y: number
        readonly width: number
        readonly height: number
    }
    readonly annotation: {
        readonly phoneticTop: number
        readonly phoneticFontSize: number
        readonly partOfSpeechTop: number
        readonly partOfSpeechWidth: number
        readonly partOfSpeechHeight: number
        readonly englishTop: number
        readonly englishFontSize: number
        readonly englishFontWeight: number
        readonly underlineTop: number
        readonly underlineHeight: number
        readonly meaningTop: number
        readonly meaningFontSize: number
        readonly syntaxTop: number
        readonly syntaxFontSize: number
    }
    readonly translation: {
        readonly y: number
        readonly fontSize: number
        readonly fontWeight: number
    }
    readonly note: {
        readonly x: number
        readonly y: number
        readonly width: number
        readonly height: number
    }
    readonly oral: {
        readonly x: number
        readonly y: number
        readonly width: number
        readonly height: number
    }
}

/** 句子与音频听力共用布局；节点保留各自来源，文字框高不作为 CSS 行高。 */
export function getSentenceListeningReference(
    family: ImmersiveListeningFamily = 'sentence',
): SentenceListeningReference {
    return {
        node: family === 'audio' ? '546:37454' : '546:33602',
        viewport: { width: 1920, height: 1080 },
        media: { x: 745, y: 183, width: 430, height: 242 },
        annotation: {
            phoneticTop: 484,
            phoneticFontSize: 14,
            partOfSpeechTop: 510,
            partOfSpeechWidth: 38,
            partOfSpeechHeight: 22,
            englishTop: 534,
            englishFontSize: 40,
            englishFontWeight: 500,
            underlineTop: 600,
            underlineHeight: 3,
            meaningTop: 617,
            meaningFontSize: 18,
            syntaxTop: 652,
            syntaxFontSize: 16,
        },
        translation: { y: 727, fontSize: 30, fontWeight: 500 },
        note: { x: 922, y: 797, width: 76, height: 30 },
        oral: { x: 843, y: 886, width: 234, height: 46 },
    }
}

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
    if (family === 'audio' && mode === 'listen')
        return { ...base, node: getSentenceListeningReference('audio').node }
    if (family === 'typing') {
        // 句子指法实际复用word:typing；纯指法保留相同输入和键盘位置，不渲染图片／译文。
        const typing = getPracticeReference('word', 'typing', phase)
        return {
            ...typing,
            node: '546:41770',
            top: typing.top + (typing.mediaWidth * 9) / 16 + typing.textGap,
            keyboardGap: typing.translationGap + 34 + typing.keyboardGap,
        }
    }
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
    if (family === 'word' && mode === 'meaning') {
        const meaning = getWordMeaningReference('fill')
        return { ...base, node: meaning.node, top: meaning.top, textGap: meaning.sentenceGap }
    }
    if (family === 'word')
        return {
            ...base,
            node: '546:31470',
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
