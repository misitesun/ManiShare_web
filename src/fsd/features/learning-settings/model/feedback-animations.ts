import type { LottieData } from '../../../shared/lib/animation'

export type CorrectAnimationId =
    'lottie-0' | 'lottie-1' | 'lottie-2' | 'lottie-4' | 'lottie-5' | 'lottie-6' | 'lottie-7'
export type LearningAnimationId = CorrectAnimationId | 'chapter-complete'

export interface LearningAnimation {
    readonly id: LearningAnimationId
    readonly label: string
    readonly speed: number
    readonly loadData: () => Promise<LottieData>
}

const firstCorrectAnimation: LearningAnimation & { readonly id: CorrectAnimationId } = {
    id: 'lottie-0',
    label: '礼花绽放',
    speed: 1,
    loadData: async (): Promise<LottieData> =>
        (await import('../assets/feedback/correct-0.json')).default,
}

export const correctAnimations: readonly (LearningAnimation & {
    readonly id: CorrectAnimationId
})[] = [
    firstCorrectAnimation,
    {
        id: 'lottie-1',
        label: '缤纷彩纸',
        speed: 1,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-1.json')).default,
    },
    {
        id: 'lottie-2',
        label: '闪耀烟花',
        speed: 1.5,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-2.json')).default,
    },
    {
        id: 'lottie-4',
        label: '鼓掌喝彩',
        speed: 1.5,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-4.json')).default,
    },
    {
        id: 'lottie-5',
        label: '欢庆光芒',
        speed: 1.5,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-5.json')).default,
    },
    {
        id: 'lottie-6',
        label: '点赞鼓励',
        speed: 1.5,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-6.json')).default,
    },
    {
        id: 'lottie-7',
        label: '粒子绽放',
        speed: 1,
        loadData: async (): Promise<LottieData> =>
            (await import('../assets/feedback/correct-7.json')).default,
    },
]

export const chapterCompleteAnimation: LearningAnimation = {
    id: 'chapter-complete',
    label: '章节完成烟花',
    speed: 1,
    loadData: async (): Promise<LottieData> =>
        (await import('../assets/feedback/chapter-complete.json')).default,
}

export const defaultCorrectAnimationId = firstCorrectAnimation.id
export const correctAnimationOptions = correctAnimations.map(({ id }) => id)
const legacyCorrectAnimations = ['🎊', '🎊🎊🎊', '🐸', '🎉', '✨']

/** The old particle effects have no equivalent in the new source set. Use its explicit first default. */
export function resolveCorrectAnimationId(value: unknown): CorrectAnimationId | null {
    if (typeof value !== 'string') return null
    if (legacyCorrectAnimations.includes(value)) return defaultCorrectAnimationId
    return correctAnimations.find(({ id }) => id === value)?.id ?? null
}

export function getLearningAnimation(id: LearningAnimationId): LearningAnimation {
    if (id === 'chapter-complete') return chapterCompleteAnimation
    return correctAnimations.find((animation) => animation.id === id) ?? firstCorrectAnimation
}
