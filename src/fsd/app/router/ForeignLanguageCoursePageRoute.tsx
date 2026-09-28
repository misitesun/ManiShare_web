'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { ForeignLanguageCoursePage } from '../../pages/foreign-language-course'
import { routePaths } from '../config/routes'
export function ForeignLanguageCoursePageRoute({
    courseId,
}: {
    readonly courseId: string
}): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <ForeignLanguageCoursePage
                courseId={courseId}
                backPath={routePaths.foreignLanguageGuide}
            />
        </Suspense>
    )
}
