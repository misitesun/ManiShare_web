import type { VipProductId } from './vip-membership'

export interface VipBenefitContent {
    readonly prefix: string
    readonly highlight?: string
    readonly suffix?: string
}

export interface VipPlanContent {
    readonly badge: string
    readonly benefitItems: readonly VipBenefitContent[]
    readonly currentPrice: string
    readonly dealText: string
    readonly originalPrice: string
    readonly priceSuffix: string
    readonly productId: VipProductId
    readonly subtitle: string
    readonly title: string
}

const sharedBenefits = [
    { prefix: '专属伴学：', highlight: '1V1', suffix: ' 答疑解惑' },
    { prefix: '不限时长：告别每日免费版时长限制' },
    { prefix: '畅学无界：解锁VIP课和功能' },
    { prefix: '创课魔晶：发放1000魔晶，创作个人 AI 课程（敬请期待）' },
    { prefix: '口语测评：', highlight: '无限次', suffix: '练习，AI 智能评测与纠音' },
] satisfies readonly VipBenefitContent[]

export const goldVipPlan = {
    badge: '黄金VIP',
    benefitItems: [...sharedBenefits, { prefix: 'VIP学友圈：加入VIP学友圈，玩中学，同成长' }],
    currentPrice: '199',
    dealText: '相当于每天仅¥0.54',
    originalPrice: '日常价¥399',
    priceSuffix: '/年',
    productId: 'gold',
    subtitle: '不限时长，适合深度学习',
    title: '深耕版·不限时长',
} satisfies VipPlanContent

export const lifetimeVipPlan = {
    badge: '终身VIP',
    benefitItems: [
        ...sharedBenefits,
        { prefix: '学友圈：加入VIP学友圈，玩中学，同成长' },
        { prefix: '同频共创：解锁分享特权，邀请共学可享专属回馈（首单40%税后合规收益）' },
        { prefix: 'VIP学友圈：专属互动群，和同频学友玩中学，共成长' },
    ],
    currentPrice: '699',
    dealText: '一次付费，终身有效，相当于每天接近0成本',
    originalPrice: '原价¥1999',
    priceSuffix: '/终身',
    productId: 'lifetime',
    subtitle: '终身畅享+推广分佣',
    title: '远见版·终身畅享',
} satisfies VipPlanContent
