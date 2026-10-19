'use client'

import { useCallback, useState } from 'react'
import {
    completePracticeEntryLoading,
    reconcilePracticeEntryLoading,
} from './practice-entry-loading'
import type { PracticeEntryLoadingState } from './practice-entry-loading'

interface PracticeEntryLoading {
    readonly ready: boolean
    readonly complete: () => void
}

/** 只标记当前入口就绪；进度更新留在加载画面，避免逐帧重绘整个练习页。 */
export function usePracticeEntryLoading(entryKey: string | null): PracticeEntryLoading {
    const [state, setState] = useState<PracticeEntryLoadingState>({ entryKey, ready: false })
    const next = reconcilePracticeEntryLoading(state, entryKey)
    if (next !== state) setState(next)

    const complete = useCallback((): void => {
        setState((current) => completePracticeEntryLoading(current, entryKey))
    }, [entryKey])

    return { ready: next.ready, complete }
}
