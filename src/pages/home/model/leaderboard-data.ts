import type { TldMembershipTone } from '../../../shared/ui/tld-membership-badge'

export type HomeLeaderboardLevelTone = 'blue' | 'danger' | 'success' | 'warning'

export interface HomeLeaderboardRow {
    readonly avatarIndex: number
    readonly level: string
    readonly levelTone: HomeLeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
    readonly rank: number
    readonly time: string
}

interface HomeLeaderboardTemplate {
    readonly avatarIndex: number
    readonly level: string
    readonly levelTone: HomeLeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
    readonly time: string
}

interface GeneratedLeaderboardProfile {
    readonly level: string
    readonly levelTone: HomeLeaderboardLevelTone
    readonly membershipLabel: string
    readonly membershipTone: TldMembershipTone
    readonly name: string
}

const defaultVisibleRowCount = 50

const firstTemplate: HomeLeaderboardTemplate = {
    avatarIndex: 0,
    level: 'Lv9词启',
    levelTone: 'danger',
    membershipLabel: '黄金VIP',
    membershipTone: 'gold',
    name: '一颗草莓',
    time: '4小时56分钟',
}

const designLeaderboardRows: readonly HomeLeaderboardTemplate[] = [
    firstTemplate,
    {
        avatarIndex: 1,
        level: 'Lv2初音',
        levelTone: 'danger',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: 'JinyunC',
        time: '4小时53分钟',
    },
    {
        avatarIndex: 2,
        level: 'Lv78通律',
        levelTone: 'success',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '江菜包',
        time: '4小时30分钟',
    },
    {
        avatarIndex: 3,
        level: 'Lv99言御',
        levelTone: 'blue',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '王力文',
        time: '4小时03分钟',
    },
    {
        avatarIndex: 4,
        level: 'Lv100言灵',
        levelTone: 'success',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: '沧海一粟',
        time: '3小时40分钟',
    },
    {
        avatarIndex: 5,
        level: 'Lv30语通',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '十月',
        time: '3小时20分钟',
    },
    {
        avatarIndex: 6,
        level: 'Lv3初音',
        levelTone: 'danger',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: 'kiwi(猕猴桃)',
        time: '3小时03分钟',
    },
    {
        avatarIndex: 7,
        level: 'Lv100言灵',
        levelTone: 'warning',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: '丹青吃薄荷。',
        time: '2小时15分钟',
    },
    {
        avatarIndex: 8,
        level: 'Lv66通律',
        levelTone: 'success',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: '两百斤土豆',
        time: '2小时15分钟',
    },
]

const generatedProfiles: readonly GeneratedLeaderboardProfile[] = [
    {
        level: 'Lv62通律',
        levelTone: 'success',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '林深见鹿',
    },
    {
        level: 'Lv51语通',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '晚风入怀',
    },
    {
        level: 'Lv88言御',
        levelTone: 'blue',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: '云朵收藏家',
    },
    {
        level: 'Lv24词启',
        levelTone: 'danger',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '小岛来信',
    },
    {
        level: 'Lv73通律',
        levelTone: 'success',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: '长街听雨',
    },
    {
        level: 'Lv36语通',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '北辰',
    },
    {
        level: 'Lv91言御',
        levelTone: 'blue',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '夏日柠檬',
    },
    {
        level: 'Lv18词启',
        levelTone: 'danger',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: '青禾',
    },
    {
        level: 'Lv57通律',
        levelTone: 'success',
        membershipLabel: '终身VIP',
        membershipTone: 'lifetime',
        name: '木槿年华',
    },
    {
        level: 'Lv42语通',
        levelTone: 'warning',
        membershipLabel: '免费体验',
        membershipTone: 'trial',
        name: '山茶半岛',
    },
    {
        level: 'Lv83言御',
        levelTone: 'blue',
        membershipLabel: '黄金VIP',
        membershipTone: 'gold',
        name: '落日航班',
    },
    {
        level: 'Lv29词启',
        levelTone: 'danger',
        membershipLabel: '漫奇天使',
        membershipTone: 'angel',
        name: '春日邮局',
    },
]

const fallbackGeneratedProfile: GeneratedLeaderboardProfile = {
    level: firstTemplate.level,
    levelTone: firstTemplate.levelTone,
    membershipLabel: firstTemplate.membershipLabel,
    membershipTone: firstTemplate.membershipTone,
    name: firstTemplate.name,
}

function formatStudyTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return hours === 0 ? `${minutes}分钟` : `${hours}小时${String(minutes).padStart(2, '0')}分钟`
}

function createGeneratedRow(index: number): HomeLeaderboardRow {
    const generatedIndex = index - designLeaderboardRows.length
    const profile =
        generatedProfiles[generatedIndex % generatedProfiles.length] ?? fallbackGeneratedProfile
    const nameCycle = Math.floor(generatedIndex / generatedProfiles.length)
    const totalMinutes = Math.max(30, 133 - generatedIndex * 2)

    return {
        avatarIndex: index % designLeaderboardRows.length,
        level: profile.level,
        levelTone: profile.levelTone,
        membershipLabel: profile.membershipLabel,
        membershipTone: profile.membershipTone,
        name: nameCycle === 0 ? profile.name : `${profile.name} ${nameCycle + 1}`,
        rank: index + 4,
        time: formatStudyTime(totalMinutes),
    }
}

export function createLeaderboardRows(
    count = defaultVisibleRowCount,
): readonly HomeLeaderboardRow[] {
    if (!Number.isInteger(count) || count <= 0) {
        return []
    }

    return Array.from({ length: count }, (_, index) => {
        const designRow = designLeaderboardRows[index]

        return designRow === undefined
            ? createGeneratedRow(index)
            : { ...designRow, rank: index + 4 }
    })
}
