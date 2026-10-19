'use client'

import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import {
    getPracticeEntryLoadingProgress,
    practiceEntryLoadingDurationMs,
} from '../model/practice-entry-loading'
import mascotAsset from '../assets/course-loading-mascot.png'

interface PracticeLoadingScreenProps {
    readonly onComplete: () => void
}

export function PracticeLoadingScreen({ onComplete }: PracticeLoadingScreenProps): ReactElement {
    const rootRef = useRef<HTMLElement>(null)
    const [progress, setProgress] = useState(0)

    useGSAP(
        () => {
            const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
            const clock = { elapsed: 0 }
            let active = true
            const update = (): void => {
                if (active)
                    setProgress(motion.matches ? 0 : getPracticeEntryLoadingProgress(clock.elapsed))
            }
            rootRef.current?.focus({ preventScroll: true })
            motion.addEventListener('change', update)
            const animation = gsap.to(clock, {
                elapsed: practiceEntryLoadingDurationMs,
                duration: practiceEntryLoadingDurationMs / 1000,
                ease: 'none',
                onUpdate: update,
                onComplete: (): void => {
                    if (!active) return
                    setProgress(100)
                    onComplete()
                },
            })
            return (): void => {
                active = false
                motion.removeEventListener('change', update)
                animation.kill()
            }
        },
        { scope: rootRef, dependencies: [onComplete], revertOnUpdate: true },
    )

    return (
        <main
            ref={rootRef}
            aria-busy="true"
            aria-label="正在准备练习"
            data-practice-loading="true"
            tabIndex={-1}
            className="fixed inset-0 z-80 overflow-y-auto bg-canvas text-foreground outline-none"
        >
            <div className="flex min-h-svh w-full flex-col items-center px-4 pt-12 pb-10 md:px-8 md:pt-[clamp(80px,30svh,270px)] design:min-h-[1080px] design:pt-[329px]">
                <img
                    src={mascotAsset.src}
                    alt=""
                    width={300}
                    height={300}
                    draggable={false}
                    className="aspect-square w-[200px] shrink-0 object-contain md:w-[260px] design:w-[300px]"
                />
                <div className="mt-16 w-full md:mt-24 design:mt-[203px]">
                    <p
                        role="status"
                        className="text-center text-body-notice font-normal text-progress-loading-caption md:leading-[23px] design:leading-[23px]"
                    >
                        加载中…
                    </p>
                    <div className="mx-auto mt-5 w-[calc(100%_-_60px)] max-w-[900px] translate-x-[30px]">
                        <TldProgressBar
                            ariaLabel="练习加载进度"
                            max={100}
                            value={progress}
                            size="loading"
                            valueFormat="percentage"
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
