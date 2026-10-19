'use client'

import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'

interface PracticePanelMotionOptions {
    readonly open: boolean
    readonly ready?: boolean
    readonly direction: 'right' | 'up' | 'popover'
}

/** 逻辑关闭后保留退场画面；反向切换杀掉旧 tween，接续当前位移。 */
export function usePracticePanelMotion(
    panelRef: RefObject<HTMLDivElement | null>,
    { open, ready = true, direction }: PracticePanelMotionOptions,
): boolean {
    const [retained, setRetained] = useState(false)
    const initializedRef = useRef<HTMLDivElement | null>(null)
    const tweenRef = useRef<gsap.core.Tween | null>(null)

    useGSAP(
        (context): (() => void) | undefined => {
            const panel = panelRef.current
            if (!ready || !panel || (!open && initializedRef.current !== panel)) return
            const visible = window.visualViewport
            const offset =
                direction === 'right'
                    ? {
                          x:
                              (visible?.offsetLeft ?? 0) +
                              (visible?.width ?? window.innerWidth) -
                              panel.offsetLeft +
                              12,
                          y: 0,
                          opacity: 1,
                      }
                    : direction === 'up'
                      ? { x: 0, y: -panel.offsetTop - panel.offsetHeight - 12, opacity: 0 }
                      : { x: 0, y: -6, opacity: 0 }

            function complete(): void {
                if (open) return
                initializedRef.current = null
                setRetained(false)
            }

            let motionContext: gsap.Context | undefined
            // 每轮单独清理 context，避免章节内反复开关积累旧 tween / 草稿节点。
            context.ignore((): void => {
                motionContext = gsap.context((): void => {
                    if (open && initializedRef.current !== panel) {
                        setRetained(true)
                        initializedRef.current = panel
                        gsap.set(panel, offset)
                    }
                    const target = open ? { x: 0, y: 0, opacity: 1 } : offset
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        gsap.set(panel, target)
                        complete()
                        return
                    }
                    tweenRef.current = gsap.to(panel, {
                        ...target,
                        duration:
                            direction === 'popover' ? 0.15 : direction === 'right' ? 0.24 : 0.25,
                        ease: open ? 'power2.out' : 'power2.in',
                        onComplete: complete,
                    })
                }, panelRef)
            })
            return (): void => {
                // kill 不回退位移，反向重开从当前位置接续，同时取消旧完成回调。
                motionContext?.kill(false)
                tweenRef.current = null
            }
        },
        { scope: panelRef, dependencies: [open, ready, direction], revertOnUpdate: true },
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
        { scope: panelRef },
    )

    return ready && (open || retained)
}
