import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions } from './practice-demo'
import { getSentenceBlockCandidates, judgeSentenceBlocks } from './sentence-blocks'
import { createAudioToolbarOptions, audioToolbarRows } from './audio-toolbar-options'
import {
    getAudioToolbarPreferences,
    getSentenceToolbarPreferences,
    parsePracticeToolbarPreferences,
    updatePracticeToolbarPreferences,
} from './practice-toolbar-preferences'

test('音频独立词块ID保持设计首题顺序和判题语义', (): void => {
    const question = getDemoQuestions('audio', 'blocks')[0]
    if (!question) throw new Error('Missing audio blocks fixture')
    assert.deepEqual(
        getSentenceBlockCandidates(question).map((token) => token.text),
        ['read', 'together', 'we', 'books'],
    )
    assert.equal(
        judgeSentenceBlocks(
            question.tokens,
            question.tokens.map((token) => token.id),
        ),
        'correct',
    )
    assert.equal(
        judgeSentenceBlocks(
            question.tokens,
            getDemoQuestions('sentence', 'blocks')[0]?.tokens.map((token) => token.id) ?? [],
        ),
        'incorrect',
    )
})

test('音频模式选项白名单没有split，保存音频抄写不修改句子缓存', (): void => {
    const initial = parsePracticeToolbarPreferences({
        version: 1,
        scopes: {
            'sentence:translate': { copy: true, split: false },
            'audio:translate': { copy: false, split: true },
        },
    })
    assert.equal(Object.hasOwn(initial.scopes['audio:translate'] ?? {}, 'split'), false)
    for (const rows of Object.values(audioToolbarRows))
        assert.ok(!rows.some((row) => String(row) === 'split'))
    const next = updatePracticeToolbarPreferences(initial, 'audio', 'translate', {
        ...createAudioToolbarOptions('translate'),
        copy: true,
        imageVisible: false,
    })
    assert.deepEqual(next.scopes['sentence:translate'], initial.scopes['sentence:translate'])
    assert.equal(getSentenceToolbarPreferences(next, 'translate').split, false)
    assert.equal(getAudioToolbarPreferences(next, 'translate').imageVisible, false)
})
