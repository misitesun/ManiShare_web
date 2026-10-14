import type { VipBillingCycle, VipProductId } from './vip-membership'

export interface VipBenefitContent {
    readonly prefix: string
    readonly highlight?: string
    readonly suffix?: string
}

export interface VipBonusContent extends VipBenefitContent {
    readonly icon: 'mentoring' | 'sharing'
}

export interface VipPlanContent {
    readonly badge: string
    readonly benefitItems: readonly VipBenefitContent[]
    readonly bonusItems: readonly VipBonusContent[]
    readonly currentPrice: string
    readonly dealText: string
    readonly originalPrice: string
    readonly priceSuffix: string
    readonly productId: VipProductId
    readonly title: string
}

interface VipCycleBenefits {
    readonly crystalAmount: string
    readonly crystalFrequency: '发放' | '月发'
    readonly label: string
    readonly practiceLimit: string
    readonly sharingReward: string
}

const cycleBenefits: Readonly<Record<VipBillingCycle, VipCycleBenefits>> = {
    week: {
        crystalAmount: '1000',
        crystalFrequency: '发放',
        label: '周卡',
        practiceLimit: '100',
        sharingReward: '10%',
    },
    month: {
        crystalAmount: '6000',
        crystalFrequency: '月发',
        label: '月卡',
        practiceLimit: '300',
        sharingReward: '20%',
    },
    quarter: {
        crystalAmount: '8000',
        crystalFrequency: '月发',
        label: '季卡',
        practiceLimit: '800',
        sharingReward: '25%',
    },
    year: {
        crystalAmount: '10000',
        crystalFrequency: '月发',
        label: '年卡',
        practiceLimit: '3000',
        sharingReward: '30%',
    },
}

export function getGoldVipPlan(cycle: VipBillingCycle): VipPlanContent {
    const benefits = cycleBenefits[cycle]

    return {
        badge: '黄金VIP',
        benefitItems: [
            { prefix: '不限时长：告别免费版每日时长限制' },
            { prefix: '专属课程：解锁', highlight: 'VIP', suffix: '课程' },
            {
                prefix: `创课魔晶：${benefits.crystalFrequency}`,
                highlight: benefits.crystalAmount,
                suffix: '魔晶，创作个人AI课程（敬请期待）',
            },
            {
                prefix: '口语评测：每日',
                highlight: benefits.practiceLimit,
                suffix: '次练习，AI智能评测与纠音',
            },
            { prefix: 'VIP学友圈：加入VIP玩家群，玩中学，同成长' },
        ],
        bonusItems: [
            {
                icon: 'mentoring',
                prefix: `伴学服务：${benefits.label}期内`,
                highlight: '1v1',
                suffix: '学习答疑',
            },
            {
                icon: 'sharing',
                prefix: '爱的流动：好用到想推荐，首单',
                highlight: `${benefits.sharingReward}分享`,
                suffix: '奖励',
            },
        ],
        currentPrice: '199',
        dealText: '相当于每天仅¥0.54',
        originalPrice: '原价¥399',
        priceSuffix: '/年',
        productId: 'gold',
        title: '深耕版·不限时长',
    }
}

export const lifetimeVipPlan: VipPlanContent = {
    badge: '终身VIP',
    benefitItems: [
        { prefix: '不限时长：告别免费版每日时长限制' },
        { prefix: '专属课程：解锁', highlight: '终身VIP', suffix: '课程' },
        {
            prefix: '创课魔晶：月发',
            highlight: '12000',
            suffix: '魔晶，创作个人AI课程（敬请期待）',
        },
        { prefix: '口语评测：每日', highlight: '无限次', suffix: '练习，AI智能评测与纠音' },
        { prefix: 'VIP学友圈：加入终身VIP玩家群，玩中学，同成长' },
    ],
    bonusItems: [
        { icon: 'mentoring', prefix: '伴学服务：赠送', highlight: '1v1', suffix: '学习答疑' },
        {
            icon: 'sharing',
            prefix: '爱的流动：好用到想推荐，首单',
            highlight: '40%分享',
            suffix: '奖励',
        },
    ],
    currentPrice: '699',
    dealText: '一次付费，终身有效，每天接近0成本',
    originalPrice: '原价¥1999',
    priceSuffix: '/终身',
    productId: 'lifetime',
    title: '远见版·终身畅享',
}
