'use client'

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface AnimationActivity {
    readonly visible: boolean
    readonly reduced: boolean
}

/** Observe the actual surface, including clipping by a scrolling settings dialog. */
export function useAnimationActivity(ref: RefObject<HTMLElement | null>): AnimationActivity {
    const [activity, setActivity] = useState<AnimationActivity>({ visible: false, reduced: false })
    useEffect(() => {
        const host = ref.current
        if (host === null) return
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        let intersecting = false
        function publish(): void {
            const visible = intersecting && document.visibilityState === 'visible'
            setActivity((previous) =>
                previous.visible === visible && previous.reduced === motion.matches
                    ? previous
                    : { visible, reduced: motion.matches },
            )
        }
        const observer = new IntersectionObserver((entries): void => {
            intersecting = entries.some((entry) => entry.isIntersecting)
            publish()
        })
        observer.observe(host)
        motion.addEventListener('change', publish)
        document.addEventListener('visibilitychange', publish)
        publish()
        return (): void => {
            observer.disconnect()
            motion.removeEventListener('change', publish)
            document.removeEventListener('visibilitychange', publish)
        }
    }, [ref])
    return activity
}
