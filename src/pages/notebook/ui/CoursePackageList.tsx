import type { ReactElement } from 'react'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { notebookCoursePackagePages } from '../model/notebook-items'
import type { NotebookCoursePackage } from '../model/notebook-items'
import { useStaticPagination } from '../model/useStaticPagination'

interface CoursePackageCardProps {
    readonly coursePackage: NotebookCoursePackage
}

function CoursePackageCard({ coursePackage }: CoursePackageCardProps): ReactElement {
    return (
        <article className="min-w-0 overflow-hidden rounded-xl bg-surface-raised">
            <img
                alt=""
                aria-hidden="true"
                className="aspect-[321/200] w-full object-cover"
                src={coursePackage.imageSource}
            />
            <div className="flex min-h-[77px] flex-col justify-center px-3 py-2">
                <h2 className="truncate text-card-title font-medium text-primary">
                    {coursePackage.title}
                </h2>
                <p className="mt-1 text-body text-primary/60">共{coursePackage.noteCount}条笔记</p>
            </div>
        </article>
    )
}

export function CoursePackageList(): ReactElement {
    const { loadNextPage, status, visibleItems } = useStaticPagination(notebookCoursePackagePages)

    return (
        <div>
            <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                {visibleItems.map((coursePackage) => (
                    <CoursePackageCard key={coursePackage.id} coursePackage={coursePackage} />
                ))}
            </div>
            <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
            </div>
        </div>
    )
}
