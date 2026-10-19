import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createPracticeMediaController,
    createPracticeMediaGroup,
    formatPracticeMediaTime,
    practiceMediaSource,
} from './media-controller'
import type { PracticeMediaElement, PracticeMediaSnapshot } from './media-controller'

class MediaStub extends EventTarget implements PracticeMediaElement {
    src = ''
    currentTime = 0
    duration = Number.NaN
    readyState = 0
    volume = 1
    playbackRate = 1
    paused = true
    error: { readonly code: number } | null = null
    playCalls = 0
    pauseCalls = 0
    loadCalls = 0
    playResult: () => Promise<void> = (): Promise<void> => Promise.resolve()

    async play(): Promise<void> {
        this.playCalls += 1
        await this.playResult()
        this.paused = false
        this.dispatchEvent(new Event('playing'))
    }

    pause(): void {
        this.pauseCalls += 1
        const wasPlaying = !this.paused
        this.paused = true
        if (wasPlaying) this.dispatchEvent(new Event('pause'))
    }

    load(): void {
        this.loadCalls += 1
    }

    removeAttribute(name: string): void {
        if (name === 'src') this.src = ''
    }
}

test('练习媒体只接收同源站内根路径，不接参考站、内联或危险地址', (): void => {
    assert.equal(
        practiceMediaSource('/_next/static/media/sample.abc.mp4'),
        '/_next/static/media/sample.abc.mp4',
    )
    assert.equal(
        practiceMediaSource('/samples/lesson.mp3?version=2#intro'),
        '/samples/lesson.mp3?version=2#intro',
    )
    for (const value of [
        undefined,
        '',
        ' /sample.mp3',
        '//remote.test/s.mp3',
        'https://remote.test/s.mp3',
        'data:audio/wav;base64,a',
        'blob:local',
        '/\\remote.test/a',
        '/%2fremote.test/a',
        '/bad/%2e%2e/sample.mp3',
        '/bad/%',
        '/bad\nsample.mp3',
    ])
        assert.equal(practiceMediaSource(value), null)
})

test('媒体时长使用秒格式化，不把未加载或无限时长显示为有效数据', (): void => {
    assert.equal(formatPracticeMediaTime(65.8), '01:05')
    assert.equal(formatPracticeMediaTime(-2), '00:00')
    assert.equal(formatPracticeMediaTime(Number.NaN), '00:00')
    assert.equal(formatPracticeMediaTime(Number.POSITIVE_INFINITY), '00:00')
})

test('缺少或不允许的音源不会自动播放，也不伪装加载成功', async (): Promise<void> => {
    const element = new MediaStub()
    const controller = createPracticeMediaController(
        element,
        (): void => {},
        createPracticeMediaGroup(),
    )
    controller.setSource(undefined)
    await controller.play()
    assert.equal(element.playCalls, 0)
    assert.equal(controller.snapshot().status, 'unavailable')
    controller.setSource('https://www.waxueshe.com/example.mp3')
    await controller.play()
    assert.equal(element.playCalls, 0)
    assert.equal(element.src, '')
    assert.match(controller.snapshot().error ?? '', /本地媒体/)
    controller.dispose()
})

test('只有真实媒体事件可进入播放中，元数据和进度由元素读取', async (): Promise<void> => {
    const element = new MediaStub()
    const updates: PracticeMediaSnapshot[] = []
    const controller = createPracticeMediaController(
        element,
        (value): void => {
            updates.push(value)
        },
        createPracticeMediaGroup(),
    )
    controller.setSource('/samples/audio.mp3')
    assert.equal(controller.snapshot().status, 'loading')
    assert.equal(element.playCalls, 0)
    element.duration = 22
    element.dispatchEvent(new Event('loadedmetadata'))
    assert.equal(controller.snapshot().status, 'loading')
    element.readyState = 3
    element.dispatchEvent(new Event('canplay'))
    assert.equal(controller.snapshot().status, 'ready')
    const pending = controller.play()
    assert.notEqual(controller.snapshot().status, 'playing')
    assert.equal(controller.snapshot().playRequested, true)
    await pending
    assert.equal(controller.snapshot().status, 'playing')
    element.currentTime = 7.5
    element.dispatchEvent(new Event('timeupdate'))
    assert.equal(controller.snapshot().position, 7.5)
    assert.equal(controller.snapshot().duration, 22)
    assert.ok(updates.some((value) => value.status === 'playing'))
    controller.dispose()
})

