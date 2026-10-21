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
import { createWordToolbarOptions } from '../model/word-toolbar-options'
import type { WordToolbarOptions } from '../model/word-toolbar-options'
import { PracticeContent } from './PracticeContent'

interface ContentFixtureProps {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly analysis?: boolean
    readonly reading?: boolean
    readonly imageVisible?: boolean
    readonly wordOptions?: WordToolbarOptions
    readonly phoneticsEnabled?: boolean
    readonly input?: string
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
    wordOptions,
    phoneticsEnabled,
    input = 'local answer',
}: ContentFixtureProps): ReactElement {
    const snapshot = useLearningSettingsSnapshot()
    const demo = practiceDemos.find((entry) => entry.family === family)
    const question = getDemoQuestions(family, mode)[0]
    if (!demo || !question) throw new Error('Missing content fixture')
    return createElement(PracticeContent, {
        demo,
        mode,
        question,
        session: { ...initialPracticeSession, phase, input },
        values: {
            ...snapshot.values,
            ...(phoneticsEnabled === undefined
                ? {}
                : { showPhonetics: phoneticsEnabled, showAnswerPhonetics: phoneticsEnabled }),
        },
        ...(wordOptions ? { wordOptions } : {}),
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

test('单词拼写的默写和抄写控制输入提示，已有输入保留，其他模式不启用该提示', (): void => {
    const options = createWordToolbarOptions('spell')
    const props: ContentFixtureProps = {
        family: 'word',
        mode: 'spell',
        phase: 'answering',
        input: 'w',
    }
    const copying = renderContent({ ...props, wordOptions: { ...options, copy: true } })
    assert.match(
        copying,
        /data-spelling-letter="empty" class="relative inline-block leading-none text-practice-muted"/,
    )
    assert.match(copying, /<input[^>]*value="w"/)
    const recalling = renderContent({ ...props, wordOptions: { ...options, copy: false } })
    assert.match(
        recalling,
        /data-spelling-letter="empty" class="invisible relative inline-block leading-none text-practice-muted"/,
    )
    assert.match(recalling, /<input[^>]*value="w"/)
    const dictation = renderContent({
        ...props,
        mode: 'dictate',
        wordOptions: { ...createWordToolbarOptions('dictate'), copy: true },
    })
    assert.match(dictation, /data-spelling-mode="segments"/)
    assert.match(
        dictation,
        /data-spelling-letter="empty" class="relative inline-block leading-none text-practice-muted"/,
    )
    const dictationRecall = renderContent({
        ...props,
        mode: 'dictate',
        wordOptions: { ...createWordToolbarOptions('dictate'), copy: false },
    })
    assert.match(dictationRecall, /data-spelling-letter="empty" class="invisible/)
    assert.doesNotMatch(dictation, /data-word-slot-hint/)
    assert.doesNotMatch(
        renderContent({ family: 'sentence', mode: 'translate', phase: 'answering', input: 'w' }),
        /data-word-spelling-input|data-word-slot-hint/,
    )
})

test('单词拼写四档音标使用局部选择，输入和答案的全局显隐不再覆盖工具栏', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        for (const phonetics of ['original', 'syllables', 'phonics', 'none'] as const) {
            const html = renderContent({
                family: 'word',
                mode: 'spell',
                phase,
                phoneticsEnabled: false,
                wordOptions: { ...createWordToolbarOptions('spell'), phonetics },
            })
            if (phonetics === 'none') assert.doesNotMatch(html, /data-word-phonetics=/)
            else assert.ok(html.includes(`data-word-phonetics="${phonetics}"`))
        }
})

test('全部真实文本输入分支共用推进器，只有单词卡保留逐字视觉分组', (): void => {
    for (const [family, mode] of [
        ['word', 'spell'],
        ['word', 'dictate'],
        ['word', 'meaning'],
        ['word', 'typing'],
        ['sentence', 'translate'],
        ['sentence', 'typing'],
        ['picture', 'translate'],
        ['picture', 'typing'],
        ['audio', 'translate'],
        ['video', 'translate'],
        ['guess', 'spell'],
        ['guess', 'guess'],
        ['typing', 'typing'],
    ] as const) {
        const html = renderContent({ family, mode, phase: 'answering' })
        assert.equal(
            (html.match(/<input[^>]*data-practice-answer-input/g) ?? []).length,
            1,
            `${family}:${mode}`,
        )
        assert.match(html, /data-practice-controlled-answer="true"/)
        if (family !== 'word' || (mode !== 'spell' && mode !== 'dictate'))
            assert.match(html, /data-word-slot-input="true"/)
    }
})

test('切换拆分时输入字母保持一致，音标定位仅在已映射的可编辑拼写题面启用', (): void => {
    const options = createWordToolbarOptions('spell')
    for (const phonetics of ['original', 'none', 'syllables', 'phonics'] as const) {
        const html = renderContent({
            family: 'word',
            mode: 'spell',
            phase: 'answering',
            input: 'wo',
            wordOptions: { ...options, phonetics },
        })
        assert.match(html, /<input[^>]*value="wo"/)
        assert.equal((html.match(/data-spelling-position="\d+"/g) ?? []).length, 5)
        if (phonetics === 'syllables' || phonetics === 'phonics')
            assert.match(html, /aria-label="定位 woman 中的 /)
        else assert.doesNotMatch(html, /aria-label="定位 woman 中的 /)
    }
    assert.doesNotMatch(
        renderContent({
            family: 'word',
            mode: 'spell',
            phase: 'correct',
            wordOptions: { ...options, phonetics: 'phonics' },
        }),
        /aria-label="定位 woman 中的 /,
    )
})

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
        const html = renderContent({ family: 'sentence', mode: 'translate', phase, input: 'We re' })
        assert.match(html, /value="Were"/)
        assert.doesNotMatch(html, /data-practice-english/)
    }
    for (const phase of ['revealed', 'correct'] as const)
        assert.match(
            renderContent({ family: 'sentence', mode: 'translate', phase, input: 'We re' }),
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

test('默写答对态保留题图并移除编辑框，未答及答错态保留可编辑输入', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const html = renderContent({ family: 'word', mode: 'dictate', phase, input: 'wo' })
        assert.match(html, /data-practice-media/)
        assert.match(html, /value="wo"/)
    }
    const correct = renderContent({ family: 'word', mode: 'dictate', phase: 'correct' })
    assert.match(correct, /data-practice-media/)
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
