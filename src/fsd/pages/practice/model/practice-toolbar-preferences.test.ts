import assert from 'node:assert/strict'
import test from 'node:test'
import { createAdditionalToolbarOptions } from './additional-toolbar-options'
import { createAudioToolbarOptions } from './audio-toolbar-options'
import {
    getAdditionalToolbarPreferences,
    getAudioToolbarPreferences,
    getSentenceToolbarPreferences,
    getWordToolbarPreferences,
    parsePracticeToolbarPreferences,
    updatePracticeToolbarPreferences,
} from './practice-toolbar-preferences'
import { createSentenceToolbarOptions } from './sentence-toolbar-options'
import { createWordToolbarOptions } from './word-toolbar-options'

test('没有缓存、格式损坏或未知版本时使用空缓存，不引入旧数据迁移', (): void => {
    for (const value of [
        null,
        undefined,
        'broken-json',
        [],
        {},
        { version: 2, scopes: { 'word:pronounce': { order: 'sequential' } } },
        { version: 1, scopes: [] },
    ])
        assert.deepEqual(parsePracticeToolbarPreferences(value), { version: 1, scopes: {} })
})

test('拼写无有效音标缓存时默认原始音标，合法个人选择仍可恢复', (): void => {
    for (const phonetics of [undefined, 'unknown', 'original', 'syllables', 'phonics', 'none']) {
        const preferences = parsePracticeToolbarPreferences({
            version: 1,
            scopes: { 'word:spell': { phonetics } },
        })
        assert.equal(
            getWordToolbarPreferences(preferences, 'spell').phonetics,
            phonetics === undefined || phonetics === 'unknown' ? 'original' : phonetics,
        )
    }
})

test('缓存缺项或坏值逐字段回退，合法false和枚举值可恢复', (): void => {
    const preferences = parsePracticeToolbarPreferences({
        version: 1,
        scopes: {
            'word:pronounce': {
                cutReading: false,
                order: 'alphabetical',
                language: 'translate',
                phonetics: 'none',
            },
            'word:spell': { copy: 'true', translationVisible: false, phonetics: 'unknown' },
            'sentence:translate': { split: false, imageVisible: 0, copy: false },
            'audio:translate': { copy: false, translationVisible: false, cutReading: null },
        },
    })
    assert.deepEqual(getWordToolbarPreferences(preferences, 'pronounce'), {
        ...createWordToolbarOptions('pronounce'),
        cutReading: false,
        order: 'alphabetical',
        language: 'translate',
        phonetics: 'none',
    })
    assert.deepEqual(getWordToolbarPreferences(preferences, 'spell'), {
        ...createWordToolbarOptions('spell'),
        translationVisible: false,
    })
    assert.deepEqual(getSentenceToolbarPreferences(preferences, 'translate'), {
        ...createSentenceToolbarOptions('translate'),
        split: false,
        copy: false,
    })
    assert.deepEqual(getAudioToolbarPreferences(preferences, 'translate'), {
        ...createAudioToolbarOptions('translate'),
        copy: false,
        translationVisible: false,
    })
})

test('仅恢复真实控件字段，拒绝未知作用域及同名模式之间的越权字段', (): void => {
    const preferences = parsePracticeToolbarPreferences({
        version: 1,
        scopes: {
            'unknown:oral': { imageVisible: false },
            'audio:spell': { imageVisible: false },
            'audio:blocks': { split: true, copy: true, translationVisible: false },
            'video:oral': { imageVisible: false, split: true, translationVisible: false },
            'word:pronounce': { copy: true, imageVisible: false, order: 'sequential' },
            'sentence:read': { split: true, translationVisible: false },
            'phonetics:pronounce': { naturalPhonics: false, copy: true },
            'picture:translate': { imageVisible: false, copy: false },
        },
    })
    assert.deepEqual(preferences.scopes, {
        'word:pronounce': { order: 'sequential' },
        'audio:blocks': { translationVisible: false },
        'video:oral': { translationVisible: false },
        'picture:translate': { copy: false },
        'phonetics:pronounce': { naturalPhonics: false },
    })
    assert.equal('split' in getAudioToolbarPreferences(preferences, 'blocks'), false)
    assert.equal(getAdditionalToolbarPreferences(preferences, 'video', 'oral').imageVisible, true)
})

