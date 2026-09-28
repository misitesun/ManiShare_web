import type { ReactElement } from 'react'
import { ForeignLanguageCoursePageRoute } from '../../../../../fsd/app/router/ForeignLanguageCoursePageRoute'
import { getForeignLanguageCourseParams } from '../../../../../fsd/pages/foreign-language-course'
export const dynamicParams = false
export const generateStaticParams = getForeignLanguageCourseParams
export default async function Page({
    params,
}: {
    readonly params: Promise<{ readonly courseId: string }>
}): Promise<ReactElement> {
    const { courseId } = await params
    return <ForeignLanguageCoursePageRoute courseId={courseId} />
}
