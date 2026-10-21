import assert from 'node:assert/strict'
import test from 'node:test'
import type { SoundAudio } from '../../../shared/lib/sound-player'
import {
    createPracticeFeedbackSoundController,
    getPracticeFeedbackAnimation,
    getPracticeFeedbackSoundSelection,
} from './practice-feedback'
import type { PracticeFeedbackPreferences, PracticeFeedbackSoundAssets } from './practice-feedback'

const values: PracticeFeedbackPreferences = {
    typingSound: true,
    typingTone: '原键（默认）',
    typingVolume: 60,
    correctSound: true,
    correctTone: '清音（默认）',
    correctVolume: 70,
    errorSound: true,
    errorTone: '顿响',
    errorVolume: 30,
    completionSound: true,
    completionTone: '落幕（默认）',
    completionVolume: 80,
    transitionSound: true,
    evaluationSound: true,
    correctEffect: true,
    correctEffectType: '🎊',
    completionEffect: true,
}

class AudioStub implements SoundAudio {
    src = ''
    volume = 1
    currentTime = 0
    preload = ''
    pauseCount = 0
    loadCount = 0
    playCount = 0
    playResult: Promise<void> = Promise.resolve()
    listeners = new Map<'ended' | 'error', Set<() => void>>()

    play(): Promise<void> {
        this.playCount += 1
        return this.playResult
    }

    pause(): void {
        this.pauseCount += 1
    }

    load(): void {
        this.loadCount += 1
    }

    removeAttribute(name: string): void {
        if (name === 'src') this.src = ''
    }

    addEventListener(type: 'ended' | 'error', listener: () => void): void {
        const group = this.listeners.get(type) ?? new Set<() => void>()
        group.add(listener)
        this.listeners.set(type, group)
    }

    removeEventListener(type: 'ended' | 'error', listener: () => void): void {
        this.listeners.get(type)?.delete(listener)
    }

    emit(type: 'ended' | 'error'): void {
        for (const listener of this.listeners.get(type) ?? []) listener()
    }

    listenerCount(): number {
        return [...this.listeners.values()].reduce((total, group) => total + group.size, 0)
    }
}

const assets: PracticeFeedbackSoundAssets = {
    'typing:原键（默认）': { src: '/fixtures/typing-original.wav' },
    'typing:轻键': { src: '/fixtures/typing-light.wav' },
    'correct:清音（默认）': { src: '/fixtures/correct-clear.wav' },
    'incorrect:顿响': { src: '/fixtures/error-thud.wav' },
    'chapterComplete:落幕（默认）': { src: '/fixtures/complete-one.wav' },
}

test('同源打字限流并复用，结果声与卡牌操作不会被打字或随后的切题截断', (): void => {
    let time = 0
    const audios: AudioStub[] = []
    const controller = createPracticeFeedbackSoundController(
        {
            ...assets,
            questionChange: { src: '/next.wav', volume: 0.4 },
            wordRemember: { src: '/remember.mp3', volume: 0.4 },
        },
        (): AudioStub => {
            const audio = new AudioStub()
            audios.push(audio)
            return audio
        },
        (): number => time,
    )
    controller.consume({ id: 1, kind: 'typing' }, values)
    time = 20
    controller.consume({ id: 2, kind: 'typing' }, values)
    assert.equal(audios.length, 1)
    assert.equal(audios[0]?.playCount, 1)
    time = 60
    controller.consume({ id: 3, kind: 'typing' }, values)
    assert.equal(audios.length, 1)
    assert.equal(audios[0]?.playCount, 2)
    controller.consume({ id: 4, kind: 'correct' }, values)
    const correct = audios[1]
    assert.ok(correct)
    controller.consume({ id: 5, kind: 'typing' }, values)
    controller.consume({ id: 6, kind: 'questionChange' }, values)
    assert.equal(audios.length, 2)
    assert.ok(correct.src)
    assert.equal(correct.pauseCount, 0)
    correct.emit('ended')
    controller.consume({ id: 7, kind: 'wordRemember' }, values)
    const remember = audios[2]
    assert.ok(remember)
    controller.consume({ id: 8, kind: 'questionChange' }, values)
    assert.equal(audios.length, 3)
    assert.equal(remember.pauseCount, 0)
    controller.updatePreferences({ ...values, transitionSound: false })
    assert.equal(remember.src, '')
    controller.dispose()
})

