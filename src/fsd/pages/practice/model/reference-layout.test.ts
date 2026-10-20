import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    LearningSettingsProvider,
    useLearningSettingsSnapshot,
} from '../../../features/learning-settings'
import { SentenceExercise } from '../ui/SentenceExercise'
import { getDemoQuestions, initialPracticeSession } from './practice-demo'
import type { PracticePhase } from './practice-demo'
import {
    getPracticeReference,
    getSentenceExerciseReference,
    getSentenceListeningReference,
} from './reference-layout'
import type { SentenceExerciseMode } from './reference-layout'

const sentenceModes: readonly SentenceExerciseMode[] = ['translate', 'check', 'blocks']

function ignore(): void {}

test('沉浸听力参考保留设计的全局坐标、字体角色与控件尺寸，不把文字框高当行高', (): void => {
    const reference = getSentenceListeningReference()
    assert.equal(reference.node, '546:33602')
    assert.deepEqual(reference.viewport, { width: 1920, height: 1080 })
    assert.deepEqual(reference.media, { x: 745, y: 183, width: 430, height: 242 })
    assert.deepEqual(reference.annotation, {
        phoneticTop: 484,
        phoneticFontSize: 14,
        partOfSpeechTop: 510,
        partOfSpeechWidth: 38,
        partOfSpeechHeight: 22,
        englishTop: 534,
        englishFontSize: 40,
        englishFontWeight: 500,
        underlineTop: 600,
        underlineHeight: 3,
        meaningTop: 617,
        meaningFontSize: 18,
        syntaxTop: 652,
        syntaxFontSize: 16,
    })
    assert.deepEqual(reference.translation, { y: 727, fontSize: 30, fontWeight: 500 })
    assert.deepEqual(reference.note, { x: 922, y: 797, width: 76, height: 30 })
    assert.deepEqual(reference.oral, { x: 843, y: 886, width: 234, height: 46 })
    for (const slot of [reference.media, reference.note, reference.oral])
        assert.equal(slot.x + slot.width / 2, reference.viewport.width / 2)
    const common = getPracticeReference('sentence', 'listen', 'answering')
    assert.equal(common.top + 75, reference.media.y)
    assert.equal(common.mediaWidth, reference.media.width)
    assert.equal(common.mediaHeight, reference.media.height)
})

function renderSentence(mode: SentenceExerciseMode, phase: PracticePhase): string {
    const question = getDemoQuestions('sentence')[0]
    if (!question) throw new Error('句子演示题缺失')
    function SentenceWithSettings(): ReactElement {
        const { values } = useLearningSettingsSnapshot()
        return createElement(SentenceExercise, {
            question,
            mode,
            session: { ...initialPracticeSession, phase, input: 'Keep my draft', blocks: ['read'] },
            values,
            imageVisible: true,
            blocked: false,
            onInput: ignore,
            onBlock: ignore,
            onReveal: ignore,
        })
    }
    return renderToStaticMarkup(
        createElement(LearningSettingsProvider, null, createElement(SentenceWithSettings)),
    )
}

test('句子答错仍使用各模式编辑布局，不进入揭晓解析', (): void => {
    for (const mode of sentenceModes) {
        const initial = getSentenceExerciseReference(mode, 'answering')
        const incorrect = getSentenceExerciseReference(mode, 'incorrect')
        assert.equal(incorrect.node, initial.node)
        assert.notEqual(incorrect.mediaTop, null)
        assert.equal(incorrect.annotationTop, null)
    }
    const translate = renderSentence('translate', 'incorrect')
    assert.match(translate, /<input/)
    assert.match(translate, /value="Keep my draft"/)
    assert.doesNotMatch(translate, /aria-label="逐词解析"/)
    const blocks = renderSentence('blocks', 'incorrect')
    assert.match(blocks, /aria-label="撤回 read"/)
    assert.doesNotMatch(blocks, /aria-label="逐词解析"/)
})

test('揭晓与答对都进入无输入、无题图的结果布局，不替换本轮状态', (): void => {
    for (const mode of sentenceModes)
        for (const phase of ['revealed', 'correct'] as const) {
            const reference = getSentenceExerciseReference(mode, phase)
            assert.equal(reference.mediaTop, null)
            assert.equal(reference.inputLineTop, null)
            assert.equal(reference.trayTop, null)
            assert.notEqual(reference.annotationTop, null)
            const markup = renderSentence(mode, phase)
            assert.doesNotMatch(markup, /data-practice-media/)
            assert.doesNotMatch(markup, /<input/)
            assert.match(markup, /aria-label="逐词解析"/)
        }
})

test('理解自查未揭晓时只有英文题面与揭晓入口，不预先显示中文', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const reference = getSentenceExerciseReference('check', phase)
        assert.notEqual(reference.englishTop, null)
        assert.notEqual(reference.revealTop, null)
        assert.equal(reference.translationTop, null)
        const markup = renderSentence('check', phase)
        assert.match(markup, /data-practice-english/)
        assert.match(markup, />显示答案<\/button>/)
        assert.doesNotMatch(markup, /data-practice-translation/)
        assert.doesNotMatch(markup, /<input/)
    }
    assert.match(renderSentence('check', 'revealed'), /data-practice-translation/)
})
