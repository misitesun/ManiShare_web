'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { gsap, useAnimationActivity, useGSAP } from '../../../shared/lib/animation'
import {
    getOralAssessmentScorePresentation,
    normalizeOralAssessmentScore,
} from '../model/oral-assessment'

export interface OralAssessmentScoreRingProps {
    readonly score: number
    readonly compact?: boolean
    readonly animate?: boolean
    readonly active?: boolean
}

/** 总分的唯一圆环展示；原详细结果保持131px，卡内结果使用透明中心的72px变体。 */
export function OralAssessmentScoreRing({
    score: rawScore,
    compact = false,
    animate = false,
    active = true,
}: OralAssessmentScoreRingProps): ReactElement {
    const host = useRef<HTMLDivElement>(null)
    const progress = useRef<SVGCircleElement>(null)
    const activity = useAnimationActivity(host)
    const score = normalizeOralAssessmentScore(rawScore)
    const rating = getOralAssessmentScorePresentation(score)
    useGSAP(
        (): void => {
            const circle = progress.current
            if (!circle || !animate) return
            if (!active || !activity.visible || activity.reduced) {
                gsap.set(circle, { attr: { 'stroke-dasharray': `${score} 100` } })
                return
            }
            gsap.fromTo(
                circle,
                { attr: { 'stroke-dasharray': '0 100' } },
                {
                    attr: { 'stroke-dasharray': `${score} 100` },
                    duration: 0.65,
                    ease: 'power2.out',
                },
            )
        },
        {
            scope: host,
            dependencies: [score, animate, active, activity.visible, activity.reduced],
            revertOnUpdate: true,
        },
    )
    return (
        <div
            ref={host}
            data-oral-score-ring={compact ? 'compact' : 'default'}
            data-tone={rating.tone}
            role={compact ? 'meter' : undefined}
            aria-label={compact ? '本次口语评测总分（演示）' : undefined}
            aria-valuemin={compact ? 0 : undefined}
            aria-valuemax={compact ? 100 : undefined}
            aria-valuenow={compact ? score : undefined}
            className={
                compact
                    ? 'relative size-[72px] shrink-0 text-oral-score-low data-[tone=good]:text-oral-score-good data-[tone=excellent]:text-oral-score-excellent data-[tone=perfect]:text-oral-score-perfect'
                    : 'relative size-[131px] shrink-0'
            }
        >
            <svg viewBox="0 0 131 131" className="size-full" aria-hidden="true">
                {!compact && (
                    <circle cx="65.5" cy="65.5" r="52.5" className="fill-oral-score-ring" />
                )}
                <circle
                    cx="65.5"
                    cy="65.5"
                    r="59"
                    fill="none"
                    className="stroke-oral-score-ring"
                    strokeWidth="13"
                />
                <circle
                    ref={progress}
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
                    className={animate && active && !activity.visible ? 'opacity-0' : undefined}
                />
            </svg>
            <p
                className={
                    compact
                        ? 'absolute inset-0 m-0 flex items-center justify-center text-[20px] font-medium leading-7'
                        : 'absolute inset-0 m-0 flex items-center justify-center text-[24px] font-medium leading-[34px]'
                }
            >
                {score}
                <span className={compact ? 'text-[14px] font-normal' : 'text-[16px] font-normal'}>
                    分
                </span>
            </p>
        </div>
    )
}
