import type { ReactElement } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import type { RegistrationRecord } from '../model/registration-records'

interface RegistrationRecordTableProps {
    readonly items: readonly RegistrationRecord[]
    readonly onLoadNextPage: () => void
    readonly status: TldPaginationStatusValue
}

export function RegistrationRecordTable({
    items,
    onLoadNextPage,
    status,
}: RegistrationRecordTableProps): ReactElement {
    return (
        <>
            <div className="mt-4 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[1212px] table-fixed text-center">
                    <thead className="h-[54px] bg-surface-raised text-body text-secondary">
                        <tr>
                            <th className="w-[120px] px-2 font-medium" scope="col">
                                ID
                            </th>
                            <th className="w-[146px] px-2 font-medium" scope="col">
                                用户昵称
                            </th>
                            <th className="w-[104px] px-2 font-medium" scope="col">
                                头像
                            </th>
                            <th className="w-[130px] px-2 font-medium" scope="col">
                                微信号
                            </th>
                            <th className="w-[130px] px-2 font-medium" scope="col">
                                邮箱
                            </th>
                            <th className="w-[120px] px-2 font-medium" scope="col">
                                VIP类型
                            </th>
                            <th className="w-[150px] px-2 font-medium" scope="col">
                                下单时间
                            </th>
                            <th className="w-[150px] px-2 font-medium" scope="col">
                                到期时间
                            </th>
                            <th className="w-[162px] px-2 font-medium" scope="col">
                                注册时间
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-label text-secondary">
                        {items.map((item, index) => (
                            <tr
                                key={item.id}
                                className={
                                    index % 2 === 0
                                        ? 'h-[52px] bg-canvas'
                                        : 'h-[52px] bg-surface-raised'
                                }
                            >
                                <td className="px-2">{item.registrationId}</td>
                                <td className="truncate px-2">{item.nickname}</td>
                                <td className="px-2">
                                    <img
                                        alt=""
                                        aria-hidden="true"
                                        className="mx-auto size-7 rounded-full object-cover"
                                        src={item.avatarSource}
                                    />
                                </td>
                                <td className="truncate px-2">{item.wechatId ?? '------'}</td>
                                <td className="whitespace-nowrap px-0 text-left">
                                    {item.email ?? '------'}
                                </td>
                                <td className="px-2">{item.vipType}</td>
                                <td className="whitespace-nowrap px-2">{item.orderedAt}</td>
                                <td className="whitespace-nowrap px-2">{item.expiresAt}</td>
                                <td className="whitespace-nowrap px-2">{item.registeredAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={status === 'idle' ? 'pt-[300px]' : 'pt-0'}>
                <TldPaginationStatus status={status} onLoadNextPage={onLoadNextPage} />
            </div>
        </>
    )
}
