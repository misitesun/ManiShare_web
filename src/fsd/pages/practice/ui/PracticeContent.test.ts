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
import type { OralAssessmentDemoController } from '../../../features/oral-assessment'
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
    readonly oralEnabled?: boolean
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

const oralAssessment: OralAssessmentDemoController = {
    ...oral,
    stage: 'idle',
    playing: false,
    result: null,
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
    oralEnabled = false,
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
        onSentenceBlockEdit: ignoreAction,
        onNote: ignoreAction,
        oralEnabled,
        onOral: ignoreAction,
        onKnown: ignoreAction,
        onRetry: ignoreAction,
        onNotice: ignoreAction,
        onReveal: ignoreAction,
        onPrimary: ignoreAction,
        oralController: oral,
        ...((family === 'word' || family === 'sentence' || family === 'audio') && mode === 'oral'
            ? {
                  oralAssessmentController: oralAssessment,
                  oralAssessmentTarget: {
                      id: question.id,
                      text: question.english,
                      translation: question.translation,
                      kind: family === 'word' ? ('word' as const) : ('sentence' as const),
                  },
              }
            : {}),
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

function assertListeningResult(result: string, listening: string): void {
    const englishTag = /<span\b[^>]*data-practice-english[^>]*>/g
    const resultWords = result.match(englishTag) ?? []
    const listeningWords = listening.match(englishTag) ?? []
    assert.equal(resultWords.length, 4)
    assert.equal(listeningWords.length, resultWords.length)
    for (const word of resultWords) assert.match(word, /\btext-practice-answer\b/)
    for (const word of listeningWords) assert.match(word, /\btext-foreground\b/)
    assert.equal(
        result.replace(englishTag, (tag) =>
            tag.replace(/\btext-practice-answer\b/g, 'text-foreground'),
        ),
        listening,
    )
}

test('单词与句子口语页直接装配同一评测正文，其他内容族口语保留原入口', (): void => {
    const html = renderContent({ family: 'word', mode: 'oral', phase: 'answering' })
    assert.match(html, /data-word-oral-assessment-exercise="true"/)
    assert.match(html, /data-oral-assessment-content="page"/)
    assert.match(html, /data-practice-media="true"/)
    assert.doesNotMatch(html, /ESC退出|role="dialog"|模拟完成|模拟错误/)
    const hidden = renderContent({
        family: 'word',
        mode: 'oral',
        phase: 'answering',
        imageVisible: false,
        wordOptions: { ...createWordToolbarOptions('oral'), translationVisible: false },
    })
    assert.doesNotMatch(hidden, /data-practice-media|n\.妇女/)
    assert.match(hidden, /data-oral-assessment-content="page"/)
    const sentence = renderContent({ family: 'sentence', mode: 'oral', phase: 'answering' })
    assert.match(sentence, /data-sentence-oral-assessment-exercise="true"/)
    assert.match(sentence, /data-oral-assessment-content="page"/)
    assert.match(sentence, /we read books together/)
    assert.match(sentence, /我们一起读书/)
    assert.doesNotMatch(
        sentence,
        /data-word-oral-assessment-exercise|ESC退出|role="dialog"|模拟完成|模拟错误/,
    )
    assert.doesNotMatch(
        renderContent({
            family: 'sentence',
            mode: 'oral',
            phase: 'answering',
            imageVisible: false,
        }),
        /data-practice-media/,
    )
    const audio = renderContent({ family: 'audio', mode: 'oral', phase: 'answering' })
    assert.match(audio, /data-audio-oral-assessment-exercise="true"/)
    assert.match(audio, /data-oral-assessment-content="page"/)
    assert.doesNotMatch(audio, /data-word-oral-assessment-exercise/)
})

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

test('真实文本输入共用原生输入桥，句子中译英独立按段维护', (): void => {
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
        if (
            (family === 'sentence' || family === 'audio') &&
            (mode === 'translate' || mode === 'typing')
        ) {
            assert.match(html, /data-sentence-answer-input="true"/)
            assert.doesNotMatch(html, /data-spelling-position=/)
        } else if (family !== 'word') assert.match(html, /data-word-slot-input="true"/)
        else assert.match(html, /data-spelling-position="0"/)
    }
})

