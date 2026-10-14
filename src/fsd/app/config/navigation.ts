import type {
    AppFooterNavigationItem,
    AppNavigationItem,
    AppUtilityItem,
} from '../../widgets/app-layout'
import { routePaths } from './routes'

export const navigationItems = [
    {
        labelKey: 'navigation.home',
        pageLabelKey: 'layout.homePageTitle',
        icon: 'home',
        to: routePaths.home,
        end: true,
    },
    {
        labelKey: 'navigation.profile',
        icon: 'profile',
        children: [
            { labelKey: 'navigation.profileDetails', to: routePaths.profile, end: true },
            { labelKey: 'navigation.gapFilling', to: routePaths.knowledgeGaps, end: true },
            { labelKey: 'navigation.notebook', to: routePaths.notebook },
            { labelKey: 'navigation.learningProgress', to: routePaths.learningProgress, end: true },
            { labelKey: 'navigation.favorites', to: routePaths.favorites, end: true },
            { labelKey: 'navigation.works', to: routePaths.works, end: true },
        ],
    },
    { labelKey: 'navigation.awakening', icon: 'awakening', to: routePaths.awakening },
    { labelKey: 'navigation.wisdom', icon: 'wisdom' },
    { labelKey: 'navigation.stories', icon: 'stories' },
    { labelKey: 'navigation.vocabulary', icon: 'vocabulary' },
    { labelKey: 'navigation.bootcamp', icon: 'bootcamp' },
    {
        labelKey: 'navigation.guide',
        icon: 'guide',
        to: routePaths.foreignLanguageGuide,
        end: true,
    },
    {
        labelKey: 'navigation.collaboration',
        accent: 'brand',
        icon: 'co-create',
        to: routePaths.collaboration,
        end: true,
    },
    {
        labelKey: 'navigation.vip',
        icon: 'vip',
        accent: 'vip',
        to: routePaths.vipMembership,
        end: true,
    },
    {
        labelKey: 'navigation.revenue',
        label: '我的推广奖励',
        pageLabel: '我的推广奖励',
        icon: 'revenue',
        to: routePaths.promotionRevenue,
        end: true,
    },
    {
        label: 'PK争霸',
        labelKey: 'navigation.pk',
        pageLabel: 'PK争霸',
        icon: 'pk',
        to: routePaths.pkArena,
        end: true,
    },
    { labelKey: 'navigation.aiTutor', icon: 'ai-tutor', to: routePaths.aiTutor },
    { labelKey: 'navigation.aiCreate', icon: 'ai-create' },
    {
        label: '排行榜',
        labelKey: 'navigation.leaderboard',
        pageLabel: '排行榜',
        icon: 'leaderboard',
        to: routePaths.leaderboard,
        end: true,
    },
    {
        label: '风采大赛',
        labelKey: 'navigation.competition',
        pageLabel: '风采大赛',
        icon: 'competition',
        to: routePaths.competition,
        end: true,
    },
    {
        labelKey: 'navigation.prizeCenter',
        icon: 'prize-center',
        to: routePaths.prizeCenter,
        end: true,
    },
] satisfies readonly AppNavigationItem[]

export const utilityItems = [
    { labelKey: 'layout.playerClub', icon: 'club', action: 'club-qr' },
    { labelKey: 'layout.customerService', icon: 'service', action: 'service-qr' },
    { labelKey: 'layout.gameGuide', icon: 'play', action: 'play-qr' },
    { labelKey: 'layout.feedback', icon: 'feedback', action: 'feedback' },
    { labelKey: 'layout.systemMessages', icon: 'notification' },
    { labelKey: 'layout.addDesktop', icon: 'desktop' },
] satisfies readonly AppUtilityItem[]

export const footerNavigationItem = {
    label: '分公司',
    pageLabel: '分公司',
    to: routePaths.branchCompany,
} satisfies AppFooterNavigationItem