test('未接入素材或关闭音效时不创建音频；不同音色不回退到默认素材', (): void => {
    let created = 0
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => {
        created += 1
        return new AudioStub()
    })
    controller.consume({ id: 1, kind: 'correct' }, { ...values, correctSound: false })
    assert.equal(controller.getSnapshot().phase, 'disabled')
    controller.consume({ id: 2, kind: 'correct' }, { ...values, correctTone: '清悦' })
    assert.equal(controller.getSnapshot().phase, 'missing')
    assert.match(controller.getSnapshot().message, /素材未接入.*清悦/)
    assert.equal(created, 0)
    controller.dispose()
})

test('四类音色各用自身音量；切题和评测提示必须有已确认基准，不借用打字音量', (): void => {
    assert.equal(getPracticeFeedbackSoundSelection(values, 'typing').volume, 0.6)
    assert.equal(getPracticeFeedbackSoundSelection(values, 'correct').volume, 0.7)
    assert.equal(getPracticeFeedbackSoundSelection(values, 'incorrect').volume, 0.3)
    assert.equal(getPracticeFeedbackSoundSelection(values, 'chapterComplete').volume, 0.8)
    const audio = new AudioStub()
    const controller = createPracticeFeedbackSoundController(
        {
            questionChange: { src: '/fixtures/question.wav' },
            'evaluationComplete:GOOD': { src: '/fixtures/evaluation.wav', volume: 0.25 },
        },
        (): AudioStub => audio,
    )
    controller.consume({ id: 1, kind: 'questionChange' }, values)
    assert.equal(controller.getSnapshot().phase, 'missing')
    assert.match(controller.getSnapshot().message, /播放参数未确认/)
    assert.equal(audio.playCount, 0)
    controller.consume({ id: 2, kind: 'evaluationComplete' }, values)
    assert.equal(audio.volume, 0.25)
    assert.equal(audio.playCount, 1)
    controller.dispose()
})

test('真实播放成功后才显示播放中，结束与失败事件释放源和监听', async (): Promise<void> => {
    const audio = new AudioStub()
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => audio)
    controller.consume({ id: 1, kind: 'correct' }, values)
    assert.equal(controller.getSnapshot().phase, 'starting')
    await Promise.resolve()
    assert.equal(controller.getSnapshot().phase, 'playing')
    audio.emit('ended')
    assert.equal(controller.getSnapshot().phase, 'ended')
    assert.equal(audio.src, '')
    assert.equal(audio.listenerCount(), 0)
    controller.consume({ id: 2, kind: 'incorrect' }, values)
    audio.emit('error')
    assert.equal(controller.getSnapshot().phase, 'failed')
    await Promise.resolve()
    assert.equal(controller.getSnapshot().phase, 'failed')
    assert.equal(audio.listenerCount(), 0)
    controller.dispose()
})

test('相同或过期演示事件不重播；更换音色和音量仅影响下一事件', (): void => {
    const audios: AudioStub[] = []
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => {
        const audio = new AudioStub()
        audios.push(audio)
        return audio
    })
    controller.consume({ id: 2, kind: 'typing' }, values)
    const first = audios[0]
    assert.ok(first)
    const nextValues = { ...values, typingTone: '轻键', typingVolume: 20 }
    controller.updatePreferences(nextValues)
    controller.consume({ id: 2, kind: 'typing' }, nextValues)
    controller.consume({ id: 1, kind: 'typing' }, nextValues)
    assert.equal(audios.length, 1)
    assert.equal(first.volume, 0.6)
    assert.match(first.src, /typing-original/)
    controller.consume({ id: 3, kind: 'typing' }, nextValues)
    assert.equal(audios.length, 2)
    assert.equal(audios[1]?.volume, 0.2)
    assert.match(audios[1]?.src ?? '', /typing-light/)
    assert.equal(first.src, '')
    assert.equal(first.listenerCount(), 0)
    controller.dispose()
})

