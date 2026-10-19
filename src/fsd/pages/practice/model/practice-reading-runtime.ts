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

export interface PracticeReadingRuntime {
    readonly update: (input: PracticeCutReadingInput) => void
    readonly setHidden: (hidden: boolean) => void
    readonly togglePlayback: () => boolean
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
): PracticeReadingRuntime {
    let current = createPracticeReadingSnapshot()
    let input: PracticeCutReadingInput | null = null
    let controller: PracticeMediaController | null = null
    let boundSource: string | null = null
    let generation = 0
    let hidden = false
    let disposed = false

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
        generation += 1
        const previous = controller
        controller = null
        boundSource = null
        previous?.dispose()
        publish(createPracticeReadingSnapshot())
    }

    function bindSource(source: string): PracticeMediaController {
        if (controller !== null && boundSource === source) return controller
        disposeMedia()
        const version = generation
        const next = createPracticeMediaController(
            createElement(),
            (snapshot: PracticeMediaSnapshot): void => {
                if (version === generation)
                    publish({
                        status: snapshot.status,
                        error: snapshot.error,
                        playRequested: snapshot.playRequested,
                    })
            },
            group,
        )
        controller = next
        boundSource = source
        next.setSource(source)
        return next
    }

    function update(next: PracticeCutReadingInput): void {
        if (disposed) return
        const previous = input
        input = next
        const source = practiceMediaSource(next.source)
        if (boundSource !== null && boundSource !== source) disposeMedia()
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
        )
            controller?.stop()
        if (source === null) publish(createPracticeReadingSnapshot())
        if (transition.action === 'play' && !controller?.snapshot().playRequested)
            void controller?.play()
    }

    function pause(): void {
        if (!disposed) controller?.pause()
    }

    function stop(): void {
        if (!disposed) controller?.stop()
    }

    return {
        update,
        setHidden(nextHidden): void {
            if (disposed || hidden === nextHidden) return
            hidden = nextHidden
            if (hidden) controller?.stop()
            if (input !== null) update(input)
        },
        togglePlayback(): boolean {
            if (disposed || input === null) return false
            const source = practiceMediaSource(input.source)
            if (source === null) return false
            if (input.blocked || !input.ready || hidden) return true
            const active = bindSource(source)
            if (active.snapshot().playRequested) active.pause()
            else void active.play()
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
