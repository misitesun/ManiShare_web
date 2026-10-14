'use client'

import type { ReactElement } from 'react'
import angelWingSourceAsset from '../assets/angel-wing.png'
import categoryTrackAsset from '../assets/category-track.png'
import categoryActiveAsset from '../assets/category-active.png'
import categoryActiveWideAsset from '../assets/category-active-wide.png'

const angelWingSource: string = angelWingSourceAsset.src
const categoryTrackSource: string = categoryTrackAsset.src
const categoryActiveSource: string = categoryActiveAsset.src
const categoryActiveWideSource: string = categoryActiveWideAsset.src

export type VipCategory = 'collaboration' | 'free-trial' | 'learning-vip'

interface VipCategoryTabsProps {
    readonly onValueChange: (value: VipCategory) => void
    readonly value: VipCategory
}

export function VipCategoryTabs({ onValueChange, value }: VipCategoryTabsProps): ReactElement {
    return (
        <div
            aria-label="会员分类"
            className="grid h-[54px] w-full max-w-[496px] grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)_minmax(0,1fr)] items-center rounded-full bg-size-[100%_100%] bg-no-repeat p-2 backdrop-blur-[7.5px] md:grid-cols-[128px_minmax(0,1fr)_128px]"
            style={{ backgroundImage: `url(${categoryTrackSource})` }}
            role="tablist"
        >
            <button
                type="button"
                aria-controls="learning-vip-panel"
                aria-selected={value === 'learning-vip'}
                className="flex h-[38px] min-w-0 w-full max-w-32 cursor-pointer items-center justify-center rounded-full bg-size-[100%_100%] bg-no-repeat text-body text-hint outline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus aria-selected:font-medium aria-selected:text-primary motion-reduce:transition-none"
                style={
                    value === 'learning-vip'
                        ? { backgroundImage: `url(${categoryActiveSource})` }
                        : undefined
                }
                role="tab"
                onClick={(): void => onValueChange('learning-vip')}
            >
                畅学VIP
            </button>
            <button
                type="button"
                aria-controls="collaboration-vip-panel"
                aria-selected={value === 'collaboration'}
                className="flex h-[38px] min-w-0 w-full max-w-[162px] cursor-pointer items-center justify-center justify-self-center gap-[3px] rounded-full bg-size-[100%_100%] bg-no-repeat text-body text-primary outline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none"
                style={
                    value === 'collaboration'
                        ? { backgroundImage: `url(${categoryActiveWideSource})` }
                        : undefined
                }
                role="tab"
                onClick={(): void => onValueChange('collaboration')}
            >
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-4 shrink-0 md:size-5"
                    src={angelWingSource}
                />
                <span className="min-w-0 truncate bg-linear-to-r/srgb from-brand-start to-brand-end bg-clip-text text-transparent">
                    漫奇联创天使
                </span>
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-4 shrink-0 -scale-x-100 md:size-5"
                    src={angelWingSource}
                />
            </button>
            <button
                type="button"
                aria-controls="free-trial-panel"
                aria-selected={value === 'free-trial'}
                className="flex h-[38px] min-w-0 w-full max-w-32 cursor-pointer items-center justify-center rounded-full bg-size-[100%_100%] bg-no-repeat text-body text-primary outline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus aria-selected:font-medium motion-reduce:transition-none"
                style={
                    value === 'free-trial'
                        ? { backgroundImage: `url(${categoryActiveSource})` }
                        : undefined
                }
                role="tab"
                onClick={(): void => onValueChange('free-trial')}
            >
                免费体验
            </button>
        </div>
    )
}
