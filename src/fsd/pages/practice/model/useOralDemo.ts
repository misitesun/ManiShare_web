'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { initialOralDemoState, reduceOralDemo, scheduleOralDemoTimer } from './oral-demo'
import type { OralDemoStage } from './oral-demo'

interface UseOralDemoOptions {
    readonly blocked: boolean
    readonly isPaused?: () => boolean
    readonly onNotice: (message: string) => void
    readonly onFeedback?: (kind: 'recordStart' | 'evaluationComplete') => void
}

export interface OralDemoController {
    readonly stage: OralDemoStage
    readonly elapsed: number
    readonly blocked: boolean
    readonly start: () => void
    readonly stopAndEvaluate: () => void
    readonly rerecord: () => void
    readonly reset: () => void
    readonly pause: () => void
    readonly showResult: () => void
    readonly showError: () => void
    readonly replay: () => void
}

/** 根会话持有唯一实例；面板、底栏与按键只调用同一份受控动作。 */
export function useOralDemo({
    blocked,
    isPaused,
    onNotice,
    onFeedback,
}: UseOralDemoOptions): OralDemoController {
    const [state, dispatch] = useReducer(reduceOralDemo, initialOralDemoState)
    const cancelTimer = useRef<() => void>(() => undefined)
    useEffect(() => {
        const cleanup = scheduleOralDemoTimer(
            state.stage,
            blocked || Boolean(isPaused?.()),
            (): void => dispatch('tick'),
            {
                setInterval: (callback, milliseconds): number =>
                    window.setInterval(callback, milliseconds),
                clearInterval: (timer): void => window.clearInterval(timer),
            },
        )
        cancelTimer.current = cleanup
        return cleanup
    }, [state.stage, blocked, isPaused])
    const pause = useCallback((): void => cancelTimer.current(), [])

    function start(): void {
        if (!blocked && state.stage === 'idle') {
            dispatch('start')
            onFeedback?.('recordStart')
        }
    }

    function stopAndEvaluate(): void {
        if (!blocked) dispatch('stopAndEvaluate')
    }

    function rerecord(): void {
        if (!blocked && (state.stage === 'result' || state.stage === 'error')) {
            dispatch('rerecord')
            onFeedback?.('recordStart')
        }
    }

    const reset = useCallback((): void => {
        dispatch('reset')
    }, [])

    function showResult(): void {
        if (!blocked && state.stage === 'evaluating') {
            dispatch('showResult')
            onFeedback?.('evaluationComplete')
        }
    }

    function showError(): void {
        if (!blocked) dispatch('showError')
    }

    function replay(): void {
        if (!blocked && state.stage === 'result')
            onNotice('当前为口语演示，未生成真实录音，暂不能回放。')
    }

    return {
        ...state,
        blocked,
        start,
        stopAndEvaluate,
        rerecord,
        reset,
        pause,
        showResult,
        showError,
        replay,
    }
}
