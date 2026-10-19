import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticeQuestion } from '../model/practice-demo'
import borderAsset from '../assets/word-card-gradient-border.svg'
import { WordPronunciationDeck } from './WordPronunciationDeck'

function rejectAction(): never {
    throw new Error('卡堆预渲染不得执行交互或提交动作')
}

function renderFaces(
    questions: readonly PracticeQuestion[],
    index: number,
    showImage = true,
    displayFontSize?: number,
): string[] {
    const question = questions[index]
    assert.ok(question)
    const html = renderToStaticMarkup(
        createElement(WordPronunciationDeck, {
            question,
            questions,
            index,
            showImage,
            showTranslation: true,
            displayFontSize,
            busy: false,
            blocked: false,
            isBlocked: (): boolean => false,
            remembering: false,
            onNavigate: rejectAction,
            onBusyChange: rejectAction,
            onController: rejectAction,
            onDragStart: rejectAction,
            onKnown: rejectAction,
            onRetry: rejectAction,
            onRememberFeedbackComplete: rejectAction,
            onPlay: rejectAction,
            onNote: rejectAction,
            onLookup: rejectAction,
            onAdd: rejectAction,
        }),
    )
    return Array.from(
        html.matchAll(/<article\b[^>]*data-word-card-face[^>]*>[\s\S]*?<\/article>/g),
        (match) => match[0],
    )
}

function assertUniformOutline(faces: readonly string[], count: number): void {
    assert.equal(faces.length, count)
    for (const face of faces) {
        const border = /data-word-card-border\b[^>]*src="([^"]+)"/.exec(face)
        assert.ok(border)
        assert.equal(border[1], borderAsset.src, '每张真实卡均保留前卡渐变描边')
        const surface = /data-word-card-surface\b[^>]*style="([^"]+)"/.exec(face)
        assert.ok(surface)
        assert.match(
            surface[1] ?? '',
            /(?:^|;)border-radius:4% \/ 4%(?:;|$)/,
            '裁切与同一描边轮廓一致',
        )
    }
}

test('拼读卡在首题、中间题和末题均使用相同描边及圆角', (): void => {
    const questions = getDemoQuestions('word', 'pronounce')
    for (const index of [0, 4, questions.length - 1])
        assertUniformOutline(renderFaces(questions, index), questions.length)
})

test('再来重排和记住删除后的剩余卡不按业务题序更换描边', (): void => {
    const questions = getDemoQuestions('word', 'pronounce')
    const first = questions[0]
    assert.ok(first)
    const requeued = [...questions.slice(1), first]
    const remaining = requeued.filter((question) => question.id !== 'girl')
    for (const queue of [requeued, remaining, remaining.slice(-2), remaining.slice(-1)])
        assertUniformOutline(renderFaces(queue, 0), queue.length)
})

test('隐藏图片或自定义字号时仍使用相同的流式描边与裁切轮廓', (): void => {
    const questions = getDemoQuestions('word', 'pronounce')
    assertUniformOutline(renderFaces(questions, 0, false), questions.length)
    assertUniformOutline(renderFaces(questions, 0, true, 48), questions.length)
})
