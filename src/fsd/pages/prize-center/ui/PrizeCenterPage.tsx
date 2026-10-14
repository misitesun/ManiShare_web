'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import prizeBanner from '../assets/prize-banner.png'
import { BenefitsExchangePanel } from './BenefitsExchangePanel'
import { PrizeExchangeEmptyState } from './PrizeExchangeEmptyState'
import { RedemptionRecordsPanel } from './RedemptionRecordsPanel'

type PrizeCenterView = 'benefits' | 'points' | 'records'

const prizeCenterViews: readonly PrizeCenterView[] = ['points', 'benefits', 'records']
const prizeCenterTabs = [
    { id: 'points', label: '其他兑换', panelId: 'prize-center-points-panel' },
    { id: 'benefits', label: '权益兑换', panelId: 'prize-center-benefits-panel' },
    { id: 'records', label: '兑换记录', panelId: 'prize-center-records-panel' },
]

function isPrizeCenterView(value: string): value is PrizeCenterView {
    return prizeCenterViews.some((view) => view === value)
}

export function PrizeCenterPage(): ReactElement {
    const [activeView, setActiveView] = useState<PrizeCenterView>('points')

    function selectView(value: string): void {
        if (isPrizeCenterView(value)) setActiveView(value)
    }

    return (
        <section
            aria-label="奖品兑换中心"
            className="min-w-0 px-3 pb-8 pt-6 md:px-4 xl:min-[1920px]:px-[254px]"
        >
            <h1 className="text-center text-page-title-compact font-bold text-foreground">
                ——奖品兑换中心——
            </h1>

            <div className="relative mt-5 aspect-[1212/328] overflow-hidden rounded-xl md:rounded-[20px] xl:aspect-auto xl:h-[328px]">
                <img
                    alt="奖品兑换中心：加油练习，好礼等你拿"
                    className="h-full w-full object-cover"
                    src={prizeBanner.src}
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl border border-foreground/30 md:rounded-[20px]"
                />
            </div>

            <div className="mt-6 overflow-x-auto md:mt-10 xl:min-[1920px]:mt-[57px]">
                <div className="mx-auto w-max">
                    <TldSegmentedTabs
                        activeTextTone={activeView === 'points' ? 'accent-green' : 'brand'}
                        ariaLabel="兑换类型"
                        indicatorThickness="medium"
                        indicatorTone={activeView === 'points' ? 'accent-green' : 'brand'}
                        gap="spread"
                        indicatorWidth={35}
                        items={prizeCenterTabs}
                        layout="content"
                        showBaseline={false}
                        size="compact"
                        typography="regular"
                        value={activeView}
                        variant="underline"
                        onValueChange={selectView}
                    />
                </div>
            </div>

            {prizeCenterViews.map((view) => (
                <div
                    key={view}
                    id={`prize-center-${view}-panel`}
                    aria-label={prizeCenterTabs.find((tab) => tab.id === view)?.label}
                    className={
                        view === 'records'
                            ? 'mt-5 min-h-[280px]'
                            : view === 'benefits'
                              ? 'mt-6 min-h-[280px] md:mt-10 xl:min-[1920px]:mt-[57px]'
                              : 'mt-16 min-h-[240px] md:mt-24 xl:min-[1920px]:mt-[132px]'
                    }
                    hidden={activeView !== view}
                    role="tabpanel"
                >
                    {view === 'points' ? (
                        <PrizeExchangeEmptyState />
                    ) : view === 'benefits' ? (
                        <BenefitsExchangePanel />
                    ) : (
                        <RedemptionRecordsPanel />
                    )}
                </div>
            ))}
        </section>
    )
}
