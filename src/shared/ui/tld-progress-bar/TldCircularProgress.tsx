import type { ReactElement } from 'react'
import circularGlowSource from './assets/circular-glow.svg'
import circularRingSource from './assets/circular-ring.svg'
import { normalizeProgress } from './progress'

export interface TldCircularProgressProps {
    readonly ariaLabel: string
    readonly detailLabel: string
    readonly max: number
    readonly percentageLabel?: string
    readonly value: number
}

function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`
}

export function TldCircularProgress({
    ariaLabel,
    detailLabel,
    max,
    percentageLabel,
    value,
}: TldCircularProgressProps): ReactElement {
    const progress = normalizeProgress(value, max)

    return (
        <div
            aria-label={ariaLabel}
            aria-valuemax={progress.max}
            aria-valuemin={0}
            aria-valuenow={progress.value}
            className="relative grid size-[72px] shrink-0 place-items-center"
            role="progressbar"
        >
            <img
                alt=""
                aria-hidden="true"
                className="absolute left-1/2 top-0 h-[72px] w-[62px] -translate-x-1/2 opacity-70"
                src={circularRingSource}
            />
            <img
                alt=""
                aria-hidden="true"
                className="absolute left-1/2 top-0 h-[72px] w-[62px] -translate-x-1/2"
                src={circularGlowSource}
            />
            <span className="relative flex flex-col items-center text-center tabular-nums">
                <span className="text-[10px] leading-4 text-primary">
                    {percentageLabel ?? formatPercentage(progress.percentage)}
                </span>
                <span className="whitespace-nowrap text-[9px] leading-3 text-muted">
                    {detailLabel}
                </span>
            </span>
        </div>
    )
}
