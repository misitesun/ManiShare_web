import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { arenaRankings, demoRankEntries, rankValue } from '../model/demo-lobby'
import type { ArenaRankEntry } from '../model/demo-lobby'
import { isArenaRanking } from '../model/lobby-state'
import type { ArenaRanking as ArenaRankingValue } from '../model/lobby-state'
import firstPodium from '../assets/podium-first.svg'
import secondPodium from '../assets/podium-second.svg'
import thirdPodium from '../assets/podium-third.svg'
import firstTop from '../assets/podium-first-top.png'
import secondTop from '../assets/podium-second-top-1def67.png'
import thirdTop from '../assets/podium-third-top.png'
import firstLabel from '../assets/top-first.png'
import secondLabel from '../assets/top-second-2a6f96.png'
import thirdLabel from '../assets/top-third-3d9582.png'

const podiumAssets = [
    { base: firstPodium.src, top: firstTop.src, label: firstLabel.src },
    { base: secondPodium.src, top: secondTop.src, label: secondLabel.src },
    { base: thirdPodium.src, top: thirdTop.src, label: thirdLabel.src },
] as const

interface PodiumEntryProps {
    readonly entry: ArenaRankEntry
    readonly position: number
    readonly ranking: ArenaRankingValue
}

interface ArenaRankingProps {
    readonly ranking: ArenaRankingValue
    readonly onRankingChange: (value: ArenaRankingValue) => void
}

function PodiumEntry({ entry, position, ranking }: PodiumEntryProps): ReactElement | null {
    const asset = podiumAssets[position]
    if (asset === undefined) return null
    return (
        <>
            <span
                aria-hidden="true"
                className={
                    position === 0
                        ? 'absolute z-20 left-[32.04%] top-[21.72%] aspect-[150/173] w-[36.4%] bg-contain bg-no-repeat'
                        : position === 1
                          ? 'absolute left-[1.46%] top-[41.18%] aspect-[132/130] w-[32.04%] bg-contain bg-no-repeat'
                          : 'absolute left-[66.75%] top-[41.18%] aspect-[132/130] w-[32.04%] bg-contain bg-no-repeat'
                }
                style={{ backgroundImage: `url(${asset.base})` }}
            />
            <img
                alt=""
                aria-hidden="true"
                src={asset.top}
                className={
                    position === 0
                        ? 'absolute z-30 left-[28.64%] top-[8.6%] aspect-[178/60] w-[43.2%] object-cover max-w-none'
                        : position === 1
                          ? 'absolute z-10 left-0 top-[30.32%] aspect-[144/48] w-[34.95%] object-cover max-w-none'
                          : 'absolute z-10 left-[65.05%] top-[30.32%] aspect-[144/48] w-[34.95%] object-cover max-w-none'
                }
            />
            <img
                alt={`${entry.name}的头像`}
                src={entry.avatar}
                width={56}
                height={56}
                className={
                    position === 0
                        ? 'absolute z-40 left-[43.45%] top-0 aspect-square w-[13.6%] rounded-full object-cover'
                        : position === 1
                          ? 'absolute z-40 left-[11.65%] top-[19.46%] aspect-square w-[13.6%] rounded-full object-cover'
                          : 'absolute z-40 left-[76.94%] top-[20.36%] aspect-square w-[13.6%] rounded-full object-cover'
                }
            />
            <img
                alt={`TOP ${position + 1}`}
                src={asset.label}
                className={
                    position === 0
                        ? 'absolute z-50 left-[40.29%] top-[19.46%] aspect-[81/29] w-[19.66%] object-cover'
                        : position === 1
                          ? 'absolute z-50 left-[11.89%] top-[41.63%] aspect-[53/18] w-[12.86%] object-fill'
                          : 'absolute z-50 left-[77.43%] top-[41.63%] aspect-[52/18] w-[12.62%] object-fill'
                }
            />
            <p
                className={
                    position === 0
                        ? 'absolute z-40 left-[32.04%] top-[35.75%] w-[36.4%] truncate text-center text-caption-tight font-medium text-media-ink @min-[400px]/podium:text-label-regular'
                        : position === 1
                          ? 'absolute z-40 left-[2.43%] top-[52.94%] w-[32.04%] truncate text-center text-caption-tight font-medium text-media-ink @min-[400px]/podium:text-label-regular'
                          : 'absolute z-40 left-[67.72%] top-[52.94%] w-[32.04%] truncate text-center text-caption-tight font-medium text-media-ink @min-[400px]/podium:text-label-regular'
                }
                title={entry.name}
            >
                {entry.name}
            </p>
            <span
                className={
                    position === 0
                        ? 'absolute z-40 left-[32.04%] top-[45.7%] flex w-[36.4%] justify-center'
                        : position === 1
                          ? 'absolute z-40 left-[2.43%] top-[63.8%] flex w-[32.04%] justify-center'
                          : 'absolute z-40 left-[67.72%] top-[63.35%] flex w-[32.04%] justify-center'
                }
            >
                <TldMembershipBadge label={entry.membership} tone={entry.tone} size="podium" />
            </span>
            <p
                className={
                    position === 0
                        ? 'absolute z-40 left-[32.04%] top-[60.63%] w-[36.4%] text-center text-caption-tight font-medium tracking-[0.01em] text-podium-first-value @min-[400px]/podium:text-label-regular'
                        : position === 1
                          ? 'absolute z-40 left-[2.43%] top-[77.37%] w-[32.04%] text-center text-caption-tight font-medium tracking-[0.01em] text-podium-second-value @min-[400px]/podium:text-label-regular'
                          : 'absolute z-40 left-[67.72%] top-[77.37%] w-[32.04%] text-center text-caption-tight font-medium tracking-[0.01em] text-podium-third-value @min-[400px]/podium:text-label-regular'
                }
            >
                {rankValue(entry, ranking)}
            </p>
        </>
    )
}