test('暂停保留播放位置，停止重置；倍速、音量及定位使用真实元素值', async (): Promise<void> => {
    const element = new MediaStub()
    const controller = createPracticeMediaController(
        element,
        (): void => {},
        createPracticeMediaGroup(),
    )
    controller.setSource('/samples/audio.mp3')
    element.duration = 30
    element.dispatchEvent(new Event('loadedmetadata'))
    await controller.play()
    element.currentTime = 8
    controller.pause()
    assert.equal(controller.snapshot().status, 'paused')
    assert.equal(controller.snapshot().position, 8)
    controller.setVolume(0.35)
    controller.setRate(1.5)
    assert.equal(element.volume, 0.35)
    assert.equal(controller.snapshot().volume, 0.35)
    assert.equal(element.playbackRate, 1.5)
    controller.seek(55)
    assert.equal(element.currentTime, 30)
    controller.seek(-5)
    assert.equal(element.currentTime, 0)
    controller.setVolume(9)
    assert.equal(element.volume, 1)
    controller.setRate(9)
    assert.equal(element.playbackRate, 2)
    element.currentTime = 15
    controller.stop()
    assert.equal(element.currentTime, 0)
    assert.equal(controller.snapshot().playRequested, false)
    controller.dispose()
})

test('浏览器拒绝播放时保留手势重试，不标播放成功或推进题目', async (): Promise<void> => {
    const element = new MediaStub()
    const error = new Error('blocked')
    error.name = 'NotAllowedError'
    element.playResult = (): Promise<void> => Promise.reject(error)
    const controller = createPracticeMediaController(
        element,
        (): void => {},
        createPracticeMediaGroup(),
    )
    controller.setSource('/samples/audio.mp3')
    await controller.play()
    assert.equal(controller.snapshot().status, 'error')
    assert.match(controller.snapshot().error ?? '', /点击播放重试/)
    assert.equal(controller.snapshot().playRequested, false)
    element.playResult = (): Promise<void> => Promise.resolve()
    await controller.play()
    assert.equal(controller.snapshot().status, 'playing')
    assert.equal(controller.snapshot().error, null)
    controller.dispose()
})

test('格式和网络失败分别给出反馈，结束事件更新为真实结束态', async (): Promise<void> => {
    const element = new MediaStub()
    const controller = createPracticeMediaController(
        element,
        (): void => {},
        createPracticeMediaGroup(),
    )
    controller.setSource('/samples/video.mp4')
    element.error = { code: 2 }
    element.dispatchEvent(new Event('error'))
    assert.match(controller.snapshot().error ?? '', /加载失败/)
    element.error = { code: 3 }
    element.dispatchEvent(new Event('error'))
    assert.match(controller.snapshot().error ?? '', /解码失败/)
    element.error = null
    await controller.play()
    element.currentTime = 30
    element.dispatchEvent(new Event('ended'))
    assert.equal(controller.snapshot().status, 'ended')
    assert.equal(controller.snapshot().position, 30)
    assert.equal(controller.snapshot().playRequested, false)
    controller.dispose()
})

test('开始另一项内容媒体时停止旧媒体并复位，统一停止可取消所有成员', async (): Promise<void> => {
    const group = createPracticeMediaGroup()
    const audio = new MediaStub()
    const video = new MediaStub()
    const first = createPracticeMediaController(audio, (): void => {}, group)
    const second = createPracticeMediaController(video, (): void => {}, group)
    first.setSource('/samples/audio.mp3')
    second.setSource('/samples/video.mp4')
    await first.play()
    audio.currentTime = 9
    await second.play()
    assert.equal(audio.paused, true)
    assert.equal(audio.currentTime, 0)
    assert.equal(first.snapshot().playRequested, false)
    assert.equal(second.snapshot().status, 'playing')
    group.stopAll()
    assert.equal(video.paused, true)
    assert.equal(second.snapshot().playRequested, false)
    first.dispose()
    second.dispose()
})

test('待完成的play在暂停、换源或卸载后不能重新发声或回写播放中', async (): Promise<void> => {
    for (const cancellation of ['stop', 'source', 'dispose']) {
        const element = new MediaStub()
        let finish = (): void => {}
        const mediaPending = new Promise<void>((resolve) => {
            finish = resolve
        })
        element.playResult = (): Promise<void> => mediaPending
        const updates: PracticeMediaSnapshot[] = []
        const controller = createPracticeMediaController(
            element,
            (value): void => {
                updates.push(value)
            },
            createPracticeMediaGroup(),
        )
        controller.setSource('/samples/old.mp3')
        const pending = controller.play()
        if (cancellation === 'dispose') controller.dispose()
        else if (cancellation === 'source') controller.setSource('/samples/new.mp3')
        else controller.stop()
        finish()
        await pending
        assert.equal(element.paused, true)
        assert.equal(
            updates.some((value) => value.status === 'playing'),
            false,
        )
        controller.dispose()
    }
})

test('卸载移除监听与src，迟到事件不回写状态，重复清理可安全执行', (): void => {
    const element = new MediaStub()
    let writes = 0
    const controller = createPracticeMediaController(
        element,
        (): void => {
            writes += 1
        },
        createPracticeMediaGroup(),
    )
    controller.setSource('/samples/audio.mp3')
    controller.dispose()
    const afterDispose = writes
    element.currentTime = 10
    element.dispatchEvent(new Event('timeupdate'))
    element.dispatchEvent(new Event('canplay'))
    controller.dispose()
    assert.equal(writes, afterDispose)
    assert.equal(element.src, '')
    assert.equal(element.paused, true)
})
