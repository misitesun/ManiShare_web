import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createPracticeMediaGroup } from './media-controller'
import type { PracticeMediaElement } from './media-controller'
import type { PracticeCutReadingInput } from './practice-cut-reading'
import {
    createPracticeReadingMemory,
    createPracticeReadingRuntime,
    schedulePracticeReadingUpdate,
} from './practice-reading-runtime'
import type { PracticeReadingSnapshot } from './practice-reading-runtime'
import { usePracticeReading } from './usePracticeReading'

class ReadingElement extends EventTarget implements PracticeMediaElement {
    src = ''
    currentTime = 0
    duration = 12
    readyState = 2
    volume = 1
    playbackRate = 1
    paused = true
    error: { readonly code: number } | null = null
    playCalls = 0
    loadCalls = 0
    listeners = 0
    result: () => Promise<void> = (): Promise<void> => Promise.resolve()

    override addEventListener(type: string, listener: EventListener): void {
        this.listeners += 1
        super.addEventListener(type, listener)
    }

    override removeEventListener(type: string, listener: EventListener): void {
        this.listeners -= 1
        super.removeEventListener(type, listener)
    }

    async play(): Promise<void> {
        assert.ok(this.src.startsWith('/'), '播放前必须已经绑定有效音源')
        this.playCalls += 1
        await this.result()
        this.paused = false
        this.dispatchEvent(new Event('playing'))
    }

    pause(): void {
        const playing = !this.paused
        this.paused = true
        if (playing) this.dispatchEvent(new Event('pause'))
    }

    load(): void {
        this.loadCalls += 1
    }

    removeAttribute(name: string): void {
        if (name === 'src') this.src = ''
    }
}

const initial: PracticeCutReadingInput = {
    family: 'word',
    mode: 'pronounce',
    visitKey: 'visit-1',
    source: '/samples/reading.mp3',
    enabled: true,
    ready: true,
    blocked: false,
}

function fixture(initialize?: (element: ReadingElement, index: number) => void): {
    readonly elements: ReadingElement[]
    readonly writes: PracticeReadingSnapshot[]
    readonly runtime: ReturnType<typeof createPracticeReadingRuntime>
} {
    const elements: ReadingElement[] = []
    const writes: PracticeReadingSnapshot[] = []
    const runtime = createPracticeReadingRuntime(
        (): ReadingElement => {
            const element = new ReadingElement()
            initialize?.(element, elements.length)
            elements.push(element)
            return element
        },
        (snapshot): void => {
            writes.push(snapshot)
        },
        createPracticeReadingMemory(),
        createPracticeMediaGroup(),
    )
    return { elements, writes, runtime }
}

async function settled(): Promise<void> {
    await Promise.resolve()
    await Promise.resolve()
}

test('缺失或外部音源不创建 Audio，不加载或请求播放，SSR 初始快照确定', (): void => {
    const { runtime, elements } = fixture()
    for (const source of ['', 'https://example.test/audio.mp3', '//example.test/a', '/bad/%']) {
        runtime.update({ ...initial, source })
        assert.equal(runtime.togglePlayback(), false)
    }
    assert.equal(elements.length, 0)
    assert.equal(runtime.snapshot().status, 'unavailable')
    runtime.dispose()
    function Probe(): ReactElement {
        const reading = usePracticeReading(initial)
        return createElement('span', null, `${reading.status}:${reading.playRequested}`)
    }
    assert.equal(renderToString(createElement(Probe)), '<span>unavailable:false</span>')
})

test('首次有效 source 到达且 ready 后绑定再自动播放，普通更新不重建或重复播放', async (): Promise<void> => {
    const { runtime, elements } = fixture()
    runtime.update({ ...initial, source: '' })
    runtime.update({ ...initial, ready: false })
    assert.equal(elements.length, 0)
    runtime.update(initial)
    await settled()
    for (let count = 0; count < 8; count += 1) runtime.update({ ...initial })
    assert.equal(elements.length, 1)
    assert.equal(elements[0]?.playCalls, 1)
    assert.equal(elements[0]?.loadCalls, 1)
    assert.equal(runtime.snapshot().status, 'playing')
    runtime.dispose()
})

