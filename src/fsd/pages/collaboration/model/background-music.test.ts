import assert from 'node:assert/strict'
import test from 'node:test'
import {
    backgroundMusicPromptMessage,
    createBackgroundMusicController,
    initialBackgroundMusicSnapshot,
} from './background-music'
import type { BackgroundMusicPlayer } from './background-music'

type MusicEvent = 'playing' | 'pause' | 'ended' | 'error'

class Player implements BackgroundMusicPlayer {
    private source = ''
    readonly sources: string[] = []
    readonly events = new Map<MusicEvent, Set<() => void>>()
    preload = ''
    playCalls = 0
    pauseCalls = 0
    loadCalls = 0
    result: () => Promise<void> = () => Promise.resolve()
    get src(): string {
        return this.source
    }
    set src(value: string) {
        this.source = value
        this.sources.push(value)
    }
    play(): Promise<void> {
        this.playCalls += 1
        return this.result()
    }
    pause(): void {
        this.pauseCalls += 1
        this.emit('pause')
    }
    load(): void {
        this.loadCalls += 1
    }
    removeAttribute(name: string): void {
        if (name === 'src') this.source = ''
    }
    addEventListener(event: MusicEvent, listener: () => void): void {
        const callbacks = this.events.get(event) ?? new Set<() => void>()
        callbacks.add(listener)
        this.events.set(event, callbacks)
    }
    removeEventListener(event: MusicEvent, listener: () => void): void {
        this.events.get(event)?.delete(listener)
    }
    emit(event: MusicEvent): void {
        this.events.get(event)?.forEach((listener) => listener())
    }
}

