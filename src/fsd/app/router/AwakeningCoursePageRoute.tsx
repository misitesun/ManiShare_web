'use client'
import { Suspense, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { RouteLoading } from './ui/RouteLoading'
import { AwakeningCoursePage } from '../../pages/awakening'
import { routePaths } from '../config/routes'
import { buildPracticePath } from './practice-origin'
export function AwakeningCoursePageRoute({
    courseId,
}: {
    readonly courseId: string
}): ReactElement {
    const router = useRouter()
    return (
        <Suspense fallback={<RouteLoading />}>
            <AwakeningCoursePage
                courseId={courseId}
                backPath={routePaths.awakening}
                practicePath={routePaths.practice}
                onStartPractice={(demoId, mode, chapterId): void =>
                    router.push(buildPracticePath(courseId, demoId, mode, chapterId))
                }
            />
        </Suspense>
    )
}
