import type { ReactElement } from 'react'
import { notebookGroupPages } from '../../../entities/notebook'
import { NotebookNotes } from '../../../widgets/notebook-notes'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { useStaticPagination } from '../model/useStaticPagination'

export function AllNotesList(): ReactElement {
    const { loadNextPage, status, visibleItems } = useStaticPagination(notebookGroupPages)
    return (
        <div>
            <NotebookNotes groups={visibleItems} />
            <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
            </div>
        </div>
    )
}
