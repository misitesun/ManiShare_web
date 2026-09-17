import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import {
    WithdrawalRecordTable,
    useWithdrawalRecordPagination,
    withdrawalRecordPages,
} from '../../../widgets/withdrawal-records'
import { branchCompanyRewardRecordPages } from '../model/reward-records'
import { useBranchCompanyPagination } from '../model/useBranchCompanyPagination'
import { BranchCompanyOverview } from './BranchCompanyOverview'
import { RewardRecordTable } from './RewardRecordTable'

type BranchCompanyView = 'rewards' | 'withdrawals'

const rewardsPanelId = 'branch-company-rewards-panel'
const withdrawalsPanelId = 'branch-company-withdrawals-panel'

const branchCompanyTabs = [
    { id: 'rewards', label: '奖励明细', panelId: rewardsPanelId },
    { id: 'withdrawals', label: '提现明细', panelId: withdrawalsPanelId },
] satisfies readonly TldSegmentedTabItem[]

export function BranchCompanyPage(): ReactElement {
    const [activeView, setActiveView] = useState<BranchCompanyView>('rewards')
    const rewardPagination = useBranchCompanyPagination(branchCompanyRewardRecordPages)
    const withdrawalPagination = useWithdrawalRecordPagination(withdrawalRecordPages)

    function selectView(value: string): void {
        if (value === 'rewards' || value === 'withdrawals') setActiveView(value)
    }

    return (
        <section
            aria-label="分公司"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-6 xl:min-[1920px]:px-[254px]"
        >
            <BranchCompanyOverview />

            <div className="mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TldSegmentedTabs
                    ariaLabel="分公司明细类型"
                    items={branchCompanyTabs}
                    value={activeView}
                    variant="underline"
                    onValueChange={selectView}
                />
            </div>

            {activeView === 'rewards' ? (
                <div id={rewardsPanelId} aria-label="奖励明细" role="tabpanel">
                    <RewardRecordTable
                        items={rewardPagination.visibleItems}
                        status={rewardPagination.status}
                        onLoadNextPage={rewardPagination.loadNextPage}
                    />
                </div>
            ) : (
                <div
                    id={withdrawalsPanelId}
                    aria-label="提现明细"
                    className="pt-[14px]"
                    role="tabpanel"
                >
                    <WithdrawalRecordTable
                        items={withdrawalPagination.visibleItems}
                        status={withdrawalPagination.status}
                        onLoadNextPage={withdrawalPagination.loadNextPage}
                    />
                </div>
            )}
        </section>
    )
}
