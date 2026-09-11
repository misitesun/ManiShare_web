import type { ReactElement } from 'react'
import sentencesIconSource from '../assets/icons/sentences.svg'
import timeIconSource from '../assets/icons/time.svg'
import wordsIconSource from '../assets/icons/words.svg'

interface LearningMetric {
    readonly iconSource: string
    readonly label: string
    readonly unit: string
    readonly value: string
}

const learningMetrics: readonly LearningMetric[] = [
    { iconSource: sentencesIconSource, label: '完成句子数量', unit: '个', value: '400' },
    { iconSource: wordsIconSource, label: '完成单词数量', unit: '个', value: '390' },
    { iconSource: timeIconSource, label: '练习时长', unit: 'h', value: '8.5' },
]

const rangeLabels = ['总计', '今天', '昨天', '本周', '本月'] as const

export function LearningStats(): ReactElement {
    return (
        <section
            aria-labelledby="learning-stats-title"
            className="min-w-0 rounded-xl border border-strong bg-canvas px-4 py-3 min-[750px]:h-[138px] min-[750px]:min-w-[620px] min-[750px]:overflow-hidden min-[750px]:px-5 min-[750px]:pb-0 min-[750px]:pt-3"
        >
            <h2 id="learning-stats-title" className="sr-only">
                学习统计
            </h2>
            <div className="flex h-7 items-start gap-10 overflow-x-auto text-label text-secondary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rangeLabels.map((label, index) => (
                    <button
                        key={label}
                        type="button"
                        className={
                            index === 0
                                ? 'relative shrink-0 cursor-default bg-linear-to-r from-brand-start to-brand-end bg-clip-text font-medium text-transparent after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-brand'
                                : 'shrink-0 cursor-default text-secondary'
                        }
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="mt-3 flex flex-col items-start gap-3 min-[750px]:mt-2 min-[750px]:flex-row min-[750px]:items-center min-[750px]:justify-between min-[750px]:gap-8 min-[750px]:overflow-hidden min-[750px]:px-5">
                {learningMetrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="flex min-h-14 w-full min-w-0 items-center gap-4 min-[750px]:min-h-0 min-[750px]:w-auto min-[750px]:gap-6"
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-10 shrink-0"
                            src={metric.iconSource}
                        />
                        <div className="min-w-0 text-left min-[750px]:w-[84px] min-[750px]:text-center">
                            <p className="text-label text-secondary">{metric.label}</p>
                            <p className="mt-1 leading-none text-primary">
                                <span className="text-lg font-medium tabular-nums md:text-xl min-[1920px]:text-[22px]">
                                    {metric.value}
                                </span>
                                <span className="text-label">{metric.unit}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
