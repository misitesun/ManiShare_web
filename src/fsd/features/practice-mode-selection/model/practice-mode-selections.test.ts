import assert from 'node:assert/strict'
import test from 'node:test'
import {
    isPracticeSelectionMode,
    isSelectablePracticeFamily,
    practiceModeSelections,
    type SelectablePracticeFamily,
} from './practice-mode-selections'
import { wordPracticeModeOptions } from './word-practice-modes'

test('游戏族和小模式按各自设计名单校验，拒绝跨族或原型字段', (): void => {
    const modesByFamily: Readonly<Record<SelectablePracticeFamily, readonly string[]>> = {
        word: ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral'],
        sentence: ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral'],
        audio: ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral'],
        video: ['listen', 'check', 'translate', 'blocks', 'typing', 'oral'],
        guess: ['guess', 'read', 'spell'],
        picture: ['listen', 'translate', 'typing', 'oral'],
    }
    for (const family of Object.keys(modesByFamily)) {
        assert.ok(isSelectablePracticeFamily(family))
        const selection = practiceModeSelections[family]
        assert.equal(selection.family, family)
        assert.deepEqual(
            selection.options.map((option) => option.id),
            modesByFamily[family],
        )
        for (const mode of modesByFamily[family])
            assert.equal(isPracticeSelectionMode(family, mode), true)
        for (const value of [undefined, null, '', {}, ['listen'], 1, 'constructor'])
            assert.equal(isPracticeSelectionMode(family, value), false)
    }
    for (const value of [undefined, null, '', 'phonetic', 'image', 'constructor', '__proto__', {}])
        assert.equal(isSelectablePracticeFamily(value), false)
    for (const [family, mode] of [
        ['word', 'listen'],
        ['sentence', 'pronounce'],
        ['audio', 'dictate'],
        ['video', 'read'],
        ['guess', 'typing'],
        ['picture', 'check'],
    ] as const)
        assert.equal(isPracticeSelectionMode(family, mode), false)
})

test('每族默认首项且每项都有独立本地小图和预览，不复制原单词配置', (): void => {
    assert.equal(practiceModeSelections.word.options, wordPracticeModeOptions)
    for (const selection of Object.values(practiceModeSelections)) {
        assert.equal(selection.defaultMode, selection.options[0]?.id)
        assert.equal(
            new Set(selection.options.map((option) => option.id)).size,
            selection.options.length,
        )
        assert.equal(
            new Set(selection.options.map((option) => option.preview)).size,
            selection.options.length,
        )
        for (const option of selection.options) {
            assert.ok(option.label.length > 0)
            assert.ok(option.thumbnail.endsWith('.png'))
            assert.ok(option.preview.endsWith('.png'))
            assert.notEqual(option.thumbnail, option.preview)
            assert.equal(option.thumbnail.includes('figma.com'), false)
            assert.equal(option.preview.includes('figma.com'), false)
        }
    }
})

test('句子与音视频保留原稿不同的中译英和拼块插图，公共原图仅引用同一URL', (): void => {
    const sentence = practiceModeSelections.sentence.options
    const audio = practiceModeSelections.audio.options
    const video = practiceModeSelections.video.options
    const picture = practiceModeSelections.picture.options
    const sentenceTranslation = sentence.find((option) => option.id === 'translate')
    const audioTranslation = audio.find((option) => option.id === 'translate')
    const sentenceBlocks = sentence.find((option) => option.id === 'blocks')
    const audioBlocks = audio.find((option) => option.id === 'blocks')
    assert.ok(sentenceTranslation?.thumbnail.endsWith('/sentence-translation-thumbnail.png'))
    assert.ok(audioTranslation?.thumbnail.endsWith('/translation-thumbnail.png'))
    assert.equal(sentenceTranslation?.preview, audioTranslation?.preview)
    assert.ok(sentenceBlocks?.thumbnail.endsWith('/word-spelling-thumbnail.png'))
    assert.ok(sentenceBlocks?.preview.endsWith('/sentence-word-blocks.png'))
    assert.ok(audioBlocks?.thumbnail.endsWith('/word-blocks-thumbnail.png'))
    assert.ok(audioBlocks?.preview.endsWith('/word-blocks.png'))
    for (const mode of ['listen', 'typing', 'oral'] as const) {
        const option = sentence.find((item) => item.id === mode)
        assert.ok(option)
        assert.equal(
            audio.find((item) => item.id === mode),
            option,
        )
        assert.equal(
            video.find((item) => item.id === mode),
            option,
        )
        assert.equal(
            picture.find((item) => item.id === mode),
            option,
        )
    }
})

test('猜词三项采用专属插图和名称，不借用句子阅读或单词拼写插图', (): void => {
    assert.deepEqual(
        practiceModeSelections.guess.options.map((option) => option.label),
        ['猜词模式', '阅读模式', '打词模式'],
    )
    for (const option of practiceModeSelections.guess.options) {
        assert.ok(option.preview.includes('/guess'))
        assert.ok(option.thumbnail.includes('/guess'))
    }
    assert.notEqual(
        practiceModeSelections.guess.options.find((option) => option.id === 'read')?.preview,
        practiceModeSelections.sentence.options.find((option) => option.id === 'read')?.preview,
    )
    assert.notEqual(
        practiceModeSelections.guess.options.find((option) => option.id === 'spell')?.preview,
        wordPracticeModeOptions.find((option) => option.id === 'spell')?.preview,
    )
})
