import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import { pictureTypingQuestions } from './picture-typing-demo'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    editSentenceAnswerSlot,
    selectSentenceAnswerSlot,
    spaceSentenceAnswer,
} from './sentence-answer-input'

test('看图指法十条词例与听力共用音源，单词和短语的题目身份按模式隔离', (): void => {
    const listening = getDemoQuestions('picture', 'listen')
    const translation = getDemoQuestions('picture', 'translate')
    assert.equal(getDemoQuestions('picture', 'typing'), pictureTypingQuestions)
    assert.equal(pictureTypingQuestions.length, 10)
    assert.equal(new Set(pictureTypingQuestions.map((question) => question.id)).size, 10)
    for (const [index, question] of pictureTypingQuestions.entries()) {
        assert.equal(question.english, listening[index]?.english)
        assert.equal(question.translation, listening[index]?.translation)
        assert.equal(question.readingSource, listening[index]?.readingSource)
        assert.ok(question.readingSource)
        assert.notEqual(question.id, listening[index]?.id)
        assert.notEqual(question.id, translation[index]?.id)
    }
    assert.equal(
        createSentenceAnswerLayout(pictureTypingQuestions[0]?.english ?? '').slots.length,
        1,
    )
    assert.equal(
        createSentenceAnswerLayout(pictureTypingQuestions[4]?.english ?? '').slots.length,
        2,
    )
    assert.equal(getDemoQuestions('picture', 'oral').length, 10)
})

test('看图短语先填后段再补首段，空格提交同一份分段值并计入指法统计', (): void => {
    const phrase = pictureTypingQuestions.find((question) => question.english === 'brush teeth')
    assert.ok(phrase)
    const layout = createSentenceAnswerLayout(phrase.english)
    const second = selectSentenceAnswerSlot(createSentenceAnswerState(layout), 1)
    const enteredSecond = editSentenceAnswerSlot(second, layout, 'teeth')
    const first = selectSentenceAnswerSlot(enteredSecond, 0)
    const completed = editSentenceAnswerSlot(first, layout, 'brush')
    const result = spaceSentenceAnswer(completed, layout, true)
    assert.ok(result.submission)
    assert.deepEqual(result.submission.values, ['brush', 'teeth'])
    const submission = {
        type: 'submit-sentence-typing',
        target: phrase.english,
        values: result.submission.values,
        ignoreCase: true,
    } as const
    const correct = reducePracticeSession(initialPracticeSession, submission)
    assert.equal(correct.phase, 'correct')
    assert.deepEqual(correct.spellingStatistics, { submissions: 1, correct: 1 })
    assert.equal(reducePracticeSession(correct, submission), correct)
    assert.equal(spaceSentenceAnswer(result.state, layout, true).submission, null)
})