test('关闭对应开关立即停止，其他开关不影响当前音效，恢复后不补播', async (): Promise<void> => {
    const audio = new AudioStub()
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => audio)
    controller.consume({ id: 1, kind: 'correct' }, values)
    await Promise.resolve()
    controller.updatePreferences({ ...values, typingSound: false })
    assert.equal(controller.getSnapshot().phase, 'playing')
    controller.updatePreferences({ ...values, correctSound: false })
    assert.equal(controller.getSnapshot().phase, 'stopped')
    assert.equal(audio.src, '')
    controller.updatePreferences(values)
    controller.consume({ id: 1, kind: 'correct' }, values)
    assert.equal(audio.playCount, 1)
    controller.dispose()
})

test('暂停期间事件不播放，恢复不重放，切换与卸载后的旧播放结果不污染新状态', async (): Promise<void> => {
    let resolveOld: (() => void) | undefined
    const oldAudio = new AudioStub()
    oldAudio.playResult = new Promise<void>((resolve) => {
        resolveOld = resolve
    })
    const newAudio = new AudioStub()
    const queue = [oldAudio, newAudio]
    let created = 0
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => {
        const audio = queue[created]
        created += 1
        assert.ok(audio)
        return audio
    })
    controller.setActive(false)
    controller.consume({ id: 1, kind: 'correct' }, values)
    assert.equal(created, 0)
    controller.setActive(true)
    controller.consume({ id: 1, kind: 'correct' }, values)
    assert.equal(created, 0)
    controller.consume({ id: 2, kind: 'correct' }, values)
    controller.consume({ id: 3, kind: 'incorrect' }, values)
    resolveOld?.()
    await Promise.resolve()
    assert.equal(controller.getSnapshot().eventId, 3)
    assert.equal(controller.getSnapshot().phase, 'playing')
    assert.equal(oldAudio.src, '')
    controller.dispose()
    assert.equal(newAudio.src, '')
    assert.equal(newAudio.listenerCount(), 0)
    newAudio.emit('ended')
    controller.consume({ id: 4, kind: 'correct' }, values)
    assert.equal(created, 2)
})

test('播放受浏览器限制时提供手势重试提示，不报告已播放', async (): Promise<void> => {
    const audio = new AudioStub()
    const denied = new Error('gesture required')
    denied.name = 'NotAllowedError'
    audio.playResult = Promise.reject(denied)
    const controller = createPracticeFeedbackSoundController(assets, (): AudioStub => audio)
    controller.consume({ id: 1, kind: 'correct' }, values)
    await Promise.resolve()
    assert.equal(controller.getSnapshot().phase, 'blocked')
    assert.match(controller.getSnapshot().message, /再次点击/)
    assert.equal(audio.src, '')
    controller.dispose()
})

test('七种原版答对动画和完成动画独立门控，其他事件与未知类型不擅自庆祝', (): void => {
    for (const [type, expected] of [
        ['lottie-0', 'lottie-0'],
        ['lottie-1', 'lottie-1'],
        ['lottie-2', 'lottie-2'],
        ['lottie-4', 'lottie-4'],
        ['lottie-5', 'lottie-5'],
        ['lottie-6', 'lottie-6'],
        ['lottie-7', 'lottie-7'],
    ]) {
        assert.equal(
            getPracticeFeedbackAnimation(
                { ...values, correctEffectType: type ?? '' },
                { id: 1, kind: 'correct' },
            ),
            expected,
        )
    }
    assert.equal(
        getPracticeFeedbackAnimation(
            { ...values, correctEffect: false },
            { id: 2, kind: 'correct' },
        ),
        null,
    )
    assert.equal(
        getPracticeFeedbackAnimation(
            { ...values, correctEffectType: '未知' },
            { id: 3, kind: 'correct' },
        ),
        null,
    )
    assert.equal(getPracticeFeedbackAnimation(values, { id: 4, kind: 'questionChange' }), null)
    assert.equal(
        getPracticeFeedbackAnimation(values, { id: 5, kind: 'chapterComplete' }),
        'chapter-complete',
    )
    assert.equal(
        getPracticeFeedbackAnimation(
            { ...values, completionEffect: false },
            { id: 6, kind: 'chapterComplete' },
        ),
        null,
    )
})
