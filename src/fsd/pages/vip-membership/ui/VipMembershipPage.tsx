'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { notification } from '../../../shared/notification'
import headerPurpleAsset from '../assets/header-purple.svg'
import headerGreenAsset from '../assets/header-green.svg'
import { getGoldVipPlan, lifetimeVipPlan } from '../model/vip-plan-content'
import type { VipBillingCycle, VipViewerState } from '../model/vip-membership'
import { VipCategoryTabs, type VipCategory } from './VipCategoryTabs'
import { VipCollaborationPanel } from './VipCollaborationPanel'
import { VipPlanCard } from './VipPlanCard'
import { VipTrialPanel } from './VipTrialPanel'

export interface VipMembershipPageProps {
    readonly collaborationPath: string
    readonly viewer?: VipViewerState
}

const defaultViewer: VipViewerState = { activeProductIds: [] }
const headerPurpleSource: string = headerPurpleAsset.src
const headerGreenSource: string = headerGreenAsset.src

export function VipMembershipPage({
    collaborationPath,
    viewer = defaultViewer,
}: VipMembershipPageProps): ReactElement {
    const router = useRouter()
    const [activeCategory, setActiveCategory] = useState<VipCategory>('learning-vip')
    const [activeBillingCycle, setActiveBillingCycle] = useState<VipBillingCycle>('week')
    const [hasClaimedTrial, setHasClaimedTrial] = useState(false)

    return (
        <section
            aria-label="开通畅学VIP"
            className="relative isolate min-w-0 overflow-hidden px-3 pb-[38px] pt-6 md:px-4"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[calc(8.197674%_-_180px)] top-[-126px] -z-10 h-[409px] w-[933px] bg-no-repeat"
                style={{ backgroundImage: `url(${headerPurpleSource})` }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-[calc(12.790698%_-_180px)] top-[-107px] -z-10 h-[399px] w-[933px] bg-no-repeat"
                style={{ backgroundImage: `url(${headerGreenSource})` }}
            />
            <div className="mx-auto flex w-full max-w-[1040px] flex-col items-center">
                <h1 className="max-w-full bg-linear-to-r/srgb from-brand-start to-brand-end bg-clip-text text-center text-page-title font-normal tracking-[0.01em] text-transparent xl:text-[32px] xl:leading-[38px]">
                    多说英语，多多分享，‘Mani’多多，多晒爱与智慧
                </h1>

                <p className="mt-[35px] text-center text-section-title text-primary xl:text-[24px] xl:leading-[29px]">
                    - ManiShare 漫奇说 -
                </p>

                <div className="mt-[34px] flex w-full justify-center">
                    <VipCategoryTabs value={activeCategory} onValueChange={setActiveCategory} />
                </div>

                {activeCategory === 'learning-vip' ? (
                    <div
                        id="learning-vip-panel"
                        className="mt-[41px] grid w-full max-w-[470px] gap-[35px] xl:max-w-[992px] xl:grid-cols-[470px_470px]"
                        role="tabpanel"
                    >
                        <VipPlanCard
                            activeBillingCycle={activeBillingCycle}
                            plan={getGoldVipPlan(activeBillingCycle)}
                            viewer={viewer}
                            onBillingCycleChange={setActiveBillingCycle}
                        />
                        <VipPlanCard plan={lifetimeVipPlan} viewer={viewer} />
                    </div>
                ) : activeCategory === 'collaboration' ? (
                    <VipCollaborationPanel
                        onExplore={(): void => {
                            void router.push(collaborationPath, { scroll: false })
                        }}
                    />
                ) : (
                    <VipTrialPanel
                        claimed={hasClaimedTrial}
                        onClaim={(): void => setHasClaimedTrial(true)}
                    />
                )}

                <button
                    type="button"
                    className={
                        activeCategory === 'collaboration'
                            ? 'mt-8 cursor-pointer text-action-label-compact text-plan-link underline underline-offset-2'
                            : 'mt-[51px] cursor-pointer text-action-label-compact text-plan-link underline underline-offset-2'
                    }
                    onClick={(): void => notification.info('客服入口暂未接入')}
                >
                    咨询客服
                </button>
            </div>
        </section>
    )
}
