import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    LearningSettingsProvider,
    useLearningSettingsSnapshot,
} from '../../../features/learning-settings'
import { getDemoQuestions, initialPracticeSession, practiceDemos } from '../model/practice-demo'
import type { PracticeFamily, PracticeMode, PracticePhase } from '../model/practice-demo'
import type { OralDemoController } from '../model/useOralDemo'
import { PracticeContent } from './PracticeContent'

interface ContentFixtureProps {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly analysis?: boolean
    readonly reading?: boolean
    readonly imageVisible?: boolean
}

function ignoreAction(): void {}

const oral: OralDemoController = {
    stage: 'idle',
    elapsed: 0,
    blocked: false,
    start: ignoreAction,
    stopAndEvaluate: ignoreAction,
    rerecord: ignoreAction,
    reset: ignoreAction,
    pause: ignoreAction,
    showResult: ignoreAction,
    showError: ignoreAction,
    replay: ignoreAction,
}

function ContentFixture({
    family,
    mode,
    phase,
    analysis = true,
    reading = false,
    imageVisible = true,
}: ContentFixtureProps): ReactElement {
    const snapshot = useLearningSettingsSnapshot()
    const demo = practiceDemos.find((entry) => entry.family === family)
    const question = getDemoQuestions(family, mode)[0]
    if (!demo || !question) throw new Error('Missing content fixture')
    return createElement(PracticeContent, {
        demo,
        mode,
        question,
        session: { ...initialPracticeSession, phase, input: 'local answer' },
        values: snapshot.values,
        imageVisible,
        blocked: false,
        additionalOptions: {
            copy: false,
            imageVisible: true,
            translationVisible: true,
            cutReading: false,
            keyboardVisible: true,
            naturalPhonics: true,
            sentenceAnalysisVisible: analysis,
        },
        onInput: ignoreAction,
        onBlock: ignoreAction,
        onNote: ignoreAction,
        oralEnabled: false,
        onOral: ignoreAction,
        onKnown: ignoreAction,
        onRetry: ignoreAction,
        onNotice: ignoreAction,
        onReveal: ignoreAction,
        onPrimary: ignoreAction,
        oralController: oral,
        onMediaController: ignoreAction,
        questions: getDemoQuestions(family, mode),
        ...(reading
            ? { reading: { status: 'pending-source' as const, waveStyle: '波形线条' } }
            : {}),
    })
}

function renderContent(props: ContentFixtureProps): string {
    return renderToStaticMarkup(
        createElement(LearningSettingsProvider, null, createElement(ContentFixture, props)),
    )
}

test('只有句子沉浸听力分派到专用入口，其他模式保留既有组合', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const html = renderContent({ family: 'sentence', mode: 'listen', phase })
        assert.match(html, /data-sentence-listening/)
        assert.match(html, /data-sentence-listening-note/)
        assert.doesNotMatch(html, /data-practice-quick-oral/)
    }
    for (const [family, mode] of [
        ['sentence', 'translate'],
        ['sentence', 'read'],
        ['sentence', 'typing'],
        ['sentence', 'oral'],
        ['audio', 'listen'],
        ['video', 'listen'],
    ] as const)
        assert.doesNotMatch(
            renderContent({ family, mode, phase: 'answering' }),
            /data-sentence-listening/,
        )
})

test('显式题态夹具验证中译英输入与揭晓，生产页不再依赖演示工具切换题态', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const html = renderContent({ family: 'sentence', mode: 'translate', phase })
        assert.match(html, /value="local answer"/)
        assert.doesNotMatch(html, /data-practice-english/)
    }
    for (const phase of ['revealed', 'correct'] as const)
        assert.match(
            renderContent({ family: 'sentence', mode: 'translate', phase }),
            /data-practice-english/,
        )
})

test('切读遮罩位于各族题图，卡堆仅当前卡展示，隐藏图片时一并隐藏', (): void => {
    for (const [family, mode] of [
        ['word', 'pronounce'],
        ['word', 'spell'],
        ['word', 'dictate'],
        ['sentence', 'translate'],
        ['sentence', 'listen'],
        ['audio', 'translate'],
        ['video', 'translate'],
        ['picture', 'translate'],
        ['guess', 'guess'],
    ] as const) {
        const html = renderContent({ family, mode, phase: 'answering', reading: true })
        assert.equal(
            html.match(/data-practice-reading-overlay="pending-source"/g)?.length,
            1,
            `${family}/${mode}只展示当前题声纹`,
        )
        assert.match(html, /data-wave-active="false"/)
        assert.match(html, /音源待接入/)
        assert.doesNotMatch(html, /data-practice-playback-wave/)
        if (family !== 'video')
            assert.doesNotMatch(
                renderContent({
                    family,
                    mode,
                    phase: 'answering',
                    reading: true,
                    imageVisible: false,
                }),
                /data-practice-reading-overlay/,
            )
    }
})

test('默写答对态隐藏题图与编辑框，未答及答错态保留可编辑输入', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const html = renderContent({ family: 'word', mode: 'dictate', phase })
        assert.match(html, /data-practice-media/)
        assert.match(html, /value="local answer"/)
    }
    const correct = renderContent({ family: 'word', mode: 'dictate', phase: 'correct' })
    assert.doesNotMatch(correct, /data-practice-media/)
    assert.doesNotMatch(correct, /aria-label="练习答案"/)
    assert.match(correct, /data-practice-english/)
})

test('视频拼块的答案解析只在答案态展示并服从局部解析偏好', (): void => {
    for (const phase of ['answering', 'incorrect'] as const)
        assert.doesNotMatch(
            renderContent({ family: 'video', mode: 'blocks', phase }),
            /aria-label="逐词解析"/,
        )
    for (const phase of ['revealed', 'correct'] as const) {
        assert.match(
            renderContent({ family: 'video', mode: 'blocks', phase }),
            /aria-label="逐词解析"/,
        )
        const hidden = renderContent({ family: 'video', mode: 'blocks', phase, analysis: false })
        assert.doesNotMatch(hidden, /aria-label="逐词解析"/)
        assert.match(hidden, /data-practice-english/)
    }
})
