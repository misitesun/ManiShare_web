'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import { homeStatsRanges, homeStatsSamples, isHomeStatsRange } from '../model/home-interactions'
import type { HomeStatsRange, HomeStatsValues } from '../model/home-interactions'
import sentencesAsset from '../assets/redesign/stat-sentences.svg'
import wordsAsset from '../assets/redesign/stat-words.svg'
import timeAsset from '../assets/redesign/stat-time.svg'
import sentenceErrorsAsset from '../assets/redesign/stat-sentence-errors.svg'
import wordErrorsAsset from '../assets/redesign/stat-word-errors.svg'
import daysAsset from '../assets/redesign/stat-days.svg'
interface LearningMetric {
    readonly id: keyof HomeStatsValues
    readonly iconSource: string
    readonly label: string
    readonly unit: string
}
const learningMetrics: readonly LearningMetric[] = [
    { id: 'sentences', iconSource: sentencesAsset.src, label: '完成句子数量', unit: '个' },
    { id: 'words', iconSource: wordsAsset.src, label: '完成单词数量', unit: '个' },
    { id: 'hours', iconSource: timeAsset.src, label: '练习时长', unit: 'h' },
    { id: 'sentenceErrors', iconSource: sentenceErrorsAsset.src, label: '句子错题本', unit: '个' },
    { id: 'wordErrors', iconSource: wordErrorsAsset.src, label: '单词错题本', unit: '个' },
    { id: 'checkinDays', iconSource: daysAsset.src, label: '打卡天数', unit: '天' },
]
export function LearningStats(): ReactElement {
    const [range, setRange] = useState<HomeStatsRange>('total')
    const values = homeStatsSamples[range]
    return (
        <section
            aria-labelledby="learning-stats-title"
            className="min-w-0 rounded-xl border border-strong bg-canvas px-4 py-3 xl:min-[1440px]:h-[214px]"
        >
            <h2 id="learning-stats-title" className="sr-only">
                学习统计
            </h2>
            <div className="min-w-0 overflow-x-auto md:[&_[role=group]]:h-7 [&_button]:text-label [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TldSegmentedTabs
                    ariaLabel="学习统计范围"
                    semantics="filter"
                    variant="underline"
                    layout="content"
                    gap="standard"
                    size="compact"
                    showBaseline={false}
                    activeTextTone="gradient"
                    indicatorTone="brand-start"
                    indicatorWidth={23}
                    value={range}
                    items={homeStatsRanges}
                    onValueChange={(value): void => {
                        if (isHomeStatsRange(value)) setRange(value)
                    }}
                />
            </div>
            <dl
                aria-live="polite"
                aria-label={
                    (homeStatsRanges.find(({ id }) => id === range)?.label ?? '') + '学习统计'
                }
                className="mt-4 grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-y-7 xl:min-[1440px]:gap-y-6 xl:min-[1920px]:px-6"
            >
                {learningMetrics.map((metric) => (
                    <div
                        key={metric.id}
                        className="flex min-w-0 items-center gap-3 xl:min-[1920px]:gap-6"
                    >
                        <img
                            src={metric.iconSource}
                            alt=""
                            aria-hidden="true"
                            className="w-10 shrink-0"
                        />
                        <div className="min-w-0 md:text-center">
                            <dt className="whitespace-nowrap text-label text-muted">
                                {metric.label}
                            </dt>
                            <dd className="mt-1 leading-none text-primary">
                                <span className="text-card-title font-medium tabular-nums xl:min-[1920px]:text-[22px]">
                                    {values[metric.id]}
                                </span>
                                <span className="text-label">{metric.unit}</span>
                            </dd>
                        </div>
                    </div>
                ))}
            </dl>
        </section>
    )
}
