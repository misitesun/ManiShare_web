'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { PromotionRevenuePage } from '../../pages/promotion-revenue'

export function PromotionRevenuePageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <PromotionRevenuePage />
        </Suspense>
    )
}
