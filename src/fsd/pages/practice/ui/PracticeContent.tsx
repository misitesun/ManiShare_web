'use client'
import { useRef, useState } from 'react'
import type { CSSProperties, ReactElement, ReactNode, RefObject } from 'react'
import type {
    OralAssessmentDemoController,
    OralAssessmentTarget,
} from '../../../features/oral-assessment'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import { TldButton } from '../../../shared/ui/tld-button'
import type {
    PracticeDemo,
    PracticeMode,
    PracticeQuestion,
    PracticeSession,
} from '../model/practice-demo'
import { getPracticeReference } from '../model/reference-layout'
import { practiceTechnicalMediaSources } from '../model/technical-media-samples'
import { hasPracticeAnswerInput, isPracticeAnswerVisible } from '../model/practice-visibility'
import { getWordSpellingLetters } from '../model/word-spelling-input'
import type { WordToolbarOptions } from '../model/word-toolbar-options'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import type { WordSpellingQuestionTransition } from '../model/word-spelling-question-motion'
import {
    getSentenceToolbarTranslationOverride,
    isSentenceToolbarMode,
} from '../model/sentence-toolbar-options'
import type { SentenceToolbarOptions } from '../model/sentence-toolbar-options'
import {
    getAudioToolbarTranslationOverride,
    isAudioToolbarMode,
} from '../model/audio-toolbar-options'
import type { AudioToolbarOptions } from '../model/audio-toolbar-options'
import {
    getAdditionalToolbarTranslationOverride,
    isAdditionalToolbarFamily,
} from '../model/additional-toolbar-options'
import type { AdditionalToolbarOptions } from '../model/additional-toolbar-options'
import type { OralDemoController } from '../model/useOralDemo'
import type { WordCardExample } from '../model/word-card-analysis'
import type { PracticeMediaController } from '../model/media-controller'
import { AnnotatedText } from './AnnotatedText'
import { PracticeMedia } from './PracticeMedia'
import type { PracticePlaybackState } from './PracticeMedia'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { hasPracticeCutReadingControl } from '../model/practice-cut-reading'
import { OralDemoPanel } from './OralDemoPanel'
import { PictureTranslationCover } from './PictureTranslationCover'
import { PictureExerciseCover } from './PictureExerciseCover'
import { PictureListeningExercise } from './PictureListeningExercise'
import { TypingKeyboard } from './TypingKeyboard'
import { WordPronunciationDeck } from './WordPronunciationDeck'
import type { WordCardNavigation, WordPronunciationDeckController } from '../model/word-card-deck'
import { WordAnswerCard } from './WordAnswerCard'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
import { SentenceExercise } from './SentenceExercise'
import { VideoExerciseCover } from './VideoExerciseCover'
import type { VideoListeningPlayback } from '../model/video-listening-playback'
import { isSentenceGameFamily } from '../model/sentence-game-family'
import { SentenceBlocksExercise } from './SentenceBlocksExercise'
import type { SentenceBlockEdit } from '../model/sentence-blocks'
import { SentenceListeningExercise } from './SentenceListeningExercise'
import { WordMeaningExercise } from './WordMeaningExercise'
import { WordTypingExercise } from './WordTypingExercise'
import { SentenceTypingExercise } from './SentenceTypingExercise'
import { WordOralAssessmentExercise } from './WordOralAssessmentExercise'
import type { WordMeaningState } from '../model/word-meaning'
import { SentenceReadingExercise } from './SentenceReadingExercise'
import { createSentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import type { SentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import type { SentenceAnswerSubmission } from '../model/sentence-answer-input'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import { PhoneticsDemo } from './PhoneticsDemo'
import { GuessWordExercise } from './GuessWordExercise'
import { GuessReadingExercise } from './GuessReadingExercise'
import { GuessSpellingExercise } from './GuessSpellingExercise'
import { PureVideoReader } from './PureVideoReader'
import { PureAudioReader } from './PureAudioReader'
import { PurePictureReader } from './PurePictureReader'
import { PureArticleReader } from './PureArticleReader'
import type { PhoneticsReadingSnapshot } from '../model/phonetics-reading-runtime'
import wordAsset from '../assets/word-woman-e23d5f.png'
import sentenceAsset from '../assets/reading-scene.png'
import greetingAsset from '../assets/greeting-scene.png'
import phoneticsAsset from '../assets/phonetics-word.png'
interface ContentStyle extends CSSProperties {
    '--practice-reference-top': string
}
export interface PracticeContentProps {
    readonly demo: PracticeDemo
    readonly mode: PracticeMode
    readonly question: PracticeQuestion
    readonly session: PracticeSession
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly blocked: boolean
    readonly listeningBlind?: boolean
    readonly sentenceReadingDisplay?: SentenceReadingDisplayOptions
    readonly sentenceReadingRevision?: number
    readonly paused?: boolean
    readonly wordOptions?: WordToolbarOptions
    readonly wordMeaning?: WordMeaningState
    readonly sentenceOptions?: SentenceToolbarOptions
    readonly audioOptions?: AudioToolbarOptions
    readonly additionalOptions?: AdditionalToolbarOptions
    readonly onInput: (value: string) => void
    readonly onAnswerSubmit?: ((value: string) => void) | undefined
    readonly onSentenceSubmit?: ((submission: SentenceAnswerSubmission) => void) | undefined
    readonly onSentenceNavigate?: (() => void) | undefined
    readonly onAnswerController?:
        ((controller: WordSpellingInputController | null) => void) | undefined
    readonly spellingQuestionRevision?: number | undefined
    readonly spellingQuestionTransition?: WordSpellingQuestionTransition | null | undefined
    readonly onBlock: (id: string) => void
    readonly onSentenceBlockEdit: (edit: SentenceBlockEdit) => void
    readonly onNote: (questionId: string) => void
    readonly oralEnabled: boolean
    readonly onOral: () => void
    readonly onKnown: () => void
    readonly onRetry: () => void
    readonly onNotice: (message: string) => void
    readonly onReveal: () => void
    readonly onPrimary: () => void
    readonly oralController: OralDemoController
    readonly oralAssessmentController?: OralAssessmentDemoController
    readonly oralAssessmentTarget?: OralAssessmentTarget
    readonly oralAssessmentWave?: ReactNode
    readonly onMediaController: (controller: PracticeMediaController | null) => void
    readonly onPlaybackStateChange?: (state: PracticePlaybackState) => void
    readonly onReadAloud?: () => void
    readonly onExampleReadAloud?: ((example: WordCardExample) => void) | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly guessAnswerOpen?: boolean
    readonly onGuessToggleAnswer?: () => void
    readonly onGuessCloseAnswer?: () => void
    readonly onGuessReadingSelect?: (index: number) => void
    readonly onPictureSelect?: (index: number) => void
    readonly onPictureBusyChange?: (busy: boolean) => void
    readonly guessPortalRoot?: RefObject<HTMLElement | null>
    readonly phoneticsReading?: PhoneticsReadingSnapshot | undefined
    readonly onPhoneticsWordRead?: (() => void) | undefined
    readonly onPhoneticsSegmentRead?: ((segmentId: string) => void) | undefined
    readonly videoExercisePlayback?: VideoListeningPlayback | undefined
    readonly questions?: readonly PracticeQuestion[]
    readonly cardBusy?: boolean
    readonly isCardBlocked?: () => boolean
    readonly onCardController?: (controller: WordPronunciationDeckController | null) => void
    readonly onCardBusyChange?: (busy: boolean) => void
    readonly onCardNavigate?: (direction: WordCardNavigation) => void
    readonly onCardDragStart?: () => void
    readonly remembering?: boolean
    readonly onRememberFeedbackComplete?: () => void
}

function ignoreCardAction(): void {}
function cardNotBlocked(): boolean {
    return false
}
export function PracticeContent({
    demo,
    mode,
    question,
    session,
    values,
    imageVisible,
    blocked,
    listeningBlind = false,
    sentenceReadingDisplay,
    sentenceReadingRevision = 0,
    paused = false,
    wordOptions,
    wordMeaning,
    sentenceOptions,
    audioOptions,
    additionalOptions,
    onInput,
    onAnswerSubmit,
    onSentenceSubmit,
    onSentenceNavigate,
    onAnswerController,
    spellingQuestionRevision,
    spellingQuestionTransition,
    onBlock,
    onSentenceBlockEdit,
    onNote,
    oralEnabled,
    onOral,
    onKnown,
    onRetry,
    onNotice,
    onReveal,
    onPrimary,
    oralController,
    oralAssessmentController,
    oralAssessmentTarget,
    oralAssessmentWave,
    onMediaController,
    onPlaybackStateChange,
    onReadAloud,
    onExampleReadAloud,
    reading,
    guessAnswerOpen = false,
    onGuessToggleAnswer = ignoreCardAction,
    onGuessCloseAnswer = ignoreCardAction,
    onGuessReadingSelect = ignoreCardAction,
    onPictureSelect = ignoreCardAction,
    onPictureBusyChange = ignoreCardAction,
    guessPortalRoot,
    phoneticsReading,
    onPhoneticsWordRead,
    onPhoneticsSegmentRead,
    videoExercisePlayback,
    questions,
    cardBusy = false,
    isCardBlocked = cardNotBlocked,
    onCardController = ignoreCardAction,
    onCardBusyChange = ignoreCardAction,
    onCardNavigate = ignoreCardAction,
    onCardDragStart = ignoreCardAction,
    remembering = false,
    onRememberFeedbackComplete = ignoreCardAction,
}: PracticeContentProps): ReactElement {
    const typingInputRef = useRef<HTMLInputElement>(null)
    const [answerCursor, setAnswerCursor] = useState(0)
    const appearance = getPreviewAppearance(values)
    const localOptions = demo.family === 'word' ? wordOptions : undefined
    const sentenceGameFamily = isSentenceGameFamily(demo.family) ? demo.family : undefined
    const isVideoCheck = demo.family === 'video' && mode === 'check'
    const isVideoTyping = demo.family === 'video' && mode === 'typing'
    const isStandaloneTyping = demo.family === 'typing' && mode === 'typing'
    const isVideoOral = demo.family === 'video' && mode === 'oral'
    const isVideoBlocks = demo.family === 'video' && mode === 'blocks'
    const isVideoTranslation = demo.family === 'video' && mode === 'translate'
    const isPictureTranslation = demo.family === 'picture' && mode === 'translate'
    const isPictureTyping = demo.family === 'picture' && mode === 'typing'
    const isPictureOral = demo.family === 'picture' && mode === 'oral'
    const typingFamily = isStandaloneTyping
        ? 'typing'
        : isVideoTyping
          ? 'video'
          : isPictureTyping
            ? 'picture'
            : sentenceGameFamily
    const blocksFamily = isVideoBlocks ? 'video' : sentenceGameFamily
    const videoExerciseMedia =
        videoExercisePlayback &&
        (isVideoCheck || isVideoTyping || isVideoOral || isVideoBlocks || isVideoTranslation) ? (
            <VideoExerciseCover
                controller={videoExercisePlayback}
                mode={
                    isVideoTranslation
                        ? 'translate'
                        : isVideoBlocks
                          ? 'blocks'
                          : isVideoOral
                            ? 'oral'
                            : isVideoTyping
                              ? 'typing'
                              : 'check'
                }
                blocked={
                    blocked ||
                    (isVideoOral &&
                        (oralAssessmentController?.stage === 'recording' ||
                            oralAssessmentController?.stage === 'evaluating'))
                }
                maskSubtitles={values.maskSubtitles}
                onToggle={onReadAloud ?? videoExercisePlayback.toggle}
            />
        ) : undefined
    const checkFamily =
        isVideoCheck || isVideoTranslation
            ? 'video'
            : isPictureTranslation
              ? 'picture'
              : sentenceGameFamily
    const translationExerciseMedia = isPictureTranslation ? (
        <PictureTranslationCover
            reading={reading}
            blocked={blocked}
            onToggle={onReadAloud ?? ignoreCardAction}
        />
    ) : (
        videoExerciseMedia
    )
    const sentenceGameOptions = demo.family === 'audio' ? audioOptions : sentenceOptions
    const sentenceTranslation =
        demo.family === 'sentence' && sentenceOptions && isSentenceToolbarMode(mode)
            ? getSentenceToolbarTranslationOverride(mode, sentenceOptions)
            : undefined
    const audioTranslation =
        demo.family === 'audio' && audioOptions && isAudioToolbarMode(mode)
            ? getAudioToolbarTranslationOverride(mode, audioOptions)
            : undefined
    const showTranslation =
        sentenceTranslation ??
        audioTranslation ??
        (localOptions && (mode === 'spell' || mode === 'dictate' || mode === 'oral')
            ? localOptions.translationVisible
            : values.showTranslation)
    const showPhonetics =
        localOptions && (mode === 'dictate' || mode === 'meaning')
            ? localOptions.phoneticsVisible
            : values.showPhonetics
    const effectiveImage = imageVisible
    const reference = getPracticeReference(demo.family, mode, session.phase)
    const reader = demo.family.endsWith('-reader')
    const additionalTranslation =
        additionalOptions && isAdditionalToolbarFamily(demo.family)
            ? getAdditionalToolbarTranslationOverride(demo.family, mode, additionalOptions)
            : undefined
    const inputMode = hasPracticeAnswerInput(mode)
    const answerVisible = isPracticeAnswerVisible(session.phase)
    const hideRevealedCover =
        session.phase === 'revealed' &&
        ((checkFamily !== undefined && (mode === 'check' || mode === 'translate')) ||
            (blocksFamily !== undefined && mode === 'blocks'))
    const annotated = mode === 'listen' || answerVisible
    const showEnglish =
        !reader && (mode === 'typing' || !(inputMode || mode === 'blocks') || answerVisible)
    const mediaIsVideo = demo.family === 'video' || demo.family === 'video-reader'
    const mediaIsAudio = demo.family === 'audio' || demo.family === 'audio-reader'
    const source =
        demo.family === 'word' || demo.family === 'guess'
            ? wordAsset.src
            : demo.family === 'phonetics'
              ? phoneticsAsset.src
              : demo.family === 'picture'
                ? greetingAsset.src
                : sentenceAsset.src
    const style: ContentStyle = { '--practice-reference-top': `${reference.top}px` }
    if (demo.family === 'video-reader') return <PureVideoReader />
    if (demo.family === 'text-reader') return <PureArticleReader content={null} />
    if (demo.family === 'audio-reader')
        return <PureAudioReader waveStyle={values.readingWave} active={!blocked && !paused} />
    if (demo.family === 'picture-reader')
        return (
            <PurePictureReader
                index={session.index}
                blocked={blocked || paused}
                onSelect={onPictureSelect}
                onBusyChange={onPictureBusyChange}
            />
        )
    if (demo.family === 'picture' && mode === 'listen')
        return (
            <PictureListeningExercise
                question={question}
                values={values}
                blind={listeningBlind}
                blocked={blocked}
                reading={reading}
                onNote={(): void => onNote(question.id)}
                oralEnabled={oralEnabled}
                onOral={onOral}
            />
        )
    if (demo.family === 'guess' && mode === 'spell')
        return (
            <GuessSpellingExercise
                question={question}
                phase={session.phase}
                input={session.input}
                blocked={blocked}
                showImage={imageVisible && (additionalOptions?.imageVisible ?? true)}
                showKeyboard={additionalOptions?.keyboardVisible ?? true}
                copy={additionalOptions?.copy ?? true}
                ignoreCase={values.ignoreCase}
                borderStyle={appearance.borderStyle}
                displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                answerOpen={guessAnswerOpen}
                onInput={onInput}
                onSubmit={onSentenceSubmit}
                onController={onAnswerController}
                onCloseAnswer={onGuessCloseAnswer}
                onPlay={onReadAloud ?? ignoreCardAction}
                onExamplePlay={
                    onExampleReadAloud ?? ((): void => onNotice('当前例句暂无朗读音源。'))
                }
                onNotice={onNotice}
                reading={reading}
                {...(guessPortalRoot ? { portalRoot: guessPortalRoot } : {})}
            />
        )
    if (demo.family === 'guess' && mode === 'read')
        return (
            <GuessReadingExercise
                questions={questions ?? [question]}
                question={question}
                revision={spellingQuestionRevision ?? 0}
                blocked={blocked}
                answerOpen={guessAnswerOpen}
                onSelect={onGuessReadingSelect}
                onCloseAnswer={onGuessCloseAnswer}
                onPlay={onReadAloud ?? ignoreCardAction}
                onExamplePlay={
                    onExampleReadAloud ?? ((): void => onNotice('当前例句暂无朗读音源。'))
                }
                onNotice={onNotice}
                reading={reading}
                {...(guessPortalRoot ? { portalRoot: guessPortalRoot } : {})}
            />
        )
    if (demo.family === 'guess' && mode === 'guess')
        return (
            <GuessWordExercise
                question={question}
                blocked={blocked}
                showImage={imageVisible && (additionalOptions?.imageVisible ?? true)}
                answerOpen={guessAnswerOpen}
                reading={reading}
                onToggleAnswer={onGuessToggleAnswer}
                onCloseAnswer={onGuessCloseAnswer}
                {...(guessPortalRoot ? { portalRoot: guessPortalRoot } : {})}
                onPlay={onReadAloud ?? ignoreCardAction}
                onExamplePlay={
                    onExampleReadAloud ?? ((): void => onNotice('当前例句暂无朗读音源。'))
                }
                onNotice={onNotice}
            />
        )
    if (
        (demo.family === 'word' ||
            sentenceGameFamily !== undefined ||
            isVideoOral ||
            isPictureOral) &&
        mode === 'oral' &&
        oralAssessmentController &&
        oralAssessmentTarget
    )
        return (
            <WordOralAssessmentExercise
                family={
                    isPictureOral
                        ? 'picture'
                        : isVideoOral
                          ? 'video'
                          : (sentenceGameFamily ?? 'word')
                }
                target={oralAssessmentTarget}
                controller={oralAssessmentController}
                imageVisible={isVideoOral || isPictureOral ? false : imageVisible}
                {...(isPictureOral
                    ? {
                          media: (
                              <PictureExerciseCover
                                  mode="oral"
                                  reading={reading}
                                  blocked={
                                      blocked ||
                                      oralAssessmentController.stage === 'recording' ||
                                      oralAssessmentController.stage === 'evaluating'
                                  }
                                  onToggle={onReadAloud ?? ignoreCardAction}
                              />
                          ),
                      }
                    : isVideoOral
                      ? { media: videoExerciseMedia }
                      : {})}
                translationVisible={additionalTranslation ?? showTranslation}
                reading={reading}
                wave={oralAssessmentWave}
            />
        )
    if (demo.family === 'word' && mode === 'typing')
        return (
            <WordTypingExercise
                question={question}
                phase={session.phase}
                input={session.input}
                blocked={blocked}
                imageVisible={imageVisible}
                copy={wordOptions?.copy ?? true}
                translationVisible={showTranslation}
                ignoreCase={values.ignoreCase}
                displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                reading={reading}
                onInput={onInput}
                onSubmit={onAnswerSubmit}
                onController={onAnswerController}
                onPlay={onReadAloud ?? ((): void => onNotice('单词音源未接入，暂不能朗读。'))}
            />
        )
    if (typingFamily && mode === 'typing')
        return (
            <SentenceTypingExercise
                family={typingFamily}
                question={question}
                phase={session.phase}
                input={session.input}
                blocked={blocked}
                imageVisible={
                    isVideoTyping || isStandaloneTyping || isPictureTyping ? false : imageVisible
                }
                {...(isPictureTyping
                    ? {
                          media: (
                              <PictureExerciseCover
                                  mode="typing"
                                  reading={reading}
                                  blocked={blocked}
                                  onToggle={onReadAloud ?? ignoreCardAction}
                              />
                          ),
                      }
                    : isVideoTyping
                      ? { media: videoExerciseMedia }
                      : {})}
                copy={
                    isStandaloneTyping
                        ? true
                        : isVideoTyping || isPictureTyping
                          ? (additionalOptions?.copy ?? true)
                          : (sentenceGameOptions?.copy ?? true)
                }
                translationVisible={!isStandaloneTyping && showTranslation}
                ignoreCase={values.ignoreCase}
                borderStyle={appearance.borderStyle}
                displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                reading={reading}
                onInput={onInput}
                onSubmit={onSentenceSubmit}
                onController={onAnswerController}
                onPlay={onReadAloud ?? ((): void => onNotice('句子音源未接入，暂不能朗读。'))}
            />
        )
    if (demo.family === 'word' && mode === 'meaning')
        return (
            <WordMeaningExercise
                question={question}
                variant={wordMeaning?.variant ?? 'fill'}
                phase={session.phase}
                input={session.input}
                blocked={blocked}
                imageVisible={imageVisible}
                phoneticsVisible={showPhonetics}
                translationVisible={wordMeaning?.translationVisible ?? false}
                ignoreCase={values.ignoreCase}
                displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                borderStyle={appearance.borderStyle}
                reading={reading}
                onInput={onInput}
                onSubmit={onAnswerSubmit}
                onController={onAnswerController}
                onRevealTranslation={onPrimary}
            />
        )
    if (
        ((demo.family === 'sentence' || demo.family === 'audio') && mode === 'listen') ||
        (blocksFamily !== undefined && mode === 'blocks' && answerVisible) ||
        (checkFamily !== undefined &&
            ((mode === 'translate' && session.phase === 'correct') ||
                (mode === 'check' && answerVisible)))
    )
        return (
            <SentenceListeningExercise
                family={
                    isPictureTranslation
                        ? 'picture'
                        : isVideoCheck || isVideoBlocks || isVideoTranslation
                          ? 'video'
                          : demo.family === 'audio'
                            ? 'audio'
                            : 'sentence'
                }
                annotated={!isVideoBlocks || additionalOptions?.sentenceAnalysisVisible !== false}
                plainEnglish={mode === 'listen'}
                blind={listeningBlind}
                question={question}
                values={values}
                imageVisible={
                    !isVideoCheck &&
                    !isVideoBlocks &&
                    !isVideoTranslation &&
                    !isPictureTranslation &&
                    imageVisible &&
                    !hideRevealedCover
                }
                {...(session.phase === 'correct'
                    ? isPictureTranslation
                        ? { media: translationExerciseMedia }
                        : isVideoCheck || isVideoBlocks || isVideoTranslation
                          ? { media: videoExerciseMedia }
                          : {}
                    : {})}
                translationVisible={
                    isVideoCheck || isVideoBlocks || isVideoTranslation || isPictureTranslation
                        ? (additionalTranslation ?? showTranslation)
                        : showTranslation
                }
                blocked={blocked}
                reading={reading}
                onNote={(): void => onNote(question.id)}
                oralEnabled={oralEnabled}
                onOral={onOral}
            />
        )
    if (demo.family === 'phonetics' && mode !== 'oral')
        return (
            <PhoneticsDemo
                questions={questions ?? [question]}
                index={session.index}
                blocked={blocked}
                isBlocked={isCardBlocked}
                onController={onCardController}
                onBusyChange={onCardBusyChange}
                onNavigate={onCardNavigate}
                onDragStart={onCardDragStart}
                naturalPhonics={additionalOptions?.naturalPhonics ?? true}
                onNotice={onNotice}
                reading={phoneticsReading}
                waveStyle={values.readingWave}
                onWordRead={onPhoneticsWordRead}
                onSegmentRead={onPhoneticsSegmentRead}
                oralController={oralAssessmentController}
                oralEnabled={oralEnabled}
                recordingWave={values.recordingWave}
            />
        )
    if (blocksFamily && mode === 'blocks')
        return (
            <SentenceBlocksExercise
                family={blocksFamily}
                question={question}
                session={session}
                values={values}
                imageVisible={isVideoBlocks ? false : imageVisible}
                {...(isVideoBlocks ? { media: videoExerciseMedia } : {})}
                translationVisible={additionalTranslation ?? showTranslation}
                blocked={blocked}
                onEdit={onSentenceBlockEdit}
                reading={reading}
            />
        )
    if (checkFamily && (mode === 'translate' || mode === 'check'))
        return (
            <SentenceExercise
                family={checkFamily}
                question={question}
                mode={mode}
                session={session}
                values={values}
                imageVisible={
                    !isVideoTranslation &&
                    !isPictureTranslation &&
                    imageVisible &&
                    !hideRevealedCover
                }
                showWordHint={
                    isVideoTranslation || isPictureTranslation
                        ? (additionalOptions?.copy ?? true)
                        : (sentenceGameOptions?.copy ?? true)
                }
                {...(isVideoTranslation ||
                isPictureTranslation ||
                sentenceTranslation !== undefined ||
                audioTranslation !== undefined
                    ? {
                          translationVisible:
                              additionalTranslation ?? sentenceTranslation ?? audioTranslation,
                      }
                    : {})}
                blocked={blocked}
                reading={reading}
                {...(isVideoCheck ? { checkMedia: videoExerciseMedia } : {})}
                {...((isVideoTranslation || isPictureTranslation) && !answerVisible
                    ? { translationMedia: translationExerciseMedia }
                    : {})}
                onInput={onInput}
                onSentenceSubmit={onSentenceSubmit}
                onNavigate={onSentenceNavigate}
                onAnswerController={onAnswerController}
                onBlock={onBlock}
                onReveal={onReveal}
            />
        )
    const media =
        mediaIsVideo || mediaIsAudio ? (
            <div className="mx-auto w-full max-w-full" style={{ maxWidth: reference.mediaWidth }}>
                {mediaIsAudio && effectiveImage && (
                    <div
                        data-practice-reading-surface
                        className="relative mb-5 overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={sentenceAsset.src}
                            alt="音频练习封面"
                            className="block h-auto w-full rounded-[20px] object-cover"
                            style={{
                                aspectRatio: `${reference.mediaWidth}/${reference.mediaHeight}`,
                            }}
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                )}
                <PracticeMedia
                    waveStyle={values.readingWave}
                    kind={mediaIsVideo ? 'video' : 'audio'}
                    title={question.english}
                    source={
                        mediaIsVideo
                            ? practiceTechnicalMediaSources.video
                            : practiceTechnicalMediaSources.audio
                    }
                    aspectRatio={`${reference.mediaWidth}/${reference.mediaHeight}`}
                    {...(mediaIsVideo ? { poster: sentenceAsset.src } : {})}
                    blocked={blocked}
                    paused={paused}
                    onController={onMediaController}
                    {...(onPlaybackStateChange ? { onPlaybackStateChange } : {})}
                    reading={reading}
                    showPlaybackWave={!hasPracticeCutReadingControl(demo.family, mode)}
                />
            </div>
        ) : effectiveImage && demo.family !== 'typing' ? (
            <div
                data-practice-reading-surface
                className="relative mx-auto w-full max-w-full overflow-hidden rounded-[20px]"
                style={{ maxWidth: reference.mediaWidth }}
            >
                <img
                    data-practice-media
                    src={source}
                    alt={demo.family === 'word' ? '单词 woman 的练习插图' : '本地练习示例插图'}
                    className="mx-auto block h-auto w-full max-w-full rounded-[20px] object-cover"
                    style={{
                        maxWidth: reference.mediaWidth,
                        aspectRatio:
                            demo.family === 'word'
                                ? '16 / 9'
                                : `${reference.mediaWidth}/${reference.mediaHeight}`,
                    }}
                />
                <PracticeReadingOverlay reading={reading} />
            </div>
        ) : null
    if (demo.family === 'word' && mode === 'pronounce')
        return (
            <div
                data-word-deck-motion-viewport
                className="relative z-0 px-4 pb-8 pt-16 design:pt-[153px]"
            >
                <WordPronunciationDeck
                    questions={questions ?? [question]}
                    index={session.index}
                    busy={cardBusy}
                    blocked={blocked}
                    isBlocked={isCardBlocked}
                    onController={onCardController}
                    onBusyChange={onCardBusyChange}
                    onNavigate={onCardNavigate}
                    onDragStart={onCardDragStart}
                    question={question}
                    showImage={imageVisible}
                    reading={reading}
                    showTranslation={localOptions ? true : showTranslation}
                    hideEnglish={localOptions?.language === 'translate'}
                    hideTranslation={localOptions?.language === 'interpret'}
                    showPhonetics={localOptions?.phonetics !== 'none'}
                    phoneticMode={localOptions?.phonetics ?? 'original'}
                    displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                    onKnown={onKnown}
                    onRetry={onRetry}
                    remembering={remembering}
                    onRememberFeedbackComplete={onRememberFeedbackComplete}
                    onPlay={
                        onReadAloud ?? ((): void => onNotice('单词发音素材未接入，暂不能朗读。'))
                    }
                    onExamplePlay={
                        onExampleReadAloud ?? ((): void => onNotice('当前例句暂无朗读音源。'))
                    }
                    onAdd={(): void => onNotice('不熟标记暂未开放，当前未保存。')}
                />
            </div>
        )
    if (demo.family === 'word' && (mode === 'spell' || mode === 'dictate'))
        return (
            <div
                data-word-input-question
                className="shrink-0 px-4 pt-16 design:pt-[var(--practice-reference-top)]"
                style={style}
            >
                <WordAnswerCard
                    question={question}
                    mode={mode}
                    phase={session.phase}
                    input={session.input}
                    onInput={onInput}
                    onSubmit={onAnswerSubmit}
                    onSpellingController={onAnswerController}
                    onPlay={onReadAloud}
                    onExamplePlay={onExampleReadAloud}
                    questionRevision={spellingQuestionRevision}
                    questionTransition={spellingQuestionTransition}
                    blocked={blocked}
                    showImage={imageVisible}
                    reading={reading}
                    showTranslation={showTranslation}
                    phoneticMode={localOptions?.phonetics ?? 'original'}
                    showWordHint={localOptions?.copy === true}
                    ignoreCase={values.ignoreCase}
                    showPhonetics={
                        mode === 'spell'
                            ? (localOptions?.phonetics ?? 'original') !== 'none'
                            : answerVisible
                              ? values.showAnswerPhonetics
                              : showPhonetics
                    }
                    onNotice={onNotice}
                    displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                    borderStyle={appearance.borderStyle}
                />
            </div>
        )
    if (sentenceGameFamily && mode === 'read')
        return (
            <SentenceReadingExercise
                family={sentenceGameFamily}
                questions={questions ?? [question]}
                currentQuestionId={question.id}
                revision={sentenceReadingRevision}
                values={values}
                display={sentenceReadingDisplay ?? createSentenceReadingDisplayOptions()}
                blocked={blocked}
                onNote={onNote}
            />
        )
    return (
        <div
            data-reference-node={reference.node}
            className={
                demo.family === 'video' && mode === 'listen'
                    ? 'px-4 pb-8 pt-16 design:pl-0 design:pr-[477px] design:pt-[var(--practice-reference-top)]'
                    : 'px-4 pb-8 pt-16 design:pt-[var(--practice-reference-top)]'
            }
            style={style}
        >
            <div className="mx-auto flex w-full min-w-0 flex-col items-center">
                {media}
                <div
                    className="flex w-full min-w-0 flex-col items-center text-center"
                    style={{ marginTop: reference.textGap }}
                >
                    {demo.family === 'phonetics' && (
                        <p className="mb-5 text-[38px] text-brand">
                            <PracticeWordPhonetics phonetic={question.phonetic} />
                        </p>
                    )}
                    {showEnglish && (
                        <div
                            className="max-w-full"
                            style={
                                mode === 'check' && session.phase === 'answering'
                                    ? { filter: `blur(${appearance.blur}px)` }
                                    : undefined
                            }
                        >
                            <AnnotatedText
                                question={question}
                                values={values}
                                annotated={annotated && !reader}
                                role={mode === 'typing' ? 'typing' : 'exercise'}
                                titleFirstWord={
                                    mode !== 'typing' &&
                                    ['sentence', 'audio', 'video'].includes(demo.family)
                                }
                            />
                        </div>
                    )}
                    {(showPhonetics || mode === 'pronounce') && (
                        <p className="mt-5 text-[24px] font-light text-secondary">
                            <PracticeWordPhonetics
                                phonetic={question.phonetic}
                                breakdown={question.wordPhonetics}
                                mode={localOptions?.phonetics ?? 'original'}
                            />
                        </p>
                    )}
                    {!reader &&
                        demo.family !== 'typing' &&
                        (additionalTranslation ??
                            audioTranslation ??
                            (showTranslation || mode === 'translate')) && (
                            <p
                                data-practice-translation
                                className="max-w-full break-words text-[20px] font-medium text-practice-text md:text-[24px] design:text-[30px]"
                                style={{ marginTop: showEnglish ? reference.translationGap : 0 }}
                            >
                                {question.translation}
                            </p>
                        )}
                    {inputMode && !answerVisible && (
                        <div className="mt-8 w-full max-w-[900px] min-w-0">
                            <PracticeWordSlotsInput
                                inputRef={typingInputRef}
                                target={question.english}
                                value={session.input}
                                phase={session.phase}
                                blocked={blocked}
                                onChange={onInput}
                                onSubmit={onAnswerSubmit}
                                onController={onAnswerController}
                                onCursorChange={setAnswerCursor}
                                ignoreCase={values.ignoreCase}
                                alphabet={mode === 'typing' ? 'typing' : 'text'}
                                displayFontSize={
                                    values.fontSize === '默认' ? undefined : appearance.fontSize
                                }
                                borderStyle={appearance.borderStyle}
                            />
                        </div>
                    )}
                    {mode === 'blocks' && (
                        <div className="mt-8 w-full max-w-[900px] space-y-4">
                            <div
                                aria-label="已选择的词块，点击撤回"
                                className="flex min-h-16 flex-wrap justify-center gap-3 rounded-xl border border-dashed border-strong p-3"
                            >
                                {session.blocks.length === 0 ? (
                                    <span className="self-center text-caption text-secondary">
                                        点击下面词块组成句子
                                    </span>
                                ) : (
                                    session.blocks.map((id) => (
                                        <TldButton
                                            key={id}
                                            size="compact"
                                            onClick={(): void => onBlock(id)}
                                        >
                                            {question.tokens.find((token) => token.id === id)?.text}
                                        </TldButton>
                                    ))
                                )}
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {question.tokens
                                    .slice()
                                    .reverse()
                                    .map((token) => (
                                        <TldButton
                                            key={token.id}
                                            size="compact"
                                            variant="secondary"
                                            disabled={session.blocks.includes(token.id) || blocked}
                                            onClick={(): void => onBlock(token.id)}
                                        >
                                            {token.text}
                                        </TldButton>
                                    ))}
                            </div>
                        </div>
                    )}
                    {session.phase !== 'answering' && (
                        <p role="status" className="mt-5 text-caption text-brand">
                            {session.phase === 'revealed'
                                ? '答案已揭晓（演示，不记为答对）'
                                : session.phase === 'correct'
                                  ? '答对状态演示'
                                  : '答错状态演示，可重试'}
                        </p>
                    )}
                    {mode === 'oral' && (
                        <div className="mt-8 w-full max-w-[600px]">
                            <OralDemoPanel
                                controller={oralController}
                                waveStyle={values.recordingWave}
                            />
                        </div>
                    )}
                    {['typing', 'blocks', 'meaning', 'guess'].includes(mode) && (
                        <TldButton
                            data-practice-command="practice.primary"
                            size="compact"
                            variant="secondary"
                            disabled={blocked}
                            onClick={onPrimary}
                        >
                            {answerVisible
                                ? '下一题'
                                : mode === 'typing'
                                  ? '确认输入'
                                  : mode === 'guess'
                                    ? '显示答案'
                                    : '提交作答'}
                        </TldButton>
                    )}
                </div>
            </div>
            {mode === 'typing' && (
                <div style={{ marginTop: reference.keyboardGap }}>
                    <TypingKeyboard
                        width={reference.keyboardWidth}
                        height={reference.keyboardHeight}
                        inputRef={typingInputRef}
                        targetText={
                            mode === 'typing'
                                ? getWordSpellingLetters(question.english, 'typing').join('')
                                : undefined
                        }
                        input={getWordSpellingLetters(
                            session.input,
                            mode === 'typing' ? 'typing' : 'text',
                        ).join('')}
                        cursor={answerCursor}
                        active={!blocked && !answerVisible}
                        sessionKey={`${question.id}:${mode}`}
                    />
                </div>
            )}
            {demo.family === 'video' && mode === 'listen' && (
                <aside className="mx-auto mt-8 w-full max-w-[447px] rounded-[16px] border border-strong bg-surface/70 p-4 design:absolute design:right-[30px] design:top-[63px] design:mt-0 design:h-[922px] design:w-[447px]">
                    <h2 className="mb-[14px] h-[22px] text-[16px] font-medium">句子列表（演示）</h2>
                    <div className="flex min-h-[72px] flex-col justify-center gap-[5px] rounded-lg border border-brand/70 p-3">
                        <p className="text-[16px]">{question.english}</p>
                        <p className="text-[14px] text-secondary">{question.translation}</p>
                    </div>
                    <p className="mt-4 text-caption text-secondary">
                        技术片段不含课程语音，暂不演示句子与片段的同步。
                    </p>
                </aside>
            )}
        </div>
    )
}
