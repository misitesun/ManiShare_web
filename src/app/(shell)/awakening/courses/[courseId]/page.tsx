import type { ReactElement } from 'react'
import { AwakeningCoursePageRoute } from '../../../../../fsd/app/router/AwakeningCoursePageRoute'
import { getAwakeningCourseParams } from '../../../../../fsd/pages/awakening'
export const dynamicParams = false
export const generateStaticParams = getAwakeningCourseParams
export default async function Page({
    params,
}: {
    readonly params: Promise<{ readonly courseId: string }>
}): Promise<ReactElement> {
    const { courseId } = await params
    return <AwakeningCoursePageRoute courseId={courseId} />
}
