import {
    createPracticeMediaController,
    emptyPracticeMediaSnapshot,
    practiceMediaSource,
} from './media-controller'
import type {
    PracticeMediaController,
    PracticeMediaElement,
    PracticeMediaGroup,
    PracticeMediaSnapshot,
    PracticeMediaStatus,
} from './media-controller'
import {
    createPracticeCutReadingState,
    getPracticeCutReadingTransition,
} from './practice-cut-reading'
import type { PracticeCutReadingInput, PracticeCutReadingState } from './practice-cut-reading'

export interface PracticeReadingSnapshot {
    readonly status: PracticeMediaStatus
    readonly error: string | null
    readonly playRequested: boolean
}

/** Hook 的 Effect 重演可以更换媒体宿主，同一次访问的尝试资格不随宿主清理重置。 */
export interface PracticeReadingMemory {
    state: PracticeCutReadingState
}

/** 可选的页面内播放前置步骤；false撤销本次意图，返回值清理等待。 */
export type PracticeReadingPlaybackScheduler = (complete: (allowed: boolean) => void) => () => void

export interface PracticeReadingRuntime {
    readonly update: (input: PracticeCutReadingInput) => void
    readonly setHidden: (hidden: boolean) => void
    readonly play: () => boolean
    readonly togglePlayback: () => boolean
    /** 当前访问内切换单词／例句音源，复用同一宿主及前置调度。 */
    readonly toggleSourcePlayback: (source: string | undefined, visitKey: string) => boolean
    readonly pause: () => void
    readonly stop: () => void
    readonly snapshot: () => PracticeReadingSnapshot
    readonly dispose: () => void
}

export function createPracticeReadingMemory(): PracticeReadingMemory {
    return { state: createPracticeCutReadingState() }
}

export function createPracticeReadingSnapshot(): PracticeReadingSnapshot {
    return {
        status: emptyPracticeMediaSnapshot.status,
        error: null,
        playRequested: false,
    }
}

/** Effect 先完成挂载再提交策略；同步 setup-cleanup-setup 不消耗第一次播放资格。 */
export function schedulePracticeReadingUpdate(
    runtime: PracticeReadingRuntime,
    input: PracticeCutReadingInput,
): () => void {
    let cancelled = false
    queueMicrotask((): void => {
        if (!cancelled) runtime.update(input)
    })
    return (): void => {
        cancelled = true
    }
}

