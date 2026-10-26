import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import { GuessReadingExercise } from './GuessReadingExercise'

function rejectAction(): never {
    throw new Error('阅读预渲染不得选词、朗读或打开答案')
}

function renderReading(index: number, blocked = false): string {
    const questions = getDemoQuestions('guess', 'read')
    const question = questions[index]
    assert.ok(question)
    return renderToStaticMarkup(
        createElement(GuessReadingExercise, {
            questions,
            question,
            revision: 0,
            blocked,
            answerOpen: false,
            onSelect: rejectAction,
            onCloseAnswer: rejectAction,
            onPlay: rejectAction,
            onExamplePlay: rejectAction,
            onNotice: rejectAction,
        }),
    )
}

test('猜词阅读稳定渲染十条中文语境与可访问目标词，首次不渲染场景图或答案', (): void => {
    const html = renderReading(0)
    assert.equal(html, renderReading(0))
    assert.equal((html.match(/<li\b/g) ?? []).length, 10)
    assert.equal((html.match(/<button\b/g) ?? []).length, 10)
    assert.equal((html.match(/aria-current="true"/g) ?? []).length, 1)
    assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 10)
    assert.match(html, /他有一双肥嘟嘟的/)
    assert.match(html, /的书包/)
    assert.match(html, /猜词阅读列表，可滚动/)
    for (const question of getDemoQuestions('guess', 'read'))
        assert.ok(html.includes(`查看 ${question.english} 的答案`))
    assert.doesNotMatch(
        html,
        /data-practice-media|data-guess-answer-panel|<input|添加笔记|快捷口语评测|阅读全览/,
    )
})

test('切到中间词保持完整列表，阻断时全部词按钮禁用', (): void => {
    const html = renderReading(4, true)
    const selected = html.match(/<li\b[^>]*aria-current="true"[\s\S]*?<\/li>/)?.[0]
    assert.ok(selected?.includes('查看 book 的答案'))
    assert.equal((html.match(/<li\b/g) ?? []).length, 10)
    for (const button of html.matchAll(/<button\b[^>]*>/g)) assert.match(button[0], /disabled=""/)
})
