'use client'

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { createLottiePlayback } from '../../../shared/lib/animation'
import type { LottieData, LottiePlayback } from '../../../shared/lib/animation'

export interface WordRememberFeedbackProps {
    readonly active: boolean
    readonly onComplete: () => void
}

async function loadRememberAnimation(): Promise<LottieData> {
    return (await import('../assets/word-card-remember.json')).default
}

/** 只播放按钮内的一次视觉反馈；标记、切题及等待提交均归父级。 */
export function WordRememberFeedback({
    active,
    onComplete,
}: WordRememberFeedbackProps): ReactElement | null {
    const host = useRef<HTMLSpanElement>(null)
    const completeRef = useRef(onComplete)
    const deliveredRef = useRef(false)

    useEffect(() => {
        completeRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
        if (!active) {
            deliveredRef.current = false
            return
        }
        const container = host.current
        if (container === null || deliveredRef.current) return
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        let cancelled = false
        let playback: LottiePlayback | null = null
        function finish(): void {
            if (cancelled || deliveredRef.current) return
            deliveredRef.current = true
            playback?.destroy()
            playback = null
            completeRef.current()
        }
        function respectMotion(): void {
            if (motion.matches) finish()
        }
        if (motion.matches) finish()
        else {
            playback = createLottiePlayback(container, {
                loadData: loadRememberAnimation,
                loop: false,
                speed: 1.5,
                onComplete: finish,
                onError: finish,
            })
            playback.play()
        }
        motion.addEventListener('change', respectMotion)
        return (): void => {
            cancelled = true
            motion.removeEventListener('change', respectMotion)
            playback?.destroy()
            playback = null
        }
    }, [active])

    if (!active) return null
    return (
        <span
            aria-hidden="true"
            data-word-remember-feedback
            className="pointer-events-none absolute left-0 top-0 z-10 block size-[66px] overflow-visible"
        >
            <span
                ref={host}
                data-word-remember-player
                className="absolute left-1/2 top-1/2 block size-[158.4px] -translate-x-1/2 -translate-y-1/2 overflow-visible leading-none [&_svg]:block [&_svg]:size-full [&_svg]:overflow-visible"
            />
        </span>
    )
}
