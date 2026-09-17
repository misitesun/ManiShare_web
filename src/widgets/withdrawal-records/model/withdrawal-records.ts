import paymentQrSource from '../assets/payment-qr.png'

export type WithdrawalStatus = 'approved' | 'failed' | 'reviewing'

export interface WithdrawalRecord {
    readonly accountHolder?: string
    readonly actualAmount: string
    readonly amount: string
    readonly bankCardNumber?: string
    readonly bankName?: string
    readonly createdAt: string
    readonly fee: string
    readonly id: string
    readonly paymentCodeSource?: string
    readonly reviewNote?: string
    readonly reviewedAt?: string
    readonly status: WithdrawalStatus
    readonly userId: string
    readonly withdrawalId: string
}

export const withdrawalRecordPages = [
    [
        {
            id: 'withdrawal-1',
            withdrawalId: '1',
            userId: '23890987',
            paymentCodeSource: paymentQrSource,
            amount: '¥100',
            fee: '¥10',
            actualAmount: '¥90',
            status: 'reviewing',
            createdAt: '2026.09-03',
            reviewedAt: '2026.09-05',
        },
        {
            id: 'withdrawal-2',
            withdrawalId: '2',
            userId: '23890987',
            bankCardNumber: '6210933890934890',
            bankName: '中国银行阳光路支行',
            accountHolder: '张飞',
            amount: '¥100',
            fee: '¥10',
            actualAmount: '¥90',
            status: 'failed',
            reviewNote: '收款码不清晰',
            createdAt: '2026.09-03',
        },
        {
            id: 'withdrawal-3',
            withdrawalId: '3',
            userId: '23890987',
            paymentCodeSource: paymentQrSource,
            bankCardNumber: '6210933890934890',
            bankName: '中国银行阳光路支行',
            accountHolder: '张飞',
            amount: '¥100',
            fee: '¥10',
            actualAmount: '¥90',
            status: 'approved',
            reviewNote: '已打款',
            createdAt: '2026.09-03',
            reviewedAt: '2026.09-05',
        },
    ],
    [
        {
            id: 'withdrawal-4',
            withdrawalId: '4',
            userId: '23890988',
            paymentCodeSource: paymentQrSource,
            amount: '¥200',
            fee: '¥20',
            actualAmount: '¥180',
            status: 'reviewing',
            createdAt: '2026.09-02',
            reviewedAt: '2026.09-04',
        },
        {
            id: 'withdrawal-5',
            withdrawalId: '5',
            userId: '23890989',
            bankCardNumber: '6210933890934891',
            bankName: '中国银行阳光路支行',
            accountHolder: '张飞',
            amount: '¥200',
            fee: '¥20',
            actualAmount: '¥180',
            status: 'failed',
            reviewNote: '收款信息与开户人信息不一致',
            createdAt: '2026.09-02',
        },
        {
            id: 'withdrawal-6',
            withdrawalId: '6',
            userId: '23890990',
            paymentCodeSource: paymentQrSource,
            bankCardNumber: '6210933890934892',
            bankName: '中国银行阳光路支行',
            accountHolder: '张飞',
            amount: '¥200',
            fee: '¥20',
            actualAmount: '¥180',
            status: 'approved',
            reviewNote: '已打款',
            createdAt: '2026.09-02',
            reviewedAt: '2026.09-04',
        },
    ],
] satisfies readonly (readonly WithdrawalRecord[])[]
