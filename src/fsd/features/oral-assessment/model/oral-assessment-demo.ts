import { createOralAssessmentSample, initialOralAssessmentDemoState } from './oral-assessment'
import type {
    OralAssessmentDemoState,
    OralAssessmentResult,
    OralAssessmentTarget,
} from './oral-assessment'

export interface OralAssessmentDemoClock {
    readonly setInterval: (callback: () => void, delay: number) => number
    readonly clearInterval: (timer: number) => void
    readonly setTimeout: (callback: () => void, delay: number) => number
    readonly clearTimeout: (timer: number) => void
}

export interface OralAssessmentDemoOptions {
    readonly active: boolean
    readonly blocked: boolean
    readonly target: OralAssessmentTarget
    /** 可注入固定样例序列；按录制次数循环，与录音时长、音量无关。 */
    readonly sampleScores?: readonly number[] | undefined
    /** 宿主可注入示例音频；playing只取真实媒体状态，不能由play()的Promise推断。 */
    readonly playback?: OralAssessmentPlayback | undefined
    readonly isPaused?: () => boolean
    readonly onFeedback?: (
        kind: 'recordStart' | 'evaluationComplete',
        rating?: OralAssessmentResult['rating'],
    ) => void
}

export interface OralAssessmentPlayback {
    readonly status: 'idle' | 'pending' | 'playing' | 'stopped' | 'error'
    readonly play: () => boolean
    readonly stop: () => void
}

export interface OralAssessmentDemoStore {
    readonly getSnapshot: () => OralAssessmentDemoState
    readonly subscribe: (listener: () => void) => () => void
    readonly configure: (options: OralAssessmentDemoOptions) => void
    readonly start: () => void
    readonly stopAndEvaluate: () => void
    readonly rerecord: () => void
    readonly reset: () => void
    readonly pause: () => void
    readonly replay: () => void
}

/** 唯一阶段所有者；鼠标与 V 即使同一轮触发也读取最新阶段，旧回调不能复活已关闭的评测。 */
export function createOralAssessmentDemo(clock: OralAssessmentDemoClock): OralAssessmentDemoStore {
    let state = initialOralAssessmentDemoState
    let options: OralAssessmentDemoOptions | null = null
    let interval: number | null = null
    let timeout: number | null = null
    let generation = 0
    let sampleIndex = 0
    let replayRequested = false
    const listeners = new Set<() => void>()

    function publish(next: OralAssessmentDemoState): void {
        if (state === next) return
        state = next
        listeners.forEach((listener): void => listener())
    }

    function cancelWork(): void {
        generation += 1
        if (interval !== null) clock.clearInterval(interval)
        if (timeout !== null) clock.clearTimeout(timeout)
        interval = null
        timeout = null
    }

    function enabled(): boolean {
        return Boolean(
            options?.active &&
            !options.blocked &&
            !options.isPaused?.() &&
            options.target.text.trim(),
        )
    }

    function stopReplay(): void {
        if (
            replayRequested ||
            state.playing ||
            options?.playback?.status === 'pending' ||
            options?.playback?.status === 'playing'
        ) {
            replayRequested = false
            options?.playback?.stop()
        }
    }

    function schedule(): void {
        cancelWork()
        if (!enabled()) return
        const current = generation
        function currentRun(): boolean {
            return current === generation && enabled()
        }
        if (state.stage === 'recording') {
            interval = clock.setInterval((): void => {
                if (currentRun()) publish({ ...state, elapsed: state.elapsed + 1 })
            }, 1000)
        } else if (state.stage === 'evaluating') {
            timeout = clock.setTimeout((): void => {
                if (!currentRun() || options === null) return
                timeout = null
                const samples = options.sampleScores
                const score = samples?.length ? samples[sampleIndex % samples.length] : undefined
                const result = createOralAssessmentSample(options.target, score)
                sampleIndex += 1
                publish({ ...state, stage: 'result', result })
                options.onFeedback?.('evaluationComplete', result.rating)
            }, 1200)
        } else if (state.playing && options?.playback === undefined) {
            timeout = clock.setTimeout(
                (): void => {
                    if (!currentRun()) return
                    timeout = null
                    publish({ ...state, playing: false })
                },
                Math.max(1, state.elapsed) * 1000,
            )
        }
    }

    function reset(): void {
        cancelWork()
        stopReplay()
        sampleIndex = 0
        publish(initialOralAssessmentDemoState)
    }

    function begin(): void {
        cancelWork()
        stopReplay()
        publish({ stage: 'recording', elapsed: 0, playing: false, result: null })
        schedule()
        options?.onFeedback?.('recordStart')
    }

    return {
        getSnapshot: (): OralAssessmentDemoState => state,
        subscribe(listener): () => void {
            listeners.add(listener)
            return (): void => {
                listeners.delete(listener)
            }
        },
        configure(next): void {
            const previous = options
            if (previous?.playback !== undefined && next.playback === undefined) stopReplay()
            options = next
            if (
                !next.active ||
                previous === null ||
                previous.target.id !== next.target.id ||
                previous.target.text !== next.target.text
            ) {
                reset()
                return
            }
            if (previous.active !== next.active || previous.blocked !== next.blocked) {
                if (next.blocked) stopReplay()
                if (next.blocked && state.playing) publish({ ...state, playing: false })
                schedule()
            }
            if (next.playback !== undefined && replayRequested) {
                const status = next.playback.status
                if (status === 'stopped' || status === 'error') replayRequested = false
                const playing = status === 'playing' && enabled()
                if (playing !== state.playing) publish({ ...state, playing })
            }
        },
        start(): void {
            if (enabled() && state.stage === 'idle') begin()
        },
        stopAndEvaluate(): void {
            if (!enabled() || state.stage !== 'recording') return
            publish({ ...state, stage: 'evaluating' })
            schedule()
        },
        rerecord(): void {
            if (enabled() && state.stage === 'result') begin()
        },
        reset,
        pause(): void {
            cancelWork()
            stopReplay()
            if (state.playing) publish({ ...state, playing: false })
        },
        replay(): void {
            if (!enabled() || state.stage !== 'result') return
            if (options?.playback !== undefined) {
                cancelWork()
                if (replayRequested) {
                    stopReplay()
                    if (state.playing) publish({ ...state, playing: false })
                } else {
                    replayRequested = true
                    if (!options.playback.play()) replayRequested = false
                }
                return
            }
            publish({ ...state, playing: !state.playing })
            schedule()
        },
    }
}
