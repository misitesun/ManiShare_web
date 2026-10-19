export interface PracticeTimerClock {
    readonly now: () => number
    readonly setInterval: (callback: () => void, milliseconds: number) => number
    readonly clearInterval: (timer: number) => void
}

export interface PracticeTimer {
    readonly getSnapshot: () => number
    readonly subscribe: (listener: () => void) => () => void
    readonly start: () => void
    readonly pause: () => void
    readonly reset: () => void
}

/** 累计实际毫秒，刷新任务只负责展示；暂停保留不足一秒的余量。 */
export function createPracticeTimer(clock: PracticeTimerClock): PracticeTimer {
    let accumulated = 0
    let startedAt: number | null = null
    let interval: number | null = null
    let generation = 0
    let seconds = 0
    const listeners = new Set<() => void>()

    function publish(milliseconds: number): void {
        const next = Math.floor(milliseconds / 1000)
        if (next === seconds) return
        seconds = next
        for (const listener of listeners) listener()
    }

    function elapsed(): number {
        return accumulated + (startedAt === null ? 0 : Math.max(0, clock.now() - startedAt))
    }

    function start(): void {
        if (startedAt !== null) return
        startedAt = clock.now()
        const currentGeneration = ++generation
        interval = clock.setInterval((): void => {
            if (startedAt !== null && generation === currentGeneration) publish(elapsed())
        }, 250)
    }

    function pause(): void {
        if (startedAt === null) return
        accumulated = elapsed()
        startedAt = null
        generation += 1
        if (interval !== null) clock.clearInterval(interval)
        interval = null
        publish(accumulated)
    }

    function reset(): void {
        const running = startedAt !== null
        pause()
        accumulated = 0
        publish(0)
        if (running) start()
    }

    function subscribe(listener: () => void): () => void {
        listeners.add(listener)
        return (): void => {
            listeners.delete(listener)
        }
    }

    return { getSnapshot: (): number => seconds, subscribe, start, pause, reset }
}

export function formatPracticeElapsedTime(seconds: number): string {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    return [Math.floor(value / 3600), Math.floor((value % 3600) / 60), value % 60]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')
}
