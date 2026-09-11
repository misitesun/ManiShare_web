import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../../widgets/app-layout'
import { navigationItems, utilityItems } from '../config/navigation'
import { routePaths } from '../config/routes'
import { RouteErrorPage } from './ui/RouteErrorPage'
import { RouteLoading } from './ui/RouteLoading'

const loginPage = lazy(async () => {
    const module = await import('../../pages/login')
    return { default: module.LoginPage }
})

const homePage = lazy(async () => {
    const module = await import('../../pages/home')
    return { default: module.HomePage }
})

const profilePage = lazy(async () => {
    const module = await import('../../pages/profile')
    return { default: module.ProfilePage }
})

const knowledgeGapsPage = lazy(async () => {
    const module = await import('../../pages/knowledge-gaps')
    return { default: module.KnowledgeGapsPage }
})

const notebookPage = lazy(async () => {
    const module = await import('../../pages/notebook')
    return { default: module.NotebookPage }
})

const learningProgressPage = lazy(async () => {
    const module = await import('../../pages/learning-progress')
    return { default: module.LearningProgressPage }
})

const favoritesPage = lazy(async () => {
    const module = await import('../../pages/favorites')
    return { default: module.FavoritesPage }
})

const worksPage = lazy(async () => {
    const module = await import('../../pages/works')
    return { default: module.WorksPage }
})

const foreignLanguageGuidePage = lazy(async () => {
    const module = await import('../../pages/foreign-language-guide')
    return { default: module.ForeignLanguageGuidePage }
})

const courseSearchPage = lazy(async () => {
    const module = await import('../../pages/course-search')
    return { default: module.CourseSearchPage }
})

const promotionRevenuePage = lazy(async () => {
    const module = await import('../../pages/promotion-revenue')
    return { default: module.PromotionRevenuePage }
})

const leaderboardPage = lazy(async () => {
    const module = await import('../../pages/leaderboard')
    return { default: module.LeaderboardPage }
})

export const router = createBrowserRouter([
    {
        path: routePaths.login,
        errorElement: <RouteErrorPage />,
        element: <Suspense fallback={<RouteLoading />}>{createElement(loginPage)}</Suspense>,
    },
    {
        path: routePaths.home,
        element: (
            <AppLayout
                navigationItems={navigationItems}
                utilityItems={utilityItems}
                searchPath={routePaths.courseSearch}
            />
        ),
        errorElement: <RouteErrorPage />,
        children: [
            {
                index: true,
                element: <Suspense fallback={<RouteLoading />}>{createElement(homePage)}</Suspense>,
            },
            {
                path: routePaths.profile,
                element: (
                    <Suspense fallback={<RouteLoading />}>{createElement(profilePage)}</Suspense>
                ),
            },
            {
                path: routePaths.knowledgeGaps,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(knowledgeGapsPage)}
                    </Suspense>
                ),
            },
            {
                path: routePaths.notebook,
                element: (
                    <Suspense fallback={<RouteLoading />}>{createElement(notebookPage)}</Suspense>
                ),
            },
            {
                path: routePaths.learningProgress,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(learningProgressPage)}
                    </Suspense>
                ),
            },
            {
                path: routePaths.favorites,
                element: (
                    <Suspense fallback={<RouteLoading />}>{createElement(favoritesPage)}</Suspense>
                ),
            },
            {
                path: routePaths.works,
                element: (
                    <Suspense fallback={<RouteLoading />}>{createElement(worksPage)}</Suspense>
                ),
            },
            {
                path: routePaths.foreignLanguageGuide,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(foreignLanguageGuidePage)}
                    </Suspense>
                ),
            },
            {
                path: routePaths.courseSearch,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(courseSearchPage)}
                    </Suspense>
                ),
            },
            {
                path: routePaths.promotionRevenue,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(promotionRevenuePage)}
                    </Suspense>
                ),
            },
            {
                path: routePaths.leaderboard,
                element: (
                    <Suspense fallback={<RouteLoading />}>
                        {createElement(leaderboardPage)}
                    </Suspense>
                ),
            },
        ],
    },
    { path: '*', element: <Navigate to={routePaths.home} replace /> },
])
