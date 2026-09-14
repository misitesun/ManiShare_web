import type { AppNavigationItem, AppUtilityItem } from '../../widgets/app-layout'
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
    { labelKey: 'navigation.collaboration', icon: 'co-create', accent: 'collaboration' },
    { labelKey: 'navigation.vip', icon: 'vip', accent: 'vip' },
    {
        labelKey: 'navigation.revenue',
        icon: 'revenue',
        to: routePaths.promotionRevenue,
        end: true,
    },
    { labelKey: 'navigation.pk', icon: 'pk' },
    { labelKey: 'navigation.aiTutor', icon: 'ai-tutor' },
    { labelKey: 'navigation.aiCreate', icon: 'ai-create' },
    {
        label: '排行榜',
        labelKey: 'navigation.leaderboard',
        pageLabel: '排行榜',
        icon: 'leaderboard',
        to: routePaths.leaderboard,
        end: true,
    },
] satisfies readonly AppNavigationItem[]

export const utilityItems = [
    { labelKey: 'layout.playerClub', icon: 'club' },
    { labelKey: 'layout.customerService', icon: 'service' },
    { labelKey: 'layout.gameGuide', icon: 'play' },
    { labelKey: 'layout.feedback', icon: 'feedback' },
    { labelKey: 'layout.systemMessages', icon: 'notification' },
    { labelKey: 'layout.addDesktop', icon: 'desktop' },
] satisfies readonly AppUtilityItem[]
