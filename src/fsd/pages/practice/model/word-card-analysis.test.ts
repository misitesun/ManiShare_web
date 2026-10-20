import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions } from './practice-demo'
import { parseDemoWordExample, wordCardAnalysisReducer } from './word-card-analysis'
import { getDemoWordCardExamples } from './word-card-analysis-demo'

test('解析只属于当前题；切题及返回上一题都从正面开始', (): void => {
    const initial = { questionId: 'woman', open: false }
    const open = wordCardAnalysisReducer(initial, { type: 'open', questionId: 'woman' })
    assert.equal(open.open, true)
    assert.equal(wordCardAnalysisReducer(open, { type: 'select', questionId: 'woman' }), open)
    const next = wordCardAnalysisReducer(open, { type: 'select', questionId: 'man' })
    assert.deepEqual(next, { questionId: 'man', open: false })
    assert.equal(wordCardAnalysisReducer(next, { type: 'open', questionId: 'woman' }), next)
    assert.deepEqual(
        wordCardAnalysisReducer(next, { type: 'select', questionId: 'woman' }),
        initial,
    )
})

test('翻回及章节清空不改变题目身份或创建旧解析', (): void => {
    const open = { questionId: 'happy', open: true }
    const closed = wordCardAnalysisReducer(open, { type: 'close' })
    assert.deepEqual(closed, { questionId: 'happy', open: false })
    assert.equal(wordCardAnalysisReducer(closed, { type: 'close' }), closed)
    const empty = wordCardAnalysisReducer(open, { type: 'select', questionId: null })
    assert.deepEqual(empty, { questionId: null, open: false })
    assert.equal(wordCardAnalysisReducer(empty, { type: 'open', questionId: 'happy' }), empty)
})

test('本地重点词标记保持标点及原文本，未闭合标记不擅自补全', (): void => {
    assert.deepEqual(parseDemoWordExample('An [[apple]], please. [[Apple]]!'), [
        { text: 'An ', highlighted: false },
        { text: 'apple', highlighted: true },
        { text: ', please. ', highlighted: false },
        { text: 'Apple', highlighted: true },
        { text: '!', highlighted: false },
    ])
    assert.deepEqual(parseDemoWordExample('[[未闭合'), [{ text: '[[未闭合', highlighted: false }])
    assert.deepEqual(parseDemoWordExample(''), [])
})

test('十个拼读模拟词各有三条独立双语例句及明确的中英文重点词', (): void => {
    const questions = getDemoQuestions('word', 'pronounce')
    assert.equal(questions.length, 10)
    const ids = new Set<string>()
    for (const question of questions) {
        assert.equal(question.wordExamples?.length, 3)
        for (const example of question.wordExamples ?? []) {
            assert.equal(ids.has(example.id), false)
            ids.add(example.id)
            assert.ok(
                example.english.some((part) => part.highlighted && part.text === question.english),
            )
            assert.ok(example.translation.some((part) => part.highlighted && part.text.trim()))
            assert.ok(example.english.every((part) => !part.text.includes('[[')))
        }
    }
    assert.equal(ids.size, 30)
    for (const missing of ['give', 'constructor', 'toString'])
        assert.deepEqual(getDemoWordCardExamples(missing), [])
})