test('自动请求被浏览器拒绝后不自动重试，允许用户手动重试', async (): Promise<void> => {
    const elements: ReadingElement[] = []
    const runtime = createPracticeReadingRuntime(
        (): ReadingElement => {
            const element = new ReadingElement()
            const error = new Error('gesture required')
            error.name = 'NotAllowedError'
            element.result = (): Promise<void> => Promise.reject(error)
            elements.push(element)
            return element
        },
        (): void => {},
    )
    runtime.update(initial)
    await settled()
    assert.equal(runtime.snapshot().status, 'error')
    assert.match(runtime.snapshot().error ?? '', /点击播放重试/)
    runtime.update({ ...initial })
    assert.equal(elements[0]?.playCalls, 1)
    const element = elements[0]
    assert.ok(element)
    element.result = (): Promise<void> => Promise.resolve()
    assert.equal(runtime.togglePlayback(), true)
    await settled()
    assert.equal(element.playCalls, 2)
    assert.equal(runtime.snapshot().status, 'playing')
    runtime.dispose()
})

test('关切读停止已发自动播放，再开启不重复；无切读也能手动播放或暂停', async (): Promise<void> => {
    const { runtime, elements } = fixture()
    runtime.update(initial)
    await settled()
    runtime.update({ ...initial, enabled: false })
    assert.equal(elements[0]?.paused, true)
    runtime.update(initial)
    assert.equal(elements[0]?.playCalls, 1)
    runtime.update({ ...initial, enabled: false })
    assert.equal(runtime.togglePlayback(), true)
    await settled()
    assert.equal(elements[0]?.playCalls, 2)
    assert.equal(runtime.togglePlayback(), true)
    assert.equal(runtime.snapshot().status, 'paused')
    runtime.dispose()
})

test('blocked 与文档隐藏停止播放，解除后不自动恢复，当前访问仍可手动重试', async (): Promise<void> => {
    for (const reason of ['blocked', 'hidden']) {
        const { runtime, elements } = fixture()
        runtime.update(initial)
        await settled()
        if (reason === 'blocked') runtime.update({ ...initial, blocked: true })
        else runtime.setHidden(true)
        assert.equal(elements[0]?.paused, true)
        assert.equal(runtime.snapshot().playRequested, false)
        assert.equal(runtime.togglePlayback(), true)
        assert.equal(elements[0]?.playCalls, 1)
        if (reason === 'blocked') runtime.update(initial)
        else runtime.setHidden(false)
        assert.equal(elements[0]?.playCalls, 1)
        runtime.togglePlayback()
        await settled()
        assert.equal(elements[0]?.playCalls, 2)
        runtime.dispose()
    }
})

test('换题换源销毁旧元素，旧 play 的迟到完成不能回写新题或重新发声', async (): Promise<void> => {
    let finish = (): void => {}
    const { runtime, elements, writes } = fixture((element, index): void => {
        if (index === 0)
            element.result = (): Promise<void> =>
                new Promise<void>((resolve): void => {
                    finish = resolve
                })
    })
    runtime.update(initial)
    const first = elements[0]
    assert.ok(first)
    runtime.update({ ...initial, visitKey: 'visit-2', source: '/samples/next.mp3' })
    await settled()
    assert.equal(elements.length, 2)
    assert.equal(first.listeners, 0)
    assert.equal(first.src, '')
    const count = writes.length
    finish()
    await settled()
    assert.equal(first.paused, true)
    assert.equal(writes.length, count)
    assert.equal(runtime.snapshot().status, 'playing')
    runtime.dispose()
})

test('相同音源的新访问可以再自动朗读，复用元素且低频快照忽略 timeupdate', async (): Promise<void> => {
    const { runtime, elements, writes } = fixture()
    runtime.update(initial)
    await settled()
    const element = elements[0]
    assert.ok(element)
    const count = writes.length
    for (let position = 1; position < 20; position += 1) {
        element.currentTime = position
        element.dispatchEvent(new Event('timeupdate'))
    }
    assert.equal(writes.length, count)
    runtime.update({ ...initial, visitKey: 'visit-2' })
    await settled()
    assert.equal(elements.length, 1)
    assert.equal(element.playCalls, 2)
    assert.equal(element.currentTime, 0)
    runtime.dispose()
    const afterDispose = writes.length
    element.dispatchEvent(new Event('playing'))
    assert.equal(element.listeners, 0)
    assert.equal(writes.length, afterDispose)
})

