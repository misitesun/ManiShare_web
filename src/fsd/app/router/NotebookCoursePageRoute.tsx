'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { NotebookCoursePage } from '../../pages/notebook-course'
import { routePaths, notebookChapterPath } from '../config/routes'
export function NotebookCoursePageRoute({
    coursePackageId,
}: {
    readonly coursePackageId: string
}): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <NotebookCoursePage
                coursePackageId={coursePackageId}
                backPath={routePaths.notebook + '?view=course-packages'}
                chapterPath={notebookChapterPath}
            />
        </Suspense>
    )
}
