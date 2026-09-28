import type { ReactElement } from 'react'
import { NotebookCoursePageRoute } from '../../../../../../fsd/app/router/NotebookCoursePageRoute'
import { getNotebookCourseParams } from '../../../../../../fsd/entities/notebook'
export const dynamicParams = false
export const generateStaticParams = getNotebookCourseParams
export default async function Page({
    params,
}: {
    readonly params: Promise<{ readonly coursePackageId: string }>
}): Promise<ReactElement> {
    const { coursePackageId } = await params
    return <NotebookCoursePageRoute coursePackageId={coursePackageId} />
}
