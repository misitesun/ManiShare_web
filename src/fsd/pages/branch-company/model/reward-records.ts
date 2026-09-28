export interface BranchCompanyRewardRecord {
    readonly amount: string
    readonly category: string
    readonly date: string
    readonly id: string
    readonly recordNumber: string
}

const rewardRecords = [
    {
        id: 'reward-1',
        recordNumber: '1',
        category: '分红奖励-绩效分红',
        amount: '¥500',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-2',
        recordNumber: '2',
        category: '分红奖励-管理分红',
        amount: '¥300',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-3',
        recordNumber: '3',
        category: '贡献奖励-绩效分红',
        amount: '¥500',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-4',
        recordNumber: '4',
        category: '贡献奖励-管理分红',
        amount: '¥200',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-5',
        recordNumber: '5',
        category: '分红奖励-绩效分红',
        amount: '¥400',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-6',
        recordNumber: '6',
        category: '分红奖励-管理分红',
        amount: '¥500',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-7',
        recordNumber: '7',
        category: '贡献奖励-绩效分红',
        amount: '¥400',
        date: '2026-09-03 14:23:09',
    },
    {
        id: 'reward-8',
        recordNumber: '8',
        category: '城市服务分红',
        amount: '¥200',
        date: '2026-09-03 14:23:09',
    },
] satisfies readonly BranchCompanyRewardRecord[]

export const branchCompanyRewardRecordPages = [
    rewardRecords.slice(0, 4),
    rewardRecords.slice(4, 8),
] satisfies readonly (readonly BranchCompanyRewardRecord[])[]
