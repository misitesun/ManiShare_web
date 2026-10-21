'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import * as React from 'react'
import type { KeyboardEvent, ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePopoverTrigger } from '../../lib/popover-trigger'
import { TldMovingHighlight } from '../tld-moving-highlight'
import { getSelectMenuGeometry } from './select-menu-position'
import type { SelectMenuGeometry } from './select-menu-position'
import settingsChevronAsset from './assets/settings-chevron.svg'

const settingsChevronSource: string = settingsChevronAsset.src

export interface TldSelectOption {
    readonly value: string
    readonly label: string
}

export interface TldSelectProps {
    readonly label: string
    readonly value: string
    readonly options: readonly TldSelectOption[]
    readonly onValueChange: (value: string) => void
    readonly size?: 'default' | 'settings' | 'practice'
    readonly layout?: 'full' | 'content'
    readonly menuPosition?: 'inline' | 'portal'
    readonly icon?: ReactNode
    readonly open?: boolean
    readonly onOpenChange?: (open: boolean) => void
}

export function TldSelect({
    label,
    value,
    options,
    onValueChange,
    icon,
    size = 'default',
    layout = 'full',
    menuPosition = 'inline',
    open: controlledOpen,
    onOpenChange,
}: TldSelectProps): ReactElement {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const open = controlledOpen ?? uncontrolledOpen
    const [activeOptionValue, setActiveOptionValue] = React.useState<string | null>(null)
    const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
    const [geometry, setGeometry] = React.useState<SelectMenuGeometry | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const id = useId()
    const selected = options.find((option) => option.value === value)
    const initialActiveValue = selected?.value ?? options[0]?.value ?? null
    const shown =
        open && (menuPosition === 'inline' || (portalTarget !== null && geometry !== null))
    const updateOpen = useCallback(
        (nextOpen: boolean): void => {
            if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
            if (nextOpen && menuPosition === 'portal') setGeometry(null)
            if (!nextOpen) setActiveOptionValue(null)
            onOpenChange?.(nextOpen)
        },
        [controlledOpen, menuPosition, onOpenChange],
    )
    const popover = usePopoverTrigger({
        open,
        onOpenChange: updateOpen,
        rootRef,
        panelRef: menuRef,
    })

    useEffect(() => {
        if (menuPosition === 'portal') setPortalTarget(document.body)
    }, [menuPosition])

    useEffect(() => {
        if (menuPosition !== 'portal' || portalTarget === null) return
        if (!open) return
        const trigger = triggerRef.current
        const menu = menuRef.current
        if (!trigger || !menu) return
        function position(): void {
            if (!trigger || !menu) return
            if (trigger.getClientRects().length === 0) {
                updateOpen(false)
                return
            }
            const viewport = window.visualViewport
            const next = getSelectMenuGeometry(
                trigger.getBoundingClientRect(),
                {
                    left: viewport?.offsetLeft ?? 0,
                    top: viewport?.offsetTop ?? 0,
                    width: viewport?.width ?? document.documentElement.clientWidth,
                    height: viewport?.height ?? window.innerHeight,
                },
                { width: menu.scrollWidth, height: menu.scrollHeight },
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
        observer.observe(trigger)
        observer.observe(menu)
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
    }, [menuPosition, open, portalTarget, options, updateOpen])

    useEffect(() => {
        if (!shown || !popover.shouldFocusOnOpen()) return
        const menu = menuRef.current
        const selectedItem = menu?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ;(selectedItem ?? menu?.querySelector<HTMLButtonElement>('button'))?.focus()
    }, [shown, popover.shouldFocusOnOpen])

    useEffect(() => {
        if (!open) return
        function onPointerDown(event: PointerEvent): void {
            if (
                event.target instanceof Node &&
                !rootRef.current?.contains(event.target) &&
                !menuRef.current?.contains(event.target)
            ) {
                updateOpen(false)
                if (
                    size === 'practice' &&
                    (!(event.target instanceof Element) ||
                        !event.target.closest(
                            'button:enabled, a[href], input:enabled, textarea:enabled, select:enabled, summary, [tabindex]:not([tabindex="-1"]):not(:disabled), [contenteditable="true"]',
                        ))
                ) {
                    event.preventDefault()
                    triggerRef.current?.focus()
                }
            }
        }
        function escape(event: globalThis.KeyboardEvent): void {
            if (
                event.key !== 'Escape' ||
                event.isComposing ||
                event.keyCode === 229 ||
                event.defaultPrevented
            )
                return
            if (rootRef.current?.closest('[inert],[aria-hidden="true"]')) return
            event.preventDefault()
            event.stopPropagation()
            const target = event.target
            const inside =
                target instanceof Node &&
                (rootRef.current?.contains(target) || menuRef.current?.contains(target))
            updateOpen(false)
            if (inside) triggerRef.current?.focus({ preventScroll: true })
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', escape, true)
        return (): void => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', escape, true)
        }
    }, [open, size, updateOpen])

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Escape' && open) {
            event.preventDefault()
            event.stopPropagation()
            updateOpen(false)
            triggerRef.current?.focus()
            return
        }
        if (event.key === 'Tab' && open) {
            triggerRef.current?.focus()
            updateOpen(false)
            return
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        if (!open) {
            setActiveOptionValue(initialActiveValue)
            popover.openByKeyboard()
            return
        }
        const buttons = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
        )
        const index = buttons.findIndex((button) => button === document.activeElement)
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        buttons[next]?.focus()
    }

    const menu = (
        <div
            ref={menuRef}
            id={`${id}-menu`}
            role="menu"
            onPointerEnter={popover.onPointerEnter}
            onPointerLeave={popover.onPointerLeave}
            inert={!shown}
            aria-hidden={!shown}
            aria-labelledby={`${id}-trigger`}
            data-select-menu-position={menuPosition}
            style={
                menuPosition === 'portal'
                    ? (geometry ?? { left: 0, top: 0, maxHeight: 256 })
                    : undefined
            }
            className={
                menuPosition === 'portal'
                    ? size === 'practice'
                        ? shown
                            ? 'fixed z-50 isolate w-max overflow-y-auto overscroll-contain rounded-[4px] bg-practice-control-surface p-1 text-practice-control-text opacity-100 shadow-lg transition-opacity duration-150 motion-reduce:transition-none'
                            : 'pointer-events-none fixed z-50 isolate w-max overflow-y-auto overscroll-contain rounded-[4px] bg-practice-control-surface p-1 text-practice-control-text opacity-0 shadow-lg transition-opacity duration-150 motion-reduce:transition-none'
                        : shown
                          ? 'fixed z-50 isolate w-max origin-top translate-y-0 scale-100 overflow-y-auto overscroll-contain rounded-2xl border border-strong bg-canvas/95 p-2 opacity-100 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
                          : 'pointer-events-none fixed z-50 isolate w-max origin-top -translate-y-1 scale-95 overflow-y-auto overscroll-contain rounded-2xl border border-strong bg-canvas/95 p-2 opacity-0 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
                    : size === 'practice'
                      ? open
                          ? 'absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-max overflow-y-auto rounded-[4px] bg-practice-control-surface p-1 text-practice-control-text opacity-100 shadow-lg transition-opacity duration-150 motion-reduce:transition-none'
                          : 'pointer-events-none absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-max overflow-y-auto rounded-[4px] bg-practice-control-surface p-1 text-practice-control-text opacity-0 shadow-lg transition-opacity duration-150 motion-reduce:transition-none'
                      : open
                        ? 'absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-[153px] origin-top translate-y-0 scale-100 overflow-y-auto rounded-2xl border border-strong bg-canvas/95 p-2 opacity-100 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
                        : 'pointer-events-none absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-[153px] origin-top -translate-y-1 scale-95 overflow-y-auto rounded-2xl border border-strong bg-canvas/95 p-2 opacity-0 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
            }
        >
            <TldMovingHighlight
                containerRef={menuRef}
                activeKey={shown ? (activeOptionValue ?? initialActiveValue) : null}
                tone="surface"
            />
            {options.map((option) => (
                <button
                    key={option.value}
                    data-highlight-key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={value === option.value}
                    tabIndex={-1}
                    className={
                        size === 'practice'
                            ? value === option.value
                                ? 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-[3px] px-1 text-left text-[14px] leading-5 font-normal tracking-normal text-practice-control-accent outline-none focus-visible:ring-2 focus-visible:ring-focus xl:min-h-[26px]'
                                : 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-[3px] px-1 text-left text-[14px] leading-5 font-normal tracking-normal text-practice-control-text outline-none focus-visible:ring-2 focus-visible:ring-focus xl:min-h-[26px]'
                            : activeOptionValue === null && value === option.value
                              ? 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-lg bg-surface-raised px-3 py-2 text-left text-label text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus'
                              : 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-label text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus'
                    }
                    onPointerEnter={(): void => setActiveOptionValue(option.value)}
                    onFocus={(): void => setActiveOptionValue(option.value)}
                    onClick={(): void => {
                        onValueChange(option.value)
                        updateOpen(false)
                        triggerRef.current?.focus()
                    }}
                >
                    <span className="relative z-20">{option.label}</span>
                </button>
            ))}
        </div>
    )

    return (
        <div
            ref={rootRef}
            onPointerEnter={popover.onPointerEnter}
            onPointerLeave={popover.onPointerLeave}
            className={
                layout === 'content' ? 'relative inline-flex w-max shrink-0' : 'relative w-full'
            }
            onKeyDown={onKeyDown}
            onBlur={(event): void => {
                const next = event.relatedTarget
                if (
                    open &&
                    (!(next instanceof Node) ||
                        (!event.currentTarget.contains(next) && !menuRef.current?.contains(next)))
                ) {
                    updateOpen(false)
                }
            }}
        >
            <button
                ref={triggerRef}
                id={`${id}-trigger`}
                type="button"
                aria-label={`${label}：${selected?.label ?? '请选择'}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={shown ? `${id}-menu` : undefined}
                className={
                    size === 'practice'
                        ? layout === 'content'
                            ? 'flex min-h-10 w-max cursor-pointer items-center justify-start gap-0 rounded-[4px] border-0 bg-practice-control-surface px-1 text-[14px] leading-5 font-normal tracking-normal text-practice-control-text outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:h-[26px] xl:min-h-[26px]'
                            : 'flex min-h-10 w-full cursor-pointer items-center justify-start gap-0 rounded-[4px] border-0 bg-practice-control-surface pl-1 text-[14px] leading-5 font-normal tracking-normal text-practice-control-text outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:h-[26px] xl:min-h-[26px]'
                        : size === 'settings'
                          ? 'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-foreground/30 bg-canvas px-[10px] text-caption-tight tracking-[0.01em] text-foreground outline-offset-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none'
                          : 'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-strong bg-surface px-3 text-label text-primary outline-offset-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none'
                }
                onClick={(): void => {
                    if (open) {
                        updateOpen(false)
                        return
                    }
                    setActiveOptionValue(initialActiveValue)
                    popover.openByKeyboard()
                }}
            >
                <span className="flex min-w-0 items-center gap-1">
                    {icon}
                    <span className="truncate">{selected?.label ?? '请选择'}</span>
                </span>
                {size === 'settings' || size === 'practice' ? (
                    <img
                        src={settingsChevronSource}
                        alt=""
                        aria-hidden="true"
                        className={
                            open
                                ? 'size-[18px] shrink-0 rotate-180 [filter:var(--app-filter-shell-icon)] transition-transform duration-150 motion-reduce:transition-none'
                                : 'size-[18px] shrink-0 [filter:var(--app-filter-shell-icon)] transition-transform duration-150 motion-reduce:transition-none'
                        }
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        className={
                            open
                                ? 'mb-[-4px] size-2 shrink-0 rotate-[225deg] border-b-2 border-r-2 border-primary/60 transition-transform duration-150 motion-reduce:transition-none'
                                : 'mt-[-4px] size-2 shrink-0 rotate-45 border-b-2 border-r-2 border-primary/60 transition-transform duration-150 motion-reduce:transition-none'
                        }
                    />
                )}
            </button>
            {menuPosition === 'portal'
                ? portalTarget !== null && createPortal(menu, portalTarget)
                : menu}
        </div>
    )
}
