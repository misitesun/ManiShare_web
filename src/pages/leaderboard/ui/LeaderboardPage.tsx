import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
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
    const periodRef = useRef<HTMLElement>(null)
    const metricRef = useRef<HTMLDivElement>(null)
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
                    ref={periodRef}
                    aria-label="排行榜周期"
                    className="relative isolate grid grid-cols-4 gap-1 rounded-xl border border-primary/30 p-2 md:flex md:h-full md:flex-col md:items-center md:gap-8 md:px-5 md:py-5"
                >
                    <TldMovingHighlight containerRef={periodRef} activeKey={activePeriod} />

                    {periodOptions.map((option) => {
                        const isActive = option.value === activePeriod

                        return (
                            <button
                                key={option.value}
                                data-highlight-key={option.value}
                                type="button"
                                aria-controls="leaderboard-panel"
                                aria-pressed={isActive}
                                className={
                                    isActive
                                        ? 'group relative grid h-10 cursor-pointer place-items-center rounded-lg text-tab-label text-brand outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:h-[46px] md:w-[140px]'
                                        : 'group relative grid h-10 cursor-pointer place-items-center rounded-lg text-tab-label text-muted outline-none transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:h-[46px] md:w-[140px]'
                                }
                                onClick={(): void => selectPeriod(option.value)}
                            >
                                <span
                                    aria-hidden="true"
                                    className={
                                        isActive
                                            ? 'pointer-events-none absolute inset-0 z-0 rounded-[inherit]'
                                            : 'pointer-events-none absolute inset-0 z-0 rounded-[inherit] group-hover:bg-surface-hover'
                                    }
                                />
                                <span className="relative z-20">{option.label}</span>
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
                            ref={metricRef}
                            aria-label="排行指标"
                            className="relative isolate inline-flex h-8 shrink-0 overflow-hidden rounded-full border border-strong bg-canvas"
                            role="group"
                        >
                            <TldMovingHighlight
                                containerRef={metricRef}
                                activeKey={activeMetric}
                                shape={activeMetric === 'duration' ? 'pill-start' : 'pill-end'}
                            />

                            {metricOptions.map((option) => {
                                const isActive = option.value === activeMetric

                                return (
                                    <button
                                        key={option.value}
                                        data-highlight-key={option.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        className={
                                            isActive
                                                ? 'group relative h-full w-20 cursor-pointer text-label text-brand outline-none focus-visible:outline-2 focus-visible:outline-focus'
                                                : 'group relative h-full w-20 cursor-pointer text-label text-muted outline-none transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-focus'
                                        }
                                        onClick={(): void => selectMetric(option.value)}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={
                                                isActive
                                                    ? 'pointer-events-none absolute inset-0 z-0 rounded-[inherit]'
                                                    : 'pointer-events-none absolute inset-0 z-0 rounded-[inherit] group-hover:bg-surface-hover'
                                            }
                                        />
                                        <span className="relative z-20">{option.label}</span>
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
