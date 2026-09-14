import type { ReactElement } from 'react'
import type { AwakeningCourse } from '../model/course-items'
import authorIcon from '../assets/author.svg'
import heatIcon from '../assets/heat.svg'
import freeRibbon from '../assets/free.svg'
import vipRibbon from '../assets/vip.svg'
import lifetimeRibbon from '../assets/lifetime.svg'

export function AwakeningCourseCard({
    course,
}: {
    readonly course: AwakeningCourse
}): ReactElement {
    const ribbon =
        course.access === 'free' ? freeRibbon : course.access === 'vip' ? vipRibbon : lifetimeRibbon
    const accessLabel =
        course.access === 'free' ? '免费' : course.access === 'vip' ? 'VIP会员' : '终身VIP'
    return (
        <article className="min-w-0 rounded-xl bg-surface-raised">
            <div className="aspect-[291/186] overflow-hidden rounded-t-xl">
                <img alt="" className="size-full object-cover" src={course.image} loading="lazy" />
            </div>
            <div className="relative flex min-h-[106px] min-w-0 flex-col gap-2 px-2.5 py-2.5">
                <div className="flex min-w-0 gap-2.5 pr-16">
                    <span className="flex h-6 min-w-0 w-[60px] items-center justify-center rounded border border-primary/50 text-label text-secondary">
                        标签
                    </span>
                    <span className="flex h-6 min-w-0 w-[60px] items-center justify-center rounded border border-primary/50 text-label text-secondary">
                        标签
                    </span>
                </div>
                <span className="absolute -right-1 top-2.5 flex h-6 w-[61px] items-center justify-center pl-1 text-caption text-inverse">
                    <img
                        alt=""
                        aria-hidden="true"
                        src={ribbon}
                        className="absolute inset-0 size-full"
                    />
                    <span className="relative">{accessLabel}</span>
                </span>
                <h2
                    className="truncate text-card-title font-medium text-primary"
                    title={course.title}
                >
                    {course.title}
                </h2>
                <div className="mt-auto flex min-w-0 items-center justify-between gap-2 text-label">
                    <span className="flex min-w-0 items-center gap-0.5 text-primary/60">
                        <img
                            alt=""
                            className="size-5 shrink-0 [filter:var(--app-filter-shell-icon)]"
                            src={authorIcon}
                        />
                        <span className="truncate" title={course.author}>
                            {course.author}
                        </span>
                    </span>
                    <span
                        className="flex shrink-0 items-center text-secondary"
                        aria-label={`热度 ${course.heat}`}
                    >
                        <img alt="" className="size-5" src={heatIcon} />
                        {course.heat}
                    </span>
                </div>
            </div>
        </article>
    )
}
