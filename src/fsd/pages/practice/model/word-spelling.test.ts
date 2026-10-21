import assert from 'node:assert/strict'
import test from 'node:test'
import {
    judgeWordSpelling,
    getWordSpellingAccuracy,
    getWordSpellingCrystals,
} from './word-spelling'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'

test('拼写保留十二题基线，默写增加十题，其他模式保留原题量', (): void => {
    const original = getDemoQuestions('word', 'meaning')
    const questions = getDemoQuestions('word', 'spell')
    const dictation = getDemoQuestions('word', 'dictate')
    assert.equal(questions.length, 12)
    assert.deepEqual(questions.slice(0, 2), original)
    assert.equal(new Set(questions.map((question) => question.id)).size, 12)
    assert.equal(new Set(questions.slice(2).map((question) => question.english)).size, 10)
    assert.ok(
        questions
            .slice(2)
            .every(
                (question) =>
                    question.english !== 'woman' && question.phonetic && question.translation,
            ),
    )
    assert.equal(getDemoQuestions('word', 'pronounce').length, 10)
    assert.equal(original.length, 2)
    assert.equal(getDemoQuestions('guess', 'guess').length, 2)
    assert.equal(dictation.length, 12)
    assert.deepEqual(dictation.slice(0, 2), original)
    assert.equal(new Set(dictation.map((question) => question.id)).size, 12)
    assert.equal(new Set(dictation.slice(2).map((question) => question.english)).size, 10)
})

test('本地拼写仅忽略首尾空白并遵守大小写设置，空提交不判错', (): void => {
    assert.equal(judgeWordSpelling('', 'woman', true), 'empty')
    assert.equal(judgeWordSpelling('   ', 'woman', true), 'empty')
    assert.equal(judgeWordSpelling('woman', '', true), 'empty')
    assert.equal(judgeWordSpelling(' WOMAN  ', 'woman', true), 'correct')
    assert.equal(judgeWordSpelling('WOMAN', 'woman', false), 'incorrect')
    assert.equal(judgeWordSpelling('woman ', 'woman', false), 'correct')
    for (const answer of ['wom', 'womann', 'wo man', 'woman!', 'women', 'ｗｏｍａｎ'])
        assert.equal(judgeWordSpelling(answer, 'woman', true), 'incorrect')
})

test('错题可原文修改重试，非空提交计次，成功后重复提交不重复统计', (): void => {
    const submit = { type: 'submit-spelling', target: 'woman', ignoreCase: true } as const
    assert.equal(
        reducePracticeSession(initialPracticeSession, { ...submit, value: ' ' }),
        initialPracticeSession,
    )
    const wrong = reducePracticeSession(initialPracticeSession, { ...submit, value: 'wom' })
    assert.equal(wrong.phase, 'incorrect')
    assert.equal(wrong.input, 'wom')
    assert.deepEqual(wrong.spellingStatistics, { submissions: 1, correct: 0 })
    assert.equal(getWordSpellingCrystals(wrong.spellingStatistics), 0)
    const edited = reducePracticeSession(wrong, { type: 'input', value: 'WOMAN ' })
    const correct = reducePracticeSession(edited, { ...submit, value: edited.input })
    assert.equal(correct.phase, 'correct')
    assert.equal(correct.input, 'WOMAN ')
    assert.deepEqual(correct.spellingStatistics, { submissions: 2, correct: 1 })
    assert.equal(getWordSpellingAccuracy(correct.spellingStatistics), 50)
    assert.equal(getWordSpellingCrystals(correct.spellingStatistics), 10)
    assert.equal(reducePracticeSession(correct, { ...submit, value: 'wrong' }), correct)
    const next = reducePracticeSession(correct, { type: 'move', delta: 1, total: 12 })
    assert.equal(next.phase, 'answering')
    assert.equal(next.input, '')
    assert.deepEqual(next.spellingStatistics, correct.spellingStatistics)
    assert.equal(getWordSpellingCrystals(next.spellingStatistics), 10)
    assert.deepEqual(reducePracticeSession(next, { type: 'reset' }).spellingStatistics, {
        submissions: 0,
        correct: 0,
    })
})

test('本轮黄晶只随有效正确提交每次增加10，重复提交、揭晓和切题不发奖励，重练清零', (): void => {
    const submit = {
        type: 'submit-spelling',
        target: 'woman',
        value: 'woman',
        ignoreCase: true,
    } as const
    const correct = reducePracticeSession(initialPracticeSession, submit)
    const duplicate = reducePracticeSession(correct, submit)
    assert.equal(getWordSpellingCrystals(initialPracticeSession.spellingStatistics), 0)
    assert.equal(getWordSpellingCrystals(duplicate.spellingStatistics), 10)
    const next = reducePracticeSession(duplicate, { type: 'move', delta: 1, total: 12 })
    const revealed = reducePracticeSession(next, { type: 'phase', phase: 'revealed' })
    assert.equal(
        getWordSpellingCrystals(reducePracticeSession(revealed, submit).spellingStatistics),
        10,
    )
    const another = reducePracticeSession(next, {
        ...submit,
        target: 'apple',
        value: 'apple',
    })
    assert.equal(getWordSpellingCrystals(another.spellingStatistics), 20)
    assert.equal(
        getWordSpellingCrystals(
            reducePracticeSession(another, { type: 'reset' }).spellingStatistics,
        ),
        0,
    )
})

test('揭晓和结束不推导正确结果，准确率由本轮提交量计算并四舍五入', (): void => {
    for (const state of [
        { ...initialPracticeSession, phase: 'revealed' as const },
        { ...initialPracticeSession, finished: true },
    ])
        assert.equal(
            reducePracticeSession(state, {
                type: 'submit-spelling',
                value: 'woman',
                target: 'woman',
                ignoreCase: true,
            }),
            state,
        )
    assert.equal(getWordSpellingAccuracy({ submissions: 0, correct: 0 }), 0)
    assert.equal(getWordSpellingAccuracy({ submissions: 3, correct: 2 }), 67)
})

test('通用输入使用给定答案做本地校验，正确态去重且不改写拼写统计', (): void => {
    const initial = {
        ...initialPracticeSession,
        spellingStatistics: { submissions: 3, correct: 1 },
    }
    const incorrect = reducePracticeSession(initial, {
        type: 'submit-answer',
        value: 'wx read',
        target: 'we read',
        ignoreCase: true,
    })
    assert.equal(incorrect.phase, 'incorrect')
    assert.equal(incorrect.spellingStatistics, initial.spellingStatistics)
    const correct = reducePracticeSession(incorrect, {
        type: 'submit-answer',
        value: 'We read',
        target: 'we read',
        ignoreCase: true,
    })
    assert.equal(correct.phase, 'correct')
    assert.equal(correct.spellingStatistics, initial.spellingStatistics)
    assert.equal(
        reducePracticeSession(correct, {
            type: 'submit-answer',
            value: 'We read',
            target: 'we read',
            ignoreCase: true,
        }),
        correct,
    )
})
