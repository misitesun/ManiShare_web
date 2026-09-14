import type { ReactElement } from 'react'
import { generatePath, Link } from 'react-router-dom'
import { coursePackageCatalog } from '../../../entities/course-package'
import { notebookCoursePackagePages } from '../../../entities/notebook'
import type { NotebookCoursePackage } from '../../../entities/notebook'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { useStaticPagination } from '../model/useStaticPagination'

interface CoursePackageCardProps {
    readonly coursePackage: NotebookCoursePackage
    readonly coursePath: string
}

function CoursePackageCard({
    coursePackage,
    coursePath,
}: CoursePackageCardProps): ReactElement | null {
    const summary = coursePackageCatalog.find((item) => item.id === coursePackage.coursePackageId)
    if (summary === undefined) return null
    return (
        <Link
            to={generatePath(coursePath, { coursePackageId: coursePackage.id })}
            className="block min-w-0 cursor-pointer overflow-hidden rounded-xl bg-surface-raised"
        >
            <img
                alt=""
                aria-hidden="true"
                className="aspect-[321/200] w-full object-cover"
                src={summary.imageSource}
            />
            <div className="flex min-h-[77px] flex-col justify-center px-3 py-2">
                <h2 className="truncate text-card-title font-medium text-primary">
                    {summary.title}
                </h2>
                <p className="mt-1 text-body text-primary/60">共{coursePackage.noteCount}条笔记</p>
            </div>
        </Link>
    )
}

interface CoursePackageListProps {
    readonly coursePath: string
}

export function CoursePackageList({ coursePath }: CoursePackageListProps): ReactElement {
    const { loadNextPage, status, visibleItems } = useStaticPagination(notebookCoursePackagePages)

    return (
        <div>
            <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                {visibleItems.map((coursePackage) => (
                    <CoursePackageCard
                        key={coursePackage.id}
                        coursePackage={coursePackage}
                        coursePath={coursePath}
                    />
                ))}
            </div>
            <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
            </div>
        </div>
    )
}
