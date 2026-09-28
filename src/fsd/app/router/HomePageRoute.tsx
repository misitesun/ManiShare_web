'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { HomePage } from '../../pages/home'

export function HomePageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <HomePage />
        </Suspense>
    )
}
