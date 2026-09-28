'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { CollaborationPage } from '../../pages/collaboration'

export function CollaborationPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <CollaborationPage />
        </Suspense>
    )
}
