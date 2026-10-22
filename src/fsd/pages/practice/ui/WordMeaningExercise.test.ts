import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import { WordMeaningExercise, WordMeaningVariantSwitch } from './WordMeaningExercise'
import type { WordMeaningExerciseProps } from './WordMeaningExercise'
import { WordSpellingResult } from './WordSpellingResult'

function rejectAction(): never {
    throw new Error('预渲染不能作答、录音、揭晓或切换玩法')
}

function renderExercise(changes: Partial<WordMeaningExerciseProps> = {}): string {
    const question = getDemoQuestions('word', 'meaning')[0]
    if (!question) throw new Error('Missing word meaning fixture')
    return renderToStaticMarkup(
        createElement(WordMeaningExercise, {
            question,
            variant: 'fill',
            phase: 'answering',
            input: '',
            blocked: false,
            imageVisible: true,
            phoneticsVisible: true,
            translationVisible: false,
            ignoreCase: true,
            onInput: rejectAction,
            onSubmit: rejectAction,
            onController: rejectAction,
            onRevealTranslation: rejectAction,
            ...changes,
        }),
    )
}

test('填空只创建一个空答案输入，句子前后文、音标和中文重点分别展示', (): void => {
    const html = renderExercise()
    assert.equal((html.match(/<input\b/g) ?? []).length, 1)
    assert.match(html, /<input[^>]*value=""/)
    assert.match(html, /The /)
    assert.match(html, / walks in the park/)
    assert.match(html, /data-word-meaning-phonetic/)
    assert.match(html, /data-word-meaning-translation-target[^>]*>女人<\/span>/)
    assert.match(html, /data-practice-answer-presentation="inline"/)
    assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
    assert.equal((html.match(/data-spelling-letter="empty"/g) ?? []).length, 5)
    assert.doesNotMatch(html, /data-word-meaning-reveal/)
    assert.doesNotMatch(html, /答对状态演示|答错状态演示/)
})

test('填空部分输入及较宽错字保留五个共用字母位，不再进入整词滚动槽', (): void => {
    for (const input of ['', 'wo', 'wowww', 'wwwww']) {
        const html = renderExercise({
            input,
            phase: input.length === 5 ? 'incorrect' : 'answering',
        })
        assert.equal((html.match(/<input\b/g) ?? []).length, 1)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        assert.equal((html.match(/data-word-spelling-segment=/g) ?? []).length, 1)
        assert.match(html, /data-word-meaning-word-measure="true"/)
        assert.doesNotMatch(html, /data-word-slot(?:-scroll|-group|-input)?=/)
        assert.doesNotMatch(html, /overflow-x-auto/)
    }
    assert.match(renderExercise({ input: 'wo' }), /data-answer-cursor="2"/)
    assert.match(renderExercise({ borderStyle: 'dashed' }), /border-t-4 border-dashed/)
})

test('辨义预先显示目标词且无输入，首次渲染隐藏全部中文译文并提供显示按钮', (): void => {
    const html = renderExercise({ variant: 'context' })
    assert.doesNotMatch(html, /<input\b/)
    assert.match(html, /data-word-meaning-answer[^>]*>woman<\/span>/)
    assert.match(html, /data-word-meaning-reveal/)
    assert.doesNotMatch(html, /data-word-meaning-translation(?:\s|=|>)/)
    assert.doesNotMatch(html, /data-word-meaning-definition/)
    const revealed = renderExercise({ variant: 'context', translationVisible: true })
    assert.match(revealed, /data-word-meaning-translation-target[^>]*>女人<\/span>/)
    assert.match(revealed, /这位/)
    assert.match(revealed, /在公园散步/)
    assert.doesNotMatch(revealed, /data-word-meaning-reveal/)
})

test('填空答对保留题图与完整句子，阻断及设置显隐作用于专用题面', (): void => {
    const correct = renderExercise({ phase: 'correct', input: 'woman' })
    assert.match(correct, /data-practice-media/)
    assert.match(correct, /data-word-meaning-answer[^>]*>woman<\/span>/)
    assert.doesNotMatch(correct, /<input\b/)
    assert.match(
        renderExercise({ input: 'wo', blocked: true }),
        /<input[^>]*disabled=""[^>]*value="wo"/,
    )
    const hidden = renderExercise({ imageVisible: false, phoneticsVisible: false })
    assert.doesNotMatch(hidden, /data-practice-media|data-word-meaning-phonetic/)
    assert.match(hidden, /data-practice-answer-input/)
    assert.match(renderExercise({ displayFontSize: 52 }), /font-size:52px/)
})

test('口语空槽和第三排玩法选择独立存在，默认拼写与默写不多出玩法按钮', (): void => {
    const controls = createElement(WordMeaningVariantSwitch, {
        value: 'context',
        disabled: false,
        onChange: rejectAction,
    })
    const html = renderToStaticMarkup(
        createElement(WordSpellingResult, {
            statistics: null,
            oralEnabled: false,
            onOral: rejectAction,
            controls,
        }),
    )
    assert.match(html, /data-word-input-oral-slot/)
    assert.doesNotMatch(html, /data-practice-quick-oral/)
    assert.match(html, /data-word-meaning-variants/)
    assert.match(html, /aria-pressed="true"[^>]*>句中辩义<\/button>/)
    const enabled = renderToStaticMarkup(
        createElement(WordSpellingResult, {
            statistics: null,
            oralEnabled: true,
            onOral: rejectAction,
            controls,
        }),
    )
    assert.match(enabled, /data-practice-quick-oral/)
    const dictation = renderToStaticMarkup(
        createElement(WordSpellingResult, {
            statistics: null,
            oralEnabled: false,
            onOral: rejectAction,
        }),
    )
    assert.doesNotMatch(dictation, /data-word-meaning-variants/)
})
