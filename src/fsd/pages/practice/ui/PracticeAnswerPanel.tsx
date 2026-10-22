'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { TldButton } from '../../../shared/ui/tld-button'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import { AnnotatedText } from './AnnotatedText'
import { PhoneticsExplanation } from './PhoneticsDemo'
import { usePracticePanelMotion } from './usePracticePanelMotion'

export function PracticeAnswerPanel({
    open,
    phonetics,
    sentenceTranslation = false,
    sentenceAnswer = false,
    question,
    values,
    blocked,
    onClose,
    portalRoot,
}: {
    readonly open: boolean
    readonly phonetics: boolean
    readonly sentenceTranslation?: boolean
    readonly sentenceAnswer?: boolean
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly blocked: boolean
    readonly onClose: () => void
    readonly portalRoot: RefObject<HTMLElement | null>
}): ReactElement | null {
    const compactTranslation = sentenceTranslation && !sentenceAnswer
    const panelRef = useRef<HTMLDivElement>(null)
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    useEffect((): void => {
        setPortalTarget(portalRoot.current)
    }, [portalRoot])
    const present = usePracticePanelMotion(panelRef, {
        open,
        direction: 'up',
        ready: portalTarget !== null,
    })
    if (!portalTarget) return null
    // 根容器继承练习配色/字体并保留命令作用域；越过背景 isolate，低于 body 模态层60。
    return createPortal(
        <div
            ref={panelRef}
            data-practice-answer-panel={phonetics ? 'phonetics' : 'answer'}
            hidden={!present}
            inert={!open || blocked}
            aria-hidden={!open || blocked}
            className={
                phonetics
                    ? 'fixed inset-x-0 top-[96px] z-[55] mx-auto max-h-[calc(100dvh-200px)] w-[calc(100%-32px)] max-w-[720px] overflow-y-auto rounded-2xl bg-surface design:top-[211px]'
                    : sentenceAnswer
                      ? 'fixed inset-x-0 top-[76px] z-[55] mx-auto max-h-[calc(100dvh-200px)] w-max min-w-[min(430px,calc(100%-32px))] max-w-[calc(100%-32px)] overflow-y-auto rounded-2xl border border-strong bg-surface px-4 py-4 shadow-xl md:px-8 md:py-6'
                      : compactTranslation
                        ? "fixed inset-x-0 top-[88px] z-[55] mx-auto max-h-[calc(100dvh-200px)] min-h-[173px] w-[calc(100%-32px)] max-w-[333px] overflow-y-auto rounded-xl border border-practice-control-text/30 bg-practice-background p-[19px] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-practice-control-text/10 before:content-[''] design:top-[125px]"
                        : 'fixed inset-x-0 top-[76px] z-[55] mx-auto max-h-[calc(100dvh-200px)] w-[calc(100%-32px)] max-w-[1000px] overflow-y-auto rounded-2xl border border-strong bg-surface p-4 shadow-xl md:p-6'
            }
        >
            <section
                className={compactTranslation ? 'relative' : ''}
                aria-label={phonetics ? '音标详情' : '当前题答案'}
            >
                {phonetics || compactTranslation || sentenceAnswer ? (
                    <h2 className="sr-only">{phonetics ? '音标讲解' : '当前题答案'}</h2>
                ) : (
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="text-card-title">{phonetics ? '音标讲解' : '当前题答案'}</h2>
                        <TldButton variant="secondary" size="compact" onClick={onClose}>
                            ↑ 收起
                        </TldButton>
                    </div>
                )}
                {phonetics ? (
                    <PhoneticsExplanation />
                ) : compactTranslation ? (
                    <>
                        <AnnotatedText
                            question={question}
                            values={values}
                            annotated
                            titleFirstWord
                            variant="sentence-translate-answer"
                        />
                        <p className="mt-[15px] break-words text-center text-[20px] font-medium leading-7 text-practice-text">
                            {question.translation}
                        </p>
                    </>
                ) : (
                    <div className="space-y-4 text-center">
                        <AnnotatedText
                            question={question}
                            values={values}
                            annotated
                            density="reading"
                            variant={sentenceAnswer ? 'sentence-answer' : 'default'}
                        />
                        {!sentenceAnswer && (
                            <p className="text-body text-secondary">{question.phonetic}</p>
                        )}
                        <p className="text-body text-practice-text">{question.translation}</p>
                    </div>
                )}
            </section>
        </div>,
        portalTarget,
    )
}
