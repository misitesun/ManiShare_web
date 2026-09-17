import type { ReactElement } from 'react'
import { notification } from '../../../shared/notification'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import benefitCheckSource from '../assets/benefit-check.svg'
import purchaseWarningSource from '../assets/purchase-warning.svg'
import type { VipPlanContent } from '../model/vip-plan-content'
import { getVipActionLabel, isVipBillingCycle, vipBillingCycles } from '../model/vip-membership'
import type { VipBillingCycle, VipViewerState } from '../model/vip-membership'

interface VipPlanCardProps {
    readonly activeBillingCycle?: VipBillingCycle
    readonly plan: VipPlanContent
    readonly viewer: VipViewerState
    readonly onBillingCycleChange?: (billingCycle: VipBillingCycle) => void
}

const billingCycleTabs = vipBillingCycles.map((cycle) => ({
    id: cycle.id,
    label: cycle.label,
    panelId: 'gold-vip-price-panel',
})) satisfies readonly TldSegmentedTabItem[]

export function VipPlanCard({
    activeBillingCycle,
    onBillingCycleChange,
    plan,
    viewer,
}: VipPlanCardProps): ReactElement {
    const actionLabel = getVipActionLabel(plan.productId, viewer)
    const isGoldPlan = plan.productId === 'gold'

    function selectBillingCycle(value: string): void {
        if (onBillingCycleChange !== undefined && isVipBillingCycle(value)) {
            onBillingCycleChange(value)
        }
    }

    return (
        <article className="relative flex min-h-[742px] min-w-0 flex-col rounded-[20px] border border-strong bg-surface/50 px-5 pb-7 pt-7 shadow-panel md:px-8 xl:px-[50px]">
            <div
                className={
                    isGoldPlan
                        ? 'absolute right-0 top-8 flex h-8 w-[82px] items-center justify-center rounded-l-full bg-membership-gold text-label text-membership-gold-text'
                        : 'absolute right-0 top-8 flex h-8 w-[82px] items-center justify-center rounded-l-full bg-membership-lifetime text-label text-membership-lifetime-text'
                }
            >
                {plan.badge}
            </div>

            <header className="min-w-0 pr-20">
                <h2 className="text-section-title font-medium text-primary xl:text-[26px] xl:leading-9">
                    {plan.title}
                </h2>
                <p className="mt-2 text-label text-secondary">{plan.subtitle}</p>
            </header>

            {isGoldPlan && activeBillingCycle !== undefined ? (
                <div className="mt-[22px] [&_[role=tablist]]:h-8 [&_[role=tablist]]:rounded-lg [&_[role=tablist]>span]:bg-none [&_[role=tablist]>span]:bg-surface-hover [&_[role=tab]]:px-2 [&_[role=tab]]:text-body">
                    <TldSegmentedTabs
                        ariaLabel="黄金VIP购买周期"
                        items={billingCycleTabs}
                        value={activeBillingCycle}
                        onValueChange={selectBillingCycle}
                    />
                </div>
            ) : (
                <div className="h-[54px]" />
            )}

            <div
                id={isGoldPlan ? 'gold-vip-price-panel' : undefined}
                className="mt-5"
                role={isGoldPlan ? 'tabpanel' : undefined}
            >
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="text-body text-secondary line-through">
                        {plan.originalPrice}
                    </span>
                    {isGoldPlan ? (
                        <span className="rounded border border-accent-orange px-2 py-1 text-label text-accent-orange">
                            立省¥200
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 font-medium text-danger">
                    <span className="text-section-title">¥</span>
                    <span className="text-[28px] leading-10">{plan.currentPrice}</span>
                    <span className="text-section-title text-primary">{plan.priceSuffix}</span>
                </p>
                <span
                    className={
                        isGoldPlan
                            ? 'mt-2 inline-flex min-h-7 items-center rounded border border-success px-2 text-label text-success'
                            : 'mt-2 inline-flex min-h-7 items-center rounded border border-accent-orange px-2 text-label text-accent-orange'
                    }
                >
                    {plan.dealText}
                </span>
            </div>

            <div className="mt-[22px]">
                <TldButton
                    fullWidth
                    size="large"
                    variant={actionLabel === '立即购买' ? 'primary' : 'secondary'}
                    onClick={(): void => notification.info(`${actionLabel}功能待接口接入`)}
                >
                    {actionLabel}
                </TldButton>
            </div>

            <ul className="mt-8 space-y-[13px] text-label text-primary">
                {plan.benefitItems.map((benefit) => (
                    <li key={`${benefit.prefix}-${benefit.highlight ?? ''}`} className="flex gap-2">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="mt-px size-[18px] shrink-0"
                            src={benefitCheckSource}
                        />
                        <span className="min-w-0">
                            {benefit.prefix}
                            {benefit.highlight === undefined ? null : (
                                <span className="text-accent-blue underline">
                                    {benefit.highlight}
                                </span>
                            )}
                            {benefit.suffix}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-auto flex items-center justify-center gap-[7px] pt-6 text-center text-label text-danger">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-6 shrink-0"
                    src={purchaseWarningSource}
                />
                <span>学习卡服务为虚拟产品，购买后不支持退款</span>
            </p>
        </article>
    )
}
