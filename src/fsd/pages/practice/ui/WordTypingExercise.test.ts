import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticePhase } from '../model/practice-demo'
import { WordTypingExercise } from './WordTypingExercise'

function rejectAction(): never {
    throw new Error('指法预渲染不得编辑、提交或注册运行时控制器')
}

interface RenderOptions {
    readonly phase?: PracticePhase
    readonly input?: string
    readonly copy?: boolean
    readonly blocked?: boolean
    readonly imageVisible?: boolean
    readonly translationVisible?: boolean
}

function renderExercise({
    phase = 'answering',
    input = 'wo',
    copy = true,
    blocked = false,
    imageVisible = true,
    translationVisible = true,
}: RenderOptions = {}): string {
    const question = getDemoQuestions('word', 'typing')[0]
    if (!question) throw new Error('缺少指法模拟题')
    return renderToStaticMarkup(
        createElement(WordTypingExercise, {
            question,
            phase,
            input,
            blocked,
            copy,
            imageVisible,
            translationVisible,
            ignoreCase: true,
            onInput: rejectAction,
            onPlay: rejectAction,
            onSubmit: rejectAction,
            onController: rejectAction,
        }),
    )
}

test('单词指法抄写与默写保持同一真实输入、五个字母位及只读键盘', (): void => {
    const copying = renderExercise()
    const recalling = renderExercise({ copy: false })
    for (const html of [copying, recalling]) {
        assert.equal((html.match(/<input\b/g) ?? []).length, 1)
        assert.match(html, /<input[^>]*value="wo"/)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        assert.match(html, /data-keyboard-active="true"/)
        assert.match(html, /data-target="true"/)
        assert.match(html, /data-practice-media="true"/)
        assert.doesNotMatch(html, /确认输入|data-word-phonetics|data-word-slot-input/)
    }
    assert.match(copying, /data-spelling-letter="empty" class="relative inline-block/)
    assert.match(recalling, /data-spelling-letter="empty" class="invisible relative/)
})

test('答对或揭晓后保留图片、释义与键盘，显示完整词但不能继续录入', (): void => {
    for (const phase of ['correct', 'revealed'] as const) {
        const html = renderExercise({ phase, input: phase === 'correct' ? 'woman' : 'wo' })
        assert.match(html, /data-practice-media="true"/)
        assert.match(html, /data-word-typing-translation="true"/)
        if (phase === 'correct') {
            assert.doesNotMatch(html, /<input\b|data-spelling-cursor-active/)
            assert.equal((html.match(/data-word-card-guideline="true"/g) ?? []).length, 4)
            assert.match(html, /<h2[^>]*text-practice-answer[^>]*><span\b[^>]*>woman<\/span><\/h2>/)
            assert.match(html, /aria-label="朗读当前单词"/)
        } else {
            const input = html.match(/<input\b[^>]*>/)?.[0]
            assert.ok(input)
            assert.match(input, /\bvalue="woman"/)
            assert.match(input, /\bdisabled=""/)
            assert.equal((html.match(/data-spelling-letter="entered"/g) ?? []).length, 5)
            assert.doesNotMatch(html, /data-word-card-guideline/)
        }
        assert.match(html, /data-keyboard-active="false"/)
        assert.doesNotMatch(html, /data-target="true"/)
    }
})

test('暂停阻断键盘反馈，图片与翻译显隐不新增输入或题目内容', (): void => {
    const paused = renderExercise({ blocked: true })
    assert.match(paused, /data-keyboard-active="false"/)
    assert.match(paused, /<input[^>]*disabled=""/)
    const hidden = renderExercise({ imageVisible: false, translationVisible: false })
    assert.doesNotMatch(hidden, /data-practice-media|n\.妇女/)
    assert.match(hidden, /data-word-typing-translation="true" aria-hidden="true"/)
    assert.equal((hidden.match(/<input\b/g) ?? []).length, 1)
})
