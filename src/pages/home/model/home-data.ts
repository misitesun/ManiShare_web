import type { TldMembershipTone } from '../../../shared/ui/tld-membership-badge'
import gardenStage0Source from '../assets/garden/stage-0.webp'
import gardenStage1Source from '../assets/garden/stage-1.webp'
import gardenStage2Source from '../assets/garden/stage-2.webp'
import gardenStage3Source from '../assets/garden/stage-3.webp'
import gardenStage4Source from '../assets/garden/stage-4.webp'
import gardenStage5Source from '../assets/garden/stage-5.webp'
import gardenStage6Source from '../assets/garden/stage-6.webp'
import gardenStage7Source from '../assets/garden/stage-7.webp'
import gardenStage8Source from '../assets/garden/stage-8.webp'
import avatar04Source from '../assets/leaderboard/avatar-04.webp'
import avatar05Source from '../assets/leaderboard/avatar-05.webp'
import avatar06Source from '../assets/leaderboard/avatar-06.webp'
import avatar07Source from '../assets/leaderboard/avatar-07.webp'
import avatar08Source from '../assets/leaderboard/avatar-08.webp'
import avatar09Source from '../assets/leaderboard/avatar-09.webp'
import avatar10Source from '../assets/leaderboard/avatar-10.webp'
import avatar11Source from '../assets/leaderboard/avatar-11.webp'
import avatar12Source from '../assets/leaderboard/avatar-12.webp'
import messageAvatar01Source from '../assets/leaderboard/message-avatar-01.png'
import messageAvatar02Source from '../assets/leaderboard/message-avatar-02.png'
import messageAvatar03Source from '../assets/leaderboard/message-avatar-03.png'
import messageAvatar04Source from '../assets/leaderboard/message-avatar-04.png'
import showcase01Source from '../assets/leaderboard/message-avatar-01.png'
import showcase02Source from '../assets/leaderboard/message-avatar-01.png'
import showcase03Source from '../assets/leaderboard/message-avatar-01.png'
import showcase04Source from '../assets/leaderboard/message-avatar-01.png'
import showcase05Source from '../assets/leaderboard/message-avatar-01.png'
import showcase06Source from '../assets/leaderboard/message-avatar-01.png'
import showcase07Source from '../assets/leaderboard/message-avatar-01.png'
import showcase08Source from '../assets/leaderboard/message-avatar-01.png'
import showcase09Source from '../assets/leaderboard/message-avatar-01.png'
import showcase10Source from '../assets/leaderboard/message-avatar-01.png'
import showcase11Source from '../assets/leaderboard/message-avatar-01.png'
import showcase12Source from '../assets/leaderboard/message-avatar-01.png'
import showcase13Source from '../assets/leaderboard/message-avatar-01.png'
import showcase14Source from '../assets/leaderboard/message-avatar-01.png'
import showcase15Source from '../assets/leaderboard/message-avatar-01.png'
import showcase16Source from '../assets/leaderboard/message-avatar-01.png'
import showcase17Source from '../assets/leaderboard/message-avatar-01.png'
import { createLeaderboardRows } from './leaderboard-data'
import type { HomeLeaderboardLevelTone } from './leaderboard-data'

export interface HomeCommunityMessage {
    readonly avatarSource?: string
    readonly day: number
    readonly membershipLabel?: string
    readonly membershipTone?: TldMembershipTone
    readonly message: string
    readonly name: string
}

export interface HomeGardenDay {
    readonly day: number
    readonly minutes: number
    readonly stage: number
}

export interface HomeLeaderboardEntry {
    readonly avatarSource: string
    readonly level: string
    readonly levelTone: HomeLeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
    readonly rank: number
    readonly time: string
}

