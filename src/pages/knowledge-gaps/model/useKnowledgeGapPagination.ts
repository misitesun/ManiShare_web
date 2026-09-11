import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { knowledgeGapPages } from './knowledge-gap-items'
import type { KnowledgeGapPage } from './knowledge-gap-items'
import { getKnowledgeGapPaginationStatus, getNextVisiblePageCount } from './pagination'

interface KnowledgeGapPaginationResult {
    readonly loadNextPage: () => void
    readonly pages: readonly KnowledgeGapPage[]
    readonly status: TldPaginationStatusValue
}

export function useKnowledgeGapPagination(): KnowledgeGapPaginationResult {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const pages = knowledgeGapPages.slice(0, visiblePageCount)
    const status = getKnowledgeGapPaginationStatus(visiblePageCount, knowledgeGapPages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextVisiblePageCount(currentPageCount, knowledgeGapPages.length),
        )
    }, [])

    return { loadNextPage, pages, status }
}
