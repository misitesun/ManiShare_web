import type { ReactElement } from 'react'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import deleteIconSource from '../assets/delete.svg'
import type { LearningProgressItem } from '../model/learning-progress-items'

export interface LearningProgressCardProps {
    readonly item: LearningProgressItem
    readonly onRequestDelete: (item: LearningProgressItem) => void
}

export function LearningProgressCard({
    item,
    onRequestDelete,
}: LearningProgressCardProps): ReactElement {
    const unpracticedChapters = Math.max(0, item.totalChapters - item.practicedChapters)

    return (
        <article className="flex min-w-0 flex-col gap-4 rounded-xl border border-primary/30 p-3 md:h-[250px] md:flex-row md:px-[14px] md:py-[15px]">
            <img
                alt=""
                aria-hidden="true"
                className="aspect-[308/218] w-full rounded-lg object-cover md:h-[218px] md:w-[308px] md:shrink-0"
                src={item.imageSource}
            />

            <div className="flex min-w-0 flex-1 flex-col md:pt-2.5">
                <header className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2
                            className="truncate text-section-title font-medium text-primary"
                            title={item.title}
                        >
                            {item.title}
                        </h2>
                        <p
                            className="mt-2 truncate text-card-title text-primary/60"
                            title={item.description}
                        >
                            {item.description}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label={`删除${item.title}学习进度`}
                        className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md transition-colors hover:bg-danger-surface"
                        onClick={(): void => onRequestDelete(item)}
                    >
                        <img alt="" aria-hidden="true" className="size-6" src={deleteIconSource} />
                    </button>
                </header>

                <div className="mt-6 min-w-0 md:mt-auto md:translate-y-px md:pb-3">
                    <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <span className="inline-flex h-[30px] w-[120px] shrink-0 items-center justify-center rounded-lg border border-success/30 text-label text-success">
                            言灵觉醒-{item.totalChapters}章节
                        </span>
                        <p className="text-label text-primary/60 md:text-body xl:text-right min-[1920px]:text-card-title">
                            已练习章节：
                            <span className="text-primary">{item.practicedChapters}</span>
                            <span aria-hidden="true">｜</span>
                            未练习章节：<span className="text-danger">{unpracticedChapters}</span>
                        </p>
                    </div>
                    <div className="mt-3">
                        <TldProgressBar
                            ariaLabel={`${item.title}章节练习进度`}
                            max={item.totalChapters}
                            showValue={false}
                            size="large"
                            value={item.practicedChapters}
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}
