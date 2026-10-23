import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'

test('句子与音频指法各自共用所属题库的十题音源，单词题量不变', (): void => {
    const questions = getDemoQuestions('sentence', 'typing')
    assert.equal(questions.length, 10)
    assert.deepEqual(questions, getDemoQuestions('sentence', 'listen'))
    assert.equal(getDemoQuestions('word', 'typing').length, 10)
    const audio = getDemoQuestions('audio', 'typing')
    assert.equal(audio.length, 10)
    assert.deepEqual(audio, getDemoQuestions('audio', 'listen'))
    for (const [index, question] of audio.entries()) {
        const sentence = questions[index]
        assert.ok(sentence)
        assert.equal(question.english, sentence.english)
        assert.equal(question.readingSource, sentence.readingSource)
        assert.ok(question.readingSource)
        assert.notEqual(question.id, sentence.id)
        assert.ok(
            question.tokens.every(
                (token) => !sentence.tokens.some((entry) => entry.id === token.id),
            ),
        )
    }
})

test('视频指法共用同一视频的十条记录，不附加逐句独立音源', (): void => {
    const questions = getDemoQuestions('video', 'typing')
    assert.equal(questions.length, 10)
    assert.deepEqual(questions, getDemoQuestions('video', 'listen'))
    assert.deepEqual(questions, getDemoQuestions('video', 'check'))
    for (const question of questions) {
        assert.ok(question.id.startsWith('video:'))
        assert.equal(question.readingSource, undefined)
    }
})

test('句子指法仅完整分段提交计数，纠错正确去重，切题保留统计而重练清零', (): void => {
    const submission = {
        type: 'submit-sentence-typing',
        target: 'we read books together',
        ignoreCase: true,
    } as const
    assert.equal(
        reducePracticeSession(initialPracticeSession, {
            ...submission,
            values: ['we', '', 'books', 'together'],
        }),
        initialPracticeSession,
    )
    const wrong = reducePracticeSession(initialPracticeSession, {
        ...submission,
        values: ['we', 'reed', 'books', 'together'],
    })
    assert.equal(wrong.phase, 'incorrect')
    assert.deepEqual(wrong.spellingStatistics, { submissions: 1, correct: 0 })
    const correctAction = { ...submission, values: ['WE', 'read', 'books', 'together'] }
    const correct = reducePracticeSession(wrong, correctAction)
    assert.equal(correct.phase, 'correct')
    assert.deepEqual(correct.spellingStatistics, { submissions: 2, correct: 1 })
    assert.equal(reducePracticeSession(correct, correctAction), correct)
    const next = reducePracticeSession(correct, { type: 'move', delta: 1, total: 10 })
    assert.equal(next.phase, 'answering')
    assert.deepEqual(next.spellingStatistics, correct.spellingStatistics)
    assert.deepEqual(reducePracticeSession(next, { type: 'reset' }), initialPracticeSession)
    const revealed = reducePracticeSession(initialPracticeSession, {
        type: 'phase',
        phase: 'revealed',
    })
    assert.equal(reducePracticeSession(revealed, correctAction), revealed)
})
