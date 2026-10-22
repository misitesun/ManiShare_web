import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import type { PracticeQuestion } from './practice-demo'
import {
    editSentenceBlocks,
    getSentenceBlockCandidates,
    judgeSentenceBlocks,
} from './sentence-blocks'

function firstQuestion(): PracticeQuestion {
    const question = getDemoQuestions('sentence', 'blocks')[0]
    if (!question) throw new Error('Missing sentence blocks fixture')
    return question
}

test('词块撤回和清空只更改当前选择，未知ID不进入答案', (): void => {
    const tokens = firstQuestion().tokens
    const selected = ['we', 'read']
    assert.deepEqual(editSentenceBlocks(tokens, selected, { type: 'undo' }), ['we'])
    assert.deepEqual(editSentenceBlocks(tokens, selected, { type: 'clear' }), [])
    assert.deepEqual(editSentenceBlocks(tokens, selected, { type: 'toggle', id: 'we' }), ['read'])
    assert.equal(editSentenceBlocks(tokens, selected, { type: 'toggle', id: 'unknown' }), selected)
    assert.deepEqual(selected, ['we', 'read'])
})

test('词序判题拒绝缺词、错位、重复ID及未知词块，重复词的两次出现可互换', (): void => {
    const tokens = firstQuestion().tokens
    assert.equal(judgeSentenceBlocks(tokens, []), 'empty')
    assert.equal(judgeSentenceBlocks(tokens, ['we', 'read']), 'incorrect')
    assert.equal(judgeSentenceBlocks(tokens, ['read', 'we', 'books', 'together']), 'incorrect')
    assert.equal(judgeSentenceBlocks(tokens, ['we', 'read', 'books', 'books']), 'incorrect')
    assert.equal(judgeSentenceBlocks(tokens, ['we', 'read', 'books', 'unknown']), 'incorrect')
    assert.equal(judgeSentenceBlocks(tokens, ['we', 'read', 'books', 'together']), 'correct')
    const token = tokens[0]
    if (!token) throw new Error('Missing repeated-word fixture')
    const repeated = [
        { ...token, id: 'we-1' },
        { ...token, id: 'we-2' },
    ]
    assert.equal(judgeSentenceBlocks(repeated, ['we-2', 'we-1']), 'correct')
})

test('选满自动判题，错误可撤回修改；正确与完成态不再编辑或重复判题', (): void => {
    const tokens = firstQuestion().tokens
    let state = initialPracticeSession
    for (const id of ['read', 'we', 'books', 'together'])
        state = reducePracticeSession(state, {
            type: 'edit-sentence-blocks',
            edit: { type: 'toggle', id },
            tokens,
        })
    assert.equal(state.phase, 'incorrect')
    state = reducePracticeSession(state, {
        type: 'edit-sentence-blocks',
        edit: { type: 'clear' },
        tokens,
    })
    assert.equal(state.phase, 'answering')
    assert.deepEqual(state.blocks, [])
    for (const token of tokens)
        state = reducePracticeSession(state, {
            type: 'edit-sentence-blocks',
            edit: { type: 'toggle', id: token.id },
            tokens,
        })
    assert.equal(state.phase, 'correct')
    assert.equal(reducePracticeSession(state, { type: 'submit-sentence-blocks', tokens }), state)
    assert.equal(
        reducePracticeSession(state, {
            type: 'edit-sentence-blocks',
            edit: { type: 'clear' },
            tokens,
        }),
        state,
    )
    assert.deepEqual(state.spellingStatistics, initialPracticeSession.spellingStatistics)
    const next = reducePracticeSession(state, { type: 'move', delta: 1, total: 10 })
    assert.equal(next.index, 1)
    assert.deepEqual(next.blocks, [])
    assert.equal(next.phase, 'answering')
    const partial = { ...initialPracticeSession, blocks: ['we'] }
    assert.equal(
        reducePracticeSession(partial, { type: 'submit-sentence-blocks', tokens }).phase,
        'incorrect',
    )
    const finished = { ...partial, finished: true }
    assert.equal(
        reducePracticeSession(finished, {
            type: 'edit-sentence-blocks',
            edit: { type: 'clear' },
            tokens,
        }),
        finished,
    )
})

test('十道题的候选顺序稳定且保留全部ID，首题遵循设计稿', (): void => {
    const questions = getDemoQuestions('sentence', 'blocks')
    assert.equal(questions.length, 10)
    assert.deepEqual(
        getSentenceBlockCandidates(firstQuestion()).map((token) => token.id),
        ['read', 'together', 'we', 'books'],
    )
    for (const question of questions) {
        const candidates = getSentenceBlockCandidates(question)
        assert.deepEqual(candidates, getSentenceBlockCandidates(question))
        assert.deepEqual(
            candidates.map((token) => token.id).sort(),
            question.tokens.map((token) => token.id).sort(),
        )
        assert.notDeepEqual(
            candidates.map((token) => token.id),
            question.tokens.map((token) => token.id),
        )
    }
})
