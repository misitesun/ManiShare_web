'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import type { PracticePhase, PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { createWordSpellingLayout } from '../model/word-spelling-input'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import type { WordSpellingQuestionTransition } from '../model/word-spelling-question-motion'
import wordAsset from '../assets/word-woman-e23d5f.png'
import borderAsset from '../assets/word-card-gradient-border.svg'
import analysisAsset from '../assets/word-card-note.svg'
import lookupAsset from '../assets/word-card-lookup.svg'
import addAsset from '../assets/word-card-add.svg'
import { WordSpellingInput } from './WordSpellingInput'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
import { WordDictionaryLink } from './WordDictionaryLink'
import { WordPronunciationAnalysis } from './WordPronunciationAnalysis'
import { useWordCardFlip } from './useWordCardFlip'
import { WordSpellingQuestionFlip } from './WordSpellingQuestionFlip'
import { WordCardHeading } from './WordCardHeading'

export interface WordAnswerCardProps {
    readonly question: PracticeQuestion
    readonly mode: 'spell' | 'dictate'
    readonly phase: PracticePhase
    readonly input: string
    readonly onInput: (value: string) => void
    readonly blocked: boolean
    readonly showImage: boolean
    readonly showTranslation: boolean
    readonly showPhonetics: boolean
    readonly phoneticMode?: WordPhoneticMode
    readonly showWordHint?: boolean
    readonly ignoreCase?: boolean
    readonly onNotice: (message: string) => void
    readonly onPlay?: (() => void) | undefined
    readonly onExamplePlay?: ((example: WordCardExample) => void) | undefined
    readonly displayFontSize?: number | undefined
    readonly borderStyle?: 'solid' | 'dashed' | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly onSpellingController?:
        ((controller: WordSpellingInputController | null) => void) | undefined
    readonly questionRevision?: number | undefined
    readonly questionTransition?: WordSpellingQuestionTransition | null | undefined
}

export function WordAnswerCard(props: WordAnswerCardProps): ReactElement {
    const inputController = useRef<WordSpellingInputController | null>(null)
    const registerInput = useCallback(
        (controller: WordSpellingInputController | null): void => {
            inputController.current = controller
            props.onSpellingController?.(controller)
        },
        [props.onSpellingController],
    )
    const focusInput = useCallback((): void => inputController.current?.focus(), [])
    if (props.mode !== 'spell')
        return <WordAnswerCardFace {...props} onSpellingController={registerInput} />
    const transition = props.questionTransition
    return (
        <WordSpellingQuestionFlip
            questionKey={`${props.question.id}:${props.questionRevision ?? 0}`}
            direction={transition?.direction ?? null}
            blocked={props.blocked}
            onReady={focusInput}
            previous={
                transition
                    ? {
                          key: transition.previous.key,
                          card: (
                              <WordSpellingCard
                                  {...props}
                                  question={transition.previous.question}
                                  phase={transition.previous.phase}
                                  input={transition.previous.input}
                                  blocked
                                  reading={undefined}
                                  onSpellingController={undefined}
                                  onSubmit={undefined}
                              />
                          ),
                      }
                    : null
            }
        >
            <WordSpellingCard {...props} onSpellingController={registerInput} />
        </WordSpellingQuestionFlip>
    )
}

interface WordAnswerCardFaceProps extends WordAnswerCardProps {
    readonly analysis?: {
        readonly id: string
        readonly open: boolean
        readonly onOpen: () => void
    }
}

