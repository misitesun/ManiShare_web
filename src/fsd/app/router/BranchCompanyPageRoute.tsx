'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { BranchCompanyPage } from '../../pages/branch-company'

export function BranchCompanyPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <BranchCompanyPage />
        </Suspense>
    )
}
