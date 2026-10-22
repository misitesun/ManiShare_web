'use client'

import { useId, useRef } from 'react'
import type { ReactElement } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { getWordCardOutlineRadius } from '../model/word-card-outline'
import wordAsset from '../assets/word-woman-e23d5f.png'
import knownAsset from '../assets/known.svg'
import retryAsset from '../assets/retry.svg'
import borderAsset from '../assets/word-card-gradient-border.svg'
import nearBorderAsset from '../assets/word-card-back-near.svg'
import farBorderAsset from '../assets/word-card-back-far.svg'
import analysisAsset from '../assets/word-card-note.svg'
import lookupAsset from '../assets/word-card-lookup.svg'
import addAsset from '../assets/word-card-add.svg'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { WordRememberFeedback } from './WordRememberFeedback'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
import { WordPronunciationAnalysis } from './WordPronunciationAnalysis'
import { useWordCardFlip } from './useWordCardFlip'
import { WordDictionaryLink } from './WordDictionaryLink'
import { WordCardHeading } from './WordCardHeading'

export interface WordPronunciationCardProps {
    question: PracticeQuestion
    showImage: boolean
    showTranslation: boolean
    hideEnglish?: boolean
    hideTranslation?: boolean
    showPhonetics?: boolean
    phoneticMode?: WordPhoneticMode
    onPlay: () => void
    analysisOpen?: boolean
    onAnalysis: () => void
    onAnalysisClose: () => void
    onExamplePlay: (example: WordCardExample) => void
    onAdd: () => void
    displayFontSize?: number | undefined
    disabled?: boolean
    borderDepth?: 'front' | 'near' | 'far'
    reading?: PracticeReadingView | undefined
}

export function WordPronunciationCard(props: WordPronunciationCardProps): ReactElement {
    const { analysisOpen = false, disabled = false } = props
    const rootRef = useRef<HTMLDivElement>(null)
    const rotorRef = useRef<HTMLDivElement>(null)
    const frontRef = useRef<HTMLDivElement>(null)
    const backRef = useRef<HTMLDivElement>(null)
    const analysisId = useId()
    useWordCardFlip(rootRef, { open: analysisOpen, disabled, rotorRef, frontRef, backRef })

    return (
        <div
            ref={rootRef}
            data-word-card-flip
            data-word-analysis-open={analysisOpen}
            className="relative mx-auto w-full max-w-[500px] min-w-0"
            onKeyDownCapture={(event): void => {
                if (
                    !analysisOpen ||
                    disabled ||
                    event.key !== 'Escape' ||
                    event.nativeEvent.isComposing
                )
                    return
                event.preventDefault()
                event.stopPropagation()
                props.onAnalysisClose()
            }}
        >
            <div ref={rotorRef} className="relative w-full">
                <div
                    ref={frontRef}
                    aria-hidden={analysisOpen}
                    inert={analysisOpen}
                    className="relative w-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                >
                    <WordPronunciationCardFront {...props} analysisId={analysisId} />
                </div>
                <div
                    ref={backRef}
                    id={analysisId}
                    aria-hidden={!analysisOpen}
                    inert={!analysisOpen}
                    className="invisible absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                >
                    <WordPronunciationAnalysis
                        question={props.question}
                        disabled={disabled}
                        borderDepth={props.borderDepth ?? 'front'}
                        onBack={props.onAnalysisClose}
                        onExamplePlay={props.onExamplePlay}
                    />
                </div>
            </div>
        </div>
    )
}

interface WordPronunciationCardFrontProps extends WordPronunciationCardProps {
    readonly analysisId: string
}

