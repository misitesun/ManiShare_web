'use client'

import { Suspense } from 'react'
import type { ReactElement } from 'react'
import { SettingsPage } from '../../pages/settings'
import { RouteLoading } from './ui/RouteLoading'

export function SettingsPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <SettingsPage />
        </Suspense>
    )
}
