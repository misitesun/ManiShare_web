'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { LeaderboardPage } from '../../pages/leaderboard'

export function LeaderboardPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <LeaderboardPage />
        </Suspense>
    )
}
