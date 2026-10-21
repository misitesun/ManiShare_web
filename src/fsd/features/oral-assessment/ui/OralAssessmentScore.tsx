import type { CSSProperties, ReactElement } from 'react'
import { normalizeOralAssessmentScore } from '../model/oral-assessment'
import type { OralAssessmentResult } from '../model/oral-assessment'

interface OralAssessmentScoreProps {
    readonly result: OralAssessmentResult
}

export function getOralScoreTone(score: number): string {
    const value = normalizeOralAssessmentScore(score)
    return value < 60 ? 'low' : value < 80 ? 'good' : value < 90 ? 'excellent' : 'perfect'
}

export function OralAssessmentScore({ result }: OralAssessmentScoreProps): ReactElement {
    const score = normalizeOralAssessmentScore(result.score)
    const metrics = [
        { label: '准确度', value: result.accuracy },
        { label: '流畅度', value: result.fluency },
        { label: '完整度', value: result.completeness },
    ]
    return (
        <section
            aria-label="模拟口语评测结果"
            data-oral-assessment-score
            data-tone={getOralScoreTone(score)}
            className="w-full max-w-[439px] rounded-[20px] bg-dialog-border p-px text-danger data-[tone=good]:text-accent-orange data-[tone=excellent]:text-accent-blue data-[tone=perfect]:text-success design:translate-x-[7.5px]"
        >
            <div className="grid min-h-[238px] grid-cols-1 rounded-[19px] bg-linear-to-r/srgb from-dialog-surface via-dialog-surface-accent to-dialog-surface py-5 sm:grid-cols-[minmax(0,193px)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col items-center px-4">
                    <div className="relative size-[131px] shrink-0">
                        <svg viewBox="0 0 131 131" className="size-full" aria-hidden="true">
                            <circle
                                cx="65.5"
                                cy="65.5"
                                r="49"
                                fill="none"
                                className="stroke-progress-track"
                                strokeWidth="7"
                            />
                            <circle
                                cx="65.5"
                                cy="65.5"
                                r="49"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeLinecap="round"
                                pathLength="100"
                                strokeDasharray={`${score} 100`}
                                transform="rotate(-90 65.5 65.5)"
                            />
                        </svg>
                        <p className="absolute inset-0 m-0 flex items-center justify-center text-[24px] font-medium leading-[34px]">
                            {score}
                            <span className="text-[16px] font-normal">分</span>
                        </p>
                    </div>
                    <div className="mt-2 w-max max-w-full border-b-4 border-current">
                        <p className="m-0 text-[18px] font-bold italic leading-[25px] text-content-strong">
                            {result.rating}
                        </p>
                    </div>
                    <p className="m-0 mt-2 text-center text-[14px] font-normal leading-5 text-hint">
                        {result.description}
                    </p>
                </div>
                <dl className="m-0 mt-5 flex min-w-0 flex-col justify-between gap-5 border-t border-subtle px-5 pt-5 sm:mt-1 sm:border-l sm:border-t-0 sm:px-[30px] sm:pt-0">
                    {metrics.map((item) => {
                        const value = normalizeOralAssessmentScore(item.value)
                        const style: CSSProperties = { width: `${value}%` }
                        return (
                            <div key={item.label} className="min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-[14px] leading-5 text-hint">
                                        {item.label}
                                    </dt>
                                    <dd className="m-0 text-[18px] leading-[25px] text-content-strong">
                                        {value}
                                        <span className="ml-0.5 text-[12px] text-hint">分</span>
                                    </dd>
                                </div>
                                <div
                                    role="meter"
                                    aria-label={item.label}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={value}
                                    className="mt-2 h-1 overflow-hidden rounded-full bg-content-strong/80"
                                >
                                    <div style={style} className="h-full rounded-full bg-current" />
                                </div>
                            </div>
                        )
                    })}
                </dl>
            </div>
        </section>
    )
}
