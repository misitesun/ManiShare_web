import assert from 'node:assert/strict'
import test from 'node:test'
import { practiceDemos } from './practice-demo'
import { getPracticeNavigationActions } from './practice-navigation'

test('五种游戏族按原顺序展示导航，开发阶段不开放暂停', (): void => {
    for (const family of ['word', 'sentence', 'audio', 'video', 'picture'] as const)
        assert.deepEqual(getPracticeNavigationActions(family), [
            'answer',
            'content',
            'mode',
            'reset',
            'report',
            'draft',
            'settings',
            'fullscreen',
        ])
})

test('独立指法和音标保留五项导航，开发阶段不开放暂停', (): void => {
    for (const family of ['typing', 'phonetics'] as const) {
        const actions = getPracticeNavigationActions(family)
        assert.deepEqual(actions, ['content', 'reset', 'draft', 'settings', 'fullscreen'])
        for (const unavailable of ['answer', 'mode', 'pause', 'report'] as const)
            assert.equal(actions.includes(unavailable), false)
    }
})

test('猜词保留答案和模式，但不误开放内容、暂停或报错', (): void => {
    const actions = getPracticeNavigationActions('guess')
    assert.deepEqual(actions, ['answer', 'mode', 'reset', 'draft', 'settings', 'fullscreen'])
    for (const unavailable of ['content', 'pause', 'report'] as const)
        assert.equal(actions.includes(unavailable), false)
})

test('四类纯阅读器只有草稿、设置与全屏，不继承游戏操作', (): void => {
    for (const family of [
        'audio-reader',
        'video-reader',
        'picture-reader',
        'text-reader',
    ] as const) {
        const actions = getPracticeNavigationActions(family)
        assert.deepEqual(actions, ['draft', 'settings', 'fullscreen'])
        for (const unavailable of [
            'answer',
            'content',
            'mode',
            'pause',
            'reset',
            'report',
        ] as const)
            assert.equal(actions.includes(unavailable), false)
    }
})

test('十二内容族全部覆盖且同族小模式共用稳定只读导航，不产生重复入口', (): void => {
    assert.deepEqual(
        new Set(practiceDemos.map((demo) => demo.family)),
        new Set([
            'word',
            'sentence',
            'audio',
            'video',
            'picture',
            'typing',
            'phonetics',
            'guess',
            'audio-reader',
            'video-reader',
            'picture-reader',
            'text-reader',
        ]),
    )
    for (const demo of practiceDemos) {
        const reference = getPracticeNavigationActions(demo.family)
        assert.equal(reference.includes('pause'), false, '全部内容族停用暂停入口')
        assert.equal(new Set(reference).size, reference.length)
        assert.equal(Object.isFrozen(reference), true)
        for (const mode of demo.modes)
            assert.equal(
                getPracticeNavigationActions(demo.family),
                reference,
                `${demo.family}:${mode}共用同族导航`,
            )
    }
})
