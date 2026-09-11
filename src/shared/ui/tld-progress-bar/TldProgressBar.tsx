import * as React from 'react'
import { normalizeProgress } from './progress'

export interface TldProgressBarProps {
    readonly ariaLabel: string
    readonly max: number
    readonly showValue?: boolean
    readonly size?: TldProgressBarSize
    readonly value: number
}

export type TldProgressBarSize = 'medium' | 'large'

export function TldProgressBar({
    ariaLabel,
    max,
    showValue = true,
    size = 'medium',
    value,
}: TldProgressBarProps): React.ReactElement {
    const progress = normalizeProgress(value, max)
    const trackClassName =
        size === 'large'
            ? 'h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-progress-track'
            : 'h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-progress-track'

    return (
        <div className="flex h-5 min-w-0 items-center gap-2.5 text-label text-primary">
            {showValue ? (
                <span className="shrink-0 tabular-nums">
                    <span className="font-medium text-brand">{progress.value}</span>
                    <span>/{progress.max}</span>
                </span>
            ) : null}
            <div
                aria-label={ariaLabel}
                aria-valuemax={progress.max}
                aria-valuemin={0}
                aria-valuenow={progress.value}
                className={trackClassName}
                role="progressbar"
            >
                <div
                    className="h-full rounded-full bg-linear-to-r from-brand-start to-brand-end"
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
        </div>
    )
}
