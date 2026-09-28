'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { NotebookChapterPage } from '../../pages/notebook-chapter'
import { routePaths, notebookCoursePath } from '../config/routes'
export function NotebookChapterPageRoute({
    coursePackageId,
    chapterId,
}: {
    readonly coursePackageId: string
    readonly chapterId: string
}): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <NotebookChapterPage
                coursePackageId={coursePackageId}
                chapterId={chapterId}
                notebookPath={routePaths.notebook + '?view=course-packages'}
                coursePath={notebookCoursePath(coursePackageId)}
            />
        </Suspense>
    )
}
