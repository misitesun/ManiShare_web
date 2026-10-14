'use client'

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
        <div className="flex min-h-[calc(100svh-260px)] flex-col">
            <div className="mt-4 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[1212px] table-fixed text-center">
                    <thead className="h-[54px] bg-surface-raised text-body-tight text-content-strong">
                        <tr>
                            <th scope="col" className="w-[196px] px-2 font-medium">
                                订单号
                            </th>
                            <th scope="col" className="w-[237px] px-2 font-medium">
                                用户ID
                            </th>
                            <th scope="col" className="w-[180px] px-1 font-medium">
                                类型
                            </th>
                            <th scope="col" className="w-[220px] px-2 font-medium">
                                金额
                            </th>
                            <th scope="col" className="w-[180px] px-2 font-medium">
                                佣金
                            </th>
                            <th scope="col" className="w-[199px] px-2 font-medium">
                                日期
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-label tracking-[0.01em] text-content-strong">
                        {items.map((item, index) => (
                            <tr
                                key={item.id}
                                className={
                                    index % 2 === 0
                                        ? 'h-11 bg-row-alternate'
                                        : 'h-11 bg-surface-raised'
                                }
                            >
                                <td className="truncate px-2">{item.orderNumber}</td>
                                <td className="truncate px-2">{item.userId}</td>
                                <td className="truncate px-1" title={item.type}>
                                    {item.type}
                                </td>
                                <td className="truncate px-2">{item.amount}</td>
                                <td className="truncate px-2">{item.commission}</td>
                                <td className="whitespace-nowrap px-2">{item.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-auto">
                <TldPaginationStatus status={status} onLoadNextPage={onLoadNextPage} />
            </div>
        </div>
    )
}
