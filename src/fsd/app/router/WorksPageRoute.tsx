'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { WorksPage } from '../../pages/works'

export function WorksPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <WorksPage />
        </Suspense>
    )
}
