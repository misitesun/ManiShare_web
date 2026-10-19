'use client'

import * as React from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TldButtonSize =
    | 'short'
    | 'compact'
    | 'mini'
    | 'medium'
    | 'large'
    | 'slim'
    | 'slim-tall'
    | 'form'
    | 'plan'
    | 'plan-compact'
    | 'dialog-action'
    | 'dialog-compact'
    | 'dialog-emphasis'
    | 'dialog-slim'
    | 'panel-action'
    | 'form-wide'
export type TldButtonVariant =
    'primary' | 'secondary' | 'outline' | 'muted' | 'solid' | 'subtle' | 'soft'

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
        size === 'dialog-slim'
            ? 'group relative inline-flex h-11 w-full cursor-pointer items-center justify-center whitespace-nowrap overflow-hidden rounded-lg px-2.5 text-action-label-small font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 md:h-8'
            : size === 'dialog-emphasis'
              ? 'group relative inline-flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2.5 text-[18px] font-medium leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
              : size === 'form-wide'
                ? 'group relative inline-flex h-[50px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] px-3 text-action-label-compact font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
                : size === 'dialog-compact'
                  ? 'group relative inline-flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2.5 text-[16px] font-normal leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
                  : size === 'panel-action'
                    ? 'group relative inline-flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] px-3 text-[18px] font-normal leading-[normal] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 dialog:h-[41px]'
                    : size === 'dialog-action'
                      ? 'group relative inline-flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 text-action-label-flat font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
                      : size === 'short'
                        ? 'group relative inline-flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] px-3 text-label-regular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50'
                        : size === 'mini'
                          ? 'group relative inline-flex h-[34px] w-full cursor-pointer items-center justify-center whitespace-nowrap overflow-hidden rounded px-2.5 text-caption-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                          : size === 'plan-compact'
                            ? 'group relative inline-flex h-[50px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl px-3 text-form-action focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                            : size === 'plan'
                              ? 'group relative inline-flex h-[50px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl px-3 text-action-label-compact focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                              : size === 'form'
                                ? 'group relative inline-flex h-[46px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl px-3 text-form-action focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                                : size === 'slim'
                                  ? 'group relative inline-flex h-8 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3 text-action-label-small disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                                  : size === 'slim-tall'
                                    ? 'group relative inline-flex h-[34px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-3 text-action-label-small disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                                    : size === 'compact'
                                      ? 'group relative inline-flex h-8 w-full cursor-pointer items-center justify-center overflow-hidden rounded px-3 text-label disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                                      : size === 'large'
                                        ? 'group relative inline-flex h-[52px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[10px] px-5 text-card-title disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
                                        : 'group relative inline-flex h-[50px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 text-card-title disabled:cursor-not-allowed disabled:opacity-50 data-[variant=subtle]:disabled:opacity-100'
    const decorationClassName =
        variant === 'soft'
            ? size === 'dialog-compact'
                ? 'pointer-events-none absolute inset-0 rounded-[inherit] border border-foreground/40 bg-foreground/20 transition-colors group-hover:bg-foreground/30 motion-reduce:transition-none'
                : 'pointer-events-none absolute inset-0 rounded-[inherit] border border-foreground/40 bg-foreground/10 transition-colors group-hover:bg-foreground/20 motion-reduce:transition-none'
            : variant === 'subtle'
              ? 'pointer-events-none absolute inset-0 rounded-[inherit] border border-trial-action-border bg-trial-action transition-[filter] group-hover:brightness-110 group-disabled:border-trial-action-border-disabled group-disabled:brightness-100 motion-reduce:transition-none'
              : variant === 'solid'
                ? 'pointer-events-none absolute inset-0 rounded-[inherit] bg-accent-green transition-[filter] group-hover:brightness-110 group-disabled:brightness-100 motion-reduce:transition-none'
                : variant === 'outline'
                  ? 'pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r/srgb from-brand-start to-brand-end p-px [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]'
                  : variant === 'muted'
                    ? 'pointer-events-none absolute inset-0 rounded-[inherit] border border-strong bg-button-muted transition-colors group-hover:bg-surface-hover motion-reduce:transition-none'
                    : variant === 'secondary'
                      ? 'pointer-events-none absolute inset-0 rounded-[inherit] border border-strong bg-surface-raised transition-colors group-hover:bg-surface-hover motion-reduce:transition-none'
                      : size === 'short' ||
                          size === 'form' ||
                          size === 'plan' ||
                          size === 'plan-compact' ||
                          size === 'dialog-action' ||
                          size === 'dialog-compact' ||
                          size === 'dialog-emphasis' ||
                          size === 'dialog-slim' ||
                          size === 'panel-action' ||
                          size === 'form-wide'
                        ? 'pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r/srgb from-brand-start to-brand-end transition-[filter] group-hover:brightness-110 group-disabled:brightness-100 motion-reduce:transition-none'
                        : 'pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r from-brand-start to-brand-end transition-[filter] group-hover:brightness-110 group-disabled:brightness-100 motion-reduce:transition-none'
    const contentClassName =
        ((size === 'dialog-action' ||
            size === 'dialog-emphasis' ||
            size === 'panel-action' ||
            size === 'form-wide') &&
            variant === 'primary') ||
        (size === 'dialog-compact' && (variant === 'primary' || variant === 'soft'))
            ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-foreground'
            : variant === 'soft'
              ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-hint'
              : variant === 'subtle'
                ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-primary group-disabled:text-trial-action-disabled'
                : variant === 'outline'
                  ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-login-form-primary'
                  : variant === 'muted'
                    ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-primary'
                    : variant === 'secondary'
                      ? 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-secondary transition-colors group-hover:text-primary motion-reduce:transition-none'
                      : 'relative flex size-full min-w-0 items-center justify-center gap-[5px] text-inverse'

    return (
        <span
            className={
                fullWidth
                    ? 'block w-full'
                    : size === 'form-wide'
                      ? 'inline-block w-[180px] max-w-full'
                      : 'inline-block'
            }
        >
            <button {...buttonProps} data-variant={variant} type={type} className={buttonClassName}>
                {variant === 'outline' && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-login-outline"
                    />
                )}
                <span aria-hidden="true" className={decorationClassName} />
                <span className={contentClassName}>{children}</span>
            </button>
        </span>
    )
}
