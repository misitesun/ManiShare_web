'use client'
import { useRef } from 'react'
import type { CSSProperties, ReactElement } from 'react'
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
import { isPracticeAnswerVisible } from '../model/practice-visibility'
import type { WordToolbarOptions } from '../model/word-toolbar-options'
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
import type { PracticeMediaController } from '../model/media-controller'
import { AnnotatedText } from './AnnotatedText'
import { PracticeMedia } from './PracticeMedia'
import type { PracticePlaybackState } from './PracticeMedia'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { hasPracticeCutReadingControl } from '../model/practice-cut-reading'
import { OralDemoPanel } from './OralDemoPanel'
import { PictureScene } from './PictureScene'
import { TypingKeyboard } from './TypingKeyboard'
import { WordPronunciationDeck } from './WordPronunciationDeck'
import type { WordCardNavigation, WordPronunciationDeckController } from '../model/word-card-deck'
import { WordAnswerCard } from './WordAnswerCard'
import { SentenceExercise } from './SentenceExercise'
import { SentenceListeningExercise } from './SentenceListeningExercise'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import { PhoneticsDemo } from './PhoneticsDemo'
import wordAsset from '../assets/word-woman-e23d5f.png'
import sentenceAsset from '../assets/reading-scene.png'
import greetingAsset from '../assets/greeting-scene.png'
import audioCoverAsset from '../assets/audio-cover.png'
import pictureReaderAsset from '../assets/picture-reader.png'
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
    readonly paused?: boolean
    readonly wordOptions?: WordToolbarOptions
    readonly sentenceOptions?: SentenceToolbarOptions
    readonly audioOptions?: AudioToolbarOptions
    readonly additionalOptions?: AdditionalToolbarOptions
    readonly onInput: (value: string) => void
    readonly onWordSpellingSubmit?: ((value: string) => void) | undefined
    readonly onBlock: (id: string) => void
    readonly onNote: (questionId: string) => void
    readonly oralEnabled: boolean
    readonly onOral: () => void
    readonly onKnown: () => void
    readonly onRetry: () => void
    readonly onNotice: (message: string) => void
    readonly onReveal: () => void
    readonly onPrimary: () => void
    readonly oralController: OralDemoController
    readonly onMediaController: (controller: PracticeMediaController | null) => void
    readonly onPlaybackStateChange?: (state: PracticePlaybackState) => void
    readonly onReadAloud?: () => void
    readonly reading?: PracticeReadingView | undefined
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
    paused = false,
    wordOptions,
    sentenceOptions,
    audioOptions,
    additionalOptions,
    onInput,
    onWordSpellingSubmit,
    onBlock,
    onNote,
    oralEnabled,
    onOral,
    onKnown,
    onRetry,
    onNotice,
    onReveal,
    onPrimary,
    oralController,
    onMediaController,
    onPlaybackStateChange,
    onReadAloud,
    reading,
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
    const appearance = getPreviewAppearance(values)
    const localOptions = demo.family === 'word' ? wordOptions : undefined
    const sentenceTranslation =
        demo.family === 'sentence' && sentenceOptions && isSentenceToolbarMode(mode)
            ? getSentenceToolbarTranslationOverride(mode, sentenceOptions)
            : undefined
    const showTranslation =
        sentenceTranslation ??
        (localOptions && (mode === 'spell' || mode === 'dictate' || mode === 'oral')
            ? localOptions.translationVisible
            : values.showTranslation)
    const showPhonetics =
        localOptions && (mode === 'dictate' || mode === 'meaning')
            ? localOptions.phoneticsVisible
            : values.showPhonetics
    const effectiveImage =
        imageVisible &&
        !(demo.family === 'word' && mode === 'dictate' && session.phase === 'correct')
    const reference = getPracticeReference(demo.family, mode, session.phase)
    const reader = demo.family.endsWith('-reader')
    const audioTranslation =
        demo.family === 'audio' && audioOptions && isAudioToolbarMode(mode)
            ? getAudioToolbarTranslationOverride(mode, audioOptions)
            : undefined
    const additionalTranslation =
        additionalOptions && isAdditionalToolbarFamily(demo.family)
            ? getAdditionalToolbarTranslationOverride(demo.family, mode, additionalOptions)
            : undefined
    const inputMode = ['spell', 'dictate', 'translate', 'meaning', 'guess', 'typing'].includes(mode)
    const answerVisible = isPracticeAnswerVisible(session.phase)
    const annotated =
        mode === 'listen' ||
        (answerVisible &&
            !(
                demo.family === 'video' &&
                mode === 'blocks' &&
                additionalOptions?.sentenceAnalysisVisible === false
            ))
    const showEnglish =
        !reader && (mode === 'typing' || !(inputMode || mode === 'blocks') || answerVisible)
    const mediaIsVideo = demo.family === 'video' || demo.family === 'video-reader'
    const mediaIsAudio = demo.family === 'audio' || demo.family === 'audio-reader'
    const source =
        demo.family === 'word' || demo.family === 'guess'
            ? wordAsset.src
            : demo.family === 'phonetics'
              ? phoneticsAsset.src
              : demo.family === 'picture-reader'
                ? pictureReaderAsset.src
                : demo.family === 'picture'
                  ? greetingAsset.src
                  : sentenceAsset.src
    const style: ContentStyle = { '--practice-reference-top': `${reference.top}px` }
    if (demo.family === 'sentence' && mode === 'listen')
        return (
            <SentenceListeningExercise
                question={question}
                values={values}
                imageVisible={imageVisible}
                translationVisible={showTranslation}
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
                naturalPhonics={additionalOptions?.naturalPhonics ?? true}
                onNote={(): void => onNote(question.id)}
            />
        )
    if (
        demo.family === 'sentence' &&
        (mode === 'translate' || mode === 'check' || mode === 'blocks')
    )
        return (
            <SentenceExercise
                question={question}
                mode={mode}
                session={session}
                values={values}
                imageVisible={imageVisible}
                {...(sentenceTranslation !== undefined
                    ? { translationVisible: sentenceTranslation }
                    : {})}
                blocked={blocked}
                reading={reading}
                onInput={onInput}
                onBlock={onBlock}
                onReveal={onReveal}
            />
        )
    const media =
        mediaIsVideo || mediaIsAudio ? (
            <div className="mx-auto w-full max-w-full" style={{ maxWidth: reference.mediaWidth }}>
                {mediaIsAudio && (effectiveImage || demo.family === 'audio-reader') && (
                    <div
                        data-practice-reading-surface
                        className="relative mb-5 overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={
                                demo.family === 'audio-reader'
                                    ? audioCoverAsset.src
                                    : sentenceAsset.src
                            }
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
            demo.family === 'picture' && (mode === 'listen' || mode === 'translate') ? (
                <PictureScene
                    width={reference.mediaWidth}
                    height={reference.mediaHeight}
                    source={mode === 'translate' ? greetingAsset.src : undefined}
                    reading={reading}
                />
            ) : (
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
                            aspectRatio: `${reference.mediaWidth}/${reference.mediaHeight}`,
                        }}
                    />
                    <PracticeReadingOverlay reading={reading} />
                </div>
            )
        ) : null
    if (demo.family === 'word' && mode === 'pronounce')
        return (
            <div
                data-word-deck-motion-viewport
                className="overflow-clip px-4 pb-8 pt-16 design:pt-[153px]"
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
                    showTranslation={showTranslation}
                    showPhonetics={localOptions?.phonetics !== 'none'}
                    displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                    onKnown={onKnown}
                    onRetry={onRetry}
                    remembering={remembering}
                    onRememberFeedbackComplete={onRememberFeedbackComplete}
                    onPlay={
                        onReadAloud ?? ((): void => onNotice('单词发音素材未接入，暂不能朗读。'))
                    }
                    onNote={(): void => onNote(question.id)}
                    onLookup={(): void =>
                        onNotice(
                            `${question.english}：${question.translation}。当前仅展示本地词义，词典服务未接入。`,
                        )
                    }
                    onAdd={(): void => onNotice('添加词条入口已演示，生词本保存尚未接入。')}
                />
            </div>
        )
    if (demo.family === 'word' && (mode === 'spell' || mode === 'dictate'))
        return (
            <div
                className="px-4 pb-8 pt-16 design:pt-[var(--practice-reference-top)]"
                style={style}
            >
                <WordAnswerCard
                    question={question}
                    mode={mode}
                    phase={session.phase}
                    input={session.input}
                    onInput={onInput}
                    onSubmit={onWordSpellingSubmit}
                    blocked={blocked}
                    showImage={imageVisible}
                    reading={reading}
                    showTranslation={showTranslation}
                    showPhonetics={
                        mode === 'spell' && localOptions?.phonetics === 'none'
                            ? false
                            : answerVisible
                              ? values.showAnswerPhonetics
                              : showPhonetics
                    }
                    onNote={(): void => onNote(question.id)}
                    onNotice={onNotice}
                    displayFontSize={values.fontSize === '默认' ? undefined : appearance.fontSize}
                    borderStyle={appearance.borderStyle}
                />
            </div>
        )
    if (mode === 'read' && !mediaIsAudio && !mediaIsVideo && demo.family !== 'picture-reader')
        return (
            <article className="mx-auto max-w-[1100px] space-y-8 px-4 py-16 text-[20px] text-practice-text">
                <h2 className="text-section-title">阅读全览</h2>
                {[question, { ...question, id: `${question.id}-review` }].map((item) => (
                    <section
                        key={item.id}
                        className="space-y-5 rounded-xl border border-subtle p-5"
                    >
                        <AnnotatedText
                            question={item}
                            values={values}
                            annotated
                            density="reading"
                        />
                        <p>{item.translation}</p>
                        <TldButton
                            size="compact"
                            variant="secondary"
                            onClick={(): void => onNote(item.id)}
                        >
                            添加笔记
                        </TldButton>
                    </section>
                ))}
            </article>
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
            <div
                className={
                    demo.family === 'picture' && mode === 'translate'
                        ? 'mx-auto grid max-w-[1670px] min-w-0 items-center gap-8 xl:grid-cols-[957px_minmax(0,1fr)]'
                        : 'mx-auto flex w-full min-w-0 flex-col items-center'
                }
            >
                {media}
                <div
                    className="flex w-full min-w-0 flex-col items-center text-center"
                    style={{
                        marginTop:
                            demo.family === 'picture' && mode === 'translate'
                                ? 0
                                : reference.textGap,
                    }}
                >
                    {demo.family === 'phonetics' && (
                        <p className="mb-5 text-[38px] text-brand">{question.phonetic}</p>
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
                            {question.phonetic}
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
            {(mode === 'typing' || (demo.family === 'guess' && mode === 'spell')) && (
                <div
                    data-guess-keyboard={demo.family === 'guess' ? '' : undefined}
                    hidden={demo.family === 'guess' && additionalOptions?.keyboardVisible === false}
                    style={{ marginTop: reference.keyboardGap }}
                >
                    <TypingKeyboard
                        width={reference.keyboardWidth}
                        height={reference.keyboardHeight}
                        inputRef={typingInputRef}
                        targetText={mode === 'typing' ? question.english : undefined}
                        input={session.input}
                        active={
                            !blocked &&
                            !answerVisible &&
                            !(
                                demo.family === 'guess' &&
                                additionalOptions?.keyboardVisible === false
                            )
                        }
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
            {demo.family === 'picture' && mode === 'listen' && (
                <aside className="mx-auto mt-8 w-full max-w-[844px] rounded-[16px] border border-strong p-4 design:absolute design:right-9 design:top-[70px] design:mt-0 design:w-[294px]">
                    <h2 className="mb-4 text-[16px] font-medium">播放列表（本地演示）</h2>
                    <p className="text-caption text-secondary">
                        场景词条关联待补齐，暂不虚构列表与区域坐标。
                    </p>
                </aside>
            )}
        </div>
    )
}
