import { useCallback, useState } from 'react'
import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'
import { knowledgeGapPages } from './knowledge-gap-items'
import type { KnowledgeGapPage } from './knowledge-gap-items'
import { getKnowledgeGapPaginationStatus, getNextVisiblePageCount } from './pagination'
import { sortKnowledgeGapPages } from './sort'
import type { KnowledgeGapSort } from './sort'
import { filterKnowledgeGapPages } from './list-state'

interface KnowledgeGapPaginationResult {
    readonly loadNextPage: () => void
    readonly pages: readonly KnowledgeGapPage[]
    readonly status: TldPaginationStatusValue
    readonly sort: KnowledgeGapSort
    readonly selectSort: (value: string) => void
    readonly query: string
    readonly changeQuery: (value: string) => void
}

export function useKnowledgeGapPagination(): KnowledgeGapPaginationResult {
    const [visiblePageCount, setVisiblePageCount] = useState(1)
    const [sort, setSort] = useState<KnowledgeGapSort>('createdAt')
    const [query, setQuery] = useState('')
    const filteredPages = filterKnowledgeGapPages(
        sortKnowledgeGapPages(knowledgeGapPages, sort),
        query,
    )
    const pages = filteredPages.slice(0, visiblePageCount)
    function changeQuery(value: string): void {
        setQuery(value)
        setVisiblePageCount(1)
    }
    function selectSort(value: string): void {
        if ((value !== 'createdAt' && value !== 'mistakeCount') || value === sort) return
        setSort(value)
        setVisiblePageCount(1)
    }
    const status = getKnowledgeGapPaginationStatus(visiblePageCount, filteredPages.length)
    const loadNextPage = useCallback((): void => {
        setVisiblePageCount((currentPageCount) =>
            getNextVisiblePageCount(currentPageCount, filteredPages.length),
        )
    }, [filteredPages.length])

    return { loadNextPage, pages, status, sort, selectSort, query, changeQuery }
}
