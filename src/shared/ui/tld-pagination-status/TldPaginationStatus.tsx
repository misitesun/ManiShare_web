import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { canAutoLoadNextPage, getPaginationMessageKey } from './pagination-status'
import type { TldPaginationStatus as PaginationStatus } from './pagination-status'

export interface TldPaginationStatusProps {
    readonly onLoadNextPage: () => void
    readonly status: PaginationStatus
}

export function TldPaginationStatus({
    onLoadNextPage,
    status,
}: TldPaginationStatusProps): ReactElement {
    const { t } = useTranslation()
    const sentinelRef = useRef<HTMLDivElement>(null)
    const hasRequestedRef = useRef(false)
    const onLoadNextPageRef = useRef(onLoadNextPage)

    useEffect(() => {
        onLoadNextPageRef.current = onLoadNextPage
    }, [onLoadNextPage])

    useEffect(() => {
        const sentinel = sentinelRef.current
        hasRequestedRef.current = false
        if (!canAutoLoadNextPage(status) || sentinel === null) return undefined
        if (typeof IntersectionObserver === 'undefined') return undefined

        const observer = new IntersectionObserver((entries): void => {
            const entry = entries[0]
            if (entry === undefined) return

            if (!entry.isIntersecting) {
                hasRequestedRef.current = false
                return
            }
            if (hasRequestedRef.current) return

            hasRequestedRef.current = true
            onLoadNextPageRef.current()
        })

        observer.observe(sentinel)
        return (): void => observer.disconnect()
    }, [status])

    if (status === 'idle') {
        return <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    }

    const messageKey = getPaginationMessageKey(status)

    if (status === 'error') {
        return (
            <div className="flex min-h-14 items-center justify-center" role="status">
                <button
                    type="button"
                    className="cursor-pointer rounded-lg px-3 py-2 text-label text-danger transition-colors hover:bg-danger-surface"
                    onClick={onLoadNextPage}
                >
                    {messageKey === undefined ? null : t(messageKey)}
                </button>
            </div>
        )
    }

    return (
        <div
            aria-live="polite"
            className="flex min-h-14 items-center justify-center text-label text-muted"
            role="status"
        >
            {messageKey === undefined ? null : t(messageKey)}
        </div>
    )
}
