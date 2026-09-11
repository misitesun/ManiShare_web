import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'

export function getNextWorkPageCount(currentPageCount: number, totalPageCount: number): number {
    return Math.min(Math.max(0, currentPageCount) + 1, Math.max(0, totalPageCount))
}

export function getWorkPaginationStatus(
    visiblePageCount: number,
    totalPageCount: number,
): TldPaginationStatusValue {
    return visiblePageCount >= totalPageCount ? 'exhausted' : 'idle'
}
