import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    LearningSettingsProvider,
    useLearningSettingsSnapshot,
} from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import { getDemoQuestions } from '../model/practice-demo'
import { AnnotatedText } from './AnnotatedText'

interface AnnotationFixtureProps {
    readonly variant?: 'default' | 'sentence-listening'
    readonly values?: Partial<LearningPreferences>
    readonly density?: 'exercise' | 'reading'
}

function AnnotationFixture({ variant, values, density }: AnnotationFixtureProps): ReactElement {
    const snapshot = useLearningSettingsSnapshot()
    const question = getDemoQuestions('sentence')[0]
    if (!question) throw new Error('缺少句子夹具')
    return createElement(AnnotatedText, {
        question,
        values: { ...snapshot.values, ...values },
        annotated: true,
        ...(variant ? { variant } : {}),
        ...(density ? { density } : {}),
    })
}

function renderAnnotation(props: AnnotationFixtureProps): string {
    return renderToStaticMarkup(
        createElement(LearningSettingsProvider, null, createElement(AnnotationFixture, props)),
    )
}

test('听力显式变体按音标、词性、英文、划线、词义、成分的顺序展示显式数据', (): void => {
    const html = renderAnnotation({ variant: 'sentence-listening' })
    const firstToken = html.split('data-listening-token="read"')[0] ?? ''
    assert.deepEqual(
        Array.from(firstToken.matchAll(/data-listening-layer="([^"]+)"/g), (match) => match[1]),
        ['phonetic', 'pos', 'english', 'underline', 'meaning', 'syntax'],
    )
    assert.match(html, /成分待核对/)
    assert.match(html, /一起/)
    assert.doesNotMatch(html, /<input|<audio|<button/)
})

test('词性、成分文字、填充和音标分别开关，关闭成分文字或填充仍保留划线', (): void => {
    const html = renderAnnotation({
        variant: 'sentence-listening',
        values: {
            showPartOfSpeech: false,
            showGrammarText: false,
            showAnswerPhonetics: false,
            showGrammarFill: true,
        },
    })
    assert.doesNotMatch(html, /data-listening-layer="(?:pos|syntax|phonetic)"/)
    assert.equal(html.match(/data-listening-layer="underline"/g)?.length, 4)
    assert.equal(html.match(/data-listening-layer="fill"/g)?.length, 4)
    const noFill = renderAnnotation({
        variant: 'sentence-listening',
        values: { showGrammarFill: false },
    })
    assert.doesNotMatch(noFill, /data-listening-layer="fill"/)
    assert.equal(noFill.match(/data-listening-layer="underline"/g)?.length, 4)
    assert.equal(noFill.match(/data-listening-layer="syntax"/g)?.length, 4)
})

test('填充亮度的最小、默认和最大值只在独立填充节点改变透明度', (): void => {
    for (const brightness of [1, 4, 10]) {
        const html = renderAnnotation({
            variant: 'sentence-listening',
            values: { showGrammarFill: true, grammarBrightness: brightness },
        })
        const styledLayers = Array.from(
            html.matchAll(/<span[^>]*data-listening-layer="fill"[^>]*style="([^"]+)"/g),
            (match) => match[1],
        )
        assert.deepEqual(styledLayers, Array(4).fill(`opacity:${brightness / 10}`))
        assert.equal(html.match(/opacity:/g)?.length, 4)
        assert.equal(html.match(/data-listening-layer="pos"/g)?.length, 4)
        assert.equal(html.match(/data-listening-layer="syntax"/g)?.length, 4)
    }
})

test('默认和阅读消费者不自动进入听力变体', (): void => {
    assert.equal(renderAnnotation({}), renderAnnotation({ variant: 'default' }))
    for (const props of [{}, { density: 'reading' as const }]) {
        const html = renderAnnotation(props)
        assert.doesNotMatch(html, /data-listening-layer|data-annotation-variant/)
        assert.match(html, /aria-label="逐词解析"/)
    }
})
