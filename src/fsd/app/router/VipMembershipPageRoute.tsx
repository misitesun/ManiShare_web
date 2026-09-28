'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { VipMembershipPage } from '../../pages/vip-membership'
import { routePaths } from '../config/routes'
export function VipMembershipPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <VipMembershipPage collaborationPath={routePaths.collaboration} />
        </Suspense>
    )
}
