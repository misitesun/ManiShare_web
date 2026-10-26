'use client'

import { useEffect, useId, useRef } from 'react'
import type { ReactElement, RefObject } from 'react'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import { getGuessReadingScrollTop } from '../model/guess-word'
import { GuessWordAnswerPanel } from './GuessWordAnswerPanel'
import type { PracticeReadingView } from './PracticeReadingOverlay'

interface GuessReadingExerciseProps {
    readonly questions: readonly PracticeQuestion[]
    readonly question: PracticeQuestion
    readonly revision: number
    readonly blocked: boolean
    readonly answerOpen: boolean
    readonly onSelect: (index: number) => void
    readonly onCloseAnswer: () => void
    readonly onPlay: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
    readonly onNotice: (message: string) => void
    readonly reading?: PracticeReadingView | undefined
    readonly portalRoot?: RefObject<HTMLElement | null>
}

/** 阅读保持同一份语境列表，只将当前词交给已存在的猜词答案浮窗。 */
export function GuessReadingExercise({
    questions,
    question,
    revision,
    blocked,
    answerOpen,
    onSelect,
    onCloseAnswer,
    onPlay,
    onExamplePlay,
    onNotice,
    reading,
    portalRoot,
}: GuessReadingExerciseProps): ReactElement {
    const viewport = useRef<HTMLDivElement>(null)
    const activeRow = useRef<HTMLLIElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const answerId = useId()

    useEffect(() => {
        function keepCurrentVisible(): void {
            const container = viewport.current
            const row = activeRow.current
            if (!container || !row || container.clientHeight <= 0) return
            const bounds = container.getBoundingClientRect()
            const rowBounds = row.getBoundingClientRect()
            container.scrollTop = getGuessReadingScrollTop({
                scrollTop: container.scrollTop,
                scrollHeight: container.scrollHeight,
                viewportTop: bounds.top,
                viewportHeight: container.clientHeight,
                rowTop: rowBounds.top,
                rowBottom: rowBounds.bottom,
            })
        }
        keepCurrentVisible()
        window.addEventListener('resize', keepCurrentVisible)
        window.visualViewport?.addEventListener('resize', keepCurrentVisible)
        return (): void => {
            window.removeEventListener('resize', keepCurrentVisible)
            window.visualViewport?.removeEventListener('resize', keepCurrentVisible)
        }
    }, [question.id, revision])

    return (
        <section
            data-guess-reading-exercise
            data-reference-node="546:43117"
            aria-label="猜词阅读模式"
            className="flex w-full min-h-0 min-w-0 flex-1 flex-col"
        >
            <div
                ref={viewport}
                data-guess-reading-viewport
                role="region"
                aria-label="猜词阅读列表，可滚动"
                tabIndex={blocked ? -1 : 0}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
                <ol className="mx-auto my-0 grid w-full max-w-[1116px] list-none gap-5 px-4 pb-4 pt-20 md:px-6 md:pt-28 design:px-0 design:pt-[145px]">
                    {questions.map((item, index) => {
                        const selected = item.id === question.id
                        return (
                            <li
                                key={item.id}
                                ref={selected ? activeRow : undefined}
                                aria-current={selected ? 'true' : undefined}
                                className="flex min-w-0 flex-wrap items-center gap-[14px] text-[20px] font-normal leading-[34px] tracking-[0.08em] text-practice-text md:text-[24px]"
                            >
                                <span>{item.guess?.before ?? '读一读这个单词：'}</span>
                                <button
                                    ref={selected ? trigger : undefined}
                                    type="button"
                                    aria-label={`查看 ${item.english} 的答案`}
                                    aria-controls={answerId}
                                    aria-expanded={selected && answerOpen && !blocked}
                                    disabled={blocked}
                                    onClick={(): void => onSelect(index)}
                                    className="flex min-h-[74px] min-w-[88px] max-w-full cursor-pointer flex-col items-center justify-center gap-[10px] rounded-lg border border-strong px-[10px] py-[10px] tracking-normal text-foreground outline-none hover:bg-practice-control-surface focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
                                >
                                    <span className="min-w-0 max-w-full break-words text-[14px] leading-[18px] text-practice-muted">
                                        {item.phonetic}
                                    </span>
                                    <span className="min-w-0 max-w-full break-words text-[26px] leading-[26px]">
                                        {item.english}
                                    </span>
                                </button>
                                {item.guess?.after && <span>{item.guess.after}</span>}
                            </li>
                        )
                    })}
                </ol>
            </div>
            <GuessWordAnswerPanel
                key={`${question.id}:${revision}`}
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
