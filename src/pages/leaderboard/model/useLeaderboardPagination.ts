import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { getLeaderboardPaginationStatus, getNextLeaderboardPageCount } from './pagination'

interface LeaderboardPaginationResult<T> {
    readonly loadNextPage: () => void
    readonly resetPagination: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function useLeaderboardPagination<T>(
    pages: readonly (readonly T[])[],
): LeaderboardPaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getLeaderboardPaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextLeaderboardPageCount(currentPageCount, pages.length),
        )
    }, [pages.length])
    const resetPagination = useCallback((): void => setVisiblePageCount(1), [])

    return { loadNextPage, resetPagination, status, visibleItems }
}
