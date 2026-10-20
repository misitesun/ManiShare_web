'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'

interface WordCardFlipOptions {
    readonly open: boolean
    readonly disabled: boolean
    readonly rotorRef: RefObject<HTMLDivElement | null>
    readonly frontRef: RefObject<HTMLDivElement | null>
    readonly backRef: RefObject<HTMLDivElement | null>
}

/** 仅动画内层；稳定后回到二维平面，避免与卡堆拖拽的三维位姿相互影响。 */
export function useWordCardFlip(
    rootRef: RefObject<HTMLDivElement | null>,
    { open, disabled, rotorRef, frontRef, backRef }: WordCardFlipOptions,
): void {
    const pose = useRef<'front' | 'back' | 'turning'>('front')
    const tween = useRef<gsap.core.Tween | null>(null)
    const previousOpen = useRef(open)

    useGSAP(
        (context): (() => void) | undefined => {
            const root = rootRef.current
            const rotor = rotorRef.current
            const front = frontRef.current
            const back = backRef.current
            if (!root || !rotor || !front || !back) return
            const target = open ? 'back' : 'front'

            const settle = (): void => {
                gsap.set(root, { perspective: 'none' })
                gsap.set(rotor, { rotationY: 0, transformStyle: 'flat' })
                gsap.set(front, { visibility: open ? 'hidden' : 'visible' })
                gsap.set(back, { rotationY: 0, visibility: open ? 'visible' : 'hidden' })
                root.dataset.wordCardFlipping = 'false'
                pose.current = target
                tween.current = null
            }

            let motion: gsap.Context | undefined
            context.ignore((): void => {
                motion = gsap.context((): void => {
                    if (
                        pose.current === target ||
                        window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ) {
                        settle()
                        return
                    }
                    // 背面静止时为二维；翻回前先无动画恢复到等价的180度位姿。
                    if (pose.current === 'back') gsap.set(rotor, { rotationY: 180 })
                    gsap.set(root, { perspective: 1000 })
                    gsap.set(rotor, { transformStyle: 'preserve-3d' })
                    gsap.set(front, { rotationY: 0, visibility: 'visible' })
                    gsap.set(back, { rotationY: 180, visibility: 'visible' })
                    root.dataset.wordCardFlipping = 'true'
                    pose.current = 'turning'
                    tween.current = gsap.to(rotor, {
                        rotationY: open ? 180 : 0,
                        duration: 0.6,
                        ease: 'power2.inOut',
                        onComplete: settle,
                    })
                }, rootRef)
            })
            return (): void => {
                // 不回退当前角度，快速返回从正在播放的位置接续。
                motion?.kill(false)
                tween.current = null
            }
        },
        { scope: rootRef, dependencies: [open], revertOnUpdate: true },
    )

    useEffect(() => {
        const changed = previousOpen.current !== open
        previousOpen.current = open
        if (!changed || disabled) return
        rootRef.current
            ?.querySelector<HTMLButtonElement>(
                open ? '[data-word-analysis-return]' : '[data-word-analysis-trigger]',
            )
            ?.focus({ preventScroll: true })
    }, [open, disabled, rootRef])

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        function finish(): void {
            if (media.matches) tween.current?.progress(1)
        }
        media.addEventListener('change', finish)
        return (): void => {
            media.removeEventListener('change', finish)
            tween.current?.kill()
            tween.current = null
        }
    }, [])
}
