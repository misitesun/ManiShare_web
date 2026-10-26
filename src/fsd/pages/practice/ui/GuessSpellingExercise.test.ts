import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticePhase } from '../model/practice-demo'
import { GuessSpellingExercise } from './GuessSpellingExercise'

function rejectAction(): never {
    throw new Error('打词预渲染不得提交、朗读或切换答案')
}

interface FixtureOptions {
    readonly index?: number
    readonly input?: string
    readonly phase?: PracticePhase
    readonly copy?: boolean
    readonly showImage?: boolean
    readonly showKeyboard?: boolean
    readonly blocked?: boolean
    readonly answerOpen?: boolean
}

function renderSpelling(options: FixtureOptions = {}): string {
    const question = getDemoQuestions('guess', 'spell')[options.index ?? 0]
    assert.ok(question)
    return renderToStaticMarkup(
        createElement(GuessSpellingExercise, {
            question,
            phase: options.phase ?? 'answering',
            input: options.input ?? '',
            blocked: options.blocked ?? false,
            copy: options.copy ?? true,
            showImage: options.showImage ?? true,
            showKeyboard: options.showKeyboard ?? true,
            ignoreCase: true,
            borderStyle: 'solid',
            answerOpen: options.answerOpen ?? false,
            onInput: rejectAction,
            onSubmit: rejectAction,
            onController: rejectAction,
            onCloseAnswer: rejectAction,
            onPlay: rejectAction,
            onExamplePlay: rejectAction,
            onNotice: rejectAction,
        }),
    )
}

test('打词默认抄写，中文句尾只含一个英文作答段，图和真实键盘各一个', (): void => {
    const html = renderSpelling()
    assert.equal(html, renderSpelling())
    assert.match(html, /他有一双肥嘟嘟的/)
    assert.match(html, /aria-label="单词答案，第1段"/)
    assert.equal((html.match(/<input\b/g) ?? []).length, 1)
    assert.equal((html.match(/data-sentence-answer-slot="/g) ?? []).length, 1)
    assert.equal((html.match(/data-practice-media="/g) ?? []).length, 1)
    assert.equal((html.match(/data-typing-keyboard="/g) ?? []).length, 1)
    assert.match(html, /width="430" height="240"/)
    assert.match(html, /data-sentence-word-hint/)
    assert.doesNotMatch(html, /data-word-slot-input|确认输入|答对状态演示|data-guess-answer-panel/)
})

test('句中填词保留前后文顺序，隐藏图片或键盘不删除输入，默写不提示下一字母', (): void => {
    const index = getDemoQuestions('guess', 'spell').findIndex(
        (question) => question.english === 'green',
    )
    assert.ok(index >= 0)
    const html = renderSpelling({
        index,
        input: 'gr',
        copy: false,
        showImage: false,
        showKeyboard: false,
    })
    assert.ok(html.indexOf('小男孩背着一个') < html.indexOf('data-sentence-answer-input'))
    assert.ok(html.indexOf('data-sentence-answer-input') < html.indexOf('的书包'))
    assert.match(html, /<input\b[^>]*value="gr"/)
    assert.match(html, /<div\b[^>]*hidden=""[^>]*data-guess-keyboard/)
    assert.match(html, /data-keyboard-active="false"/)
    assert.doesNotMatch(html, /data-practice-media|data-sentence-word-hint|下一键：/)
})

test('错误仍可编辑，答对或阻断后禁用输入及键盘，答案展开不清已填内容', (): void => {
    const wrong = renderSpelling({ phase: 'incorrect', input: 'wrong' })
    assert.match(wrong, /aria-invalid="true"/)
    assert.doesNotMatch(wrong.match(/<input\b[^>]*>/)?.[0] ?? '', /disabled=""/)
    const open = renderSpelling({ input: 'ha', answerOpen: true })
    assert.match(open, /<input\b[^>]*value="ha"/)
    assert.match(open, /data-keyboard-active="false"/)
    for (const options of [{ phase: 'correct' as const }, { blocked: true }]) {
        const html = renderSpelling(options)
        assert.match(html.match(/<input\b[^>]*>/)?.[0] ?? '', /disabled=""/)
        assert.match(html, /data-keyboard-active="false"/)
        assert.doesNotMatch(html, /快捷口语|本轮指法统计|下一题/)
    }
})
