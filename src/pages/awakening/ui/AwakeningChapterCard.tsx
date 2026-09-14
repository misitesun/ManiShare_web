import type { ReactElement } from 'react'
import type { AwakeningChapter } from '../model/course-detail'
import clock from '../assets/detail/clock.svg'
import calendar from '../assets/detail/calendar.svg'
import lock from '../assets/detail/lock.svg'
import corner0 from '../assets/detail/chapter-corner-0.svg'
import corner1 from '../assets/detail/chapter-corner-1.svg'
import corner2 from '../assets/detail/chapter-corner-2.svg'
import corner3 from '../assets/detail/chapter-corner-3.svg'
import corner4 from '../assets/detail/chapter-corner-4.svg'
import corner5 from '../assets/detail/chapter-corner-5.svg'
import corner6 from '../assets/detail/chapter-corner-6.svg'
import icon0 from '../assets/detail/chapter-type-0.svg'
import icon1 from '../assets/detail/chapter-type-1.svg'
import icon2 from '../assets/detail/chapter-type-2.svg'
import icon3 from '../assets/detail/chapter-type-3.svg'
import icon4 from '../assets/detail/chapter-type-4.svg'
import icon5 from '../assets/detail/chapter-type-5.svg'
import icon6 from '../assets/detail/chapter-type-6.svg'

const decorations = [
    [corner0, icon0],
    [corner1, icon3],
    [corner2, icon5],
    [corner3, icon1],
    [corner4, icon4],
    [corner5, icon6],
    [corner6, icon2],
] as const

export function AwakeningChapterCard({
    chapter,
}: {
    readonly chapter: AwakeningChapter
}): ReactElement {
    const decoration = decorations[chapter.kind]
    return (
        <article className="relative min-h-[162px] min-w-0 rounded-xl border border-strong px-[22px] pb-3 pt-6">
            {decoration ? (
                <span
                    aria-hidden="true"
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
                    {['图片', '视频', '音频', '文章'][chapter.kind - 7]}
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
                    aria-label="VIP章节"
                    className="absolute right-0 top-1/2 flex h-7 w-8 -translate-y-1/2 flex-col items-center rounded-l-lg bg-surface-hover text-[8px] text-secondary"
                >
                    <img alt="" src={lock} className="size-3" />
                    VIP
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
