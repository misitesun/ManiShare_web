import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createSentenceToolbarOptions,
    getSentenceToolbarTranslationOverride,
    isSentenceToolbarMode,
    sentenceToolbarRows,
    type SentenceToolbarMode,
} from './sentence-toolbar-options'

const modes: readonly SentenceToolbarMode[] = [
    'listen',
    'read',
    'translate',
    'check',
    'typing',
    'oral',
    'blocks',
]

test('句子工具栏只接受已确认的七种模式', (): void => {
    for (const mode of modes) assert.equal(isSentenceToolbarMode(mode), true)
    for (const value of [
        '',
        'sentence',
        'pronounce',
        'spell',
        'dictate',
        'meaning',
        'guess',
        'Listen',
        'read ',
        'toString',
    ])
        assert.equal(isSentenceToolbarMode(value), false)
})

test('句子模式按截图初始化完整拆分、抄写和显示开关', (): void => {
    assert.equal(createSentenceToolbarOptions('listen').split, false)
    for (const mode of ['translate', 'check', 'typing', 'oral', 'blocks'] as const)
        assert.equal(createSentenceToolbarOptions(mode).split, true)
    for (const mode of ['translate', 'typing'] as const)
        assert.equal(createSentenceToolbarOptions(mode).copy, true)
    for (const mode of ['listen', 'read', 'check', 'oral', 'blocks'] as const)
        assert.equal(createSentenceToolbarOptions(mode).copy, false)
    for (const mode of modes) {
        const options = createSentenceToolbarOptions(mode)
        assert.equal(options.imageVisible, true)
        assert.equal(options.translationVisible, true)
        assert.equal(options.cutReading, true)
    }
})

test('每次创建的句子设置互相独立，当前修改不污染重进或其他模式', (): void => {
    for (const mode of modes) {
        const current = createSentenceToolbarOptions(mode)
        const original = createSentenceToolbarOptions(mode)
        assert.notEqual(current, original)
        current.split = !current.split
        current.copy = !current.copy
        current.imageVisible = false
        current.translationVisible = false
        current.cutReading = false
        assert.deepEqual(createSentenceToolbarOptions(mode), original)
    }
    assert.equal(createSentenceToolbarOptions('listen').split, false)
    assert.equal(createSentenceToolbarOptions('translate').split, true)
    assert.equal(createSentenceToolbarOptions('translate').copy, true)
    assert.equal(createSentenceToolbarOptions('oral').copy, false)
})

test('句子浮层保留各模式截图中的设置项与顺序，阅读没有设置行', (): void => {
    assert.deepEqual(sentenceToolbarRows, {
        listen: ['split', 'imageVisible', 'cutReading'],
        read: [],
        translate: ['split', 'copy', 'imageVisible', 'translationVisible', 'cutReading'],
        check: ['split', 'imageVisible', 'cutReading'],
        typing: ['split', 'copy', 'imageVisible', 'cutReading'],
        oral: ['split', 'imageVisible', 'translationVisible', 'cutReading'],
        blocks: ['split', 'imageVisible', 'translationVisible', 'cutReading'],
    })
})

test('只有提供翻译控件的句子模式覆盖题面翻译显隐', (): void => {
    for (const mode of ['translate', 'oral', 'blocks'] as const)
        for (const translationVisible of [false, true])
            assert.equal(
                getSentenceToolbarTranslationOverride(mode, {
                    ...createSentenceToolbarOptions(mode),
                    translationVisible,
                }),
                translationVisible,
            )
    for (const mode of ['listen', 'read', 'check', 'typing'] as const)
        for (const translationVisible of [false, true])
            assert.equal(
                getSentenceToolbarTranslationOverride(mode, {
                    ...createSentenceToolbarOptions(mode),
                    translationVisible,
                }),
                undefined,
            )
})
