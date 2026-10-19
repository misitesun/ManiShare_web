import assert from 'node:assert/strict'
import test from 'node:test'
import { createAdditionalToolbarOptions } from './additional-toolbar-options'
import { createAudioToolbarOptions } from './audio-toolbar-options'
import { practiceDemos } from './practice-demo'
import {
    createPracticeCutReadingState,
    createPracticeCutReadingVisitKey,
    getPracticeCutReadingTransition,
    hasPracticeCutReadingControl,
    isPracticeCutReadingEnabled,
} from './practice-cut-reading'
import type { PracticeCutReadingInput, PracticeCutReadingVisit } from './practice-cut-reading'
import { createSentenceToolbarOptions } from './sentence-toolbar-options'
import { createWordToolbarOptions } from './word-toolbar-options'

const visit: PracticeCutReadingVisit = {
    scope: 'local:word-basic',
    family: 'word',
    mode: 'pronounce',
    questionId: 'woman',
    index: 0,
    revision: 0,
}
const input: PracticeCutReadingInput = {
    visitKey: createPracticeCutReadingVisitKey(visit),
    family: 'word',
    mode: 'pronounce',
    enabled: true,
    ready: true,
    blocked: false,
    source: '/samples/woman.mp3',
}

test('切读能力只覆盖真实有切读控件的28种模式，不继承其他模式的占位默认值', (): void => {
    const available = practiceDemos.flatMap((demo) =>
        demo.modes
            .filter((mode) => hasPracticeCutReadingControl(demo.family, mode))
            .map((mode) => `${demo.family}:${mode}`),
    )
    assert.deepEqual(available, [
        'word:pronounce',
        'word:spell',
        'word:dictate',
        'word:meaning',
        'word:typing',
        'word:oral',
        'sentence:listen',
        'sentence:check',
        'sentence:translate',
        'sentence:blocks',
        'sentence:typing',
        'sentence:oral',
        'audio:listen',
        'audio:check',
        'audio:translate',
        'audio:blocks',
        'audio:typing',
        'audio:oral',
        'video:check',
        'video:translate',
        'video:blocks',
        'video:typing',
        'video:oral',
        'picture:translate',
        'picture:typing',
        'picture:oral',
        'guess:guess',
        'guess:spell',
    ])
    assert.equal(available.length, 28)
    assert.equal(
        isPracticeCutReadingEnabled(
            'sentence',
            'read',
            createSentenceToolbarOptions('read').cutReading,
        ),
        false,
    )
    assert.equal(
        isPracticeCutReadingEnabled('audio', 'read', createAudioToolbarOptions('read').cutReading),
        false,
    )
    for (const family of [
        'typing',
        'phonetics',
        'audio-reader',
        'video-reader',
        'picture-reader',
        'text-reader',
    ] as const)
        assert.equal(
            isPracticeCutReadingEnabled(
                family,
                'read',
                createAdditionalToolbarOptions(family, 'read').cutReading,
            ),
            false,
        )
    assert.equal(isPracticeCutReadingEnabled('word', 'listen', true), false)
    assert.equal(isPracticeCutReadingEnabled('video', 'listen', true), false)
    assert.equal(isPracticeCutReadingEnabled('picture', 'listen', true), false)
    assert.equal(isPracticeCutReadingEnabled('guess', 'read', true), false)
})

test('有控件仍由局部开关决定，单词默写沿用关闭初值', (): void => {
    assert.equal(hasPracticeCutReadingControl('word', 'dictate'), true)
    assert.equal(
        isPracticeCutReadingEnabled(
            'word',
            'dictate',
            createWordToolbarOptions('dictate').cutReading,
        ),
        false,
    )
    assert.equal(isPracticeCutReadingEnabled('word', 'dictate', true), true)
    assert.equal(isPracticeCutReadingEnabled('word', 'pronounce', false), false)
})

test('访问标识包含真实上下文和重进版本，分隔符不会造成ID冲突', (): void => {
    assert.equal(createPracticeCutReadingVisitKey({ ...visit }), input.visitKey)
    for (const change of [
        { scope: 'other-chapter' },
        { family: 'sentence' as const },
        { mode: 'spell' as const },
        { questionId: 'man' },
        { index: 1 },
        { revision: 1 },
    ])
        assert.notEqual(createPracticeCutReadingVisitKey({ ...visit, ...change }), input.visitKey)
    assert.notEqual(
        createPracticeCutReadingVisitKey({ ...visit, scope: 'a:b', questionId: 'c' }),
        createPracticeCutReadingVisitKey({ ...visit, scope: 'a', questionId: 'b:c' }),
    )
})

test('一次访问仅发出一次自动播放意图，重复渲染保留同一个已消费状态', (): void => {
    const initial = createPracticeCutReadingState()
    const first = getPracticeCutReadingTransition(initial, input)
    assert.equal(first.action, 'play')
    assert.equal(first.stopPrevious, false)
    assert.equal(first.source, input.source)
    assert.equal(first.presentation, 'ready')
    assert.equal(first.state.consumed, true)
    assert.equal(first.state.requestedSource, input.source)
    assert.equal(initial.visitKey, null)
    const repeated = getPracticeCutReadingTransition(first.state, { ...input })
    assert.equal(repeated.action, 'none')
    assert.equal(repeated.stopPrevious, false)
    assert.equal(repeated.state, first.state)
})

