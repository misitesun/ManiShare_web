'use client'

import type { ReactElement } from 'react'
import { notification } from '../../../shared/notification'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import benefitCheckSourceAsset from '../assets/benefit-check.svg'
import bonusHeartSourceAsset from '../assets/bonus-heart.svg'
import bonusMentoringSourceAsset from '../assets/bonus-mentoring.svg'
import bonusSharingSourceAsset from '../assets/bonus-sharing.svg'
import type { VipBenefitContent, VipPlanContent } from '../model/vip-plan-content'
import { getVipActionLabel, isVipBillingCycle, vipBillingCycles } from '../model/vip-membership'
import type { VipBillingCycle, VipViewerState } from '../model/vip-membership'

const bonusSources = {
    mentoring: bonusMentoringSourceAsset.src,
    sharing: bonusSharingSourceAsset.src,
}
const benefitCheckSource: string = benefitCheckSourceAsset.src
const bonusHeartSource: string = bonusHeartSourceAsset.src

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

function BenefitText({ benefit }: { readonly benefit: VipBenefitContent }): ReactElement {
    return (
        <span className="min-w-0">
            {benefit.prefix}
            {benefit.highlight === undefined ? null : (
                <span className="text-plan-link underline underline-offset-2">
                    {benefit.highlight}
                </span>
            )}
            {benefit.suffix}
        </span>
    )
}

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
        <article
            aria-label={plan.badge}
            className="relative flex min-h-[742px] min-w-0 flex-col rounded-[20px] border border-plan-border bg-plan-surface px-5 pb-[13px] pt-[29px] md:px-[29px]"
        >
            <div
                className={
                    isGoldPlan
                        ? 'absolute right-0 top-[31px] flex h-8 w-[82px] items-center justify-center rounded-l-full bg-plan-gold text-body text-plan-savings'
                        : 'absolute right-0 top-[31px] flex h-8 w-[82px] items-center justify-center rounded-l-full bg-plan-lifetime text-body text-plan-lifetime-text'
                }
            >
                {plan.badge}
            </div>
            <header className="min-w-0 pr-[65px]">
                <h2 className="text-section-title font-medium tracking-[0.01em] text-primary xl:text-[26px] xl:leading-9">
                    {plan.title}
                </h2>
            </header>

            {isGoldPlan && activeBillingCycle !== undefined ? (
                <div className="mt-[34px]">
                    <TldSegmentedTabs
                        appearance="neutral"
                        ariaLabel="黄金VIP购买周期"
                        items={billingCycleTabs}
                        value={activeBillingCycle}
                        onValueChange={selectBillingCycle}
                    />
                </div>
            ) : (
                <div aria-hidden="true" className="h-[66px]" />
            )}

            <div
                id={isGoldPlan ? 'gold-vip-price-panel' : undefined}
                aria-label={isGoldPlan ? '黄金VIP价格及权益' : undefined}
                className="mt-5 flex min-w-0 flex-1 flex-col"
                role={isGoldPlan ? 'tabpanel' : undefined}
            >
                <div className="flex min-h-7 min-w-0 flex-wrap items-center gap-[29px]">
                    <span className="text-body-tight text-hint line-through">
                        {plan.originalPrice}
                    </span>
                    {isGoldPlan ? (
                        <span className="inline-flex h-7 items-center rounded border border-plan-savings px-[10px] text-field-label text-plan-savings">
                            立省¥200
                        </span>
                    ) : null}
                </div>
                <p
                    className={
                        isGoldPlan
                            ? 'mt-1 flex h-[39px] items-baseline font-medium text-brand'
                            : '-mt-[3px] flex h-[39px] items-baseline font-medium text-brand'
                    }
                >
                    <span className="text-[20px] leading-[39px]">¥</span>
                    <span className="text-[28px] leading-[39px]">{plan.currentPrice}</span>
                    <span className="text-[20px] leading-[39px] text-primary">
                        {plan.priceSuffix}
                    </span>
                </p>
                <div className="mt-[10px]">
                    <span
                        className={
                            isGoldPlan
                                ? 'inline-flex min-h-7 items-center rounded border border-accent-green px-2 text-body-tight text-accent-green'
                                : 'inline-flex min-h-7 items-center rounded border border-plan-savings px-2 text-field-label text-plan-savings'
                        }
                    >
                        {plan.dealText}
                    </span>
                </div>
                <div className={isGoldPlan ? 'mt-6' : 'mt-[30px]'}>
                    <TldButton
                        fullWidth
                        size="plan"
                        variant={actionLabel === '立即购买' ? 'primary' : 'secondary'}
                        onClick={(): void => notification.info(`${actionLabel}功能待接口接入`)}
                    >
                        {actionLabel}
                    </TldButton>
                </div>
                <ul className="mt-[30px] space-y-[14px] text-field-label text-primary">
                    {plan.benefitItems.map((benefit) => (
                        <li key={benefit.prefix} className="flex gap-[6px]">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-[18px] shrink-0"
                                src={benefitCheckSource}
                            />
                            <BenefitText benefit={benefit} />
                        </li>
                    ))}
                </ul>
                <h3
                    className={
                        isGoldPlan
                            ? '-ml-[7px] mt-[21px] text-field-label font-medium text-primary'
                            : 'mt-[22px] text-field-label font-medium text-primary'
                    }
                >
                    「附赠福利」
                </h3>
                <ul
                    className={
                        isGoldPlan
                            ? 'mt-[14px] space-y-3 text-field-label text-primary'
                            : 'mt-[14px] space-y-3 text-field-label text-primary md:ml-[7px]'
                    }
                >
                    {plan.bonusItems.map((benefit) => (
                        <li key={benefit.icon} className="flex gap-[6px]">
                            <span
                                aria-hidden="true"
                                className="size-5 shrink-0 bg-primary [mask-repeat:no-repeat] [mask-size:contain]"
                                style={{ maskImage: `url(${bonusSources[benefit.icon]})` }}
                            />
                            <BenefitText benefit={benefit} />
                        </li>
                    ))}
                    <li className="flex gap-[6px]">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-5 shrink-0"
                            src={bonusHeartSource}
                        />
                        <span className="min-w-0">
                            他人进步你开心，学赚两得，自利利他，生生不息
                        </span>
                    </li>
                </ul>
                <p className="mt-auto pt-6 text-center text-field-label text-plan-note">
                    学习卡服务为虚拟产品，购买后不支持退款哦
                </p>
            </div>
        </article>
    )
}
