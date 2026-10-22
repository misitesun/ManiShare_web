export type OralAssessmentStage = 'idle' | 'recording' | 'evaluating' | 'result'

export interface OralAssessmentTarget {
    readonly id: string
    readonly text: string
    readonly translation: string
    readonly kind: 'word' | 'sentence' | 'phonetic'
}

export interface OralAssessmentWordScore {
    readonly text: string
    readonly score: number
}

export interface OralAssessmentResult {
    readonly score: number
    readonly accuracy: number
    readonly fluency: number
    readonly completeness: number
    readonly words: readonly OralAssessmentWordScore[]
    readonly rating: 'KEEP TRYING' | 'GOOD' | 'EXCELLENT' | 'PERFECT'
    readonly description: string
}

export type OralAssessmentScoreTone = 'low' | 'good' | 'excellent' | 'perfect'

export interface OralAssessmentScorePresentation {
    readonly tone: OralAssessmentScoreTone
    readonly label: string
    readonly rating: OralAssessmentResult['rating']
    readonly description: string
}

const scorePresentations: Readonly<
    Record<OralAssessmentScoreTone, OralAssessmentScorePresentation>
> = {
    low: {
        tone: 'low',
        label: 'KEEP TRYING',
        rating: 'KEEP TRYING',
        description: '坚持练习，持续进步！',
    },
    good: {
        tone: 'good',
        label: 'GOOD EFFORT',
        rating: 'GOOD',
        description: '表现不错，继续加油！',
    },
    excellent: {
        tone: 'excellent',
        label: 'GREAT WORK',
        rating: 'EXCELLENT',
        description: '表现优秀，细节加分！',
    },
    perfect: {
        tone: 'perfect',
        label: 'PERFECT',
        rating: 'PERFECT',
        description: '近乎完美，保持水准！',
    },
}

/** 区间以用户确认的文字规则为准，小数分数在相邻档位间连续。 */
export function getOralAssessmentScorePresentation(score: number): OralAssessmentScorePresentation {
    const value = normalizeOralAssessmentScore(score)
    return scorePresentations[
        value <= 60 ? 'low' : value <= 80 ? 'good' : value <= 90 ? 'excellent' : 'perfect'
    ]
}

export interface OralAssessmentDemoState {
    readonly stage: OralAssessmentStage
    readonly elapsed: number
    readonly playing: boolean
    readonly result: OralAssessmentResult | null
}

export const initialOralAssessmentDemoState: OralAssessmentDemoState = Object.freeze({
    stage: 'idle',
    elapsed: 0,
    playing: false,
    result: null,
})

const sampleWordScores = [45, 60, 34, 60, 23, 39, 30, 60, 42] as const
const sampleMetrics: Readonly<
    Record<
        OralAssessmentScoreTone,
        { readonly accuracy: number; readonly fluency: number; readonly completeness: number }
    >
> = {
    low: { accuracy: 30, fluency: 40, completeness: 50 },
    good: { accuracy: 52, fluency: 53, completeness: 55 },
    excellent: { accuracy: 80, fluency: 92, completeness: 90 },
    perfect: { accuracy: 80, fluency: 88, completeness: 90 },
}

/** 固定样例，仅用于四步 UI；分数不由输入、计时或音量推算。 */
export function createOralAssessmentSample(
    target: OralAssessmentTarget,
    sampleScore = 40,
): OralAssessmentResult {
    const score = normalizeOralAssessmentScore(sampleScore)
    const presentation = getOralAssessmentScorePresentation(score)
    return {
        score,
        ...sampleMetrics[presentation.tone],
        rating: presentation.rating,
        description: presentation.description,
        words: target.text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((text, index) => ({
                text,
                score:
                    score === 40
                        ? (sampleWordScores[index % sampleWordScores.length] ?? 45)
                        : score,
            })),
    }
}

export function normalizeOralAssessmentScore(score: number): number {
    return Number.isFinite(score) ? Math.trunc(Math.max(0, Math.min(100, score)) * 10) / 10 : 0
}

export function formatOralAssessmentTime(seconds: number): string {
    const elapsed = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    return `${Math.floor(elapsed / 60)
        .toString()
        .padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`
}
