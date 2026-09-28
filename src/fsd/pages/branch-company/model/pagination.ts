import type { TldPaginationStatusValue } from '../../../shared/ui/tld-pagination-status'

export function getNextBranchCompanyPageCount(
    currentPageCount: number,
    totalPageCount: number,
): number {
    return Math.min(Math.max(0, currentPageCount) + 1, Math.max(0, totalPageCount))
}

export function getBranchCompanyPaginationStatus(
    visiblePageCount: number,
    totalPageCount: number,
): TldPaginationStatusValue {
    return visiblePageCount >= totalPageCount ? 'exhausted' : 'idle'
}
