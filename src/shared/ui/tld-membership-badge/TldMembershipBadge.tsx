import type { ReactElement } from 'react'
import angelIconSource from './assets/angel.png'
import goldIconSource from './assets/gold.png'
import lifetimeIconSource from './assets/lifetime.png'

export type TldMembershipTone = 'angel' | 'gold' | 'lifetime' | 'trial'
export type TldMembershipBadgeSize = 'compact' | 'default' | 'micro'

export interface TldMembershipBadgeProps {
    readonly label: string
    readonly size?: TldMembershipBadgeSize
    readonly tone: TldMembershipTone
}

const iconSources: Readonly<Partial<Record<TldMembershipTone, string>>> = {
    angel: angelIconSource,
    gold: goldIconSource,
    lifetime: lifetimeIconSource,
}

export function TldMembershipBadge({
    label,
    size = 'default',
    tone,
}: TldMembershipBadgeProps): ReactElement {
    const iconSource = iconSources[tone]
    const badgeClassName =
        iconSource === undefined
            ? size === 'micro'
                ? 'inline-flex h-4 shrink-0 items-center rounded border border-strong px-1 text-[8px] leading-none text-secondary'
                : size === 'compact'
                  ? 'inline-flex h-5 shrink-0 items-center rounded border border-strong px-1.5 text-[10px] leading-none text-secondary'
                  : 'inline-flex h-7 shrink-0 items-center rounded border border-strong px-2 text-xs leading-none text-secondary'
            : size === 'micro'
              ? 'relative inline-flex h-[18px] shrink-0 items-center pl-1.5'
              : size === 'compact'
                ? 'relative inline-flex h-[25px] shrink-0 items-center pl-[9px]'
                : 'relative inline-flex h-7 shrink-0 items-center pl-2.5'
    const surfaceClassName =
        size === 'micro'
            ? tone === 'gold'
                ? 'inline-flex h-4 items-center rounded bg-membership-gold pl-3 pr-1 text-[8px] leading-none text-membership-gold-text'
                : tone === 'lifetime'
                  ? 'inline-flex h-4 items-center rounded bg-membership-lifetime pl-3 pr-1 text-[8px] leading-none text-membership-lifetime-text'
                  : 'inline-flex h-4 items-center rounded bg-membership-angel pl-3 pr-1 text-[8px] leading-none text-membership-angel-text'
            : size === 'compact'
              ? tone === 'gold'
                  ? 'inline-flex h-5 items-center rounded bg-membership-gold pl-[18px] pr-1.5 text-[10px] leading-none text-membership-gold-text'
                  : tone === 'lifetime'
                    ? 'inline-flex h-5 items-center rounded bg-membership-lifetime pl-[18px] pr-1.5 text-[10px] leading-none text-membership-lifetime-text'
                    : 'inline-flex h-5 items-center rounded bg-membership-angel pl-[18px] pr-1.5 text-[10px] leading-none text-membership-angel-text'
              : tone === 'gold'
                ? 'inline-flex h-6 items-center rounded bg-membership-gold pl-5 pr-2 text-xs leading-none text-membership-gold-text'
                : tone === 'lifetime'
                  ? 'inline-flex h-6 items-center rounded bg-membership-lifetime pl-5 pr-2 text-xs leading-none text-membership-lifetime-text'
                  : 'inline-flex h-6 items-center rounded bg-membership-angel pl-5 pr-2 text-xs leading-none text-membership-angel-text'

    return (
        <span className={badgeClassName}>
            {iconSource === undefined ? null : (
                <img
                    alt=""
                    aria-hidden="true"
                    className={
                        size === 'micro'
                            ? 'absolute left-0 top-0 z-1 size-[18px] object-contain'
                            : size === 'compact'
                              ? 'absolute left-0 top-0 z-1 size-[25px] object-contain'
                              : 'absolute left-0 top-0 z-1 size-7 object-contain'
                    }
                    src={iconSource}
                />
            )}
            <span className={iconSource === undefined ? 'whitespace-nowrap' : surfaceClassName}>
                {label}
            </span>
        </span>
    )
}
