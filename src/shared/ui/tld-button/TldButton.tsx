import * as React from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TldButtonSize = 'compact' | 'medium' | 'large'
export type TldButtonVariant = 'primary' | 'secondary'

interface TldButtonOwnProps {
    readonly children: ReactNode
    readonly fullWidth?: boolean
    readonly size?: TldButtonSize
    readonly variant?: TldButtonVariant
}

export type TldButtonProps = TldButtonOwnProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>

export function TldButton({
    children,
    fullWidth = false,
    size = 'medium',
    type = 'button',
    variant = 'primary',
    ...buttonProps
}: TldButtonProps): React.ReactElement {
    const buttonClassName =
        size === 'compact'
            ? 'group relative inline-flex h-8 w-full cursor-pointer items-center justify-center overflow-hidden rounded px-3 text-label disabled:cursor-not-allowed disabled:opacity-50'
            : size === 'large'
              ? 'group relative inline-flex h-[52px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] px-5 text-card-title disabled:cursor-not-allowed disabled:opacity-50'
              : 'group relative inline-flex h-[50px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 text-card-title disabled:cursor-not-allowed disabled:opacity-50'
    const decorationClassName =
        variant === 'secondary'
            ? 'pointer-events-none absolute inset-0 rounded-[inherit] border border-strong bg-surface-raised transition-colors group-hover:bg-surface-hover motion-reduce:transition-none'
            : 'pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r from-brand-start to-brand-end transition-[filter] group-hover:brightness-110 group-disabled:brightness-100 motion-reduce:transition-none'
    const contentClassName =
        variant === 'secondary'
            ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-secondary transition-colors group-hover:text-primary motion-reduce:transition-none'
            : 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-inverse'

    return (
        <span className={fullWidth ? 'block w-full' : 'inline-block'}>
            <button {...buttonProps} type={type} className={buttonClassName}>
                <span aria-hidden="true" className={decorationClassName} />
                <span className={contentClassName}>{children}</span>
            </button>
        </span>
    )
}
