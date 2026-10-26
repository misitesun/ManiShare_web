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
import { createVideoListeningPlayback } from '../model/video-listening-playback'
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
    readonly assessmentController?: OralAssessmentDemoController
    readonly questionIndex?: number
    readonly translationVisible?: boolean
    readonly copy?: boolean
    readonly readingWave?: string
    readonly blocked?: boolean
    readonly paused?: boolean
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
    assessmentController = oralAssessment,
    questionIndex = 0,
    translationVisible = true,
    copy = false,
    readingWave,
    blocked = false,
    paused = false,
}: ContentFixtureProps): ReactElement {
    const snapshot = useLearningSettingsSnapshot()
    const demo = practiceDemos.find((entry) => entry.family === family)
    const question = getDemoQuestions(family, mode)[questionIndex]
    if (!demo || !question) throw new Error('Missing content fixture')
    return createElement(PracticeContent, {
        demo,
        mode,
        question,
        session: { ...initialPracticeSession, phase, input, index: questionIndex },
        values: {
            ...snapshot.values,
            ...(readingWave === undefined ? {} : { readingWave }),
            ...(phoneticsEnabled === undefined
                ? {}
                : { showPhonetics: phoneticsEnabled, showAnswerPhonetics: phoneticsEnabled }),
        },
        ...(wordOptions ? { wordOptions } : {}),
        ...(family === 'video' &&
        (mode === 'check' ||
            mode === 'typing' ||
            mode === 'oral' ||
            mode === 'blocks' ||
            mode === 'translate')
            ? {
                  videoExercisePlayback: createVideoListeningPlayback({
                      completion: 'manual',
                      rhythm: 'sentence-end',
                  }),
              }
            : {}),
        imageVisible,
        blocked,
        paused,
        additionalOptions: {
            copy,
            imageVisible: true,
            translationVisible,
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
        ...((family === 'word' ||
            family === 'sentence' ||
            family === 'audio' ||
            family === 'video') &&
        mode === 'oral'
            ? {
                  oralAssessmentController: assessmentController,
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

test('纯视频所有题态只显示同图封面与静态控制条，不挂载技术媒体和学习内容', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const html = renderContent({
            family: 'video-reader',
            mode: 'read',
            phase,
            phoneticsEnabled: true,
            imageVisible: false,
        })
        assert.match(html, /data-pure-video-reader/)
        assert.match(html, /alt="纯视频封面"/)
        const images = Array.from(html.matchAll(/<img\b[^>]*src="([^"]*)"/g), (match) => match[1])
        assert.equal(images[0], images[1])
        for (const label of ['暂停', '音量', '画中画', '播放器全屏'])
            assert.match(html, new RegExp(`<button\\b[^>]*aria-label="${label}"[^>]*disabled`))
        assert.doesNotMatch(
            html,
            /<audio\b|<video\b|<input\b|technical-video|technical-tone|逐词解析|播放进度与总时长|倍速|data-practice-quick-oral/,
        )
    }
})

test('纯音频默认静止且只保留一个播放／暂停入口，阻断时禁用，不挂载媒体或学习题面', (): void => {
    for (const readingWave of ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条'])
        for (const state of [{}, { blocked: true }, { paused: true }]) {
            const html = renderContent({
                family: 'audio-reader',
                mode: 'read',
                phase: 'correct',
                readingWave,
                phoneticsEnabled: true,
                ...state,
            })
            assert.match(html, /data-pure-audio-reader/)
            assert.match(html, new RegExp(`data-audio-wave="${readingWave}"`))
            assert.match(html, /aria-label="纯音频声纹预览"/)
            assert.match(html, /data-wave-active="false"/)
            assert.equal(html.match(/<button\b/g)?.length, 1)
            assert.match(html, /aria-label="播放声纹预览"/)
            if (state.blocked || state.paused) assert.match(html, /<button\b[^>]*disabled/)
            else assert.doesNotMatch(html, /<button\b[^>]*disabled/)
            assert.doesNotMatch(
                html,
                /<audio\b|<video\b|<input\b|technical-tone|音频练习封面|播放进度与总时长|逐词解析|data-practice-quick-oral|随机播放|上一条|下一条|重复播放/,
            )
        }
})

test('纯图片轮播仅当前图可访问，五个指示器与会话题号一致，无学习内容或媒体', (): void => {
    for (const questionIndex of [0, 2, 4]) {
        const html = renderContent({
            family: 'picture-reader',
            mode: 'read',
            phase: 'answering',
            questionIndex,
            imageVisible: false,
            oralEnabled: true,
            phoneticsEnabled: true,
        })
        assert.match(html, /data-pure-picture-reader/)
        assert.equal(html.match(/data-picture-slide=/g)?.length, 5)
        assert.equal(
            html.match(/aria-roledescription="幻灯片"[^>]*aria-hidden="false"/g)?.length,
            1,
        )
        assert.match(
            html,
            new RegExp(`aria-label="查看第${questionIndex + 1}张图片" aria-current="true"`),
        )
        assert.match(html, new RegExp(`第${questionIndex + 1}张，共5张图片`))
        assert.doesNotMatch(
            html,
            /<audio\b|<video\b|<input\b|data-practice-media|data-practice-english|data-practice-translation|data-practice-quick-oral|逐词解析/,
        )
    }
    const blocked = renderContent({
        family: 'picture-reader',
        mode: 'read',
        phase: 'answering',
        blocked: true,
    })
    assert.match(blocked, /aria-label="上一张图片"[^>]*disabled/)
    assert.match(blocked, /aria-label="下一张图片"[^>]*disabled/)
})

test('纯文章各题态保持空富文本容器，不显示句子、笔记、答题或媒体占位', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const html = renderContent({
            family: 'text-reader',
            mode: 'read',
            phase,
            oralEnabled: true,
            phoneticsEnabled: true,
        })
        assert.match(html, /data-pure-article-reader/)
        assert.match(html, /data-article-empty="true"/)
        assert.match(html, /aria-label="文章内容" tabindex="0"/)
        assert.match(html, /暂无文章内容/)
        assert.doesNotMatch(
            html,
            /<audio\b|<video\b|<img\b|<input\b|添加笔记|data-practice-english|data-practice-translation|data-practice-media|data-practice-quick-oral|逐词解析/,
        )
    }
})

test('猜词阅读接入十条语境列表，不回退到重复阅读占位或场景图', (): void => {
    const html = renderContent({ family: 'guess', mode: 'read', phase: 'answering' })
    assert.match(html, /data-guess-reading-exercise/)
    assert.equal((html.match(/<li\b/g) ?? []).length, 10)
    assert.match(html, /查看 hand 的答案/)
    assert.match(html, /查看 happy 的答案/)
    assert.doesNotMatch(html, /阅读全览|添加笔记|data-practice-media|<input/)
})

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

test('纯指法固定抄写并由单一分段输入覆盖全部混合题，无图片中文或额外确认按钮', (): void => {
    const questions = getDemoQuestions('typing', 'typing')
    for (const [questionIndex, question] of questions.entries()) {
        const html = renderContent({
            family: 'typing',
            mode: 'typing',
            phase: 'answering',
            questionIndex,
            input: '',
            imageVisible: true,
            translationVisible: true,
            copy: false,
            oralEnabled: true,
        })
        assert.match(html, /data-standalone-typing-exercise="true"/)
        assert.match(html, /data-reference-layout="typing:typing"/)
        assert.match(html, /data-sentence-word-hint="true"/)
        assert.equal((html.match(/<input[^>]*data-practice-answer-input/g) ?? []).length, 1)
        assert.equal(
            (html.match(/data-sentence-answer-slot="\d+"/g) ?? []).length,
            question.english.split(/\s+/u).length,
        )
        assert.doesNotMatch(
            html,
            /data-practice-media|data-sentence-typing-translation|data-word-slot-input|确认输入|data-practice-quick-oral|朗读当前/,
        )
    }
    const correct = renderContent({
        family: 'typing',
        mode: 'typing',
        phase: 'correct',
        questionIndex: 1,
        oralEnabled: true,
    })
    assert.match(correct, /Nice to meet you\./)
    assert.match(correct, /data-keyboard-active="false"/)
    assert.doesNotMatch(
        correct,
        /<input\b|朗读当前|data-practice-quick-oral|data-sentence-typing-translation/,
    )
})

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

test('视频口语四态共用评测正文，保留600×337封面且录制／评测中禁播', (): void => {
    for (const stage of ['idle', 'recording', 'evaluating', 'result'] as const) {
        const html = renderContent({
            family: 'video',
            mode: 'oral',
            phase: 'answering',
            assessmentController: {
                ...oralAssessment,
                stage,
                result:
                    stage === 'result'
                        ? {
                              score: 85,
                              accuracy: 80,
                              fluency: 92,
                              completeness: 90,
                              rating: 'EXCELLENT',
                              description: '口语模拟结果',
                              words: [
                                  { text: 'we', score: 85 },
                                  { text: 'read', score: 85 },
                                  { text: 'books', score: 85 },
                                  { text: 'together', score: 85 },
                              ],
                          }
                        : null,
            },
        })
        assert.match(html, /data-video-oral-assessment-exercise="true"/)
        assert.match(html, new RegExp(`data-oral-assessment-stage="${stage}"`))
        assert.match(html, /data-video-oral-cover="true"/)
        assert.match(html, /width="600" height="337"/)
        assert.match(html, /我们一起读书/)
        assert.doesNotMatch(
            html,
            /data-sentence-oral-assessment-exercise|data-word-oral-assessment-exercise|<audio\b|<video\b|technical-tone|data-oral-demo-panel/,
        )
        const cover = html.match(/<button\b[^>]*data-video-oral-cover[^>]*>/)?.[0] ?? ''
        assert.ok(cover)
        if (stage === 'recording' || stage === 'evaluating') assert.match(cover, /disabled=""/)
        else assert.doesNotMatch(cover, /disabled=/)
    }
})

test('视频口语使用当前视频句子和局部翻译设置，不依赖图片开关', (): void => {
    const html = renderContent({
        family: 'video',
        mode: 'oral',
        phase: 'answering',
        questionIndex: 1,
        imageVisible: false,
        translationVisible: false,
    })
    assert.match(html, /you drink water/)
    assert.match(html, /data-video-oral-cover="true"/)
    assert.doesNotMatch(html, /你喝水|we read books together|data-practice-media/)
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

test('猜词打词接入独立中文填词题面，正确后仍保留图片与键盘且不落回通用结果', (): void => {
    for (const phase of ['answering', 'incorrect', 'correct', 'revealed'] as const) {
        const html = renderContent({ family: 'guess', mode: 'spell', phase, input: 'ha' })
        assert.match(html, /data-guess-spelling-exercise/)
        assert.match(html, /他有一双肥嘟嘟的/)
        assert.match(html, /data-typing-keyboard/)
        assert.match(html, /data-practice-media/)
        assert.doesNotMatch(html, /data-word-slot-input|答对状态演示|本轮指法统计|快捷口语/)
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
            (family === 'guess' && mode === 'spell') ||
            ((family === 'sentence' ||
                family === 'audio' ||
                family === 'video' ||
                family === 'typing') &&
                (mode === 'translate' || mode === 'typing'))
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

test('视频指法复用分段输入与键盘，答案态保留视频封面并停用按键反馈', (): void => {
    const common: ContentFixtureProps = {
        family: 'video',
        mode: 'typing',
        phase: 'answering',
        input: 'we re',
    }
    const pending = renderContent(common)
    assert.match(pending, /data-video-typing-exercise="true"/)
    assert.match(pending, /data-video-typing-cover="true"/)
    assert.match(pending, /data-sentence-answer-input="true"/)
    assert.equal((pending.match(/<input\b/g) ?? []).length, 1)
    assert.equal((pending.match(/data-sentence-answer-slot="\d+"/g) ?? []).length, 4)
    assert.match(pending, /data-sentence-slot-value="we"/)
    assert.match(pending, /data-sentence-slot-value="re"/)
    assert.match(pending, /data-keyboard-active="true"/)
    assert.doesNotMatch(pending, /data-word-slot-input|确认输入|<audio\b|<video\b/)
    for (const phase of ['correct', 'revealed'] as const) {
        const result = renderContent({ ...common, phase, imageVisible: false })
        assert.match(result, /data-video-typing-cover="true"/)
        assert.match(result, /data-keyboard-active="false"/)
        assert.match(result, /data-sentence-typing-translation="true"/)
    }
    const correct = renderContent({ ...common, phase: 'correct' })
    assert.doesNotMatch(correct, /<input\b|data-sentence-answer-slot=/)
    assert.match(correct, /aria-label="朗读当前句子"/)
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

test('句子中译英仅答对态复用无封面的听力解析、笔记与口语', (): void => {
    const common: ContentFixtureProps = {
        family: 'sentence',
        mode: 'translate',
        phase: 'correct',
        input: 'we read books together',
        oralEnabled: true,
    }
    const result = renderContent(common)
    const listening = renderContent({ ...common, mode: 'listen', imageVisible: false })
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
    assert.doesNotMatch(revealed, /data-practice-media/)
})

test('视频中译英复用单一分段输入，900×500封面、中文及输入按顺序自然排布', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const html = renderContent({
            family: 'video',
            mode: 'translate',
            phase,
            input: 'we re',
            reading: true,
        })
        assert.match(html, /data-practice-sentence-family="video"/)
        assert.match(html, /data-video-translation-exercise="true"/)
        assert.match(html, /data-video-translate-cover="true"/)
        assert.match(html, /width="900" height="500"/)
        assert.match(html, /data-sentence-slot-value="we"/)
        assert.match(html, /data-sentence-slot-value="re"/)
        assert.equal(html.match(/<input[^>]*data-practice-answer-input/g)?.length, 1)
        const cover = html.indexOf('data-video-translate-cover')
        const translation = html.indexOf('data-practice-translation')
        const input = html.indexOf('data-sentence-answer-input')
        assert.ok(cover >= 0 && translation > cover && input > translation)
        assert.doesNotMatch(
            html,
            /<audio\b|<video\b|technical-tone|data-word-slot-input|data-practice-reading-overlay|design:absolute/,
        )
    }
})

test('视频中译英沿局部抄写／翻译设置，答案态隐藏封面且答对共用完整解析', (): void => {
    const common: ContentFixtureProps = {
        family: 'video',
        mode: 'translate',
        phase: 'answering',
        input: 'w',
        oralEnabled: true,
    }
    assert.match(renderContent({ ...common, copy: true }), /data-sentence-word-hint/)
    assert.doesNotMatch(renderContent({ ...common, copy: false }), /data-sentence-word-hint/)
    const hiddenTranslation = renderContent({ ...common, translationVisible: false })
    assert.doesNotMatch(hiddenTranslation, /data-practice-translation/)
    assert.match(hiddenTranslation, /data-video-translate-cover/)
    assert.match(hiddenTranslation, /data-sentence-answer-input/)
    for (const phase of ['revealed', 'correct'] as const) {
        const html = renderContent({ ...common, phase })
        assert.doesNotMatch(
            html,
            /data-video-exercise-cover|data-practice-media|<audio\b|<video\b|data-sentence-answer-input/,
        )
        assert.match(html, /data-practice-english/)
        if (phase === 'correct') {
            assert.match(html, /data-practice-listening="video"/)
            assert.match(html, /data-sentence-listening-note/)
            assert.match(html, /data-sentence-listening-oral-slot/)
        }
    }
    const second = renderContent({ ...common, questionIndex: 1, imageVisible: false })
    assert.match(second, /你喝水/)
    assert.match(second, /data-video-translate-cover/)
    assert.doesNotMatch(second, /我们一起读书/)
})

test('理解自查揭晓前保持原题面，揭晓后复用无封面的沉浸听力题面', (): void => {
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
        assertListeningResult(
            result,
            renderContent({ ...common, mode: 'listen', phase, imageVisible: false }),
        )
        assert.match(result, /data-sentence-listening-note/)
        assert.equal(result.match(/data-practice-quick-oral/g)?.length, 1)
        assert.doesNotMatch(result, /data-sentence-check-prompt|data-sentence-check-reveal/)
    }
    assert.doesNotMatch(renderContent({ ...common, imageVisible: false }), /data-practice-media/)
})

test('音标拼读题面接入真实卡堆，内部口语保持原题面', (): void => {
    for (const questionIndex of [0, 1, 2, 3, 9]) {
        const html = renderContent({
            family: 'phonetics',
            mode: 'pronounce',
            phase: 'answering',
            questionIndex,
        })
        assert.match(html, /data-card-swap="true"|data-card-swap=""/)
        assert.match(html, /aria-label="音标词卡堆"/)
        assert.equal(html.match(/data-phonetics-question-id=/g)?.length, 10)
        assert.match(html, /data-phonetics-reading-plan="phonics"/)
    }
    const oral = renderContent({ family: 'phonetics', mode: 'oral', phase: 'answering' })
    assert.doesNotMatch(oral, /data-card-swap|data-phonetics-deck/)
    const word = renderContent({ family: 'word', mode: 'pronounce', phase: 'answering' })
    assert.match(word, /aria-label="单词拼读卡片堆"/)
    assert.doesNotMatch(word, /data-phonetics-card/)
})

test('切读遮罩位于各族题图，卡堆仅当前卡展示，隐藏图片时一并隐藏', (): void => {
    for (const [family, mode] of [
        ['word', 'pronounce'],
        ['word', 'spell'],
        ['word', 'dictate'],
        ['sentence', 'translate'],
        ['sentence', 'listen'],
        ['audio', 'translate'],
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

test('视频拼块复用托盘和候选词块，使用600×337视频封面而非技术播放器', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        const html = renderContent({ family: 'video', mode: 'blocks', phase })
        assert.match(html, /data-practice-blocks-family="video"/)
        assert.match(html, /data-video-blocks-cover="true"/)
        assert.match(html, /width="600" height="337"/)
        assert.match(html, /data-sentence-blocks-tray/)
        assert.match(html, /data-sentence-blocks-action="undo"/)
        assert.match(html, /data-sentence-blocks-action="clear"/)
        assert.equal(html.match(/data-sentence-block-selected="false"/g)?.length, 4)
        assert.doesNotMatch(html, /<audio\b|<video\b|technical-tone|data-practice-media|逐词解析/)
    }
    for (const phase of ['answering', 'correct'] as const) {
        const hidden = renderContent({
            family: 'video',
            mode: 'blocks',
            phase,
            questionIndex: 1,
            translationVisible: false,
        })
        assert.doesNotMatch(hidden, /你喝水|我们一起读书/)
        assert.match(hidden, /drink/)
    }
})

test('句子／音频／视频拼块在揭晓和答对时统一隐藏封面并复用答案解析', (): void => {
    for (const family of ['sentence', 'audio', 'video'] as const) {
        const prompt = renderContent({ family, mode: 'blocks', phase: 'answering' })
        assert.match(prompt, family === 'video' ? /data-video-blocks-cover/ : /data-practice-media/)
        for (const phase of ['revealed', 'correct'] as const) {
            const html = renderContent({ family, mode: 'blocks', phase, oralEnabled: true })
            assert.match(html, /data-sentence-listening-content/)
            assert.match(html, /data-sentence-listening-note/)
            assert.match(html, /data-sentence-listening-oral-slot/)
            assert.doesNotMatch(
                html,
                /data-practice-media|data-video-exercise-cover|data-practice-reading-surface|data-sentence-blocks-tray|data-sentence-blocks-candidates|<audio\b|<video\b/,
            )
        }
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
