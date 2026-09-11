import type { ReactElement } from 'react'
import type { ForeignLanguageCourseItem } from '../model/course-items'

export interface ForeignLanguageCourseCardProps {
    readonly courseItem: ForeignLanguageCourseItem
}

export function ForeignLanguageCourseCard({
    courseItem,
}: ForeignLanguageCourseCardProps): ReactElement {
    return (
        <article className="min-w-0 rounded-xl border border-strong bg-canvas p-3 md:p-4 xl:min-h-[370px] xl:p-[18px]">
            <div className="aspect-[562/250] min-w-0 overflow-hidden rounded-xl">
                <img
                    alt={`${courseItem.title}课程封面`}
                    className="size-full object-cover"
                    src={courseItem.imageSource}
                />
            </div>

            <div className="mt-3 flex min-h-[70px] min-w-0 items-stretch justify-between gap-3">
                <div className="flex min-w-0 flex-col justify-between">
                    <h2 className="truncate text-card-title font-medium text-primary">
                        {courseItem.title}
                    </h2>
                    <ul aria-label={`${courseItem.title}标签`} className="flex flex-wrap gap-2">
                        {courseItem.tags.map((tag, index) => (
                            <li
                                key={`${courseItem.id}-${tag}-${index}`}
                                className="flex h-[30px] min-w-[66px] items-center justify-center rounded-lg border border-strong px-2 text-label text-primary"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between text-right">
                    <p
                        className={
                            courseItem.accessTone === 'gold'
                                ? 'text-label text-warning'
                                : courseItem.accessTone === 'lifetime'
                                  ? 'text-label text-membership-lifetime-text'
                                  : courseItem.accessTone === 'paid'
                                    ? 'text-label text-danger'
                                    : 'text-label text-primary'
                        }
                    >
                        {courseItem.accessLabel}
                    </p>
                    <p className="whitespace-nowrap font-medium text-danger">
                        <span className="text-body">¥</span>
                        <span className="text-card-title xl:min-[1920px]:text-[24px]">
                            {courseItem.price}
                        </span>
                    </p>
                </div>
            </div>
        </article>
    )
}
