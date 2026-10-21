'use client'

import { useCallback, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { WordSpellingQuestionDirection } from '../model/word-spelling-question-motion'
import { useWordSpellingQuestionMotion } from './useWordSpellingQuestionMotion'

interface WordSpellingQuestionFlipProps {
    readonly questionKey: string
    readonly direction: WordSpellingQuestionDirection | null
    readonly blocked: boolean
    readonly onReady?: (() => void) | undefined
    readonly previous: { readonly key: string; readonly card: ReactElement } | null
    readonly children: ReactElement
}

/** 只在600ms翻面期间保留旧卡，旧面始终不参与交互或读屏。 */
export function WordSpellingQuestionFlip({
    questionKey,
    direction,
    blocked,
    onReady,
    previous,
    children,
}: WordSpellingQuestionFlipProps): ReactElement {
    const [completedKey, setCompletedKey] = useState<string | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const rotorRef = useRef<HTMLDivElement>(null)
    const outgoingRef = useRef<HTMLDivElement>(null)
    const incomingRef = useRef<HTMLDivElement>(null)
    const outgoing =
        direction && completedKey !== questionKey && previous?.key !== questionKey ? previous : null
    const complete = useCallback((): void => {
        setCompletedKey(questionKey)
        onReady?.()
    }, [questionKey, onReady])
    useWordSpellingQuestionMotion(rootRef, {
        questionKey,
        direction,
        blocked,
        rotorRef,
        outgoingRef,
        incomingRef,
        onComplete: complete,
    })

    return (
        <div
            ref={rootRef}
            data-word-spelling-question-direction={direction ?? 'none'}
            data-word-spelling-switching="false"
            className="relative mx-auto w-full max-w-[500px] min-w-0"
        >
            <div ref={rotorRef} className="relative w-full">
                {outgoing && (
                    <div
                        key={outgoing.key}
                        ref={outgoingRef}
                        data-word-spelling-question-face="outgoing"
                        aria-hidden="true"
                        inert
                        className="pointer-events-none absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                    >
                        {outgoing.card}
                    </div>
                )}
                <div
                    key={questionKey}
                    ref={incomingRef}
                    data-word-spelling-question-face="current"
                    className="relative w-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
