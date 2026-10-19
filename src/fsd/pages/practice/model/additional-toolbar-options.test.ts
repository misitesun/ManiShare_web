import assert from 'node:assert/strict'
import test from 'node:test'
import { practiceDemos } from './practice-demo'
import {
    createAdditionalToolbarOptions,
    getAdditionalToolbarRows,
    getAdditionalToolbarTranslationOverride,
    isAdditionalToolbarFamily,
} from './additional-toolbar-options'

test('其他内容族范围保留实际family，排除三个独立配置的大模式', (): void => {
    for (const demo of practiceDemos)
        assert.equal(
            isAdditionalToolbarFamily(demo.family),
            demo.family !== 'word' && demo.family !== 'sentence' && demo.family !== 'audio',
        )
})

test('视频模式没有图片选项，拼块仅在答案可见后出现拆句行', (): void => {
    assert.deepEqual(getAdditionalToolbarRows('video', 'listen'), [])
    assert.deepEqual(getAdditionalToolbarRows('video', 'check'), [
        'translationVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('video', 'translate'), [
        'copy',
        'translationVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('video', 'typing'), ['copy', 'cutReading'])
    assert.deepEqual(getAdditionalToolbarRows('video', 'oral'), [
        'translationVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('video', 'blocks'), [
        'translationVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('video', 'blocks', true), [
        'sentenceAnalysisVisible',
        'translationVisible',
        'cutReading',
    ])
    for (const mode of ['listen', 'check', 'translate', 'typing', 'oral', 'blocks'] as const)
        assert.equal(getAdditionalToolbarRows('video', mode, true).includes('imageVisible'), false)
})

test('猜词和看图仅展示各自确认的设置行', (): void => {
    assert.deepEqual(getAdditionalToolbarRows('guess', 'guess'), ['imageVisible', 'cutReading'])
    assert.deepEqual(getAdditionalToolbarRows('guess', 'read'), [])
    assert.deepEqual(getAdditionalToolbarRows('guess', 'spell'), [
        'copy',
        'imageVisible',
        'keyboardVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('picture', 'listen'), [])
    assert.deepEqual(getAdditionalToolbarRows('picture', 'translate'), [
        'copy',
        'translationVisible',
        'cutReading',
    ])
    assert.deepEqual(getAdditionalToolbarRows('picture', 'typing'), ['copy', 'cutReading'])
    assert.deepEqual(getAdditionalToolbarRows('picture', 'oral'), [
        'translationVisible',
        'cutReading',
    ])
})

test('独立指法、音标和阅读器没有设置浮层行，音标自然拼读不是浮层项', (): void => {
    for (const demo of practiceDemos) {
        if (
            !isAdditionalToolbarFamily(demo.family) ||
            ['video', 'picture', 'guess'].includes(demo.family)
        )
            continue
        for (const mode of demo.modes)
            assert.deepEqual(getAdditionalToolbarRows(demo.family, mode), [])
    }
})

test('只有具有抄写控件的模式默认抄写，显示选项默认开启且对象相互独立', (): void => {
    for (const demo of practiceDemos) {
        if (!isAdditionalToolbarFamily(demo.family)) continue
        for (const mode of demo.modes) {
            const options = createAdditionalToolbarOptions(demo.family, mode)
            assert.equal(options.copy, getAdditionalToolbarRows(demo.family, mode).includes('copy'))
            assert.equal(options.imageVisible, true)
            assert.equal(options.translationVisible, true)
            assert.equal(options.cutReading, true)
            assert.equal(options.keyboardVisible, true)
            assert.equal(options.naturalPhonics, true)
            assert.equal(options.sentenceAnalysisVisible, true)
            const original = createAdditionalToolbarOptions(demo.family, mode)
            options.imageVisible = false
            options.naturalPhonics = false
            assert.deepEqual(createAdditionalToolbarOptions(demo.family, mode), original)
        }
    }
})

test('局部翻译只覆盖提供翻译控件的附加模式', (): void => {
    for (const demo of practiceDemos) {
        if (!isAdditionalToolbarFamily(demo.family)) continue
        for (const mode of demo.modes)
            for (const translationVisible of [false, true])
                assert.equal(
                    getAdditionalToolbarTranslationOverride(demo.family, mode, {
                        ...createAdditionalToolbarOptions(demo.family, mode),
                        translationVisible,
                    }),
                    getAdditionalToolbarRows(demo.family, mode).includes('translationVisible')
                        ? translationVisible
                        : undefined,
                )
    }
})
