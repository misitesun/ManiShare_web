import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createSentenceListeningPlaybackOptions,
    resolveSentenceListeningEnd,
    resolveSentenceListeningNavigation,
    toggleSentenceListeningPlayback,
} from './sentence-listening-playback'

test('章节循环与自动下节互斥，盲听不改变播放策略', (): void => {
    const initial = createSentenceListeningPlaybackOptions()
    const loop = toggleSentenceListeningPlayback(initial, 'chapterLoop')
    const next = toggleSentenceListeningPlayback(loop, 'autoNextChapter')
    assert.equal(next.chapterLoop, false)
    assert.equal(next.autoNextChapter, true)
    const again = toggleSentenceListeningPlayback(next, 'chapterLoop')
    assert.equal(again.chapterLoop, true)
    assert.equal(again.autoNextChapter, false)
    assert.deepEqual(toggleSentenceListeningPlayback(again, 'blind'), { ...again, blind: true })
    assert.deepEqual(initial, createSentenceListeningPlaybackOptions())
})

test('未开启自动切题时，循环与自动下节都不消费播放结束', (): void => {
    for (const key of ['chapterLoop', 'autoNextChapter'] as const) {
        const options = toggleSentenceListeningPlayback(
            createSentenceListeningPlaybackOptions(),
            key,
        )
        assert.equal(
            resolveSentenceListeningEnd({
                options,
                index: 9,
                total: 10,
                nextChapterAvailable: true,
            }),
            'none',
        )
    }
})

test('仅自动播放结束选择下一题、首题循环、下节或原完成流程', (): void => {
    const options = { ...createSentenceListeningPlaybackOptions(), autoAdvance: true }
    const end = { options, index: 9, total: 10, nextChapterAvailable: true }
    assert.equal(resolveSentenceListeningEnd({ ...end, index: 8 }), 'next')
    assert.equal(resolveSentenceListeningEnd(end), 'finish')
    assert.equal(resolveSentenceListeningEnd({ ...end, total: 0 }), 'none')
    assert.equal(
        resolveSentenceListeningEnd({ ...end, options: { ...options, chapterLoop: true } }),
        'repeat',
    )
    const next = { ...end, options: { ...options, autoNextChapter: true } }
    assert.equal(resolveSentenceListeningEnd(next), 'next-chapter')
    assert.equal(resolveSentenceListeningEnd({ ...next, nextChapterAvailable: false }), 'finish')
})

test('自动播放期间手动切题只退出自动切题，保留原盲听及章末选择', (): void => {
    for (const chapterOption of ['chapterLoop', 'autoNextChapter'] as const) {
        const options = {
            ...createSentenceListeningPlaybackOptions(),
            autoAdvance: true,
            blind: true,
            [chapterOption]: true,
        }
        const manual = resolveSentenceListeningNavigation(options, 'manual')
        assert.equal(manual.interruptAutoAdvance, true)
        assert.deepEqual(manual.options, { ...options, autoAdvance: false })
        assert.equal(options.autoAdvance, true, '不修改传入的上一轮选项')
        assert.equal(
            resolveSentenceListeningEnd({
                options: manual.options,
                index: 0,
                total: 10,
                nextChapterAvailable: true,
            }),
            'none',
        )
    }
})

test('正常自动推进保留自动播放，原手动模式继续沿切读偏好工作', (): void => {
    const options = { ...createSentenceListeningPlaybackOptions(), autoAdvance: true }
    const automatic = resolveSentenceListeningNavigation(options, 'automatic')
    assert.equal(automatic.interruptAutoAdvance, false)
    assert.deepEqual(automatic.options, options)
    assert.equal(
        resolveSentenceListeningEnd({
            options: automatic.options,
            index: 1,
            total: 10,
            nextChapterAvailable: true,
        }),
        'next',
    )
    const manualOptions = { ...options, autoAdvance: false }
    const manual = resolveSentenceListeningNavigation(manualOptions, 'manual')
    assert.equal(manual.interruptAutoAdvance, false)
    assert.deepEqual(manual.options, manualOptions)
})
