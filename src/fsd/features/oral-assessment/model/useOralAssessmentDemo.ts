'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createOralAssessmentDemo } from './oral-assessment-demo'
import type { OralAssessmentDemoOptions } from './oral-assessment-demo'
import { initialOralAssessmentDemoState } from './oral-assessment'
import type { OralAssessmentDemoState } from './oral-assessment'

export interface OralAssessmentDemoController extends OralAssessmentDemoState {
    readonly blocked: boolean
    readonly start: () => void
    readonly stopAndEvaluate: () => void
    readonly rerecord: () => void
    readonly reset: () => void
    readonly pause: () => void
    readonly replay: () => void
    readonly replayAudio?: boolean
    readonly replayPending?: boolean
    readonly replayError?: boolean
}

function getServerSnapshot(): OralAssessmentDemoState {
    return initialOralAssessmentDemoState
}

export function useOralAssessmentDemo(
    options: OralAssessmentDemoOptions,
): OralAssessmentDemoController {
    const [store] = useState(() =>
        createOralAssessmentDemo({
            setInterval: (callback, delay): number => window.setInterval(callback, delay),
            clearInterval: (timer): void => window.clearInterval(timer),
            setTimeout: (callback, delay): number => window.setTimeout(callback, delay),
            clearTimeout: (timer): void => window.clearTimeout(timer),
        }),
    )
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot)
    useEffect((): void => {
        store.configure(options)
    }, [store, options])
    useEffect(() => (): void => store.pause(), [store])
    return {
        ...state,
        blocked: options.blocked || !options.active,
        start: store.start,
        stopAndEvaluate: store.stopAndEvaluate,
        rerecord: store.rerecord,
        reset: store.reset,
        pause: store.pause,
        replay: store.replay,
        replayAudio: options.playback !== undefined,
        replayPending: options.playback?.status === 'pending',
        replayError: options.playback?.status === 'error',
    }
}
