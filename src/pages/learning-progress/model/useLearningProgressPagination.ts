import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { getLearningProgressPaginationStatus, getNextLearningProgressPageCount } from './pagination'

interface LearningProgressPaginationResult<T> {
    readonly loadNextPage: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function useLearningProgressPagination<T>(
    pages: readonly (readonly T[])[],
): LearningProgressPaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getLearningProgressPaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextLearningProgressPageCount(currentPageCount, pages.length),
        )
    }, [pages.length])

    return { loadNextPage, status, visibleItems }
}
