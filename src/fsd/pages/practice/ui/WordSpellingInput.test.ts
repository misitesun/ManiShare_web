import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoWordPhonetics } from '../model/word-phonetics-demo'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { createWordSpellingLayout } from '../model/word-spelling-input'
import { WordSpellingInput } from './WordSpellingInput'
import { PracticeAnswerInput } from './PracticeAnswerInput'

function rejectAction(): never {
    throw new Error('预渲染不得提交、注册控制器或改写输入')
}

function renderInput(mode: WordPhoneticMode, showWordHint = false, blocked = false): string {
    return renderToStaticMarkup(
        createElement(WordSpellingInput, {
            layout: createWordSpellingLayout(
                'woman',
                mode,
                getDemoWordPhonetics('woman', '/ˈwʊmən/'),
            ),
            initialValue: 'w',
            blocked,
            ignoreCase: true,
            showWordHint,
            onChange: rejectAction,
            onSubmit: rejectAction,
            onController: rejectAction,
            onSegmentPulse: rejectAction,
        }),
    )
}

test('四档共用五个字母位和一个真实输入，拆分模式按映射渲染两段或五段', (): void => {
    for (const [mode, count] of [
        ['original', 1],
        ['none', 1],
        ['syllables', 2],
        ['phonics', 5],
    ] as const) {
        const html = renderInput(mode)
        assert.equal((html.match(/<input\b/g) ?? []).length, 1)
        assert.match(html, /<input[^>]*value="w"/)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        assert.equal((html.match(/data-word-spelling-segment=/g) ?? []).length, count)
        assert.equal((html.match(/data-spelling-letter="empty"/g) ?? []).length, 4)
        assert.match(html, /data-spelling-letter="entered"[^>]*text-practice-answer/)
        assert.match(html, /data-spelling-errors=""/)
        assert.doesNotMatch(html, /autofocus|data-word-slot=/)
    }
    assert.match(renderInput('original'), /left-\[10%\] h-1 w-\[80%\]/)
    assert.match(renderInput('syllables'), /left-0 h-1 w-full/)
})

test('抄写提示仅显示空位，默写隐藏字形但保留相同字母几何和原生值', (): void => {
    const copying = renderInput('phonics', true)
    const recalling = renderInput('phonics')
    assert.match(
        copying,
        /data-spelling-letter="empty" class="relative inline-block leading-none text-practice-muted"/,
    )
    assert.match(
        recalling,
        /data-spelling-letter="empty" class="invisible relative inline-block leading-none text-practice-muted"/,
    )
    for (const html of [copying, recalling]) {
        assert.match(html, /<input[^>]*value="w"/)
        assert.ok(
            (html.match(/<button\b[^>]*>/g) ?? []).every((tag) => tag.includes('tabindex="-1"')),
        )
        assert.match(html, /data-spelling-cursor-active="false"/)
        assert.match(html, /<label[^>]*>练习答案<\/label>/)
    }
})

test('阻断期间字母位和原生输入均禁用，不伪造通过或错误态', (): void => {
    const html = renderInput('syllables', true, true)
    assert.match(html, /<input[^>]*disabled=""/)
    assert.ok((html.match(/<button\b[^>]*>/g) ?? []).every((tag) => tag.includes('disabled=""')))
    assert.doesNotMatch(html, /data-spelling-letter="incorrect"/)
})

test('句中行内与默写的整词回退共用字母、错误颜色和逐位底线渲染', (): void => {
    const layout = createWordSpellingLayout('woman', 'syllables')
    const render = (inline: boolean): string =>
        renderToStaticMarkup(
            createElement(PracticeAnswerInput, {
                layout,
                initialValue: 'wowww',
                feedback: { value: 'wowww', wrong: [2, 3, 4] },
                blocked: false,
                ignoreCase: true,
                showWordHint: false,
                presentation: inline ? 'inline' : 'spelling',
                onChange: rejectAction,
            }),
        )
    const spelling = render(false)
    const inline = render(true)
    for (const html of [spelling, inline]) {
        assert.equal((html.match(/<input\b/g) ?? []).length, 1)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        assert.match(html, /data-answer-cursor="2"/)
        assert.match(html, /data-spelling-errors="2,3,4"/)
        assert.equal((html.match(/data-spelling-letter="incorrect"/g) ?? []).length, 3)
    }
    assert.deepEqual(
        inline.match(/<span data-spelling-letter=[^>]*>[^<]*<\/span>/g),
        spelling.match(/<span data-spelling-letter=[^>]*>[^<]*<\/span>/g),
    )
    assert.deepEqual(
        inline.match(/<span data-spelling-cursor-active=[^>]*>/g),
        spelling.match(/<span data-spelling-cursor-active=[^>]*>/g),
    )
})
