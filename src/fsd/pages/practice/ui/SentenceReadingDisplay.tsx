'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { usePopoverTrigger } from '../../../shared/lib/popover-trigger'
import { sentenceReadingDisplayItems } from '../model/sentence-reading-display'
import type { SentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import displayArrow from '../assets/sentence-reading-display-arrow.svg'

interface SentenceReadingDisplayProps {
    readonly values: SentenceReadingDisplayOptions
    readonly blocked: boolean
    readonly onChange: (values: SentenceReadingDisplayOptions) => void
}

export function SentenceReadingDisplay({
    values,
    blocked,
    onChange,
}: SentenceReadingDisplayProps): ReactElement {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const focusOnOpen = useRef(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const id = useId()
    const popover = usePopoverTrigger({ open, onOpenChange: setOpen, rootRef, panelRef })

    useEffect(() => {
        if (blocked && open) setOpen(false)
    }, [blocked, open])

    useEffect(() => {
        if (!open) return
        if (focusOnOpen.current && popover.shouldFocusOnOpen())
            panelRef.current?.querySelector('input')?.focus()
        function closeOutside(event: PointerEvent): void {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target))
                setOpen(false)
        }
        document.addEventListener('pointerdown', closeOutside)
        return (): void => document.removeEventListener('pointerdown', closeOutside)
    }, [open, popover.shouldFocusOnOpen])

    return (
        <div
            ref={rootRef}
            className="relative shrink-0"
            onPointerEnter={blocked ? undefined : popover.onPointerEnter}
            onPointerLeave={popover.onPointerLeave}
            onKeyDown={(event): void => {
                if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
                if (event.key === 'Escape' && open) {
                    event.preventDefault()
                    event.stopPropagation()
                    setOpen(false)
                    triggerRef.current?.focus()
                } else if (
                    event.target === triggerRef.current &&
                    event.key === 'ArrowDown' &&
                    !blocked
                ) {
                    event.preventDefault()
                    focusOnOpen.current = true
                    if (open) panelRef.current?.querySelector('input')?.focus()
                    else popover.openByKeyboard()
                }
            }}
            onBlur={(event): void => {
                const next = event.relatedTarget
                const practiceRoot = event.currentTarget.closest('[data-practice-phase]')
                if (
                    next instanceof Element &&
                    practiceRoot?.contains(next) &&
                    (next === practiceRoot ||
                        next.matches(
                            '[data-practice-answer-input],[data-sentence-reading-viewport]',
                        ))
                )
                    return
                if (!event.currentTarget.contains(next)) setOpen(false)
            }}
        >
            <button
                ref={triggerRef}
                type="button"
                aria-label="阅读显示选项"
                aria-expanded={open}
                aria-controls={id}
                disabled={blocked}
                onClick={(event): void => {
                    focusOnOpen.current = event.detail === 0
                    popover.toggle()
                }}
                className="inline-flex min-h-10 w-[76px] cursor-pointer items-center justify-center gap-0.5 rounded border border-practice-control-text/50 text-body-tight font-normal text-practice-control-text outline-none enabled:hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-40 xl:min-h-[30px]"
            >
                显示
                <img
                    src={displayArrow.src}
                    alt=""
                    width={20}
                    height={20}
                    className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                />
            </button>
            {open && !blocked && (
                <div
                    ref={panelRef}
                    id={id}
                    role="group"
                    aria-label="阅读显示内容"
                    className="absolute right-0 top-full z-50 mt-[10px] flex w-[114px] flex-col items-center gap-[10px] rounded bg-practice-control-surface p-[10px] text-practice-control-text shadow-panel"
                >
                    {sentenceReadingDisplayItems.map((item) => (
                        <label
                            key={item.key}
                            className="flex min-h-10 w-full cursor-pointer items-center gap-[5px] text-label font-normal xl:min-h-5 xl:w-[77px]"
                        >
                            <input
                                type="checkbox"
                                checked={values[item.key]}
                                onChange={(event): void =>
                                    onChange({ ...values, [item.key]: event.currentTarget.checked })
                                }
                                className="size-4 shrink-0 cursor-pointer accent-practice-control-accent focus-visible:outline-2 focus-visible:outline-focus"
                            />
                            {item.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}
