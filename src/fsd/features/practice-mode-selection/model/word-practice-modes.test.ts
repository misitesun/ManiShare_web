import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getWordPracticeModeOption,
    isWordPracticeMode,
    wordPracticeModeOptions,
} from './word-practice-modes'

test('单词选择只接受六个已有小模式，不把通用素材目录当作单词模式全集', (): void => {
    assert.deepEqual(
        wordPracticeModeOptions.map((option) => option.id),
        ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral'],
    )
    for (const option of wordPracticeModeOptions) assert.equal(isWordPracticeMode(option.id), true)
    for (const value of [undefined, null, '', 'listen', 'guess', 'word-basic', 1, {}, ['spell']])
        assert.equal(isWordPracticeMode(value), false)
})

test('六项名称各自映射原始方形小图和对应大图，不重复借用同一插画', (): void => {
    const artworkByMode = [
        { id: 'pronounce', label: '单词拼读', asset: 'word-pronunciation' },
        { id: 'spell', label: '单词拼写', asset: 'word-spelling' },
        { id: 'dictate', label: '单词默写', asset: 'word-dictation' },
        { id: 'meaning', label: '句中练义', asset: 'context-meaning' },
        { id: 'typing', label: '指法练习', asset: 'typing' },
        { id: 'oral', label: '口语评测', asset: 'oral-assessment' },
    ] as const
    for (const expected of artworkByMode) {
        const option = getWordPracticeModeOption(expected.id)
        assert.equal(option.label, expected.label)
        assert.ok(option.preview.endsWith(`/${expected.asset}.png`))
        assert.ok(option.thumbnail.endsWith(`/${expected.asset}-thumbnail.png`))
    }
    assert.equal(new Set(wordPracticeModeOptions.map((option) => option.preview)).size, 6)
    assert.equal(new Set(wordPracticeModeOptions.map((option) => option.thumbnail)).size, 6)
})
