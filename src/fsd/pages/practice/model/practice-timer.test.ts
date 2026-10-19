import assert from 'node:assert/strict'
import test from 'node:test'
import { createPracticeTimer, formatPracticeElapsedTime } from './practice-timer'
import type { PracticeTimerClock } from './practice-timer'

class FakeClock implements PracticeTimerClock {
    milliseconds = 0
    sequence = 0
    readonly active = new Map<number, () => void>()
    readonly callbacks: Array<() => void> = []

    now(): number {
        return this.milliseconds
    }

    setInterval(callback: () => void, milliseconds: number): number {
        assert.equal(milliseconds, 250)
        const id = ++this.sequence
        this.active.set(id, callback)
        this.callbacks.push(callback)
        return id
    }

    clearInterval(id: number): void {
        this.active.delete(id)
    }

    advance(milliseconds: number, publish = true): void {
        this.milliseconds += milliseconds
        if (publish) for (const callback of this.active.values()) callback()
    }
}

test('创建和读取快照不启动任务、不读取时钟，首屏固定为零', (): void => {
    const timer = createPracticeTimer({
        now: (): number => assert.fail('预渲染不得读取时钟'),
        setInterval: (): number => assert.fail('预渲染不得创建任务'),
        clearInterval: (): void => assert.fail('预渲染没有任务需要清理'),
    })
    assert.equal(timer.getSnapshot(), 0)
    assert.equal(formatPracticeElapsedTime(timer.getSnapshot()), '00:00:00')
    timer.pause()
    timer.reset()
})

test('回调延迟后按实际经过时间追平，只在显示秒数变化时通知', (): void => {
    const clock = new FakeClock()
    const timer = createPracticeTimer(clock)
    const observed: number[] = []
    timer.subscribe((): void => {
        observed.push(timer.getSnapshot())
    })
    timer.start()
    clock.advance(3750)
    assert.equal(timer.getSnapshot(), 3)
    clock.advance(100)
    assert.deepEqual(observed, [3])
    clock.advance(1250)
    assert.equal(timer.getSnapshot(), 5)
    assert.deepEqual(observed, [3, 5])
})

test('暂停保留不足一秒余量，继续后不补算暂停期间时间', (): void => {
    const clock = new FakeClock()
    const timer = createPracticeTimer(clock)
    timer.start()
    clock.advance(1250, false)
    timer.pause()
    assert.equal(timer.getSnapshot(), 1)
    assert.equal(clock.active.size, 0)
    clock.advance(20000)
    assert.equal(timer.getSnapshot(), 1)
    timer.start()
    clock.advance(749)
    assert.equal(timer.getSnapshot(), 1)
    clock.advance(1)
    assert.equal(timer.getSnapshot(), 2)
})

test('重复启停与StrictMode重放只保留一个任务，清理后排队回调无效', (): void => {
    const clock = new FakeClock()
    const timer = createPracticeTimer(clock)
    let notifications = 0
    timer.subscribe((): void => {
        notifications += 1
    })
    timer.start()
    timer.start()
    assert.equal(clock.active.size, 1)
    const old = clock.callbacks[0]
    assert.ok(old)
    timer.pause()
    timer.pause()
    assert.equal(clock.active.size, 0)
    clock.advance(5000, false)
    old()
    assert.equal(timer.getSnapshot(), 0)
    timer.start()
    assert.equal(clock.active.size, 1)
    clock.advance(1500, false)
    old()
    assert.equal(timer.getSnapshot(), 0)
    clock.advance(0)
    assert.equal(timer.getSnapshot(), 1)
    timer.pause()
    const beforeCleanup = notifications
    clock.advance(9000, false)
    for (const callback of clock.callbacks) callback()
    assert.equal(timer.getSnapshot(), 1)
    assert.equal(notifications, beforeCleanup)
    assert.equal(clock.active.size, 0)
})

test('重置清空整秒和余量，运行时开启新一轮，旧回调不能更新新一轮', (): void => {
    const clock = new FakeClock()
    const timer = createPracticeTimer(clock)
    timer.start()
    clock.advance(2750)
    const old = clock.callbacks[0]
    assert.ok(old)
    timer.reset()
    assert.equal(timer.getSnapshot(), 0)
    assert.equal(clock.active.size, 1)
    clock.advance(2000, false)
    old()
    assert.equal(timer.getSnapshot(), 0)
    clock.advance(0)
    assert.equal(timer.getSnapshot(), 2)
    timer.pause()
    timer.reset()
    assert.equal(timer.getSnapshot(), 0)
    assert.equal(clock.active.size, 0)
    timer.start()
    clock.advance(999)
    assert.equal(timer.getSnapshot(), 0)
})

test('取消订阅后不再通知，暂停清除任务', (): void => {
    const clock = new FakeClock()
    const timer = createPracticeTimer(clock)
    let notifications = 0
    const unsubscribe = timer.subscribe((): void => {
        notifications += 1
    })
    timer.start()
    clock.advance(1000)
    assert.equal(notifications, 1)
    unsubscribe()
    clock.advance(2000)
    timer.pause()
    assert.equal(notifications, 1)
    assert.equal(clock.active.size, 0)
})

test('时分秒格式按经过时间进位，不按日期或24小时回绕', (): void => {
    for (const [seconds, expected] of [
        [0, '00:00:00'],
        [59.9, '00:00:59'],
        [60, '00:01:00'],
        [3599, '00:59:59'],
        [3600, '01:00:00'],
        [90061, '25:01:01'],
        [360000, '100:00:00'],
        [-1, '00:00:00'],
        [NaN, '00:00:00'],
        [Infinity, '00:00:00'],
    ] as const)
        assert.equal(formatPracticeElapsedTime(seconds), expected)
})