interface Deferred {
    readonly promise: Promise<void>
    resolve(): void
    reject(error: unknown): void
}
function deferred(): Deferred {
    let resolve: () => void = (): void => {
        throw new Error('Uninitialized deferred')
    }
    let reject: (error: unknown) => void = (): void => {
        throw new Error('Uninitialized deferred')
    }
    const promise = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

test('无素材不创建播放器、不请求空地址，确认显示未配置，取消后可手动重开', async (): Promise<void> => {
    let factoryCalls = 0
    const controller = createBackgroundMusicController([' ', ''], () => {
        factoryCalls += 1
        return new Player()
    })
    assert.deepEqual(controller.getSnapshot(), initialBackgroundMusicSnapshot)
    await controller.start()
    assert.equal(controller.getSnapshot().phase, 'empty')
    assert.equal(controller.getSnapshot().promptOpen, true)
    assert.match(backgroundMusicPromptMessage(controller.getSnapshot()), /暂未配置/)
    await controller.confirm()
    assert.equal(controller.getSnapshot().phase, 'error')
    assert.match(backgroundMusicPromptMessage(controller.getSnapshot()), /无法播放/)
    controller.dismiss()
    await controller.start()
    assert.equal(controller.getSnapshot().promptOpen, false)
    controller.openPrompt()
    assert.equal(controller.getSnapshot().promptOpen, true)
    assert.equal(factoryCalls, 0)
    controller.dispose()
})

test('播放成功才进入播放态，暂停和恢复复用同一个播放器且不重置曲目', async (): Promise<void> => {
    const player = new Player()
    const pending = deferred()
    player.result = (): Promise<void> => pending.promise
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    const started = controller.start()
    assert.equal(player.playCalls, 1)
    assert.equal(controller.getSnapshot().phase, 'starting')
    await controller.confirm()
    assert.equal(player.playCalls, 1, '未完成播放时不重复提交')
    pending.resolve()
    await started
    assert.equal(controller.getSnapshot().phase, 'playing')
    assert.equal(controller.getSnapshot().promptOpen, false)
    controller.pause()
    assert.equal(controller.getSnapshot().phase, 'paused')
    player.result = (): Promise<void> => Promise.resolve()
    const resumed = controller.confirm()
    assert.equal(player.playCalls, 2, '确认同步调用 play，保留用户手势调用栈')
    await resumed
    assert.equal(controller.getSnapshot().phase, 'playing')
    assert.deepEqual(player.sources, ['one.mp3'])
    controller.dispose()
})

test('自动播放被拦截时显示确认浮层，用户确认成功后关闭', async (): Promise<void> => {
    const player = new Player()
    player.result = (): Promise<void> => Promise.reject({ name: 'NotAllowedError' })
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    await controller.start()
    assert.equal(controller.getSnapshot().issue, 'blocked')
    assert.equal(controller.getSnapshot().promptOpen, true)
    assert.match(backgroundMusicPromptMessage(controller.getSnapshot()), /浏览器/)
    player.result = (): Promise<void> => Promise.resolve()
    await controller.confirm()
    assert.equal(controller.getSnapshot().phase, 'playing')
    assert.equal(controller.getSnapshot().promptOpen, false)
    controller.dispose()
})

test('加载失败明确提示重试，不误报成权限限制或播放成功', async (): Promise<void> => {
    const player = new Player()
    player.result = (): Promise<void> => Promise.reject(new Error('Network failure'))
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    await controller.start()
    assert.equal(controller.getSnapshot().phase, 'error')
    assert.equal(controller.getSnapshot().issue, 'failed')
    assert.match(backgroundMusicPromptMessage(controller.getSnapshot()), /失败/)
    player.result = (): Promise<void> => Promise.resolve()
    await controller.confirm()
    assert.deepEqual(player.sources, ['one.mp3', 'one.mp3'], '资源错误重试重新加载当前曲目')
    assert.equal(controller.getSnapshot().phase, 'playing')
    controller.dispose()
})

test('取消未完成播放后，迟到的成功及 playing 事件不能让音乐继续播放', async (): Promise<void> => {
    const player = new Player()
    const pending = deferred()
    player.result = (): Promise<void> => pending.promise
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    const started = controller.start()
    controller.dismiss()
    player.emit('playing')
    pending.resolve()
    await started
    assert.equal(controller.getSnapshot().phase, 'paused')
    assert.equal(controller.getSnapshot().promptOpen, false)
    assert.ok(player.pauseCalls >= 2)
    player.emit('error')
    assert.equal(controller.getSnapshot().promptOpen, false, '取消后错误不能再次自动弹出')
    controller.dispose()
})

test('取消后的旧请求成功不能暂停已经开始的新请求', async (): Promise<void> => {
    const player = new Player()
    const first = deferred()
    const second = deferred()
    player.result = (): Promise<void> => first.promise
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    const started = controller.start()
    controller.dismiss()
    player.result = (): Promise<void> => second.promise
    const resumed = controller.confirm()
    const pauses = player.pauseCalls
    first.resolve()
    await started
    assert.equal(player.pauseCalls, pauses)
    assert.equal(controller.getSnapshot().phase, 'starting')
    second.resolve()
    await resumed
    assert.equal(controller.getSnapshot().phase, 'playing')
    controller.dispose()
})

test('离页释放播放器与全部监听，迟到的播放结果不更新状态或出声', async (): Promise<void> => {
    const player = new Player()
    const pending = deferred()
    player.result = (): Promise<void> => pending.promise
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    let updates = 0
    const unsubscribe = controller.subscribe(() => {
        updates += 1
    })
    const started = controller.start()
    controller.dispose()
    const before = updates
    pending.resolve()
    await started
    player.emit('error')
    assert.equal(updates, before)
    assert.equal(player.src, '')
    assert.equal(player.loadCalls, 1)
    assert.ok(Array.from(player.events.values()).every((listeners) => listeners.size === 0))
    assert.ok(player.pauseCalls >= 2)
    unsubscribe()
})

test('顺序循环全部曲目并复用播放器，单曲结束也从头播放', async (): Promise<void> => {
    const player = new Player()
    let factoryCalls = 0
    const controller = createBackgroundMusicController(['one.mp3', 'two.mp3'], () => {
        factoryCalls += 1
        return player
    })
    await controller.start()
    player.emit('ended')
    await Promise.resolve()
    assert.equal(controller.getSnapshot().trackIndex, 1)
    player.emit('ended')
    await Promise.resolve()
    assert.equal(controller.getSnapshot().trackIndex, 0)
    assert.deepEqual(player.sources, ['one.mp3', 'two.mp3', 'one.mp3'])
    assert.equal(factoryCalls, 1)
    controller.dispose()
    const singlePlayer = new Player()
    const single = createBackgroundMusicController(['one.mp3'], () => singlePlayer)
    await single.start()
    singlePlayer.emit('ended')
    await Promise.resolve()
    assert.equal(singlePlayer.playCalls, 2)
    assert.equal(single.getSnapshot().phase, 'playing')
    single.dispose()
})

test('原生暂停事件同步状态，释放后重新挂载可以重新尝试自动播放', async (): Promise<void> => {
    const player = new Player()
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    await controller.start()
    player.emit('pause')
    assert.equal(controller.getSnapshot().phase, 'paused')
    controller.dispose()
    await controller.start()
    assert.equal(controller.getSnapshot().phase, 'playing')
    assert.equal(player.playCalls, 2)
    controller.dispose()
})

test('原生加载错误结束等待，迟到的 play 完成不覆盖错误状态', async (): Promise<void> => {
    const player = new Player()
    const pending = deferred()
    player.result = (): Promise<void> => pending.promise
    const controller = createBackgroundMusicController(['one.mp3'], () => player)
    const started = controller.start()
    player.emit('error')
    assert.equal(controller.getSnapshot().phase, 'error')
    pending.resolve()
    await started
    assert.equal(controller.getSnapshot().phase, 'error')
    assert.equal(controller.getSnapshot().promptOpen, true)
    controller.dispose()
})
