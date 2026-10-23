import assert from 'node:assert/strict'
import test from 'node:test'
import { createPracticeMediaController, createPracticeMediaGroup } from './media-controller'
import type { PracticeMediaElement } from './media-controller'
import { getDemoQuestions } from './practice-demo'
import type { PracticeQuestion } from './practice-demo'
import { createPhoneticsReadingRuntime } from './phonetics-reading-runtime'
import type {
    PhoneticsReadingInput,
    PhoneticsReadingMemory,
    PhoneticsReadingSnapshot,
} from './phonetics-reading-runtime'
import type { PracticeReadingPlaybackScheduler } from './practice-reading-runtime'

class PhoneticsElement extends EventTarget implements PracticeMediaElement {
    src = ''
    currentTime = 0
    duration = 1
    readyState = 2
    volume = 1
    playbackRate = 1
    paused = true
    ended = false
    error: { readonly code: number } | null = null
    rejection: Error | null = null
    async play(): Promise<void> {
        if (this.rejection) throw this.rejection
        this.paused = false
        this.ended = false
        this.dispatchEvent(new Event('playing'))
    }
    pause(): void {
        const wasPlaying = !this.paused
        this.paused = true
        if (wasPlaying) this.dispatchEvent(new Event('pause'))
    }
    finish(): void {
        this.paused = true
        this.ended = true
        this.dispatchEvent(new Event('pause'))
        this.dispatchEvent(new Event('ended'))
    }
    load(): void {}
    removeAttribute(name: string): void {
        if (name === 'src') this.src = ''
    }
}

function word(name = 'ham'): PracticeQuestion {
    const question = getDemoQuestions('phonetics').find((item) => item.english === name)
    assert.ok(question)
    return question
}

function input(overrides: Partial<PhoneticsReadingInput> = {}): PhoneticsReadingInput {
    return {
        question: word(),
        visitKey: 'ham:0',
        naturalPhonics: true,
        enabled: true,
        ready: true,
        blocked: false,
        ...overrides,
    }
}

function fixture(
    options: {
        readonly memory?: PhoneticsReadingMemory
        readonly schedulePlayback?: PracticeReadingPlaybackScheduler
        readonly reject?: boolean
    } = {},
): {
    readonly runtime: ReturnType<typeof createPhoneticsReadingRuntime>
    readonly elements: PhoneticsElement[]
    readonly gaps: { readonly callback: () => void; cancelled: boolean }[]
    readonly writes: PhoneticsReadingSnapshot[]
    readonly group: ReturnType<typeof createPracticeMediaGroup>
} {
    const elements: PhoneticsElement[] = []
    const gaps: { readonly callback: () => void; cancelled: boolean }[] = []
    const writes: PhoneticsReadingSnapshot[] = []
    const group = createPracticeMediaGroup()
    const runtime = createPhoneticsReadingRuntime({
        createElement: (): PhoneticsElement => {
            const element = new PhoneticsElement()
            if (options.reject) element.rejection = new DOMException('需要点击', 'NotAllowedError')
            elements.push(element)
            return element
        },
        onChange: (snapshot): void => {
            writes.push(snapshot)
        },
        memory: options.memory ?? { attemptedVisit: null },
        group,
        ...(options.schedulePlayback ? { schedulePlayback: options.schedulePlayback } : {}),
        scheduleGap: (callback): (() => void) => {
            const gap = { callback, cancelled: false }
            gaps.push(gap)
            return (): void => {
                gap.cancelled = true
            }
        },
    })
    return { runtime, elements, gaps, writes, group }
}

function latest(elements: PhoneticsElement[]): PhoneticsElement {
    const element = elements.at(-1)
    assert.ok(element)
    return element
}

test('自然拼读真实播完才推进：目标、整词、逐个音素、末次整词；不自动换题', async (): Promise<void> => {
    const f = fixture()
    f.runtime.update(input())
    assert.equal(f.writes.at(-1)?.surface, 'word')
    const sources = [latest(f.elements).src]
    await Promise.resolve()
    assert.equal(f.elements.length, 1, 'play Promise完成不代表朗读结束')
    for (let at = 0; at < 5; at += 1) {
        latest(f.elements).finish()
        assert.equal(f.elements.length, at + 1)
        assert.equal(f.writes.at(-1)?.status, 'waiting')
        assert.equal(f.writes.at(-1)?.surface, 'word')
        f.gaps.at(-1)?.callback()
        assert.equal(f.writes.at(-1)?.surface, 'word')
        sources.push(latest(f.elements).src)
    }
    assert.deepEqual(
        sources.map((source) => source.split('/').at(-1)),
        ['ae.wav', 'ham.wav', 'h.wav', 'ae.wav', 'm.wav', 'ham.wav'],
    )
    latest(f.elements).finish()
    assert.equal(f.writes.at(-1)?.status, 'ended')
    assert.equal(f.writes.at(-1)?.playRequested, false)
    assert.equal(f.writes.at(-1)?.surface, null)
    f.runtime.update(input())
    assert.equal(f.elements.length, 6)
    f.runtime.dispose()
})

