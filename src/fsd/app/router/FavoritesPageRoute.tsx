'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { FavoritesPage } from '../../pages/favorites'

export function FavoritesPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <FavoritesPage />
        </Suspense>
    )
}
