import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { getFavoritePaginationStatus, getNextFavoritePageCount } from './pagination'

interface StaticFavoritePaginationResult<T> {
    readonly loadNextPage: () => void
    readonly status: TldPaginationStatusValue
    readonly visibleItems: readonly T[]
}

export function useStaticFavoritePagination<T>(
    pages: readonly (readonly T[])[],
): StaticFavoritePaginationResult<T> {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const visibleItems = pages.slice(0, visiblePageCount).flatMap((page) => page)
    const status = getFavoritePaginationStatus(visiblePageCount, pages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextFavoritePageCount(currentPageCount, pages.length),
        )
    }, [pages.length])

    return { loadNextPage, status, visibleItems }
}
