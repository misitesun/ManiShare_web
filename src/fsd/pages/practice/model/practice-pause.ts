/** 开发阶段暂不启用游戏暂停；恢复时由此统一开放入口、状态和失焦监听。 */
export const PRACTICE_PAUSE_ENABLED = false

export interface PracticePause {
    readonly getSnapshot: () => boolean
    readonly subscribe: (listener: () => void) => () => void
    readonly pause: () => boolean
    readonly requestResume: () => boolean
    readonly resume: () => void
}

/** 独立于题内浮层；暂停期间保留原有设置、笔记及口语阶段。 */
export function createPracticePause(enabled: boolean = PRACTICE_PAUSE_ENABLED): PracticePause {
    let paused = false
    let resumeRequested = false
    const listeners = new Set<() => void>()
    function update(next: boolean): void {
        if (paused === next) return
        paused = next
        for (const listener of listeners) listener()
    }
    return {
        getSnapshot: (): boolean => paused,
        subscribe(listener): () => void {
            listeners.add(listener)
            return (): void => {
                listeners.delete(listener)
            }
        },
        pause(): boolean {
            if (!enabled) return false
            resumeRequested = false
            if (paused) return false
            update(true)
            return true
        },
        requestResume(): boolean {
            if (!enabled) return false
            resumeRequested = paused
            return resumeRequested
        },
        resume(): void {
            if (resumeRequested) update(false)
            resumeRequested = false
        },
    }
}

export interface PracticeFocusSource {
    readonly isAway: () => boolean
    readonly onWindowBlur: (listener: () => void) => () => void
    readonly onVisibilityChange: (listener: () => void) => () => void
}

/** 失焦立即停计时，不等待后台页面的下一次 React 提交；返回不自动继续。 */
export function watchPracticeFocus(
    source: PracticeFocusSource,
    onPause: () => void,
    enabled: boolean = PRACTICE_PAUSE_ENABLED,
): () => void {
    if (!enabled) return (): void => {}
    let active = true
    function pause(): void {
        if (active) onPause()
    }
    function visibilityChange(): void {
        if (source.isAway()) pause()
    }
    const removeBlur = source.onWindowBlur(pause)
    const removeVisibility = source.onVisibilityChange(visibilityChange)
    // 加载结束时页面可能已在后台，不能等到下一次 blur 才暂停。
    visibilityChange()
    return (): void => {
        if (!active) return
        active = false
        removeBlur()
        removeVisibility()
    }
}
