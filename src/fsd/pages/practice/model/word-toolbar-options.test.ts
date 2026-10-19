import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createWordToolbarOptions,
    getWordToolbarReference,
    isWordToolbarMode,
    wordToolbarRows,
    type WordToolbarMode,
} from './word-toolbar-options'

const modes: readonly WordToolbarMode[] = [
    'pronounce',
    'spell',
    'dictate',
    'meaning',
    'typing',
    'oral',
]

test('单词工具栏只接受已确认的六种小模式', (): void => {
    for (const mode of modes) assert.equal(isWordToolbarMode(mode), true)
    for (const value of [
        '',
        'word',
        'listen',
        'read',
        'translate',
        'Pronounce',
        'oral ',
        'toString',
    ])
        assert.equal(isWordToolbarMode(value), false)
})

test('六种单词模式按截图提供初次进入时的设置状态', (): void => {
    const pronounce = createWordToolbarOptions('pronounce')
    assert.equal(pronounce.cutReading, true)
    assert.equal(pronounce.order, 'random')
    assert.equal(pronounce.language, 'bilingual')
    assert.equal(pronounce.phonetics, 'original')

    const spell = createWordToolbarOptions('spell')
    assert.equal(spell.copy, false)
    assert.equal(spell.translationVisible, true)
    assert.equal(spell.cutReading, true)
    assert.equal(spell.phonetics, 'syllables')

    const dictate = createWordToolbarOptions('dictate')
    assert.equal(dictate.copy, true)
    assert.equal(dictate.cutReading, false)
    assert.equal(dictate.translationVisible, true)
    assert.equal(dictate.imageVisible, true)
    assert.equal(dictate.phoneticsVisible, false)

    const meaning = createWordToolbarOptions('meaning')
    assert.equal(meaning.cutReading, true)
    assert.equal(meaning.imageVisible, true)
    assert.equal(meaning.phoneticsVisible, true)

    const typing = createWordToolbarOptions('typing')
    assert.equal(typing.imageVisible, true)
    assert.equal(typing.copy, true)
    assert.equal(typing.cutReading, true)

    const oral = createWordToolbarOptions('oral')
    assert.equal(oral.imageVisible, true)
    assert.equal(oral.translationVisible, true)
    assert.equal(oral.cutReading, true)
})

test('每次进入都创建独立设置，当前模式的更改不污染重进或其他模式', (): void => {
    for (const mode of modes) {
        const current = createWordToolbarOptions(mode)
        const original = createWordToolbarOptions(mode)
        assert.notEqual(current, original)
        current.cutReading = !current.cutReading
        current.translationVisible = false
        current.imageVisible = false
        current.phoneticsVisible = !current.phoneticsVisible
        current.copy = !current.copy
        current.order = 'alphabetical'
        current.language = 'translate'
        current.phonetics = 'none'
        assert.deepEqual(createWordToolbarOptions(mode), original)
    }
    assert.equal(createWordToolbarOptions('spell').copy, false)
    assert.equal(createWordToolbarOptions('dictate').copy, true)
    assert.equal(createWordToolbarOptions('meaning').cutReading, true)
})

test('各模式浮层只展示已确认的设置项并保留原稿排列顺序', (): void => {
    assert.deepEqual(wordToolbarRows, {
        pronounce: ['cutReading'],
        spell: ['copy', 'translationVisible', 'cutReading'],
        dictate: ['copy', 'cutReading', 'translationVisible', 'imageVisible', 'phoneticsVisible'],
        meaning: ['cutReading', 'imageVisible', 'phoneticsVisible'],
        typing: ['imageVisible', 'copy', 'cutReading'],
        oral: ['imageVisible', 'translationVisible', 'cutReading'],
    })
})

test('单词工具栏保留拼读与其余五种模式各自的设计定位和紧凑控件几何', (): void => {
    for (const mode of modes)
        assert.deepEqual(getWordToolbarReference(mode), {
            left: mode === 'pronounce' ? 12 : 16,
            top: mode === 'pronounce' ? 96 : 95,
            timerWidth: 84,
            timerHeight: 26,
            settingsSize: 26,
            gap: 12,
            popoverWidth: 64,
            rowHeight: 24,
        })
})
