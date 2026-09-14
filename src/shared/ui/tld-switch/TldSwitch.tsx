import * as React from 'react'

export interface TldSwitchProps {
    readonly label: string
    readonly checked: boolean
    readonly onCheckedChange: (checked: boolean) => void
    readonly disabled?: boolean
}

export function TldSwitch({
    label,
    checked,
    onCheckedChange,
    disabled = false,
}: TldSwitchProps): React.ReactElement {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(): void => onCheckedChange(!checked)}
            className="flex min-h-10 cursor-pointer items-center gap-3 text-body text-primary outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
        >
            <span>{label}</span>
            <span
                aria-hidden="true"
                className={
                    checked
                        ? 'flex h-5 w-9 shrink-0 items-center rounded-full bg-brand p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                        : 'flex h-5 w-9 shrink-0 items-center rounded-full bg-primary/30 p-0.5 transition-colors duration-200 motion-reduce:transition-none'
                }
            >
                <span
                    className={
                        checked
                            ? 'size-4 shrink-0 translate-x-4 rounded-full bg-inverse shadow-sm transition-transform duration-200 motion-reduce:transition-none'
                            : 'size-4 shrink-0 translate-x-0 rounded-full bg-inverse shadow-sm transition-transform duration-200 motion-reduce:transition-none'
                    }
                />
            </span>
        </button>
    )
}
