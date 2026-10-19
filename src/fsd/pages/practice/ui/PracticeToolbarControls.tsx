'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PracticeFamily } from '../model/practice-demo'
import clockAsset from '../assets/word-toolbar-clock.svg'
import optionsAsset from '../assets/word-toolbar-options.svg'
import arrowAsset from '../assets/word-toolbar-popover-arrow.svg'
import { usePracticePanelMotion } from './usePracticePanelMotion'
import { usePracticeElapsedSeconds } from '../model/usePracticeTimer'
import { formatPracticeElapsedTime } from '../model/practice-timer'
import { getToolbarPopoverPosition } from '../model/practice-toolbar-popover'
import type { ToolbarPopoverPosition } from '../model/practice-toolbar-popover'

type ToolbarFamily = PracticeFamily

export function PracticeToolbarTimer({ family }: { readonly family: ToolbarFamily }): ReactElement {
    const seconds = usePracticeElapsedSeconds()
    const text = formatPracticeElapsedTime(seconds)
    const [hours, minutes, remainingSeconds] = text.split(':')
    return (
        <span
            role="timer"
            aria-live="off"
            data-practice-timer={family}
            data-practice-elapsed-seconds={seconds}
            data-word-timer={family === 'word' ? '' : undefined}
            data-sentence-timer={family === 'sentence' ? '' : undefined}
            data-audio-timer={family === 'audio' ? '' : undefined}
            aria-label={`练习用时：${hours}时${minutes}分${remainingSeconds}秒`}
            className="flex h-10 w-[84px] shrink-0 items-center justify-center gap-[3px] rounded-[4px] bg-practice-control-surface text-[14px] font-normal leading-5 tabular-nums xl:h-[26px]"
        >
            <img
                src={clockAsset.src}
                alt=""
                className="shrink-0 [filter:var(--app-filter-practice-icon)]"
            />
            <span>{text}</span>
        </span>
    )
}

interface PracticeToolbarOptionsProps {
    readonly family: ToolbarFamily
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly children: ReactNode
    readonly portal?: boolean
}

