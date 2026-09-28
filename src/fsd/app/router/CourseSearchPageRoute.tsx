'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { CourseSearchPage } from '../../pages/course-search'

export function CourseSearchPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <CourseSearchPage />
        </Suspense>
    )
}
