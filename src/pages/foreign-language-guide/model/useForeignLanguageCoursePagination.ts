import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import {
    getForeignLanguageCoursePaginationStatus,
    getNextForeignLanguageCoursePageCount,
} from './pagination'

interface ForeignLanguageCoursePaginationResult<T> {
    readonly loadNextPage: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function useForeignLanguageCoursePagination<T>(
    pages: readonly (readonly T[])[],
): ForeignLanguageCoursePaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getForeignLanguageCoursePaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextForeignLanguageCoursePageCount(currentPageCount, pages.length),
        )
    }, [pages.length])

    return { loadNextPage, status, visibleItems }
}
