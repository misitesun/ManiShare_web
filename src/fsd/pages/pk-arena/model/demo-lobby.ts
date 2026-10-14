import type { TldMembershipTone } from '../../../shared/ui/tld-membership-badge'
import coverAsset from '../assets/course-cover.png'
import hostAsset from '../assets/host-avatar.svg'
import firstAsset from '../assets/avatar-first.png'
import secondAsset from '../assets/avatar-second.png'
import thirdAsset from '../assets/avatar-third.png'
import rowAvatar4 from '../assets/ranking-4.png'
import rowAvatar5 from '../assets/ranking-5.png'
import rowAvatar6 from '../assets/ranking-6.png'
import rowAvatar7 from '../assets/ranking-7.png'
import rowAvatar8 from '../assets/ranking-8.png'
import rowAvatar9 from '../assets/ranking-9.png'
import rowAvatar10 from '../assets/ranking-10.png'
import rowAvatar11 from '../assets/ranking-11.png'
import rowAvatar12 from '../assets/ranking-12.png'
import type { ArenaRanking, ArenaRoom } from './lobby-state'

export const roomCoverSource: string = coverAsset.src
export const hostAvatarSource: string = hostAsset.src

export const ownedRoom: ArenaRoom = {
    id: 'demo-owned-room',
    number: '10',
    host: '漫奇宝宝2908',
    online: false,
    createdAgo: '10分钟前创建',
    course: '小学英语语法入门',
    chapter: 'Topic 1 - Classroom',
    mode: '听写模式',
    writing: '抄写/默写',
}

export const demoRooms: readonly ArenaRoom[] = Array.from({ length: 8 }, (_, index) =>
    index === 0
        ? ownedRoom
        : {
              ...ownedRoom,
              id: `demo-room-${index}`,
              number: String(1289 + index),
              host: 'EWP',
              online: false,
              createdAgo: '10分钟前创建',
          },
)

export interface ArenaRankEntry {
    readonly id: string
    readonly name: string
    readonly avatar: string
    readonly membership: string
    readonly tone: TldMembershipTone
    readonly wins: number
    readonly games: number
    readonly rate: number
}

const topEntries: readonly ArenaRankEntry[] = [
    {
        id: 'rank-1',
        name: '啷个哩个啷',
        avatar: firstAsset.src,
        membership: '终身VIP',
        tone: 'lifetime',
        wins: 30,
        games: 50,
        rate: 96,
    },
    {
        id: 'rank-2',
        name: '艾琳',
        avatar: secondAsset.src,
        membership: '黄金VIP',
        tone: 'gold',
        wins: 28,
        games: 46,
        rate: 92,
    },
    {
        id: 'rank-3',
        name: 'charles',
        avatar: thirdAsset.src,
        membership: '漫奇天使',
        tone: 'angel',
        wins: 24,
        games: 42,
        rate: 88,
    },
]
const rowNames = [
    '陈咬金',
    'mosquito',
    'ad君-',
    '青晨',
    '爱嗑瓜子的猫',
    '小米智能|文武',
    'W.P.Y',
    '怡宝',
    '走丢的棒棒糖',
]
const rowWins = [22, 20, 19, 19, 16, 14, 12, 11, 10]
const rowAvatars = [
    rowAvatar4.src,
    rowAvatar5.src,
    rowAvatar6.src,
    rowAvatar7.src,
    rowAvatar8.src,
    rowAvatar9.src,
    rowAvatar10.src,
    rowAvatar11.src,
    rowAvatar12.src,
]
const rowTones: readonly TldMembershipTone[] = [
    'gold',
    'lifetime',
    'trial',
    'angel',
    'gold',
    'trial',
    'lifetime',
    'gold',
    'trial',
]
const membershipLabels = {
    gold: '黄金VIP',
    lifetime: '终身VIP',
    trial: '免费体验',
    angel: '漫奇天使',
} as const
export const demoRankEntries: readonly ArenaRankEntry[] = [
    ...topEntries,
    ...rowNames.map((name, index) => ({
        id: `rank-${index + 4}`,
        name,
        avatar: rowAvatars[index] ?? firstAsset.src,
        membership: membershipLabels[rowTones[index] ?? 'trial'],
        tone: rowTones[index] ?? 'trial',
        wins: rowWins[index] ?? 0,
        games: 38 - index * 2,
        rate: 86 - index * 3,
    })),
]

export const arenaRankings: readonly { id: ArenaRanking; label: string }[] = [
    { id: 'wins', label: '胜利榜' },
    { id: 'games', label: '场数榜' },
    { id: 'rate', label: '胜率榜' },
]

export function rankValue(entry: ArenaRankEntry, ranking: ArenaRanking): string {
    return ranking === 'rate' ? `${entry.rate}%` : `${entry[ranking]}场`
}
