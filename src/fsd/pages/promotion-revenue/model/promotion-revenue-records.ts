export interface CommissionRecord {
    readonly amount: string
    readonly commission: string
    readonly date: string
    readonly id: string
    readonly orderNumber: string
    readonly type: string
    readonly userId: string
}

export const commissionRecordPages = [
    [
        {
            id: 'commission-1',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '周卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-03 14:23:09',
        },
        {
            id: 'commission-2',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '月卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-03 14:23:09',
        },
        {
            id: 'commission-3',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '季卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-03 14:23:09',
        },
        {
            id: 'commission-4',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '年卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-03 14:23:09',
        },
        {
            id: 'commission-5',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '外语逆袭秘籍',
            amount: '¥299',
            commission: '¥5',
            date: '2026-09-03 14:23:09',
        },
        {
            id: 'commission-6',
            orderNumber: '1409238906',
            userId: '150567834560',
            type: '外语逆袭秘籍（课程名称）',
            amount: '¥299',
            commission: '¥5',
            date: '2026-09-03 14:23:09',
        },
    ],
    [
        {
            id: 'commission-7',
            orderNumber: '1409238907',
            userId: '150567834561',
            type: '周卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-02 14:23:09',
        },
        {
            id: 'commission-8',
            orderNumber: '1409238908',
            userId: '150567834562',
            type: '月卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-02 13:23:09',
        },
        {
            id: 'commission-9',
            orderNumber: '1409238909',
            userId: '150567834563',
            type: '季卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-02 12:23:09',
        },
        {
            id: 'commission-10',
            orderNumber: '1409238910',
            userId: '150567834564',
            type: '年卡',
            amount: '¥9.9',
            commission: '¥1',
            date: '2026-09-02 11:23:09',
        },
        {
            id: 'commission-11',
            orderNumber: '1409238911',
            userId: '150567834565',
            type: '外语逆袭秘籍',
            amount: '¥299',
            commission: '¥5',
            date: '2026-09-02 10:23:09',
        },
        {
            id: 'commission-12',
            orderNumber: '1409238912',
            userId: '150567834566',
            type: '外语逆袭秘籍（课程名称）',
            amount: '¥299',
            commission: '¥5',
            date: '2026-09-02 09:23:09',
        },
    ],
] satisfies readonly (readonly CommissionRecord[])[]
