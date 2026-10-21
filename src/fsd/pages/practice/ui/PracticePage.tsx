'use client'
import { useCallback, useEffect, useReducer, useState, useRef } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import Link from 'next/link'
import {
    LearningSettingsEditor,
    LearningAudioWave,
    PracticeBackgroundSurface,
    getPreviewAppearance,
    useLearningSettingsSnapshot,
    shortcutFields,
    shortcutError,
} from '../../../features/learning-settings'
import type { SettingsTab } from '../../../features/learning-settings'
import { OralAssessmentDialog, useOralAssessmentDemo } from '../../../features/oral-assessment'
import type { OralAssessmentTarget } from '../../../features/oral-assessment'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog, TldDialogMotionProvider } from '../../../shared/ui/tld-dialog'
import { notification } from '../../../shared/notification'
import {
    PracticeModeDialog,
    isSelectablePracticeFamily,
    isPracticeSelectionMode,
    practiceModeSelections,
} from '../../../features/practice-mode-selection'
import {
    practiceDemos,
    getPracticeModeLabel,
    getDemoQuestions,
    reducePracticeSession,
    initialPracticeSession,
} from '../model/practice-demo'
import type {
    PracticeMode,
    PracticeRouteResult,
    ResolvedPracticeView,
} from '../model/practice-demo'
import type {
    PracticeFeedbackEvent,
    PracticeFeedbackSoundController,
} from '../model/practice-feedback'
import { practiceMediaSource, stopPracticeMedia } from '../model/media-controller'
import type { PracticeMediaController } from '../model/media-controller'
import {
    canShowQuickOral,
    hasPracticeAnswerInput,
    isPracticeAnswerVisible,
} from '../model/practice-visibility'
import { PracticeContent } from './PracticeContent'
import { WordSpellingResult } from './WordSpellingResult'
import { getWordSpellingCrystals, judgeWordSpelling } from '../model/word-spelling'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import { createPracticeAnswerFocusRequest } from '../model/practice-answer-focus'
import { getWordSpellingQuestionDirection } from '../model/word-spelling-question-motion'
import type { WordSpellingQuestionTransition } from '../model/word-spelling-question-motion'
import { WordPracticeToolbar } from './WordPracticeToolbar'
import { isWordToolbarMode } from '../model/word-toolbar-options'
import type { WordToolbarOptions } from '../model/word-toolbar-options'
import { getWordQuestionOrder } from '../model/word-question-order'
import { SentencePracticeToolbar } from './SentencePracticeToolbar'
import { AudioPracticeToolbar } from './AudioPracticeToolbar'
import { isAudioToolbarMode } from '../model/audio-toolbar-options'
import { isSentenceToolbarMode } from '../model/sentence-toolbar-options'
import { isAdditionalToolbarFamily } from '../model/additional-toolbar-options'
import { usePracticeToolbarPreferences } from '../model/usePracticeToolbarPreferences'
import type { PracticeToolbarPreferencesState } from '../model/usePracticeToolbarPreferences'
import { describePhoneticsReadingPlan } from '../model/phonetics-reading-plan'
import { AdditionalPracticeToolbar } from './AdditionalPracticeToolbar'
import { PracticeFeedback } from './PracticeFeedback'
import { OralDemoPanel } from './OralDemoPanel'
import backAsset from '../assets/back.svg'
import { PracticeNavigation } from './PracticeNavigation'
import type { PracticeNavigationAction } from '../model/practice-navigation'
import {
    getPracticeFooter,
    supportsPracticeKnowledge,
    supportsPracticePanel,
} from '../model/practice-footer'
import type { PracticeCommand } from '../model/practice-command-types'
import { usePracticeCommands } from '../model/usePracticeCommands'
import { resolvePracticePrimary } from '../model/practice-primary'
import { useOralDemo } from '../model/useOralDemo'
import { PracticeFooter } from './PracticeFooter'
import { PracticeAnswerPanel } from './PracticeAnswerPanel'
import { PracticeDraftPanel } from './PracticeDraftPanel'
import { usePracticeDrafts } from '../model/usePracticeDrafts'
import { usePracticeNotes } from '../model/usePracticeNotes'
import { PracticeNotesPanel } from './PracticeNotesPanel'
import { PracticeErrorFeedbackDialog } from './PracticeErrorFeedbackDialog'
import { PracticeContentDialog } from './PracticeContentDialog'
import { usesPracticeContentDialog } from '../model/practice-content-dialog'
import { PracticeCompletionDialog } from './PracticeCompletionDialog'
import { PracticeExitDialog } from './PracticeExitDialog'
import { createPracticeExitFlow } from '../model/practice-exit'
import type { WordPronunciationDeckController } from '../model/word-card-deck'
import {
    createWordRememberSession,
    getWordPronunciationSession,
    getWordRememberProgress,
    moveWordRememberSession,
    rememberWord,
    reorderWordRememberSession,
    retryWord,
} from '../model/word-remember-session'
import type { PracticeExitAction, PracticeExitDestination } from '../model/practice-exit'
import { PracticePauseDialog } from './PracticePauseDialog'
import { usePracticePause } from '../model/usePracticePause'
import { PRACTICE_PAUSE_ENABLED } from '../model/practice-pause'
import { PracticeTimerContext, usePracticeTimer } from '../model/usePracticeTimer'
import { PracticeLoadingScreen } from './PracticeLoadingScreen'
import { usePracticeEntryLoading } from '../model/usePracticeEntryLoading'
import {
    createPracticeCutReadingVisitKey,
    isPracticeCutReadingEnabled,
} from '../model/practice-cut-reading'
import { usePracticeReading } from '../model/usePracticeReading'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import type { PracticePlaybackState } from './PracticeMedia'
interface PracticePageProps {
    readonly draftScope?: string
    readonly route: PracticeRouteResult
    readonly backPath: string
    readonly onSelect: (demo: string, mode: PracticeMode) => void
    readonly onCatalog: () => void
    readonly onExit: (destination: PracticeExitDestination) => void
}
interface PracticeStyle extends CSSProperties {
    '--app-color-practice-background': string
    '--app-color-practice-answer': string
    '--app-color-practice-text': string
    '--app-color-practice-muted'?: string
}
interface WordRememberAction {
    readonly questionId: string
}
type Overlay =
    | 'mode'
    | 'content'
    | 'reset'
    | 'report'
    | 'note'
    | 'settings'
    | 'exit'
    | 'finish'
    | 'oral'
    | null
