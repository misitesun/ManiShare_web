'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    createPhoneticsReadingRuntime,
    createPhoneticsReadingSnapshot,
} from './phonetics-reading-runtime'
import type {
    PhoneticsReadingInput,
    PhoneticsReadingMemory,
    PhoneticsReadingRuntime,
    PhoneticsReadingSnapshot,
} from './phonetics-reading-runtime'
import type { PracticeReadingPlaybackScheduler } from './practice-reading-runtime'

interface PhoneticsReadingResult extends PhoneticsReadingSnapshot {
    readonly toggle: () => void
    readonly playTarget: () => void
    readonly playWord: () => void
    readonly playSegment: (segmentId: string) => void
    readonly stop: () => void
}

/** 挂载后创建媒体；StrictMode重演不消耗首访资格，后台/浮层关闭后不补播。 */
export function usePhoneticsReading(
    input: PhoneticsReadingInput,
    schedulePlayback: PracticeReadingPlaybackScheduler,
): PhoneticsReadingResult {
    const [snapshot, setSnapshot] = useState(createPhoneticsReadingSnapshot)
    const runtimeRef = useRef<PhoneticsReadingRuntime | null>(null)
    const memory = useRef<PhoneticsReadingMemory>({ attemptedVisit: null })
    const scheduler = useRef(schedulePlayback)
    scheduler.current = schedulePlayback
    useEffect(() => {
        const runtime = createPhoneticsReadingRuntime({
            createElement: (): HTMLAudioElement => {
                const audio = new Audio()
                audio.preload = 'metadata'
                return audio
            },
            onChange: setSnapshot,
            memory: memory.current,
            schedulePlayback: (complete): (() => void) => scheduler.current(complete),
            scheduleGap: (callback): (() => void) => {
                const timer = window.setTimeout(callback, 350)
                return (): void => window.clearTimeout(timer)
            },
        })
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
    const { question, visitKey, naturalPhonics, enabled, ready, blocked } = input
    useEffect(() => {
        let cancelled = false
        queueMicrotask((): void => {
            if (!cancelled)
                runtimeRef.current?.update({
                    question,
                    visitKey,
                    naturalPhonics,
                    enabled,
                    ready,
                    blocked,
                })
        })
        return (): void => {
            cancelled = true
        }
    }, [question, visitKey, naturalPhonics, enabled, ready, blocked])
    const toggle = useCallback((): void => runtimeRef.current?.toggle(), [])
    const playTarget = useCallback((): void => runtimeRef.current?.playTarget(), [])
    const playWord = useCallback((): void => runtimeRef.current?.playWord(), [])
    const playSegment = useCallback(
        (segmentId: string): void => runtimeRef.current?.playSegment(segmentId),
        [],
    )
    const stop = useCallback((): void => runtimeRef.current?.stop(), [])
    return { ...snapshot, toggle, playTarget, playWord, playSegment, stop }
}
