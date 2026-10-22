import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticePhase } from '../model/practice-demo'
import { getWordDictionaryUrl } from '../model/word-dictionary'
import type { WordSpellingQuestionDirection } from '../model/word-spelling-question-motion'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { WordAnswerCard } from './WordAnswerCard'

function rejectAction(): never {
    throw new Error('卡牌预渲染不能提交、打开解析或触发通知')
}

function renderCard(
    mode: 'spell' | 'dictate',
    blocked = false,
    direction: WordSpellingQuestionDirection | null = null,
    phase: PracticePhase = 'answering',
    phoneticMode: WordPhoneticMode = 'original',
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
            input: 'wo',
            phoneticMode,
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
    const dictionaryLinks = html.match(/<a\b[^>]*data-word-dictionary-link[^>]*>/g) ?? []
    assert.equal(dictionaryLinks.length, 2)
    for (const link of dictionaryLinks) {
        assert.doesNotMatch(link, /\shref=/)
        assert.match(link, /aria-disabled="true"/)
        assert.match(link, /tabindex="-1"/)
    }
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

test('默写保留独立题面并复用字母位输入，不挂载拼写翻面或辅助图标', (): void => {
    const html = renderCard('dictate')
    assert.match(html, /aria-label="单词默写"/)
    assert.match(html, /value="wo"/)
    assert.match(html, /data-word-spelling-input="true"/)
    assert.doesNotMatch(
        html,
        /data-word-card-flip|data-word-analysis-trigger|data-word-dictionary-link|data-word-spelling-question-direction/,
    )
})

test('默写四档音标共用整词连续横线，输入始终保留完整五个字母位', (): void => {
    for (const mode of ['original', 'syllables', 'phonics', 'none'] as const) {
        const html = renderCard('dictate', false, null, 'answering', mode)
        assert.match(html, /data-spelling-mode="segments"/)
        assert.doesNotMatch(html, /data-spelling-word-underline/)
        assert.match(html, /left-0 h-1 w-full/)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        assert.equal((html.match(/data-word-spelling-segment=/g) ?? []).length, 1)
        assert.doesNotMatch(html, /min-w-\[min\(200px/)
    }
})

test('默写正确态保留图片与同一单词槽，展示四条虚线与朗读按钮，阻断时朗读不可用', (): void => {
    for (const blocked of [false, true]) {
        const html = renderCard('dictate', blocked, null, 'correct')
        assert.equal((html.match(/data-word-card-guideline=/g) ?? []).length, 4)
        assert.match(html, /data-practice-media/)
        assert.match(html, /data-word-dictation-word-slot="true"/)
        assert.match(html, /design:h-\[510px\]/)
        assert.doesNotMatch(html, /data-practice-answer-input|data-spelling-word-underline/)
        const play = html.match(/<button\b[^>]*aria-label="朗读当前单词"[^>]*>/)?.[0] ?? ''
        assert.ok(play)
        assert.equal(play.includes('disabled=""'), blocked)
    }
})

test('默写未答、答错与正确共用图片区和单词占位，不展示旧演示判题文案', (): void => {
    for (const phase of ['answering', 'incorrect', 'correct'] as const) {
        const html = renderCard('dictate', false, null, phase)
        assert.match(html, /data-practice-media/)
        assert.match(html, /data-word-dictation-word-slot="true"/)
        assert.doesNotMatch(html, /当前不执行判题|design:h-\[320px\]/)
    }
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
