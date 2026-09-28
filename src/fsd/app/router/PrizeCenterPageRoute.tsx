'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { PrizeCenterPage } from '../../pages/prize-center'

export function PrizeCenterPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <PrizeCenterPage />
        </Suspense>
    )
}
