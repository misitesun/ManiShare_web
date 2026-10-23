import type { CSSProperties, ReactElement } from 'react'
import {
    getOralAssessmentScorePresentation,
    normalizeOralAssessmentScore,
} from '../model/oral-assessment'
import type { OralAssessmentResult } from '../model/oral-assessment'
import { OralAssessmentScoreRing } from './OralAssessmentScoreRing'

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
                    <OralAssessmentScoreRing score={score} />
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
