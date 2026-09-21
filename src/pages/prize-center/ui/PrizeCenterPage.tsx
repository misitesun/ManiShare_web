import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import { BenefitsExchangePanel } from './BenefitsExchangePanel'
import { PrizeExchangeEmptyState } from './PrizeExchangeEmptyState'
import { RedemptionRecordsPanel } from './RedemptionRecordsPanel'

type PrizeCenterView = 'benefits' | 'points' | 'records'

const prizeCenterViews: readonly PrizeCenterView[] = ['points', 'benefits', 'records']
const prizeCenterTabs = [
    { id: 'points', label: '积分兑换', panelId: 'prize-center-points-panel' },
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
            className="min-w-0 px-3 pb-8 pt-6 md:px-4 xl:min-[1920px]:px-[250px]"
        >
            <h1 className="text-center text-page-title font-bold text-primary">——奖品兑换中心——</h1>

            <div className="mt-3 flex h-[180px] items-center justify-center rounded-[20px] border border-primary/30 px-4 text-center md:h-[260px] xl:h-[328px]">
                <p className="text-body text-secondary">IP形象-加油练习，更多奖品等你来拿</p>
            </div>

            <div className="mt-12">
                <div className="mx-auto w-full max-w-[476px]">
                    <TldSegmentedTabs
                        activeTextTone="brand"
                        ariaLabel="兑换类型"
                        indicatorThickness="medium"
                        indicatorTone="brand"
                        indicatorWidth={35}
                        items={prizeCenterTabs}
                        layout="equal"
                        showBaseline={false}
                        size="compact"
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
                        view === 'records' ? 'mt-7 min-h-[320px]' : 'mt-[76px] min-h-[320px]'
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