/** 各练习族共用的页内设置浮层；选择状态由各模式所属工具栏持有。 */
export function PracticeToolbarOptions({
    family,
    open,
    onOpenChange,
    children,
    portal = false,
}: PracticeToolbarOptionsProps): ReactElement {
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const floatingRef = useRef<HTMLDivElement>(null)
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    const [position, setPosition] = useState<ToolbarPopoverPosition | null>(null)
    const present = usePracticePanelMotion(panelRef, {
        open,
        ready: !portal || portalTarget !== null,
        direction: 'popover',
    })
    const id = useId()
    const positioned = position !== null

    useEffect(() => {
        if (portal) setPortalTarget(document.body)
    }, [portal])

    useLayoutEffect(() => {
        if (!open || !portal || !portalTarget) return
        const trigger = triggerRef.current
        const floating = floatingRef.current
        if (!trigger || !floating) return
        function updatePosition(): void {
            if (!trigger || !floating) return
            if (trigger.getClientRects().length === 0) {
                onOpenChange(false)
                return
            }
            const viewport = window.visualViewport
            const next = getToolbarPopoverPosition(
                trigger.getBoundingClientRect(),
                floating.getBoundingClientRect().width,
                {
                    left: viewport?.offsetLeft ?? 0,
                    top: viewport?.offsetTop ?? 0,
                    width: viewport?.width ?? document.documentElement.clientWidth,
                    height: viewport?.height ?? window.innerHeight,
                },
            )
            setPosition((previous) =>
                previous?.left === next.left &&
                previous.top === next.top &&
                previous.arrowLeft === next.arrowLeft &&
                previous.maxHeight === next.maxHeight
                    ? previous
                    : next,
            )
        }
        updatePosition()
        const observer = new ResizeObserver(updatePosition)
        observer.observe(trigger)
        observer.observe(floating)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        window.visualViewport?.addEventListener('resize', updatePosition)
        window.visualViewport?.addEventListener('scroll', updatePosition)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
            window.visualViewport?.removeEventListener('resize', updatePosition)
            window.visualViewport?.removeEventListener('scroll', updatePosition)
        }
    }, [open, portal, portalTarget, onOpenChange])

    useEffect(() => {
        if (!open || (portal && !positioned)) return
        panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
        function closeOutside(event: PointerEvent): void {
            if (
                event.target instanceof Node &&
                !rootRef.current?.contains(event.target) &&
                !panelRef.current?.contains(event.target)
            ) {
                onOpenChange(false)
                if (
                    !(event.target instanceof Element) ||
                    !event.target.closest(
                        'button:enabled, a[href], input:enabled, textarea:enabled, select:enabled, summary, [tabindex]:not([tabindex="-1"]):not(:disabled), [contenteditable="true"]',
                    )
                ) {
                    event.preventDefault()
                    triggerRef.current?.focus()
                }
            }
        }
        document.addEventListener('pointerdown', closeOutside)
        return (): void => document.removeEventListener('pointerdown', closeOutside)
    }, [open, onOpenChange, portal, positioned])

    const panel = present && (
        <div
            ref={floatingRef}
            data-practice-options-position={portal ? 'portal' : 'inline'}
            className={
                portal
                    ? 'fixed z-50 w-32 xl:w-16'
                    : 'absolute left-1/2 top-full z-50 mt-[10px] w-32 -translate-x-1/2 xl:w-16'
            }
            style={
                portal
                    ? {
                          left: position?.left,
                          top: position?.top,
                          visibility: position ? 'visible' : 'hidden',
                      }
                    : undefined
            }
        >
            <div
                ref={panelRef}
                id={id}
                role="group"
                aria-label="本模式显示选项"
                aria-hidden={!open}
                inert={!open}
                data-practice-options={family}
                data-word-options={family === 'word' ? '' : undefined}
                data-sentence-options={family === 'sentence' ? '' : undefined}
                data-audio-options={family === 'audio' ? '' : undefined}
                className="relative rounded-[4px] bg-practice-control-surface"
            >
                <span
                    aria-hidden="true"
                    style={{
                        maskImage: `url(${arrowAsset.src})`,
                        maskRepeat: 'no-repeat',
                        left: portal ? position?.arrowLeft : undefined,
                    }}
                    className="pointer-events-none absolute -top-[6px] left-1/2 h-[6px] w-[11px] -translate-x-1/2 bg-practice-control-surface"
                />
                {portal ? (
                    <div
                        data-practice-options-rows
                        className="overflow-y-auto"
                        style={{ maxHeight: position?.maxHeight }}
                    >
                        {children}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    )

    return (
        <div
            ref={rootRef}
            className="relative shrink-0"
            onBlur={(event): void => {
                if (
                    !event.currentTarget.contains(event.relatedTarget) &&
                    !panelRef.current?.contains(event.relatedTarget)
                )
                    onOpenChange(false)
            }}
            onKeyDown={(event): void => {
                if (event.key === 'Tab' && open && portal) {
                    const buttons = Array.from(
                        panelRef.current?.querySelectorAll<HTMLButtonElement>('button:enabled') ??
                            [],
                    )
                    const atBoundary = event.shiftKey
                        ? buttons[0] === event.target
                        : buttons.at(-1) === event.target
                    if (atBoundary) {
                        if (event.shiftKey) event.preventDefault()
                        triggerRef.current?.focus()
                        onOpenChange(false)
                    }
                }
                if (event.key === 'Escape' && open) {
                    event.preventDefault()
                    event.stopPropagation()
                    onOpenChange(false)
                    triggerRef.current?.focus()
                }
            }}
        >
            <button
                ref={triggerRef}
                type="button"
                aria-label="本模式设置"
                aria-expanded={open}
                aria-controls={open ? id : undefined}
                className="flex size-10 cursor-pointer items-center justify-center rounded-[4px] bg-practice-control-surface outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:size-[26px]"
                onClick={(): void => onOpenChange(!open)}
            >
                <img
                    src={optionsAsset.src}
                    alt=""
                    className="shrink-0 [filter:var(--app-filter-practice-icon)]"
                />
            </button>
            {portal ? portalTarget && createPortal(panel, portalTarget) : panel}
        </div>
    )
}

interface PracticeToolbarSegmentProps {
    readonly label: string
    readonly firstLabel: string
    readonly secondLabel: string
    readonly value: boolean
    readonly onChange: (value: boolean) => void
}

export function PracticeToolbarSegment({
    label,
    firstLabel,
    secondLabel,
    value,
    onChange,
}: PracticeToolbarSegmentProps): ReactElement {
    return (
        <div
            role="group"
            aria-label={label}
            className="flex min-h-10 items-center justify-center px-[5px] xl:min-h-6"
        >
            <div className="flex w-full overflow-hidden rounded-[4px] xl:h-4 xl:translate-y-px">
                {[
                    { value: false, label: firstLabel },
                    { value: true, label: secondLabel },
                ].map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        aria-pressed={value === item.value}
                        className={
                            value === item.value
                                ? 'min-h-10 flex-1 cursor-pointer border border-practice-control-accent bg-practice-control-accent text-[12px] font-normal leading-[14px] text-inverse outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-focus xl:min-h-0 xl:text-[10px]'
                                : 'min-h-10 flex-1 cursor-pointer border border-practice-control-accent text-[12px] font-normal leading-[14px] text-practice-control-accent outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-focus xl:min-h-0 xl:text-[10px]'
                        }
                        onClick={(): void => onChange(item.value)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
