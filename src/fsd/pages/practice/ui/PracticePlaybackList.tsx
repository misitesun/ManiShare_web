'use client'

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import closeAsset from '../assets/video-listening/close.svg'
import type { PracticePlaybackListContent } from '../model/practice-playback-list'

/** 视频时间戳与看图题号共用展示；不创建媒体、不改变题目顺序。 */
export function PracticePlaybackList({
    content,
    currentIndex,
    open,
    heardIds = [],
    onSelect,
    onClose,
}: {
    readonly content: PracticePlaybackListContent
    readonly currentIndex: number
    readonly open: boolean
    readonly heardIds?: readonly string[] | undefined
    readonly onSelect: (index: number) => void
    readonly onClose: () => void
}): ReactElement {
    const list = useRef<HTMLUListElement>(null)
    useEffect((): void => {
        const container = list.current
        const active = container?.querySelector('[aria-current="true"]')
        if (!open || !container || !active) return
        const bounds = container.getBoundingClientRect()
        const row = active.getBoundingClientRect()
        if (row.top < bounds.top) container.scrollTop += row.top - bounds.top
        else if (row.bottom > bounds.bottom) container.scrollTop += row.bottom - bounds.bottom
    }, [open, currentIndex])
    return (
        <section
            aria-label={content.label}
            data-practice-playback-list
            className="flex h-full min-h-0 flex-col rounded-2xl bg-surface-raised/70 p-4 text-foreground"
        >
            <header className="mb-[14px] flex h-6 shrink-0 items-center justify-between gap-3">
                <h2 className="text-[16px] font-medium leading-6">{content.title}</h2>
                <button
                    type="button"
                    aria-label={content.closeLabel}
                    className="grid size-7 cursor-pointer place-items-center rounded focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={onClose}
                >
                    <img
                        src={closeAsset.src}
                        alt=""
                        className="[filter:var(--app-filter-shell-icon)]"
                    />
                </button>
            </header>
            <ul
                ref={list}
                className="min-h-0 flex-1 space-y-[14px] overflow-y-auto overscroll-contain"
            >
                {content.entries.map((entry, index) => (
                    <li key={entry.id}>
                        <button
                            type="button"
                            aria-current={currentIndex === index ? 'true' : undefined}
                            data-active={currentIndex === index}
                            className="flex min-h-[72px] w-full cursor-pointer items-start gap-2 rounded-lg border border-transparent bg-primary/5 px-[10px] py-[10px] text-left data-[active=true]:border-brand data-[active=true]:bg-brand/5 focus-visible:outline-2 focus-visible:outline-focus"
                            onClick={(): void => onSelect(index)}
                        >
                            <span
                                data-active={currentIndex === index}
                                className="shrink-0 text-[14px] leading-[22px] tabular-nums text-practice-muted data-[active=true]:text-brand"
                            >
                                {entry.marker}
                            </span>
                            <span className="flex min-w-0 flex-col gap-[10px]">
                                <span className="text-[16px] font-medium leading-[22px]">
                                    {entry.english}
                                </span>
                                <span className="text-[14px] leading-5 text-practice-muted">
                                    {entry.translation}
                                </span>
                            </span>
                            {heardIds.includes(entry.id) && <span className="sr-only">已听完</span>}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
