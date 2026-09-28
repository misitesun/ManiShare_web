'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { AwakeningPage } from '../../pages/awakening'
import { awakeningCoursePath } from '../config/routes'
export function AwakeningPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <AwakeningPage coursePath={awakeningCoursePath} />
        </Suspense>
    )
}
