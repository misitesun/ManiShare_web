import type { ReactElement } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import type { BranchCompanyRewardRecord } from '../model/reward-records'

interface RewardRecordTableProps {
    readonly items: readonly BranchCompanyRewardRecord[]
    readonly onLoadNextPage: () => void
    readonly status: TldPaginationStatusValue
}

export function RewardRecordTable({
    items,
    onLoadNextPage,
    status,
}: RewardRecordTableProps): ReactElement {
    return (
        <>
            <div className="mt-4 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[720px] table-fixed text-left">
                    <thead className="h-[54px] bg-surface-raised text-body text-secondary">
                        <tr>
                            <th className="w-[16%] px-6 font-medium md:px-12" scope="col">
                                ID
                            </th>
                            <th className="w-[38%] px-6 font-medium md:px-8" scope="col">
                                类别
                            </th>
                            <th className="w-[20%] px-6 font-medium md:px-8" scope="col">
                                分红金额
                            </th>
                            <th className="w-[26%] px-6 font-medium md:px-8" scope="col">
                                时间
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-label text-secondary">
                        {items.map((item, index) => (
                            <tr
                                key={item.id}
                                className={
                                    index % 2 === 0 ? 'h-11 bg-canvas' : 'h-11 bg-surface-raised'
                                }
                            >
                                <td className="truncate px-6 md:px-12">{item.recordNumber}</td>
                                <td className="truncate px-6 md:px-8" title={item.category}>
                                    {item.category}
                                </td>
                                <td className="truncate px-6 md:px-8">{item.amount}</td>
                                <td className="whitespace-nowrap px-6 md:px-8">{item.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={status === 'idle' ? 'pt-40' : 'pt-0'}>
                <TldPaginationStatus status={status} onLoadNextPage={onLoadNextPage} />
            </div>
        </>
    )
}
