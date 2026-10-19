'use client'

import { memo, useEffect, useState, useId, useRef } from 'react'
import type {
    CSSProperties,
    PointerEvent as ReactPointerEvent,
    ReactElement,
    ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { TldButton } from '../tld-button'
import closeIconSourceAsset from './assets/close.svg'
import compactCloseAsset from './assets/close-compact.svg'
import {
    canDismissTldDialog,
    dismissTldDialogBackdrop,
    getDialogTabTarget,
} from './dialog-behavior'
import type { DialogFocusPosition } from './dialog-behavior'
import { canRestoreDialogFocus, isTopDialogLayer, registerDialogLayer } from './dialog-runtime'
import { useTldDialogMotionEnabled } from './TldDialogMotionProvider'
import { useTldDialogMotion } from './useTldDialogMotion'

/** 退场期间保留最后一帧内容，父层清空overlay/表单时不闪成空窗。 */
const DialogPresentation = memo(
    function DialogPresentation({
        children,
    }: {
        readonly open: boolean
        readonly children: ReactElement
    }): ReactElement {
        return children
    },
    (_previous, next): boolean => !next.open,
)

const closeIconSource: string = closeIconSourceAsset.src

const focusableElementSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

export type TldDialogSize =
    | 'small'
    | 'medium'
    | 'large'
    | 'extra-large'
    | 'fit-medium'
    | 'fit-wide'
    | 'fit-extra-wide'
    | 'full'

export interface TldDialogReferenceFrame {
    readonly width: number
    readonly offsetX: number
    readonly offsetY: number
}

interface DialogFrameStyle extends CSSProperties {
    '--dialog-fit-width': string
    '--dialog-reference-offset-x': string
    '--dialog-reference-offset-y': string
}

export interface TldDialogProps {
    readonly referenceFrame?: TldDialogReferenceFrame
    readonly surface?: 'gradient' | 'solid'
    readonly titleTone?: 'default' | 'soft'
    readonly density?: 'standard' | 'compact'
    readonly headerSpacing?: 'standard' | 'tight'
    readonly showCloseButton?: boolean
    readonly cancelLabel?: string
    readonly children?: ReactNode
    readonly closeLabel?: string
    readonly closeOnBackdrop?: boolean
    readonly closeOnConfirm?: boolean
    readonly closeOnEscape?: boolean
    readonly confirmDisabled?: boolean
    readonly confirmLabel?: string
    readonly content?: ReactNode
    readonly footer?: ReactNode
    readonly titleAlignment?: 'start' | 'center'
    readonly onCancel?: () => void
    readonly onConfirm?: () => void
    readonly onOpenChange: (open: boolean) => void
    readonly onAfterClose?: () => void
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
    referenceFrame,
    surface = 'gradient',
    titleTone = 'default',
    density = 'standard',
    headerSpacing = 'standard',
    showCloseButton = true,
    cancelLabel = '取消',
    children,
    closeLabel = '关闭对话框',
    closeOnBackdrop = true,
    closeOnConfirm = true,
    closeOnEscape = true,
    confirmDisabled = false,
    confirmLabel = '确认',
    content,
    footer,
    titleAlignment = 'start',
    onCancel,
    onConfirm,
    onOpenChange,
    onAfterClose,
    open,
    showCancelButton = true,
    showConfirmButton = true,
    showHeader = true,
    size = 'large',
    title,
}: TldDialogProps): ReactElement | null {
    const titleId = useId()
    const contentId = useId()
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    useEffect(() => {
        setPortalTarget(document.body)
    }, [])
    const dialogRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const motionFrameRef = useRef<HTMLDivElement>(null)
    const motionEnabled = useTldDialogMotionEnabled()
    const present = useTldDialogMotion(layerRef, motionFrameRef, {
        open,
        ready: portalTarget !== null,
        enabled: motionEnabled,
        onAfterClose,
    })
    const onOpenChangeRef = useRef(onOpenChange)
    const bodyContent = children === undefined ? content : children
    const hasBodyContent = bodyContent !== undefined && bodyContent !== null
    const showActions =
        footer !== undefined ? footer !== null : showCancelButton || showConfirmButton
    const frameStyle: DialogFrameStyle | undefined =
        size === 'fit-extra-wide' && referenceFrame !== undefined
            ? {
                  '--dialog-fit-width': `${referenceFrame.width}px`,
                  '--dialog-reference-offset-x': `${referenceFrame.offsetX}px`,
                  '--dialog-reference-offset-y': `${referenceFrame.offsetY}px`,
              }
            : undefined
    const dialogFrameClassName =
        size === 'full'
            ? 'max-h-[calc(100dvh-24px)] w-full rounded-xl bg-dialog-border p-px shadow-panel md:max-h-[calc(100dvh-48px)]'
            : size === 'fit-extra-wide'
              ? 'max-h-[calc(100dvh-24px)] w-full max-w-[var(--dialog-fit-width,819px)] rounded-xl bg-dialog-border p-px shadow-panel md:max-h-[calc(100dvh-48px)] design:translate-x-[var(--dialog-reference-offset-x,-0.5px)] design:translate-y-[clamp(calc(50%_+_24px_-_50dvh),var(--dialog-reference-offset-y,-0.5px),calc(50dvh_-_50%_-_24px))]'
              : size === 'fit-medium'
                ? 'max-h-[calc(100dvh-24px)] w-full max-w-[470px] rounded-xl bg-dialog-border p-px shadow-panel md:max-h-[calc(100dvh-48px)]'
                : size === 'fit-wide'
                  ? 'max-h-[calc(100dvh-24px)] w-full max-w-[563px] rounded-xl bg-dialog-border p-px shadow-panel md:max-h-[calc(100dvh-48px)]'
                  : size === 'small'
                    ? 'max-h-[calc(100dvh-24px)] w-full max-w-[420px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[220px] md:max-h-[calc(100dvh-48px)]'
                    : size === 'medium'
                      ? 'max-h-[calc(100dvh-24px)] w-full max-w-[576px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[280px] md:max-h-[calc(100dvh-48px)]'
                      : size === 'extra-large'
                        ? 'max-h-[calc(100dvh-24px)] w-full max-w-[802px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[320px] md:max-h-[calc(100dvh-48px)]'
                        : 'max-h-[calc(100dvh-24px)] w-full max-w-[742px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px shadow-panel md:min-h-[320px] md:max-h-[calc(100dvh-48px)]'

    useEffect(() => {
        onOpenChangeRef.current = onOpenChange
    }, [onOpenChange])

    useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined

        const dialog = dialogRef.current
        const layer = layerRef.current
        if (dialog === null || layer === null) return undefined

        const previouslyFocusedElement =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        const releaseLayer = registerDialogLayer(layer)

        const focusFrame = window.requestAnimationFrame((): void => {
            if (isTopDialogLayer(layer)) dialog.focus()
        })
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (!isTopDialogLayer(layer)) return
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
            const activeElement = document.activeElement
            const position: DialogFocusPosition =
                activeElement === dialog
                    ? 'frame'
                    : !dialog.contains(activeElement)
                      ? 'outside'
                      : activeElement === firstFocusableElement &&
                          activeElement === lastFocusableElement
                        ? 'only'
                        : activeElement === firstFocusableElement
                          ? 'first'
                          : activeElement === lastFocusableElement
                            ? 'last'
                            : 'inside'
            const target = getDialogTabTarget(
                position,
                event.shiftKey,
                firstFocusableElement !== undefined,
            )
            if (target !== null) {
                event.preventDefault()
                if (target === 'frame') dialog.focus()
                else if (target === 'first') firstFocusableElement?.focus()
                else lastFocusableElement?.focus()
            }
        }
        const handleFocusIn = (event: FocusEvent): void => {
            if (!isTopDialogLayer(layer)) return
            if (event.target instanceof Node && !dialog.contains(event.target)) dialog.focus()
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('focusin', handleFocusIn)
        return (): void => {
            window.cancelAnimationFrame(focusFrame)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('focusin', handleFocusIn)
            const wasTop = releaseLayer()
            if (
                wasTop &&
                previouslyFocusedElement?.isConnected === true &&
                canRestoreDialogFocus(previouslyFocusedElement)
            )
                previouslyFocusedElement.focus()
        }
    }, [closeOnBackdrop, closeOnEscape, open, portalTarget])

    if (!present || portalTarget === null) return null

    function closeDialog(): void {
        onOpenChange(false)
    }

    function handleBackdropPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        if (layerRef.current === null || !isTopDialogLayer(layerRef.current)) return
        dismissTldDialogBackdrop(event, { closeOnBackdrop, closeOnEscape }, closeDialog)
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
            ref={layerRef}
            data-tld-dialog-layer
            data-dialog-open={open}
            aria-hidden={!open || undefined}
            className={
                open
                    ? 'fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-dialog-overlay p-3 backdrop-blur-[2px] md:p-6'
                    : 'pointer-events-none fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-dialog-overlay p-3 backdrop-blur-[2px] md:p-6'
            }
            onPointerDown={handleBackdropPointerDown}
        >
            <div
                ref={motionFrameRef}
                data-tld-dialog-motion
                inert={!open}
                className="flex w-full justify-center"
            >
                <DialogPresentation open={open}>
                    <div className={dialogFrameClassName} style={frameStyle}>
                        <div
                            ref={dialogRef}
                            aria-describedby={hasBodyContent ? contentId : undefined}
                            aria-labelledby={titleId}
                            aria-modal="true"
                            className={
                                surface === 'solid'
                                    ? 'relative flex max-h-[calc(100dvh-26px)] min-h-[inherit] flex-col overflow-hidden rounded-[11px] bg-dialog-surface text-primary outline-none md:max-h-[calc(100dvh-50px)]'
                                    : size === 'fit-extra-wide'
                                      ? 'relative flex max-h-[calc(100dvh-26px)] min-h-[inherit] flex-col overflow-hidden rounded-[11px] bg-linear-to-r/srgb from-dialog-surface via-dialog-surface-accent to-dialog-surface text-primary outline-none md:max-h-[calc(100dvh-50px)]'
                                      : 'relative flex max-h-[calc(100dvh-26px)] min-h-[inherit] flex-col overflow-hidden rounded-[11px] bg-linear-to-r from-dialog-surface via-dialog-surface-accent to-dialog-surface text-primary outline-none md:max-h-[calc(100dvh-50px)]'
                            }
                            role="dialog"
                            tabIndex={-1}
                        >
                            {showCloseButton ? (
                                <button
                                    type="button"
                                    aria-label={closeLabel}
                                    className={
                                        density === 'compact'
                                            ? headerSpacing === 'tight'
                                                ? 'absolute right-[7px] top-[7px] z-10 grid size-10 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-surface-hover'
                                                : 'absolute right-[5px] top-[9px] z-10 grid size-10 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-surface-hover'
                                            : 'absolute right-3 top-3 z-10 grid size-10 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-surface-hover md:right-4 md:top-4'
                                    }
                                    onClick={closeDialog}
                                >
                                    <img
                                        alt=""
                                        aria-hidden="true"
                                        className={
                                            density === 'compact'
                                                ? 'size-5 [filter:var(--app-filter-dialog-icon)]'
                                                : showHeader
                                                  ? 'size-7 [filter:var(--app-filter-dialog-icon)]'
                                                  : 'size-6 [filter:var(--app-filter-dialog-icon)]'
                                        }
                                        src={
                                            density === 'compact'
                                                ? compactCloseAsset.src
                                                : closeIconSource
                                        }
                                    />
                                </button>
                            ) : null}

                            {showHeader ? (
                                <header
                                    className={
                                        density === 'compact'
                                            ? headerSpacing === 'tight'
                                                ? 'shrink-0 border-b border-subtle px-[13px] pb-[14px] pr-14 pt-[13px]'
                                                : 'shrink-0 border-b border-subtle px-[15px] pb-[15.5px] pr-14 pt-[15px]'
                                            : titleAlignment === 'center'
                                              ? 'shrink-0 px-16 pb-3 pt-4 text-center md:px-20 md:pb-5 md:pt-6'
                                              : 'shrink-0 px-4 pb-3 pr-16 pt-4 md:px-6 md:pb-5 md:pr-20 md:pt-6'
                                    }
                                >
                                    <h2
                                        id={titleId}
                                        className={
                                            density === 'compact'
                                                ? titleTone === 'soft'
                                                    ? 'text-xl font-medium leading-7 text-dialog-title-soft'
                                                    : 'text-xl font-medium leading-7'
                                                : 'text-xl font-medium leading-7 md:text-[22px]'
                                        }
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
                                className={
                                    density === 'compact'
                                        ? 'min-h-0 flex-1 overflow-y-auto text-body-tight text-secondary'
                                        : 'min-h-0 flex-1 overflow-y-auto px-4 pb-5 text-body text-secondary md:px-6 md:pb-6'
                                }
                            >
                                {bodyContent}
                            </div>

                            {showActions ? (
                                <footer className="flex shrink-0 items-center justify-center gap-3 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
                                    {footer !== undefined ? (
                                        footer
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </footer>
                            ) : null}
                        </div>
                    </div>
                </DialogPresentation>
            </div>
        </div>,
        portalTarget,
    )
}
