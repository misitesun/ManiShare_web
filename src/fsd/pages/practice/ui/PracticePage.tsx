'use client'
import { useCallback, useEffect, useReducer, useState, useRef, useSyncExternalStore } from 'react'
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
import { practiceDemos, getPracticeModeLabel, getDemoQuestions } from '../model/practice-demo'
import type {
    PracticeMode,
    PracticeRouteResult,
    PracticeSessionAction,
    ResolvedPracticeView,
} from '../model/practice-demo'
import {
    getPracticeGameCrystals,
    initialPracticeCrystalSession,
    reducePracticeCrystalSession,
    supportsPracticeGameCrystals,
} from '../model/practice-game-crystals'
import type { PracticeCrystalSession } from '../model/practice-game-crystals'
import type {
    PracticeFeedbackEvent,
    PracticeFeedbackSoundController,
} from '../model/practice-feedback'
import { waitForSentenceReadingCue } from '../model/sentence-reading-cue'
import { isSentenceGameFamily } from '../model/sentence-game-family'
import { editSentenceBlocks, judgeSentenceBlocks } from '../model/sentence-blocks'
import type { SentenceBlockEdit, SentenceBlocksJudgment } from '../model/sentence-blocks'
import type { PracticeReadingPlaybackScheduler } from '../model/practice-reading-runtime'
import { practiceMediaSource, stopPracticeMedia } from '../model/media-controller'
import type { PracticeMediaController } from '../model/media-controller'
import {
    canShowQuickOral,
    hasPracticeAnswerInput,
    isPracticeAnswerVisible,
} from '../model/practice-visibility'
import { PracticeContent } from './PracticeContent'
import { VideoListeningExercise } from './VideoListeningExercise'
import { VideoPracticeLayout } from './VideoPracticeLayout'
import {
    createVideoListeningPlayback,
    getEmptyVideoReadingSnapshot,
    getEmptyVideoListeningNavigation,
    subscribeInactiveVideoListening,
} from '../model/video-listening-playback'
import { WordSpellingResult } from './WordSpellingResult'
import { PracticeAnswerStatistics } from './PracticeAnswerStatistics'
import { WordSpellingCrystals } from './WordSpellingCrystals'
import { WordMeaningVariantSwitch } from './WordMeaningExercise'
import { initialWordMeaningState, reduceWordMeaningState } from '../model/word-meaning'
import type { WordMeaningVariant } from '../model/word-meaning'
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
import { usePhoneticsReading } from '../model/usePhoneticsReading'
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
import { usePracticeInteractionFocus } from '../model/usePracticeInteractionFocus'
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
import { useVideoExercisePlayback } from '../model/useVideoExercisePlayback'
import { videoListeningSegments } from '../model/video-listening-demo'
import { getWordDemoReadingSource } from '../model/word-demo-reading'
import type { WordCardExample } from '../model/word-card-analysis'
import { getOralAssessmentPlaybackStatus } from '../model/oral-assessment-playback'
import { createAudioListeningReadingSequence } from '../model/audio-listening-reading-sequence'
import { useSentenceListeningAdvance } from '../model/useSentenceListeningAdvance'
import {
    createSentenceListeningPlaybackOptions,
    toggleSentenceListeningPlayback,
    resolveSentenceListeningEnd,
    resolveSentenceListeningNavigation,
} from '../model/sentence-listening-playback'
import type {
    ImmersiveListeningFamily,
    SentenceListeningPlaybackOptions,
    SentenceListeningPlaybackToggle,
    SentenceListeningNavigationOrigin,
} from '../model/sentence-listening-playback'
import { SentenceListeningControls } from './SentenceListeningControls'
import { SentenceReadingDisplay } from './SentenceReadingDisplay'
import {
    createSentenceAnswerLayout,
    isSentenceAnswerComplete,
    judgeSentenceAnswerValues,
} from '../model/sentence-answer-input'
import type { SentenceAnswerSubmission } from '../model/sentence-answer-input'
import { createSentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { getPhoneticsReadingView } from './phonetics-reading-view'
import { resolvePhoneticsOralCommand } from '../model/phonetics-oral-command'
import type { PracticePlaybackState } from './PracticeMedia'
interface PracticePageProps {
    readonly draftScope?: string
    readonly route: PracticeRouteResult
    readonly backPath: string
    readonly onSelect: (demo: string, mode: PracticeMode) => void
    readonly onCatalog: () => void
    readonly onExit: (destination: PracticeExitDestination) => void
    readonly onNextChapter?: (() => void) | undefined
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
    onNextChapter,
}: PracticePageProps): ReactElement {
    const toolbarPreferences = usePracticeToolbarPreferences()
    const scope = draftScope ?? (route.kind === 'demo' ? `demo:${route.view.demo.id}` : 'catalog')
    const draft = usePracticeDrafts(scope)
    const [openDraftScope, setOpenDraftScope] = useState<string | null>(null)
    // 同类下一章保留播放选项；句子与音频各自持有，互不覆盖，不写入本地缓存。
    const [listeningPlaybacks, setListeningPlaybacks] = useState<
        Readonly<Record<ImmersiveListeningFamily, SentenceListeningPlaybackOptions>>
    >(() => ({
        sentence: createSentenceListeningPlaybackOptions(),
        audio: createSentenceListeningPlaybackOptions(),
    }))
    const listeningFamily: ImmersiveListeningFamily =
        route.kind === 'demo' && route.view.demo.family === 'audio' ? 'audio' : 'sentence'
    const [readingPlaybacks, setReadingPlaybacks] = useState<
        Readonly<Record<ImmersiveListeningFamily, SentenceListeningPlaybackOptions>>
    >(() => ({
        sentence: createSentenceListeningPlaybackOptions(),
        audio: createSentenceListeningPlaybackOptions(),
    }))
    const usesReadingPlayback =
        route.kind === 'demo' &&
        isSentenceGameFamily(route.view.demo.family) &&
        route.view.mode === 'read'
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
                    key={entryKey}
                    view={route.view}
                    scope={scope}
                    listeningPlayback={
                        usesReadingPlayback
                            ? readingPlaybacks[listeningFamily]
                            : listeningPlaybacks[listeningFamily]
                    }
                    onListeningPlaybackChange={(next): void => {
                        if (usesReadingPlayback)
                            setReadingPlaybacks((current) => ({
                                ...current,
                                [listeningFamily]: next,
                            }))
                        else
                            setListeningPlaybacks((current) => ({
                                ...current,
                                [listeningFamily]: next,
                            }))
                    }}
                    onNextChapter={onNextChapter}
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
    scope,
    listeningPlayback,
    onListeningPlaybackChange,
    onNextChapter,
    onSelect,
    onCatalog,
    onExit,
    toolbarPreferences,
    draftOpen,
    onOpenDraft,
}: {
    readonly view: ResolvedPracticeView
    readonly scope: string
    readonly listeningPlayback: SentenceListeningPlaybackOptions
    readonly onListeningPlaybackChange: (options: SentenceListeningPlaybackOptions) => void
    readonly onNextChapter: PracticePageProps['onNextChapter']
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
    const isVideoGame = demo.family === 'video'
    const isVideoListening = isVideoGame && mode === 'listen'
    const isVideoCheck = isVideoGame && mode === 'check'
    const isVideoTyping = isVideoGame && mode === 'typing'
    const isVideoOral = isVideoGame && mode === 'oral'
    const isVideoBlocks = isVideoGame && mode === 'blocks'
    const isVideoTranslation = isVideoGame && mode === 'translate'
    const isStandaloneTyping = demo.family === 'typing' && mode === 'typing'
    const isVideoExercise =
        isVideoCheck || isVideoTyping || isVideoOral || isVideoBlocks || isVideoTranslation
    const [videoPlayback] = useState(() =>
        isVideoListening ? createVideoListeningPlayback() : null,
    )
    const [videoExercisePlayback] = useState(() =>
        isVideoExercise
            ? createVideoListeningPlayback({ completion: 'manual', rhythm: 'sentence-end' })
            : null,
    )
    const videoContentPlayback = videoPlayback ?? videoExercisePlayback
    const [fallbackVideoContentOpen, setFallbackVideoContentOpen] = useState(false)
    const [videoCompact, setVideoCompact] = useState(true)
    const reportVideoCompact = useCallback(
        (compact: boolean): void => {
            if (videoContentPlayback) videoContentPlayback.setCompact(compact)
            else setVideoCompact(compact)
        },
        [videoContentPlayback],
    )
    const closeVideoContent = useCallback((): void => {
        if (videoContentPlayback) videoContentPlayback.closeContent()
        else setFallbackVideoContentOpen(false)
    }, [videoContentPlayback])
    const videoExerciseReading = useSyncExternalStore(
        videoExercisePlayback?.subscribe ?? subscribeInactiveVideoListening,
        videoExercisePlayback?.getReadingSnapshot ?? getEmptyVideoReadingSnapshot,
        getEmptyVideoReadingSnapshot,
    )
    const videoNavigation = useSyncExternalStore(
        videoContentPlayback?.subscribeNavigation ?? subscribeInactiveVideoListening,
        videoContentPlayback?.getNavigation ?? getEmptyVideoListeningNavigation,
        videoContentPlayback?.getServerNavigation ?? getEmptyVideoListeningNavigation,
    )
    const videoContentOpen = videoContentPlayback
        ? videoNavigation.contentOpen
        : fallbackVideoContentOpen
    const videoContentModalOpen =
        isVideoGame &&
        (videoContentPlayback
            ? videoNavigation.modalOpen
            : videoCompact && fallbackVideoContentOpen)
    // Sentence前缀表示共用题型，实际来源仍由family隔离。
    const isSentenceGame = isSentenceGameFamily(demo.family)
    const isWordPronunciation = demo.family === 'word' && mode === 'pronounce'
    const isPhoneticsPronunciation = demo.family === 'phonetics' && mode === 'pronounce'
    const usesCardDeck = isWordPronunciation || isPhoneticsPronunciation
    const isWordSpelling = demo.family === 'word' && mode === 'spell'
    const isWordDictation = demo.family === 'word' && mode === 'dictate'
    const isWordTyping = demo.family === 'word' && mode === 'typing'
    const isSentenceTyping =
        (isSentenceGame || isVideoTyping || isStandaloneTyping) && mode === 'typing'
    const isTypingPractice = isWordTyping || isSentenceTyping
    const isWordOral = demo.family === 'word' && mode === 'oral'
    const isSentenceOral = isSentenceGame && mode === 'oral'
    const isOralExercise = isWordOral || isSentenceOral || isVideoOral
    const isSentenceTranslation = (isSentenceGame || isVideoTranslation) && mode === 'translate'
    const isSentenceCheck = (isSentenceGame || isVideoCheck) && mode === 'check'
    const isSentenceInput = isSentenceTranslation || isSentenceTyping
    const isSentenceBlocks = (isSentenceGame || isVideoBlocks) && mode === 'blocks'
    const isWordInput = isWordSpelling || isWordDictation
    const isWordMeaning = demo.family === 'word' && mode === 'meaning'
    const isWordAnswerMode = isWordInput || isWordMeaning
    const [wordMeaning, dispatchWordMeaning] = useReducer(
        reduceWordMeaningState,
        initialWordMeaningState,
    )
    const hasAnswerInput = hasPracticeAnswerInput(
        mode,
        isWordMeaning ? wordMeaning.variant : undefined,
    )
    const isImmersiveListening =
        (demo.family === 'sentence' || demo.family === 'audio') && mode === 'listen'
    const isAudioListening = demo.family === 'audio' && mode === 'listen'
    const [audioReadingSequence] = useState(createAudioListeningReadingSequence)
    const audioReadingPhase = useSyncExternalStore(
        audioReadingSequence.subscribe,
        audioReadingSequence.getSnapshot,
        audioReadingSequence.getServerSnapshot,
    )
    useEffect(() => (): void => audioReadingSequence.reset(), [audioReadingSequence])
    const isSentenceReading = isSentenceGame && mode === 'read'
    const usesPlaybackControls = isImmersiveListening || isSentenceReading
    const [readingDisplay, setReadingDisplay] = useState(createSentenceReadingDisplayOptions)
    const listeningPlaybackRef = useRef(listeningPlayback)
    listeningPlaybackRef.current = listeningPlayback
    const automaticTransitionVisit = useRef<string | null>(null)
    const [spellingQuestionTransition, setSpellingQuestionTransition] =
        useState<WordSpellingQuestionTransition | null>(null)
    const [answerSession, dispatch] = useReducer(
        (current: PracticeCrystalSession, action: PracticeSessionAction): PracticeCrystalSession =>
            reducePracticeCrystalSession(current, action, {
                family: demo.family,
                mode,
                questions: sourceQuestions,
            }),
        initialPracticeCrystalSession,
    )
    const [wordRemember, setWordRemember] = useState(() =>
        createWordRememberSession(sourceQuestions.map((item) => item.id)),
    )
    const [wordOrderRevision, setWordOrderRevision] = useState(0)
    const appliedWordOrder = useRef<WordToolbarOptions['order'] | null>(null)
    const rememberProgress = getWordRememberProgress(wordRemember)
    // 拼读题号由剩余队列拥有；章节完成与是否全部记住独立。
    const session = isWordPronunciation
        ? getWordPronunciationSession(answerSession, wordRemember)
        : videoPlayback
          ? {
                ...answerSession,
                index: videoNavigation.index,
                finished: videoNavigation.finished || answerSession.finished,
            }
          : answerSession
    const isTranslationResult = isSentenceTranslation && session.phase === 'correct'
    const isSentenceResult =
        isTranslationResult ||
        (isSentenceBlocks && isPracticeAnswerVisible(session.phase)) ||
        (isSentenceCheck && isPracticeAnswerVisible(session.phase))
    const isFourRowLayout =
        isWordAnswerMode ||
        isVideoTranslation ||
        isTypingPractice ||
        isOralExercise ||
        isImmersiveListening ||
        isSentenceCheck ||
        isSentenceBlocks ||
        isSentenceResult
    const usesOralAssessmentDialog =
        isWordAnswerMode || isTypingPractice || isImmersiveListening || isSentenceResult
    const usesChapterNotes = isWordPronunciation || usesPlaybackControls || isSentenceResult
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
    const [manualReadingVisit, setManualReadingVisit] = useState<string | null>(() => {
        const firstQuestion = sourceQuestions[0]
        if (!isSentenceReading || !firstQuestion) return null
        // 首次进入只登记首题的一次朗读；由既有就绪门控与访问去重执行，不开启自动切题。
        return createPracticeCutReadingVisitKey({
            scope,
            family: demo.family,
            mode,
            questionId: firstQuestion.id,
            index: 0,
            revision: 0,
        })
    })
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [message, setMessage] = useState('')
    const [panelVisible, setPanelVisible] = useState(demo.family === 'phonetics')
    const rootRef = useRef<HTMLDivElement>(null)
    const wordDeck = useRef<WordPronunciationDeckController | null>(null)
    const answerInput = useRef<WordSpellingInputController | null>(null)
    const answerFocusAllowed = useRef(false)
    const keyboardNavigation = useRef(false)
    const [answerFocus] = useState(() =>
        createPracticeAnswerFocusRequest({
            canFocus: (): boolean => answerFocusAllowed.current && !keyboardNavigation.current,
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
            if (controller === null && audioReadingSequence.getSnapshot() === 'waiting')
                audioReadingSequence.cancel()
        },
        [audioReadingSequence],
    )
    const scheduleSentencePlayback = useCallback<PracticeReadingPlaybackScheduler>(
        (complete): (() => void) =>
            waitForSentenceReadingCue(
                feedbackSound.current,
                (allowed): void => {
                    complete(allowed && !document.hidden)
                },
                { waitForAnswerFeedback: isSentenceInput || isSentenceBlocks },
            ),
        [isSentenceInput, isSentenceBlocks],
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
        if (isAudioListening) audioReadingSequence.cancel()
        cancelRemember()
        listeningAdvance.cancel()
        wordDeck.current?.cancel()
        timer.pause()
        videoPlayback?.pause()
        videoExerciseActions.pause()
        mediaController.current?.pause()
        readingAudio.pause()
        phoneticsReading.stop()
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
        id: `${demo.family}:${mode}:${isWordMeaning ? wordMeaning.variant : 'word'}:${wordOralQuestion?.id ?? 'empty'}:${resetRevision}`,
        text: wordOralQuestion?.english ?? '',
        translation: wordOralQuestion?.translation ?? '',
        kind:
            isImmersiveListening ||
            isSentenceInput ||
            isSentenceCheck ||
            isSentenceOral ||
            isVideoOral ||
            isSentenceBlocks
                ? 'sentence'
                : 'word',
    }
    const oralAssessmentActive =
        isOralExercise ||
        (isPhoneticsPronunciation && values.showEvaluation) ||
        (usesOralAssessmentDialog && overlay === 'oral')
    const oralAssessmentBlocked =
        pause.paused ||
        (overlay !== null && (isOralExercise || overlay !== 'oral')) ||
        videoContentModalOpen ||
        (isPhoneticsPronunciation && wordDeckBusy) ||
        session.finished
    const oralReplayAudio = usePracticeReading({
        family: demo.family,
        mode,
        visitKey: wordOralTarget.id,
        source: isVideoExercise
            ? undefined
            : (wordOralQuestion?.readingSource ?? getWordDemoReadingSource(wordOralTarget.text)),
        enabled: false,
        ready:
            oralAssessmentActive &&
            snapshot.ready &&
            toolbarPreferences.ready &&
            Boolean(wordOralTarget.text),
        blocked: oralAssessmentBlocked,
        schedulePlayback: scheduleSentencePlayback,
        onEnded: (endedVisit): void => {
            if (endedVisit === wordOralTarget.id) wordOral.pause()
        },
    })
    const wordOral = useOralAssessmentDemo({
        active: oralAssessmentActive,
        blocked: oralAssessmentBlocked || !snapshot.ready || !toolbarPreferences.ready,
        isPaused: pause.isPaused,
        target: wordOralTarget,
        sampleScores: isOralExercise || isPhoneticsPronunciation ? [40, 70, 85, 96] : undefined,
        playback: {
            status: getOralAssessmentPlaybackStatus(
                isVideoExercise && oralAssessmentActive ? videoExerciseReading : oralReplayAudio,
            ),
            play: (): boolean => {
                readingAudio.pause()
                if (isPhoneticsPronunciation) phoneticsReading.stop()
                mediaController.current?.pause()
                if (videoExercisePlayback) {
                    const segment = videoListeningSegments[session.index]
                    if (!segment) return false
                    videoExerciseActions.pause()
                    videoExercisePlayback.seek(segment.start)
                    void videoExercisePlayback.play()
                    return true
                }
                const available = oralReplayAudio.play()
                setMessage(available ? '' : '当前题目暂无示例朗读音源。')
                return available
            },
            stop: (): void => {
                if (videoExercisePlayback) videoExerciseActions.pause()
                else oralReplayAudio.stop()
            },
        },
        onFeedback: (kind, rating): void => {
            if (kind === 'recordStart') {
                readingAudio.pause()
                if (isPhoneticsPronunciation) phoneticsReading.stop()
                mediaController.current?.pause()
                videoExerciseActions.pause()
            }
            emit(kind, rating)
        },
    })
    useEffect((): void => {
        if (oralAssessmentActive && oralReplayAudio.status === 'error')
            setMessage('音频播放失败，请再次点击播放。')
    }, [oralAssessmentActive, oralReplayAudio.status])
    const activeOral =
        usesOralAssessmentDialog || isOralExercise || isPhoneticsPronunciation ? wordOral : oral
    const phoneticsOralBusy =
        isPhoneticsPronunciation &&
        (wordOral.stage === 'recording' || wordOral.stage === 'evaluating')
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
    const blocked = overlay !== null || pause.paused || videoContentModalOpen
    useEffect((): void => {
        // 列表模态仅阻断背景命令，由播放器自己暂停；选句可在原点击内关闭并播放。
        videoPlayback?.setBlocked(
            overlay !== null ||
                pause.paused ||
                !snapshot.ready ||
                !toolbarPreferences.ready ||
                session.finished,
        )
    }, [
        videoPlayback,
        overlay,
        pause.paused,
        snapshot.ready,
        toolbarPreferences.ready,
        session.finished,
    ])
    useEffect((): void => {
        if (videoNavigation.finished && !answerSession.finished) finishSession()
    }, [videoNavigation.finished, answerSession.finished])
    const quickOralEnabled = canShowQuickOral(
        demo.family,
        mode,
        session.phase,
        Boolean(question?.english.trim()),
        values.showEvaluation,
        isWordMeaning ? wordMeaning.variant : undefined,
    )
    answerFocusAllowed.current =
        snapshot.ready &&
        toolbarPreferences.ready &&
        !blocked &&
        !session.finished &&
        hasAnswerInput &&
        (session.phase === 'answering' || session.phase === 'incorrect')
    usePracticeInteractionFocus({
        rootRef,
        answerInput,
        keyboardNavigation,
        ready: snapshot.ready && toolbarPreferences.ready,
        blocked: blocked || draftOpen || session.finished,
        answerEditable: answerFocusAllowed.current,
        reading: isSentenceReading,
    })
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
        scope,
        family: demo.family,
        mode,
        questionId: question?.id ?? '',
        index: session.index,
        revision: resetRevision,
    })
    const readingSource = isPhoneticsPronunciation
        ? undefined
        : isWordMeaning
          ? (question?.wordMeaning?.readingSource ?? question?.readingSource)
          : question?.readingSource
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
    const manualReadingRequested = isSentenceReading && manualReadingVisit === readingVisit
    const readingEnabled =
        !isVideoExercise &&
        (cutReading ||
            manualReadingRequested ||
            (usesPlaybackControls && listeningPlayback.autoAdvance)) &&
        (!isAudioListening || audioReadingPhase === 'ready')
    const videoExerciseActions = useVideoExercisePlayback({
        controller: videoExercisePlayback,
        mode: isVideoTranslation
            ? 'translate'
            : isVideoBlocks
              ? 'blocks'
              : isVideoOral
                ? 'oral'
                : isVideoTyping
                  ? 'typing'
                  : 'check',
        index: session.index,
        visitKey: readingVisit,
        enabled: cutReading && overlay !== 'oral',
        ready: snapshot.ready && toolbarPreferences.ready && Boolean(question),
        blocked:
            pause.paused ||
            (overlay !== null && overlay !== 'oral') ||
            session.finished ||
            (isVideoOral && (wordOral.stage === 'recording' || wordOral.stage === 'evaluating')),
        suspended: videoContentModalOpen,
        schedulePlayback: scheduleSentencePlayback,
        onNotice: setMessage,
    })
    const listeningAdvance = useSentenceListeningAdvance({
        visitKey: readingVisit,
        enabled:
            usesPlaybackControls &&
            listeningPlayback.autoAdvance &&
            !blocked &&
            !session.finished &&
            snapshot.ready &&
            toolbarPreferences.ready &&
            Boolean(question),
        onAdvance: handleListeningAudioEnded,
    })
    const readingAudio = usePracticeReading({
        family: demo.family,
        mode,
        visitKey: readingVisit,
        ...(readingSource ? { source: readingSource } : {}),
        enabled: readingEnabled,
        sequenceEnabled:
            isSentenceReading && (listeningPlayback.autoAdvance || manualReadingRequested),
        ready: snapshot.ready && toolbarPreferences.ready && Boolean(question),
        blocked:
            blocked ||
            session.finished ||
            rememberAction !== null ||
            (isOralExercise && (wordOral.stage === 'recording' || wordOral.stage === 'evaluating')),
        onEnded: usesPlaybackControls ? listeningAdvance.schedule : undefined,
        schedulePlayback:
            demo.family === 'sentence' ||
            (demo.family === 'audio' && !isAudioListening) ||
            demo.family === 'word'
                ? scheduleSentencePlayback
                : undefined,
    })
    const phoneticsReading = usePhoneticsReading(
        {
            question,
            visitKey: readingVisit,
            naturalPhonics: additionalOptions?.naturalPhonics ?? true,
            enabled: isPhoneticsPronunciation,
            ready: snapshot.ready && toolbarPreferences.ready && Boolean(question),
            blocked: blocked || session.finished || wordDeckBusy || phoneticsOralBusy,
        },
        scheduleSentencePlayback,
    )
    const [contentPlayback, setContentPlayback] = useState<{
        readonly visitKey: string
        readonly state: PracticePlaybackState
    } | null>(null)
    const sentencePlaybackActive = readingAudio.playRequested || listeningPlayback.autoAdvance
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
        (readingEnabled ||
            ((demo.family === 'word' ||
                isSentenceInput ||
                isSentenceCheck ||
                isSentenceOral ||
                isSentenceBlocks) &&
                (readingAudio.playRequested || readingAudio.status === 'error'))) &&
        snapshot.ready &&
        toolbarPreferences.ready &&
        !blocked
            ? readingAudio.status === 'playing' ||
              (contentPlayback?.visitKey === readingVisit &&
                  contentPlayback.state.status === 'playing')
                ? { status: 'playing', waveStyle: values.readingWave }
                : readingAudio.status === 'error'
                  ? { status: 'blocked-playback', waveStyle: values.readingWave }
                  : practiceMediaSource(readingSource) === null
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
        ...(isWordMeaning ? { wordMeaning } : {}),
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
            answerInputCommands: hasAnswerInput,
            ...(isWordMeaning ? { wordMeaningVariant: wordMeaning.variant } : {}),
            values,
        },
        onCommand: executeKeyboardCommand,
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
        if (isAudioListening && kind === 'questionChange')
            audioReadingSequence.start(feedbackSound.current, nextEvent, values)
        else feedbackSound.current?.consume(nextEvent, values)
        setEvent(nextEvent)
    }
    function open(next: Overlay, questionId?: string): void {
        phoneticsReading.stop()
        if (isVideoGame && next === 'content') {
            if (videoContentPlayback) videoContentPlayback.toggleContent()
            else setFallbackVideoContentOpen((open) => !open)
            return
        }
        videoPlayback?.pause()
        videoExerciseActions.pause()
        if (isAudioListening) audioReadingSequence.cancel()
        listeningAdvance.cancel()
        const noteQuestionId =
            questionId ?? (usesPlaybackControls || isSentenceResult ? question?.id : undefined)
        if (next === 'note' && usesChapterNotes && noteQuestionId !== undefined)
            chapterNotes.open(noteQuestionId)
        feedbackSound.current?.stop()
        cancelRemember()
        wordDeck.current?.cancel()
        if (next === 'exit') {
            timer.pause()
            mediaController.current?.pause()
            readingAudio.pause()
            activeOral.pause()
        } else if (!videoPlayback) stopPracticeMedia()
        setEvent(undefined)
        if (next === 'oral') activeOral.reset()
        setOverlay(next)
    }
    function requestExit(action: PracticeExitAction): void {
        if (overlay === 'exit' && exitFlow.request(action)) setExitClosing(true)
    }
    function updateListeningPlayback(nextOptions: SentenceListeningPlaybackOptions): void {
        // 先撤销/登记意图，避免同一轮事件中晚到的 ended 读取旧开关。
        listeningPlaybackRef.current = nextOptions
        if (!nextOptions.autoAdvance) listeningAdvance.cancel()
        onListeningPlaybackChange(nextOptions)
    }
    function toggleListeningControl(key: SentenceListeningPlaybackToggle): void {
        if (!usesPlaybackControls || blocked || session.finished) return
        if (isSentenceReading && (key === 'blind' || key === 'autoNextChapter')) return
        if (key === 'autoNextChapter' && onNextChapter === undefined) return
        const nextOptions = toggleSentenceListeningPlayback(listeningPlaybackRef.current, key)
        updateListeningPlayback(nextOptions)
        if (key === 'autoAdvance' && nextOptions.autoAdvance) {
            if (isAudioListening) audioReadingSequence.reset()
            setMessage('')
            // 显式开启需要立即播放；不消耗/改写原手动朗读的 toggle 行为。
            if (!readingAudio.play())
                setMessage('当前题目音频尚未接入，自动切题会在音频可播放后生效。')
        }
    }
    function playListeningPlayback(): void {
        if (!usesPlaybackControls || blocked || session.finished) return
        if (isAudioListening) audioReadingSequence.reset()
        listeningAdvance.cancel()
        setMessage('')
        if (!readingAudio.play()) setMessage('当前题目音频尚未接入，暂不能播放。')
    }
    function cancelPlaybackAutoAdvance(): void {
        if (!usesPlaybackControls) return
        if (isSentenceReading) setManualReadingVisit(null)
        if (isAudioListening) audioReadingSequence.cancel()
        updateListeningPlayback({ ...listeningPlaybackRef.current, autoAdvance: false })
        readingAudio.pause()
        mediaController.current?.pause()
    }
    function pauseListeningPlayback(): void {
        if (!usesPlaybackControls || blocked || session.finished) return
        cancelPlaybackAutoAdvance()
        setMessage('')
    }
    function handleListeningAudioEnded(endedVisit: string): void {
        if (
            !usesPlaybackControls ||
            endedVisit !== readingVisit ||
            automaticTransitionVisit.current === endedVisit ||
            blocked ||
            session.finished ||
            !snapshot.ready ||
            !toolbarPreferences.ready
        )
            return
        const action = resolveSentenceListeningEnd({
            options: listeningPlaybackRef.current,
            index: session.index,
            total: questions.length,
            nextChapterAvailable: isImmersiveListening && onNextChapter !== undefined,
        })
        if (action === 'none') return
        automaticTransitionVisit.current = endedVisit
        if (action === 'next') move(1, 'automatic')
        else if (action === 'repeat') {
            stopPracticeMedia()
            activeOral.reset()
            dispatch({ type: 'reset' })
            setResetRevision((revision) => revision + 1)
            setPanelVisible(false)
            setMessage('')
            emit('questionChange')
        } else if (action === 'next-chapter') {
            stopPracticeMedia()
            activeOral.reset()
            timer.pause()
            onNextChapter?.()
        } else finishSession()
    }
    function prepareListeningNavigation(origin: SentenceListeningNavigationOrigin): void {
        if (isSentenceReading) {
            if (origin === 'manual') cancelPlaybackAutoAdvance()
            return
        }
        if (!isImmersiveListening) return
        const transition = resolveSentenceListeningNavigation(listeningPlaybackRef.current, origin)
        if (transition.interruptAutoAdvance) {
            // 先撤销意图与旧题等待，再暂停媒体，防止同一轮晚到 ended 继续推进。
            updateListeningPlayback(transition.options)
            if (isAudioListening) audioReadingSequence.cancel()
            readingAudio.pause()
            mediaController.current?.pause()
        }
    }
    function move(delta: number, origin: SentenceListeningNavigationOrigin = 'manual'): void {
        phoneticsReading.stop()
        if (videoPlayback) {
            videoPlayback.move(delta)
            return
        }
        if (pendingRemember.current !== null) return
        const nextIndex = Math.min(questions.length - 1, Math.max(0, session.index + delta))
        if (nextIndex === session.index) {
            if (
                origin === 'manual' &&
                (isSentenceReading || listeningPlaybackRef.current.autoAdvance)
            )
                prepareListeningNavigation(origin)
            return
        }
        videoExerciseActions.pause()
        prepareListeningNavigation(origin)
        const nextQuestion = questions[nextIndex]
        if (origin === 'manual' && isSentenceReading && nextQuestion !== undefined) {
            // 单次朗读绑定新访问；不重新打开自动切题，也不改变听力的切读偏好。
            setManualReadingVisit(
                createPracticeCutReadingVisitKey({
                    scope,
                    family: demo.family,
                    mode,
                    questionId: nextQuestion.id,
                    index: nextIndex,
                    revision: resetRevision + 1,
                }),
            )
        }
        listeningAdvance.cancel()
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
        dispatchWordMeaning({ type: 'question' })
        setPanelVisible(demo.family === 'phonetics')
        setResetRevision((revision) => revision + 1)
        setMessage('')
        if (isWordPronunciation) {
            setWordRemember((current) => moveWordRememberSession(current, current.index + delta))
            dispatch({ type: 'reset' })
        } else dispatch({ type: 'move', delta, total: questions.length })
        emit('questionChange')
        if (isSentenceCheck) rootRef.current?.focus({ preventScroll: true })
    }
    function selectVideoContent(index: number): void {
        if (
            overlay !== null ||
            pause.paused ||
            session.finished ||
            !snapshot.ready ||
            !toolbarPreferences.ready ||
            !Number.isInteger(index) ||
            index < 0 ||
            index >= questions.length
        )
            return
        if (videoContentModalOpen) closeVideoContent()
        // 自查沿原切题／切读规则；听力仍由其播放器的显式选句入口自动播放。
        move(index - session.index)
    }
    function reset(): void {
        phoneticsReading.stop()
        closeVideoContent()
        videoExerciseActions.pause()
        if (isAudioListening) audioReadingSequence.reset()
        listeningAdvance.cancel()
        feedbackSound.current?.stop()
        cancelRemember()
        setSpellingQuestionTransition(null)
        wordDeck.current?.reset()
        stopPracticeMedia()
        videoPlayback?.reset()
        timer.reset()
        dispatch({ type: 'reset' })
        dispatchWordMeaning({ type: 'question' })
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
    function changeWordMeaningVariant(variant: WordMeaningVariant): void {
        if (
            !isWordMeaning ||
            blocked ||
            !snapshot.ready ||
            !toolbarPreferences.ready ||
            variant === wordMeaning.variant
        )
            return
        stopPracticeMedia()
        activeOral.reset()
        dispatchWordMeaning({ type: 'variant', value: variant })
        dispatch({ type: 'restart-answer' })
        setResetRevision((revision) => revision + 1)
        setPanelVisible(false)
        setMessage('')
        setEvent(undefined)
        rootRef.current?.focus({ preventScroll: true })
        if (variant === 'fill') answerFocus.request()
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
        if (videoPlayback) {
            videoPlayback.move(1)
            return
        }
        if (session.index === questions.length - 1) {
            prepareListeningNavigation('manual')
            finishSession()
        } else move(1)
    }
    function finishSession(): void {
        phoneticsReading.stop()
        closeVideoContent()
        videoExerciseActions.pause()
        if (isAudioListening) audioReadingSequence.cancel()
        listeningAdvance.cancel()
        if (videoPlayback) videoPlayback.pause()
        else stopPracticeMedia()
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
        if (isStandaloneTyping) return
        if (isPhoneticsPronunciation) {
            if (phoneticsOralBusy) return
            wordOral.pause()
            phoneticsReading.toggle()
            return
        }
        if (videoPlayback) {
            videoPlayback.toggle()
            return
        }
        if (videoExercisePlayback) {
            if (isVideoOral) {
                if (wordOral.stage === 'recording' || wordOral.stage === 'evaluating') return
                const wasRequested = videoExercisePlayback.getSnapshot().playRequested
                wordOral.pause()
                if (wasRequested) {
                    videoExerciseActions.pause()
                    return
                }
            }
            videoExerciseActions.toggle()
            return
        }
        if (isOralExercise) {
            if (wordOral.stage === 'recording' || wordOral.stage === 'evaluating') return
            wordOral.pause()
        }
        if (isSentenceReading || (demo.family === 'sentence' && mode === 'listen')) {
            if (sentencePlaybackActive) pauseListeningPlayback()
            else playListeningPlayback()
            return
        }
        if (isAudioListening) audioReadingSequence.reset()
        listeningAdvance.cancel()
        const readingHandled = readingAudio.togglePlayback()
        if (
            isTypingPractice ||
            ((isSentenceTranslation || isSentenceCheck || isSentenceBlocks) && readingHandled)
        ) {
            // 本地题库已有朗读源；切读关闭时手动播放也在题图展示真实状态。
            setMessage('')
            return
        }
        if (readingHandled) return
        const media = mediaController.current
        if (media) {
            if (media.snapshot().playRequested) media.pause()
            else void media.play()
            return
        }
        setMessage('发音素材未接入，暂不能朗读。')
    }
    function readExampleAloud(example: WordCardExample): void {
        if (
            demo.family !== 'word' ||
            blocked ||
            session.finished ||
            !snapshot.ready ||
            !toolbarPreferences.ready
        )
            return
        const current = question?.wordExamples?.find((item) => item.id === example.id)
        if (!current || current.readingSource !== example.readingSource) return
        const available = readingAudio.toggleSourcePlayback(current.readingSource, readingVisit)
        setMessage(available ? '' : '当前例句暂无朗读音源。')
    }
    function primary(): void {
        if (!question) return
        const action = resolvePracticePrimary({
            family: demo.family,
            mode,
            phase: session.phase,
            oralStage: activeOral.stage,
            quickOral: overlay === 'oral',
            ...(isWordMeaning ? { wordMeaning } : {}),
        })
        if (action === 'next') next()
        else if (action === 'oral-start') activeOral.start()
        else if (action === 'oral-stop') activeOral.stopAndEvaluate()
        else if (action === 'oral-complete') {
            activeOral.reset()
            if (usesOralAssessmentDialog) feedbackSound.current?.stop()
            setOverlay(null)
        } else if (action === 'reveal-translation') {
            dispatchWordMeaning({ type: 'reveal-translation' })
            rootRef.current?.focus({ preventScroll: true })
        } else if (action === 'reveal') {
            dispatch({ type: 'phase', phase: 'revealed' })
            if (isSentenceCheck) {
                emit('answerReveal')
                setPanelVisible(false)
                rootRef.current?.focus({ preventScroll: true })
            }
        } else if (action === 'submit') {
            if (isSentenceBlocks) {
                submitSentenceBlocks()
                return
            }
            if (hasAnswerInput) {
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
        if (!question || blocked || !snapshot.ready || !hasAnswerInput) return
        if (session.phase === 'correct' || session.phase === 'revealed' || session.finished) return
        const judgment = judgeWordSpelling(value, question.english, values.ignoreCase)
        if (judgment === 'empty') {
            setMessage('请先输入作答内容。')
            return
        }
        dispatch({
            type: isWordInput || isWordTyping ? 'submit-spelling' : 'submit-answer',
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
    function presentSentenceBlocksJudgment(judgment: SentenceBlocksJudgment): void {
        if (judgment === 'empty') {
            setMessage('请先选择词块。')
            return
        }
        readingAudio.pause()
        videoExerciseActions.pause()
        setMessage('')
        if (judgment === 'correct') setPanelVisible(false)
        rootRef.current?.focus({ preventScroll: true })
        emit(judgment)
    }
    function changeSentenceBlocks(edit: SentenceBlockEdit): void {
        if (
            !isSentenceBlocks ||
            !question ||
            blocked ||
            !snapshot.ready ||
            !toolbarPreferences.ready
        )
            return
        if (session.finished || isPracticeAnswerVisible(session.phase)) return
        const next = editSentenceBlocks(question.tokens, session.blocks, edit)
        if (next === session.blocks) return
        dispatch({ type: 'edit-sentence-blocks', edit, tokens: question.tokens })
        setMessage('')
        rootRef.current?.focus({ preventScroll: true })
        if (
            edit.type === 'toggle' &&
            !session.blocks.includes(edit.id) &&
            next.length === question.tokens.length
        )
            presentSentenceBlocksJudgment(judgeSentenceBlocks(question.tokens, next))
        else emit('typing')
    }
    function submitSentenceBlocks(): void {
        if (
            !isSentenceBlocks ||
            !question ||
            blocked ||
            !snapshot.ready ||
            !toolbarPreferences.ready
        )
            return
        if (session.finished || isPracticeAnswerVisible(session.phase)) return
        dispatch({ type: 'submit-sentence-blocks', tokens: question.tokens })
        presentSentenceBlocksJudgment(judgeSentenceBlocks(question.tokens, session.blocks))
    }
    function submitSentenceInput(submission: SentenceAnswerSubmission): void {
        if (!isSentenceInput || !question || blocked || !snapshot.ready) return
        if (session.finished || isPracticeAnswerVisible(session.phase)) return
        const layout = createSentenceAnswerLayout(question.english)
        if (!isSentenceAnswerComplete(layout, submission.values)) return
        const judgment = judgeSentenceAnswerValues(layout, submission.values, values.ignoreCase)
        if (judgment === 'empty') return
        // 判题反馈优先，撤销尚未开始的切题朗读并暂停当前声音，避免和对错提示重叠。
        readingAudio.pause()
        videoExerciseActions.pause()
        // 按段判题，空段和末段多词不能因拼接/trim后文本相同而误判正确。
        if (isSentenceTyping || isVideoTranslation)
            dispatch({
                type: isSentenceTyping ? 'submit-sentence-typing' : 'submit-sentence-answer',
                values: submission.values,
                target: question.english,
                ignoreCase: values.ignoreCase,
            })
        else {
            dispatch({ type: 'input', value: submission.value })
            dispatch({ type: 'phase', phase: judgment })
        }
        setMessage('')
        if (judgment === 'correct') {
            setPanelVisible(false)
            rootRef.current?.focus({ preventScroll: true })
        }
        emit(judgment)
    }
    function executeKeyboardCommand(command: PracticeCommand): void {
        const returnToSentence =
            isSentenceGame &&
            (mode === 'listen' || mode === 'read') &&
            (command === 'question.previous' || command === 'question.next') &&
            snapshot.ready &&
            !blocked &&
            !pause.isPaused() &&
            !session.finished &&
            !(command === 'question.next' && session.index === questions.length - 1)
        executeCommand(command)
        if (!returnToSentence) return
        // 阅读回焦列表，让空格走播放／暂停命令，避免再次激活此前聚焦的自动切题按钮。
        const root = rootRef.current
        const target = isSentenceReading
            ? (root?.querySelector<HTMLElement>('[data-sentence-reading-viewport]') ?? root)
            : root
        target?.focus({ preventScroll: true })
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
        if (isPhoneticsPronunciation && quickOralEnabled) {
            const action = resolvePhoneticsOralCommand(wordOral.stage, command)
            if (action !== 'fallback') {
                if (action === 'start') wordOral.start()
                else if (action === 'stop') wordOral.stopAndEvaluate()
                else if (action === 'rerecord') wordOral.rerecord()
                else if (action === 'replay') wordOral.replay()
                return
            }
        }
        if (command === 'practice.primary') {
            primary()
            return
        }
        if (command === 'practice.contextual') {
            if (isWordMeaning && wordMeaning.variant === 'context' && overlay !== 'oral') {
                primary()
                return
            }
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
            } else if (quickOralEnabled) open('oral')
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
            else if (isVideoGame && videoContentOpen) closeVideoContent()
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
    const typingStatistics =
        isTypingPractice && !isStandaloneTyping ? (
            <section
                aria-label="本轮指法统计"
                className="mx-auto mb-4 mt-auto flex w-full min-w-0 shrink-0 justify-center px-4 pt-8"
            >
                <PracticeAnswerStatistics
                    variant="typing"
                    statistics={session.spellingStatistics}
                />
            </section>
        ) : null
    const practiceFooter = (
        <PracticeFooter
            items={footerItems}
            onAction={executeCommand}
            blocked={blocked || !snapshot.ready || rememberAction !== null}
            floating={usesCardDeck}
            embedded={isVideoGame}
            {...(isSentenceReading
                ? { playback: { active: sentencePlaybackActive, onToggle: readAloud } }
                : {})}
        />
    )
    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            className={usesCardDeck ? 'overflow-clip outline-none' : 'outline-none'}
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
                    data-word-input-layout={isWordAnswerMode || isWordTyping || undefined}
                    data-practice-four-row-layout={
                        isVideoTranslation
                            ? 'video-translate'
                            : isImmersiveListening || isSentenceResult
                              ? isVideoCheck
                                  ? 'video-check'
                                  : isVideoBlocks
                                    ? 'video-blocks'
                                    : demo.family === 'audio'
                                      ? 'audio-listening'
                                      : 'sentence-listening'
                              : isSentenceBlocks
                                ? isVideoBlocks
                                    ? 'video-blocks'
                                    : demo.family === 'audio'
                                      ? 'audio-blocks'
                                      : 'sentence-blocks'
                                : isSentenceCheck
                                  ? isVideoCheck
                                      ? 'video-check'
                                      : demo.family === 'audio'
                                        ? 'audio-check'
                                        : 'sentence-check'
                                  : isTypingPractice
                                    ? isStandaloneTyping
                                        ? 'standalone-typing'
                                        : isSentenceTyping
                                          ? isVideoTyping
                                              ? 'video-typing'
                                              : demo.family === 'audio'
                                                ? 'audio-typing'
                                                : 'sentence-typing'
                                          : 'word-typing'
                                    : isOralExercise
                                      ? isVideoOral
                                          ? 'video-oral'
                                          : isSentenceOral
                                            ? demo.family === 'audio'
                                                ? 'audio-oral'
                                                : 'sentence-oral'
                                            : 'word-oral'
                                      : isWordAnswerMode
                                        ? 'word-input'
                                        : undefined
                    }
                    className={
                        isVideoGame && !isVideoListening
                            ? 'flex h-dvh min-w-0 flex-col overflow-hidden'
                            : isFourRowLayout || isSentenceReading
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
                                : usesCardDeck
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
                            {...(isVideoGame ? { contentOpen: videoContentOpen } : {})}
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
                            usesCardDeck
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
                        data-word-input-scroll={isWordAnswerMode || isWordTyping || undefined}
                        data-practice-content-scroll={isFourRowLayout || undefined}
                        className={
                            isVideoGame
                                ? 'relative flex min-h-0 min-w-0 flex-1 flex-col'
                                : isSentenceReading
                                  ? 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
                                  : isFourRowLayout
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
                        {supportsPracticeGameCrystals(demo.family, mode) && (
                            <div className="absolute right-4 top-5 z-[1]">
                                <WordSpellingCrystals
                                    value={getPracticeGameCrystals(answerSession)}
                                />
                            </div>
                        )}
                        {usesPlaybackControls && (
                            <SentenceListeningControls
                                family={demo.family === 'audio' ? 'audio' : 'sentence'}
                                variant={isSentenceReading ? 'reading' : 'listening'}
                                options={listeningPlayback}
                                paused={
                                    !readingAudio.playRequested &&
                                    !(isAudioListening && audioReadingPhase === 'waiting') &&
                                    (!listeningPlayback.autoAdvance ||
                                        (isAudioListening && audioReadingPhase === 'cancelled'))
                                }
                                blocked={
                                    blocked ||
                                    session.finished ||
                                    !snapshot.ready ||
                                    !toolbarPreferences.ready
                                }
                                nextChapterAvailable={onNextChapter !== undefined}
                                onToggle={toggleListeningControl}
                                onPause={pauseListeningPlayback}
                                onPlay={playListeningPlayback}
                            >
                                {isSentenceReading && (
                                    <SentenceReadingDisplay
                                        values={readingDisplay}
                                        blocked={
                                            blocked ||
                                            session.finished ||
                                            !snapshot.ready ||
                                            !toolbarPreferences.ready
                                        }
                                        onChange={setReadingDisplay}
                                    />
                                )}
                            </SentenceListeningControls>
                        )}
                        {videoPlayback ? (
                            <VideoListeningExercise
                                controller={videoPlayback}
                                values={values}
                                blocked={
                                    blocked ||
                                    !snapshot.ready ||
                                    !toolbarPreferences.ready ||
                                    session.finished
                                }
                                answerVisible={panelVisible}
                                onAnswer={(): void => executeCommand('practice.panel.toggle')}
                                onFullscreen={(): void => {
                                    void toggleFullscreen()
                                }}
                            />
                        ) : (
                            <VideoPracticeLayout
                                enabled={isVideoGame}
                                variant="exercise"
                                open={videoContentOpen}
                                currentIndex={session.index}
                                segments={videoListeningSegments}
                                onSelect={selectVideoContent}
                                onClose={closeVideoContent}
                                onCompactChange={reportVideoCompact}
                                controls={practiceFooter}
                            >
                                <PracticeContent
                                    key={
                                        isSentenceReading
                                            ? 'sentence-reading'
                                            : demo.family === 'word' && mode === 'pronounce'
                                              ? `word-pronunciation:${wordOrderRevision}`
                                              : isPhoneticsPronunciation
                                                ? 'phonetics-pronunciation'
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
                                    {...(isWordMeaning ? { wordMeaning } : {})}
                                    {...(sentenceMode ? { sentenceOptions } : {})}
                                    {...(audioMode ? { audioOptions } : {})}
                                    {...(additionalOptions ? { additionalOptions } : {})}
                                    blocked={blocked}
                                    listeningBlind={isImmersiveListening && listeningPlayback.blind}
                                    sentenceReadingDisplay={readingDisplay}
                                    sentenceReadingRevision={resetRevision}
                                    phoneticsReading={
                                        isPhoneticsPronunciation ? phoneticsReading : undefined
                                    }
                                    onPhoneticsWordRead={phoneticsReading.playWord}
                                    onPhoneticsSegmentRead={phoneticsReading.playSegment}
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
                                        phoneticsReading.stop()
                                        if (isPhoneticsPronunciation) wordOral.reset()
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
                                        if (
                                            isWordAnswerMode ||
                                            isTypingPractice ||
                                            isSentenceTranslation
                                        )
                                            emit('typing')
                                    }}
                                    onAnswerSubmit={submitPracticeAnswer}
                                    onSentenceSubmit={submitSentenceInput}
                                    onSentenceNavigate={(): void => {
                                        if (isSentenceTranslation && !blocked && snapshot.ready)
                                            emit('typing')
                                    }}
                                    onAnswerController={registerAnswerInput}
                                    spellingQuestionRevision={resetRevision}
                                    spellingQuestionTransition={spellingQuestionTransition}
                                    onBlock={(id): void => dispatch({ type: 'block', id })}
                                    onSentenceBlockEdit={changeSentenceBlocks}
                                    onNote={(id): void => {
                                        setNoteTarget(id)
                                        open('note', id)
                                    }}
                                    oralEnabled={quickOralEnabled}
                                    onOral={(): void => executeCommand('practice.oral')}
                                    onKnown={startRemember}
                                    remembering={rememberAction !== null}
                                    onRememberFeedbackComplete={completeRememberFeedback}
                                    onRetry={retryCurrentWord}
                                    onNotice={setMessage}
                                    onReveal={(): void => executeCommand('practice.primary')}
                                    onPrimary={(): void => executeCommand('practice.primary')}
                                    oralController={oral}
                                    oralAssessmentController={wordOral}
                                    oralAssessmentTarget={wordOralTarget}
                                    oralAssessmentWave={
                                        <LearningAudioWave
                                            style={
                                                wordOral.playing
                                                    ? values.readingWave
                                                    : values.recordingWave
                                            }
                                            active={
                                                !wordOral.blocked &&
                                                (wordOral.stage === 'recording' || wordOral.playing)
                                            }
                                        />
                                    }
                                    onMediaController={registerMedia}
                                    onPlaybackStateChange={reportContentPlayback}
                                    onReadAloud={readAloud}
                                    {...(videoExercisePlayback ? { videoExercisePlayback } : {})}
                                    onExampleReadAloud={readExampleAloud}
                                    reading={readingView}
                                />
                                {isVideoTyping && typingStatistics}
                            </VideoPracticeLayout>
                        )}
                        {!isVideoTyping && typingStatistics}
                        {isWordAnswerMode && (
                            <WordSpellingResult
                                statistics={isWordSpelling ? session.spellingStatistics : null}
                                disabled={blocked}
                                oralEnabled={quickOralEnabled}
                                onOral={(): void => executeCommand('practice.oral')}
                                controls={
                                    isWordMeaning ? (
                                        <WordMeaningVariantSwitch
                                            value={wordMeaning.variant}
                                            disabled={
                                                blocked ||
                                                !snapshot.ready ||
                                                !toolbarPreferences.ready
                                            }
                                            onChange={changeWordMeaningVariant}
                                        />
                                    ) : undefined
                                }
                            />
                        )}
                        {!isVideoListening &&
                            !isPhoneticsPronunciation &&
                            !usesOralAssessmentDialog &&
                            !isSentenceReading &&
                            quickOralEnabled && (
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
                    {!isVideoGame && practiceFooter}
                    <PracticeAnswerPanel
                        portalRoot={rootRef}
                        open={panelVisible}
                        phonetics={demo.family === 'phonetics'}
                        sentenceTranslation={isSentenceTranslation && !isTranslationResult}
                        sentenceAnswer={isSentenceGame || isVideoListening || isVideoExercise}
                        question={question}
                        values={values}
                        blocked={blocked || phoneticsOralBusy}
                        onClose={(): void => executeCommand('practice.panel.hide')}
                        onPhoneticPlay={
                            isPhoneticsPronunciation ? phoneticsReading.playTarget : undefined
                        }
                        phoneticReading={
                            isPhoneticsPronunciation
                                ? getPhoneticsReadingView(
                                      phoneticsReading,
                                      'target',
                                      values.readingWave,
                                  )
                                : undefined
                        }
                    />
                    {shortcutConflicts.length > 0 && (
                        <p
                            role="alert"
                            className="fixed bottom-[110px] left-4 z-10 max-w-[min(700px,80vw)] rounded-lg bg-surface p-3 text-caption text-danger"
                        >
                            {shortcutConflicts.join('；')}。请在设置的快捷键中修改，冲突项暂不生效。
                        </p>
                    )}

                    {message &&
                        !(isTypingPractice && message === '发音素材未接入，暂不能朗读。') && (
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
            {usesPracticeContentDialog(demo.family, mode) ? (
                <PracticeContentDialog
                    open={overlay === 'content'}
                    englishOnly={isStandaloneTyping}
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
                open={overlay === 'note' && usesChapterNotes}
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
                    !(overlay === 'oral' && usesOralAssessmentDialog) &&
                    !(overlay === 'note' && usesChapterNotes) &&
                    !(
                        overlay === 'content' &&
                        (isVideoGame || usesPracticeContentDialog(demo.family, mode))
                    ) &&
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
                {overlay === 'oral' && !usesOralAssessmentDialog && (
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
                open={usesOralAssessmentDialog && overlay === 'oral'}
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
