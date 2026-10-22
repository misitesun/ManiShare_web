'use client'

import { useCallback, useEffect, useRef } from 'react'

interface SentenceListeningAdvanceInput {
    readonly visitKey: string
    readonly enabled: boolean
    readonly onAdvance: (visitKey: string) => void
}

interface SentenceListeningAdvanceController {
    readonly schedule: (visitKey: string) => void
    readonly cancel: () => void
}

const SENTENCE_LISTENING_ADVANCE_DELAY_MS = 1000

/** 仅自动切题在真实 ended 后停顿 1 秒；手动接管取消等待，不估算音频结束时间。 */
export function useSentenceListeningAdvance({
    visitKey,
    enabled,
    onAdvance,
}: SentenceListeningAdvanceInput): SentenceListeningAdvanceController {
    const inputRef = useRef({ visitKey, enabled, onAdvance })
    inputRef.current = { visitKey, enabled, onAdvance }
    const timerRef = useRef<number | null>(null)

    const cancel = useCallback((): void => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        timerRef.current = null
    }, [])

    const schedule = useCallback((endedVisit: string): void => {
        const current = inputRef.current
        if (
            !current.enabled ||
            current.visitKey !== endedVisit ||
            document.hidden ||
            timerRef.current !== null
        )
            return
        const timer = window.setTimeout((): void => {
            if (timerRef.current !== timer) return
            timerRef.current = null
            const latest = inputRef.current
            if (!latest.enabled || latest.visitKey !== endedVisit || document.hidden) return
            latest.onAdvance(endedVisit)
        }, SENTENCE_LISTENING_ADVANCE_DELAY_MS)
        timerRef.current = timer
    }, [])

    useEffect(() => {
        if (!enabled) return
        function cancelHiddenAdvance(): void {
            if (document.hidden) cancel()
        }
        document.addEventListener('visibilitychange', cancelHiddenAdvance)
        return (): void => {
            cancel()
            document.removeEventListener('visibilitychange', cancelHiddenAdvance)
        }
    }, [enabled, visitKey, cancel])

    return { schedule, cancel }
}
