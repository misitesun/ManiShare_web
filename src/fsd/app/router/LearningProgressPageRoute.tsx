'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { LearningProgressPage } from '../../pages/learning-progress'

export function LearningProgressPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <LearningProgressPage />
        </Suspense>
    )
}
