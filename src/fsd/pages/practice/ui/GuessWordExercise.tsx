'use client'

import { useId, useRef } from 'react'
import type { ReactElement, RefObject } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import { GuessWordAnswerPanel } from './GuessWordAnswerPanel'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

interface GuessWordExerciseProps {
    readonly question: PracticeQuestion
    readonly blocked: boolean
    readonly showImage: boolean
    readonly answerOpen: boolean
    readonly reading?: PracticeReadingView | undefined
    readonly onToggleAnswer: () => void
    readonly onCloseAnswer: () => void
    readonly onPlay: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
    readonly onNotice: (message: string) => void
    readonly portalRoot?: RefObject<HTMLElement | null>
}

/** 中文语境内保留可点选的英文目标；答案展开不变更作答状态或题号。 */
export function GuessWordExercise({
    question,
    blocked,
    showImage,
    answerOpen,
    reading,
    onToggleAnswer,
    onCloseAnswer,
    onPlay,
    onExamplePlay,
    onNotice,
    portalRoot,
}: GuessWordExerciseProps): ReactElement {
    const trigger = useRef<HTMLButtonElement>(null)
    const answerId = useId()
    const content = question.guess
    return (
        <section
            data-guess-word-exercise
            className="relative w-full min-w-0 px-4 pb-8 pt-20 md:pt-28 design:pt-[172px]"
        >
            {showImage && content && (
                <div
                    data-practice-reading-surface
                    className="relative mx-auto aspect-video w-full max-w-[430px] overflow-hidden rounded-[20px]"
                >
                    <img
                        data-practice-media
                        src={content.scene}
                        alt="猜词共用演示场景：两位小朋友在门口打招呼"
                        width={430}
                        height={242}
                        draggable={false}
                        className="block size-full object-cover"
                    />
                    <PracticeReadingOverlay reading={answerOpen ? undefined : reading} />
                </div>
            )}
            <div className="mx-auto mt-7 flex min-w-0 max-w-[900px] flex-wrap items-center justify-center gap-[10px] text-center text-[20px] font-normal leading-[34px] md:text-[24px] design:mt-[38px]">
                <span>{content?.before ?? '猜一猜这个单词：'}</span>
                <button
                    ref={trigger}
                    type="button"
                    aria-label={`查看 ${question.english} 的答案`}
                    aria-controls={answerId}
                    aria-expanded={answerOpen && !blocked}
                    disabled={blocked}
                    onClick={onToggleAnswer}
                    className="flex min-h-[74px] min-w-[88px] cursor-pointer flex-col items-center justify-center gap-[10px] rounded-lg border border-strong px-[10px] py-[10px] text-foreground outline-none hover:bg-practice-control-surface focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                >
                    <span className="text-[14px] leading-[18px] text-practice-muted">
                        {question.phonetic}
                    </span>
                    <span className="text-[24px] leading-[24px]">{question.english}</span>
                </button>
                {content?.after && <span>{content.after}</span>}
            </div>
            <GuessWordAnswerPanel
                id={answerId}
                open={answerOpen}
                blocked={blocked}
                anchor={trigger}
                question={question}
                reading={reading}
                onClose={onCloseAnswer}
                onPlay={onPlay}
                onExamplePlay={onExamplePlay}
                onNotice={onNotice}
                {...(portalRoot ? { portalRoot } : {})}
            />
        </section>
    )
}