/** 页面私有的朗读宿主：不承载题面播放器、时长进度、判题或快捷键。 */
export function createPracticeReadingRuntime(
    createElement: () => PracticeMediaElement,
    onChange: (snapshot: PracticeReadingSnapshot) => void,
    memory: PracticeReadingMemory = createPracticeReadingMemory(),
    group?: PracticeMediaGroup,
    onEnded?: (visitKey: string) => void,
    schedulePlayback?: PracticeReadingPlaybackScheduler,
): PracticeReadingRuntime {
    let current = createPracticeReadingSnapshot()
    let input: PracticeCutReadingInput | null = null
    let controller: PracticeMediaController | null = null
    let boundSource: string | null = null
    let requestedEndVisit: string | null = null
    let generation = 0
    let hidden = false
    let disposed = false
    let pendingPlayback: { cancel: (() => void) | null } | null = null

    function cancelPendingPlayback(): void {
        const pending = pendingPlayback
        pendingPlayback = null
        pending?.cancel?.()
    }

    function publish(snapshot: PracticeReadingSnapshot): void {
        if (
            disposed ||
            (current.status === snapshot.status &&
                current.error === snapshot.error &&
                current.playRequested === snapshot.playRequested)
        )
            return
        current = snapshot
        onChange(current)
    }

    function disposeMedia(): void {
        cancelPendingPlayback()
        generation += 1
        const previous = controller
        controller = null
        boundSource = null
        requestedEndVisit = null
        previous?.dispose()
        publish(createPracticeReadingSnapshot())
    }

    function bindSource(source: string): PracticeMediaController {
        if (controller !== null && boundSource === source) return controller
        disposeMedia()
        const version = generation
        const element = createElement()
        const next = createPracticeMediaController(
            element,
            (snapshot: PracticeMediaSnapshot): void => {
                if (version !== generation || disposed) return
                // 媒体组stopAll也会在此回报paused，必须同时撤销尚未开始的朗读。
                if (snapshot.status === 'paused' || snapshot.status === 'error')
                    cancelPendingPlayback()
                // 自然播完可先触发 pause，再触发 ended；不能把该 pause 当成手动撤销。
                const naturalEndPause =
                    snapshot.status === 'paused' && 'ended' in element && element.ended === true
                if (snapshot.playRequested) requestedEndVisit = input?.visitKey ?? null
                else if (snapshot.status !== 'ended' && !naturalEndPause) requestedEndVisit = null
                const endedVisit = snapshot.status === 'ended' ? requestedEndVisit : null
                if (snapshot.status === 'ended') requestedEndVisit = null
                publish({
                    status: snapshot.status,
                    error: snapshot.error,
                    playRequested: snapshot.playRequested || pendingPlayback !== null,
                })
                if (
                    endedVisit !== null &&
                    input !== null &&
                    endedVisit === input.visitKey &&
                    input.ready &&
                    !input.blocked &&
                    !hidden
                )
                    onEnded?.(endedVisit)
            },
            group,
        )
        controller = next
        boundSource = source
        next.setSource(source)
        return next
    }

    function requestPlayback(active: PracticeMediaController): void {
        cancelPendingPlayback()
        if (schedulePlayback === undefined) {
            void active.play()
            return
        }
        const visitKey = input?.visitKey
        const pending: { cancel: (() => void) | null } = { cancel: null }
        pendingPlayback = pending
        publish({ ...current, playRequested: true })
        const cancel = schedulePlayback((allowed): void => {
            if (pendingPlayback !== pending) return
            pendingPlayback = null
            pending.cancel?.()
            if (
                !allowed ||
                disposed ||
                hidden ||
                input === null ||
                input.visitKey !== visitKey ||
                input.blocked ||
                !input.ready ||
                controller !== active
            ) {
                active.pause()
                return
            }
            void active.play()
        })
        if (pendingPlayback === pending) pending.cancel = cancel
        else cancel()
    }

    function update(next: PracticeCutReadingInput): void {
        if (disposed) return
        const previous = input
        input = next
        const source = practiceMediaSource(next.source)
        // 依赖 ended 推进的宿主按访问隔离旧事件；其他模式保留原同源元素复用。
        if (
            (onEnded !== undefined && previous !== null && previous.visitKey !== next.visitKey) ||
            (boundSource !== null && boundSource !== source)
        )
            disposeMedia()
        const transition = getPracticeCutReadingTransition(memory.state, {
            ...next,
            blocked: next.blocked || hidden,
        })
        // 只对实际播放意图创建宿主；切读关闭、无白名单或未就绪时不预加载。
        // 候选策略先不提交，成功绑定后才消费本次自动尝试。
        if (transition.action === 'play' && source !== null) bindSource(source)
        memory.state = transition.state
        if (
            transition.stopPrevious ||
            (previous !== null && previous.visitKey !== next.visitKey) ||
            ((next.blocked || !next.ready) &&
                (controller?.snapshot().playRequested ||
                    previous?.blocked !== next.blocked ||
                    previous?.ready !== next.ready))
        ) {
            cancelPendingPlayback()
            controller?.stop()
        }
        if (source === null) publish(createPracticeReadingSnapshot())
        if (transition.action === 'play' && controller !== null && !current.playRequested)
            requestPlayback(controller)
    }

    function pause(): void {
        if (disposed) return
        cancelPendingPlayback()
        requestedEndVisit = null
        // 显式暂停已经撤回自动播放意图；关闭自动切题不应再 stop 回到零秒。
        memory.state = { ...memory.state, requestedSource: null }
        controller?.pause()
    }

    function stop(): void {
        if (disposed) return
        cancelPendingPlayback()
        requestedEndVisit = null
        controller?.stop()
    }

    return {
        update,
        play(): boolean {
            if (disposed || input === null) return false
            const source = practiceMediaSource(input.source)
            if (source === null) return false
            if (input.blocked || !input.ready || hidden) return true
            const active = bindSource(source)
            if (!current.playRequested) requestPlayback(active)
            return true
        },
        setHidden(nextHidden): void {
            if (disposed || hidden === nextHidden) return
            hidden = nextHidden
            if (hidden) {
                cancelPendingPlayback()
                requestedEndVisit = null
                controller?.stop()
            }
            if (input !== null) update(input)
        },
        togglePlayback(): boolean {
            if (disposed || input === null) return false
            const source = practiceMediaSource(input.source)
            if (source === null) return false
            if (input.blocked || !input.ready || hidden) return true
            const active = bindSource(source)
            if (current.playRequested) pause()
            else requestPlayback(active)
            return true
        },
        toggleSourcePlayback(nextSource, visitKey): boolean {
            if (disposed || input === null || visitKey !== input.visitKey) return false
            const source = practiceMediaSource(nextSource)
            if (source === null) return false
            if (input.blocked || !input.ready || hidden) return true
            const active = bindSource(source)
            if (current.playRequested) pause()
            else requestPlayback(active)
            return true
        },
        pause,
        stop,
        snapshot: (): PracticeReadingSnapshot => current,
        dispose(): void {
            if (disposed) return
            disposed = true
            disposeMedia()
        },
    }
}
