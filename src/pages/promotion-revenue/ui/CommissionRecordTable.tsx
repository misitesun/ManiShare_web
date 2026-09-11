import type { ReactElement } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import type { CommissionRecord } from '../model/promotion-revenue-records'

interface CommissionRecordTableProps {
    readonly items: readonly CommissionRecord[]
    readonly onLoadNextPage: () => void
    readonly status: TldPaginationStatusValue
}

export function CommissionRecordTable({
    items,
    onLoadNextPage,
    status,
}: CommissionRecordTableProps): ReactElement {
    return (
        <>
            <div className="mt-4 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[1050px] table-fixed text-left">
                    <thead className="h-[54px] bg-surface-raised text-body text-secondary">
                        <tr>
                            <th className="w-[17%] px-12 font-medium">订单号</th>
                            <th className="w-[18%] px-8 font-medium">用户ID</th>
                            <th className="w-[22%] px-8 font-medium">类型</th>
                            <th className="w-[12%] px-8 font-medium">金额</th>
                            <th className="w-[12%] px-8 font-medium">佣金</th>
                            <th className="w-[19%] px-8 font-medium">日期</th>
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
                                <td className="truncate px-12">{item.orderNumber}</td>
                                <td className="truncate px-8">{item.userId}</td>
                                <td className="truncate px-8" title={item.type}>
                                    {item.type}
                                </td>
                                <td className="truncate px-8">{item.amount}</td>
                                <td className="truncate px-8">{item.commission}</td>
                                <td className="whitespace-nowrap px-8">{item.date}</td>
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
