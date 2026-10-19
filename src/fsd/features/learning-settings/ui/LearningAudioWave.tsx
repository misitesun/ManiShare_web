'use client'

import { useEffect, useId, useRef } from 'react'
import type { ReactElement } from 'react'
import { gsap, loadSiriWave, useAnimationActivity, useGSAP } from '../../../shared/lib/animation'
import type { SiriWaveInstance } from '../../../shared/lib/animation'

export interface LearningAudioWaveProps {
    readonly style: string
    readonly active?: boolean
    readonly label?: string
}

const columns = Array.from({ length: 32 }, (_, index) => index)

/** Shared by the two settings previews and the actual recording/playback surfaces. */
export function LearningAudioWave({
    style,
    active = true,
    label,
}: LearningAudioWaveProps): ReactElement {
    const host = useRef<HTMLDivElement>(null)
    const siriHost = useRef<HTMLDivElement>(null)
    const activity = useAnimationActivity(host)
    const gradient = `learning-wave-${useId().replace(/:/g, '')}`
    const siri = style === '曲线频谱'
    const line = style === '波形线条'

    useGSAP(
        () => {
            const element = host.current
            if (element === null || siri) return
            const moving = active && activity.visible && !activity.reduced
            const path = element.querySelector('[data-wave-line]')
            if (line) {
                gsap.set(path, { transformOrigin: '50% 50%', scaleY: active ? 0.6 : 0.15 })
                if (moving)
                    gsap.to(path, {
                        scaleY: 1.4,
                        duration: 1.2,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                    })
                return
            }
            const bars = element.querySelectorAll('[data-wave-column]')
            bars.forEach((bar, index): void => {
                const peak = style === '矩阵方块' ? 56 : style === '雨滴点阵' ? 64 : 50
                const duration =
                    index % 5 === 0 ? 1.7 : index % 3 === 0 ? 1.5 : index % 2 === 0 ? 0.9 : 1.2
                gsap.set(bar, {
                    height: active ? 10 + ((index * 17) % 35) : 6,
                    opacity: active ? 1 : 0.45,
                })
                if (moving)
                    gsap.fromTo(
                        bar,
                        { height: 6, opacity: 0.45 },
                        {
                            height: peak,
                            opacity: 1,
                            duration,
                            delay: -(index % 6) * 0.2,
                            repeat: -1,
                            yoyo: true,
                            ease: 'sine.inOut',
                        },
                    )
            })
        },
        {
            scope: host,
            dependencies: [style, active, activity.visible, activity.reduced],
            revertOnUpdate: true,
        },
    )

    useEffect(() => {
        const container = siriHost.current
        if (!siri || container === null) return
        let disposed = false
        let instance: SiriWaveInstance | null = null
        let create: (() => void) | null = null
        function rebuild(): void {
            create?.()
        }
        const resize = new ResizeObserver(rebuild)
        const theme = new MutationObserver(rebuild)
        resize.observe(container)
        theme.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        })
        void loadSiriWave()
            .then((SiriWave): void => {
                if (disposed) return
                create = (): void => {
                    instance?.dispose()
                    const width = container.getBoundingClientRect().width
                    if (width <= 0) {
                        instance = null
                        return
                    }
                    instance = new SiriWave({
                        container,
                        width,
                        height: 70,
                        style: 'ios',
                        speed: 0.1,
                        amplitude: active ? 0.8 : 0.15,
                        frequency: 5,
                        color: getComputedStyle(container)
                            .getPropertyValue('--app-color-audio-wave-start')
                            .trim(),
                        autostart: false,
                    })
                    if (active && activity.visible && !activity.reduced) instance.start()
                    else {
                        // Draw one representative frame without starting a frame loop.
                        instance.phase = 0.5
                        instance.curves.forEach((curve): void => curve.draw())
                    }
                }
                create()
            })
            .catch((): void => {
                if (!disposed) container.dataset.waveError = 'true'
            })
        return (): void => {
            disposed = true
            resize.disconnect()
            theme.disconnect()
            instance?.dispose()
            delete container.dataset.waveError
        }
    }, [siri, active, activity.visible, activity.reduced])

    return (
        <div
            ref={host}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            data-audio-wave={style}
            data-wave-active={active}
            className="mx-auto flex h-[70px] w-full max-w-[520px] items-end justify-center gap-1 overflow-hidden pb-1.5"
        >
            {siri ? (
                <div
                    ref={siriHost}
                    className="h-[70px] w-full overflow-hidden [&_canvas]:block [&_canvas]:max-w-full"
                />
            ) : line ? (
                <svg
                    viewBox="0 0 200 100"
                    preserveAspectRatio="none"
                    className="h-full w-full overflow-visible drop-shadow-[0_0_4px_var(--app-color-audio-wave-start)]"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
                            <stop
                                offset="0%"
                                stopColor="currentColor"
                                stopOpacity="0.1"
                                className="text-audio-wave-start"
                            />
                            <stop
                                offset="50%"
                                stopColor="currentColor"
                                className="text-audio-wave-start"
                            />
                            <stop
                                offset="100%"
                                stopColor="currentColor"
                                stopOpacity="0.1"
                                className="text-audio-wave-end"
                            />
                        </linearGradient>
                    </defs>
                    <path
                        data-wave-line
                        d="M0 50 Q25 20 50 50 T100 50 T150 50 T200 50"
                        fill="none"
                        stroke={`url(#${gradient})`}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : (
                columns.map((index) => (
                    <span
                        key={index}
                        data-wave-column
                        className={
                            style === '矩阵方块'
                                ? 'block h-3 w-1.5 shrink-0 bg-linear-to-b from-audio-wave-start to-audio-wave-end [mask-image:repeating-linear-gradient(to_top,var(--app-color-foreground)_0,var(--app-color-foreground)_6px,transparent_6px,transparent_8px)]'
                                : style === '雨滴点阵'
                                  ? 'block h-3 w-1 shrink-0 bg-linear-to-b from-audio-wave-start to-audio-wave-end [mask-image:radial-gradient(circle_at_50%_2px,var(--app-color-foreground)_2px,transparent_2.6px)] [mask-repeat:repeat-y] [mask-size:100%_8px]'
                                  : 'block h-3 w-[5px] shrink-0 rounded-full bg-linear-to-b from-audio-wave-start to-audio-wave-end'
                        }
                    />
                ))
            )}
        </div>
    )
}
