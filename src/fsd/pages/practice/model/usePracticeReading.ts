'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PracticeCutReadingInput } from './practice-cut-reading'
import {
    createPracticeReadingMemory,
    createPracticeReadingRuntime,
    createPracticeReadingSnapshot,
    schedulePracticeReadingUpdate,
} from './practice-reading-runtime'
import type {
    PracticeReadingPlaybackScheduler,
    PracticeReadingRuntime,
    PracticeReadingSnapshot,
} from './practice-reading-runtime'

export interface PracticeReadingResult extends PracticeReadingSnapshot {
    readonly play: () => boolean
    readonly togglePlayback: () => boolean
    readonly toggleSourcePlayback: (source: string | undefined, visitKey: string) => boolean
    readonly pause: () => void
    readonly stop: () => void
}

export interface PracticeReadingInput extends Omit<PracticeCutReadingInput, 'source'> {
    readonly source?: string | undefined
    readonly onEnded?: ((visitKey: string) => void) | undefined
    readonly schedulePlayback?: PracticeReadingPlaybackScheduler | undefined
}

/** 无音源时不创建 Audio；首次 SSR 与水合均从 unavailable 开始。 */
export function usePracticeReading({
    family,
    mode,
    visitKey,
    source,
    enabled,
    sequenceEnabled = false,
    ready,
    blocked,
    onEnded,
    schedulePlayback,
}: PracticeReadingInput): PracticeReadingResult {
    const [snapshot, setSnapshot] = useState(createPracticeReadingSnapshot)
    const runtimeRef = useRef<PracticeReadingRuntime | null>(null)
    const memoryRef = useRef(createPracticeReadingMemory())
    const onEndedRef = useRef(onEnded)
    onEndedRef.current = onEnded
    const schedulePlaybackRef = useRef(schedulePlayback)
    schedulePlaybackRef.current = schedulePlayback

    useEffect(() => {
        const runtime = createPracticeReadingRuntime(
            (): HTMLAudioElement => {
                const element = new Audio()
                element.preload = 'metadata'
                return element
            },
            setSnapshot,
            memoryRef.current,
            undefined,
            onEndedRef.current === undefined
                ? undefined
                : (endedVisit): void => onEndedRef.current?.(endedVisit),
            schedulePlaybackRef.current === undefined
                ? undefined
                : (complete): (() => void) => {
                      const schedule = schedulePlaybackRef.current
                      if (schedule !== undefined) return schedule(complete)
                      complete(true)
                      return (): void => {}
                  },
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
            sequenceEnabled,
            ready,
            blocked,
        })
    }, [family, mode, visitKey, source, enabled, sequenceEnabled, ready, blocked])

    const togglePlayback = useCallback((): boolean => {
        return runtimeRef.current?.togglePlayback() ?? false
    }, [])
    const play = useCallback((): boolean => runtimeRef.current?.play() ?? false, [])
    const toggleSourcePlayback = useCallback(
        (source: string | undefined, visitKey: string): boolean =>
            runtimeRef.current?.toggleSourcePlayback(source, visitKey) ?? false,
        [],
    )
    const pause = useCallback((): void => runtimeRef.current?.pause(), [])
    const stop = useCallback((): void => runtimeRef.current?.stop(), [])
    return { ...snapshot, play, togglePlayback, toggleSourcePlayback, pause, stop }
}