export const communityMessages: readonly HomeCommunityMessage[] = [
    { day: 23, message: '轻轻路过，留下了今天的足迹。', name: '叮咚~[OIBU]' },
    {
        day: 42,
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        message: '掌声轻轻响起，这份坚持闪闪发光。',
        name: '小满',
        avatarSource: messageAvatar01Source,
    },
    {
        day: 45,
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        message: '已沉浸在学习中，这份专注令人敬佩。',
        name: '一口好酸奶',
        avatarSource: messageAvatar02Source,
    },
    { day: 16, message: '来啦！今日的一份坚持已入账。', name: '星星' },
    {
        day: 12,
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        message: '你是漫奇的家人，今日也辛苦啦。',
        name: '致「小樱」',
        avatarSource: messageAvatar03Source,
    },
    {
        day: 8,
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        message: '完成了新的学习目标，为你喝彩！',
        name: '海盐汽水',
        avatarSource: messageAvatar04Source,
    },
]

export const gardenStageSources: readonly string[] = [
    gardenStage0Source,
    gardenStage1Source,
    gardenStage2Source,
    gardenStage3Source,
    gardenStage4Source,
    gardenStage5Source,
    gardenStage6Source,
    gardenStage7Source,
    gardenStage8Source,
]

export const gardenDays: readonly HomeGardenDay[] = [
    { day: 1, minutes: 0, stage: 0 },
    { day: 2, minutes: 1, stage: 1 },
    { day: 3, minutes: 2, stage: 1 },
    { day: 4, minutes: 6, stage: 2 },
    { day: 5, minutes: 12, stage: 3 },
    { day: 6, minutes: 0, stage: 0 },
    { day: 7, minutes: 18, stage: 4 },
    { day: 8, minutes: 3, stage: 1 },
    { day: 9, minutes: 7, stage: 2 },
    { day: 10, minutes: 10, stage: 3 },
    { day: 11, minutes: 24, stage: 5 },
    { day: 12, minutes: 42, stage: 8 },
    { day: 13, minutes: 0, stage: 0 },
    { day: 14, minutes: 5, stage: 2 },
    { day: 15, minutes: 9, stage: 3 },
    { day: 16, minutes: 4, stage: 1 },
    { day: 17, minutes: 13, stage: 4 },
    { day: 18, minutes: 31, stage: 7 },
    { day: 19, minutes: 0, stage: 0 },
    { day: 20, minutes: 8, stage: 2 },
    { day: 21, minutes: 14, stage: 4 },
    { day: 22, minutes: 38, stage: 8 },
    { day: 23, minutes: 20, stage: 5 },
    { day: 24, minutes: 0, stage: 0 },
    { day: 25, minutes: 16, stage: 4 },
    { day: 26, minutes: 0, stage: 0 },
    { day: 27, minutes: 34, stage: 7 },
    { day: 28, minutes: 6, stage: 2 },
    { day: 29, minutes: 11, stage: 3 },
    { day: 30, minutes: 4, stage: 1 },
    { day: 31, minutes: 19, stage: 5 },
]

const leaderboardAvatarSources: readonly string[] = [
    avatar04Source,
    avatar05Source,
    avatar06Source,
    avatar07Source,
    avatar08Source,
    avatar09Source,
    avatar10Source,
    avatar11Source,
    avatar12Source,
]

export const leaderboardEntries: readonly HomeLeaderboardEntry[] = createLeaderboardRows().map(
    (entry) => ({
        avatarSource: leaderboardAvatarSources[entry.avatarIndex] ?? avatar04Source,
        level: entry.level,
        levelTone: entry.levelTone,
        membershipLabel: entry.membershipLabel,
        membershipTone: entry.membershipTone,
        name: entry.name,
        rank: entry.rank,
        time: entry.time,
    }),
)

export const showcaseSources: readonly string[] = [
    showcase01Source,
    showcase02Source,
    showcase03Source,
    showcase04Source,
    showcase05Source,
    showcase06Source,
    showcase07Source,
    showcase08Source,
    showcase09Source,
    showcase10Source,
    showcase11Source,
    showcase12Source,
    showcase13Source,
    showcase14Source,
    showcase15Source,
    showcase16Source,
    showcase17Source,
]
