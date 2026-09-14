import type { ReactElement } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { coursePackageCatalog } from '../../../entities/course-package'
import type { CoursePackageSummary } from '../../../entities/course-package'
import { createCourseNoteGroups, findNotebookCourse } from '../../../entities/notebook'
import type { NotebookCoursePackage } from '../../../entities/notebook'
import { NotebookNotes } from '../../../widgets/notebook-notes'
import { TldBackButton } from '../../../shared/ui/tld-back-button'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import { NotebookChapterList } from './NotebookChapterList'

interface NotebookCoursePageProps {
    readonly backPath: string
    readonly chapterPath: string
}

interface NotebookCourseContentProps extends NotebookCoursePageProps {
    readonly course: NotebookCoursePackage
    readonly summary: CoursePackageSummary
}

const tabs = [
    { id: 'all-notes', label: '全部笔记', panelId: 'course-notebook-all-notes' },
    { id: 'courses', label: '课程列表', panelId: 'course-notebook-courses' },
] satisfies readonly TldSegmentedTabItem[]

function NotebookCourseContent({
    backPath,
    chapterPath,
    course,
    summary,
}: NotebookCourseContentProps): ReactElement {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeView = searchParams.get('view') === 'courses' ? 'courses' : 'all-notes'
    const groups = createCourseNoteGroups(course)

    function selectView(value: string): void {
        if (value !== 'courses' && value !== 'all-notes') return
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                if (value === 'courses') next.set('view', value)
                else next.delete('view')
                return next
            },
            { replace: true },
        )
    }

    return (
        <section
            aria-label="课程包笔记"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-5 xl:min-[1920px]:px-[250px]"
        >
            <div className="mb-5">
                <TldBackButton to={backPath} />
            </div>
            <header className="grid min-w-0 gap-4 rounded-xl border border-primary/30 p-[15px] md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] xl:grid-cols-[321px_minmax(0,1fr)_minmax(0,345px)]">
                <img
                    alt=""
                    className="aspect-[321/218] w-full rounded-lg object-cover"
                    src={summary.imageSource}
                />
                <div className="flex min-w-0 flex-col justify-between gap-4 py-3">
                    <h1 className="break-words text-section-title font-medium text-primary">
                        {summary.title}
                    </h1>
                    <p className="text-tab-label text-primary/60">共{course.noteCount}条笔记</p>
                </div>
                <div className="min-w-0 md:col-span-2 xl:col-span-1">
                    <TldSegmentedTabs
                        ariaLabel="课程包笔记视图"
                        items={tabs}
                        value={activeView}
                        onValueChange={selectView}
                    />
                </div>
            </header>
            <div
                id="course-notebook-all-notes"
                role="tabpanel"
                aria-label="全部笔记"
                hidden={activeView !== 'all-notes'}
                className="mt-4"
            >
                <NotebookNotes groups={groups} />
            </div>
            <div
                id="course-notebook-courses"
                role="tabpanel"
                aria-label="课程列表"
                hidden={activeView !== 'courses'}
                className="mt-6"
            >
                <NotebookChapterList chapterPath={chapterPath} coursePackageId={course.id} />
            </div>
        </section>
    )
}

export function NotebookCoursePage({
    backPath,
    chapterPath,
}: NotebookCoursePageProps): ReactElement {
    const { coursePackageId } = useParams()
    const course = findNotebookCourse(coursePackageId)
    const summary = coursePackageCatalog.find((item) => item.id === course?.coursePackageId)

    if (course === undefined || summary === undefined) {
        return (
            <section
                aria-label="课程包不存在"
                className="mx-auto min-w-0 px-3 py-5 md:px-4 xl:min-[1920px]:px-[250px]"
            >
                <TldBackButton to={backPath} />
                <p className="py-12 text-center text-body text-secondary">未找到该课程包的笔记</p>
            </section>
        )
    }

    return (
        <NotebookCourseContent
            key={course.id}
            backPath={backPath}
            chapterPath={chapterPath}
            course={course}
            summary={summary}
        />
    )
}
