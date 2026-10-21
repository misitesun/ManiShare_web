import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticePhase } from '../model/practice-demo'
import { getWordDictionaryUrl } from '../model/word-dictionary'
import type { WordSpellingQuestionDirection } from '../model/word-spelling-question-motion'
import { WordAnswerCard } from './WordAnswerCard'

function rejectAction(): never {
    throw new Error('卡牌预渲染不能提交、打开解析或触发通知')
}

function renderCard(
    mode: 'spell' | 'dictate',
    blocked = false,
    direction: WordSpellingQuestionDirection | null = null,
    phase: PracticePhase = 'answering',
): string {
    const question = getDemoQuestions('word', mode)[0]
    const previous = getDemoQuestions('word', mode)[1]
    assert.ok(question)
    assert.ok(previous)
    return renderToStaticMarkup(
        createElement(WordAnswerCard, {
            question,
            mode,
            phase,
            input: mode === 'spell' ? 'wo' : '保留的输入',
            onInput: rejectAction,
            onSubmit: rejectAction,
            onNotice: rejectAction,
            blocked,
            showImage: true,
            showTranslation: true,
            showPhonetics: true,
            questionRevision: direction ? 1 : 0,
            questionTransition: direction
                ? {
                      direction,
                      previous: {
                          key: `${previous.id}:0`,
                          question: previous,
                          phase: 'correct',
                          input: previous.english,
                      },
                  }
                : null,
        }),
    )
}

test('拼写首屏保留答案输入，三个图标为解析、当前词外链及不熟，背面默认关闭', (): void => {
    const question = getDemoQuestions('word', 'spell')[0]
    assert.ok(question)
    const html = renderCard('spell')
    assert.match(html, /data-word-analysis-open="false"/)
    assert.match(
        html,
        /data-word-analysis-trigger[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"/,
    )
    assert.match(html, /aria-label="查看当前单词解析"/)
    assert.match(html, /aria-label="标记当前单词为不熟"/)
    assert.match(html, /value="wo"/)
    assert.match(html, /data-word-spelling-input="true"/)
    assert.ok(html.includes(`href="${getWordDictionaryUrl(question.english)}"`))
    assert.match(html, /target="_blank" rel="noopener noreferrer"/)
    assert.match(html, /aria-hidden="true" inert=""/)
    assert.doesNotMatch(html, /记录当前单词笔记|<iframe|<audio/)
})

test('阻断时拼写解析、不熟及两面的词典外链均不可操作', (): void => {
    const html = renderCard('spell', true)
    assert.match(html, /data-word-analysis-trigger[^>]*disabled=""/)
    assert.match(html, /disabled=""[^>]*aria-label="标记当前单词为不熟"/)
    assert.doesNotMatch(html, /\shref=/)
    assert.match(html, /aria-disabled="true" tabindex="-1"/)
})

test('拼写两态共用占位，隐藏的编辑器或朗读入口不进入交互与读屏', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const html = renderCard('spell', false, null, phase)
        assert.match(html, /data-word-spelling-word-slot="true"/)
        const editor = html.match(/<div\b[^>]*data-word-spelling-editor[^>]*>/)?.[0] ?? ''
        const result = html.match(/<div\b[^>]*data-word-spelling-word-result[^>]*>/)?.[0] ?? ''
        const input = html.match(/<input\b[^>]*>/)?.[0] ?? ''
        const play = html.match(/<button\b[^>]*aria-label="朗读当前单词"[^>]*>/)?.[0] ?? ''
        assert.ok(input)
        assert.ok(play)
        if (phase === 'answering' || phase === 'incorrect') {
            assert.match(editor, /aria-hidden="false"/)
            assert.doesNotMatch(editor, /inert=""/)
            assert.doesNotMatch(input, /disabled=""/)
        } else {
            assert.match(editor, /aria-hidden="true" inert=""/)
            assert.match(input, /disabled=""/)
        }
        if (phase === 'correct') {
            assert.match(result, /aria-hidden="false"/)
            assert.doesNotMatch(result, /inert=""/)
            assert.doesNotMatch(play, /disabled=""/)
        } else {
            assert.match(result, /aria-hidden="true" inert=""/)
            assert.match(play, /disabled=""/)
        }
    }
})

test('默写保留原题面与原生输入，不挂载拼写翻面或辅助图标', (): void => {
    const html = renderCard('dictate')
    assert.match(html, /aria-label="单词默写"/)
    assert.match(html, /value="保留的输入"/)
    assert.doesNotMatch(
        html,
        /data-word-card-flip|data-word-analysis-trigger|data-word-dictionary-link|data-word-spelling-question-direction/,
    )
})

test('拼写切题在解析外层保留旧题作为离场面，旧面禁止交互、新题仍可作答', (): void => {
    for (const direction of ['next', 'previous', null] as const) {
        const html = renderCard('spell', false, direction)
        const motionIndex = html.indexOf(
            `data-word-spelling-question-direction="${direction ?? 'none'}"`,
        )
        assert.ok(motionIndex >= 0)
        assert.ok(motionIndex < html.indexOf('data-word-card-flip'))
        assert.match(html, /data-word-spelling-switching="false"/)
        const current = html.slice(html.indexOf('data-word-spelling-question-face="current"'))
        assert.match(current, /value="wo"/)
        assert.doesNotMatch(current.match(/<input\b[^>]*>/)?.[0] ?? '', /disabled=""/)
        if (direction) {
            const previous = getDemoQuestions('word', 'spell')[1]
            assert.ok(previous)
            assert.match(
                html,
                /data-word-spelling-question-face="outgoing" aria-hidden="true" inert=""/,
            )
            const outgoing = html.slice(
                0,
                html.indexOf('data-word-spelling-question-face="current"'),
            )
            assert.match(outgoing, /data-word-analysis-trigger[^>]*disabled=""/)
            assert.ok(outgoing.includes(previous.english))
        } else assert.doesNotMatch(html, /data-word-spelling-question-face="outgoing"/)
        assert.doesNotMatch(html, /rotateY|perspective\(1000px\)/)
    }
})
