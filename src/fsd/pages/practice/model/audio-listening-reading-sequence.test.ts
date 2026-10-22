import assert from 'node:assert/strict'
import test from 'node:test'
import type { SoundAudio } from '../../../shared/lib/sound-player'
import { createAudioListeningReadingSequence } from './audio-listening-reading-sequence'
import { createPracticeFeedbackSoundController } from './practice-feedback'
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

class TransitionAudio implements SoundAudio {
    src = ''
    volume = 1
    currentTime = 0
    preload = ''
    playCalls = 0
    pauses = 0
    loadCalls = 0
    failure: Error | null = null
    listeners = new Map<'ended' | 'error', Set<() => void>>()

    play(): Promise<void> {
        this.playCalls += 1
        return this.failure === null ? Promise.resolve() : Promise.reject(this.failure)
    }

    pause(): void {
        this.pauses += 1
    }

    load(): void {
        this.loadCalls += 1
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
}

interface SequenceFixture {
    readonly sequence: ReturnType<typeof createAudioListeningReadingSequence>
    readonly controller: ReturnType<typeof createPracticeFeedbackSoundController>
    readonly audios: TransitionAudio[]
}

function fixture(assets?: PracticeFeedbackSoundAssets, failure?: Error): SequenceFixture {
    const audios: TransitionAudio[] = []
    const controller = createPracticeFeedbackSoundController(
        assets ?? { questionChange: { src: '/fixtures/transition.wav', volume: 0.4 } },
        (): TransitionAudio => {
            const audio = new TransitionAudio()
            audio.failure = failure ?? null
            audios.push(audio)
            return audio
        },
    )
    return { controller, audios, sequence: createAudioListeningReadingSequence() }
}

async function settled(): Promise<void> {
    await Promise.resolve()
    await Promise.resolve()
}

test('切题音效真实结束前保持等待，结束后只释放一次；SSR快照固定', async (): Promise<void> => {
    const { sequence, controller, audios } = fixture()
    let releases = 0
    const unsubscribe = sequence.subscribe((): void => {
        if (sequence.getSnapshot() === 'ready') releases += 1
    })
    sequence.start(controller, { id: 1, kind: 'questionChange' }, values)
    assert.equal(sequence.getSnapshot(), 'waiting')
    assert.equal(sequence.getServerSnapshot(), 'ready')
    await settled()
    assert.equal(sequence.getSnapshot(), 'waiting', 'play Promise完成不等于音效播完')
    const sound = audios[0]
    assert.ok(sound)
    assert.equal(sound.playCalls, 1)
    sound.emit('ended')
    assert.equal(sequence.getSnapshot(), 'ready')
    sound.emit('ended')
    assert.equal(releases, 1)
    unsubscribe()
    controller.dispose()
})

test('关闭切题音效或未挂载音效宿主时直接释放，不创建音频', (): void => {
    const { sequence, controller, audios } = fixture()
    sequence.start(
        controller,
        { id: 1, kind: 'questionChange' },
        { ...values, transitionSound: false },
    )
    assert.equal(sequence.getSnapshot(), 'ready')
    assert.equal(audios.length, 0)
    sequence.start(null, { id: 2, kind: 'questionChange' }, values)
    assert.equal(sequence.getSnapshot(), 'ready')
    controller.dispose()
})

test('连续切题只等待最新音效，旧题迟到结束不能提前释放', async (): Promise<void> => {
    const { sequence, controller, audios } = fixture()
    sequence.start(controller, { id: 1, kind: 'questionChange' }, values)
    const old = audios[0]
    assert.ok(old)
    const lateEnd = [...(old.listeners.get('ended') ?? [])][0]
    assert.ok(lateEnd)
    sequence.start(controller, { id: 2, kind: 'questionChange' }, values)
    lateEnd()
    await settled()
    assert.equal(sequence.getSnapshot(), 'waiting')
    assert.equal(old.src, '')
    const latest = audios[1]
    assert.ok(latest)
    latest.emit('ended')
    assert.equal(sequence.getSnapshot(), 'ready')
    controller.dispose()
})

test('暂停、隐藏或阻断停止音效后保持取消，显式继续才解除', (): void => {
    for (const cancellation of ['controller-stop', 'sequence-cancel'] as const) {
        const { sequence, controller, audios } = fixture()
        sequence.start(controller, { id: 1, kind: 'questionChange' }, values)
        const sound = audios[0]
        assert.ok(sound)
        const lateEnd = [...(sound.listeners.get('ended') ?? [])][0]
        assert.ok(lateEnd)
        if (cancellation === 'controller-stop') controller.stop()
        else sequence.cancel()
        assert.equal(sequence.getSnapshot(), 'cancelled')
        lateEnd()
        assert.equal(sequence.getSnapshot(), 'cancelled')
        sequence.reset()
        assert.equal(sequence.getSnapshot(), 'ready')
        controller.dispose()
    }
})

test('显式朗读停止未完成的提示音并立即释放，关闭音效后的连续切题也不残留声音', (): void => {
    const { sequence, controller, audios } = fixture()
    sequence.start(controller, { id: 1, kind: 'questionChange' }, values)
    const first = audios[0]
    assert.ok(first)
    sequence.reset()
    assert.equal(first.src, '')
    assert.equal(sequence.getSnapshot(), 'ready')
    sequence.start(controller, { id: 2, kind: 'questionChange' }, values)
    sequence.start(
        controller,
        { id: 3, kind: 'questionChange' },
        { ...values, transitionSound: false },
    )
    assert.equal(sequence.getSnapshot(), 'ready')
    assert.equal(audios[1]?.src, '')
    assert.equal(audios.length, 2)
    controller.dispose()
})

test('缺失、播放失败或被浏览器拒绝的音效不阻塞后续切读', async (): Promise<void> => {
    const blocked = new Error('blocked')
    blocked.name = 'NotAllowedError'
    for (const setup of [
        fixture({}),
        fixture(undefined, new Error('failed')),
        fixture(undefined, blocked),
    ]) {
        setup.sequence.start(setup.controller, { id: 1, kind: 'questionChange' }, values)
        await settled()
        assert.equal(setup.sequence.getSnapshot(), 'ready')
        setup.controller.dispose()
    }
})
