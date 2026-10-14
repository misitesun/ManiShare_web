'use client'

import * as React from 'react'
import { normalizeProgress } from './progress'

export interface TldProgressBarProps {
    readonly ariaLabel: string
    readonly max: number
    readonly showValue?: boolean
    readonly size?: TldProgressBarSize
    readonly spacing?: 'standard' | 'wide'
    readonly value: number
    readonly valueFormat?: 'fraction' | 'percentage'
}

export type TldProgressBarSize = 'medium' | 'large' | 'challenge'

export function TldProgressBar({
    ariaLabel,
    max,
    showValue = true,
    size = 'medium',
    spacing = 'standard',
    value,
    valueFormat = 'fraction',
}: TldProgressBarProps): React.ReactElement {
    const progress = normalizeProgress(value, max)
    const trackClassName =
        size === 'challenge'
            ? 'h-[26px] min-w-0 flex-1 overflow-hidden rounded-full bg-challenge-track'
            : size === 'large'
              ? 'h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-progress-track'
              : 'h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-progress-track'

    return (
        <div
            className={
                size === 'challenge'
                    ? 'flex h-[26px] min-w-0 items-center gap-[14px] text-[18px] leading-[25px] text-foreground'
                    : spacing === 'wide'
                      ? 'flex h-5 min-w-0 items-center gap-[13px] text-label text-primary'
                      : 'flex h-5 min-w-0 items-center gap-2.5 text-label text-primary'
            }
        >
            {showValue && valueFormat === 'fraction' ? (
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
                    className={
                        size === 'challenge'
                            ? 'h-full rounded-full bg-linear-to-r/srgb from-challenge-start to-challenge-end'
                            : 'h-full rounded-full bg-linear-to-r from-brand-start to-brand-end'
                    }
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
            {showValue && valueFormat === 'percentage' ? (
                <span className="w-[40px] shrink-0 tabular-nums">
                    {Math.round(progress.percentage)}%
                </span>
            ) : null}
        </div>
    )
}