/** 正面始终挂载，翻面保留拼写槽位和模式内编辑状态。 */
function WordSpellingCard(props: WordAnswerCardProps): ReactElement {
    const [analysisOpen, setAnalysisOpen] = useState(false)
    const analysisId = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const rotorRef = useRef<HTMLDivElement>(null)
    const frontRef = useRef<HTMLDivElement>(null)
    const backRef = useRef<HTMLDivElement>(null)
    useWordCardFlip(rootRef, {
        open: analysisOpen,
        disabled: props.blocked,
        rotorRef,
        frontRef,
        backRef,
    })

    return (
        <div className="relative mx-auto w-full max-w-[500px] min-w-0">
            <div
                ref={rootRef}
                data-word-card-flip
                data-word-spelling-card
                data-word-analysis-open={analysisOpen}
                className="relative w-full"
                onKeyDownCapture={(event): void => {
                    if (
                        !analysisOpen ||
                        props.blocked ||
                        event.key !== 'Escape' ||
                        event.nativeEvent.isComposing
                    )
                        return
                    event.preventDefault()
                    event.stopPropagation()
                    setAnalysisOpen(false)
                }}
            >
                <div ref={rotorRef} className="relative w-full">
                    <div
                        ref={frontRef}
                        aria-hidden={analysisOpen}
                        inert={analysisOpen}
                        className="relative w-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                    >
                        <WordAnswerCardFace
                            {...props}
                            analysis={{
                                id: analysisId,
                                open: analysisOpen,
                                onOpen: (): void => setAnalysisOpen(true),
                            }}
                        />
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
                            disabled={props.blocked}
                            borderDepth="front"
                            onBack={(): void => setAnalysisOpen(false)}
                            onExamplePlay={
                                props.onExamplePlay ??
                                ((): void => props.onNotice('当前例句暂无朗读音源。'))
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function WordAnswerCardFace({
    question,
    mode,
    phase,
    input,
    onInput,
    blocked,
    showImage,
    showTranslation,
    showPhonetics,
    phoneticMode = 'original',
    showWordHint = false,
    ignoreCase = true,
    onNotice,
    onPlay,
    displayFontSize,
    reading,
    onSubmit,
    onSpellingController,
    analysis,
}: WordAnswerCardFaceProps): ReactElement {
    const rootRef = useRef<HTMLElement>(null)
    const inputController = useRef<WordSpellingInputController | null>(null)
    const [pulse, setPulse] = useState({ id: '', revision: 0 })
    const spelling = mode === 'spell'
    const correct = phase === 'correct'
    const revealed = phase === 'revealed'
    const editable = phase === 'answering' || phase === 'incorrect'
    const visibleImage = showImage
    const referenceLayout = showImage && displayFontSize === undefined
    const englishStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }
    const phoneticsVisible = showPhonetics && phoneticMode !== 'none'
    const spellingLayout = useMemo(
        () =>
            spelling
                ? createWordSpellingLayout(question.english, phoneticMode, question.wordPhonetics)
                : createWordSpellingLayout(question.english, 'syllables'),
        [question.english, question.wordPhonetics, phoneticMode, spelling],
    )
    const registerInput = useCallback(
        (controller: WordSpellingInputController | null): void => {
            inputController.current = controller
            onSpellingController?.(controller)
        },
        [onSpellingController],
    )
    const pulseSegment = useCallback((id: string): void => {
        setPulse((previous) => ({ id, revision: previous.revision + 1 }))
    }, [])
    useGSAP(
        (): void => {
            if (!pulse.id || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
            const elements = Array.from(
                rootRef.current?.querySelectorAll<HTMLElement>('[data-spelling-pulse-segment]') ??
                    [],
            ).filter((element) => element.dataset.spellingPulseSegment === pulse.id)
            if (!elements.length) return
            gsap.timeline()
                .to(elements, { opacity: 1, duration: 0.405 })
                .to(elements, { opacity: 0, duration: 0.495 })
        },
        {
            scope: rootRef,
            dependencies: [pulse, phoneticMode, analysis?.open],
            revertOnUpdate: true,
        },
    )
    function selectSegment(id: string): void {
        inputController.current?.selectSegment(id)
    }
    const phonetic = (
        <PracticeWordPhonetics
            phonetic={question.phonetic}
            breakdown={question.wordPhonetics}
            mode={phoneticMode}
        />
    )
    const localInput = (
        <WordSpellingInput
            layout={spellingLayout}
            initialValue={input}
            blocked={blocked || !editable || (analysis?.open ?? false)}
            ignoreCase={ignoreCase}
            showWordHint={showWordHint}
            displayFontSize={displayFontSize}
            onChange={onInput}
            onSubmit={onSubmit}
            onController={registerInput}
            onSegmentPulse={pulseSegment}
        />
    )

    if (!spelling)
        return (
            <section
                ref={rootRef}
                aria-label="单词默写"
                data-reference-node={revealed ? '1609:7642' : '546:31470'}
                className={
                    referenceLayout
                        ? 'relative mx-auto w-full max-w-[430px] min-w-0 design:h-[510px]'
                        : 'relative mx-auto flex w-full max-w-[430px] min-w-0 flex-col items-center gap-8 py-8'
                }
            >
                {visibleImage && (
                    <div
                        data-practice-reading-surface
                        className="relative aspect-video w-full overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={wordAsset.src}
                            alt="单词练习共用示意图"
                            width={430}
                            height={242}
                            className="absolute inset-0 block h-full w-full object-cover"
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                )}
                {revealed && (
                    <aside
                        aria-label="已揭晓的单词答案"
                        className={
                            referenceLayout
                                ? 'z-10 flex min-w-0 flex-col items-center gap-2 rounded-xl border border-primary/30 bg-surface p-5 text-center design:absolute design:-top-[110px] design:h-[173px] design:w-[430px]'
                                : 'flex w-full min-w-0 flex-col items-center gap-2 rounded-xl border border-primary/30 bg-surface p-5 text-center'
                        }
                    >
                        {phoneticsVisible && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 text-center text-[14px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[176px] design:top-[39px] design:min-h-5 design:w-[78px]'
                                        : 'm-0 text-[14px] font-normal leading-[normal] text-practice-muted'
                                }
                            >
                                {phonetic}
                            </p>
                        )}
                        <p
                            className={
                                referenceLayout
                                    ? 'm-0 border-b-[3px] border-practice-answer text-[22px] font-medium leading-[normal] text-practice-answer design:absolute design:left-[179px] design:top-[63px] design:min-h-[31px] design:w-[75px] design:border-b-0'
                                    : 'm-0 border-b-[3px] border-practice-answer text-[22px] font-medium leading-[normal] text-practice-answer'
                            }
                            style={englishStyle}
                        >
                            {question.english}
                        </p>
                        {referenceLayout && (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none hidden h-[3px] w-[75px] bg-practice-answer design:absolute design:left-[179px] design:top-[98px] design:block"
                            />
                        )}
                        {showTranslation && (
                            <p
                                className={
                                    referenceLayout
                                        ? 'm-0 max-w-full break-words text-[16px] font-normal leading-[normal] text-primary design:absolute design:inset-x-5 design:top-[111px]'
                                        : 'm-0 max-w-full break-words text-[16px] font-normal leading-[normal] text-primary'
                                }
                            >
                                {question.translation}
                            </p>
                        )}
                    </aside>
                )}
                <div
                    className={
                        referenceLayout
                            ? 'flex min-w-0 flex-col items-center gap-8 pb-8 pt-16 design:contents'
                            : 'flex w-full min-w-0 flex-col items-center gap-8'
                    }
                >
                    {(editable || correct) && (
                        <div
                            data-word-dictation-word-slot
                            className={
                                referenceLayout
                                    ? 'flex min-h-[98px] w-full min-w-0 items-center justify-center design:absolute design:inset-x-4 design:top-[316px] design:h-[98px] design:w-auto'
                                    : 'flex min-h-[98px] w-full min-w-0 items-center justify-center'
                            }
                        >
                            {correct ? (
                                <WordCardHeading
                                    word={question.english}
                                    referenceLayout={false}
                                    placement="slot"
                                    displayFontSize={displayFontSize}
                                    disabled={blocked}
                                    onPlay={
                                        onPlay ??
                                        ((): void => onNotice('单词音源未接入，暂不能朗读。'))
                                    }
                                />
                            ) : (
                                localInput
                            )}
                        </div>
                    )}
                    {(editable || correct) && phoneticsVisible && (
                        <p
                            className={
                                referenceLayout
                                    ? 'm-0 text-center text-[24px] font-light leading-[normal] text-practice-muted design:absolute design:inset-x-0 design:top-[418px]'
                                    : 'm-0 text-center text-[24px] font-light leading-[normal] text-practice-muted'
                            }
                        >
                            {phonetic}
                        </p>
                    )}
                    {showTranslation && (
                        <p
                            data-practice-translation
                            className={
                                referenceLayout
                                    ? 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text design:absolute design:left-[84px] design:top-[476px] design:min-h-[34px] design:w-[261px]'
                                    : 'm-0 max-w-full break-words text-center text-[24px] font-medium leading-[normal] text-practice-text'
                            }
                        >
                            {question.translation}
                        </p>
                    )}
                </div>
            </section>
        )

    return (
        <section
            ref={rootRef}
            aria-label="单词拼写"
            data-reference-node="546:31334"
            className="relative mx-auto w-full max-w-[500px] min-w-0"
        >
            <div
                className={
                    referenceLayout
                        ? 'relative rounded-[24px] bg-practice-card shadow-[var(--app-shadow-practice-card)] design:h-[500px]'
                        : 'relative rounded-[24px] bg-practice-card shadow-[var(--app-shadow-practice-card)]'
                }
            >
                {visibleImage && (
                    <div
                        data-practice-reading-surface
                        className="relative aspect-video w-full overflow-hidden rounded-t-[20px]"
                    >
                        <img
                            data-practice-media
                            src={wordAsset.src}
                            alt="单词练习共用示意图"
                            width={500}
                            height={281}
                            className="absolute inset-0 block h-full w-full object-cover"
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                )}
                <div
                    className={
                        referenceLayout
                            ? 'flex min-w-0 flex-col items-center px-4 pb-3 design:contents'
                            : 'flex min-w-0 flex-col items-center px-4 pb-3'
                    }
                >
                    {/* 两态共用同一网格槽；隐藏层仍占位，切换不改变下方内容高度。 */}
                    <div
                        data-word-spelling-word-slot
                        className={
                            referenceLayout
                                ? 'relative grid min-h-[98px] w-full min-w-0 items-start design:absolute design:inset-x-4 design:top-[281px] design:w-auto'
                                : 'relative grid min-h-[98px] w-full min-w-0 items-start'
                        }
                    >
                        <div
                            data-word-spelling-editor
                            aria-hidden={!editable}
                            inert={!editable}
                            className={
                                editable
                                    ? 'col-start-1 row-start-1 w-full min-w-0'
                                    : 'invisible col-start-1 row-start-1 w-full min-w-0'
                            }
                        >
                            {localInput}
                        </div>
                        <div
                            data-word-spelling-word-result
                            aria-hidden={!correct}
                            inert={!correct}
                            className={
                                correct
                                    ? 'col-start-1 row-start-1 flex w-full min-w-0 justify-center'
                                    : 'invisible col-start-1 row-start-1 flex w-full min-w-0 justify-center'
                            }
                        >
                            <WordCardHeading
                                word={question.english}
                                placement="slot"
                                referenceLayout={referenceLayout}
                                displayFontSize={displayFontSize}
                                disabled={blocked || !correct}
                                onPlay={
                                    onPlay ??
                                    ((): void => onNotice('单词发音素材未接入，暂不能朗读。'))
                                }
                            />
                        </div>
                        {revealed && (
                            <p
                                data-practice-english
                                className="col-start-1 row-start-1 mx-auto mb-0 mt-6 w-fit max-w-full break-words border-b-2 border-practice-answer text-center text-section-title leading-[normal] text-practice-answer"
                                style={englishStyle}
                            >
                                {question.english}
                            </p>
                        )}
                    </div>
                    {phoneticsVisible && (
                        <div
                            className={
                                referenceLayout
                                    ? 'min-h-9 max-w-full design:absolute design:left-1/2 design:top-[379px] design:w-max design:max-w-[calc(100%-32px)] design:-translate-x-1/2'
                                    : 'min-h-9 max-w-full'
                            }
                        >
                            <PracticeWordPhonetics
                                phonetic={question.phonetic}
                                breakdown={question.wordPhonetics}
                                mode={phoneticMode}
                                density="spelling"
                                onSegmentSelect={
                                    spellingLayout.split && spellingLayout.mapped && editable
                                        ? selectSegment
                                        : undefined
                                }
                                disabled={blocked || (analysis?.open ?? false)}
                            />
                        </div>
                    )}
                    {showTranslation && (
                        <p
                            data-practice-translation
                            className={
                                referenceLayout
                                    ? 'm-0 mt-[19px] max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted design:absolute design:left-[160px] design:top-[434px] design:mt-0 design:min-h-[25px] design:w-[195px]'
                                    : 'm-0 mt-[19px] max-w-full break-words text-center text-[18px] font-normal leading-[normal] text-practice-muted'
                            }
                        >
                            {question.translation}
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
                        data-word-analysis-trigger
                        type="button"
                        disabled={blocked}
                        aria-label="查看当前单词解析"
                        aria-expanded={analysis?.open ?? false}
                        aria-controls={analysis?.id}
                        onClick={analysis?.onOpen}
                        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:size-8"
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
                        disabled={blocked}
                        appearance="spelling"
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
                        disabled={blocked}
                        aria-label="标记当前单词为不熟"
                        onClick={(): void => onNotice('不熟标记暂未开放，当前未保存。')}
                        className="ml-auto flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default md:size-8"
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
                <img
                    data-word-card-border
                    aria-hidden="true"
                    alt=""
                    src={borderAsset.src}
                    width={500}
                    height={500}
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                />
            </div>
        </section>
    )
}
