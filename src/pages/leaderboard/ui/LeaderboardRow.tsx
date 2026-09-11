import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import rankFirstSource from '../assets/rank-first.png'
import rankSecondSource from '../assets/rank-second.png'
import rankThirdSource from '../assets/rank-third.png'
import { getLeaderboardMetricValue } from '../model/leaderboard-items'
import type {
    CurrentLeaderboardUser,
    LeaderboardEntry,
    LeaderboardLevelTone,
    LeaderboardMetric,
} from '../model/leaderboard-items'

interface LeaderboardRowProps {
    readonly entry: LeaderboardEntry
    readonly metric: LeaderboardMetric
}

interface CurrentUserRowProps {
    readonly user: CurrentLeaderboardUser
}

interface LevelLabelProps {
    readonly level: string
    readonly tone: LeaderboardLevelTone
}

const rankIconSources: Readonly<Partial<Record<number, string>>> = {
    1: rankFirstSource,
    2: rankSecondSource,
    3: rankThirdSource,
}

function LevelLabel({ level, tone }: LevelLabelProps): ReactElement {
    return (
        <span
            className={
                tone === 'danger'
                    ? 'shrink-0 text-[10px] font-semibold text-danger'
                    : tone === 'warning'
                      ? 'shrink-0 text-[10px] font-semibold text-warning'
                      : tone === 'success'
                        ? 'shrink-0 text-[10px] font-semibold text-success'
                        : tone === 'magenta'
                          ? 'shrink-0 text-[10px] font-semibold text-accent-magenta'
                          : 'shrink-0 text-[10px] font-semibold text-accent-blue'
            }
        >
            {level}
        </span>
    )
}

function RankMark({ rank }: { readonly rank: number }): ReactElement {
    const iconSource = rankIconSources[rank]

    if (iconSource !== undefined) {
        return (
            <span aria-label={`第${rank}名`} className="grid place-items-center">
                <img alt="" aria-hidden="true" className="size-9 object-contain" src={iconSource} />
            </span>
        )
    }

    return (
        <span className="text-[11px] font-semibold italic text-primary tabular-nums">
            NO.{rank}
        </span>
    )
}

export function LeaderboardRow({ entry, metric }: LeaderboardRowProps): ReactElement {
    return (
        <li className="grid h-14 min-w-0 grid-cols-[58px_minmax(0,1fr)_auto] items-center rounded-xl bg-surface-raised px-3">
            <RankMark rank={entry.rank} />

            <div className="flex min-w-0 items-center gap-2">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-9 shrink-0 rounded-full object-cover"
                    src={entry.avatarSource}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-label font-medium text-primary">
                            {entry.name}
                        </span>
                        <LevelLabel level={entry.level} tone={entry.levelTone} />
                        <TldMembershipBadge
                            label={entry.membershipLabel}
                            size="micro"
                            tone={entry.membershipTone}
                        />
                    </div>
                    <p className="hidden truncate text-caption text-muted sm:block">
                        {entry.signature}
                    </p>
                </div>
            </div>

            <span className="ml-3 whitespace-nowrap text-right text-label text-secondary tabular-nums">
                {getLeaderboardMetricValue(entry, metric)}
            </span>
        </li>
    )
}

export function CurrentUserRow({ user }: CurrentUserRowProps): ReactElement {
    return (
        <div className="grid h-14 min-w-0 grid-cols-[58px_minmax(0,1fr)_auto] items-center rounded-t-xl bg-linear-to-r from-brand-start via-accent-blue to-brand-end px-3 text-inverse">
            <span className="text-[11px] font-medium">未上榜</span>

            <div className="flex min-w-0 items-center gap-2">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-9 shrink-0 rounded-full object-cover"
                    src={user.avatarSource}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-label font-medium text-inverse">
                            {user.name}
                        </span>
                        <LevelLabel level={user.level} tone={user.levelTone} />
                        <TldMembershipBadge
                            label={user.membershipLabel}
                            size="micro"
                            tone={user.membershipTone}
                        />
                    </div>
                    <p className="hidden truncate text-caption text-inverse/70 sm:block">
                        {user.signature}
                    </p>
                </div>
            </div>

            <span className="ml-3 whitespace-nowrap text-label text-inverse">未上榜</span>
        </div>
    )
}