test('Strict setup-cleanup-setup 取消未提交更新，仅实际第二轮绑定并消耗一次自动播放', async (): Promise<void> => {
    const memory = createPracticeReadingMemory()
    const elements: ReadingElement[] = []
    function createRuntime(): ReturnType<typeof createPracticeReadingRuntime> {
        return createPracticeReadingRuntime(
            (): ReadingElement => {
                const element = new ReadingElement()
                elements.push(element)
                return element
            },
            (): void => {},
            memory,
            createPracticeMediaGroup(),
        )
    }
    const first = createRuntime()
    const cancel = schedulePracticeReadingUpdate(first, initial)
    cancel()
    first.dispose()
    assert.equal(memory.state.consumed, false)
    const second = createRuntime()
    schedulePracticeReadingUpdate(second, initial)
    await settled()
    assert.equal(elements.length, 1)
    assert.equal(elements[0]?.playCalls, 1)
    assert.equal(memory.state.consumed, true)
    assert.equal(second.snapshot().status, 'playing')
    second.dispose()
})

test('暂停、hidden、blocked、卸载均取消待完成 play，迟到完成不得重新进入 playing', async (): Promise<void> => {
    for (const reason of ['pause', 'hidden', 'blocked', 'dispose']) {
        let finish = (): void => {}
        const { runtime, elements, writes } = fixture((element): void => {
            element.result = (): Promise<void> =>
                new Promise<void>((resolve): void => {
                    finish = resolve
                })
        })
        runtime.update(initial)
        const element = elements[0]
        assert.ok(element)
        assert.equal(runtime.snapshot().playRequested, true)
        if (reason === 'pause') runtime.pause()
        else if (reason === 'hidden') runtime.setHidden(true)
        else if (reason === 'blocked') runtime.update({ ...initial, blocked: true })
        else runtime.dispose()
        const count = writes.length
        finish()
        await settled()
        assert.equal(element.paused, true, reason)
        assert.equal(
            writes.slice(count).some((snapshot) => snapshot.status === 'playing'),
            false,
            reason,
        )
        runtime.dispose()
    }
})

test('有有效 source 但切读关闭或模式无白名单时不创建或预加载，手动点击才绑定', async (): Promise<void> => {
    for (const input of [
        { ...initial, enabled: false },
        { ...initial, family: 'word' as const, mode: 'read' as const },
    ]) {
        const { runtime, elements } = fixture()
        runtime.update(input)
        runtime.update({ ...input })
        assert.equal(elements.length, 0)
        assert.equal(runtime.snapshot().status, 'unavailable')
        assert.equal(runtime.togglePlayback(), true)
        await settled()
        assert.equal(elements.length, 1)
        assert.equal(elements[0]?.loadCalls, 1)
        assert.equal(elements[0]?.playCalls, 1)
        runtime.dispose()
    }
})

test('尚未提交的旧题更新可取消，新题只绑定自己的 source 并消费自己的访问资格', async (): Promise<void> => {
    const { runtime, elements } = fixture()
    const cancel = schedulePracticeReadingUpdate(runtime, initial)
    cancel()
    schedulePracticeReadingUpdate(runtime, {
        ...initial,
        visitKey: 'visit-2',
        source: '/samples/second.mp3',
    })
    await settled()
    assert.equal(elements.length, 1)
    assert.equal(elements[0]?.src, '/samples/second.mp3')
    assert.equal(elements[0]?.playCalls, 1)
    runtime.dispose()
})

test('同访问换成另一有效或无效 source 时清理旧媒体并归为非播放态，不自动创建新媒体', async (): Promise<void> => {
    for (const source of ['/samples/replacement.mp3', 'https://example.test/external.mp3', '']) {
        const { runtime, elements } = fixture()
        runtime.update(initial)
        await settled()
        assert.equal(runtime.snapshot().status, 'playing')
        const old = elements[0]
        assert.ok(old)
        runtime.update({ ...initial, source })
        assert.equal(old.src, '')
        assert.equal(old.paused, true)
        assert.equal(old.listeners, 0)
        assert.equal(elements.length, 1, '同访问已消费自动尝试，换源不重新构造或预加载')
        assert.equal(runtime.snapshot().status, 'unavailable')
        assert.equal(runtime.snapshot().playRequested, false)
        runtime.dispose()
    }
})