test('关闭自然拼读只播放两段；目标按钮打断完整序列后仅播放目标音', (): void => {
    const f = fixture()
    f.runtime.update(input({ naturalPhonics: false }))
    latest(f.elements).finish()
    f.gaps.at(-1)?.callback()
    assert.ok(latest(f.elements).src.endsWith('/ham.wav'))
    latest(f.elements).finish()
    assert.equal(f.gaps.length, 1)
    f.runtime.toggle()
    const old = latest(f.elements)
    f.runtime.playTarget()
    const target = latest(f.elements)
    assert.notEqual(old, target)
    old.finish()
    target.finish()
    assert.equal(f.writes.at(-1)?.status, 'ended')
    assert.equal(f.gaps.length, 1)
    f.runtime.dispose()
})

test('显示位置由播放入口决定：自动在2，目标按钮在1，词图重播和新访问回到2', (): void => {
    const f = fixture()
    f.runtime.update(input())
    const automatic = latest(f.elements)
    assert.equal(f.writes.at(-1)?.step?.kind, 'target-phonetic')
    assert.equal(f.writes.at(-1)?.surface, 'word')
    f.runtime.playTarget()
    const target = latest(f.elements)
    assert.equal(f.writes.at(-1)?.surface, 'target')
    automatic.finish()
    assert.equal(f.writes.at(-1)?.surface, 'target', '旧音段不能抢回显示位置')
    target.finish()
    assert.equal(f.writes.at(-1)?.surface, null)
    f.runtime.toggle()
    assert.equal(f.writes.at(-1)?.surface, 'word')
    f.runtime.toggle()
    assert.equal(f.writes.at(-1)?.surface, null)
    f.runtime.playTarget()
    assert.equal(f.writes.at(-1)?.surface, 'target')
    f.runtime.update(input({ question: word('cat'), visitKey: 'cat:1' }))
    assert.equal(f.writes.at(-1)?.surface, 'word')
    f.runtime.dispose()
})

test('等待提示音期间点击目标按钮立即选择位置1，取消的旧等待不切回位置2', (): void => {
    const callbacks: ((allowed: boolean) => void)[] = []
    const f = fixture({
        schedulePlayback: (complete): (() => void) => {
            callbacks.push(complete)
            return (): void => {}
        },
    })
    f.runtime.update(input())
    assert.equal(f.writes.at(-1)?.surface, 'word')
    assert.equal(f.writes.at(-1)?.status, 'waiting')
    f.runtime.playTarget()
    assert.equal(f.writes.at(-1)?.surface, 'target')
    callbacks[0]?.(true)
    assert.equal(f.elements.length, 0)
    assert.equal(f.writes.at(-1)?.surface, 'target')
    callbacks[1]?.(true)
    assert.equal(f.elements.length, 1)
    assert.equal(f.writes.at(-1)?.surface, 'target')
    f.runtime.stop()
    assert.equal(f.writes.at(-1)?.surface, null)
    callbacks[0]?.(true)
    callbacks[1]?.(true)
    assert.equal(f.writes.at(-1)?.surface, null)
    f.runtime.dispose()
})

test('词图按钮中断自动序列，只读一次整词；再次点击重播，不恢复旧队列', (): void => {
    for (const naturalPhonics of [false, true]) {
        const f = fixture()
        f.runtime.update(input({ naturalPhonics }))
        const automatic = latest(f.elements)
        automatic.finish()
        const oldGap = f.gaps.at(-1)
        f.runtime.playWord()
        const firstWord = latest(f.elements)
        assert.equal(oldGap?.cancelled, true)
        assert.ok(firstWord.src.endsWith('/ham.wav'))
        assert.equal(f.writes.at(-1)?.step?.kind, 'word')
        assert.equal(f.writes.at(-1)?.surface, 'word')
        f.runtime.playWord()
        const replay = latest(f.elements)
        assert.notEqual(firstWord, replay)
        assert.ok(replay.src.endsWith('/ham.wav'))
        const count = f.elements.length
        automatic.finish()
        firstWord.finish()
        oldGap?.callback()
        assert.equal(f.elements.length, count)
        replay.finish()
        assert.equal(f.writes.at(-1)?.status, 'ended')
        assert.equal(f.writes.at(-1)?.surface, null)
        assert.equal(f.gaps.length, 1, '手动整词后不追加音素或新的段间队列')
        f.runtime.dispose()
    }
})

test('快速点击不同音素只播放最后所选音素，保留对应字母高亮身份，旧ended不推进', (): void => {
    const f = fixture()
    const question = word()
    const first = question.phonetics?.segments[0]
    const second = question.phonetics?.segments[1]
    assert.ok(first)
    assert.ok(second)
    f.runtime.update(input({ question }))
    f.runtime.playSegment(first.id)
    const old = latest(f.elements)
    assert.equal(old.src, first.readingSource)
    assert.equal(f.writes.at(-1)?.step?.segmentId, first.id)
    f.runtime.playSegment(second.id)
    const selected = latest(f.elements)
    assert.equal(selected.src, second.readingSource)
    assert.equal(f.writes.at(-1)?.step?.segmentId, second.id)
    assert.equal(f.writes.at(-1)?.surface, 'word')
    old.finish()
    assert.equal(f.writes.at(-1)?.step?.segmentId, second.id)
    selected.finish()
    assert.equal(f.writes.at(-1)?.status, 'ended')
    assert.equal(f.gaps.length, 0)
    const count = f.elements.length
    f.runtime.playSegment('another-question')
    assert.equal(f.writes.at(-1)?.status, 'unavailable')
    assert.equal(f.elements.length, count)
    f.runtime.dispose()
})