test('单词指法使用专用题面，保留单一输入和键盘，不落回重复单词与确认按钮', (): void => {
    const html = renderContent({ family: 'word', mode: 'typing', phase: 'answering', input: 'wo' })
    assert.match(html, /data-word-typing-exercise="true"/)
    assert.match(html, /data-practice-answer-presentation="typing"/)
    assert.match(html, /data-typing-keyboard="true"/)
    assert.match(html, /<input[^>]*value="wo"/)
    assert.doesNotMatch(html, /data-word-slot-input|确认输入|答对状态演示|答错状态演示/)
})

test('句子指法组合多段输入与同一键盘，答对后显示四线句子并停用键盘', (): void => {
    const common: ContentFixtureProps = {
        family: 'sentence',
        mode: 'typing',
        phase: 'answering',
        input: 'we re',
    }
    const pending = renderContent(common)
    assert.match(pending, /data-sentence-typing-exercise="true"/)
    assert.equal((pending.match(/<input\b/g) ?? []).length, 1)
    assert.equal((pending.match(/data-sentence-answer-slot="\d+"/g) ?? []).length, 4)
    assert.match(pending, /data-sentence-slot-value="we"/)
    assert.match(pending, /data-sentence-slot-value="re"/)
    assert.match(pending, /data-keyboard-active="true"/)
    assert.doesNotMatch(
        pending,
        /data-word-typing-exercise|data-word-slot-input|data-spelling-position=/,
    )
    const correct = renderContent({ ...common, phase: 'correct' })
    assert.doesNotMatch(correct, /<input\b|data-sentence-answer-slot=/)
    assert.equal((correct.match(/data-word-card-guideline="true"/g) ?? []).length, 4)
    assert.match(correct, /aria-label="朗读当前句子"/)
    assert.match(correct, /data-keyboard-active="false"/)
    assert.match(correct, /data-sentence-typing-translation="true"/)
    assert.doesNotMatch(renderContent({ ...common, imageVisible: false }), /data-practice-media/)
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

test('句子与音频沉浸听力共用专用题面，其他模式保留既有组合', (): void => {
    for (const family of ['sentence', 'audio'] as const)
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
            const html = renderContent({ family, mode: 'listen', phase })
            assert.match(html, new RegExp(`data-practice-listening="${family}"`))
            assert.match(html, /data-sentence-listening-note/)
            assert.doesNotMatch(html, /data-practice-quick-oral|<audio|<video|technical-tone/)
        }
    for (const [family, mode] of [
        ['sentence', 'translate'],
        ['sentence', 'read'],
        ['sentence', 'typing'],
        ['sentence', 'oral'],
        ['audio', 'translate'],
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
        assert.match(html, /data-sentence-slot-value="We"/)
        assert.match(html, /data-sentence-slot-value="re"/)
        assert.doesNotMatch(html, /data-practice-english/)
    }
    for (const phase of ['revealed', 'correct'] as const)
        assert.match(
            renderContent({ family: 'sentence', mode: 'translate', phase, input: 'We re' }),
            /data-practice-english/,
        )
})

test('句子中译英仅答对态复用沉浸听力完整题面，包含相同解析、笔记与口语', (): void => {
    const common: ContentFixtureProps = {
        family: 'sentence',
        mode: 'translate',
        phase: 'correct',
        input: 'we read books together',
        oralEnabled: true,
    }
    const result = renderContent(common)
    const listening = renderContent({ ...common, mode: 'listen' })
    assertListeningResult(result, listening)
    assert.match(result, /data-annotation-variant="sentence-listening"/)
    assert.match(result, /data-sentence-listening-note/)
    assert.equal(result.match(/data-practice-quick-oral/g)?.length, 1)
    assert.doesNotMatch(result, /data-sentence-answer-input|data-sentence-answer-slot/)
    for (const phase of ['answering', 'incorrect'] as const) {
        const input = renderContent({ ...common, phase })
        assert.match(input, /data-sentence-answer-input/)
        assert.doesNotMatch(input, /data-sentence-listening-content/)
    }
    const revealed = renderContent({ ...common, phase: 'revealed' })
    assert.doesNotMatch(revealed, /data-sentence-listening-content/)
})

test('理解自查揭晓前仅显示英文与按钮，揭晓后直接复用完整沉浸听力题面', (): void => {
    const common: ContentFixtureProps = {
        family: 'sentence',
        mode: 'check',
        phase: 'answering',
        oralEnabled: true,
    }
    const prompt = renderContent(common)
    assert.match(prompt, /data-sentence-check-prompt/)
    assert.match(prompt, /data-sentence-check-english/)
    assert.match(prompt, /空格显示答案/)
    assert.doesNotMatch(
        prompt,
        /data-practice-translation|data-sentence-listening|data-practice-quick-oral/,
    )
    for (const phase of ['revealed', 'correct'] as const) {
        const result = renderContent({ ...common, phase })
        assertListeningResult(result, renderContent({ ...common, mode: 'listen', phase }))
        assert.match(result, /data-sentence-listening-note/)
        assert.equal(result.match(/data-practice-quick-oral/g)?.length, 1)
        assert.doesNotMatch(result, /data-sentence-check-prompt|data-sentence-check-reveal/)
    }
    assert.doesNotMatch(renderContent({ ...common, imageVisible: false }), /data-practice-media/)
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

test('句子拼块题面使用独立托盘与原图控制，答对直接复用听力内容和口语入口', (): void => {
    const prompt = renderContent({ family: 'sentence', mode: 'blocks', phase: 'answering' })
    assert.match(prompt, /data-sentence-blocks-tray/)
    assert.match(prompt, /data-sentence-blocks-action="undo"/)
    assert.match(prompt, /data-sentence-blocks-action="clear"/)
    assert.match(prompt, /data-sentence-blocks-candidates/)
    assert.doesNotMatch(prompt, /提交作答/)
    const correct = renderContent({
        family: 'sentence',
        mode: 'blocks',
        phase: 'correct',
        oralEnabled: true,
    })
    assert.match(correct, /data-sentence-listening-content/)
    assert.match(correct, /data-sentence-listening-note/)
    assert.match(correct, /data-sentence-listening-oral-slot/)
    assert.doesNotMatch(correct, /data-sentence-blocks-tray/)
})

test('音频六模式直接复用现有句子题面，完整答案继续使用听力题面', (): void => {
    for (const [mode, marker] of [
        ['read', /data-practice-reading-family="audio"/],
        ['check', /data-practice-check-family="audio"/],
        ['translate', /data-practice-sentence-family="audio"/],
        ['blocks', /data-practice-blocks-family="audio"/],
        ['typing', /data-practice-typing-family="audio"/],
        ['oral', /data-audio-oral-assessment-exercise="true"/],
    ] as const) {
        const prompt = renderContent({ family: 'audio', mode, phase: 'answering' })
        assert.match(prompt, marker)
        assert.doesNotMatch(
            prompt,
            /<audio|<video|technical-tone|点击下方词块组成句子|词序不正确，请调整后重试/,
        )
    }
    for (const [mode, phase] of [
        ['translate', 'correct'],
        ['blocks', 'correct'],
        ['check', 'revealed'],
    ] as const) {
        const result = renderContent({ family: 'audio', mode, phase, oralEnabled: true })
        assert.match(result, /data-practice-listening="audio"/)
        assert.match(result, /data-sentence-listening-note/)
        assert.match(result, /data-sentence-listening-oral-slot/)
    }
})
