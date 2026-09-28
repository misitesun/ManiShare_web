import { notebookCoursePackagePages } from './notebook-items'
import { getNotebookChapters } from './notebook-chapters'
export function getNotebookCourseParams(): { coursePackageId: string }[] {
    return notebookCoursePackagePages.flat().map((course) => ({ coursePackageId: course.id }))
}
export function getNotebookChapterParams(): { coursePackageId: string; chapterId: string }[] {
    return getNotebookCourseParams().flatMap(({ coursePackageId }) =>
        getNotebookChapters(coursePackageId).map((chapter) => ({
            coursePackageId,
            chapterId: chapter.id,
        })),
    )
}
