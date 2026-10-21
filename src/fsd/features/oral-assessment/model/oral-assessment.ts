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

/** 固定样例，仅用于四步 UI；分数不由输入、计时或音量推算。 */
export function createOralAssessmentSample(target: OralAssessmentTarget): OralAssessmentResult {
    return {
        score: 40,
        accuracy: 30,
        fluency: 40,
        completeness: 50,
        rating: 'KEEP TRYING',
        description: '坚持练习，持续进步！',
        words: target.text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((text, index) => ({
                text,
                score: sampleWordScores[index % sampleWordScores.length] ?? 45,
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
