import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PracticePhase } from '../model/practice-demo'
import { canShowQuickOral } from '../model/practice-visibility'
import { WordSpellingResult } from './WordSpellingResult'

function rejectOral(): never {
    throw new Error('预渲染统计不应启动口语')
}

function renderResult(
    phase: PracticePhase,
    showEvaluation = true,
    submissions = 0,
    correct = 0,
): string {
    return renderToStaticMarkup(
        createElement(WordSpellingResult, {
            statistics: { submissions, correct },
            oralEnabled: canShowQuickOral('word', 'spell', phase, true, showEvaluation),
            onOral: rejectOral,
        }),
    )
}

test('未答、答错、揭晓和答对均展示三项统计，初始为零，只有答对开放口语入口', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const html = renderResult(phase)
        assert.match(html, /data-word-spelling-statistics="true"/)
        assert.equal((html.match(/<dt\b/g) ?? []).length, 3)
        assert.equal((html.match(/<dd\b[^>]*>0<\/dd>/g) ?? []).length, 2)
        assert.match(html, /<dd\b[^>]*>0%<\/dd>/)
        if (phase === 'correct') assert.match(html, /data-practice-quick-oral="true"/)
        else assert.doesNotMatch(html, /data-practice-quick-oral|口语评测/)
        assert.match(html, /data-word-spelling-oral-slot="true"[^>]*h-\[46px\]/)
    }
})

test('错误后的本轮统计继续显示，关闭口语设置不隐藏统计或留下可点击的空按钮', (): void => {
    const html = renderResult('incorrect', true, 3, 1)
    assert.match(html, /<dd\b[^>]*>3<\/dd>/)
    assert.match(html, /<dd\b[^>]*>1<\/dd>/)
    assert.match(html, /<dd\b[^>]*>33%<\/dd>/)
    const withoutOral = renderResult('correct', false, 4, 2)
    assert.match(withoutOral, /<dd\b[^>]*>50%<\/dd>/)
    assert.match(withoutOral, /data-word-spelling-oral-slot="true" aria-hidden="true"/)
    assert.doesNotMatch(withoutOral, /<button|data-practice-quick-oral/)
})
