'use client'

import type { ReactElement } from 'react'
import { LearningAudioWave } from '../../../features/learning-settings'

export interface PracticeReadingView {
    readonly status: 'pending-source' | 'playing' | 'blocked-playback'
    readonly waveStyle: string
    readonly message?: string
}

/** 仅展示当前图片的朗读状态；音源、播放与访问次数均由会话所有者管理。 */
export function PracticeReadingOverlay({
    reading,
}: {
    readonly reading?: PracticeReadingView | undefined
}): ReactElement | null {
    if (reading === undefined) return null
    const message =
        reading.message ??
        (reading.status === 'pending-source'
            ? '音源待接入'
            : reading.status === 'blocked-playback'
              ? '点击朗读重试'
              : undefined)
    return (
        <div
            data-practice-reading-overlay={reading.status}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden bg-linear-to-t from-media-ink/80 to-transparent px-3 py-2 text-center text-media-foreground"
        >
            <LearningAudioWave
                style={reading.waveStyle}
                active={reading.status === 'playing'}
                label="朗读声纹"
            />
            {message && (
                <p role="status" aria-live="polite" className="mt-1 text-caption-tight">
                    {message}
                </p>
            )}
        </div>
    )
}
