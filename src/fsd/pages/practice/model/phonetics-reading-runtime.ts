import {
    createPracticeMediaController,
    createPracticeMediaGroup,
    practiceMediaGroup,
} from './media-controller'
import type {
    PracticeMediaController,
    PracticeMediaElement,
    PracticeMediaGroup,
} from './media-controller'
import { createPhoneticsAudioPlan } from './phonetics-reading-plan'
import type { PhoneticsAudioStep, PhoneticsPlaybackRequest } from './phonetics-reading-plan'
import type { PracticeQuestion } from './practice-demo'
import type { PracticeReadingPlaybackScheduler } from './practice-reading-runtime'

export interface PhoneticsReadingInput {
    readonly question: PracticeQuestion | undefined
    readonly visitKey: string
    readonly naturalPhonics: boolean
    readonly enabled: boolean
    readonly ready: boolean
    readonly blocked: boolean
}

export type PhoneticsReadingSurface = 'target' | 'word'

export interface PhoneticsReadingSnapshot {
    readonly status:
        'idle' | 'waiting' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'unavailable'
    readonly playRequested: boolean
    readonly surface: PhoneticsReadingSurface | null
    readonly step: PhoneticsAudioStep | null
    readonly error: string | null
}

export interface PhoneticsReadingMemory {
    attemptedVisit: string | null
}

export interface PhoneticsReadingRuntime {
    readonly update: (input: PhoneticsReadingInput) => void
    readonly setHidden: (hidden: boolean) => void
    readonly toggle: () => void
    readonly playTarget: () => void
    readonly playWord: () => void
    readonly playSegment: (segmentId: string) => void
    readonly stop: () => void
    readonly dispose: () => void
}

interface PhoneticsReadingDependencies {
    readonly createElement: () => PracticeMediaElement
    readonly onChange: (snapshot: PhoneticsReadingSnapshot) => void
    readonly memory: PhoneticsReadingMemory
    readonly group?: PracticeMediaGroup
    readonly schedulePlayback?: PracticeReadingPlaybackScheduler
    readonly scheduleGap: (callback: () => void) => () => void
}

export function createPhoneticsReadingSnapshot(): PhoneticsReadingSnapshot {
    return { status: 'idle', playRequested: false, surface: null, step: null, error: null }
}

