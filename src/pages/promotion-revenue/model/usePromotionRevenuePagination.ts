import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { getNextPromotionRevenuePageCount, getPromotionRevenuePaginationStatus } from './pagination'

interface PromotionRevenuePaginationResult<T> {
    readonly loadNextPage: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function usePromotionRevenuePagination<T>(
    pages: readonly (readonly T[])[],
): PromotionRevenuePaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getPromotionRevenuePaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextPromotionRevenuePageCount(currentPageCount, pages.length),
        )
    }, [pages.length])

    return { loadNextPage, status, visibleItems }
}
