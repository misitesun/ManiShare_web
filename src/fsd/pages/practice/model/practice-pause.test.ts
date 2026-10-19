import assert from 'node:assert/strict'
import test from 'node:test'
import { createPracticePause, watchPracticeFocus } from './practice-pause'
import type { PracticeFocusSource } from './practice-pause'
import { createPracticeTimer } from './practice-timer'

class FocusSource implements PracticeFocusSource {
    away = false
    readonly blurListeners = new Set<() => void>()
    readonly visibilityListeners = new Set<() => void>()
    readonly retired: Array<() => void> = []
    isAway(): boolean {
        return this.away
    }
    onWindowBlur(listener: () => void): () => void {
        this.blurListeners.add(listener)
        this.retired.push(listener)
        return (): void => {
            this.blurListeners.delete(listener)
        }
    }
    onVisibilityChange(listener: () => void): () => void {
        this.visibilityListeners.add(listener)
        this.retired.push(listener)
        return (): void => {
            this.visibilityListeners.delete(listener)
        }
    }
    blur(): void {
        this.away = true
        for (const listener of this.blurListeners) listener()
    }
    visibility(away: boolean): void {
        this.away = away
        for (const listener of this.visibilityListeners) listener()
    }
}

test('开发阶段默认停用暂停，手动动作不改变状态或发送通知', (): void => {
    const controller = createPracticePause()
    let notifications = 0
    const unsubscribe = controller.subscribe((): void => {
        notifications += 1
    })
    assert.equal(controller.pause(), false)
    assert.equal(controller.requestResume(), false)
    controller.resume()
    assert.equal(controller.getSnapshot(), false)
    assert.equal(notifications, 0)
    unsubscribe()
})

test('停用期间后台挂载、失焦或隐藏不订阅暂停监听，也不冻结真实计时', (): void => {
    const source = new FocusSource()
    source.away = true
    let milliseconds = 0
    const timer = createPracticeTimer({
        now: (): number => milliseconds,
        setInterval: (): number => 1,
        clearInterval(): void {},
    })
    let pauses = 0
    const cleanup = watchPracticeFocus(source, (): void => {
        pauses += 1
        timer.pause()
    })
    timer.start()
    milliseconds = 1500
    source.blur()
    source.visibility(true)
    source.visibility(false)
    milliseconds = 3500
    timer.pause()
    assert.equal(timer.getSnapshot(), 3)
    assert.equal(pauses, 0)
    assert.equal(source.blurListeners.size, 0)
    assert.equal(source.visibilityListeners.size, 0)
    assert.equal(source.retired.length, 0)
    cleanup()
    cleanup()
})

test('重新启用后，暂停状态独立持有，重复暂停不重复通知；仅显式继续解除', (): void => {
    const controller = createPracticePause(true)
    const states: boolean[] = []
    const unsubscribe = controller.subscribe((): void => {
        states.push(controller.getSnapshot())
    })
    assert.equal(controller.getSnapshot(), false)
    assert.equal(controller.pause(), true)
    assert.equal(controller.pause(), false)
    controller.requestResume()
    controller.resume()
    controller.resume()
    assert.deepEqual(states, [true, false])
    unsubscribe()
    controller.pause()
    assert.deepEqual(states, [true, false])
})

test('窗口blur和标签隐藏都暂停，窗口返回和重复可见事件不会自动继续', (): void => {
    const source = new FocusSource()
    const controller = createPracticePause(true)
    const cleanup = watchPracticeFocus(
        source,
        (): void => {
            controller.pause()
        },
        true,
    )
    assert.equal(controller.getSnapshot(), false)
    source.blur()
    source.visibility(true)
    assert.equal(controller.getSnapshot(), true)
    source.visibility(false)
    source.visibility(false)
    assert.equal(controller.getSnapshot(), true)
    controller.requestResume()
    controller.resume()
    assert.equal(controller.getSnapshot(), false)
    source.visibility(true)
    assert.equal(controller.getSnapshot(), true)
    cleanup()
})

test('会话在后台挂载立即暂停；重复失焦仍通知资源停止，取消继续中的退场', (): void => {
    const source = new FocusSource()
    source.away = true
    let pauses = 0
    const cleanup = watchPracticeFocus(
        source,
        (): void => {
            pauses += 1
        },
        true,
    )
    assert.equal(pauses, 1)
    source.blur()
    source.visibility(true)
    assert.equal(pauses, 3)
    cleanup()
})

test('卸载移除两种监听，排队的旧事件失效；StrictMode重挂只保留一份监听', (): void => {
    const source = new FocusSource()
    let pauses = 0
    const onPause = (): void => {
        pauses += 1
    }
    const cleanup = watchPracticeFocus(source, onPause, true)
    assert.equal(source.blurListeners.size, 1)
    assert.equal(source.visibilityListeners.size, 1)
    cleanup()
    cleanup()
    assert.equal(source.blurListeners.size, 0)
    assert.equal(source.visibilityListeners.size, 0)
    for (const callback of source.retired) callback()
    source.blur()
    assert.equal(pauses, 0)
    source.away = false
    const secondCleanup = watchPracticeFocus(source, onPause, true)
    assert.equal(source.blurListeners.size, 1)
    assert.equal(source.visibilityListeners.size, 1)
    source.blur()
    assert.equal(pauses, 1)
    secondCleanup()
    source.visibility(true)
    assert.equal(pauses, 1)
})

test('失焦同步清理真实计时，后台滞留不补算，继续保留原来的毫秒余量', (): void => {
    const source = new FocusSource()
    const controller = createPracticePause(true)
    let milliseconds = 0
    let refresh: (() => void) | null = null
    const timer = createPracticeTimer({
        now: (): number => milliseconds,
        setInterval(callback): number {
            refresh = callback
            return 1
        },
        clearInterval(): void {
            refresh = null
        },
    })
    const cleanup = watchPracticeFocus(
        source,
        (): void => {
            controller.pause()
            timer.pause()
        },
        true,
    )
    timer.start()
    milliseconds = 1750
    source.blur()
    assert.equal(timer.getSnapshot(), 1)
    assert.equal(refresh, null)
    milliseconds = 32000
    source.visibility(false)
    assert.equal(controller.getSnapshot(), true)
    assert.equal(timer.getSnapshot(), 1)
    controller.requestResume()
    controller.resume()
    timer.start()
    milliseconds += 250
    timer.pause()
    assert.equal(timer.getSnapshot(), 2)
    cleanup()
    assert.equal(refresh, null)
})

test('返回不会自行恢复；再次失焦取消退场中的继续意图，旧退场回调不能解除暂停', (): void => {
    const controller = createPracticePause(true)
    controller.pause()
    controller.resume()
    assert.equal(controller.getSnapshot(), true)
    assert.equal(controller.requestResume(), true)
    controller.pause()
    controller.resume()
    assert.equal(controller.getSnapshot(), true)
    controller.requestResume()
    controller.resume()
    assert.equal(controller.getSnapshot(), false)
    assert.equal(controller.requestResume(), false)
})
