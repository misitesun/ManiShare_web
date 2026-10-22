import assert from 'node:assert/strict'
import test from 'node:test'
import type {
    PracticeFeedbackSoundController,
    PracticeFeedbackSoundPhase,
    PracticeFeedbackSoundSnapshot,
} from './practice-feedback'
import { waitForSentenceReadingCue } from './sentence-reading-cue'

interface CueFixture {
    readonly controller: PracticeFeedbackSoundController
    readonly publish: (phase: PracticeFeedbackSoundPhase, eventId?: number) => void
    readonly listenerCount: () => number
}

function fixture(
    soundKey: string,
    initialPhase: PracticeFeedbackSoundPhase = 'starting',
): CueFixture {
    let snapshot: PracticeFeedbackSoundSnapshot = {
        phase: initialPhase,
        eventId: 1,
        soundKey,
        message: '',
    }
    const listeners = new Set<() => void>()
    return {
        controller: {
            consume(): void {},
            setActive(): void {},
            updatePreferences(): void {},
            stop(): void {},
            dispose(): void {},
            subscribe(listener): () => void {
                listeners.add(listener)
                return (): void => {
                    listeners.delete(listener)
                }
            },
            getSnapshot(): PracticeFeedbackSoundSnapshot {
                return snapshot
            },
        },
        publish(phase, eventId = 1): void {
            snapshot = { ...snapshot, phase, eventId }
            for (const listener of listeners) listener()
        },
        listenerCount: (): number => listeners.size,
    }
}

test('中译英切题及判题提示需真实结束才放行，starting/playing不提前朗读', (): void => {
    for (const soundKey of ['questionChange', 'correct:清音（默认）', 'incorrect:顿响']) {
        const cue = fixture(soundKey)
        const results: boolean[] = []
        waitForSentenceReadingCue(
            cue.controller,
            (allowed): void => {
                results.push(allowed)
            },
            { waitForAnswerFeedback: true },
        )
        assert.deepEqual(results, [])
        cue.publish('playing')
        assert.deepEqual(results, [])
        cue.publish('ended')
        cue.publish('ended')
        assert.deepEqual(results, [true])
        assert.equal(cue.listenerCount(), 0)
    }
})

test('音效关闭、缺失、失败、拒播或无宿主时不阻断中译英朗读', (): void => {
    for (const phase of ['disabled', 'missing', 'failed', 'blocked', 'ended'] as const) {
        const cue = fixture('questionChange', phase)
        const results: boolean[] = []
        waitForSentenceReadingCue(
            cue.controller,
            (allowed): void => {
                results.push(allowed)
            },
            { waitForAnswerFeedback: true },
        )
        assert.deepEqual(results, [true])
        assert.equal(cue.listenerCount(), 0)
    }
    let allowed = false
    waitForSentenceReadingCue(
        null,
        (next): void => {
            allowed = next
        },
        { waitForAnswerFeedback: true },
    )
    assert.equal(allowed, true)
})

test('等待中的音效失败仍可朗读，停止或换事件撤销旧播放意图', (): void => {
    for (const phase of ['failed', 'blocked', 'missing', 'disabled', 'stopped'] as const) {
        const cue = fixture('incorrect:顿响')
        const results: boolean[] = []
        waitForSentenceReadingCue(
            cue.controller,
            (allowed): void => {
                results.push(allowed)
            },
            { waitForAnswerFeedback: true },
        )
        cue.publish(phase)
        assert.deepEqual(results, [phase !== 'stopped'])
        assert.equal(cue.listenerCount(), 0)
    }
    const cue = fixture('correct:清音（默认）')
    const results: boolean[] = []
    waitForSentenceReadingCue(
        cue.controller,
        (allowed): void => {
            results.push(allowed)
        },
        { waitForAnswerFeedback: true },
    )
    cue.publish('playing', 2)
    cue.publish('ended', 1)
    assert.deepEqual(results, [false])
})

test('切题、暂停或卸载清理等待后，晚到ended不能补播', (): void => {
    const cue = fixture('questionChange')
    const results: boolean[] = []
    const cancel = waitForSentenceReadingCue(
        cue.controller,
        (allowed): void => {
            results.push(allowed)
        },
        { waitForAnswerFeedback: true },
    )
    assert.equal(cue.listenerCount(), 1)
    cancel()
    cancel()
    cue.publish('ended')
    assert.deepEqual(results, [])
    assert.equal(cue.listenerCount(), 0)
})

test('听力和单词指法保留原默认策略，不等待对错或打字音效', (): void => {
    for (const soundKey of ['correct:清音（默认）', 'incorrect:顿响', 'typing:原键（默认）']) {
        const cue = fixture(soundKey)
        const results: boolean[] = []
        waitForSentenceReadingCue(cue.controller, (allowed): void => {
            results.push(allowed)
        })
        assert.deepEqual(results, [true])
        assert.equal(cue.listenerCount(), 0)
    }
})
