'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { AwakeningCoursePage } from '../../pages/awakening'
import { routePaths } from '../config/routes'
export function AwakeningCoursePageRoute({
    courseId,
}: {
    readonly courseId: string
}): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <AwakeningCoursePage courseId={courseId} backPath={routePaths.awakening} />
        </Suspense>
    )
}
