import assert from 'node:assert/strict'
import test from 'node:test'
import { createOralAssessmentDemo } from './oral-assessment-demo'
import type {
    OralAssessmentDemoClock,
    OralAssessmentDemoOptions,
    OralAssessmentPlayback,
} from './oral-assessment-demo'
import {
    createOralAssessmentSample,
    formatOralAssessmentTime,
    getOralAssessmentScorePresentation,
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

test('注入真实回放时只由媒体事件更新playing，不使用录音时长定时结束；等待中再次点击可撤销', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    let plays = 0
    let stops = 0
    const playback: OralAssessmentPlayback = {
        status: 'idle',
        play: (): boolean => {
            plays += 1
            return true
        },
        stop: (): void => {
            stops += 1
        },
    }
    const config: OralAssessmentDemoOptions = { ...options, playback }
    controller.configure(config)
    controller.start()
    controller.stopAndEvaluate()
    clock.finishPending()
    controller.replay()
    assert.equal(plays, 1)
    assert.equal(controller.getSnapshot().playing, false)
    controller.configure({ ...config, playback: { ...playback, status: 'pending' } })
    assert.equal(controller.getSnapshot().playing, false)
    assert.equal(clock.timeouts.size, 0)
    controller.configure({ ...config, playback: { ...playback, status: 'playing' } })
    assert.equal(controller.getSnapshot().playing, true)
    clock.finishPending()
    assert.equal(controller.getSnapshot().playing, true)
    controller.configure({ ...config, playback: { ...playback, status: 'stopped' } })
    assert.equal(controller.getSnapshot().playing, false)
    controller.replay()
    controller.configure({ ...config, playback: { ...playback, status: 'pending' } })
    controller.replay()
    assert.equal(plays, 2)
    assert.equal(stops, 1)
    assert.equal(controller.getSnapshot().playing, false)
})

test('回放失败／缺源不启动假动画，暂停、重录与切题取消播放及迟到状态', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    let stops = 0
    let available = false
    const playback: OralAssessmentPlayback = {
        status: 'idle',
        play: (): boolean => available,
        stop: (): void => {
            stops += 1
        },
    }
    const config: OralAssessmentDemoOptions = { ...options, playback }
    function complete(): void {
        controller.start()
        controller.stopAndEvaluate()
        clock.finishPending()
    }
    controller.configure(config)
    complete()
    controller.replay()
    assert.equal(controller.getSnapshot().playing, false)
    available = true
    controller.replay()
    controller.configure({ ...config, playback: { ...playback, status: 'error' } })
    assert.equal(controller.getSnapshot().playing, false)
    controller.replay()
    controller.configure({ ...config, playback: { ...playback, status: 'playing' } })
    controller.pause()
    controller.configure({ ...config, playback: { ...playback, status: 'playing' } })
    assert.equal(controller.getSnapshot().playing, false)
    controller.configure(config)
    controller.replay()
    controller.rerecord()
    assert.equal(controller.getSnapshot().stage, 'recording')
    assert.equal(controller.getSnapshot().playing, false)
    controller.stopAndEvaluate()
    clock.finishPending()
    controller.configure(config)
    controller.replay()
    controller.configure({ ...config, target: { ...options.target, id: 'next' } })
    controller.configure({
        ...config,
        target: { ...options.target, id: 'next' },
        playback: { ...playback, status: 'playing' },
    })
    assert.equal(controller.getSnapshot().stage, 'idle')
    assert.equal(controller.getSnapshot().playing, false)
    assert.ok(stops >= 3)
})

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

test('四档在60、80、90边界连续分组，显示文案与提示音等级共用同一规则', (): void => {
    for (const [score, tone, label, rating] of [
        [0, 'low', 'KEEP TRYING', 'KEEP TRYING'],
        [60, 'low', 'KEEP TRYING', 'KEEP TRYING'],
        [60.1, 'good', 'GOOD EFFORT', 'GOOD'],
        [80, 'good', 'GOOD EFFORT', 'GOOD'],
        [80.1, 'excellent', 'GREAT WORK', 'EXCELLENT'],
        [90, 'excellent', 'GREAT WORK', 'EXCELLENT'],
        [90.1, 'perfect', 'PERFECT', 'PERFECT'],
        [100, 'perfect', 'PERFECT', 'PERFECT'],
        [Infinity, 'low', 'KEEP TRYING', 'KEEP TRYING'],
        [-1, 'low', 'KEEP TRYING', 'KEEP TRYING'],
        [101, 'perfect', 'PERFECT', 'PERFECT'],
    ] as const) {
        const presentation = getOralAssessmentScorePresentation(score)
        assert.deepEqual(
            [presentation.tone, presentation.label, presentation.rating],
            [tone, label, rating],
        )
        const sample = createOralAssessmentSample(options.target, score)
        assert.equal(sample.rating, rating)
        assert.equal(sample.description, presentation.description)
    }
})

test('固定样例序列按完成轮次循环，重新配置不重置，切题清除旧评分与样例位置', (): void => {
    const clock = new FakeClock()
    const controller = createOralAssessmentDemo(clock)
    const ratings: string[] = []
    const config: OralAssessmentDemoOptions = {
        ...options,
        sampleScores: [40, 70, 85, 96],
        onFeedback: (kind, rating): void => {
            if (kind === 'evaluationComplete' && rating) ratings.push(rating)
        },
    }
    controller.configure(config)
    for (const score of [40, 70, 85, 96, 40]) {
        if (controller.getSnapshot().stage === 'idle') controller.start()
        else controller.rerecord()
        controller.stopAndEvaluate()
        controller.configure({ ...config })
        clock.finishPending()
        assert.equal(controller.getSnapshot().result?.score, score)
    }
    assert.deepEqual(ratings, ['KEEP TRYING', 'GOOD', 'EXCELLENT', 'PERFECT', 'KEEP TRYING'])
    controller.rerecord()
    controller.stopAndEvaluate()
    const oldCallbacks = [...clock.queued]
    controller.configure({ ...config, target: { ...options.target, id: 'next' } })
    for (const callback of oldCallbacks) callback()
    assert.equal(controller.getSnapshot().stage, 'idle')
    controller.start()
    controller.stopAndEvaluate()
    clock.finishPending()
    assert.equal(controller.getSnapshot().result?.score, 40)
})