function WordPronunciationCardFront({
    question,
    showImage,
    showTranslation,
    hideEnglish = false,
    hideTranslation = false,
    showPhonetics = true,
    phoneticMode = 'original',
    onPlay,
    onAnalysis,
    analysisId,
    analysisOpen = false,
    onAdd,
    displayFontSize,
    disabled = false,
    borderDepth = 'front',
    reading,
}: WordPronunciationCardFrontProps): ReactElement {
    const referenceLayout = showImage && displayFontSize === undefined
    const cardBorder =
        borderDepth === 'near'
            ? nearBorderAsset
            : borderDepth === 'far'
              ? farBorderAsset
              : borderAsset
    return (
        <article
            data-word-card-face
            aria-label="单词拼读卡片"
            className="relative mx-auto w-full max-w-[500px] min-w-0"
        >
            <div className="relative">
                <div
                    data-word-card-surface
                    style={{ borderRadius: getWordCardOutlineRadius(borderDepth) }}
                    className={
                        referenceLayout
                            ? 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)] design:h-[500px]'
                            : 'relative overflow-hidden bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                    }
                >
                    {showImage && (
                        <div
                            data-practice-reading-surface
                            className="relative aspect-video w-full overflow-hidden rounded-t-[20px]"
                        >
                            <img
                                data-practice-media
                                src={wordAsset.src}
                                alt="单词练习共用演示插图"
                                width={500}
                                height={281}
                                draggable={false}
                                className="absolute inset-0 block h-full w-full object-cover"
                            />
                            <PracticeReadingOverlay reading={reading} />
                        </div>
                    )}
                    <div
                        className={
                            referenceLayout
                                ? 'flex min-w-0 flex-col items-center px-4 pb-10 pt-6 text-center design:contents'
                                : 'flex min-w-0 flex-col items-center gap-5 px-4 py-10 text-center'
                        }
                    >
                        <WordCardHeading
                            word={question.english}
                            referenceLayout={referenceLayout}
                            hideEnglish={hideEnglish}
                            displayFontSize={displayFontSize}
                            disabled={disabled}
                            onPlay={onPlay}
                        />
                        {showPhonetics && phoneticMode !== 'none' && (
                            <div
                                className={
                                    referenceLayout
                                        ? 'mt-5 max-w-[calc(100%-32px)] design:absolute design:left-1/2 design:top-[379px] design:mt-0 design:-translate-x-1/2'
                                        : 'max-w-full'
                                }
                            >
                                <PracticeWordPhonetics
                                    phonetic={question.phonetic}
                                    breakdown={question.wordPhonetics}
                                    mode={phoneticMode}
                                    density="pronunciation"
                                />
                            </div>
                        )}
                        {showTranslation && (
                            <p
                                data-practice-translation
                                aria-hidden={hideTranslation || undefined}
                                className={
                                    referenceLayout
                                        ? 'm-0 mt-5 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[166px] design:top-[434px] design:mt-0 design:w-[195px]'
                                        : 'm-0 max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted'
                                }
                            >
                                <span className={hideTranslation ? 'invisible' : ''}>
                                    {question.translation}
                                </span>
                            </p>
                        )}
                    </div>
                    <div
                        aria-label="单词辅助操作"
                        className={
                            referenceLayout
                                ? 'flex items-center gap-[14px] px-[14px] pb-[14px] design:absolute design:inset-x-[14px] design:bottom-[14px] design:px-0 design:pb-0'
                                : 'flex items-center gap-[14px] px-[14px] pb-[14px]'
                        }
                    >
                        <button
                            type="button"
                            disabled={disabled}
                            data-word-analysis-trigger
                            aria-label="查看当前单词解析"
                            aria-controls={analysisId}
                            aria-expanded={analysisOpen}
                            onClick={onAnalysis}
                            className="size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                        >
                            <img
                                src={analysisAsset.src}
                                alt=""
                                width={32}
                                height={32}
                                className="[filter:var(--app-filter-practice-icon)]"
                            />
                        </button>
                        <WordDictionaryLink
                            word={question.english}
                            disabled={disabled}
                            appearance="front"
                        >
                            <img
                                src={lookupAsset.src}
                                alt=""
                                width={32}
                                height={32}
                                className="[filter:var(--app-filter-practice-icon)]"
                            />
                        </WordDictionaryLink>
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label="标记当前单词为不熟"
                            onClick={onAdd}
                            className="ml-auto size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                        >
                            <img
                                src={addAsset.src}
                                alt=""
                                width={32}
                                height={32}
                                className="[filter:var(--app-filter-practice-icon)]"
                            />
                        </button>
                    </div>
                    {/* 描边盖在声纹遮罩之上，避免图片底部出现明暗断层。 */}
                    <img
                        data-word-card-border
                        aria-hidden="true"
                        alt=""
                        src={cardBorder.src}
                        width={500}
                        height={500}
                        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                    />
                </div>
            </div>
        </article>
    )
}

export function WordPronunciationActions({
    onRetry,
    onKnown,
    disabled,
    remembering,
    onRememberFeedbackComplete,
}: {
    readonly onRetry: () => void
    readonly onKnown: () => void
    readonly disabled: boolean
    readonly remembering: boolean
    readonly onRememberFeedbackComplete: () => void
}): ReactElement {
    return (
        <div
            data-word-card-actions
            className="relative z-[1] mt-8 flex justify-center gap-20 design:mt-[39px] design:justify-start design:gap-[122px] design:pl-[123px]"
        >
            <button
                type="button"
                disabled={disabled}
                aria-label="再来，将当前单词放到待练队尾"
                onClick={onRetry}
                className="flex w-[66px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl text-[18px] font-normal leading-[normal] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
            >
                <img src={retryAsset.src} alt="" width={66} height={66} className="size-[66px]" />
                <span className="relative -left-px">再来</span>
            </button>
            <button
                type="button"
                disabled={disabled}
                aria-label="记住当前单词"
                aria-busy={remembering}
                onClick={onKnown}
                className="flex w-[66px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl text-[18px] font-normal leading-[normal] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
            >
                <span className="relative block size-[66px]">
                    <img
                        src={knownAsset.src}
                        alt=""
                        width={66}
                        height={66}
                        className="size-[66px]"
                    />
                    <WordRememberFeedback
                        active={remembering}
                        onComplete={onRememberFeedbackComplete}
                    />
                </span>
                <span>记住</span>
            </button>
        </div>
    )
}
