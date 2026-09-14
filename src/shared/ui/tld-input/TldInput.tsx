import * as React from 'react'

export interface TldInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'className' | 'style' | 'size'
> {
    readonly label: string
    readonly icon?: React.ReactNode
    readonly trailingAction?: React.ReactNode
    readonly size?: 'medium' | 'large'
}

export function TldInput({
    label,
    icon,
    trailingAction,
    size = 'medium',
    disabled,
    id,
    ...props
}: TldInputProps): React.ReactElement {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    return (
        <div
            data-size={size}
            className={
                disabled
                    ? 'flex h-10 w-full min-w-0 cursor-not-allowed items-center gap-2 rounded-xl border border-strong bg-surface px-3 opacity-50 data-[size=large]:h-[46px]'
                    : 'flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-strong bg-surface px-3 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-brand focus-within:shadow-md focus-within:shadow-brand/10 focus-within:ring-2 focus-within:ring-brand/10 hover:border-brand motion-reduce:transition-none data-[size=large]:h-[46px]'
            }
        >
            <label className="sr-only" htmlFor={inputId}>
                {label}
            </label>
            {icon}
            <input
                {...props}
                id={inputId}
                disabled={disabled}
                className="w-full min-w-0 flex-1 cursor-text bg-transparent text-label text-primary outline-none placeholder:text-primary/60 disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:cursor-pointer disabled:[&::-webkit-search-cancel-button]:cursor-not-allowed read-only:[&::-webkit-search-cancel-button]:cursor-default"
            />
            {trailingAction}
        </div>
    )
}
