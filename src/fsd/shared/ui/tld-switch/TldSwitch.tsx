'use client'

import * as React from 'react'

export interface TldSwitchProps {
    readonly label: string
    readonly checked: boolean
    readonly onCheckedChange: (checked: boolean) => void
    readonly disabled?: boolean
    readonly showLabel?: boolean
    readonly descriptionId?: string | undefined
    readonly size?: 'compact' | 'default'
}

export function TldSwitch({
    label,
    checked,
    onCheckedChange,
    disabled = false,
    showLabel = true,
    descriptionId,
    size = 'default',
}: TldSwitchProps): React.ReactElement {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            aria-describedby={descriptionId}
            disabled={disabled}
            onClick={(): void => onCheckedChange(!checked)}
            className={
                size === 'compact'
                    ? 'relative flex min-h-10 cursor-pointer items-center gap-[13px] text-body-tight text-primary outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 xl:min-h-[22px]'
                    : 'relative flex min-h-10 cursor-pointer items-center gap-3 text-body text-primary outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
            }
        >
            <span className={showLabel ? 'block' : 'sr-only'}>{label}</span>
            <span
                aria-hidden="true"
                className={
                    size === 'compact'
                        ? checked
                            ? 'flex h-5 w-8 shrink-0 items-center rounded-full bg-brand p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                            : 'flex h-5 w-8 shrink-0 items-center rounded-full bg-primary/30 p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                        : checked
                          ? 'flex h-5 w-9 shrink-0 items-center rounded-full bg-brand p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                          : 'flex h-5 w-9 shrink-0 items-center rounded-full bg-primary/30 p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                }
            >
                <span
                    className={
                        checked && size === 'compact'
                            ? 'size-4 shrink-0 translate-x-3 rounded-full bg-inverse shadow-sm transition-transform duration-200 motion-reduce:transition-none'
                            : checked
                              ? 'size-4 shrink-0 translate-x-4 rounded-full bg-inverse shadow-sm transition-transform duration-200 motion-reduce:transition-none'
                              : 'size-4 shrink-0 translate-x-0 rounded-full bg-inverse shadow-sm transition-transform duration-200 motion-reduce:transition-none'
                    }
                />
            </span>
        </button>
    )
}