test('按family和mode分别保存，同名模式和同族其他模式互不影响', (): void => {
    const empty = parsePracticeToolbarPreferences(null)
    const word = updatePracticeToolbarPreferences(empty, 'word', 'oral', {
        ...createWordToolbarOptions('oral'),
        translationVisible: false,
    })
    const sentence = updatePracticeToolbarPreferences(word, 'sentence', 'oral', {
        ...createSentenceToolbarOptions('oral'),
        cutReading: false,
    })
    const audio = updatePracticeToolbarPreferences(sentence, 'audio', 'oral', {
        ...createAudioToolbarOptions('oral'),
        imageVisible: false,
    })
    const otherMode = updatePracticeToolbarPreferences(audio, 'audio', 'translate', {
        ...createAudioToolbarOptions('translate'),
        copy: false,
    })
    assert.equal(getWordToolbarPreferences(otherMode, 'oral').translationVisible, false)
    assert.equal(getSentenceToolbarPreferences(otherMode, 'oral').cutReading, false)
    assert.equal(getAudioToolbarPreferences(otherMode, 'oral').imageVisible, false)
    assert.equal(getAudioToolbarPreferences(otherMode, 'oral').translationVisible, true)
    assert.equal(getAudioToolbarPreferences(otherMode, 'translate').copy, false)
    assert.deepEqual(empty.scopes, {})
    assert.equal(Object.keys(otherMode.scopes).length, 4)
    const restored: unknown = JSON.parse(JSON.stringify(otherMode))
    assert.deepEqual(parsePracticeToolbarPreferences(restored), otherMode)
})

test('猜词键盘、音标常驻自然拼读和视频结果拆句独立缓存', (): void => {
    let preferences = parsePracticeToolbarPreferences(null)
    preferences = updatePracticeToolbarPreferences(preferences, 'guess', 'spell', {
        ...createAdditionalToolbarOptions('guess', 'spell'),
        keyboardVisible: false,
    })
    preferences = updatePracticeToolbarPreferences(preferences, 'phonetics', 'pronounce', {
        ...createAdditionalToolbarOptions('phonetics', 'pronounce'),
        naturalPhonics: false,
    })
    preferences = updatePracticeToolbarPreferences(preferences, 'video', 'blocks', {
        ...createAdditionalToolbarOptions('video', 'blocks'),
        sentenceAnalysisVisible: false,
    })
    assert.equal(
        getAdditionalToolbarPreferences(preferences, 'guess', 'spell').keyboardVisible,
        false,
    )
    assert.equal(
        getAdditionalToolbarPreferences(preferences, 'phonetics', 'pronounce').naturalPhonics,
        false,
    )
    assert.equal(
        getAdditionalToolbarPreferences(preferences, 'video', 'blocks').sentenceAnalysisVisible,
        false,
    )
    assert.equal(
        getAdditionalToolbarPreferences(preferences, 'phonetics', 'oral').naturalPhonics,
        true,
    )
    assert.deepEqual(preferences.scopes['phonetics:pronounce'], { naturalPhonics: false })
    assert.equal(Object.hasOwn(preferences.scopes['guess:spell'] ?? {}, 'naturalPhonics'), false)
})

test('没有设置项的作用域不新增缓存，非法组合不写入', (): void => {
    const preferences = parsePracticeToolbarPreferences(null)
    assert.equal(
        updatePracticeToolbarPreferences(
            preferences,
            'audio',
            'read',
            createAudioToolbarOptions('read'),
        ),
        preferences,
    )
    assert.equal(
        updatePracticeToolbarPreferences(
            preferences,
            'picture',
            'spell',
            createAdditionalToolbarOptions('picture', 'spell'),
        ),
        preferences,
    )
})

test('未知字段、继承字段、数组和非布尔值不成为缓存设置', (): void => {
    const inherited: unknown = Object.create({ cutReading: false })
    const preferences = parsePracticeToolbarPreferences({
        version: 1,
        scopes: {
            'word:pronounce': inherited,
            'word:spell': ['copy', false],
            'sentence:typing': { copy: 1, split: 'false', imageVisible: false, arbitrary: true },
        },
    })
    assert.deepEqual(preferences.scopes, { 'sentence:typing': { imageVisible: false } })
})
