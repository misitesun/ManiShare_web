import type { LearningPreferences } from './preferences'

export interface LearningSoundAsset {
    readonly src: string
    readonly volume?: number
}

/** 标签按源码配置逐项映射，跳音是12，不按设置列表的显示位置推断编号。 */
export const learningSoundAssets: Readonly<Record<string, LearningSoundAsset | undefined>> = {
    'typing:原键（默认）': { src: new URL('../assets/sounds/type/0.mp3', import.meta.url).href },
    'typing:跳音': { src: new URL('../assets/sounds/type/12.mp3', import.meta.url).href },
    'typing:轻键': { src: new URL('../assets/sounds/type/1.mp3', import.meta.url).href },
    'typing:清响': { src: new URL('../assets/sounds/type/2.mp3', import.meta.url).href },
    'typing:短点': { src: new URL('../assets/sounds/type/3.mp3', import.meta.url).href },
    'typing:木扣': { src: new URL('../assets/sounds/type/4.mp3', import.meta.url).href },
    'typing:拖尾': { src: new URL('../assets/sounds/type/5.mp3', import.meta.url).href },
    'typing:快键': { src: new URL('../assets/sounds/type/6.mp3', import.meta.url).href },
    'typing:回弹': { src: new URL('../assets/sounds/type/7.mp3', import.meta.url).href },
    'typing:明铃': { src: new URL('../assets/sounds/type/8.mp3', import.meta.url).href },
    'typing:点按': { src: new URL('../assets/sounds/type/9.mp3', import.meta.url).href },
    'typing:弹片': { src: new URL('../assets/sounds/type/10.mp3', import.meta.url).href },
    'typing:暗扣': { src: new URL('../assets/sounds/type/11.mp3', import.meta.url).href },
    'correct:清音（默认）': {
        src: new URL('../assets/sounds/success/0.mp3', import.meta.url).href,
    },
    'correct:清悦': { src: new URL('../assets/sounds/success/1.wav', import.meta.url).href },
    'incorrect:轻警（默认）': {
        src: new URL('../assets/sounds/error/0.mp3', import.meta.url).href,
    },
    'incorrect:低鸣': { src: new URL('../assets/sounds/error/1.mp3', import.meta.url).href },
    'incorrect:短促': { src: new URL('../assets/sounds/error/2.mp3', import.meta.url).href },
    'incorrect:顿响': { src: new URL('../assets/sounds/error/3.mp3', import.meta.url).href },
    'incorrect:警示': { src: new URL('../assets/sounds/error/4.mp3', import.meta.url).href },
    'incorrect:闷扣': { src: new URL('../assets/sounds/error/5.mp3', import.meta.url).href },
    'chapterComplete:落幕（默认）': {
        src: new URL('../assets/sounds/finish/0.mp3', import.meta.url).href,
    },
    'chapterComplete:终章': { src: new URL('../assets/sounds/finish/1.mp3', import.meta.url).href },
    'chapterComplete:礼赞': { src: new URL('../assets/sounds/finish/2.mp3', import.meta.url).href },
    'chapterComplete:星河': { src: new URL('../assets/sounds/finish/3.mp3', import.meta.url).href },
    'chapterComplete:收束': { src: new URL('../assets/sounds/finish/4.mp3', import.meta.url).href },
    'chapterComplete:凯旋': { src: new URL('../assets/sounds/finish/5.mp3', import.meta.url).href },
    'chapterComplete:花火': { src: new URL('../assets/sounds/finish/6.mp3', import.meta.url).href },
    'chapterComplete:余韵': { src: new URL('../assets/sounds/finish/7.mp3', import.meta.url).href },
    questionChange: {
        src: new URL('../assets/sounds/game/next.wav', import.meta.url).href,
        volume: 0.4,
    },
    wordRetry: { src: new URL('../assets/sounds/game/dim.mp3', import.meta.url).href, volume: 0.4 },
    wordRemember: {
        src: new URL('../assets/sounds/game/remember.mp3', import.meta.url).href,
        volume: 0.4,
    },
    recordStart: {
        src: new URL('../assets/sounds/record/1.mp3', import.meta.url).href,
        volume: 0.4,
    },
    'evaluationComplete:KEEP TRYING': {
        src: new URL('../assets/sounds/oral/keep_trying.mp3', import.meta.url).href,
        volume: 1,
    },
    'evaluationComplete:GOOD': {
        src: new URL('../assets/sounds/oral/good.mp3', import.meta.url).href,
        volume: 1,
    },
    'evaluationComplete:EXCELLENT': {
        src: new URL('../assets/sounds/oral/excellent.mp3', import.meta.url).href,
        volume: 1,
    },
    'evaluationComplete:PERFECT': {
        src: new URL('../assets/sounds/oral/perfect.mp3', import.meta.url).href,
        volume: 1,
    },
}

export type LearningSoundPreviewKind =
    'typing' | 'correct' | 'incorrect' | 'chapterComplete' | 'questionChange' | 'evaluationComplete'

export interface LearningSoundPreview {
    readonly key: string
    readonly label: string
    readonly enabled: boolean
    readonly volume: number
    readonly asset: LearningSoundAsset | undefined
}

export function getLearningSoundPreview(
    values: LearningPreferences,
    kind: LearningSoundPreviewKind,
): LearningSoundPreview {
    const selections = {
        typing: {
            key: `typing:${values.typingTone}`,
            label: '打字音效',
            enabled: values.typingSound,
            volume: values.typingVolume / 100,
        },
        correct: {
            key: `correct:${values.correctTone}`,
            label: '答对音效',
            enabled: values.correctSound,
            volume: values.correctVolume / 100,
        },
        incorrect: {
            key: `incorrect:${values.errorTone}`,
            label: '答错音效',
            enabled: values.errorSound,
            volume: values.errorVolume / 100,
        },
        chapterComplete: {
            key: `chapterComplete:${values.completionTone}`,
            label: '章节完成音效',
            enabled: values.completionSound,
            volume: values.completionVolume / 100,
        },
        questionChange: {
            key: 'questionChange',
            label: '切题音效',
            enabled: values.transitionSound,
            volume: 0.4,
        },
        evaluationComplete: {
            key: 'evaluationComplete:GOOD',
            label: '口语评测结束音效',
            enabled: values.evaluationSound,
            volume: 1,
        },
    }
    const selection = selections[kind]
    return { ...selection, asset: learningSoundAssets[selection.key] }
}
