import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import {
    currentLeaderboardUser,
    getLeaderboardMetricLabel,
    getLeaderboardPages,
} from '../model/leaderboard-items'
import type { LeaderboardMetric, LeaderboardPeriod } from '../model/leaderboard-items'
import { useLeaderboardPagination } from '../model/useLeaderboardPagination'
import { CurrentUserRow, LeaderboardRow } from './LeaderboardRow'

interface PeriodOption {
    readonly label: string
    readonly value: LeaderboardPeriod
}

interface MetricOption {
    readonly label: string
    readonly value: LeaderboardMetric
}

const periodOptions: readonly PeriodOption[] = [
    { label: '周榜', value: 'week' },
    { label: '月榜', value: 'month' },
    { label: '年榜', value: 'year' },
    { label: '总榜', value: 'all' },
]

const metricOptions: readonly MetricOption[] = [
    { label: '时长排行', value: 'duration' },
    { label: '积分排行', value: 'points' },
]

const leaderboardPages = getLeaderboardPages()

export function LeaderboardPage(): ReactElement {
    const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('week')
    const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('duration')
    const listRef = useRef<HTMLDivElement>(null)
    const { loadNextPage, resetPagination, status, visibleItems } =
        useLeaderboardPagination(leaderboardPages)

    function selectPeriod(period: LeaderboardPeriod): void {
        setActivePeriod(period)
        resetPagination()
        listRef.current?.scrollTo({ top: 0 })
    }

    function selectMetric(metric: LeaderboardMetric): void {
        setActiveMetric(metric)
        resetPagination()
        listRef.current?.scrollTo({ top: 0 })
    }

    return (
        <section
            aria-label="排行榜"
            className="mx-auto h-[calc(100dvh-4rem)] min-w-0 overflow-hidden px-3 py-3 md:px-4 md:py-4 xl:h-[calc(100dvh-5rem)] xl:pb-6 xl:pt-6 xl:min-[1920px]:px-[250px] xl:min-[1920px]:pb-[65px]"
        >
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:grid-rows-1 md:gap-4">
                <nav
                    aria-label="排行榜周期"
                    className="relative grid grid-cols-4 gap-1 rounded-xl border border-primary/30 p-2 md:flex md:h-full md:flex-col md:items-center md:gap-8 md:px-5 md:py-5"
                >
                    <span
                        aria-hidden="true"
                        className={
                            activePeriod === 'week'
                                ? 'pointer-events-none absolute left-2 top-2 z-10 h-10 w-[calc((100%-28px)/4)] translate-x-0 rounded-lg bg-linear-to-r from-brand-start to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none md:left-5 md:top-5 md:h-[46px] md:w-[140px] md:translate-x-0 md:translate-y-0'
                                : activePeriod === 'month'
                                  ? 'pointer-events-none absolute left-2 top-2 z-10 h-10 w-[calc((100%-28px)/4)] translate-x-[calc(100%+4px)] rounded-lg bg-linear-to-r from-brand-start to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none md:left-5 md:top-5 md:h-[46px] md:w-[140px] md:translate-x-0 md:translate-y-[78px]'
                                  : activePeriod === 'year'
                                    ? 'pointer-events-none absolute left-2 top-2 z-10 h-10 w-[calc((100%-28px)/4)] translate-x-[calc(200%+8px)] rounded-lg bg-linear-to-r from-brand-start to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none md:left-5 md:top-5 md:h-[46px] md:w-[140px] md:translate-x-0 md:translate-y-[156px]'
                                    : 'pointer-events-none absolute left-2 top-2 z-10 h-10 w-[calc((100%-28px)/4)] translate-x-[calc(300%+12px)] rounded-lg bg-linear-to-r from-brand-start to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none md:left-5 md:top-5 md:h-[46px] md:w-[140px] md:translate-x-0 md:translate-y-[234px]'
                        }
                    >
                        <span className="block h-full w-full rounded-[7px] bg-canvas" />
                    </span>

                    {periodOptions.map((option) => {
                        const isActive = option.value === activePeriod

                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-controls="leaderboard-panel"
                                aria-pressed={isActive}
                                className={
                                    isActive
                                        ? 'relative z-20 grid h-10 cursor-pointer place-items-center rounded-lg text-tab-label text-brand outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:h-[46px] md:w-[140px]'
                                        : 'relative z-20 grid h-10 cursor-pointer place-items-center rounded-lg text-tab-label text-muted outline-none transition-colors duration-200 hover:bg-surface-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:h-[46px] md:w-[140px]'
                                }
                                onClick={(): void => selectPeriod(option.value)}
                            >
                                {option.label}
                            </button>
                        )
                    })}
                </nav>

                <div
                    id="leaderboard-panel"
                    aria-label={`${periodOptions.find((option) => option.value === activePeriod)?.label ?? '周榜'}学习排行榜`}
                    className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-primary/30"
                >
                    <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-3 border-b border-primary/30 px-4 md:h-[88px] md:px-8">
                        <h1 className="text-section-title font-semibold text-primary">
                            学习排行榜
                        </h1>

                        <div
                            aria-label="排行指标"
                            className="relative inline-flex h-8 shrink-0 overflow-hidden rounded-full border border-strong bg-canvas"
                            role="group"
                        >
                            <span
                                aria-hidden="true"
                                className={
                                    activeMetric === 'duration'
                                        ? 'pointer-events-none absolute -inset-y-px -left-px z-10 w-[calc(50%+1px)] translate-x-0 rounded-l-full rounded-r-none bg-linear-to-b from-brand-start via-accent-blue to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none'
                                        : 'pointer-events-none absolute -inset-y-px -left-px z-10 w-[calc(50%+1px)] translate-x-full rounded-l-none rounded-r-full bg-linear-to-b from-brand-start via-accent-blue to-brand-end p-px transition-all duration-200 ease-out motion-reduce:transition-none'
                                }
                            >
                                <span
                                    className={
                                        activeMetric === 'duration'
                                            ? 'block h-full w-full rounded-l-[999px] rounded-r-none bg-canvas transition-all duration-200 ease-out motion-reduce:transition-none'
                                            : 'block h-full w-full rounded-l-none rounded-r-[999px] bg-canvas transition-all duration-200 ease-out motion-reduce:transition-none'
                                    }
                                />
                            </span>

                            {metricOptions.map((option) => {
                                const isActive = option.value === activeMetric

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        className={
                                            isActive
                                                ? 'relative z-20 h-full w-20 cursor-pointer text-label text-brand outline-none focus-visible:outline-2 focus-visible:outline-focus'
                                                : 'relative z-20 h-full w-20 cursor-pointer text-label text-muted outline-none transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-focus'
                                        }
                                        onClick={(): void => selectMetric(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </header>

                    <div className="grid h-16 shrink-0 grid-cols-[58px_minmax(0,1fr)_auto] items-center px-7 text-body text-muted">
                        <span>排名</span>
                        <span>用户</span>
                        <span className="min-w-20 text-right md:min-w-28">
                            {getLeaderboardMetricLabel(activeMetric)}
                        </span>
                    </div>

                    <div
                        ref={listRef}
                        id="leaderboard-list"
                        className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <ol className="space-y-2.5">
                            {visibleItems.map((entry) => (
                                <LeaderboardRow
                                    key={entry.id}
                                    entry={entry}
                                    metric={activeMetric}
                                />
                            ))}
                        </ol>
                        <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
                    </div>

                    <div className="shrink-0 px-4">
                        <CurrentUserRow user={currentLeaderboardUser} />
                    </div>
                </div>
            </div>
        </section>
    )
}
