export type RedemptionRecordStatus = 'success'

export interface RedemptionRecord {
    readonly id: string
    readonly index: number
    readonly type: string
    readonly content: string
    readonly status: RedemptionRecordStatus
    readonly redeemedAt: string
}

export const redemptionRecords: readonly RedemptionRecord[] = [
    {
        id: 'redemption-record-1',
        index: 1,
        type: '权益兑换',
        content: '周卡会员',
        status: 'success',
        redeemedAt: '2026.09-01 14:09:23',
    },
    {
        id: 'redemption-record-2',
        index: 2,
        type: '权益兑换',
        content: '月卡会员',
        status: 'success',
        redeemedAt: '2026.09-01 14:09:23',
    },
    {
        id: 'redemption-record-3',
        index: 3,
        type: '权益兑换',
        content: '年卡会员',
        status: 'success',
        redeemedAt: '2026.09-01 14:09:23',
    },
    {
        id: 'redemption-record-4',
        index: 4,
        type: '权益兑换',
        content: '年卡会员',
        status: 'success',
        redeemedAt: '2026.09-01 14:09:23',
    },
]
