'use client'

import type { ReactElement } from 'react'
import challengeGold from './assets/challenge-gold-6c1614.png'
import challengeLifetime from './assets/challenge-lifetime-68c8bf.png'
import angelIconSourceAsset from './assets/angel.png'
import goldIconSourceAsset from './assets/gold.png'
import lifetimeIconSourceAsset from './assets/lifetime.png'

const angelIconSource: string = angelIconSourceAsset.src
const goldIconSource: string = goldIconSourceAsset.src
const lifetimeIconSource: string = lifetimeIconSourceAsset.src

export type TldMembershipTone = 'angel' | 'gold' | 'lifetime' | 'trial'
export type TldMembershipBadgeSize =
    'compact' | 'default' | 'micro' | 'podium' | 'waiting' | 'challenge'

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
    if ((size === 'waiting' || size === 'challenge') && (tone === 'gold' || tone === 'lifetime')) {
        const waiting = size === 'waiting'
        return (
            <span
                className={
                    waiting
                        ? 'relative inline-block h-[25px] w-[69px] shrink-0'
                        : tone === 'gold'
                          ? 'relative inline-block h-[31.88px] w-[88px] shrink-0'
                          : 'relative inline-block h-[32.4px] w-[89px] shrink-0'
                }
            >
                <span
                    className={
                        waiting
                            ? 'absolute left-[9px] top-[3px] flex h-5 w-[60px] items-center rounded bg-membership-gold pl-[15px] text-caption-tight text-membership-gold-text'
                            : tone === 'gold'
                              ? 'absolute left-[11px] top-1 flex h-[26px] w-[77px] items-center rounded-md bg-membership-gold pl-[21px] text-label-regular text-membership-gold-text'
                              : 'absolute left-[14px] top-[4.75px] flex h-[26px] w-[75px] items-center rounded-[5px] bg-membership-lifetime pl-[19px] text-label-regular text-membership-lifetime-text'
                    }
                >
                    {label}
                </span>
                <img
                    alt=""
                    aria-hidden="true"
                    src={tone === 'gold' ? challengeGold.src : challengeLifetime.src}
                    className={
                        waiting
                            ? 'absolute left-0 top-0 h-[25px] w-[21px] object-fill'
                            : tone === 'gold'
                              ? 'absolute left-0 top-0 h-[31.88px] w-[26.78px] object-fill'
                              : 'absolute left-0 top-0 h-[32.4px] w-[30.09px] object-fill'
                    }
                />
            </span>
        )
    }
    const iconSource = iconSources[tone]
    const badgeClassName =
        iconSource === undefined
            ? size === 'podium'
                ? 'inline-flex h-[18px] shrink-0 items-center rounded border border-strong px-1 text-[8px] leading-[12px] text-secondary @min-[400px]/podium:h-5 @min-[400px]/podium:px-1.5 @min-[400px]/podium:text-caption-tight'
                : size === 'micro'
                  ? 'inline-flex h-4 shrink-0 items-center rounded border border-strong px-1 text-[8px] leading-none text-secondary'
                  : size === 'compact'
                    ? 'inline-flex h-5 shrink-0 items-center rounded border border-strong px-1.5 text-[10px] leading-none text-secondary'
                    : 'inline-flex h-7 shrink-0 items-center rounded border border-strong px-2 text-xs leading-none text-secondary'
            : size === 'podium'
              ? 'relative inline-flex h-[18px] shrink-0 items-center pl-1.5 @min-[400px]/podium:h-7 @min-[400px]/podium:pl-[9px]'
              : size === 'micro'
                ? 'relative inline-flex h-[18px] shrink-0 items-center pl-1.5'
                : size === 'compact'
                  ? 'relative inline-flex h-[25px] shrink-0 items-center pl-[9px]'
                  : 'relative inline-flex h-7 shrink-0 items-center pl-2.5'
    const surfaceClassName =
        size === 'podium'
            ? tone === 'gold'
                ? 'inline-flex h-4 items-center rounded bg-membership-gold pl-3 pr-1 text-[8px] leading-[12px] @min-[400px]/podium:h-5 @min-[400px]/podium:pl-[15px] @min-[400px]/podium:pr-[3px] @min-[400px]/podium:text-caption-tight text-membership-gold-text'
                : tone === 'lifetime'
                  ? 'inline-flex h-4 items-center rounded bg-membership-lifetime pl-3 pr-1 text-[8px] leading-[12px] @min-[400px]/podium:h-5 @min-[400px]/podium:pl-[15px] @min-[400px]/podium:pr-[3px] @min-[400px]/podium:text-caption-tight text-membership-lifetime-text'
                  : 'inline-flex h-4 items-center rounded bg-membership-angel pl-3 pr-1 text-[8px] leading-[12px] @min-[400px]/podium:h-5 @min-[400px]/podium:pl-[15px] @min-[400px]/podium:pr-[3px] @min-[400px]/podium:text-caption-tight text-membership-angel-text'
            : size === 'micro'
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
                        size === 'podium'
                            ? 'absolute left-0 top-0 z-1 size-[18px] object-contain @min-[400px]/podium:size-[26px]'
                            : size === 'micro'
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
