'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { ProfilePage } from '../../pages/profile'

export function ProfilePageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <ProfilePage />
        </Suspense>
    )
}
