'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { wordCardFlipMotion } from '../model/word-card-flip-motion'
import { getWordSpellingQuestionPose } from '../model/word-spelling-question-motion'
import type { WordSpellingQuestionDirection } from '../model/word-spelling-question-motion'

interface WordSpellingQuestionMotionOptions {
    readonly questionKey: string
    readonly direction: WordSpellingQuestionDirection | null
    readonly blocked: boolean
    readonly rotorRef: RefObject<HTMLDivElement | null>
    readonly outgoingRef: RefObject<HTMLDivElement | null>
    readonly incomingRef: RefObject<HTMLDivElement | null>
    readonly onComplete: () => void
}

/** 前后题作为同一卡牌的两面；解析翻面仍独立控制题内层。 */
export function useWordSpellingQuestionMotion(
    rootRef: RefObject<HTMLDivElement | null>,
    {
        questionKey,
        direction,
        blocked,
        rotorRef,
        outgoingRef,
        incomingRef,
        onComplete,
    }: WordSpellingQuestionMotionOptions,
): void {
    const motion = useRef<gsap.core.Tween | null>(null)

    useGSAP(
        (_context, contextSafe): (() => void) | undefined => {
            const root = rootRef.current
            const rotor = rotorRef.current
            const incoming = incomingRef.current
            const outgoing = outgoingRef.current
            if (!root || !rotor || !incoming) return
            const settle = (): void => {
                gsap.set(root, { perspective: 'none' })
                gsap.set(rotor, { rotationY: 0, transformStyle: 'flat' })
                gsap.set(incoming, { rotationY: 0, visibility: 'visible' })
                if (outgoing) gsap.set(outgoing, { visibility: 'hidden' })
                root.dataset.wordSpellingSwitching = 'false'
                motion.current = null
                if (outgoing) onComplete()
            }
            const complete = contextSafe?.(settle) ?? settle
            if (
                !direction ||
                !outgoing ||
                blocked ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                complete()
                return
            }
            const pose = getWordSpellingQuestionPose(direction)
            gsap.set(root, { perspective: wordCardFlipMotion.perspective })
            gsap.set(rotor, { rotationY: 0, transformStyle: 'preserve-3d' })
            gsap.set(outgoing, { rotationY: 0, visibility: 'visible' })
            gsap.set(incoming, { rotationY: pose.incomingRotation, visibility: 'visible' })
            root.dataset.wordSpellingSwitching = 'true'
            const tween = gsap.to(rotor, {
                rotationY: pose.rotation,
                duration: wordCardFlipMotion.duration,
                ease: wordCardFlipMotion.ease,
                onComplete: complete,
            })
            motion.current = tween
            return (): void => {
                tween.kill()
                if (motion.current === tween) motion.current = null
            }
        },
        { scope: rootRef, dependencies: [questionKey], revertOnUpdate: true },
    )

    useEffect(() => {
        if (blocked) motion.current?.progress(1)
    }, [blocked])

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        function finish(): void {
            if (media.matches) motion.current?.progress(1)
        }
        media.addEventListener('change', finish)
        return (): void => {
            media.removeEventListener('change', finish)
            motion.current?.kill()
            motion.current = null
        }
    }, [])
}
