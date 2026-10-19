'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TldMovingHighlight } from '../tld-moving-highlight'
import { getDropdownMenuFocusIndex, getDropdownMenuGeometry } from './dropdown-menu'
import type { DropdownMenuGeometry, DropdownMenuNavigationKey } from './dropdown-menu'

export interface TldDropdownMenuItem<Value extends string = string> {
    readonly id: Value
    readonly label: string
    readonly icon?: ReactNode
    readonly expanded?: boolean
    readonly controls?: string
}

export interface TldDropdownMenuProps<Value extends string = string> {
    readonly label: string
    readonly trigger: ReactNode
    readonly items: readonly TldDropdownMenuItem<Value>[]
    readonly onAction: (id: Value) => void
    readonly open?: boolean
    readonly onOpenChange?: (open: boolean) => void
}

export function TldDropdownMenu<Value extends string>({
    label,
    trigger,
    items,
    onAction,
    open: controlledOpen,
    onOpenChange,
}: TldDropdownMenuProps<Value>): ReactElement {
    const id = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const initialFocus = useRef<'first' | 'last'>('first')
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    const [geometry, setGeometry] = useState<DropdownMenuGeometry | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)
    const open = (controlledOpen ?? uncontrolledOpen) && items.length > 0
    const shown = open && geometry !== null
    const updateOpen = useCallback(
        (next: boolean): void => {
            if (controlledOpen === undefined) setUncontrolledOpen(next)
            if (next) setGeometry(null)
            if (!next) setActiveId(null)
            onOpenChange?.(next)
        },
        [controlledOpen, onOpenChange],
    )

    useEffect(() => {
        setPortalTarget(document.body)
    }, [])

    useEffect(() => {
        if (!open || portalTarget === null) return
        const button = triggerRef.current
        if (!button) return
        function position(): void {
            if (!button) return
            if (button.getClientRects().length === 0) {
                updateOpen(false)
                return
            }
            const viewport = window.visualViewport
            const next = getDropdownMenuGeometry(
                button.getBoundingClientRect(),
                {
                    left: viewport?.offsetLeft ?? 0,
                    top: viewport?.offsetTop ?? 0,
                    width: viewport?.width ?? document.documentElement.clientWidth,
                    height: viewport?.height ?? window.innerHeight,
                },
                items.length,
            )
            setGeometry((previous) =>
                previous?.left === next.left &&
                previous.top === next.top &&
                previous.width === next.width &&
                previous.maxHeight === next.maxHeight
                    ? previous
                    : next,
            )
        }
        position()
        const observer = new ResizeObserver(position)
        observer.observe(button)
        window.addEventListener('resize', position)
        window.addEventListener('scroll', position, true)
        window.visualViewport?.addEventListener('resize', position)
        window.visualViewport?.addEventListener('scroll', position)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', position)
            window.removeEventListener('scroll', position, true)
            window.visualViewport?.removeEventListener('resize', position)
            window.visualViewport?.removeEventListener('scroll', position)
        }
    }, [open, portalTarget, items.length, updateOpen])

    useEffect(() => {
        if (!shown || portalTarget === null) return
        const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
        const index = initialFocus.current === 'last' ? (buttons?.length ?? 0) - 1 : 0
        buttons?.[index]?.focus()
    }, [shown, portalTarget])

    useEffect(() => {
        if (!open) return
        function onPointerDown(event: PointerEvent): void {
            if (
                !(event.target instanceof Node) ||
                triggerRef.current?.contains(event.target) ||
                menuRef.current?.contains(event.target)
            )
                return
            updateOpen(false)
            if (
                !(event.target instanceof Element) ||
                !event.target.closest(
                    'button:enabled,a[href],input:enabled,textarea:enabled,select:enabled,summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]',
                )
            ) {
                event.preventDefault()
                triggerRef.current?.focus({ preventScroll: true })
            }
        }
        document.addEventListener('pointerdown', onPointerDown)
        return (): void => document.removeEventListener('pointerdown', onPointerDown)
    }, [open, updateOpen])

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (open) event.stopPropagation()
        if (event.key === 'Escape' && open) {
            event.preventDefault()
            triggerRef.current?.focus({ preventScroll: true })
            updateOpen(false)
            return
        }
        if (event.key === 'Tab' && open) {
            triggerRef.current?.focus({ preventScroll: true })
            updateOpen(false)
            return
        }
        if (
            event.key !== 'ArrowDown' &&
            event.key !== 'ArrowUp' &&
            event.key !== 'Home' &&
            event.key !== 'End'
        )
            return
        event.preventDefault()
        event.stopPropagation()
        const key: DropdownMenuNavigationKey = event.key
        if (!open) {
            initialFocus.current = key === 'ArrowUp' || key === 'End' ? 'last' : 'first'
            updateOpen(true)
            return
        }
        const buttons = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
        )
        const index = buttons.findIndex((button) => button === document.activeElement)
        const next = getDropdownMenuFocusIndex(key, index, buttons.length)
        if (next !== null) buttons[next]?.focus()
    }

    return (
        <div
            className="inline-flex"
            onKeyDown={onKeyDown}
            onBlur={(event): void => {
                const next = event.relatedTarget
                if (
                    open &&
                    (!(next instanceof Node) ||
                        (!triggerRef.current?.contains(next) && !menuRef.current?.contains(next)))
                )
                    updateOpen(false)
            }}
        >
            <button
                ref={triggerRef}
                id={`${id}-trigger`}
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={shown ? `${id}-menu` : undefined}
                disabled={items.length === 0}
                data-dropdown-menu-trigger
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-primary/50 text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(): void => {
                    initialFocus.current = 'first'
                    updateOpen(!open)
                }}
            >
                {trigger}
            </button>
            {portalTarget !== null &&
                createPortal(
                    <div
                        ref={menuRef}
                        id={`${id}-menu`}
                        role="menu"
                        aria-labelledby={`${id}-trigger`}
                        aria-hidden={!shown}
                        inert={!shown}
                        data-dropdown-menu
                        data-dropdown-menu-open={shown}
                        style={geometry ?? { left: 0, top: 0, width: 208, maxHeight: 0 }}
                        className={
                            shown
                                ? 'fixed z-50 isolate origin-top translate-y-0 scale-100 overflow-y-auto overscroll-contain rounded-2xl border border-strong bg-canvas/95 p-2 text-primary opacity-100 shadow-xl backdrop-blur-xl transition-[opacity,translate,scale] duration-150 motion-reduce:transition-none'
                                : 'pointer-events-none fixed z-50 isolate origin-top -translate-y-1 scale-95 overflow-y-auto overscroll-contain rounded-2xl border border-strong bg-canvas/95 p-2 text-primary opacity-0 shadow-xl backdrop-blur-xl transition-[opacity,translate,scale] duration-150 motion-reduce:transition-none'
                        }
                    >
                        <TldMovingHighlight
                            containerRef={menuRef}
                            activeKey={shown ? activeId : null}
                            axis="vertical"
                            tone="surface"
                        />
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                tabIndex={-1}
                                aria-expanded={item.expanded}
                                aria-controls={item.controls}
                                data-dropdown-menu-action={item.id}
                                data-highlight-key={item.id}
                                className="relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-body-tight font-normal text-primary outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                                onPointerEnter={(): void => setActiveId(item.id)}
                                onFocus={(): void => setActiveId(item.id)}
                                onClick={(): void => {
                                    triggerRef.current?.focus({ preventScroll: true })
                                    updateOpen(false)
                                    onAction(item.id)
                                }}
                            >
                                <span className="relative z-20 flex min-w-0 items-center gap-3">
                                    {item.icon}
                                    <span className="truncate">{item.label}</span>
                                </span>
                            </button>
                        ))}
                    </div>,
                    portalTarget,
                )}
        </div>
    )
}
