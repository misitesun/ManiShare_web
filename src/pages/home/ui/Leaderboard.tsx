import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import firstAvatarSource from '../assets/leaderboard/avatar-first.webp'
import secondAvatarSource from '../assets/leaderboard/avatar-second.webp'
import thirdAvatarSource from '../assets/leaderboard/avatar-third.webp'
import podiumCenterTopSource from '../assets/leaderboard/podium-center-top.svg'
import podiumLeftTopSource from '../assets/leaderboard/podium-left-top.svg'
import podiumRightTopSource from '../assets/leaderboard/podium-right-top.svg'
import { leaderboardEntries } from '../model/home-data'
import { LightRays } from './LightRays'

function LeaderboardPodium(): ReactElement {
    return (
        <div className="relative h-64 w-[422px]" aria-label="前三名：summer、冬雪晚晴、左兔先生">
            <div className="absolute left-[173px] top-0 flex w-[76px] flex-col items-center">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-[76px] rounded-full object-cover"
                    src={firstAvatarSource}
                />
                <span className="mt-[-10px]">
                    <TldMembershipBadge label="黄金VIP" size="compact" tone="gold" />
                </span>
                <span className="mt-0.5 whitespace-nowrap text-xs font-semibold text-home-rank-blue">
                    Lv99言御
                </span>
            </div>
            <div className="absolute left-[29px] top-[45px] flex w-[76px] flex-col items-center">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-[76px] rounded-full object-cover"
                    src={secondAvatarSource}
                />
                <span className="mt-[-10px]">
                    <TldMembershipBadge label="黄金VIP" size="compact" tone="gold" />
                </span>
                <span className="mt-0.5 whitespace-nowrap text-xs font-semibold text-danger">
                    Lv2初音
                </span>
            </div>
            <div className="absolute left-[315px] top-[45px] flex w-[76px] flex-col items-center">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-[76px] rounded-full object-cover"
                    src={thirdAvatarSource}
                />
                <span className="mt-[-10px]">
                    <TldMembershipBadge label="终身VIP" size="compact" tone="lifetime" />
                </span>
                <span className="mt-0.5 whitespace-nowrap text-xs font-semibold text-warning">
                    Lv9词启
                </span>
            </div>

            <div className="absolute bottom-0 left-0 h-[101px] w-[126px]">
                <img
                    alt=""
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-[26px] w-[126px]"
                    src={podiumLeftTopSource}
                />
                <div className="absolute bottom-0 h-[75px] w-full rounded-bl-xl bg-linear-to-b from-home-podium-purple to-home-podium-purple-soft text-center text-inverse">
                    <p className="pt-1 text-sm font-medium">冬雪晚晴</p>
                    <p className="mt-1 text-[38px] font-semibold leading-none text-inverse/35">2</p>
                </div>
                <span className="absolute top-0 flex h-[26px] w-full items-center justify-center text-sm text-home-podium-purple-text">
                    5小时30分钟
                </span>
            </div>
            <div className="absolute bottom-0 left-[126px] h-[130px] w-[170px]">
                <img
                    alt=""
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-[29px] w-[170px]"
                    src={podiumCenterTopSource}
                />
                <div className="absolute bottom-0 h-[101px] w-full bg-linear-to-b from-home-podium-gold to-home-podium-gold-soft text-center text-inverse">
                    <p className="pt-1 text-sm font-medium">summer</p>
                    <p className="mt-2 text-[42px] font-semibold leading-none text-inverse/35">1</p>
                </div>
                <span className="absolute top-0 flex h-[29px] w-full items-center justify-center text-sm text-home-podium-gold-text">
                    6小时44分钟
                </span>
            </div>
            <div className="absolute bottom-0 right-0 h-[101px] w-[126px]">
                <img
                    alt=""
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-[26px] w-[126px] -scale-x-100"
                    src={podiumRightTopSource}
                />
                <div className="absolute bottom-0 h-[75px] w-full rounded-br-xl bg-linear-to-b from-home-podium-blue to-home-podium-blue-soft text-center text-inverse">
                    <p className="pt-1 text-sm font-medium">左兔先生</p>
                    <p className="mt-1 text-[38px] font-semibold leading-none text-inverse/35">3</p>
                </div>
                <span className="absolute top-0 flex h-[26px] w-full items-center justify-center text-sm text-home-podium-blue-text">
                    5小时27分钟
                </span>
            </div>
        </div>
    )
}

export function Leaderboard(): ReactElement {
    return (
        <aside
            aria-labelledby="leaderboard-title"
            className="@container flex h-auto min-w-0 flex-col overflow-hidden rounded-xl border border-strong bg-canvas lg:h-[968px] xl:min-[1440px]:h-full"
        >
            <div className="relative h-[358px] shrink-0 overflow-hidden">
                <LightRays
                    raysColor="var(--app-color-home-leaderboard-ray-purple)"
                    raysOrigin="top-center"
                    raysSpeed={1.5}
                    lightSpread={2}
                    rayLength={1.5}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0.1}
                    distortion={0.05}
                    saturation={2}
                />
                <h2
                    id="leaderboard-title"
                    className="relative pt-8 text-center text-[22px] font-medium tracking-[0.01em] text-primary md:text-[26px] xl:text-[30px] min-[1920px]:text-[32px]"
                >
                    今日风云榜
                </h2>
                <div className="absolute bottom-0 left-1/2 origin-bottom -translate-x-1/2 scale-[0.76] @min-[350px]:scale-[0.82] @min-[390px]:scale-[0.9] @min-[430px]:scale-100">
                    <LeaderboardPodium />
                </div>
            </div>

            <div className="mt-[29px] min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin]">
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
