import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import {
    createWordSpellingInputState,
    createWordSpellingLayout,
    spaceWordSpellingInput,
    typeWordSpellingInput,
} from './word-spelling-input'
import { getTypingTargetAtPosition } from './typing-keyboard'

test('单词指法提供十个独立题目身份，复用词条内容且不影响其他模式题量', (): void => {
    const questions = getDemoQuestions('word', 'typing')
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.equal(new Set(questions.map((question) => question.english)).size, 10)
    assert.ok(questions.every((question) => question.id.startsWith('typing:')))
    assert.ok(questions.every((question) => question.translation))
    for (const question of questions)
        assert.equal(question.readingSource, `/practice-demo/word-typing/${question.english}.wav`)
    assert.ok(getDemoQuestions('word', 'pronounce').every((question) => question.readingSource))
    assert.deepEqual(
        questions.map((question) => question.english),
        getDemoQuestions('word', 'pronounce').map((question) => question.english),
    )
    assert.equal(getDemoQuestions('word', 'spell').length, 12)
    assert.equal(getDemoQuestions('word', 'dictate').length, 12)
    assert.equal(getDemoQuestions('word', 'meaning').length, 10)
    assert.equal(getDemoQuestions('guess', 'guess').length, 2)
})

test('指法键盘读取编辑光标而非输入长度，跳格和纠错不提前计入统计', (): void => {
    const layout = createWordSpellingLayout('apple', 'original')
    const partial = typeWordSpellingInput(createWordSpellingInputState(layout), 'app')
    assert.equal(getTypingTargetAtPosition('apple', partial.cursor)?.key.code, 'KeyL')
    const navigation = spaceWordSpellingInput(partial, layout, true)
    assert.equal(navigation.value, null)
    assert.equal(navigation.state.cursor, 0)
    assert.equal(getTypingTargetAtPosition('apple', navigation.state.cursor)?.key.code, 'KeyA')

    const wrong = spaceWordSpellingInput(
        createWordSpellingInputState(layout, 'xxxxx'),
        layout,
        true,
    )
    assert.equal(wrong.value, 'xxxxx')
    const editing = typeWordSpellingInput(wrong.state, 'ap')
    assert.equal(editing.cursor, 2)
    assert.equal(getTypingTargetAtPosition('apple', editing.cursor)?.key.code, 'KeyP')
    const fixed = typeWordSpellingInput(editing, 'ple')
    const result = spaceWordSpellingInput(fixed, layout, true)
    assert.equal(result.state.completed, true)
    const submit = { type: 'submit-spelling', target: 'apple', ignoreCase: true } as const
    const incorrect = reducePracticeSession(initialPracticeSession, { ...submit, value: 'xxxxx' })
    const correct = reducePracticeSession(incorrect, { ...submit, value: 'apple' })
    assert.deepEqual(correct.spellingStatistics, { submissions: 2, correct: 1 })
    assert.equal(reducePracticeSession(correct, { ...submit, value: 'apple' }), correct)
    const next = reducePracticeSession(correct, { type: 'move', delta: 1, total: 10 })
    assert.equal(next.input, '')
    assert.equal(next.phase, 'answering')
    assert.deepEqual(next.spellingStatistics, correct.spellingStatistics)
    assert.deepEqual(reducePracticeSession(next, { type: 'reset' }).spellingStatistics, {
        submissions: 0,
        correct: 0,
    })
})