test('首次关闭时不消费，首次开启会播放，消费后关闭重开不重播', (): void => {
    const closed = getPracticeCutReadingTransition(createPracticeCutReadingState(), {
        ...input,
        enabled: false,
    })
    assert.equal(closed.action, 'none')
    assert.equal(closed.presentation, 'hidden')
    assert.equal(closed.state.consumed, false)
    const opened = getPracticeCutReadingTransition(closed.state, input)
    assert.equal(opened.action, 'play')
    const closedAgain = getPracticeCutReadingTransition(opened.state, { ...input, enabled: false })
    assert.equal(closedAgain.action, 'stop')
    assert.equal(closedAgain.state.consumed, true)
    assert.equal(closedAgain.state.requestedSource, null)
    const reopened = getPracticeCutReadingTransition(closedAgain.state, input)
    assert.equal(reopened.action, 'none')
    assert.equal(reopened.presentation, 'ready')
    assert.equal(reopened.state.consumed, true)
})

test('偏好未就绪或暂停阻断时不消耗首次机会，真正允许时才发出播放', (): void => {
    for (const unavailable of [{ ready: false }, { blocked: true }]) {
        const waiting = getPracticeCutReadingTransition(createPracticeCutReadingState(), {
            ...input,
            ...unavailable,
        })
        assert.equal(waiting.action, 'none')
        assert.equal(waiting.presentation, 'hidden')
        assert.equal(waiting.state.consumed, false)
        assert.equal(getPracticeCutReadingTransition(waiting.state, input).action, 'play')
    }
})

test('暂停、关闭或就绪撤销会取消旧自动播放，恢复不会再次自动请求', (): void => {
    for (const interruption of [{ blocked: true }, { ready: false }, { enabled: false }]) {
        const playing = getPracticeCutReadingTransition(createPracticeCutReadingState(), input)
        const stopped = getPracticeCutReadingTransition(playing.state, {
            ...input,
            ...interruption,
        })
        assert.equal(stopped.action, 'stop')
        assert.equal(stopped.stopPrevious, true)
        assert.equal(stopped.state.consumed, true)
        const repeatedStop = getPracticeCutReadingTransition(stopped.state, {
            ...input,
            ...interruption,
        })
        assert.equal(repeatedStop.action, 'none')
        assert.equal(getPracticeCutReadingTransition(stopped.state, input).action, 'none')
    }
})

test('缺音源或地址不受支持时只有静态待接入展示，不发播放请求或消费机会', (): void => {
    for (const source of [
        undefined,
        '',
        'https://cdn.example.test/woman.mp3',
        '//cdn/x',
        '/a/../b.mp3',
    ]) {
        const pending = getPracticeCutReadingTransition(createPracticeCutReadingState(), {
            ...input,
            source,
        })
        assert.equal(pending.action, 'none')
        assert.equal(pending.source, null)
        assert.equal(pending.presentation, 'pending-source')
        assert.equal(pending.state.consumed, false)
        const same = getPracticeCutReadingTransition(pending.state, { ...input, source })
        assert.equal(same.action, 'none')
        assert.equal(same.state, pending.state)
        assert.equal(getPracticeCutReadingTransition(pending.state, input).action, 'play')
    }
})

test('消费后同题换源取消旧播放但不二次自动播放，新的合法源留给手动操作', (): void => {
    const playing = getPracticeCutReadingTransition(createPracticeCutReadingState(), input)
    const changed = getPracticeCutReadingTransition(playing.state, {
        ...input,
        source: '/samples/woman-v2.mp3',
    })
    assert.equal(changed.action, 'stop')
    assert.equal(changed.stopPrevious, true)
    assert.equal(changed.state.consumed, true)
    assert.equal(changed.state.requestedSource, null)
    assert.equal(changed.source, '/samples/woman-v2.mp3')
    assert.equal(changed.presentation, 'ready')
    assert.equal(
        getPracticeCutReadingTransition(changed.state, {
            ...input,
            source: '/samples/woman-v2.mp3',
        }).action,
        'none',
    )
})

test('消费后音源撤回保持静态待接入，重新出现不恢复自动播放', (): void => {
    const playing = getPracticeCutReadingTransition(createPracticeCutReadingState(), input)
    const removed = getPracticeCutReadingTransition(playing.state, { ...input, source: undefined })
    assert.equal(removed.action, 'stop')
    assert.equal(removed.presentation, 'pending-source')
    assert.equal(removed.state.consumed, true)
    assert.equal(getPracticeCutReadingTransition(removed.state, input).action, 'none')
})

test('切题、上一题与重新练习产生新访问，即使共用同一个音源也分别只请求一次', (): void => {
    let current = getPracticeCutReadingTransition(createPracticeCutReadingState(), input).state
    for (const nextVisit of [
        { ...visit, questionId: 'man', index: 1, revision: 1 },
        { ...visit, revision: 2 },
        { ...visit, revision: 3 },
    ]) {
        const nextInput = { ...input, visitKey: createPracticeCutReadingVisitKey(nextVisit) }
        const next = getPracticeCutReadingTransition(current, nextInput)
        assert.equal(next.action, 'play')
        assert.equal(next.stopPrevious, true)
        assert.equal(next.state.consumed, true)
        assert.equal(getPracticeCutReadingTransition(next.state, nextInput).action, 'none')
        current = next.state
    }
})

test('进入不支持或未就绪的新访问时先取消旧请求，并保留新访问未消费状态', (): void => {
    const playing = getPracticeCutReadingTransition(createPracticeCutReadingState(), input)
    const next = getPracticeCutReadingTransition(playing.state, {
        ...input,
        visitKey: 'another-entry',
        family: 'audio',
        mode: 'read',
    })
    assert.equal(next.action, 'stop')
    assert.equal(next.stopPrevious, true)
    assert.equal(next.presentation, 'hidden')
    assert.deepEqual(next.state, {
        visitKey: 'another-entry',
        consumed: false,
        requestedSource: null,
    })
})
