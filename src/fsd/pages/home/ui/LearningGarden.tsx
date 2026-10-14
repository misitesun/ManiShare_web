'use client'

import type { ReactElement } from 'react'
import { useState } from 'react'
import { Tooltip, TooltipGroup } from '../../../shared/ui/tooltip'
import calendarIconSourceAsset from '../assets/icons/calendar.svg'
import chevronLeftIconSourceAsset from '../assets/icons/chevron-left.svg'
import { gardenDays, gardenStageSources } from '../model/home-data'
import { calendarMonthDays, initialGardenMonth, moveGardenMonth } from '../model/home-interactions'

const calendarIconSource: string = calendarIconSourceAsset.src
const chevronLeftIconSource: string = chevronLeftIconSourceAsset.src

export function LearningGarden(): ReactElement {
    const [month, setMonth] = useState(initialGardenMonth)
    const days = gardenDays.slice(0, calendarMonthDays(month))
    return (
        <section
            aria-labelledby="learning-garden-title"
            className="flex h-[214px] min-w-0 flex-col overflow-hidden rounded-xl border border-strong bg-canvas px-4 pt-3 xl:min-[1440px]:h-full xl:min-[1440px]:min-h-[214px]"
        >
            <div className="flex items-center justify-between">
                <h2
                    id="learning-garden-title"
                    className="flex items-center gap-2 text-section-title font-medium text-primary"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-6 [filter:var(--app-filter-shell-icon)]"
                        src={calendarIconSource}
                    />
                    {month.year}-{String(month.month).padStart(2, '0')}
                </h2>
                <div className="flex h-6 overflow-hidden rounded border border-strong bg-surface-raised">
                    <button
                        type="button"
                        aria-label="上个月"
                        onClick={(): void => setMonth((current) => moveGardenMonth(current, -1))}
                        className="grid w-8 cursor-pointer place-items-center border-r border-strong focus-visible:outline-2 focus-visible:outline-focus"
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-4 [filter:var(--app-filter-shell-icon)]"
                            src={chevronLeftIconSource}
                        />
                    </button>
                    <button
                        type="button"
                        aria-label="下个月"
                        onClick={(): void => setMonth((current) => moveGardenMonth(current, 1))}
                        className="grid w-8 cursor-pointer place-items-center focus-visible:outline-2 focus-visible:outline-focus"
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-4 rotate-180 [filter:var(--app-filter-shell-icon)]"
                            src={chevronLeftIconSource}
                        />
                    </button>
                </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-2 [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin] xl:min-[1440px]:flex xl:min-[1440px]:min-h-0 xl:min-[1440px]:flex-1 xl:min-[1440px]:items-end">
                <TooltipGroup>
                    <div
                        aria-label="月度学习日期"
                        className="flex w-full min-w-[1138px] items-end justify-between gap-1"
                    >
                        {days.map((entry) => {
                            const source = gardenStageSources[entry.stage] ?? gardenStageSources[0]
                            const tooltipText =
                                entry.minutes === 0 ? '没有学习' : `学习时长：${entry.minutes}分钟`

                            return (
                                <Tooltip key={entry.day} content={tooltipText} placement="top">
                                    <button
                                        type="button"
                                        aria-label={`${month.year}年${month.month}月${entry.day}日，${tooltipText}`}
                                        className="flex h-[135px] w-8 shrink-0 cursor-pointer flex-col items-center justify-end rounded focus-visible:outline-2 focus-visible:outline-focus"
                                    >
                                        <span className="flex h-[106px] items-end justify-center">
                                            <img
                                                alt=""
                                                aria-hidden="true"
                                                className={
                                                    entry.stage === 0
                                                        ? 'h-9 max-w-10 object-contain'
                                                        : entry.stage === 1
                                                          ? 'h-11 max-w-10 object-contain'
                                                          : entry.stage === 2
                                                            ? 'h-12 max-w-10 object-contain'
                                                            : entry.stage === 3
                                                              ? 'h-14 max-w-10 object-contain'
                                                              : entry.stage === 4
                                                                ? 'h-16 max-w-10 object-contain'
                                                                : entry.stage === 5
                                                                  ? 'h-[68px] max-w-10 object-contain'
                                                                  : entry.stage === 6
                                                                    ? 'h-[72px] max-w-10 object-contain'
                                                                    : entry.stage === 7
                                                                      ? 'h-[78px] max-w-11 object-contain'
                                                                      : 'h-[84px] max-w-12 object-contain'
                                                }
                                                src={source}
                                            />
                                        </span>
                                        <span className="mt-1 text-body text-primary tabular-nums">
                                            {String(entry.day).padStart(2, '0')}
                                        </span>
                                    </button>
                                </Tooltip>
                            )
                        })}
                    </div>
                </TooltipGroup>
            </div>
        </section>
    )
}
