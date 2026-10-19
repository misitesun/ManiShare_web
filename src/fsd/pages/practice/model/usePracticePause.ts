'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import { createPracticePause, PRACTICE_PAUSE_ENABLED, watchPracticeFocus } from './practice-pause'

function serverSnapshot(): boolean {
    return false
}

function isAway(): boolean {
    return document.visibilityState === 'hidden' || !document.hasFocus()
}

interface PracticePauseState {
    readonly paused: boolean
    readonly isPaused: () => boolean
    readonly pause: () => void
    readonly requestResume: () => boolean
    readonly resume: () => void
}

export function usePracticePause(
    onPause: () => void,
    fallbackFocus: RefObject<HTMLElement | null>,
): PracticePauseState {
    const [controller] = useState(createPracticePause)
    const callbackRef = useRef(onPause)
    const previousFocus = useRef<HTMLElement | null | undefined>(undefined)
    // 开发热更新可能保留旧控制器的暂停态，关闭开关时对外状态也必须立即解除。
    const getSnapshot = PRACTICE_PAUSE_ENABLED ? controller.getSnapshot : serverSnapshot
    const paused = useSyncExternalStore(controller.subscribe, getSnapshot, serverSnapshot)
    useEffect(() => {
        callbackRef.current = onPause
    }, [onPause])
    useEffect(() => {
        if (paused || previousFocus.current === undefined) return
        const target = previousFocus.current
        previousFocus.current = undefined
        // 原模态已在退场开始释放焦点，此时背景才解除inert，需要会话补回有效焦点。
        if (target?.isConnected && !target.closest('[inert]')) target.focus()
        else fallbackFocus.current?.focus()
    }, [paused, fallbackFocus])
    useEffect(
        () =>
            watchPracticeFocus(
                {
                    isAway,
                    onWindowBlur(listener): () => void {
                        window.addEventListener('blur', listener)
                        return (): void => window.removeEventListener('blur', listener)
                    },
                    onVisibilityChange(listener): () => void {
                        document.addEventListener('visibilitychange', listener)
                        return (): void =>
                            document.removeEventListener('visibilitychange', listener)
                    },
                },
                (): void => {
                    if (!controller.getSnapshot())
                        previousFocus.current =
                            document.activeElement instanceof HTMLElement &&
                            document.activeElement !== document.body
                                ? document.activeElement
                                : null
                    controller.pause()
                    // 重复失焦仍取消正在进行的继续退场，不能在后台完成自动恢复。
                    callbackRef.current()
                },
            ),
        [controller],
    )
    return {
        paused,
        isPaused: getSnapshot,
        pause(): void {
            if (!PRACTICE_PAUSE_ENABLED) return
            if (!controller.getSnapshot())
                previousFocus.current =
                    document.activeElement instanceof HTMLElement &&
                    document.activeElement !== document.body
                        ? document.activeElement
                        : null
            if (controller.pause()) onPause()
        },
        requestResume(): boolean {
            return PRACTICE_PAUSE_ENABLED && !isAway() && controller.requestResume()
        },
        resume(): void {
            // 点击时验证前台；退场的inert可能临时移走文档焦点，不能据此否决已确认意图。
            // 真正的再次失焦会同步清除该意图，visible本身不会触发resume。
            if (PRACTICE_PAUSE_ENABLED && document.visibilityState !== 'hidden') controller.resume()
        },
    }
}
