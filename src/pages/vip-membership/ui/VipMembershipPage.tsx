import { useState } from 'react'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { notification } from '../../../shared/notification'
import titleGradientSource from '../assets/title-gradient.png'
import { goldVipPlan, lifetimeVipPlan } from '../model/vip-plan-content'
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

export function VipMembershipPage({
    collaborationPath,
    viewer = defaultViewer,
}: VipMembershipPageProps): ReactElement {
    const navigate = useNavigate()
    const [activeCategory, setActiveCategory] = useState<VipCategory>('learning-vip')
    const [activeBillingCycle, setActiveBillingCycle] = useState<VipBillingCycle>('week')

    return (
        <section aria-label="开通畅学VIP" className="min-w-0 px-3 pb-8 pt-6 md:px-4">
            <div className="mx-auto flex w-full max-w-[1040px] flex-col items-center">
                <h1
                    className="max-w-full bg-center bg-clip-text text-center text-page-title font-semibold tracking-[0.01em] text-transparent xl:text-[32px] xl:leading-[45px]"
                    style={{ backgroundImage: `url(${titleGradientSource})` }}
                >
                    多说英语，多多分享，Mani多多，多晒爱与智慧
                </h1>

                <div className="mt-3 flex h-14 w-[260px] items-center justify-center rounded-lg border border-strong text-section-title text-secondary">
                    logo
                </div>

                <div className="mt-[22px] flex w-full justify-center">
                    <VipCategoryTabs value={activeCategory} onValueChange={setActiveCategory} />
                </div>

                {activeCategory === 'learning-vip' ? (
                    <div
                        id="learning-vip-panel"
                        className="mt-10 grid w-full gap-[35px] xl:grid-cols-[470px_470px] xl:justify-center"
                        role="tabpanel"
                    >
                        <VipPlanCard
                            activeBillingCycle={activeBillingCycle}
                            plan={goldVipPlan}
                            viewer={viewer}
                            onBillingCycleChange={setActiveBillingCycle}
                        />
                        <VipPlanCard plan={lifetimeVipPlan} viewer={viewer} />
                    </div>
                ) : activeCategory === 'collaboration' ? (
                    <VipCollaborationPanel
                        onExplore={(): void => {
                            void navigate(collaborationPath)
                        }}
                    />
                ) : (
                    <VipTrialPanel />
                )}

                <button
                    type="button"
                    className="mt-11 cursor-pointer text-card-title text-accent-blue underline underline-offset-2"
                    onClick={(): void => notification.info('客服入口暂未接入')}
                >
                    咨询客服
                </button>
            </div>
        </section>
    )
}
