import assert from 'node:assert/strict'
import test from 'node:test'
import { initialOralDemoState, reduceOralDemo, scheduleOralDemoTimer } from './oral-demo'
import type { OralDemoAction, OralDemoClock, OralDemoStage, OralDemoState } from './oral-demo'

class ClockStub implements OralDemoClock {
    readonly callbacks: (() => void)[] = []
    readonly cleared: number[] = []

    setInterval(callback: () => void, milliseconds: number): number {
        assert.equal(milliseconds, 1000)
        this.callbacks.push(callback)
        return this.callbacks.length
    }

    clearInterval(timer: number): void {
        this.cleared.push(timer)
    }

    tick(timer = this.callbacks.length): void {
        const callback = this.callbacks[timer - 1]
        assert.ok(callback)
        callback()
    }
}

test('录音和评测仅由显式动作推进，评测不会因计时自动生成结果', (): void => {
    let state = reduceOralDemo(initialOralDemoState, 'start')
    assert.deepEqual(state, { stage: 'recording', elapsed: 0 })
    state = reduceOralDemo(state, 'tick')
    state = reduceOralDemo(state, 'tick')
    assert.deepEqual(state, { stage: 'recording', elapsed: 2 })
    state = reduceOralDemo(state, 'stopAndEvaluate')
    assert.deepEqual(state, { stage: 'evaluating', elapsed: 2 })
    assert.equal(reduceOralDemo(state, 'tick'), state)
    assert.deepEqual(reduceOralDemo(state, 'showResult'), { stage: 'result', elapsed: 2 })
    assert.deepEqual(reduceOralDemo(state, 'showError'), { stage: 'error', elapsed: 2 })
    assert.deepEqual(initialOralDemoState, { stage: 'idle', elapsed: 0 })
})

test('重复开始、重复停止及越阶段结果动作保持当前阶段和已有计时', (): void => {
    const cases: readonly {
        readonly stage: OralDemoStage
        readonly actions: readonly OralDemoAction[]
    }[] = [
        {
            stage: 'idle',
            actions: ['stopAndEvaluate', 'rerecord', 'showResult', 'showError', 'tick'],
        },
        { stage: 'recording', actions: ['start', 'rerecord', 'showResult', 'showError'] },
        { stage: 'evaluating', actions: ['start', 'stopAndEvaluate', 'rerecord', 'tick'] },
        {
            stage: 'result',
            actions: ['start', 'stopAndEvaluate', 'showResult', 'showError', 'tick'],
        },
        {
            stage: 'error',
            actions: ['start', 'stopAndEvaluate', 'showResult', 'showError', 'tick'],
        },
    ]
    for (const { stage, actions } of cases) {
        const state = { stage, elapsed: 3 }
        for (const action of actions) assert.equal(reduceOralDemo(state, action), state)
    }
})

test('结果重录与失败重试清空计时，取消或切题可从任何阶段回到待录', (): void => {
    for (const stage of ['result', 'error'] as const)
        assert.deepEqual(reduceOralDemo({ stage, elapsed: 7 }, 'rerecord'), {
            stage: 'recording',
            elapsed: 0,
        })
    for (const stage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const)
        assert.equal(reduceOralDemo({ stage, elapsed: 7 }, 'reset'), initialOralDemoState)
})

test('阻断期间及非录音阶段不启动计时器', (): void => {
    const clock = new ClockStub()
    let ticks = 0
    function tick(): void {
        ticks += 1
    }
    for (const stage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const) {
        scheduleOralDemoTimer(stage, true, tick, clock)()
        if (stage !== 'recording') scheduleOralDemoTimer(stage, false, tick, clock)()
    }
    assert.equal(ticks, 0)
    assert.equal(clock.callbacks.length, 0)
    assert.deepEqual(clock.cleared, [])
})

test('停止、阻断或卸载清理计时器，迟到回调不再计时，重复清理没有额外动作', (): void => {
    const clock = new ClockStub()
    let ticks = 0
    const dispose = scheduleOralDemoTimer(
        'recording',
        false,
        (): void => {
            ticks += 1
        },
        clock,
    )
    clock.tick()
    assert.equal(ticks, 1)
    dispose()
    dispose()
    clock.tick()
    assert.equal(ticks, 1)
    assert.deepEqual(clock.cleared, [1])
})

test('阻断后恢复只继续有效录音计时，旧计时器不补算暂停时间', (): void => {
    const clock = new ClockStub()
    let state: OralDemoState = reduceOralDemo(initialOralDemoState, 'start')
    function tick(): void {
        state = reduceOralDemo(state, 'tick')
    }
    const pause = scheduleOralDemoTimer(state.stage, false, tick, clock)
    clock.tick(1)
    pause()
    const blocked = scheduleOralDemoTimer(state.stage, true, tick, clock)
    clock.tick(1)
    blocked()
    assert.equal(state.elapsed, 1)
    const resume = scheduleOralDemoTimer(state.stage, false, tick, clock)
    clock.tick(2)
    assert.deepEqual(state, { stage: 'recording', elapsed: 2 })
    state = reduceOralDemo(state, 'reset')
    resume()
    clock.tick(2)
    assert.equal(state, initialOralDemoState)
    assert.deepEqual(clock.cleared, [1, 2])
})
