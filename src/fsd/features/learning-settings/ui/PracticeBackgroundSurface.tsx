'use client'

import { useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type { PracticeBackgroundImage } from '../model/practice-background'

interface PracticeBackgroundSurfaceProps {
    readonly image: PracticeBackgroundImage | null
    readonly dim: number
    readonly blur: number
    readonly color: string
    readonly children: ReactNode
    readonly variant?: 'sample' | 'practice' | 'session'
    readonly fontFamily?: string
}

export function PracticeBackgroundSurface({
    image,
    dim,
    blur,
    color,
    children,
    variant = 'practice',
    fontFamily,
}: PracticeBackgroundSurfaceProps): ReactElement {
    const [failedSource, setFailedSource] = useState<string | null>(null)
    const visibleImage = image !== null && failedSource !== image.source
    return (
        <div
            className={
                variant === 'session'
                    ? 'relative isolate min-h-dvh w-full min-w-0 bg-practice-background text-practice-text'
                    : variant === 'sample'
                      ? 'relative isolate flex aspect-[9/5] min-w-0 items-center justify-center overflow-hidden rounded-xl border border-strong bg-practice-background p-5 text-practice-text'
                      : 'relative isolate min-w-0 overflow-hidden rounded-xl border border-strong bg-practice-background p-5 text-practice-text'
            }
            style={{ backgroundColor: color, fontFamily }}
        >
            {visibleImage ? (
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        src={image.source}
                        className="pointer-events-none absolute -inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] max-w-none object-cover"
                        style={{ filter: `blur(${blur}px)` }}
                        onError={(): void => setFailedSource(image.source)}
                    />
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-practice-image-mask"
                        style={{ opacity: dim / 100 }}
                    />
                </div>
            ) : null}
            <div className="relative z-[1] min-w-0 w-full">
                {children}
                {image !== null && !visibleImage ? (
                    <p role="status" className="mt-3 text-caption">
                        背景图无法显示，请更换或移除。
                    </p>
                ) : null}
            </div>
        </div>
    )
}
