import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { getNextNotebookPageCount, getNotebookPaginationStatus } from './pagination'

interface StaticPaginationResult<T> {
    readonly loadNextPage: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function useStaticPagination<T>(
    pages: readonly (readonly T[])[],
): StaticPaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getNotebookPaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextNotebookPageCount(currentPageCount, pages.length),
        )
    }, [pages.length])

    return { loadNextPage, status, visibleItems }
}