export function ArenaRanking({ ranking, onRankingChange }: ArenaRankingProps): ReactElement {
    return (
        <aside
            aria-label="PK排行榜"
            className="min-w-0 rounded-xl border border-foreground/30 bg-canvas px-[11px] pb-[21px] pt-[18px]"
        >
            <h2 className="mb-[19px] text-center text-section-title-display font-medium tracking-[0.01em] text-foreground">
                排行榜
            </h2>
            <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-full bg-linear-to-r/srgb from-brand-start to-brand-end p-px">
                <TldSegmentedTabs
                    appearance="outlined"
                    ariaLabel="PK排行指标"
                    items={arenaRankings}
                    value={ranking}
                    semantics="filter"
                    size="compact"
                    onValueChange={(value): void => {
                        if (isArenaRanking(value)) onRankingChange(value)
                    }}
                />
            </div>
            <div
                aria-label={`${arenaRankings.find(({ id }) => id === ranking)?.label ?? '胜利榜'}前三名`}
                className="relative isolate @container/podium mx-auto mt-[27px] aspect-[412/221] w-full max-w-[412px] -translate-x-px"
            >
                {demoRankEntries.slice(0, 3).map((entry, position) => (
                    <PodiumEntry
                        key={entry.id}
                        entry={entry}
                        position={position}
                        ranking={ranking}
                    />
                ))}
            </div>
            <ol
                start={4}
                aria-label="PK榜单第四至十二名"
                className="relative -mt-[19px] flex flex-col gap-3"
            >
                {demoRankEntries.slice(3).map((entry, index) => (
                    <li
                        key={entry.id}
                        className={
                            index === 4
                                ? 'mt-[3px] flex h-[54px] min-w-0 items-center rounded-xl bg-surface-raised px-[10px]'
                                : 'flex h-[54px] min-w-0 items-center rounded-xl bg-surface-raised px-[10px]'
                        }
                    >
                        <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-foreground text-[10px] leading-[14px] font-medium tracking-[0.01em] text-surface-recessed">
                            {index + 4}
                        </span>
                        <img
                            alt=""
                            aria-hidden="true"
                            src={entry.avatar}
                            width={30}
                            height={30}
                            className={
                                index === 0
                                    ? 'ml-[6px] h-[30px] w-[28.55px] shrink-0 rounded-[17px] object-cover'
                                    : 'ml-[6px] size-[30px] shrink-0 rounded-[17px] object-cover'
                            }
                        />
                        <div className="ml-1 flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="truncate text-label-regular font-medium text-foreground">
                                {entry.name}
                            </p>
                            <div className="flex h-[18px] items-center">
                                <TldMembershipBadge
                                    label={entry.membership}
                                    tone={entry.tone}
                                    size="micro"
                                />
                            </div>
                        </div>
                        <span className="ml-2 shrink-0 text-caption-tight tracking-[0.01em] text-foreground">
                            {rankValue(entry, ranking)}
                        </span>
                    </li>
                ))}
            </ol>
        </aside>
    )
}
