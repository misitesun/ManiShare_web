import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { Tooltip } from '../../../shared/ui/tooltip'
import type { WithdrawalRecord, WithdrawalStatus } from '../model/withdrawal-records'

interface WithdrawalRecordTableProps {
    readonly items: readonly WithdrawalRecord[]
    readonly onLoadNextPage: () => void
    readonly status: TldPaginationStatusValue
}

interface WithdrawalStatusBadgeProps {
    readonly status: WithdrawalStatus
}

function WithdrawalStatusBadge({ status }: WithdrawalStatusBadgeProps): ReactElement {
    const label = status === 'reviewing' ? '审核中' : status === 'failed' ? '审核失败' : '审核通过'

    return (
        <span
            className={
                status === 'reviewing'
                    ? 'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-warning/40 bg-warning/10 px-3 text-caption text-warning'
                    : status === 'failed'
                      ? 'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-danger/40 bg-danger/10 px-3 text-caption text-danger'
                      : 'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-success/40 bg-success/10 px-3 text-caption text-success'
            }
        >
            {label}
        </span>
    )
}

function formatBankCardNumber(bankCardNumber: string): ReactElement {
    return (
        <>
            {bankCardNumber.slice(0, 8)}
            <br />
            {bankCardNumber.slice(8)}
        </>
    )
}

function formatBankName(bankName: string): ReactElement {
    return (
        <>
            {bankName.slice(0, 4)}
            <br />
            {bankName.slice(4)}
        </>
    )
}

export function WithdrawalRecordTable({
    items,
    onLoadNextPage,
    status,
}: WithdrawalRecordTableProps): ReactElement {
    const [selectedPaymentRecordId, setSelectedPaymentRecordId] = useState<string | null>(null)
    const selectedPaymentRecord = items.find((item) => item.id === selectedPaymentRecordId) ?? null

    function handlePaymentDialogOpenChange(open: boolean): void {
        if (!open) setSelectedPaymentRecordId(null)
    }

    return (
        <>
            <div className="mt-4 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[1212px] table-fixed text-center">
                    <thead className="h-[54px] bg-surface-raised text-body text-secondary">
                        <tr>
                            <th className="w-[72px] px-2 font-medium">提现ID</th>
                            <th className="w-[88px] px-2 font-medium">用户ID</th>
                            <th className="w-[70px] px-2 font-medium">收款码</th>
                            <th className="w-[104px] px-2 font-medium">银行卡号</th>
                            <th className="w-[100px] px-2 font-medium">开户行</th>
                            <th className="w-[70px] px-2 font-medium">开户人</th>
                            <th className="w-[88px] px-2 font-medium">提现金额</th>
                            <th className="w-[72px] px-2 font-medium">手续费</th>
                            <th className="w-[88px] px-2 font-medium">实际到账</th>
                            <th className="w-[94px] px-2 font-medium">提现状态</th>
                            <th className="w-[104px] px-2 font-medium">审核说明</th>
                            <th className="w-[126px] px-2 font-medium">创建时间</th>
                            <th className="w-[136px] px-2 font-medium">审核时间</th>
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
                                <td className="px-2">{item.withdrawalId}</td>
                                <td className="px-2">{item.userId}</td>
                                <td className="px-2">
                                    {item.paymentCodeSource === undefined ? (
                                        '------'
                                    ) : (
                                        <button
                                            type="button"
                                            aria-label={`查看提现 ${item.withdrawalId} 的收款码`}
                                            className="mx-auto block size-7 cursor-pointer overflow-hidden transition-opacity hover:opacity-80"
                                            onClick={(): void =>
                                                setSelectedPaymentRecordId(item.id)
                                            }
                                        >
                                            <img
                                                alt=""
                                                aria-hidden="true"
                                                className="size-full object-cover"
                                                src={item.paymentCodeSource}
                                            />
                                        </button>
                                    )}
                                </td>
                                <td className="px-2 leading-[18px]">
                                    {item.bankCardNumber === undefined
                                        ? '------'
                                        : formatBankCardNumber(item.bankCardNumber)}
                                </td>
                                <td className="px-2 leading-[18px]">
                                    {item.bankName === undefined
                                        ? '------'
                                        : formatBankName(item.bankName)}
                                </td>
                                <td className="px-2">{item.accountHolder ?? '------'}</td>
                                <td className="px-2">{item.amount}</td>
                                <td className="px-2">{item.fee}</td>
                                <td className="px-2">{item.actualAmount}</td>
                                <td className="px-2">
                                    <WithdrawalStatusBadge status={item.status} />
                                </td>
                                <td className="px-2">
                                    {item.reviewNote === undefined ? (
                                        '------'
                                    ) : (
                                        <Tooltip
                                            fullWidth
                                            content={item.reviewNote}
                                            placement="top"
                                        >
                                            <span
                                                className="block w-full truncate outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                                tabIndex={0}
                                            >
                                                {item.reviewNote}
                                            </span>
                                        </Tooltip>
                                    )}
                                </td>
                                <td className="px-2">{item.createdAt}</td>
                                <td className="px-2">{item.reviewedAt ?? '------'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={status === 'idle' ? 'pt-[300px]' : 'pt-0'}>
                <TldPaginationStatus status={status} onLoadNextPage={onLoadNextPage} />
            </div>

            <TldDialog
                confirmLabel="关闭"
                onOpenChange={handlePaymentDialogOpenChange}
                open={selectedPaymentRecord?.paymentCodeSource !== undefined}
                showCancelButton={false}
                size="small"
                title="查看收款码"
            >
                {selectedPaymentRecord?.paymentCodeSource === undefined ? null : (
                    <div className="flex flex-col items-center gap-3 py-2">
                        <img
                            alt={`提现 ${selectedPaymentRecord.withdrawalId} 的收款二维码`}
                            className="size-[260px] max-w-full rounded-xl object-contain"
                            src={selectedPaymentRecord.paymentCodeSource}
                        />
                        <p className="text-label text-muted">
                            提现ID：{selectedPaymentRecord.withdrawalId}
                        </p>
                    </div>
                )}
            </TldDialog>
        </>
    )
}
