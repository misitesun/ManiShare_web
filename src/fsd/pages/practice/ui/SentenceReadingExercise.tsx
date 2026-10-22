'use client'

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { getSentenceGameLabel } from '../model/sentence-game-family'
import type { SentenceGameFamily } from '../model/sentence-game-family'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import type { LearningPreferences } from '../../../features/learning-settings'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import type { SentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import { AnnotatedText } from './AnnotatedText'
import noteIcon from '../assets/sentence-listening-note.svg'

interface SentenceReadingExerciseProps {
    readonly family?: SentenceGameFamily
    readonly questions: readonly PracticeQuestion[]
    readonly currentQuestionId: string
    readonly revision: number
    readonly values: LearningPreferences
    readonly display: SentenceReadingDisplayOptions
    readonly blocked: boolean
    readonly onNote: (questionId: string) => void
}

/** 保留首尾余量，让第1条和第10条都能到达同一阅读焦点，不复制或重排题目身份。 */
function getReadingScrollTarget(
    viewport: HTMLDivElement,
    list: HTMLOListElement,
    focusSpace: HTMLDivElement,
    tail: HTMLDivElement,
    active: HTMLLIElement,
): number {
    const focusOffset = Math.min(
        focusSpace.offsetHeight,
        Math.max(0, viewport.clientHeight - active.getBoundingClientRect().height),
    )
    const lastHeight = list.lastElementChild?.getBoundingClientRect().height ?? 0
    tail.style.height = `${Math.max(0, viewport.clientHeight - focusOffset - lastHeight)}px`
    const next =
        viewport.scrollTop +
        active.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top -
        focusOffset
    return Math.max(0, Math.min(next, viewport.scrollHeight - viewport.clientHeight))
}

export function SentenceReadingExercise({
    family = 'sentence',
    questions,
    currentQuestionId,
    revision,
    values,
    display,
    blocked,
    onNote,
}: SentenceReadingExerciseProps): ReactElement {
    const viewportRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLOListElement>(null)
    const focusSpaceRef = useRef<HTMLDivElement>(null)
    const tailRef = useRef<HTMLDivElement>(null)
    const activeRef = useRef<HTMLLIElement>(null)
    const positionedQuestion = useRef<string | null>(null)
    const appearance = getPreviewAppearance(values)
    const hasVisibleContent = Object.values(display).some(Boolean)

    useGSAP(
        (context) => {
            const viewport = viewportRef.current
            const list = listRef.current
            const focusSpace = focusSpaceRef.current
            const tail = tailRef.current
            const active = activeRef.current
            if (!viewport || !list || !focusSpace || !tail || !active) return
            const top = getReadingScrollTarget(viewport, list, focusSpace, tail, active)
            const animate =
                positionedQuestion.current !== null &&
                positionedQuestion.current !== currentQuestionId &&
                !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            positionedQuestion.current = currentQuestionId
            let motionContext: gsap.Context | undefined
            context.ignore((): void => {
                motionContext = gsap.context((): void => {
                    if (animate)
                        gsap.to(viewport, {
                            scrollTop: top,
                            duration: 0.4,
                            ease: 'power2.out',
                            overwrite: true,
                        })
                    else viewport.scrollTop = top
                }, viewportRef)
            })
            // 清理上一轮动画而不回退滚动位置，连续切题从当前可见位置接续。
            return (): void => {
                motionContext?.kill(false)
            }
        },
        {
            scope: viewportRef,
            dependencies: [
                currentQuestionId,
                revision,
                display.english,
                display.translation,
                display.phonetics,
                display.partOfSpeech,
                display.syntax,
                values.fontSize,
                values.grammarFontSize,
                appearance.fontFamily,
            ],
            revertOnUpdate: true,
        },
    )

    useEffect(() => {
        const viewport = viewportRef.current
        const list = listRef.current
        const focusSpace = focusSpaceRef.current
        const tail = tailRef.current
        if (!viewport || !list || !focusSpace || !tail) return
        let width = viewport.clientWidth
        let height = viewport.clientHeight
        const positionImmediately = (): void => {
            const active = activeRef.current
            if (!active) return
            gsap.killTweensOf(viewport)
            viewport.scrollTop = getReadingScrollTarget(viewport, list, focusSpace, tail, active)
        }
        const observer = new ResizeObserver((): void => {
            const nextWidth = viewport.clientWidth
            const nextHeight = viewport.clientHeight
            if (width === nextWidth && height === nextHeight) return
            width = nextWidth
            height = nextHeight
            positionImmediately()
        })
        observer.observe(viewport)
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        function finishReducedMotion(): void {
            if (motion.matches) positionImmediately()
        }
        motion.addEventListener('change', finishReducedMotion)
        return (): void => {
            observer.disconnect()
            motion.removeEventListener('change', finishReducedMotion)
        }
    }, [])

    return (
        <section
            data-sentence-reading
            data-reference-node="1696:8739"
            aria-label={`${getSentenceGameLabel(family)}阅读全览`}
            data-practice-reading-family={family}
            data-audio-reading={family === 'audio' || undefined}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
            <div
                ref={viewportRef}
                data-sentence-reading-viewport
                tabIndex={0}
                aria-label="章节阅读列表"
                className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 outline-none md:px-6 md:[scrollbar-gutter:stable_both-edges]"
            >
                <div className="mx-auto w-full max-w-[928px] min-w-0 design:relative design:left-1">
                    <div
                        ref={focusSpaceRef}
                        aria-hidden="true"
                        className="h-[100px] shrink-0 md:h-[150px] design:h-[210px]"
                    />
                    <ol ref={listRef} className="m-0 list-none space-y-3 p-0 md:space-y-[6px]">
                        {questions.map((question, index) => {
                            const current = question.id === currentQuestionId
                            return (
                                <li
                                    key={question.id}
                                    ref={current ? activeRef : undefined}
                                    data-sentence-reading-item={question.id}
                                    data-current={current}
                                    aria-current={current ? 'true' : undefined}
                                    aria-label={`第${index + 1}句`}
                                    className={
                                        current
                                            ? "relative min-h-[132px] bg-practice-card px-3 py-[10px] before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-r before:bg-practice-control-accent before:content-[''] md:min-h-[157px] md:pl-[14px] md:pr-[104px]"
                                            : 'relative min-h-[132px] px-3 py-[10px] md:min-h-[157px] md:pl-[14px] md:pr-[104px]'
                                    }
                                >
                                    <AnnotatedText
                                        question={question}
                                        values={values}
                                        annotated
                                        variant="sentence-reading"
                                        readingDisplay={display}
                                        titleFirstWord
                                    />
                                    {display.translation && (
                                        <p
                                            data-practice-translation
                                            className="mt-[6px] break-words pl-[5px] text-body-tight font-medium text-practice-text"
                                            style={
                                                values.fontSize === '默认'
                                                    ? undefined
                                                    : { fontSize: appearance.fontSize }
                                            }
                                        >
                                            {question.translation}
                                        </p>
                                    )}
                                    {!hasVisibleContent && (
                                        <p className="text-label text-practice-muted">
                                            已关闭全部内容显示
                                        </p>
                                    )}
                                    {current && (
                                        <button
                                            type="button"
                                            aria-label={`第${index + 1}句笔记`}
                                            disabled={blocked}
                                            onClick={(): void => onNote(question.id)}
                                            className="mt-3 inline-flex min-h-10 w-[76px] cursor-pointer items-center justify-center gap-0.5 rounded border border-practice-muted/50 text-body-tight font-normal text-practice-muted outline-none enabled:hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-40 md:absolute md:right-5 md:top-1/2 md:mt-0 md:-translate-y-1/2 xl:min-h-[30px]"
                                        >
                                            <img
                                                src={noteIcon.src}
                                                alt=""
                                                width={20}
                                                height={20}
                                                className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                                            />
                                            笔记
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                    </ol>
                    <div ref={tailRef} aria-hidden="true" />
                </div>
            </div>
        </section>
    )
}
