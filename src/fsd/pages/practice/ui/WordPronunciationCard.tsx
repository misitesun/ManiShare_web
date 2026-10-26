'use client'

import { useId, useRef } from 'react'
import type { ReactElement } from 'react'
import type { WordCardExample } from '../model/word-card-analysis'
import { getWordCardOutlineRadius } from '../model/word-card-outline'
import knownAsset from '../assets/known.svg'
import retryAsset from '../assets/retry.svg'
import { WordLearningCard } from './WordLearningCard'
import type { WordLearningCardProps } from './WordLearningCard'
import { WordRememberFeedback } from './WordRememberFeedback'
import { WordPronunciationAnalysis } from './WordPronunciationAnalysis'
import { useWordCardFlip } from './useWordCardFlip'

export interface WordPronunciationCardProps extends Omit<WordLearningCardProps, 'analysisId'> {
    readonly onAnalysisClose: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
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
            className={
                props.layout === 'guess'
                    ? 'relative mx-auto w-full max-w-[360px] min-w-0'
                    : 'relative mx-auto w-full max-w-[500px] min-w-0'
            }
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
                    <WordLearningCard {...props} analysisId={analysisId} />
                </div>
                <div
                    ref={backRef}
                    id={analysisId}
                    aria-hidden={!analysisOpen}
                    inert={!analysisOpen}
                    style={
                        props.layout === 'guess'
                            ? {
                                  borderRadius: getWordCardOutlineRadius(
                                      props.borderDepth ?? 'front',
                                  ),
                              }
                            : undefined
                    }
                    className={
                        props.layout === 'guess'
                            ? 'invisible absolute inset-0 shadow-[var(--app-shadow-practice-card)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'
                            : 'invisible absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'
                    }
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
