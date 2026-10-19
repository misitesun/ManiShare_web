'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createLottiePlayback } from './lottie-playback'
import type { LottieData, LottiePlayback } from './lottie-playback'
import { useAnimationActivity } from './useAnimationActivity'

export interface LottiePreviewProps {
    readonly loadData: () => Promise<LottieData>
    readonly speed?: number
    readonly revision?: number
}

/** Preview playback is local to its surface; offscreen/hidden previews pause. */
export function LottiePreview({
    loadData,
    speed = 1,
    revision = 0,
}: LottiePreviewProps): ReactElement {
    const host = useRef<HTMLDivElement>(null)
    const playback = useRef<LottiePlayback | null>(null)
    const activity = useAnimationActivity(host)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (host.current === null) return
        const instance = createLottiePlayback(host.current, {
            loadData,
            speed,
            loop: true,
            onReady: (): void => setFailed(false),
            onError: (): void => setFailed(true),
        })
        playback.current = instance
        return (): void => {
            instance.destroy()
            if (playback.current === instance) playback.current = null
        }
    }, [loadData, speed, revision])

    useEffect(() => {
        if (activity.reduced) playback.current?.still()
        else if (activity.visible) playback.current?.play()
        else playback.current?.pause()
    }, [activity.reduced, activity.visible, loadData, speed, revision])

    return (
        <div className="relative size-full" aria-hidden="true">
            <div
                ref={host}
                className="size-full overflow-hidden leading-none [&_svg]:block [&_svg]:size-full"
            />
            {failed ? (
                <span className="absolute inset-0 flex items-center justify-center p-2 text-caption text-muted">
                    动画暂不可用
                </span>
            ) : null}
        </div>
    )
}
