import assert from 'node:assert/strict'
import test from 'node:test'
import { createSoundPlayer } from './sound-player'
import type { SoundAudio, SoundPlaybackPhase } from './sound-player'

class AudioStub implements SoundAudio {
    src = ''
    volume = 1
    currentTime = 0
    preload = ''
    plays = 0
    result: Promise<void> = Promise.resolve()
    readonly listeners = new Map<string, Set<() => void>>()
    play(): Promise<void> {
        this.plays += 1
        return this.result
    }
    pause(): void {}
    load(): void {}
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

test('短音效按操作创建，同源打字复用并回到开头，停止释放源及监听', async (): Promise<void> => {
    const audio = new AudioStub()
    let created = 0
    const player = createSoundPlayer((): SoundAudio => {
        created += 1
        return audio
    }, true)
    const phases: SoundPlaybackPhase[] = []
    const request = {
        src: '/type.mp3',
        volume: 0.4,
        onPhase: (phase: SoundPlaybackPhase): void => {
            phases.push(phase)
        },
    }
    assert.equal(created, 0)
    player.play(request)
    assert.deepEqual(phases, ['starting'])
    await Promise.resolve()
    assert.equal(phases.at(-1), 'playing')
    audio.currentTime = 0.2
    player.play(request)
    assert.equal(created, 1)
    assert.equal(audio.currentTime, 0)
    assert.equal(audio.plays, 2)
    audio.emit('ended')
    assert.equal(player.isActive(), false)
    assert.equal(audio.src, '/type.mp3')
    player.stop()
    assert.equal(audio.src, '')
    assert.ok([...audio.listeners.values()].every((group) => group.size === 0))
    player.dispose()
})

test('换声和卸载隔离迟到结果，拒播明确报告blocked且释放源', async (): Promise<void> => {
    let resolveOld: (() => void) | undefined
    const first = new AudioStub()
    first.result = new Promise<void>((resolve): void => {
        resolveOld = resolve
    })
    const second = new AudioStub()
    const rejected = new Error('gesture')
    rejected.name = 'NotAllowedError'
    second.result = Promise.reject(rejected)
    const queue = [first, second]
    const player = createSoundPlayer((): SoundAudio => {
        const audio = queue.shift()
        assert.ok(audio)
        return audio
    })
    const phases: string[] = []
    player.play({
        src: '/one.mp3',
        volume: 1,
        onPhase: (phase): void => {
            phases.push(`one:${phase}`)
        },
    })
    player.play({
        src: '/two.mp3',
        volume: 0.5,
        onPhase: (phase): void => {
            phases.push(`two:${phase}`)
        },
    })
    resolveOld?.()
    await Promise.resolve()
    assert.deepEqual(phases, ['one:starting', 'two:starting', 'two:blocked'])
    assert.equal(first.src, '')
    assert.equal(second.src, '')
    player.dispose()
    player.play({
        src: '/three.mp3',
        volume: 1,
        onPhase: (): never => assert.fail('卸载后不得播放'),
    })
})
