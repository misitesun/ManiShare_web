import type { ReactElement } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { findNotebookChapter, findNotebookCourse } from '../../../entities/notebook'
import { TldBackButton } from '../../../shared/ui/tld-back-button'
import { NotebookNotes } from '../../../widgets/notebook-notes'

interface NotebookChapterPageProps {
    readonly coursePath: string
    readonly notebookPath: string
}

export function NotebookChapterPage({
    coursePath,
    notebookPath,
}: NotebookChapterPageProps): ReactElement {
    const { coursePackageId, chapterId } = useParams()
    const course = findNotebookCourse(coursePackageId)
    const chapter = findNotebookChapter(coursePackageId, chapterId)
    const backPath =
        course === undefined
            ? notebookPath
            : `${generatePath(coursePath, { coursePackageId: course.id })}?view=courses`

    return (
        <section
            aria-label={chapter === undefined ? '章节不存在' : `${chapter.title}笔记`}
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-5 xl:min-[1920px]:px-[250px]"
        >
            <div className="mb-6">
                <TldBackButton to={backPath} />
            </div>
            {chapter === undefined ? (
                <p className="py-12 text-center text-body text-secondary">未找到该章节的笔记</p>
            ) : (
                <>
                    <h1 className="sr-only">{chapter.title}笔记</h1>
                    <NotebookNotes
                        key={`${chapter.coursePackageId}-${chapter.id}`}
                        groups={chapter.groups}
                    />
                </>
            )}
        </section>
    )
}
