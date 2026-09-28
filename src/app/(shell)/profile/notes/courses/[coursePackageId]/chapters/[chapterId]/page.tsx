import type { ReactElement } from 'react'
import { NotebookChapterPageRoute } from '../../../../../../../../fsd/app/router/NotebookChapterPageRoute'
import { getNotebookChapterParams } from '../../../../../../../../fsd/entities/notebook'
export const dynamicParams = false
export const generateStaticParams = getNotebookChapterParams
export default async function Page({
    params,
}: {
    readonly params: Promise<{ readonly coursePackageId: string; readonly chapterId: string }>
}): Promise<ReactElement> {
    const { coursePackageId, chapterId } = await params
    return <NotebookChapterPageRoute coursePackageId={coursePackageId} chapterId={chapterId} />
}
