'use client'

import type { ReactElement } from 'react'
import { redemptionRecords } from '../model/redemption-records'

export function RedemptionRecordsPanel(): ReactElement {
    return (
        <div className="min-w-0 overflow-x-auto rounded-xl [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] table-fixed text-center">
                <colgroup>
                    <col className="w-1/5 xl:min-[1920px]:w-[246px]" />
                    <col className="w-1/5 xl:min-[1920px]:w-[240px]" />
                    <col className="w-1/5 xl:min-[1920px]:w-[240px]" />
                    <col className="w-1/5 xl:min-[1920px]:w-[240px]" />
                    <col className="w-1/5 xl:min-[1920px]:w-[246px]" />
                </colgroup>
                <thead className="h-[54px] bg-surface-raised text-body-tight text-foreground">
                    <tr>
                        <th className="px-2 font-medium first:pl-[14px] last:pr-[14px]" scope="col">
                            序号
                        </th>
                        <th className="px-2 font-medium first:pl-[14px] last:pr-[14px]" scope="col">
                            类型
                        </th>
                        <th className="px-2 font-medium first:pl-[14px] last:pr-[14px]" scope="col">
                            内容
                        </th>
                        <th className="px-2 font-medium first:pl-[14px] last:pr-[14px]" scope="col">
                            状态
                        </th>
                        <th className="px-2 font-medium first:pl-[14px] last:pr-[14px]" scope="col">
                            日期
                        </th>
                    </tr>
                </thead>
                <tbody className="relative -top-px text-label tracking-[0.01em] text-foreground">
                    {redemptionRecords.map((record, index) => (
                        <tr
                            key={record.id}
                            className={
                                index % 2 === 0
                                    ? 'h-[52px] bg-surface-recessed'
                                    : 'h-[52px] bg-surface-raised'
                            }
                        >
                            <td className="pl-[14px] pr-2">{record.index}</td>
                            <td className="px-2">{record.type}</td>
                            <td className="px-2">{record.content}</td>
                            <td className="px-2">
                                <span className="inline-flex h-6 w-[66px] items-center justify-center whitespace-nowrap rounded-full border border-status-positive/40 bg-status-positive/10 text-caption-tight tracking-normal text-status-positive">
                                    成功
                                </span>
                            </td>
                            <td className="whitespace-nowrap pl-2 pr-[14px]">
                                {record.redeemedAt}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
