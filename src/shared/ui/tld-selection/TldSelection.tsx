import * as React from 'react'

export interface TldSelectionProps {
    readonly label: string
    readonly checked: boolean
    readonly onCheckedChange: (checked: boolean) => void
    readonly disabled?: boolean
    readonly layout?: 'control' | 'card'
    readonly tone?: 'selection' | 'danger'
}

/** 圆形逐项选择控件；批量选择允许多项同时选中，因此使用 checkbox 语义。 */
export function TldSelection({
    label,
    checked,
    onCheckedChange,
    disabled = false,
    layout = 'control',
    tone = 'selection',
}: TldSelectionProps): React.ReactElement {
    return (
        <label
            data-layout={layout}
            className={
                disabled
                    ? 'group relative flex size-9 shrink-0 cursor-not-allowed items-center justify-center opacity-50 data-[layout=card]:size-full'
                    : 'group relative flex size-9 shrink-0 cursor-pointer items-center justify-center data-[layout=card]:size-full'
            }
        >
            <input
                type="checkbox"
                aria-label={label}
                checked={checked}
                disabled={disabled}
                onChange={(event): void => onCheckedChange(event.currentTarget.checked)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
                aria-hidden="true"
                data-tone={tone}
                data-checked={checked}
                className="pointer-events-none flex size-5 items-center justify-center rounded-full border border-strong bg-canvas transition-colors duration-200 data-[checked=true]:border-brand data-[checked=true]:bg-brand data-[tone=danger]:data-[checked=true]:border-danger data-[tone=danger]:data-[checked=true]:bg-danger peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas motion-reduce:transition-none group-data-[layout=card]:absolute group-data-[layout=card]:right-2.5 group-data-[layout=card]:top-2.5"
            >
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    focusable="false"
                    className={
                        checked
                            ? 'size-3.5 scale-100 text-inverse opacity-100 transition-[opacity,scale] duration-200 motion-reduce:transition-none'
                            : 'size-3.5 scale-50 text-inverse opacity-0 transition-[opacity,scale] duration-200 motion-reduce:transition-none'
                    }
                >
                    <path
                        d="m3.5 8 3 3 6-6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        </label>
    )
}
