import type { CSSProperties, ReactElement } from 'react'
import {
    getOralAssessmentScorePresentation,
    normalizeOralAssessmentScore,
} from '../model/oral-assessment'
import type { OralAssessmentResult } from '../model/oral-assessment'

interface OralAssessmentScoreProps {
    readonly result: OralAssessmentResult
    readonly presentation?: 'dialog' | 'page'
}

export function OralAssessmentScore({
    result,
    presentation = 'dialog',
}: OralAssessmentScoreProps): ReactElement {
    const score = normalizeOralAssessmentScore(result.score)
    const rating = getOralAssessmentScorePresentation(score)
    const metrics = [
        { label: '准确度', value: result.accuracy },
        { label: '流畅度', value: result.fluency },
        { label: '完整度', value: result.completeness },
    ]
    return (
        <section
            aria-label="模拟口语评测结果"
            data-oral-assessment-score
            data-tone={rating.tone}
            data-presentation={presentation}
            className="w-full max-w-[439px] rounded-[20px] bg-dialog-border p-px text-oral-score-low data-[tone=good]:text-oral-score-good data-[tone=excellent]:text-oral-score-excellent data-[tone=perfect]:text-oral-score-perfect data-[presentation=page]:rounded-[16px] data-[presentation=page]:shadow-oral-score"
        >
            <div
                className={
                    presentation === 'page'
                        ? 'grid min-h-[238px] grid-cols-1 rounded-[15px] bg-oral-score-surface py-5 sm:grid-cols-[minmax(0,195px)_minmax(0,1fr)]'
                        : 'grid min-h-[238px] grid-cols-1 rounded-[19px] bg-linear-to-r/srgb from-dialog-surface via-dialog-surface-accent to-dialog-surface py-5 sm:grid-cols-[minmax(0,195px)_minmax(0,1fr)]'
                }
            >
                <div className="flex min-w-0 flex-col items-center px-4">
                    <div className="relative size-[131px] shrink-0">
                        <svg viewBox="0 0 131 131" className="size-full" aria-hidden="true">
                            <circle cx="65.5" cy="65.5" r="52.5" className="fill-oral-score-ring" />
                            <circle
                                cx="65.5"
                                cy="65.5"
                                r="59"
                                fill="none"
                                className="stroke-oral-score-ring"
                                strokeWidth="13"
                            />
                            <circle
                                cx="65.5"
                                cy="65.5"
                                r="59"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="13"
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
                    <div className="relative mt-1 w-max max-w-full">
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-1 h-[7px] bg-current"
                        />
                        <p className="relative m-0 text-[20px] font-bold italic leading-[28px] text-content-strong">
                            {rating.label}
                        </p>
                    </div>
                    <p className="m-0 mt-3 text-center text-[14px] font-normal leading-5 text-hint">
                        {rating.description}
                    </p>
                </div>
                <dl className="m-0 mt-5 flex min-w-0 flex-col justify-between gap-5 border-t border-subtle px-5 pt-5 sm:mt-2 sm:border-l sm:border-t-0 sm:pl-[30px] sm:pr-6 sm:pt-0">
                    {metrics.map((item) => {
                        const value = normalizeOralAssessmentScore(item.value)
                        const style: CSSProperties = { width: `${value}%` }
                        return (
                            <div
                                key={item.label}
                                className="min-w-0 border-b border-subtle pb-3 last:border-0 last:pb-0"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-[14px] leading-5 text-hint">
                                        {item.label}
                                    </dt>
                                    <dd className="m-0 text-[18px] leading-[25px] text-content-strong">
                                        {value}
                                        <span className="ml-0.5 text-[10px] text-hint">分</span>
                                    </dd>
                                </div>
                                <div
                                    role="meter"
                                    aria-label={item.label}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={value}
                                    className="mt-2 h-1 overflow-hidden rounded-full bg-oral-score-track"
                                >
                                    <div
                                        data-tone={rating.tone}
                                        style={style}
                                        className="h-full rounded-full bg-current data-[tone=low]:bg-oral-score-low-meter"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </dl>
            </div>
        </section>
    )
}
