'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import { AnnotatedText } from './AnnotatedText'
import { PhoneticsExplanation } from './PhoneticsDemo'
import { usePracticePanelMotion } from './usePracticePanelMotion'

export function PracticeAnswerPanel({
    open,
    phonetics,
    question,
    values,
    blocked,
    onClose,
}: {
    readonly open: boolean
    readonly phonetics: boolean
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly blocked: boolean
    readonly onClose: () => void
}): ReactElement {
    const panelRef = useRef<HTMLDivElement>(null)
    const present = usePracticePanelMotion(panelRef, { open, direction: 'up' })
    return (
        <div
            ref={panelRef}
            data-practice-answer-panel={phonetics ? 'phonetics' : 'answer'}
            hidden={!present}
            inert={!open || blocked}
            aria-hidden={!open || blocked}
            className={
                phonetics
                    ? 'fixed inset-x-0 top-[96px] z-20 mx-auto max-h-[calc(100dvh-200px)] w-[calc(100%-32px)] max-w-[720px] overflow-y-auto rounded-2xl bg-surface design:top-[211px]'
                    : 'fixed inset-x-0 top-[76px] z-20 mx-auto max-h-[calc(100dvh-200px)] w-[calc(100%-32px)] max-w-[1000px] overflow-y-auto rounded-2xl border border-strong bg-surface p-4 shadow-xl md:p-6'
            }
        >
            <section aria-label={phonetics ? '音标详情' : '当前题答案'}>
                {phonetics ? (
                    <h2 className="sr-only">音标讲解</h2>
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
                ) : (
                    <div className="space-y-4 text-center">
                        <AnnotatedText
                            question={question}
                            values={values}
                            annotated
                            density="reading"
                        />
                        <p className="text-body text-secondary">{question.phonetic}</p>
                        <p className="text-body text-practice-text">{question.translation}</p>
                    </div>
                )}
            </section>
        </div>
    )
}
