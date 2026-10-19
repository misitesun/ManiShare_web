'use client'

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { getMonotonicMilliseconds } from '../../../shared/lib/time'
import { createPracticeTimer } from './practice-timer'
import type { PracticeTimer } from './practice-timer'

export const PracticeTimerContext = createContext<PracticeTimer | null>(null)

function createBrowserTimer(): PracticeTimer {
    // 创建和预渲染阶段不读取时钟、不创建任务；只有 effect 中的 start 会使用浏览器 API。
    return createPracticeTimer({
        now: getMonotonicMilliseconds,
        setInterval: (callback, milliseconds): number => window.setInterval(callback, milliseconds),
        clearInterval: (timer): void => window.clearInterval(timer),
    })
}

/** 清理可重入，StrictMode 的 effect 重放不会留下重复任务或永久停用计时。 */
export function usePracticeTimer(running: boolean, isPaused?: () => boolean): PracticeTimer {
    const [timer] = useState(createBrowserTimer)
    useEffect(() => {
        // 挂载检查或失焦事件可能先于本轮 effect，不能用旧 render 的 running 重启任务。
        if (running && !isPaused?.()) timer.start()
        return timer.pause
    }, [running, timer, isPaused])
    return timer
}

function zero(): number {
    return 0
}

function subscribeWithoutTimer(): () => void {
    return (): void => {}
}

/** 只有计时文本订阅每秒变化，题面、媒体和输入不随计时重渲染。 */
export function usePracticeElapsedSeconds(): number {
    const timer = useContext(PracticeTimerContext)
    return useSyncExternalStore(
        timer?.subscribe ?? subscribeWithoutTimer,
        timer?.getSnapshot ?? zero,
        zero,
    )
}
