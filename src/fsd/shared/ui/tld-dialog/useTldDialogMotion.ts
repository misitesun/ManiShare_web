'use client'

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../lib/animation'

interface DialogMotionOptions {
    readonly open: boolean
    readonly ready: boolean
    readonly enabled: boolean
    readonly onAfterClose?: (() => void) | undefined
}

export function useTldDialogMotion(
    layerRef: RefObject<HTMLDivElement | null>,
    frameRef: RefObject<HTMLDivElement | null>,
    { open, ready, enabled, onAfterClose }: DialogMotionOptions,
): boolean {
    const [retained, setRetained] = useState(false)
    const initializedRef = useRef<HTMLDivElement | null>(null)
    const afterCloseRef = useRef(onAfterClose)
    const tweenRef = useRef<gsap.core.Timeline | null>(null)
    useEffect((): void => {
        afterCloseRef.current = onAfterClose
    }, [onAfterClose])

    useGSAP(
        (context): (() => void) | undefined => {
            const layer = layerRef.current
            const frame = frameRef.current
            if (!ready || !layer || !frame || (!open && initializedRef.current !== layer)) return
            let motion: gsap.Context | undefined
            function complete(): void {
                if (open) return
                initializedRef.current = null
                setRetained(false)
                afterCloseRef.current?.()
            }
            context.ignore((): void => {
                motion = gsap.context((): void => {
                    if (open && initializedRef.current !== layer) {
                        initializedRef.current = layer
                        setRetained(true)
                        gsap.set(layer, { opacity: 0 })
                        gsap.set(frame, { y: 12, scale: 0.97 })
                    }
                    const layerTarget = { opacity: open ? 1 : 0 }
                    const frameTarget = { y: open ? 0 : 12, scale: open ? 1 : 0.97 }
                    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        gsap.set(layer, layerTarget)
                        gsap.set(frame, frameTarget)
                        complete()
                        return
                    }
                    tweenRef.current = gsap.timeline({
                        defaults: { duration: 0.24, ease: open ? 'power2.out' : 'power2.in' },
                        onComplete: complete,
                    })
                    tweenRef.current.to(layer, layerTarget, 0).to(frame, frameTarget, 0)
                }, layerRef)
            })
            return (): void => {
                motion?.kill(false)
                tweenRef.current = null
            }
        },
        { scope: layerRef, dependencies: [open, ready, enabled], revertOnUpdate: true },
    )

    useGSAP(
        (): (() => void) => {
            const media = window.matchMedia('(prefers-reduced-motion: reduce)')
            function finishReducedMotion(): void {
                if (media.matches) tweenRef.current?.progress(1)
            }
            media.addEventListener('change', finishReducedMotion)
            return (): void => {
                media.removeEventListener('change', finishReducedMotion)
                initializedRef.current = null
                tweenRef.current = null
            }
        },
        { scope: layerRef },
    )
    return ready && (open || retained)
}
