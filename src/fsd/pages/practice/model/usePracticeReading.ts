'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PracticeCutReadingInput } from './practice-cut-reading'
import {
    createPracticeReadingMemory,
    createPracticeReadingRuntime,
    createPracticeReadingSnapshot,
    schedulePracticeReadingUpdate,
} from './practice-reading-runtime'
import type { PracticeReadingRuntime, PracticeReadingSnapshot } from './practice-reading-runtime'

export interface PracticeReadingResult extends PracticeReadingSnapshot {
    readonly togglePlayback: () => boolean
    readonly pause: () => void
    readonly stop: () => void
}

export interface PracticeReadingInput extends Omit<PracticeCutReadingInput, 'source'> {
    readonly source?: string | undefined
}

/** 无音源时不创建 Audio；首次 SSR 与水合均从 unavailable 开始。 */
export function usePracticeReading({
    family,
    mode,
    visitKey,
    source,
    enabled,
    ready,
    blocked,
}: PracticeReadingInput): PracticeReadingResult {
    const [snapshot, setSnapshot] = useState(createPracticeReadingSnapshot)
    const runtimeRef = useRef<PracticeReadingRuntime | null>(null)
    const memoryRef = useRef(createPracticeReadingMemory())

    useEffect(() => {
        const runtime = createPracticeReadingRuntime(
            (): HTMLAudioElement => {
                const element = new Audio()
                element.preload = 'metadata'
                return element
            },
            setSnapshot,
            memoryRef.current,
        )
        runtimeRef.current = runtime
        runtime.setHidden(document.hidden)
        function onVisibilityChange(): void {
            runtime.setHidden(document.hidden)
        }
        document.addEventListener('visibilitychange', onVisibilityChange)
        return (): void => {
            document.removeEventListener('visibilitychange', onVisibilityChange)
            runtime.dispose()
            if (runtimeRef.current === runtime) runtimeRef.current = null
        }
    }, [])

    useEffect(() => {
        const runtime = runtimeRef.current
        if (runtime === null) return
        return schedulePracticeReadingUpdate(runtime, {
            family,
            mode,
            visitKey,
            ...(source === undefined ? {} : { source }),
            enabled,
            ready,
            blocked,
        })
    }, [family, mode, visitKey, source, enabled, ready, blocked])

    const togglePlayback = useCallback((): boolean => {
        return runtimeRef.current?.togglePlayback() ?? false
    }, [])
    const pause = useCallback((): void => runtimeRef.current?.pause(), [])
    const stop = useCallback((): void => runtimeRef.current?.stop(), [])
    return { ...snapshot, togglePlayback, pause, stop }
}
