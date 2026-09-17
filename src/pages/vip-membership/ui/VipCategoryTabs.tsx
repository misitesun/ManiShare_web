import type { ReactElement } from 'react'
import angelWingSource from '../assets/angel-wing.png'

export type VipCategory = 'collaboration' | 'free-trial' | 'learning-vip'

interface VipCategoryTabsProps {
    readonly onValueChange: (value: VipCategory) => void
    readonly value: VipCategory
}

export function VipCategoryTabs({ onValueChange, value }: VipCategoryTabsProps): ReactElement {
    const isLearningVipActive = value === 'learning-vip'
    const isCollaborationActive = value === 'collaboration'
    const isFreeTrialActive = value === 'free-trial'

    return (
        <div
            aria-label="会员分类"
            className="grid h-[54px] w-full max-w-[496px] grid-cols-[minmax(104px,128px)_minmax(0,1fr)_minmax(96px,128px)] items-center rounded-full border border-subtle bg-surface/60 p-[7px] shadow-panel backdrop-blur-sm"
            role="tablist"
        >
            <button
                type="button"
                aria-controls="learning-vip-panel"
                aria-selected={isLearningVipActive}
                className={
                    isLearningVipActive
                        ? 'flex h-[38px] cursor-pointer items-center justify-center rounded-full border border-subtle bg-surface-hover px-3 text-body font-medium text-primary'
                        : 'flex h-[38px] cursor-pointer items-center justify-center rounded-full px-3 text-body font-medium text-primary transition-colors hover:bg-surface-hover motion-reduce:transition-none'
                }
                role="tab"
                onClick={(): void => onValueChange('learning-vip')}
            >
                畅学VIP
            </button>

            <button
                type="button"
                aria-controls="collaboration-vip-panel"
                aria-selected={isCollaborationActive}
                className={
                    isCollaborationActive
                        ? 'flex h-[38px] min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-subtle bg-surface-hover px-2 text-label font-medium text-primary'
                        : 'flex h-[38px] min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-label font-medium text-primary transition-opacity hover:opacity-80 motion-reduce:transition-none'
                }
                role="tab"
                onClick={(): void => onValueChange('collaboration')}
            >
                <img alt="" aria-hidden="true" className="size-5" src={angelWingSource} />
                <span className="truncate bg-linear-to-r from-brand-start to-brand-end bg-clip-text text-transparent">
                    漫奇联创天使
                </span>
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-5 -scale-x-100"
                    src={angelWingSource}
                />
            </button>

            <button
                type="button"
                aria-controls="free-trial-panel"
                aria-selected={isFreeTrialActive}
                className={
                    isFreeTrialActive
                        ? 'h-[38px] cursor-pointer rounded-full border border-subtle bg-surface-hover px-3 text-label font-medium text-primary'
                        : 'h-[38px] cursor-pointer rounded-full px-3 text-label text-primary transition-colors hover:bg-surface-hover motion-reduce:transition-none'
                }
                role="tab"
                onClick={(): void => onValueChange('free-trial')}
            >
                免费体验
            </button>
        </div>
    )
}
