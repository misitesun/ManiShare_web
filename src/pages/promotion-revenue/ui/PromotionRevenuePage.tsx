import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import {
    WithdrawalRecordTable,
    useWithdrawalRecordPagination,
    withdrawalRecordPages,
} from '../../../widgets/withdrawal-records'
import { commissionRecordPages } from '../model/promotion-revenue-records'
import { registrationRecordPages } from '../model/registration-records'
import { usePromotionRevenuePagination } from '../model/usePromotionRevenuePagination'
import { CommissionRecordTable } from './CommissionRecordTable'
import { PromotionOverview } from './PromotionOverview'
import { RegistrationRecordTable } from './RegistrationRecordTable'

type PromotionRevenueView = 'commission' | 'withdrawal' | 'registration'

const commissionPanelId = 'promotion-revenue-commission-panel'
const withdrawalPanelId = 'promotion-revenue-withdrawal-panel'
const registrationPanelId = 'promotion-revenue-registration-panel'

const promotionRevenueTabs = [
    { id: 'commission', label: '佣金明细', panelId: commissionPanelId },
    { id: 'withdrawal', label: '提现记录', panelId: withdrawalPanelId },
    { id: 'registration', label: '注册明细', panelId: registrationPanelId },
] satisfies readonly TldSegmentedTabItem[]

export function PromotionRevenuePage(): ReactElement {
    const [activeView, setActiveView] = useState<PromotionRevenueView>('commission')
    const commissionPagination = usePromotionRevenuePagination(commissionRecordPages)
    const registrationPagination = usePromotionRevenuePagination(registrationRecordPages)
    const withdrawalPagination = useWithdrawalRecordPagination(withdrawalRecordPages)

    function selectView(value: string): void {
        if (value === 'commission' || value === 'withdrawal' || value === 'registration') {
            setActiveView(value)
        }
    }

    return (
        <section
            aria-label="推广收益后台"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-5 xl:min-[1920px]:px-[250px]"
        >
            <PromotionOverview />

            <div className="mt-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TldSegmentedTabs
                    ariaLabel="推广收益明细类型"
                    items={promotionRevenueTabs}
                    value={activeView}
                    variant="underline"
                    onValueChange={selectView}
                />
            </div>

            {activeView === 'commission' ? (
                <div id={commissionPanelId} aria-label="佣金明细" role="tabpanel">
                    <CommissionRecordTable
                        items={commissionPagination.visibleItems}
                        status={commissionPagination.status}
                        onLoadNextPage={commissionPagination.loadNextPage}
                    />
                </div>
            ) : activeView === 'withdrawal' ? (
                <div id={withdrawalPanelId} aria-label="提现记录" role="tabpanel">
                    <WithdrawalRecordTable
                        items={withdrawalPagination.visibleItems}
                        status={withdrawalPagination.status}
                        onLoadNextPage={withdrawalPagination.loadNextPage}
                    />
                </div>
            ) : (
                <div id={registrationPanelId} aria-label="注册明细" role="tabpanel">
                    <RegistrationRecordTable
                        items={registrationPagination.visibleItems}
                        status={registrationPagination.status}
                        onLoadNextPage={registrationPagination.loadNextPage}
                    />
                </div>
            )}
        </section>
    )
}
