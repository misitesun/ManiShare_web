'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePopoverTrigger } from '../../../shared/lib/popover-trigger'

interface VideoControlPopoverProps {
    readonly label: string
    readonly trigger: ReactNode
    readonly children: ReactNode
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly wide?: boolean
    readonly layout?: 'options' | 'volume'
}
interface PopoverGeometry {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly maxHeight: number
}

/** 播放器局部选项：Portal避开底栏裁切，悬停不抢焦点。 */
export function VideoControlPopover({
    label,
    trigger,
    children,
    open,
    onOpenChange,
    wide = false,
    layout = 'options',
}: VideoControlPopoverProps): ReactElement {
    const id = useId()
    const root = useRef<HTMLDivElement>(null)
    const button = useRef<HTMLButtonElement>(null)
    const panel = useRef<HTMLDivElement>(null)
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [geometry, setGeometry] = useState<PopoverGeometry | null>(null)
    const latestOpenChange = useRef(onOpenChange)
    latestOpenChange.current = onOpenChange
    const popover = usePopoverTrigger({ open, onOpenChange, rootRef: root, panelRef: panel })
    const shown = open && geometry !== null
    const volumeLayout = layout === 'volume'
    const preferredWidth = volumeLayout ? 80 : wide ? 380 : 240
    useEffect((): void => {
        setTarget(document.body)
    }, [])
    useLayoutEffect(() => {
        if (!open || !target) return
        function position(): void {
            const anchor = button.current
            const menu = panel.current
            if (!anchor || !menu) return
            const viewport = window.visualViewport
            const viewportLeft = viewport?.offsetLeft ?? 0
            const viewportTop = viewport?.offsetTop ?? 0
            const width = Math.min(preferredWidth, (viewport?.width ?? window.innerWidth) - 24)
            const rect = anchor.getBoundingClientRect()
            const viewportHeight = (viewport?.height ?? window.innerHeight) - 24
            const maxHeight = volumeLayout
                ? Math.max(0, Math.min(viewportHeight, rect.top - viewportTop - 22))
                : Math.max(100, viewportHeight)
            const preferredLeft = volumeLayout
                ? rect.left + (rect.width - width) / 2
                : rect.right - width
            const left = Math.max(
                viewportLeft + 12,
                Math.min(
                    preferredLeft,
                    viewportLeft + (viewport?.width ?? window.innerWidth) - width - 12,
                ),
            )
            const top = Math.max(
                viewportTop + 12,
                rect.top - Math.min(menu.scrollHeight, maxHeight) - 10,
            )
            setGeometry((previous) =>
                previous?.left === left &&
                previous.top === top &&
                previous.width === width &&
                previous.maxHeight === maxHeight
                    ? previous
                    : { left, top, width, maxHeight },
            )
        }
        position()
        const observer = new ResizeObserver(position)
        if (panel.current) observer.observe(panel.current)
        if (button.current) observer.observe(button.current)
        window.addEventListener('resize', position)
        window.addEventListener('scroll', position, true)
        window.visualViewport?.addEventListener('resize', position)
        window.visualViewport?.addEventListener('scroll', position)
        function dismiss(event: PointerEvent): void {
            if (
                event.target instanceof Node &&
                !root.current?.contains(event.target) &&
                !panel.current?.contains(event.target)
            )
                latestOpenChange.current(false)
        }
        document.addEventListener('pointerdown', dismiss)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', position)
            window.removeEventListener('scroll', position, true)
            window.visualViewport?.removeEventListener('resize', position)
            window.visualViewport?.removeEventListener('scroll', position)
            document.removeEventListener('pointerdown', dismiss)
        }
    }, [open, target, preferredWidth, volumeLayout])
    const shouldFocusOnOpen = popover.shouldFocusOnOpen
    useEffect(() => {
        if (shown && shouldFocusOnOpen())
            panel.current
                ?.querySelector<HTMLElement>('button,input')
                ?.focus({ preventScroll: true })
    }, [shown, shouldFocusOnOpen])
    return (
        <div
            ref={root}
            className="relative shrink-0"
            onPointerEnter={popover.onPointerEnter}
            onPointerLeave={popover.onPointerLeave}
        >
            <button
                ref={button}
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-controls={id}
                className="flex min-h-10 min-w-10 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1 text-[12px] text-practice-muted hover:bg-primary/10 hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus md:min-h-11"
                onClick={popover.toggle}
                onKeyDown={(event): void => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault()
                        event.stopPropagation()
                        popover.openByKeyboard()
                    }
                }}
            >
                {trigger}
            </button>
            {target &&
                createPortal(
                    <div
                        id={id}
                        ref={panel}
                        data-practice-options
                        role="group"
                        aria-label={label}
                        aria-hidden={!shown}
                        inert={!shown}
                        data-video-popover-open={shown}
                        className={
                            shown
                                ? 'fixed z-[80] isolate origin-bottom translate-y-0 scale-100 overflow-y-auto overscroll-contain rounded-[18px] border border-strong bg-surface-raised p-3 text-foreground opacity-100 transition-[opacity,translate,scale] duration-150 motion-reduce:transition-none'
                                : 'pointer-events-none fixed z-[80] isolate origin-bottom translate-y-1 scale-95 overflow-y-auto overscroll-contain rounded-[18px] border border-strong bg-surface-raised p-3 text-foreground opacity-0 transition-[opacity,translate,scale] duration-150 motion-reduce:transition-none'
                        }
                        style={geometry ?? { width: preferredWidth }}
                        onPointerEnter={popover.onPointerEnter}
                        onPointerLeave={popover.onPointerLeave}
                        onKeyDown={(event): void => {
                            if (event.key === 'Escape') {
                                event.preventDefault()
                                event.stopPropagation()
                                onOpenChange(false)
                                button.current?.focus()
                            }
                            if (
                                (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
                                !(event.target instanceof HTMLInputElement)
                            ) {
                                const options = Array.from(
                                    panel.current?.querySelectorAll<HTMLElement>(
                                        'button:not(:disabled),input:not(:disabled)',
                                    ) ?? [],
                                )
                                const index = options.indexOf(
                                    document.activeElement instanceof HTMLElement
                                        ? document.activeElement
                                        : (options[0] ?? document.body),
                                )
                                const next =
                                    options[
                                        (index +
                                            (event.key === 'ArrowDown' ? 1 : -1) +
                                            options.length) %
                                            options.length
                                    ]
                                if (next) {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    next.focus()
                                }
                            }
                        }}
                    >
                        {children}
                    </div>,
                    target,
                )}
        </div>
    )
}
