'use client'
import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import type { TldMembershipTone } from '../../../shared/ui/tld-membership-badge'
import firstAvatar from '../assets/redesign/avatar-first.png'
import secondAvatar from '../assets/redesign/avatar-second.png'
import thirdAvatar from '../assets/redesign/avatar-third.png'
import firstBeam from '../assets/redesign/podium-first-beam.svg'
import secondBeam from '../assets/redesign/podium-second-beam.svg'
import thirdBeam from '../assets/redesign/podium-third-beam.svg'
import firstTop from '../assets/redesign/podium-first-top.svg'
import secondTop from '../assets/redesign/podium-second-top.svg'
import thirdTop from '../assets/redesign/podium-third-top.svg'
import { leaderboardEntries } from '../model/home-data'
interface StarEntry {
    readonly place: 'first' | 'second' | 'third'
    readonly name: string
    readonly time: string
    readonly level: string
    readonly label: string
    readonly membership: TldMembershipTone
    readonly avatar: string
    readonly beam: string
    readonly top: string
}
const podiumEntries: readonly StarEntry[] = [
    {
        place: 'second',
        name: '艾琳',
        time: '5小时30分钟',
        level: 'Lv9词启',
        label: '黄金VIP',
        membership: 'gold',
        avatar: secondAvatar.src,
        beam: secondBeam.src,
        top: secondTop.src,
    },
    {
        place: 'first',
        name: '啷个哩个啷',
        time: '6小时44分钟',
        level: 'Lv2初音',
        label: '终身VIP',
        membership: 'lifetime',
        avatar: firstAvatar.src,
        beam: firstBeam.src,
        top: firstTop.src,
    },
    {
        place: 'third',
        name: 'charles',
        time: '5小时27分钟',
        level: 'Lv99言御',
        label: '漫奇天使',
        membership: 'angel',
        avatar: thirdAvatar.src,
        beam: thirdBeam.src,
        top: thirdTop.src,
    },
]
function LeaderboardPodium(): ReactElement {
    return (
        <div
            aria-label="前三名：啷个哩个啷、艾琳、charles"
            className="absolute inset-x-0 top-[92px] mx-auto grid h-[273px] max-w-[462px] grid-cols-3"
        >
            {podiumEntries.map((entry) => (
                <div key={entry.place} className="relative min-w-0">
                    <div
                        aria-hidden="true"
                        className={
                            entry.place === 'first'
                                ? 'absolute left-1/2 top-[-5px] h-[250px] w-[164px] -translate-x-1/2 origin-top scale-[0.75] @min-[400px]:scale-[0.9] @min-[460px]:scale-100'
                                : entry.place === 'second'
                                  ? 'absolute left-1/2 top-5 h-[250px] w-[164px] -translate-x-1/2 origin-top scale-[0.75] @min-[400px]:scale-[0.9] @min-[460px]:scale-100'
                                  : 'absolute left-1/2 top-7 h-[250px] w-[164px] -translate-x-1/2 origin-top scale-[0.75] @min-[400px]:scale-[0.9] @min-[460px]:scale-100'
                        }
                    >
                        <img
                            src={entry.beam}
                            alt=""
                            width={164}
                            height={134}
                            className="absolute left-0 top-0"
                        />
                        <div
                            className={
                                entry.place === 'first'
                                    ? 'absolute left-[18px] top-[112px] h-[143px] w-[128px] bg-linear-to-b from-home-star-first to-transparent'
                                    : entry.place === 'second'
                                      ? 'absolute left-[18px] top-[127px] h-[118px] w-[128px] bg-linear-to-b from-home-star-second to-transparent'
                                      : 'absolute left-[18px] top-[121px] h-[124px] w-[128px] bg-linear-to-b from-home-star-third to-transparent'
                            }
                        />
                        <img
                            src={entry.top}
                            alt=""
                            width={128}
                            height={40}
                            className={
                                entry.place === 'first'
                                    ? 'absolute left-[18px] top-[92px]'
                                    : entry.place === 'second'
                                      ? 'absolute left-[18px] top-[107px]'
                                      : 'absolute left-[18px] top-[101px]'
                            }
                        />
                    </div>
                    <div
                        className={
                            entry.place === 'first'
                                ? 'relative flex min-w-0 flex-col items-center px-1 pt-[37px]'
                                : 'relative flex min-w-0 flex-col items-center px-1 pt-[77px]'
                        }
                    >
                        <img
                            src={entry.avatar}
                            alt={entry.name + '的头像'}
                            width={50}
                            height={50}
                            className="size-[50px] rounded-full object-cover"
                        />
                        <div className="-mt-[13px]">
                            <TldMembershipBadge
                                size="compact"
                                label={entry.label}
                                tone={entry.membership}
                            />
                        </div>
                        <p className="mt-0.5 max-w-full truncate text-label font-medium text-media-foreground">
                            {entry.name}
                        </p>
                        <p
                            className={
                                entry.place === 'first'
                                    ? 'mt-[18px] whitespace-nowrap text-label text-home-star-first-text'
                                    : entry.place === 'second'
                                      ? 'mt-[18px] whitespace-nowrap text-label text-home-star-second-text'
                                      : 'mt-[18px] whitespace-nowrap text-label text-home-star-third-text'
                            }
                        >
                            {entry.time}
                        </p>
                        <p
                            className={
                                entry.place === 'first'
                                    ? 'mt-1 text-caption font-semibold text-danger'
                                    : entry.place === 'second'
                                      ? 'mt-1 text-caption font-semibold text-accent-orange'
                                      : 'mt-1 text-caption font-semibold text-home-rank-blue'
                            }
                        >
                            {entry.level}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
export function Leaderboard(): ReactElement {
    return (
        <aside
            aria-labelledby="leaderboard-title"
            className="@container flex h-auto min-w-0 flex-col overflow-hidden rounded-xl border border-strong bg-canvas lg:h-[968px] xl:min-[1440px]:h-full"
        >
            <div className="relative h-[312px] shrink-0">
                <h2
                    id="leaderboard-title"
                    className="relative pt-8 text-center text-[22px] font-medium tracking-[0.01em] text-primary md:text-[26px] xl:text-[30px]"
                >
                    今日星光榜
                </h2>
                <LeaderboardPodium />
            </div>
            <div className="relative z-10 mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin]">
                <ol className="flex flex-col gap-3">
                    {leaderboardEntries.map((entry) => (
                        <li
                            key={entry.rank}
                            className="flex h-[52px] min-w-0 shrink-0 items-center rounded-lg bg-surface-raised px-2.5"
                        >
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-home-rank-number text-xs font-medium text-home-rank-number-text tabular-nums">
                                {entry.rank}
                            </span>
                            <img
                                alt=""
                                aria-hidden="true"
                                className="ml-2 size-8 shrink-0 rounded-full object-cover"
                                src={entry.avatarSource}
                            />
                            <div className="ml-2 min-w-0 flex-1 leading-4">
                                <p className="truncate text-label font-medium text-primary">
                                    {entry.name}
                                </p>
                                <p
                                    className={
                                        entry.levelTone === 'danger'
                                            ? 'truncate text-xs font-semibold text-danger'
                                            : entry.levelTone === 'success'
                                              ? 'truncate text-xs font-semibold text-success'
                                              : entry.levelTone === 'purple'
                                                ? 'truncate text-xs font-semibold text-brand-start'
                                                : entry.levelTone === 'blue'
                                                  ? 'truncate text-xs font-semibold text-home-rank-blue'
                                                  : 'truncate text-xs font-semibold text-warning'
                                    }
                                >
                                    {entry.level}
                                </p>
                            </div>
                            <TldMembershipBadge
                                label={entry.membershipLabel}
                                size="compact"
                                tone={entry.membershipTone}
                            />
                            <span className="ml-2 shrink-0 text-label text-secondary tabular-nums">
                                {entry.time}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </aside>
    )
}
