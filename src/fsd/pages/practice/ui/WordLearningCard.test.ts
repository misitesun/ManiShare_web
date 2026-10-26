import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoQuestions } from '../model/practice-demo'
import { WordLearningCard } from './WordLearningCard'
import { WordPronunciationCard } from './WordPronunciationCard'
import { GuessWordExercise } from './GuessWordExercise'

function ignore(): void {}

test('共用单词卡保留原500px形态，猜词变体展示同一词条且使用自身词图', (): void => {
    const question = getDemoQuestions('guess', 'guess')[0]
    assert.ok(question)
    const props = {
        question,
        showImage: true,
        showTranslation: true,
        analysisId: 'analysis',
        onPlay: ignore,
        onAnalysis: ignore,
        onAdd: ignore,
    }
    const original = renderToStaticMarkup(createElement(WordLearningCard, props))
    assert.match(original, /max-w-\[500px\]/)
    assert.match(original, /data-word-card-border/)
    assert.match(original, /data-word-dictionary-link/)
    assert.doesNotMatch(original, /单词卡片内容，可滚动/)
    const compact = renderToStaticMarkup(
        createElement(WordLearningCard, {
            ...props,
            layout: 'guess',
            imageSource: question.guess?.image,
            phoneticMode: 'phonics',
        }),
    )
    assert.match(compact, /max-w-\[360px\]/)
    assert.match(compact, /data-word-card-border/)
    assert.match(compact, /data-word-phonetic-segment/)
    assert.ok(question.guess?.image && compact.includes(question.guess.image))
    assert.match(compact, /查看当前单词解析/)
    assert.match(compact, /单词卡片内容，可滚动/)
})

test('猜词共用翻面卡保留正反面尺寸与交互隔离，解析按钮关联实际背面', (): void => {
    const question = getDemoQuestions('guess', 'guess')[0]
    assert.ok(question)
    for (const analysisOpen of [false, true]) {
        const html = renderToStaticMarkup(
            createElement(WordPronunciationCard, {
                question,
                layout: 'guess',
                cardHeight: 280,
                showImage: true,
                showTranslation: true,
                analysisOpen,
                imageSource: question.guess?.image,
                onPlay: ignore,
                onAnalysis: ignore,
                onAnalysisClose: ignore,
                onExamplePlay: ignore,
                onAdd: ignore,
            }),
        )
        assert.match(html, /max-w-\[360px\]/)
        assert.match(html, /data-word-card-border/)
        assert.match(html, /hand 的单词解析/)
        assert.match(html, /height:280px/)
        const faces = Array.from(html.matchAll(/<div\b[^>]*aria-hidden="(?:true|false)"[^>]*>/g))
        assert.equal(faces.length, 2)
        assert.ok(faces[0]?.[0].includes(`aria-hidden="${analysisOpen}"`))
        assert.ok(faces[1]?.[0].includes(`aria-hidden="${!analysisOpen}"`))
        assert.equal(faces[0]?.[0].includes('inert=""'), analysisOpen)
        assert.equal(faces[1]?.[0].includes('inert=""'), !analysisOpen)
        const analysisId = html.match(/aria-controls="([^"]+)"/)?.[1]
        assert.ok(analysisId && html.includes(`id="${analysisId}"`))
    }
})

test('猜词预渲染没有作答框或额外提交按钮，图片开关不隐藏目标词', (): void => {
    const question = getDemoQuestions('guess', 'guess')[0]
    assert.ok(question)
    const props = {
        question,
        blocked: false,
        showImage: true,
        answerOpen: false,
        onToggleAnswer: ignore,
        onCloseAnswer: ignore,
        onPlay: ignore,
        onExamplePlay: ignore,
        onNotice: ignore,
    }
    const html = renderToStaticMarkup(createElement(GuessWordExercise, props))
    assert.match(html, /他有一双肥嘟嘟的/)
    assert.match(html, /查看 hand 的答案/)
    assert.match(html, /aria-expanded="false"/)
    assert.doesNotMatch(html, /<input|显示答案|提交作答|快捷口语评测/)
    const hidden = renderToStaticMarkup(
        createElement(GuessWordExercise, { ...props, showImage: false }),
    )
    assert.doesNotMatch(hidden, /data-practice-media/)
    assert.match(hidden, /查看 hand 的答案/)
})
