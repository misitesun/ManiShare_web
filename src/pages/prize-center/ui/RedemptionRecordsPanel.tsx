import type { ReactElement } from 'react'
import { redemptionRecords } from '../model/redemption-records'

export function RedemptionRecordsPanel(): ReactElement {
    return (
        <div className="min-w-0 overflow-x-auto rounded-xl [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] table-fixed text-center">
                <thead className="h-[54px] bg-surface-raised text-body text-primary">
                    <tr>
                        <th className="px-2 font-medium" scope="col">
                            序号
                        </th>
                        <th className="px-2 font-medium" scope="col">
                            类型
                        </th>
                        <th className="px-2 font-medium" scope="col">
                            内容
                        </th>
                        <th className="px-2 font-medium" scope="col">
                            状态
                        </th>
                        <th className="px-2 font-medium" scope="col">
                            日期
                        </th>
                    </tr>
                </thead>
                <tbody className="text-label text-primary">
                    {redemptionRecords.map((record, index) => (
                        <tr
                            key={record.id}
                            className={
                                index % 2 === 0
                                    ? 'h-[52px] bg-canvas'
                                    : 'h-[52px] bg-surface-raised'
                            }
                        >
                            <td className="px-2">{record.index}</td>
                            <td className="px-2">{record.type}</td>
                            <td className="px-2">{record.content}</td>
                            <td className="px-2">
                                <span className="inline-flex h-6 w-[66px] items-center justify-center whitespace-nowrap rounded-full border border-success/40 bg-success/10 text-caption text-success">
                                    成功
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-2">{record.redeemedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
