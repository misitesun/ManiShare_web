import type { TldMembershipTone } from '../../../shared/ui/tld-membership-badge'
import avatar01Source from '../assets/avatar-01.png'
import avatar02Source from '../assets/avatar-02.png'
import avatar03Source from '../assets/avatar-03.png'
import avatar04Source from '../assets/avatar-04.png'
import avatar05Source from '../assets/avatar-05.png'
import avatar06Source from '../assets/avatar-06.png'
import avatar07Source from '../assets/avatar-07.png'
import avatar08Source from '../assets/avatar-08.png'
import avatar09Source from '../assets/avatar-09.png'
import avatar10Source from '../assets/avatar-10.png'
import avatar11Source from '../assets/avatar-11.png'
import currentUserAvatarSource from '../assets/current-user.png'

export type LeaderboardLevelTone = 'blue' | 'danger' | 'magenta' | 'success' | 'warning'
export type LeaderboardMetric = 'duration' | 'points'
export type LeaderboardPeriod = 'all' | 'month' | 'week' | 'year'

export interface LeaderboardEntry {
    readonly avatarSource: string
    readonly duration: string
    readonly id: string
    readonly level: string
    readonly levelTone: LeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
    readonly points: number
    readonly rank: number
    readonly signature: string
}

export interface CurrentLeaderboardUser {
    readonly avatarSource: string
    readonly level: string
    readonly levelTone: LeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
    readonly signature: string
}

const designEntries: readonly LeaderboardEntry[] = [
    {
        avatarSource: avatar01Source,
        duration: '21小时34分钟',
        id: 'rank-1',
        level: 'Lv2初音',
        levelTone: 'danger',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: 'Emily',
        points: 21860,
        rank: 1,
        signature: '这个学员很神秘～还没有留下签名',
    },
    {
        avatarSource: avatar02Source,
        duration: '20小时23分钟',
        id: 'rank-2',
        level: 'Lv9词启',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '小北',
        points: 20540,
        rank: 2,
        signature: '打卡不是炫耀，是悄悄把“我不行”变成“我试试”。',
    },
    {
        avatarSource: avatar03Source,
        duration: '19小时28分钟',
        id: 'rank-3',
        level: 'Lv78通律',
        levelTone: 'blue',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: 'TO荼靡',
        points: 19680,
        rank: 3,
        signature: '知识会忘，计划会乱，但坚持打卡的习惯不会骗人。',
    },
    {
        avatarSource: avatar04Source,
        duration: '19小时19分钟',
        id: 'rank-4',
        level: 'Lv59意凝',
        levelTone: 'success',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: '浮生若茶',
        points: 19320,
        rank: 4,
        signature: '所谓进步，不过是把“再坚持一天”重复了一百遍。',
    },
    {
        avatarSource: avatar05Source,
        duration: '19小时16分钟',
        id: 'rank-5',
        level: 'Lv99言御',
        levelTone: 'blue',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: 'Jiaxin xxx',
        points: 19080,
        rank: 5,
        signature: '别人追剧，我追课程，进度条里藏着未来的可能性。',
    },
    {
        avatarSource: avatar06Source,
        duration: '18小时24分钟',
        id: 'rank-6',
        level: 'Lv100言灵',
        levelTone: 'magenta',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '暮色',
        points: 18460,
        rank: 6,
        signature: '这个学员很神秘～还没有留下签名',
    },
    {
        avatarSource: avatar07Source,
        duration: '18小时20分钟',
        id: 'rank-7',
        level: 'Lv99言御',
        levelTone: 'blue',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: 'Hello',
        points: 18190,
        rank: 7,
        signature: '单词会忘，语法会乱，但坚持打卡的习惯不会骗人。',
    },
    {
        avatarSource: avatar08Source,
        duration: '18小时18分钟',
        id: 'rank-8',
        level: 'Lv1初音',
        levelTone: 'danger',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '往日不再',
        points: 17950,
        rank: 8,
        signature: '每一个对勾，都是我对“放弃”说的一次“不”。',
    },
    {
        avatarSource: avatar09Source,
        duration: '17小时34分钟',
        id: 'rank-9',
        level: 'Lv20语通',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: 'Ya ha h',
        points: 17380,
        rank: 9,
        signature: '坚持打卡不是苦行',
    },
    {
        avatarSource: avatar10Source,
        duration: '17小时29分钟',
        id: 'rank-10',
        level: 'Lv59意凝',
        levelTone: 'success',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: 'E Chin',
        points: 17120,
        rank: 10,
        signature: '这个学员很神秘～还没有留下签名',
    },
    {
        avatarSource: avatar11Source,
        duration: '16小时34分钟',
        id: 'rank-11',
        level: 'Lv9词启',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '大良胖民',
        points: 16540,
        rank: 11,
        signature: '时间会给你答案',
    },
]

const continuationNames = [
    '青柠汽水',
    '听风',
    '山海之间',
    '星河入梦',
    '云朵收藏家',
    '慢慢来',
    '北岸',
    '一颗小树',
    '月光信箱',
    '向阳生长',
    '拾光者',
    '橘子海',
    '远山',
    '未眠',
    '夏日回声',
    '纸飞机',
    '小岛日记',
    '晴天',
    '微光',
    '路过人间',
    '去看海',
    '晚风来信',
] as const

function getDesignEntry(index: number): LeaderboardEntry {
    const entry = designEntries[index % designEntries.length]
    if (entry === undefined) throw new Error('Leaderboard design entries cannot be empty.')
    return entry
}

function getContinuationName(index: number, rank: number): string {
    return continuationNames[index] ?? `学员${rank}`
}

function createContinuationEntry(index: number): LeaderboardEntry {
    const rank = designEntries.length + index + 1
    const source = getDesignEntry(index)
    const hours = Math.max(8, 16 - Math.floor(index / 3))
    const minutes = (31 + index * 17) % 60

    return {
        ...source,
        duration: `${hours}小时${minutes}分钟`,
        id: `rank-${rank}`,
        name: getContinuationName(index, rank),
        points: Math.max(5200, 16400 - index * 390),
        rank,
    }
}

const leaderboardEntries = [
    ...designEntries,
    ...continuationNames.map((_, index) => createContinuationEntry(index)),
]

export const currentLeaderboardUser: CurrentLeaderboardUser = {
    avatarSource: currentUserAvatarSource,
    level: 'Lv59意凝',
    levelTone: 'success',
    membershipLabel: '终身VIP',
    membershipTone: 'lifetime',
    name: 'LIOP',
    signature: '天道酬勤',
}

export function getLeaderboardPages(pageSize = 11): readonly (readonly LeaderboardEntry[])[] {
    if (pageSize <= 0) return []

    return Array.from({ length: Math.ceil(leaderboardEntries.length / pageSize) }, (_, index) =>
        leaderboardEntries.slice(index * pageSize, (index + 1) * pageSize),
    )
}

export function getLeaderboardMetricLabel(metric: LeaderboardMetric): string {
    return metric === 'duration' ? '时长' : '积分'
}

export function getLeaderboardMetricValue(
    entry: LeaderboardEntry,
    metric: LeaderboardMetric,
): string {
    return metric === 'duration' ? entry.duration : `${entry.points}分`
}
