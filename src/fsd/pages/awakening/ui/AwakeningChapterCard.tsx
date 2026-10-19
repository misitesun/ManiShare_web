'use client'

import type { ReactElement } from 'react'
import type { AwakeningChapter } from '../model/course-detail'
import { getAwakeningPracticeEntry } from '../model/course-detail'
import clockAsset from '../assets/detail/clock.svg'
import calendarAsset from '../assets/detail/calendar.svg'
import lockAsset from '../assets/detail/lock.svg'
import corner0Asset from '../assets/detail/chapter-corner-0.svg'
import corner1Asset from '../assets/detail/chapter-corner-1.svg'
import corner2Asset from '../assets/detail/chapter-corner-2.svg'
import corner3Asset from '../assets/detail/chapter-corner-3.svg'
import corner4Asset from '../assets/detail/chapter-corner-4.svg'
import corner5Asset from '../assets/detail/chapter-corner-5.svg'
import corner6Asset from '../assets/detail/chapter-corner-6.svg'
import icon0Asset from '../assets/detail/chapter-type-0.svg'
import icon1Asset from '../assets/detail/chapter-type-1.svg'
import icon2Asset from '../assets/detail/chapter-type-2.svg'
import icon3Asset from '../assets/detail/chapter-type-3.svg'
import icon4Asset from '../assets/detail/chapter-type-4.svg'
import icon5Asset from '../assets/detail/chapter-type-5.svg'
import icon6Asset from '../assets/detail/chapter-type-6.svg'
import pictureWordCornerAsset from '../assets/detail/chapter-corner-picture-word.png'
import pictureWordIconAsset from '../assets/detail/chapter-type-picture-word.png'

const clock: string = clockAsset.src
const calendar: string = calendarAsset.src
const lock: string = lockAsset.src
const corner0: string = corner0Asset.src
const corner1: string = corner1Asset.src
const corner2: string = corner2Asset.src
const corner3: string = corner3Asset.src
const corner4: string = corner4Asset.src
const corner5: string = corner5Asset.src
const corner6: string = corner6Asset.src
const icon0: string = icon0Asset.src
const icon1: string = icon1Asset.src
const icon2: string = icon2Asset.src
const icon3: string = icon3Asset.src
const icon4: string = icon4Asset.src
const icon5: string = icon5Asset.src
const icon6: string = icon6Asset.src
const decorations: Partial<Record<AwakeningChapter['kind'], readonly [string, string]>> = {
    0: [corner0, icon0],
    1: [corner1, icon3],
    2: [corner2, icon5],
    3: [corner3, icon1],
    4: [corner4, icon4],
    5: [corner5, icon6],
    6: [corner6, icon2],
    'picture-word': [pictureWordCornerAsset.src, pictureWordIconAsset.src],
}

export function AwakeningChapterCard({
    chapter,
    onOpen,
}: {
    readonly chapter: AwakeningChapter
    readonly onOpen: () => void
}): ReactElement {
    const pictureWord = chapter.kind === 'picture-word'
    const decoration = decorations[chapter.kind]
    const entry = getAwakeningPracticeEntry(chapter)
    return (
        <article
            data-awakening-chapter-card
            data-chapter-number={chapter.number}
            data-chapter-kind={chapter.kind}
            className="relative min-h-[162px] min-w-0 rounded-xl border border-strong px-[22px] pb-3 pt-6"
        >
            <button
                type="button"
                data-practice-chapter-entry
                data-word-chapter-entry={entry.selectorFamily === 'word' ? '' : undefined}
                aria-label={
                    entry.selectorFamily === null
                        ? `第${chapter.number}章：进入${entry.label}`
                        : `第${chapter.number}章：选择${entry.label}模式`
                }
                aria-describedby={chapter.locked ? `${chapter.id}-demo-access` : undefined}
                aria-haspopup={entry.selectorFamily === null ? undefined : 'dialog'}
                title={chapter.locked ? 'VIP标识仅作展示，本地演示可体验' : undefined}
                onClick={onOpen}
                className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none hover:ring-1 hover:ring-brand focus-visible:ring-2 focus-visible:ring-focus"
            />
            {decoration ? (
                <span
                    aria-hidden={pictureWord ? undefined : true}
                    role={pictureWord ? 'img' : undefined}
                    aria-label={pictureWord ? '看图学词' : undefined}
                    title={pictureWord ? '看图学词' : undefined}
                    className="absolute -left-px -top-px h-[41px] w-[45px] overflow-hidden rounded-tl-xl"
                >
                    <img alt="" src={decoration[0]} className="absolute inset-0 size-full" />
                    <img alt="" src={decoration[1]} className="absolute left-1 top-1 size-[18px]" />
                </span>
            ) : (
                <span
                    className={
                        chapter.kind === 7
                            ? 'absolute -left-px -top-px rounded-br rounded-tl bg-accent-orange px-3 py-0.5 text-caption text-inverse'
                            : chapter.kind === 8
                              ? 'absolute -left-px -top-px rounded-br rounded-tl bg-danger px-3 py-0.5 text-caption text-inverse'
                              : chapter.kind === 9
                                ? 'absolute -left-px -top-px rounded-br rounded-tl bg-accent-blue px-3 py-0.5 text-caption text-inverse'
                                : 'absolute -left-px -top-px rounded-br rounded-tl bg-brand-start px-3 py-0.5 text-caption text-inverse'
                    }
                >
                    {typeof chapter.kind === 'number'
                        ? ['图片', '视频', '音频', '文章'][chapter.kind - 7]
                        : undefined}
                </span>
            )}
            <span className="absolute right-1.5 top-1 rounded bg-surface-raised px-2 text-caption text-secondary">
                #{chapter.number}
            </span>
            <h2 className="text-body leading-snug text-primary">
                The first lesson of College English - Section 1
            </h2>
            <p className="mt-1.5 text-label text-primary/60">大学英语第一课第一节</p>
            {chapter.locked && (
                <span
                    id={`${chapter.id}-demo-access`}
                    aria-label="VIP章节标识仅作展示，本地演示可体验"
                    title="VIP标识仅作展示，本地演示可体验"
                    className="absolute right-0 top-1/2 flex h-7 w-8 -translate-y-1/2 flex-col items-center rounded-l-lg bg-surface-hover text-[8px] text-secondary"
                >
                    <img alt="" src={lock} className="size-3" />
                    VIP
                    <span className="sr-only">章节标识仅作展示，本地演示可体验</span>
                </span>
            )}
            <div className="mt-1.5 flex items-center gap-2 text-caption">
                <span className="flex items-center gap-1 text-accent-green">
                    <img alt="" src={clock} className="size-4" />
                    6分钟
                </span>
                <span className="flex items-center gap-1 text-accent-blue">
                    <img alt="" src={calendar} className="size-4" />
                    3天前
                </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-caption text-brand-start">
                <span className="rounded bg-brand-start/15 px-2 py-1">最近学习</span>
                <span className="rounded bg-brand-start/15 px-2 py-1">下次复习（2026-09-10）</span>
            </div>
        </article>
    )
}
