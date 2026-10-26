'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { getPictureReaderDirection } from '../model/picture-reader'

interface PictureReaderMotionOptions {
    readonly index: number
    readonly blocked: boolean
    readonly onBusyChange: (busy: boolean) => void
}

/** 只管理DOM过渡；当前图片仍由练习会话唯一持有。 */
export function usePictureReaderMotion(
    frameRef: RefObject<HTMLDivElement | null>,
    { index, blocked, onBusyChange }: PictureReaderMotionOptions,
): RefObject<gsap.core.Timeline | null> {
    const previousIndex = useRef(index)
    const motion = useRef<gsap.core.Timeline | null>(null)
    useGSAP(
        (_context, contextSafe): (() => void) | undefined => {
            const frame = frameRef.current
            if (!frame) return
            const slides = Array.from(frame.querySelectorAll<HTMLElement>('[data-picture-slide]'))
            const incoming = slides[index]
            const outgoing = slides[previousIndex.current]
            const direction = getPictureReaderDirection(previousIndex.current, index, slides.length)
            previousIndex.current = index
            const settle = (): void => {
                gsap.set(slides, { autoAlpha: 0, xPercent: 0 })
                if (incoming) gsap.set(incoming, { autoAlpha: 1 })
                frame.dataset.pictureSwitching = 'false'
                motion.current = null
                onBusyChange(false)
            }
            const complete = contextSafe?.(settle) ?? settle
            gsap.set(slides, { autoAlpha: 0, xPercent: 0 })
            if (
                !incoming ||
                !outgoing ||
                direction === 0 ||
                blocked ||
                document.hidden ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                complete()
                return
            }
            onBusyChange(true)
            frame.dataset.pictureSwitching = 'true'
            gsap.set(outgoing, { autoAlpha: 1 })
            gsap.set(incoming, { autoAlpha: 1, xPercent: direction * 100 })
            const timeline = gsap.timeline({ onComplete: complete })
            timeline.to(
                outgoing,
                { xPercent: direction * -100, duration: 0.35, ease: 'power2.inOut' },
                0,
            )
            timeline.to(incoming, { xPercent: 0, duration: 0.35, ease: 'power2.inOut' }, 0)
            motion.current = timeline
            return (): void => {
                timeline.kill()
                motion.current = null
                onBusyChange(false)
            }
        },
        { scope: frameRef, dependencies: [index, onBusyChange], revertOnUpdate: true },
    )
    useEffect(() => {
        if (blocked) motion.current?.progress(1)
    }, [blocked])
    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
        function finish(): void {
            if (document.hidden || preference.matches) motion.current?.progress(1)
        }
        preference.addEventListener('change', finish)
        document.addEventListener('visibilitychange', finish)
        return (): void => {
            preference.removeEventListener('change', finish)
            document.removeEventListener('visibilitychange', finish)
        }
    }, [])
    return motion
}
