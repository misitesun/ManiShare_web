import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions } from './practice-demo'
import { pictureTranslationQuestions } from './picture-translation-demo'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    selectSentenceAnswerSlot,
    editSentenceAnswerSlot,
    spaceSentenceAnswer,
} from './sentence-answer-input'

test('看图中译英十条与听力共用词例及音源，题目身份按模式隔离', (): void => {
    const questions = getDemoQuestions('picture', 'translate')
    const listening = getDemoQuestions('picture', 'listen')
    assert.equal(questions, pictureTranslationQuestions)
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.deepEqual(
        questions.map(({ english, translation, readingSource }) => ({
            english,
            translation,
            readingSource,
        })),
        listening.map(({ english, translation, readingSource }) => ({
            english,
            translation,
            readingSource,
        })),
    )
    assert.ok(questions.every((question, index) => question.id !== listening[index]?.id))
    assert.ok(
        questions.some(
            (question) => createSentenceAnswerLayout(question.english).slots.length === 1,
        ),
    )
    assert.ok(
        questions.some((question) => createSentenceAnswerLayout(question.english).slots.length > 1),
    )
    assert.equal(getDemoQuestions('picture', 'typing').length, 10)
    assert.equal(getDemoQuestions('video', 'translate').length, 10)
})

test('看图短语复用分段输入，先填后段再补首段时空格直接提交', (): void => {
    const phrase = pictureTranslationQuestions.find(
        (question) => question.english === 'brush teeth',
    )
    assert.ok(phrase)
    const layout = createSentenceAnswerLayout(phrase.english)
    const second = selectSentenceAnswerSlot(createSentenceAnswerState(layout), 1)
    const enteredSecond = editSentenceAnswerSlot(second, layout, 'teeth')
    const first = selectSentenceAnswerSlot(enteredSecond, 0)
    const completed = editSentenceAnswerSlot(first, layout, 'brush')
    const result = spaceSentenceAnswer(completed, layout, true)
    assert.deepEqual(result.submission?.values, ['brush', 'teeth'])
    assert.equal(result.submission?.value, 'brush teeth')
    assert.equal(result.state.completed, true)
    assert.equal(result.state.attempts, 1)
    assert.equal(spaceSentenceAnswer(result.state, layout, true).submission, null)
})