test('切题撤销旧间隔和旧ended，返回同词的新访问可重新播放', (): void => {
    const f = fixture()
    f.runtime.update(input())
    const old = latest(f.elements)
    old.finish()
    const gap = f.gaps.at(-1)
    f.runtime.update(input({ question: word('cat'), visitKey: 'cat:1' }))
    assert.equal(gap?.cancelled, true)
    const count = f.elements.length
    gap?.callback()
    old.finish()
    assert.equal(f.elements.length, count)
    assert.ok(latest(f.elements).src.endsWith('/ae.wav'))
    f.runtime.update(input({ visitKey: 'ham:2' }))
    assert.equal(f.elements.length, count + 1)
    f.runtime.dispose()
})

test('浮层、后台、切换自然拼读、主动停止和卸载都取消间隔，解除阻断不补播', (): void => {
    for (const reason of ['blocked', 'hidden', 'phonics', 'stop', 'dispose'] as const) {
        const f = fixture()
        f.runtime.update(input())
        latest(f.elements).finish()
        const gap = f.gaps.at(-1)
        if (reason === 'blocked') f.runtime.update(input({ blocked: true }))
        if (reason === 'hidden') f.runtime.setHidden(true)
        if (reason === 'phonics') f.runtime.update(input({ naturalPhonics: false }))
        if (reason === 'stop') f.runtime.stop()
        if (reason === 'dispose') f.runtime.dispose()
        assert.equal(gap?.cancelled, true, reason)
        gap?.callback()
        if (reason === 'blocked') f.runtime.update(input())
        if (reason === 'hidden') f.runtime.setHidden(false)
        assert.equal(f.elements.length, 1, reason)
        if (reason !== 'dispose') assert.equal(f.writes.at(-1)?.playRequested, false)
        f.runtime.dispose()
    }
})

test('自然ended后的间隔仍遵守媒体组互斥；其他媒体开始后不抢回播放', (): void => {
    const f = fixture()
    f.runtime.update(input())
    latest(f.elements).finish()
    const gap = f.gaps.at(-1)
    const other = createPracticeMediaController(new PhoneticsElement(), (): void => {}, f.group)
    other.setSource('/practice-demo/other.wav')
    void other.play()
    assert.equal(gap?.cancelled, true)
    gap?.callback()
    assert.equal(f.elements.length, 1)
    assert.equal(f.writes.at(-1)?.playRequested, false)
    other.dispose()
    f.runtime.dispose()
})

test('等待切题提示音时切题，旧回调不能解除或覆盖新访问的等待', (): void => {
    const callbacks: ((allowed: boolean) => void)[] = []
    const cancellations: number[] = []
    const f = fixture({
        schedulePlayback: (complete): (() => void) => {
            const index = callbacks.length
            callbacks.push(complete)
            return (): void => {
                cancellations.push(index)
            }
        },
    })
    f.runtime.update(input())
    f.runtime.update(input({ question: word('cat'), visitKey: 'cat:1' }))
    callbacks[0]?.(true)
    assert.equal(f.elements.length, 0)
    f.runtime.stop()
    assert.ok(cancellations.includes(1))
    callbacks[1]?.(true)
    assert.equal(f.elements.length, 0)
    f.runtime.dispose()
})

test('同访问一次自动尝试，音频被浏览器拒绝后保留提示并支持手动重试', async (): Promise<void> => {
    const f = fixture({ reject: true })
    f.runtime.update(input())
    await Promise.resolve()
    assert.equal(f.writes.at(-1)?.status, 'error')
    assert.match(f.writes.at(-1)?.error ?? '', /点击播放重试/)
    f.runtime.update(input())
    assert.equal(f.elements.length, 1)
    f.runtime.toggle()
    assert.equal(f.elements.length, 2)
    f.runtime.dispose()
    await Promise.resolve()
})

test('未就绪不消费自动播放资格；宿主重建共享访问记忆时不重复播放', (): void => {
    const memory: PhoneticsReadingMemory = { attemptedVisit: null }
    const f = fixture({ memory })
    f.runtime.update(input({ ready: false }))
    assert.equal(f.elements.length, 0)
    assert.equal(memory.attemptedVisit, null)
    f.runtime.update(input())
    f.runtime.dispose()
    const second = fixture({ memory })
    second.runtime.update(input())
    assert.equal(second.elements.length, 0)
    second.runtime.toggle()
    assert.equal(second.elements.length, 1)
    second.runtime.dispose()
})
