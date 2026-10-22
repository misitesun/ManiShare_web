import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { getDemoQuestions } from './practice-demo'
import { getWordDemoReadingSource } from './word-demo-reading'

test('单词六模式全部拥有对应目标词音源，题量及题目身份保持不变', (): void => {
    const words = new Set<string>()
    for (const [mode, count] of [
        ['pronounce', 10],
        ['spell', 12],
        ['dictate', 12],
        ['meaning', 10],
        ['typing', 10],
        ['oral', 10],
    ] as const) {
        const questions = getDemoQuestions('word', mode)
        assert.equal(questions.length, count)
        assert.equal(new Set(questions.map((question) => question.id)).size, count)
        for (const question of questions) {
            words.add(question.english)
            assert.equal(question.readingSource, getWordDemoReadingSource(question.english))
            assert.ok(question.readingSource && existsSync(`public${question.readingSource}`))
        }
    }
    assert.equal(words.size, 19)
    assert.ok(getDemoQuestions('guess', 'guess').every((question) => !question.readingSource))
})

test('三十条解析例句逐条绑定自身音源；十条语境句与目标单词音源分开', (): void => {
    const sources = new Set<string>()
    for (const question of getDemoQuestions('word', 'pronounce')) {
        for (const example of question.wordExamples ?? []) {
            assert.equal(
                example.readingSource,
                `/practice-demo/word-reading/examples/${example.id}.wav`,
            )
            assert.ok(example.readingSource && existsSync(`public${example.readingSource}`))
            sources.add(example.readingSource)
        }
    }
    assert.equal(sources.size, 30)
    for (const question of getDemoQuestions('word', 'meaning')) {
        const source = question.wordMeaning?.readingSource
        assert.equal(source, `/practice-demo/word-reading/meaning/${question.id}.wav`)
        assert.notEqual(source, question.readingSource)
        assert.ok(source && existsSync(`public${source}`))
    }
})
