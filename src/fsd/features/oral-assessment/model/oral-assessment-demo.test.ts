import assert from 'node:assert/strict'
import test from 'node:test'
import { createOralAssessmentDemo } from './oral-assessment-demo'
import type { OralAssessmentDemoClock, OralAssessmentDemoOptions } from './oral-assessment-demo'
import {
    createOralAssessmentSample,
    formatOralAssessmentTime,
    normalizeOralAssessmentScore,
} from './oral-assessment'

class FakeClock implements OralAssessmentDemoClock {
    sequence = 0
    readonly intervals = new Map<number, () => void>()
    readonly timeouts = new Map<number, () => void>()
    readonly queued: Array<() => void> = []

    setInterval(callback: () => void, delay: number): number {
        assert.equal(delay, 1000)
        const id = ++this.sequence
        this.intervals.set(id, callback)
        this.queued.push(callback)
        return id
    }

    clearInterval(id: number): void {
        this.intervals.delete(id)
    }

    setTimeout(callback: () => void, delay: number): number {
        assert.ok(delay > 0)
        const id = ++this.sequence
        this.timeouts.set(id, callback)
        this.queued.push(callback)
        return id
    }

    clearTimeout(id: number): void {
        this.timeouts.delete(id)
    }

    tick(): void {
        for (const callback of [...this.intervals.values()]) callback()
    }

    finishPending(): void {
        const pending = [...this.timeouts.values()]
        this.timeouts.clear()
        for (const callback of pending) callback()
    }
}

const options: OralAssessmentDemoOptions = {
    active: true,
    blocked: false,
    target: { id: 'woman', text: 'woman', translation: '女人', kind: 'word' },
}

test('打开只进入准备态；重复开始、重复结束不会创建重复计时或评分', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    const feedback: string[] = []
    controller.configure({
        ...options,
        onFeedback: (kind, rating): void => {
            feedback.push(rating ?? kind)
        },
    })
    assert.equal(controller.getSnapshot().stage, 'idle')
    assert.equal(clock.queued.length, 0)
    controller.start()
    controller.start()
    assert.equal(clock.intervals.size, 1)
    clock.tick()
    clock.tick()
    assert.equal(controller.getSnapshot().elapsed, 2)
    controller.stopAndEvaluate()
    controller.stopAndEvaluate()
    assert.equal(clock.intervals.size, 0)
    assert.equal(clock.timeouts.size, 1)
    assert.equal(controller.getSnapshot().stage, 'evaluating')
    clock.finishPending()
    assert.equal(controller.getSnapshot().stage, 'result')
    assert.equal(controller.getSnapshot().result?.score, 40)
    assert.deepEqual(feedback, ['recordStart', 'KEEP TRYING'])
})

test('关闭后即使已排队的回调到达，也不能展示旧分数或发出完成音效', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    const feedback: string[] = []
    controller.configure({
        ...options,
        onFeedback: (kind): void => {
            feedback.push(kind)
        },
    })
    controller.start()
    controller.stopAndEvaluate()
    controller.reset()
    controller.configure({ ...options, active: false })
    for (const callback of clock.queued) callback()
    controller.start()
    assert.equal(controller.getSnapshot().stage, 'idle')
    assert.equal(controller.getSnapshot().result, null)
    assert.equal(clock.intervals.size + clock.timeouts.size, 0)
    assert.deepEqual(feedback, ['recordStart'])
})

test('切换题目或题面重置当前流程，新题不会接受上一题的评分回调', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    controller.configure(options)
    controller.start()
    controller.stopAndEvaluate()
    const oldCallbacks = [...clock.queued]
    const next = { ...options, target: { ...options.target, id: 'apple', text: 'apple' } }
    controller.configure(next)
    controller.start()
    for (const callback of oldCallbacks) callback()
    assert.equal(controller.getSnapshot().stage, 'recording')
    assert.equal(controller.getSnapshot().elapsed, 0)
    controller.stopAndEvaluate()
    clock.finishPending()
    assert.equal(controller.getSnapshot().result?.words[0]?.text, 'apple')
    controller.configure({ ...next, target: { ...next.target, text: 'pear' } })
    assert.equal(controller.getSnapshot().stage, 'idle')
})

test('暂停保留阶段但停止计时与评分；恢复不会补算暂停期间时间', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    let paused = false
    const config = { ...options, isPaused: (): boolean => paused }
    controller.configure(config)
    controller.start()
    clock.tick()
    paused = true
    controller.pause()
    controller.configure({ ...config, blocked: true })
    for (const callback of clock.queued) callback()
    controller.stopAndEvaluate()
    assert.equal(controller.getSnapshot().stage, 'recording')
    assert.equal(controller.getSnapshot().elapsed, 1)
    paused = false
    controller.configure(config)
    clock.tick()
    assert.equal(controller.getSnapshot().elapsed, 2)
    controller.stopAndEvaluate()
    controller.configure({ ...config, blocked: true })
    clock.finishPending()
    assert.equal(controller.getSnapshot().stage, 'evaluating')
    controller.configure(config)
    clock.finishPending()
    assert.equal(controller.getSnapshot().stage, 'result')
})

test('重录立即结束模拟回放，旧回放回调不会干扰新录音', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    controller.configure(options)
    controller.start()
    controller.stopAndEvaluate()
    clock.finishPending()
    controller.replay()
    assert.equal(controller.getSnapshot().playing, true)
    const oldCallbacks = [...clock.queued]
    controller.rerecord()
    for (const callback of oldCallbacks) callback()
    assert.equal(controller.getSnapshot().stage, 'recording')
    assert.equal(controller.getSnapshot().playing, false)
    assert.equal(controller.getSnapshot().result, null)
    assert.equal(clock.intervals.size, 1)
    controller.pause()
    assert.equal(clock.intervals.size + clock.timeouts.size, 0)
})

test('重渲染更新回调不重启当前任务；模拟回放结束后可再次播放', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    controller.configure(options)
    controller.start()
    controller.stopAndEvaluate()
    const task = [...clock.timeouts.keys()]
    let completed = 0
    controller.configure({
        ...options,
        onFeedback: (kind): void => {
            if (kind === 'evaluationComplete') completed += 1
        },
    })
    assert.deepEqual([...clock.timeouts.keys()], task)
    clock.finishPending()
    assert.equal(completed, 1)
    controller.replay()
    clock.finishPending()
    assert.equal(controller.getSnapshot().playing, false)
    controller.replay()
    assert.equal(controller.getSnapshot().playing, true)
    controller.configure({ ...options, blocked: true })
    assert.equal(controller.getSnapshot().playing, false)
    assert.equal(clock.timeouts.size, 0)
})

test('分数、时长展示限制范围，模拟结果沿当前词句生成且保持固定样例', (): void => {
    assert.equal(normalizeOralAssessmentScore(40.87), 40.8)
    assert.equal(normalizeOralAssessmentScore(101), 100)
    assert.equal(normalizeOralAssessmentScore(-1), 0)
    assert.equal(normalizeOralAssessmentScore(NaN), 0)
    assert.equal(formatOralAssessmentTime(65.9), '01:05')
    assert.equal(formatOralAssessmentTime(-1), '00:00')
    assert.equal(formatOralAssessmentTime(Infinity), '00:00')
    const result = createOralAssessmentSample({ ...options.target, text: 'I like apples.' })
    assert.deepEqual(
        result.words.map((word) => word.text),
        ['I', 'like', 'apples.'],
    )
    assert.deepEqual(
        [result.score, result.accuracy, result.fluency, result.completeness],
        [40, 30, 40, 50],
    )
})