export function PracticePage({
    draftScope,
    route,
    backPath,
    onSelect,
    onCatalog,
    onExit,
}: PracticePageProps): ReactElement {
    const toolbarPreferences = usePracticeToolbarPreferences()
    const scope = draftScope ?? (route.kind === 'demo' ? `demo:${route.view.demo.id}` : 'catalog')
    const draft = usePracticeDrafts(scope)
    const [openDraftScope, setOpenDraftScope] = useState<string | null>(null)
    const entryKey =
        route.kind === 'demo' ? `${scope}:${route.view.demo.id}:${route.view.mode}` : null
    const entryLoading = usePracticeEntryLoading(entryKey)
    if (route.kind !== 'demo')
        return (
            <main className="min-h-dvh bg-canvas p-4 text-primary md:p-8">
                <Link href={backPath} className="cursor-pointer text-body text-brand underline">
                    返回课程
                </Link>
                <div className="mx-auto mt-10 max-w-[1100px]">
                    <h1 className="text-page-title">练习页 · 第一版演示</h1>
                    <p className="mt-3 text-body text-secondary">
                        使用本地示例内容；输入、结果和评测均不接后台。
                    </p>
                    {route.kind === 'invalid' && (
                        <p
                            role="alert"
                            className="mt-4 rounded-xl border border-strong p-4 text-danger"
                        >
                            {route.message}
                        </p>
                    )}
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {practiceDemos.map((demo) => (
                            <section
                                key={demo.id}
                                className="rounded-xl border border-strong bg-surface p-5"
                            >
                                <h2 className="text-card-title">{demo.title}</h2>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {demo.modes.map((mode) => (
                                        <TldButton
                                            key={mode}
                                            size="compact"
                                            variant="secondary"
                                            onClick={(): void => onSelect(demo.id, mode)}
                                        >
                                            {getPracticeModeLabel(demo.family, mode)}
                                        </TldButton>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        )
    return (
        <TldDialogMotionProvider>
            {entryLoading.ready ? (
                <PracticeSession
                    key={`${route.view.demo.id}:${route.view.mode}`}
                    view={route.view}
                    onExit={onExit}
                    onSelect={onSelect}
                    onCatalog={(): void => {
                        setOpenDraftScope(null)
                        onCatalog()
                    }}
                    toolbarPreferences={toolbarPreferences}
                    draftOpen={openDraftScope === scope}
                    onOpenDraft={(): void =>
                        setOpenDraftScope((current) => (current === scope ? null : scope))
                    }
                />
            ) : (
                <PracticeLoadingScreen key={entryKey} onComplete={entryLoading.complete} />
            )}
            <PracticeDraftPanel
                key={scope}
                open={entryLoading.ready && openDraftScope === scope}
                scope={scope}
                text={draft.text}
                onTextChange={draft.setText}
                onClear={draft.clear}
                onSave={draft.save}
                onClose={(): void => setOpenDraftScope(null)}
            />
        </TldDialogMotionProvider>
    )
}
function PracticeSession({
    view,
    onSelect,
    onCatalog,
    onExit,
    toolbarPreferences,
    draftOpen,
    onOpenDraft,
}: {
    readonly view: ResolvedPracticeView
    readonly onSelect: PracticePageProps['onSelect']
    readonly onCatalog: () => void
    readonly onExit: PracticePageProps['onExit']
    readonly toolbarPreferences: PracticeToolbarPreferencesState
    readonly draftOpen: boolean
    readonly onOpenDraft: () => void
}): ReactElement {
    const { demo, mode } = view
    const snapshot = useLearningSettingsSnapshot()
    const { values } = snapshot
    const appearance = getPreviewAppearance(values)
    const sourceQuestions = getDemoQuestions(demo.family, mode)
    const isWordPronunciation = demo.family === 'word' && mode === 'pronounce'
    const isWordSpelling = demo.family === 'word' && mode === 'spell'
    const isWordDictation = demo.family === 'word' && mode === 'dictate'
    const isWordInput = isWordSpelling || isWordDictation
    const [spellingQuestionTransition, setSpellingQuestionTransition] =
        useState<WordSpellingQuestionTransition | null>(null)
    const [answerSession, dispatch] = useReducer(reducePracticeSession, initialPracticeSession)
    const [wordRemember, setWordRemember] = useState(() =>
        createWordRememberSession(sourceQuestions.map((item) => item.id)),
    )
    const [wordOrderRevision, setWordOrderRevision] = useState(0)
    const appliedWordOrder = useRef<WordToolbarOptions['order'] | null>(null)
    const rememberProgress = getWordRememberProgress(wordRemember)
    // 拼读题号由剩余队列拥有；章节完成与是否全部记住独立。
    const session = isWordPronunciation
        ? getWordPronunciationSession(answerSession, wordRemember)
        : answerSession
    const [rememberAction, setRememberAction] = useState<WordRememberAction | null>(null)
    const pendingRemember = useRef<{
        readonly action: WordRememberAction
        readonly stage: 'feedback' | 'exit'
    } | null>(null)
    const cancelRemember = useCallback((): void => {
        pendingRemember.current = null
        setRememberAction(null)
    }, [])
    const [overlay, setOverlay] = useState<Overlay>(null)
    const [exitFlow] = useState(createPracticeExitFlow)
    const [exitClosing, setExitClosing] = useState(false)
    const [pauseClosing, setPauseClosing] = useState(false)
    const completionAction = useRef<'replay' | 'return' | null>(null)
    const [completionClosing, setCompletionClosing] = useState(false)
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('pronunciation')
    const wordMode = demo.family === 'word' && isWordToolbarMode(mode) ? mode : null
    const wordOptions = toolbarPreferences.word(wordMode ?? 'pronounce')
    const sentenceMode = demo.family === 'sentence' && isSentenceToolbarMode(mode) ? mode : null
    const sentenceOptions = toolbarPreferences.sentence(sentenceMode ?? 'listen')
    const audioMode = demo.family === 'audio' && isAudioToolbarMode(mode) ? mode : null
    const audioOptions = toolbarPreferences.audio(audioMode ?? 'listen')
    const additionalFamily = isAdditionalToolbarFamily(demo.family) ? demo.family : null
    const additionalOptions = additionalFamily
        ? toolbarPreferences.additional(additionalFamily, mode)
        : null
    const [noteTarget, setNoteTarget] = useState<string>('')
    const chapterNotes = usePracticeNotes(sourceQuestions.map((item) => item.id))
    const [resetRevision, setResetRevision] = useState(0)
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [message, setMessage] = useState('')
    const [panelVisible, setPanelVisible] = useState(demo.family === 'phonetics')
    const rootRef = useRef<HTMLDivElement>(null)
    const wordDeck = useRef<WordPronunciationDeckController | null>(null)
    const answerInput = useRef<WordSpellingInputController | null>(null)
    const answerFocusAllowed = useRef(false)
    const [answerFocus] = useState(() =>
        createPracticeAnswerFocusRequest({
            canFocus: (): boolean => answerFocusAllowed.current,
            focus: (): void => answerInput.current?.focus(),
            schedule: (callback): number => window.requestAnimationFrame(callback),
            cancelFrame: (frame): void => window.cancelAnimationFrame(frame),
        }),
    )
    useEffect(() => (): void => answerFocus.cancel(), [answerFocus])
    const feedbackSound = useRef<PracticeFeedbackSoundController | null>(null)
    const registerFeedbackSound = useCallback(
        (controller: PracticeFeedbackSoundController | null): void => {
            feedbackSound.current = controller
        },
        [],
    )
    const registerAnswerInput = useCallback(
        (controller: WordSpellingInputController | null): void => {
            answerInput.current = controller
        },
        [],
    )
    const [wordDeckBusy, setWordDeckBusy] = useState(false)
    const registerWordDeck = useCallback(
        (controller: WordPronunciationDeckController | null): void => {
            wordDeck.current = controller
        },
        [],
    )
    const exitTriggerRef = useRef<HTMLButtonElement>(null)
    const exitFocusPending = useRef(false)
    const mediaController = useRef<PracticeMediaController | null>(null)
    const registerMedia = useCallback((controller: PracticeMediaController | null): void => {
        mediaController.current = controller
    }, [])
    const pause = usePracticePause((): void => {
        cancelRemember()
        wordDeck.current?.cancel()
        timer.pause()
        mediaController.current?.pause()
        readingAudio.pause()
        activeOral.pause()
        setEvent(undefined)
        setPauseClosing(false)
    }, rootRef)
    const oral = useOralDemo({
        blocked: pause.paused || (overlay !== null && overlay !== 'oral'),
        isPaused: pause.isPaused,
        onNotice: setMessage,
        onFeedback: (kind): void => {
            if (isWordSpelling || isWordPronunciation)
                emit(kind, kind === 'evaluationComplete' ? 'EXCELLENT' : undefined)
        },
    })
    const wordOralQuestion = sourceQuestions[session.index] ?? sourceQuestions[0]
    const wordOralTarget: OralAssessmentTarget = {
        id: `${mode}:${wordOralQuestion?.id ?? 'empty'}:${resetRevision}`,
        text: wordOralQuestion?.english ?? '',
        translation: wordOralQuestion?.translation ?? '',
        kind: 'word',
    }
    const wordOral = useOralAssessmentDemo({
        active: isWordInput && overlay === 'oral',
        blocked: pause.paused || (overlay !== null && overlay !== 'oral'),
        isPaused: pause.isPaused,
        target: wordOralTarget,
        onFeedback: (kind, rating): void => emit(kind, rating),
    })
    const activeOral = isWordInput ? wordOral : oral
    const [event, setEvent] = useState<PracticeFeedbackEvent>()
    const eventSequence = useRef(0)
    const questions = isWordPronunciation
        ? wordRemember.remainingIds.flatMap((id) => {
              const question = sourceQuestions.find((item) => item.id === id)
              return question ? [question] : []
          })
        : sourceQuestions
    // 最后一条记住后保留完成弹窗的渲染宿主，不以空态替换整个会话。
    const question = questions[session.index] ?? sourceQuestions[0]
    const blocked = overlay !== null || pause.paused
    answerFocusAllowed.current =
        snapshot.ready &&
        toolbarPreferences.ready &&
        !blocked &&
        !session.finished &&
        hasPracticeAnswerInput(mode) &&
        (session.phase === 'answering' || session.phase === 'incorrect')
    useEffect(() => {
        if (
            !isWordPronunciation ||
            !toolbarPreferences.ready ||
            appliedWordOrder.current === wordOptions.order
        )
            return
        appliedWordOrder.current = wordOptions.order
        const orderedIds = getWordQuestionOrder(sourceQuestions, wordOptions.order)
        setWordRemember((current) => reorderWordRememberSession(current, orderedIds))
        // 显式排序从新队列首张重建卡堆；普通切题与“再来”继续保留原物理节点。
        setWordOrderRevision((revision) => revision + 1)
    }, [isWordPronunciation, sourceQuestions, toolbarPreferences.ready, wordOptions.order])
    useEffect(() => {
        function cancelHiddenRemember(): void {
            if (document.visibilityState !== 'hidden') return
            cancelRemember()
            wordDeck.current?.cancel()
        }
        document.addEventListener('visibilitychange', cancelHiddenRemember)
        return (): void => {
            pendingRemember.current = null
            document.removeEventListener('visibilitychange', cancelHiddenRemember)
        }
    }, [cancelRemember])
    const readingVisit = createPracticeCutReadingVisitKey({
        scope: demo.id,
        family: demo.family,
        mode,
        questionId: question?.id ?? '',
        index: session.index,
        revision: resetRevision,
    })
    const cutReading = isPracticeCutReadingEnabled(
        demo.family,
        mode,
        wordMode
            ? wordOptions.cutReading
            : sentenceMode
              ? sentenceOptions.cutReading
              : audioMode
                ? audioOptions.cutReading
                : (additionalOptions?.cutReading ?? false),
    )
    const readingAudio = usePracticeReading({
        family: demo.family,
        mode,
        visitKey: readingVisit,
        ...(question?.readingSource ? { source: question.readingSource } : {}),
        enabled: cutReading,
        ready: snapshot.ready && toolbarPreferences.ready && Boolean(question),
        blocked: blocked || session.finished || rememberAction !== null,
    })
    const [contentPlayback, setContentPlayback] = useState<{
        readonly visitKey: string
        readonly state: PracticePlaybackState
    } | null>(null)
    const reportContentPlayback = useCallback(
        (state: PracticePlaybackState): void => {
            setContentPlayback((previous) =>
                previous?.visitKey === readingVisit &&
                previous.state.status === state.status &&
                previous.state.error === state.error &&
                previous.state.playRequested === state.playRequested
                    ? previous
                    : { visitKey: readingVisit, state },
            )
        },
        [readingVisit],
    )
    const readingView: PracticeReadingView | undefined =
        cutReading && snapshot.ready && toolbarPreferences.ready && !blocked
            ? readingAudio.status === 'playing' ||
              (contentPlayback?.visitKey === readingVisit &&
                  contentPlayback.state.status === 'playing')
                ? { status: 'playing', waveStyle: values.readingWave }
                : readingAudio.status === 'error'
                  ? { status: 'blocked-playback', waveStyle: values.readingWave }
                  : practiceMediaSource(question?.readingSource) === null
                    ? { status: 'pending-source', waveStyle: values.readingWave }
                    : undefined
            : undefined
    useEffect(() => {
        // 退场结束才解除练习inert；此时补回入口焦点，独立暂停未解除时继续等待。
        if (!exitFocusPending.current || overlay !== null || pause.paused) return
        exitFocusPending.current = false
        exitTriggerRef.current?.focus()
    }, [overlay, pause.paused])
    const timer = usePracticeTimer(
        snapshot.ready &&
            toolbarPreferences.ready &&
            Boolean(question) &&
            !session.finished &&
            !pause.paused &&
            (!blocked || overlay === 'oral'),
        pause.isPaused,
    )
    const footerItems = getPracticeFooter({
        family: demo.family,
        mode,
        phase: session.phase,
        index: session.index,
        total: questions.length,
        values,
        oralStage: activeOral.stage,
        panelVisible,
    })
    const shortcutConflicts = shortcutFields.flatMap((field) => {
        const error = shortcutError(values, field.key, values[field.key])
        return error ? [`${field.label}：${error}`] : []
    })
    usePracticeCommands({
        rootRef,
        context: {
            family: demo.family,
            mode,
            phase: session.phase,
            oralStage: activeOral.stage,
            hasTarget: Boolean(question?.english.trim()),
            showEvaluation: values.showEvaluation,
            panelVisible,
            scope:
                completionClosing || pause.paused
                    ? 'blocked'
                    : overlay === 'oral'
                      ? 'oral'
                      : overlay === 'finish'
                        ? 'finish'
                        : blocked
                          ? 'blocked'
                          : 'question',
            ready: snapshot.ready,
            answerInputCommands: hasPracticeAnswerInput(mode),
            values,
        },
        onCommand: executeCommand,
    })
    if (!question)
        return (
            <main className="p-8 text-primary">
                本地示例暂无题目。<TldButton onClick={onCatalog}>重新选择</TldButton>
            </main>
        )
    function emit(
        kind: PracticeFeedbackEvent['kind'],
        rating?: PracticeFeedbackEvent['rating'],
    ): void {
        eventSequence.current += 1
        const nextEvent: PracticeFeedbackEvent = {
            id: eventSequence.current,
            kind,
            ...(rating ? { rating } : {}),
        }
        // 在用户操作调用栈内请求播放；React事件消费仍保留并按ID去重。
        feedbackSound.current?.consume(nextEvent, values)
        setEvent(nextEvent)
    }
    function open(next: Overlay): void {
        feedbackSound.current?.stop()
        cancelRemember()
        wordDeck.current?.cancel()
        if (next === 'exit') {
            timer.pause()
            mediaController.current?.pause()
            readingAudio.pause()
            activeOral.pause()
        } else stopPracticeMedia()
        setEvent(undefined)
        if (next === 'oral') activeOral.reset()
        setOverlay(next)
    }
    function requestExit(action: PracticeExitAction): void {
        if (overlay === 'exit' && exitFlow.request(action)) setExitClosing(true)
    }
    function move(delta: number): void {
        if (pendingRemember.current !== null) return
        const nextIndex = Math.min(questions.length - 1, Math.max(0, session.index + delta))
        if (nextIndex === session.index) return
        if (isWordSpelling && question) {
            const direction = getWordSpellingQuestionDirection(session.index, nextIndex)
            if (direction)
                setSpellingQuestionTransition({
                    direction,
                    previous: {
                        key: `${question.id}:${resetRevision}`,
                        question,
                        phase: session.phase,
                        input: session.input,
                    },
                })
        }
        stopPracticeMedia()
        activeOral.reset()
        setPanelVisible(demo.family === 'phonetics')
        setResetRevision((revision) => revision + 1)
        setMessage('')
        if (isWordPronunciation) {
            setWordRemember((current) => moveWordRememberSession(current, current.index + delta))
            dispatch({ type: 'reset' })
        } else dispatch({ type: 'move', delta, total: questions.length })
        emit('questionChange')
    }
    function reset(): void {
        feedbackSound.current?.stop()
        cancelRemember()
        setSpellingQuestionTransition(null)
        wordDeck.current?.reset()
        stopPracticeMedia()
        timer.reset()
        dispatch({ type: 'reset' })
        setWordRemember(
            createWordRememberSession(
                isWordPronunciation
                    ? getWordQuestionOrder(sourceQuestions, wordOptions.order)
                    : sourceQuestions.map((item) => item.id),
            ),
        )
        if (isWordPronunciation) setWordOrderRevision((revision) => revision + 1)
        activeOral.reset()
        setPanelVisible(demo.family === 'phonetics')
        setMessage('')
        setResetRevision((revision) => revision + 1)
        setEvent(undefined)
        setOverlay(null)
    }
    function updateWordOptions(nextOptions: WordToolbarOptions): void {
        if (!wordMode) return
        if (isWordPronunciation && nextOptions.order !== wordOptions.order) {
            cancelRemember()
            wordDeck.current?.cancel()
            stopPracticeMedia()
            activeOral.reset()
            dispatch({ type: 'reset' })
            setPanelVisible(false)
            setMessage('')
            setEvent(undefined)
            setResetRevision((revision) => revision + 1)
        }
        toolbarPreferences.update('word', wordMode, nextOptions)
        answerFocus.request()
    }
    async function toggleFullscreen(): Promise<void> {
        try {
            if (document.fullscreenElement) await document.exitFullscreen()
            else await document.documentElement.requestFullscreen()
        } catch {
            notification.info('当前环境暂不支持全屏，可继续使用窗口练习。')
        }
    }
    function handleNavigationAction(action: PracticeNavigationAction): void {
        if (action === 'answer') executeCommand('practice.panel.toggle')
        else if (action === 'pause') pause.pause()
        else if (action === 'draft') onOpenDraft()
        else if (action === 'fullscreen') void toggleFullscreen()
        else open(action)
    }
    function next(): void {
        if (wordDeck.current) wordDeck.current.next()
        else advanceQuestion()
    }
    function advanceQuestion(): void {
        if (session.index === questions.length - 1) {
            finishSession()
        } else move(1)
    }
    function finishSession(): void {
        stopPracticeMedia()
        activeOral.reset()
        setPanelVisible(false)
        setMessage('')
        dispatch({ type: 'finish' })
        setOverlay('finish')
        emit('chapterComplete')
    }
    function startRemember(): void {
        if (
            !isWordPronunciation ||
            !question ||
            blocked ||
            session.finished ||
            pendingRemember.current !== null ||
            wordDeck.current?.isBusy()
        )
            return
        wordDeck.current?.cancel()
        stopPracticeMedia()
        activeOral.reset()
        setEvent(undefined)
        setMessage('')
        const action: WordRememberAction = { questionId: question.id }
        pendingRemember.current = { action, stage: 'feedback' }
        setRememberAction(action)
        emit('wordRemember')
    }
    function retryCurrentWord(): void {
        if (!isWordPronunciation) {
            dispatch({ type: 'phase', phase: 'answering' })
            return
        }
        if (
            !question ||
            blocked ||
            session.finished ||
            pendingRemember.current !== null ||
            wordDeck.current?.isBusy()
        )
            return
        if (questions.length <= 1) {
            dispatch({ type: 'phase', phase: 'answering' })
            emit('wordRetry')
            return
        }
        const updated = retryWord(wordRemember, question.id)
        if (updated === wordRemember) return
        const started = wordDeck.current?.requeue((): void => {
            setWordRemember(updated)
            dispatch({ type: 'reset' })
            activeOral.reset()
            setMessage('')
            setResetRevision((revision) => revision + 1)
        })
        if (!started) return
        emit('wordRetry')
    }
    function completeRememberFeedback(): void {
        const action = rememberAction
        if (
            action === null ||
            pendingRemember.current?.action !== action ||
            pendingRemember.current.stage !== 'feedback' ||
            blocked ||
            pause.isPaused()
        )
            return
        pendingRemember.current = { action, stage: 'exit' }
        const started = wordDeck.current?.dismiss((): void => {
            if (pendingRemember.current?.action !== action || pause.isPaused() || overlay !== null)
                return
            const updated = rememberWord(wordRemember, action.questionId)
            if (updated === wordRemember) {
                cancelRemember()
                return
            }
            pendingRemember.current = null
            setRememberAction(null)
            setWordRemember(updated)
            dispatch({ type: 'reset' })
            setResetRevision((revision) => revision + 1)
            if (getWordRememberProgress(updated).complete) finishSession()
        }, cancelRemember)
        if (!started) cancelRemember()
    }
    function readAloud(): void {
        if (readingAudio.togglePlayback()) return
        const media = mediaController.current
        if (media) {
            if (media.snapshot().playRequested) media.pause()
            else void media.play()
            return
        }
        setMessage(
            demo.family === 'phonetics'
                ? `朗读顺序：${describePhoneticsReadingPlan(additionalOptions?.naturalPhonics ?? true)}。发音素材未接入，暂不能朗读。`
                : '发音素材未接入，暂不能朗读。',
        )
    }
    function primary(): void {
        if (!question) return
        const action = resolvePracticePrimary({
            family: demo.family,
            mode,
            phase: session.phase,
            oralStage: activeOral.stage,
            quickOral: overlay === 'oral',
        })
        if (action === 'next') next()
        else if (action === 'oral-start') activeOral.start()
        else if (action === 'oral-stop') activeOral.stopAndEvaluate()
        else if (action === 'oral-complete') {
            activeOral.reset()
            if (isWordInput) feedbackSound.current?.stop()
            setOverlay(null)
        } else if (action === 'reveal') dispatch({ type: 'phase', phase: 'revealed' })
        else if (action === 'submit') {
            if (hasPracticeAnswerInput(mode)) {
                answerInput.current?.submit()
                return
            }
            if (
                mode === 'blocks' ? session.blocks.length === 0 : session.input.trim().length === 0
            ) {
                setMessage(mode === 'blocks' ? '请先选择词块。' : '请先输入作答内容。')
                return
            }
            setMessage('本地作答已提交。正式判题尚未接入，本次不标记答对或答错；可继续修改或切题。')
        }
    }
    function submitPracticeAnswer(value: string): void {
        if (!question || blocked || !snapshot.ready || !hasPracticeAnswerInput(mode)) return
        if (session.phase === 'correct' || session.phase === 'revealed' || session.finished) return
        const judgment = judgeWordSpelling(value, question.english, values.ignoreCase)
        if (judgment === 'empty') {
            setMessage('请先输入作答内容。')
            return
        }
        dispatch({
            type: isWordInput ? 'submit-spelling' : 'submit-answer',
            value,
            target: question.english,
            ignoreCase: values.ignoreCase,
        })
        setMessage('')
        if (judgment === 'correct') {
            rootRef.current?.focus({ preventScroll: true })
        }
        emit(judgment)
    }
    function executeCommand(command: PracticeCommand): void {
        if (pause.isPaused()) return
        if (overlay === 'finish' && snapshot.ready) {
            if (completionAction.current !== null) return
            if (command === 'session.replay' || command === 'session.return') {
                // 意图先写入ref，确保reduced-motion同步退场时也读取本次动作。
                completionAction.current = command === 'session.replay' ? 'replay' : 'return'
                setCompletionClosing(true)
            } else if (command === 'session.nextChapter')
                setMessage('当前为本地演示，下一章未接入。可再练一次或返回。')
            return
        }
        if (!snapshot.ready || !question || (blocked && overlay !== 'oral')) return
        if (pendingRemember.current !== null) {
            if (command === 'practice.dismiss') pause.pause()
            return
        }
        if (wordDeck.current?.isBusy()) {
            if (command === 'practice.dismiss') {
                pause.pause()
                return
            }
            if (!wordDeck.current.interruptDrag()) return
        }
        if (command === 'practice.primary') {
            primary()
            return
        }
        if (command === 'practice.contextual') {
            if (
                overlay !== 'oral' &&
                mode !== 'oral' &&
                !isPracticeAnswerVisible(session.phase) &&
                answerInput.current
            ) {
                answerInput.current.space()
            } else if (overlay === 'oral' || mode === 'oral') {
                if (activeOral.stage === 'result') activeOral.replay()
                else primary()
            } else if (mode === 'check' || (demo.family === 'guess' && mode === 'guess')) primary()
            else if (isPracticeAnswerVisible(session.phase) || demo.family === 'picture-reader')
                next()
            else if (
                mode === 'pronounce' ||
                mode === 'listen' ||
                demo.family === 'audio-reader' ||
                demo.family === 'video-reader'
            )
                readAloud()
            return
        }
        if (command === 'practice.oral') {
            if (overlay === 'oral' || mode === 'oral') {
                if (activeOral.stage === 'result') activeOral.rerecord()
                else primary()
            } else if (
                canShowQuickOral(
                    demo.family,
                    mode,
                    session.phase,
                    Boolean(question.english.trim()),
                    values.showEvaluation,
                )
            )
                open('oral')
            return
        }
        if (overlay === 'oral') return
        if (command === 'question.previous') {
            if (wordDeck.current) wordDeck.current.previous()
            else move(-1)
        } else if (command === 'question.next') next()
        else if (command === 'practice.readAloud') readAloud()
        else if (command === 'practice.markMastered' || command === 'practice.markUnfamiliar') {
            if (supportsPracticeKnowledge(demo.family, mode))
                setMessage(
                    command === 'practice.markMastered'
                        ? '掌握状态已演示，暂不记录学习进度。'
                        : '不熟状态已演示，暂不记录学习进度。',
                )
        } else if (
            command === 'practice.panel.show' ||
            command === 'practice.panel.hide' ||
            command === 'practice.panel.toggle'
        ) {
            if (supportsPracticePanel(demo.family, mode))
                setPanelVisible((visible) =>
                    command === 'practice.panel.show'
                        ? true
                        : command === 'practice.panel.hide'
                          ? false
                          : !visible,
                )
        } else if (command === 'practice.dismiss') {
            if (panelVisible) setPanelVisible(false)
            else pause.pause()
        }
    }
    const style: PracticeStyle = {
        fontFamily: appearance.fontFamily,
        '--app-color-practice-background': appearance.backgroundColor,
        '--app-color-practice-answer':
            values.answerColor === 'theme'
                ? demo.family === 'word' || mode === 'typing'
                    ? 'var(--app-color-practice-design-answer)'
                    : 'var(--app-color-practice-sentence-answer)'
                : appearance.answerColor,
        '--app-color-practice-text':
            values.textColor === 'theme'
                ? 'var(--app-color-practice-sentence-answer)'
                : appearance.textColor,
        ...(values.textColor !== 'theme'
            ? { '--app-color-practice-muted': appearance.textColor }
            : {}),
    }
    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            className={isWordPronunciation ? 'overflow-clip outline-none' : 'outline-none'}
            style={style}
            data-practice-phase={session.phase}
            data-practice-index={session.index}
            data-practice-oral-stage={activeOral.stage}
            data-practice-paused={pause.paused}
            data-practice-pause-enabled={PRACTICE_PAUSE_ENABLED}
        >
            <PracticeBackgroundSurface
                variant="session"
                image={values.backgroundSource === 'image' ? snapshot.background.image : null}
                dim={values.backgroundDim}
                blur={values.backgroundBlur}
                color={appearance.backgroundColor}
                fontFamily={appearance.fontFamily}
            >
                <div
                    inert={blocked}
                    data-word-input-layout={isWordInput || undefined}
                    className={
                        isWordInput
                            ? 'flex h-dvh min-w-0 flex-col overflow-hidden pb-[calc(100px+env(safe-area-inset-bottom))]'
                            : footerItems.length > 0
                              ? 'flex min-h-dvh min-w-0 flex-col pb-[calc(100px+env(safe-area-inset-bottom))]'
                              : 'flex min-h-dvh min-w-0 flex-col'
                    }
                >
                    <header
                        data-practice-header
                        className={
                            demo.family === 'guess' || demo.family.endsWith('-reader')
                                ? 'flex min-h-[72px] min-w-0 items-center justify-between gap-x-4 gap-y-3 px-3 py-[11px] design:h-[72px] design:pr-[10px]'
                                : isWordPronunciation
                                  ? 'relative z-[1] flex min-h-[72px] min-w-0 items-center justify-between gap-x-4 gap-y-3 px-3 py-[11px] design:h-[72px]'
                                  : 'flex min-h-[72px] min-w-0 items-center justify-between gap-x-4 gap-y-3 px-3 py-[11px] design:h-[72px]'
                        }
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-[11px]">
                            <button
                                ref={exitTriggerRef}
                                type="button"
                                aria-label="退出练习"
                                className="shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-focus"
                                onClick={(): void => open('exit')}
                            >
                                <img
                                    alt=""
                                    src={backAsset.src}
                                    className="[filter:var(--app-filter-shell-icon)]"
                                />
                            </button>
                            <div className="flex min-w-0 flex-col gap-[5px]">
                                <h1 className="truncate bg-linear-to-r from-brand-start to-brand-end bg-clip-text text-[16px] font-medium leading-[22px] text-transparent">
                                    本地演示（
                                    {session.finished && isWordPronunciation
                                        ? sourceQuestions.length
                                        : session.index + 1}
                                    /
                                    {session.finished && isWordPronunciation
                                        ? sourceQuestions.length
                                        : questions.length}
                                    ） · {getPracticeModeLabel(demo.family, mode)}
                                </h1>
                                <p className="text-[14px] leading-5 text-secondary">
                                    {demo.title} · 无后台接口
                                </p>
                            </div>
                        </div>
                        <PracticeNavigation
                            family={demo.family}
                            draftOpen={draftOpen}
                            onAction={handleNavigationAction}
                        />
                    </header>
                    <div
                        data-practice-progress
                        role="progressbar"
                        aria-label={isWordPronunciation ? '单词记住进度' : '本地演示题目进度'}
                        aria-valuemin={0}
                        aria-valuemax={
                            isWordPronunciation ? rememberProgress.total : questions.length
                        }
                        aria-valuenow={
                            isWordPronunciation ? rememberProgress.remembered : session.index + 1
                        }
                        aria-valuetext={
                            isWordPronunciation
                                ? `已记住 ${rememberProgress.remembered} 个，共 ${rememberProgress.total} 个，剩余 ${rememberProgress.remaining} 个`
                                : undefined
                        }
                        className={
                            isWordPronunciation
                                ? 'relative z-[1] h-[3px] shrink-0 bg-primary/40'
                                : 'h-[3px] shrink-0 bg-primary/40'
                        }
                    >
                        <div
                            className="h-full bg-linear-to-r from-brand-start to-brand-end transition-[width] duration-300 ease-out motion-reduce:transition-none"
                            style={{
                                width: `${isWordPronunciation ? rememberProgress.percent : ((session.index + 1) / questions.length) * 100}%`,
                            }}
                        />
                    </div>
                    <main
                        aria-label="练习内容"
                        data-toolbar-ready={toolbarPreferences.ready}
                        data-word-input-scroll={isWordInput || undefined}
                        className={
                            isWordInput
                                ? 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain'
                                : 'relative min-w-0 flex-1'
                        }
                    >
                        <PracticeTimerContext.Provider value={timer}>
                            <fieldset
                                aria-label="本模式局部设置"
                                disabled={!toolbarPreferences.ready}
                                inert={!toolbarPreferences.ready}
                                className="contents disabled:[&_button]:cursor-not-allowed disabled:[&_summary]:cursor-not-allowed"
                            >
                                {wordMode ? (
                                    <WordPracticeToolbar
                                        mode={wordMode}
                                        values={wordOptions}
                                        crystals={getWordSpellingCrystals(
                                            session.spellingStatistics,
                                        )}
                                        onChange={updateWordOptions}
                                        onNotice={setMessage}
                                    />
                                ) : sentenceMode ? (
                                    <SentencePracticeToolbar
                                        mode={sentenceMode}
                                        values={sentenceOptions}
                                        onChange={(next): void => {
                                            toolbarPreferences.update(
                                                'sentence',
                                                sentenceMode,
                                                next,
                                            )
                                            answerFocus.request()
                                        }}
                                        onNotice={setMessage}
                                    />
                                ) : audioMode ? (
                                    <AudioPracticeToolbar
                                        mode={audioMode}
                                        values={audioOptions}
                                        onChange={(next): void => {
                                            toolbarPreferences.update('audio', audioMode, next)
                                            answerFocus.request()
                                        }}
                                        onNotice={setMessage}
                                    />
                                ) : additionalFamily && additionalOptions ? (
                                    <AdditionalPracticeToolbar
                                        family={additionalFamily}
                                        mode={mode}
                                        values={additionalOptions}
                                        answerVisible={isPracticeAnswerVisible(session.phase)}
                                        onChange={(next): void => {
                                            toolbarPreferences.update(additionalFamily, mode, next)
                                            answerFocus.request()
                                        }}
                                        onNotice={setMessage}
                                    />
                                ) : null}
                            </fieldset>
                        </PracticeTimerContext.Provider>
                        <PracticeContent
                            key={
                                demo.family === 'word' && mode === 'pronounce'
                                    ? `word-pronunciation:${wordOrderRevision}`
                                    : isWordSpelling
                                      ? 'word-spelling'
                                      : `${question.id}:${resetRevision}`
                            }
                            demo={demo}
                            mode={mode}
                            question={question}
                            session={session}
                            values={values}
                            imageVisible={
                                wordMode
                                    ? wordOptions.imageVisible
                                    : sentenceMode
                                      ? sentenceOptions.imageVisible
                                      : audioMode
                                        ? audioOptions.imageVisible
                                        : (additionalOptions?.imageVisible ?? true)
                            }
                            {...(wordMode ? { wordOptions } : {})}
                            {...(sentenceMode ? { sentenceOptions } : {})}
                            {...(audioMode ? { audioOptions } : {})}
                            {...(additionalOptions ? { additionalOptions } : {})}
                            blocked={blocked}
                            paused={pause.paused || overlay === 'exit'}
                            questions={questions}
                            cardBusy={wordDeckBusy}
                            isCardBlocked={(): boolean =>
                                pause.isPaused() ||
                                overlay !== null ||
                                pendingRemember.current?.stage === 'feedback'
                            }
                            onCardController={registerWordDeck}
                            onCardBusyChange={setWordDeckBusy}
                            onCardDragStart={(): void => {
                                stopPracticeMedia()
                                setEvent(undefined)
                            }}
                            onCardNavigate={(direction): void => {
                                if (pause.isPaused() || overlay !== null) return
                                if (direction === 'next') advanceQuestion()
                                else move(-1)
                            }}
                            onInput={(value): void => {
                                dispatch({ type: 'input', value })
                                if (isWordInput) emit('typing')
                            }}
                            onAnswerSubmit={submitPracticeAnswer}
                            onAnswerController={registerAnswerInput}
                            spellingQuestionRevision={resetRevision}
                            spellingQuestionTransition={spellingQuestionTransition}
                            onBlock={(id): void => dispatch({ type: 'block', id })}
                            onNote={(id): void => {
                                setNoteTarget(id)
                                if (isWordPronunciation) chapterNotes.open(id)
                                open('note')
                            }}
                            oralEnabled={canShowQuickOral(
                                demo.family,
                                mode,
                                session.phase,
                                Boolean(question.english.trim()),
                                values.showEvaluation,
                            )}
                            onOral={(): void => executeCommand('practice.oral')}
                            onKnown={startRemember}
                            remembering={rememberAction !== null}
                            onRememberFeedbackComplete={completeRememberFeedback}
                            onRetry={retryCurrentWord}
                            onNotice={setMessage}
                            onReveal={(): void => executeCommand('practice.primary')}
                            onPrimary={(): void => executeCommand('practice.primary')}
                            oralController={oral}
                            onMediaController={registerMedia}
                            onPlaybackStateChange={reportContentPlayback}
                            onReadAloud={readAloud}
                            reading={readingView}
                        />
                        {isWordInput && (
                            <WordSpellingResult
                                statistics={isWordSpelling ? session.spellingStatistics : null}
                                disabled={blocked}
                                oralEnabled={canShowQuickOral(
                                    demo.family,
                                    mode,
                                    session.phase,
                                    Boolean(question.english.trim()),
                                    values.showEvaluation,
                                )}
                                onOral={(): void => executeCommand('practice.oral')}
                            />
                        )}
                        {!isWordInput &&
                            !(demo.family === 'sentence' && mode === 'listen') &&
                            canShowQuickOral(
                                demo.family,
                                mode,
                                session.phase,
                                Boolean(question.english.trim()),
                                values.showEvaluation,
                            ) && (
                                <div className="my-4 flex justify-center">
                                    <TldButton
                                        data-practice-quick-oral
                                        data-practice-command="practice.oral"
                                        size="compact"
                                        variant="secondary"
                                        onClick={(): void => executeCommand('practice.oral')}
                                    >
                                        快捷口语评测
                                    </TldButton>
                                </div>
                            )}
                    </main>
                    <PracticeFooter
                        items={footerItems}
                        onAction={executeCommand}
                        blocked={blocked || !snapshot.ready || rememberAction !== null}
                        floating={isWordPronunciation}
                    />
                    <PracticeAnswerPanel
                        portalRoot={rootRef}
                        open={panelVisible}
                        phonetics={demo.family === 'phonetics'}
                        question={question}
                        values={values}
                        blocked={blocked}
                        onClose={(): void => executeCommand('practice.panel.hide')}
                    />
                    {shortcutConflicts.length > 0 && (
                        <p
                            role="alert"
                            className="fixed bottom-[110px] left-4 z-10 max-w-[min(700px,80vw)] rounded-lg bg-surface p-3 text-caption text-danger"
                        >
                            {shortcutConflicts.join('；')}。请在设置的快捷键中修改，冲突项暂不生效。
                        </p>
                    )}

                    {message && (
                        <p
                            role="status"
                            className="pointer-events-none absolute bottom-[100px] left-4 right-4 z-[1] text-center text-caption text-secondary"
                        >
                            {message}
                        </p>
                    )}
                </div>
                <PracticeFeedback
                    values={values}
                    {...(event ? { event } : {})}
                    active={
                        !pause.paused && (!blocked || overlay === 'finish' || overlay === 'oral')
                    }
                    onSoundController={registerFeedbackSound}
                    onStatusChange={setMessage}
                />
            </PracticeBackgroundSurface>
            <TldDialog
                open={overlay === 'settings'}
                onAfterClose={answerFocus.request}
                onOpenChange={(value): void => {
                    if (!value) {
                        if (overlay === 'oral') activeOral.reset()
                        if (overlay === 'finish') onCatalog()
                        setOverlay(null)
                    }
                }}
                title="设置"
                size="full"
                showConfirmButton={false}
                showCancelButton={false}
            >
                <LearningSettingsEditor
                    activeTab={settingsTab}
                    onTabChange={setSettingsTab}
                    presentation="dialog"
                />
            </TldDialog>
            {isSelectablePracticeFamily(demo.family) && (
                <PracticeModeDialog
                    family={demo.family}
                    open={overlay === 'mode'}
                    initialMode={
                        isPracticeSelectionMode(demo.family, mode)
                            ? mode
                            : practiceModeSelections[demo.family].defaultMode
                    }
                    onOpenChange={(value): void => {
                        if (!value) {
                            if (overlay === 'oral') activeOral.reset()
                            setOverlay(null)
                        }
                    }}
                    onStart={(selected): void => {
                        stopPracticeMedia()
                        setOverlay(null)
                        onSelect(demo.id, selected)
                    }}
                />
            )}
            <PracticeErrorFeedbackDialog
                open={overlay === 'report'}
                question={question}
                onClose={(): void => setOverlay(null)}
            />
            {usesPracticeContentDialog(demo.family) ? (
                <PracticeContentDialog
                    open={overlay === 'content'}
                    questions={questions}
                    currentIndex={session.index}
                    onSelect={(index): void => move(index - session.index)}
                    onClose={(): void => setOverlay(null)}
                />
            ) : null}
            <PracticeCompletionDialog
                open={overlay === 'finish' && !completionClosing}
                questionCount={sourceQuestions.length}
                shortcuts={values}
                notice={message}
                onReplay={(): void => executeCommand('session.replay')}
                onReturn={(): void => executeCommand('session.return')}
                onAfterClose={(): void => {
                    const action = completionAction.current
                    completionAction.current = null
                    setCompletionClosing(false)
                    if (action === 'replay') reset()
                    else if (action === 'return') {
                        setOverlay(null)
                        onCatalog()
                    }
                }}
            />
            <PracticeExitDialog
                open={overlay === 'exit' && !exitClosing}
                onAction={requestExit}
                onAfterClose={(): void => {
                    const action = exitFlow.complete()
                    if (action === 'continue') {
                        exitFocusPending.current = true
                        setExitClosing(false)
                        setOverlay(null)
                    } else if (action !== null) onExit(action)
                }}
            />
            <PracticeNotesPanel
                open={overlay === 'note' && isWordPronunciation}
                questions={sourceQuestions}
                controller={chapterNotes}
                onClose={(): void => {
                    chapterNotes.close()
                    setOverlay(null)
                }}
            />
            <TldDialog
                open={
                    overlay !== null &&
                    overlay !== 'settings' &&
                    overlay !== 'report' &&
                    overlay !== 'finish' &&
                    overlay !== 'exit' &&
                    !(overlay === 'oral' && isWordInput) &&
                    !(overlay === 'note' && isWordPronunciation) &&
                    !(overlay === 'content' && usesPracticeContentDialog(demo.family)) &&
                    !(overlay === 'mode' && isSelectablePracticeFamily(demo.family))
                }
                onOpenChange={(value): void => {
                    if (!value) {
                        if (overlay === 'oral') activeOral.reset()
                        setOverlay(null)
                    }
                }}
                title={
                    overlay === 'mode'
                        ? '选择练习模式'
                        : overlay === 'content'
                          ? '学习内容'
                          : overlay === 'reset'
                            ? '重置演示'
                            : overlay === 'note'
                              ? '本题笔记'
                              : '快捷口语评测'
                }
                size={overlay === 'mode' || overlay === 'content' ? 'extra-large' : 'large'}
                showConfirmButton={false}
                showCancelButton={false}
            >
                {overlay === 'mode' && (
                    <div className="grid gap-3 md:grid-cols-2">
                        {demo.modes.map((item) => (
                            <TldButton
                                key={item}
                                variant={item === mode ? 'primary' : 'secondary'}
                                fullWidth
                                onClick={(): void => {
                                    stopPracticeMedia()
                                    setOverlay(null)
                                    onSelect(demo.id, item)
                                }}
                            >
                                {getPracticeModeLabel(demo.family, item)}
                                {item === mode ? ' · 当前' : ''}
                            </TldButton>
                        ))}
                        <TldButton variant="secondary" onClick={onCatalog}>
                            选择其他内容类型
                        </TldButton>
                    </div>
                )}
                {overlay === 'content' && (
                    <div className="space-y-4">
                        {questions.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                className="block w-full cursor-pointer rounded-lg border border-strong p-4 text-left hover:border-brand focus-visible:outline-2 focus-visible:outline-focus"
                                onClick={(): void => {
                                    move(index - session.index)
                                    setOverlay(null)
                                }}
                            >
                                <span className="text-body">
                                    {index + 1}. {item.english}
                                </span>
                                <span className="mt-1 block text-caption text-secondary">
                                    {item.translation} · {index === 0 ? '示例' : '复习示例'}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {overlay === 'note' && (
                    <div className="space-y-3">
                        <p className="text-caption text-secondary">
                            仅保留在本轮演示，刷新或离开演示后清除；暂不上传。
                        </p>
                        <textarea
                            aria-label="本题笔记"
                            value={notes[noteTarget] ?? ''}
                            onChange={(change): void => {
                                const value = change.target.value
                                setNotes((previous) => ({ ...previous, [noteTarget]: value }))
                            }}
                            className="min-h-48 w-full cursor-text rounded-lg border border-strong bg-surface p-3 text-body text-primary focus:outline-2 focus:outline-focus"
                        />
                        <TldButton size="compact" onClick={(): void => setOverlay(null)}>
                            保留并关闭
                        </TldButton>
                    </div>
                )}
                {overlay === 'reset' && (
                    <div className="space-y-4">
                        <p className="text-body">
                            重置本轮题号和作答状态，保留设置及本轮草稿、笔记。
                        </p>
                        <TldButton onClick={reset}>确认重置</TldButton>
                    </div>
                )}
                {overlay === 'oral' && !isWordInput && (
                    <OralDemoPanel
                        waveStyle={values.recordingWave}
                        controller={oral}
                        text={question.english}
                        translation={question.translation}
                        onClose={(): void => {
                            activeOral.reset()
                            setOverlay(null)
                        }}
                    />
                )}
            </TldDialog>
            <OralAssessmentDialog
                open={isWordInput && overlay === 'oral'}
                target={wordOralTarget}
                controller={wordOral}
                onOpenChange={(value): void => {
                    if (!value) {
                        wordOral.reset()
                        feedbackSound.current?.stop()
                        setOverlay(null)
                    }
                }}
                wave={
                    <LearningAudioWave
                        style={wordOral.playing ? values.readingWave : values.recordingWave}
                        active={
                            !wordOral.blocked &&
                            (wordOral.stage === 'recording' || wordOral.playing)
                        }
                    />
                }
            />
            <PracticePauseDialog
                open={pause.paused && !pauseClosing}
                onContinue={(): void => {
                    if (pause.requestResume()) setPauseClosing(true)
                }}
                onAfterClose={(): void => {
                    pause.resume()
                    setPauseClosing(false)
                }}
            />
        </div>
    )
}
