import { useEffect, useId, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TldButton } from '../tld-button'
import closeIconSource from './assets/close.svg'
import { canDismissTldDialog } from './dialog-behavior'

const focusableElementSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

export type TldDialogSize = 'small' | 'medium' | 'large'

export interface TldDialogProps {
    readonly cancelLabel?: string
    readonly children?: ReactNode
    readonly closeLabel?: string
    readonly closeOnBackdrop?: boolean
    readonly closeOnConfirm?: boolean
    readonly closeOnEscape?: boolean
    readonly confirmDisabled?: boolean
    readonly confirmLabel?: string
    readonly content?: ReactNode
    readonly onCancel?: () => void
    readonly onConfirm?: () => void
    readonly onOpenChange: (open: boolean) => void
    readonly open: boolean
    readonly showCancelButton?: boolean
    readonly showConfirmButton?: boolean
    readonly showHeader?: boolean
    readonly size?: TldDialogSize
    readonly title: ReactNode
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableElementSelector)).filter(
        (element) => element.getAttribute('aria-hidden') !== 'true',
    )
}

export function TldDialog({
    cancelLabel = '取消',
    children,
    closeLabel = '关闭对话框',
    closeOnBackdrop = true,
    closeOnConfirm = true,
    closeOnEscape = true,
    confirmDisabled = false,
    confirmLabel = '确认',
    content,
    onCancel,
    onConfirm,
    onOpenChange,
    open,
    showCancelButton = true,
    showConfirmButton = true,
    showHeader = true,
    size = 'large',
    title,
}: TldDialogProps): ReactElement | null {
    const titleId = useId()
    const contentId = useId()
    const dialogRef = useRef<HTMLDivElement>(null)
    const onOpenChangeRef = useRef(onOpenChange)
    const bodyContent = children === undefined ? content : children
    const hasBodyContent = bodyContent !== undefined && bodyContent !== null
    const showActions = showCancelButton || showConfirmButton
    const dialogFrameClassName =
        size === 'small'
            ? 'max-h-[calc(100dvh-24px)] w-full max-w-[420px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[220px] md:max-h-[calc(100dvh-48px)]'
            : size === 'medium'
              ? 'max-h-[calc(100dvh-24px)] w-full max-w-[576px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[280px] md:max-h-[calc(100dvh-48px)]'
              : 'max-h-[calc(100dvh-24px)] w-full max-w-[742px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[320px] md:max-h-[calc(100dvh-48px)]'

    useEffect(() => {
        onOpenChangeRef.current = onOpenChange
    }, [onOpenChange])

    useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined

        const dialog = dialogRef.current
        if (dialog === null) return undefined

        const previouslyFocusedElement =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        const previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const focusFrame = window.requestAnimationFrame((): void => dialog.focus())
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (
                event.key === 'Escape' &&
                canDismissTldDialog('escape', {
                    closeOnBackdrop,
                    closeOnEscape,
                })
            ) {
                event.preventDefault()
                onOpenChangeRef.current(false)
                return
            }

            if (event.key !== 'Tab') return

            const focusableElements = getFocusableElements(dialog)
            const firstFocusableElement = focusableElements[0]
            const lastFocusableElement = focusableElements.at(-1)
            if (firstFocusableElement === undefined || lastFocusableElement === undefined) {
                event.preventDefault()
                dialog.focus()
                return
            }

            const activeElement = document.activeElement
            if (
                event.shiftKey &&
                (activeElement === firstFocusableElement || !dialog.contains(activeElement))
            ) {
                event.preventDefault()
                lastFocusableElement.focus()
                return
            }

            if (!event.shiftKey && activeElement === lastFocusableElement) {
                event.preventDefault()
                firstFocusableElement.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return (): void => {
            window.cancelAnimationFrame(focusFrame)
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousBodyOverflow
            if (previouslyFocusedElement?.isConnected === true) previouslyFocusedElement.focus()
        }
    }, [closeOnBackdrop, closeOnEscape, open])

    if (!open || typeof document === 'undefined') return null

    function closeDialog(): void {
        onOpenChange(false)
    }

    function handleBackdropPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        if (event.target !== event.currentTarget) return
        if (!canDismissTldDialog('backdrop', { closeOnBackdrop, closeOnEscape })) return
        closeDialog()
    }

    function handleCancel(): void {
        onCancel?.()
        closeDialog()
    }

    function handleConfirm(): void {
        onConfirm?.()
        if (closeOnConfirm) closeDialog()
    }

    return createPortal(
        <div
            className="fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-dialog-overlay p-3 backdrop-blur-[2px] md:p-6"
            onPointerDown={handleBackdropPointerDown}
        >
            <div className={dialogFrameClassName}>
                <div
                    ref={dialogRef}
                    aria-describedby={hasBodyContent ? contentId : undefined}
                    aria-labelledby={titleId}
                    aria-modal="true"
                    className="relative flex max-h-[calc(100dvh-26px)] min-h-[inherit] flex-col overflow-hidden rounded-[11px] bg-linear-to-r from-dialog-surface via-dialog-surface-accent to-dialog-surface text-primary outline-none md:max-h-[calc(100dvh-50px)]"
                    role="dialog"
                    tabIndex={-1}
                >
                    <button
                        type="button"
                        aria-label={closeLabel}
                        className="absolute right-3 top-3 z-10 grid size-10 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-surface-hover md:right-4 md:top-4"
                        onClick={closeDialog}
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className={
                                showHeader
                                    ? 'size-7 [filter:var(--app-filter-dialog-icon)]'
                                    : 'size-6 [filter:var(--app-filter-dialog-icon)]'
                            }
                            src={closeIconSource}
                        />
                    </button>

                    {showHeader ? (
                        <header className="shrink-0 px-4 pb-3 pr-16 pt-4 md:px-6 md:pb-5 md:pr-20 md:pt-6">
                            <h2
                                id={titleId}
                                className="text-xl font-medium leading-7 md:text-[22px]"
                            >
                                {title}
                            </h2>
                        </header>
                    ) : (
                        <h2 id={titleId} className="sr-only">
                            {title}
                        </h2>
                    )}

                    <div
                        id={hasBodyContent ? contentId : undefined}
                        className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 text-body text-secondary md:px-6 md:pb-6"
                    >
                        {bodyContent}
                    </div>

                    {showActions ? (
                        <footer className="flex shrink-0 items-center justify-center gap-3 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
                            {showCancelButton ? (
                                <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                                    <TldButton
                                        fullWidth
                                        size="large"
                                        variant="secondary"
                                        onClick={handleCancel}
                                    >
                                        {cancelLabel}
                                    </TldButton>
                                </div>
                            ) : null}
                            {showConfirmButton ? (
                                <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                                    <TldButton
                                        fullWidth
                                        size="large"
                                        disabled={confirmDisabled}
                                        onClick={handleConfirm}
                                    >
                                        {confirmLabel}
                                    </TldButton>
                                </div>
                            ) : null}
                        </footer>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    )
}
