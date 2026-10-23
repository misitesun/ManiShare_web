'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
    createPracticeCutReadingState,
    getPracticeCutReadingTransition,
} from './practice-cut-reading'
import type { PracticeReadingPlaybackScheduler } from './practice-reading-runtime'
import { videoListeningSegments, videoListeningSource } from './video-listening-demo'
import type { VideoListeningPlayback } from './video-listening-playback'

interface VideoExercisePlaybackInput {
    readonly controller: VideoListeningPlayback | null
    readonly mode: 'check' | 'typing' | 'oral' | 'blocks' | 'translate'
    readonly index: number
    readonly visitKey: string
    readonly enabled: boolean
    readonly ready: boolean
    readonly blocked: boolean
    readonly suspended: boolean
    readonly schedulePlayback: PracticeReadingPlaybackScheduler
    readonly onNotice: (message: string) => void
}

interface PendingVideoReading {
    cancel: (() => void) | null
}
interface VideoExercisePlaybackActions {
    readonly toggle: () => void
    readonly pause: () => void
}

/** 视频练习只播放当前句段；一个音轨宿主跨切题、作答与封面卸载保留。 */
export function useVideoExercisePlayback({
    controller,
    mode,
    index,
    visitKey,
    enabled,
    ready,
    blocked,
    suspended,
    schedulePlayback,
    onNotice,
}: VideoExercisePlaybackInput): VideoExercisePlaybackActions {
    const memory = useRef(createPracticeCutReadingState())
    const appliedVisit = useRef<string | null>(null)
    const pending = useRef<PendingVideoReading | null>(null)

    const cancelPending = useCallback((): void => {
        const previous = pending.current
        pending.current = null
        previous?.cancel?.()
    }, [])
    const requestPlayback = useCallback((): void => {
        if (!controller) return
        const request: PendingVideoReading = { cancel: null }
        pending.current = request
        request.cancel = schedulePlayback((allowed): void => {
            if (pending.current !== request) return
            pending.current = null
            if (allowed && !document.hidden) void controller.play()
        })
    }, [controller, schedulePlayback])

    useEffect(() => {
        if (!controller) return
        const audio = new Audio()
        audio.preload = 'metadata'
        let previousError: string | null = null
        const unsubscribe = controller.subscribe((): void => {
            const error = controller.getSnapshot().error
            if (error !== null && error !== previousError) onNotice(error)
            previousError = error
        })
        const detach = controller.attach(audio)
        function suspend(): void {
            if (!document.hidden) return
            cancelPending()
            controller?.pause()
        }
        document.addEventListener('visibilitychange', suspend)
        return (): void => {
            cancelPending()
            document.removeEventListener('visibilitychange', suspend)
            unsubscribe()
            detach()
        }
    }, [controller, cancelPending, onNotice])

    useEffect(() => {
        if (!controller) return
        controller.setBlocked(blocked || !ready)
        let cancelled = false
        // Effect重演不消耗访问资格，延续既有切读的挂载与去重规则。
        queueMicrotask((): void => {
            if (cancelled) return
            const transition = getPracticeCutReadingTransition(memory.current, {
                family: 'video',
                mode,
                visitKey,
                source: videoListeningSource,
                enabled,
                ready,
                blocked: blocked || suspended || document.hidden,
            })
            memory.current = transition.state
            if (transition.stopPrevious || transition.action === 'stop') controller.pause()
            if (!ready || blocked || suspended || document.hidden) return
            const segment = videoListeningSegments[index]
            if (!segment) return
            if (appliedVisit.current !== visitKey) {
                controller.pause()
                controller.seek(segment.start)
                appliedVisit.current = visitKey
            }
            if (transition.action !== 'play') return
            requestPlayback()
        })
        return (): void => {
            cancelled = true
            cancelPending()
        }
    }, [
        controller,
        mode,
        index,
        visitKey,
        enabled,
        ready,
        blocked,
        suspended,
        requestPlayback,
        cancelPending,
    ])

    const pause = useCallback((): void => {
        cancelPending()
        // 录制或浮层接管当前口语访问后，回到准备／结果态也不补播旧切读。
        if (mode === 'oral') memory.current = { visitKey, consumed: true, requestedSource: null }
        controller?.pause()
    }, [controller, mode, visitKey, cancelPending])
    const toggle = useCallback((): void => {
        if (!controller || !ready || blocked || suspended || document.hidden) return
        cancelPending()
        // 显式播放／暂停接管本次访问，不能被尚未结束的切题提示音重新启动。
        memory.current = { visitKey, consumed: true, requestedSource: videoListeningSource }
        const segment = videoListeningSegments[index]
        if (!segment) return
        if (appliedVisit.current !== visitKey) {
            controller.pause()
            controller.seek(segment.start)
            appliedVisit.current = visitKey
        }
        if (
            (mode === 'typing' || mode === 'blocks' || mode === 'translate') &&
            !controller.getSnapshot().playRequested
        )
            requestPlayback()
        else controller.toggle()
    }, [
        controller,
        mode,
        index,
        ready,
        blocked,
        suspended,
        visitKey,
        cancelPending,
        requestPlayback,
    ])
    return { toggle, pause }
}
