export type TldPaginationStatus = 'idle' | 'loading' | 'exhausted' | 'error'

export function canAutoLoadNextPage(status: TldPaginationStatus): boolean {
    return status === 'idle'
}

export function getPaginationMessageKey(status: TldPaginationStatus): string | undefined {
    if (status === 'loading') return 'pagination.loading'
    if (status === 'exhausted') return 'pagination.noMore'
    if (status === 'error') return 'pagination.loadFailedRetry'
    return undefined
}