/** 单次只加载当前音段，真实 ended 后留白再播下一段；访问与音段双重隔离旧事件。 */
export function createPhoneticsReadingRuntime({
    createElement,
    onChange,
    memory,
    group = practiceMediaGroup,
    schedulePlayback,
    scheduleGap,
}: PhoneticsReadingDependencies): PhoneticsReadingRuntime {
    let input: PhoneticsReadingInput | null = null
    let current = createPhoneticsReadingSnapshot()
    let controller: PracticeMediaController | null = null
    let run = 0
    let segmentVersion = 0
    let hidden = false
    let disposed = false
    let cancelWait: (() => void) | null = null
    // 整个队列持有同一内容媒体席位，包含前置提示音等待和句段间隔。
    // 单段宿主只在内部组互斥，避免自然ended提前释放外层席位后被旧间隔抢播。
    const segmentGroup = createPracticeMediaGroup()

    function publish(next: PhoneticsReadingSnapshot): void {
        if (disposed) return
        if (
            current.status === next.status &&
            current.playRequested === next.playRequested &&
            current.surface === next.surface &&
            current.step === next.step &&
            current.error === next.error
        )
            return
        current = next
        onChange(next)
    }

    function releaseMedia(): void {
        segmentVersion += 1
        const previous = controller
        controller = null
        previous?.dispose()
    }

    function cancel(): void {
        run += 1
        group.release(stop)
        const waiting = cancelWait
        cancelWait = null
        waiting?.()
        releaseMedia()
    }

    function stop(): void {
        if (disposed) return
        if (
            !current.playRequested &&
            controller === null &&
            cancelWait === null &&
            current.step === null
        )
            return
        cancel()
        publish({ ...current, status: 'paused', playRequested: false, surface: null, step: null })
    }

    const unregister = group.register(stop)

    function allowed(): boolean {
        return (
            !disposed && !hidden && input !== null && input.enabled && input.ready && !input.blocked
        )
    }

    function isCurrent(version: number): boolean {
        return version === run && allowed() && current.playRequested
    }

    function playStep(
        steps: readonly PhoneticsAudioStep[],
        index: number,
        version: number,
        surface: PhoneticsReadingSurface,
    ): void {
        if (!isCurrent(version)) return
        const step = steps[index]
        releaseMedia()
        if (!step) {
            group.release(stop)
            publish({
                status: 'ended',
                playRequested: false,
                surface: null,
                step: null,
                error: null,
            })
            return
        }
        publish({ status: 'loading', playRequested: true, surface, step, error: null })
        const element = createElement()
        const segment = segmentVersion
        let binding = true
        let ended = false
        controller = createPracticeMediaController(
            element,
            (snapshot): void => {
                if (segment !== segmentVersion || !isCurrent(version)) return
                if (snapshot.status === 'error') {
                    cancel()
                    publish({
                        status: 'error',
                        playRequested: false,
                        surface: null,
                        step,
                        error: snapshot.error,
                    })
                } else if (snapshot.status === 'ended' && !ended) {
                    ended = true
                    if (index + 1 >= steps.length) {
                        group.release(stop)
                        releaseMedia()
                        publish({
                            status: 'ended',
                            playRequested: false,
                            surface: null,
                            step: null,
                            error: null,
                        })
                    } else {
                        publish({
                            status: 'waiting',
                            playRequested: true,
                            surface,
                            step,
                            error: null,
                        })
                        cancelWait = scheduleGap((): void => {
                            if (!isCurrent(version)) return
                            cancelWait = null
                            playStep(steps, index + 1, version, surface)
                        })
                    }
                } else if (snapshot.status === 'paused' && !binding) {
                    // 自然结束可先 pause 后 ended；显式暂停与媒体互斥必须取消整个序列。
                    if (ended || !('ended' in element && element.ended === true)) stop()
                } else if (snapshot.status === 'playing') {
                    publish({ status: 'playing', playRequested: true, surface, step, error: null })
                }
            },
            segmentGroup,
        )
        controller.setSource(step.source)
        binding = false
        if (isCurrent(version)) void controller?.play()
    }

    function start(request: PhoneticsPlaybackRequest): void {
        if (!allowed() || !input?.question) return
        cancel()
        const plan = createPhoneticsAudioPlan(input.question, input.naturalPhonics, request)
        if (plan.kind === 'unavailable') {
            publish({
                status: 'unavailable',
                playRequested: false,
                surface: null,
                step: null,
                error: plan.message,
            })
            return
        }
        const version = run
        const surface = request.kind === 'target' ? 'target' : 'word'
        publish({ status: 'waiting', playRequested: true, surface, step: null, error: null })
        group.activate(stop)
        if (!schedulePlayback) {
            playStep(plan.steps, 0, version, surface)
            return
        }
        let completed = false
        const cleanup = schedulePlayback((canPlay): void => {
            completed = true
            if (!isCurrent(version)) return
            const waiting = cancelWait
            cancelWait = null
            waiting?.()
            if (canPlay) playStep(plan.steps, 0, version, surface)
            else stop()
        })
        if (completed || !isCurrent(version)) cleanup()
        else cancelWait = cleanup
    }

    return {
        update(next): void {
            if (disposed) return
            const changed =
                input !== null &&
                (input.visitKey !== next.visitKey ||
                    input.question !== next.question ||
                    input.naturalPhonics !== next.naturalPhonics)
            input = next
            if (changed || !allowed()) stop()
            if (allowed() && next.question && memory.attemptedVisit !== next.visitKey) {
                memory.attemptedVisit = next.visitKey
                start({ kind: 'sequence' })
            }
        },
        setHidden(next): void {
            hidden = next
            if (hidden) stop()
        },
        toggle(): void {
            if (!allowed()) return
            if (current.playRequested) stop()
            else start({ kind: 'sequence' })
        },
        playTarget(): void {
            start({ kind: 'target' })
        },
        playWord(): void {
            start({ kind: 'word' })
        },
        playSegment(segmentId): void {
            start({ kind: 'segment', segmentId })
        },
        stop,
        dispose(): void {
            if (disposed) return
            disposed = true
            cancel()
            unregister()
        },
    }
}
