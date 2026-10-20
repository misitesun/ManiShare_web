import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import { WordPronunciationAnalysis } from './WordPronunciationAnalysis'

function rejectAction(): never {
    throw new Error('解析预渲染不能执行朗读、查词或导航')
}

test('背面使用当前题的释义与例句，预渲染不发请求或执行操作', (): void => {
    const question = getDemoQuestions('word', 'pronounce')[0]
    assert.ok(question)
    const html = renderToStaticMarkup(
        createElement(WordPronunciationAnalysis, {
            question,
            disabled: false,
            borderDepth: 'front',
            onBack: rejectAction,
            onExamplePlay: rejectAction,
        }),
    )
    assert.match(html, /woman 的单词解析/)
    assert.match(html, /妇女；女性；成年女子/)
    assert.equal(Array.from(html.matchAll(/data-word-analysis-example=""/g)).length, 3)
    assert.match(html, /data-word-example-highlight="true"/)
    assert.doesNotMatch(html, /Please give me a pencil|<audio|<iframe|role="dialog"/)
})

test('缺例句显示空态且禁用操作；例句里的HTML保持普通文字', (): void => {
    const question = getDemoQuestions('word', 'pronounce')[0]
    assert.ok(question)
    const baseQuestion = question
    function render(wordExamples: readonly WordCardExample[]): string {
        return renderToStaticMarkup(
            createElement(WordPronunciationAnalysis, {
                question: { ...baseQuestion, wordExamples },
                disabled: true,
                borderDepth: 'front',
                onBack: rejectAction,
                onExamplePlay: rejectAction,
            }),
        )
    }
    const empty = render([])
    assert.match(empty, /当前单词暂无例句/)
    assert.match(empty, /disabled=""/)
    const escaped = render([
        {
            id: 'unsafe-text',
            english: [{ text: '<img src=x onerror=alert(1)>', highlighted: true }],
            translation: [{ text: '保持原文', highlighted: false }],
        },
    ])
    assert.match(escaped, /&lt;img/)
    assert.doesNotMatch(escaped, /<img/)
})
