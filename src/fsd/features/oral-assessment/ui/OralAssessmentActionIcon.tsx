'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { gsap, useAnimationActivity, useGSAP } from '../../../shared/lib/animation'
import microphone from '../assets/microphone.png'
import play from '../assets/play.png'

interface OralAssessmentActionIconProps {
    readonly kind: 'microphone' | 'play'
    readonly compact?: boolean
    readonly active?: boolean
}

/** 原图只显示中心圆，两个外圈独立扩散，按钮与中心图标不缩放、不闪烁。 */
export function OralAssessmentActionIcon({
    kind,
    compact = false,
    active = false,
}: OralAssessmentActionIconProps): ReactElement {
    const host = useRef<HTMLSpanElement>(null)
    const activity = useAnimationActivity(host)
    const running = active && activity.visible && !activity.reduced
    const asset = kind === 'microphone' ? microphone : play

    useGSAP(
        () => {
            const rings = host.current?.querySelectorAll('[data-oral-ripple]')
            if (!rings) return
            gsap.set(rings, { scale: 1, opacity: 0, transformOrigin: '50% 50%' })
            if (!running) return
            rings.forEach((ring, index): void => {
                const ripple = gsap.fromTo(
                    ring,
                    { scale: 1, opacity: 0.3 },
                    {
                        scale: 5 / 3,
                        opacity: 0,
                        duration: 1.8,
                        repeat: -1,
                        ease: 'power1.out',
                    },
                )
                ripple.totalTime(index * 0.9)
            })
        },
        { scope: host, dependencies: [running], revertOnUpdate: true },
    )

    return (
        <span
            ref={host}
            aria-hidden="true"
            data-oral-action-icon={kind}
            data-oral-action-active={active}
            data-ripple-running={running}
            className={
                compact
                    ? 'relative block size-[60px] shrink-0'
                    : 'relative block size-[100px] shrink-0'
            }
        >
            <span
                className={
                    kind === 'microphone'
                        ? 'absolute inset-0 text-oral-record'
                        : 'absolute inset-0 text-oral-play'
                }
            >
                <span
                    data-oral-ripple
                    className="absolute inset-[20%] rounded-full bg-current opacity-0"
                />
                <span
                    data-oral-ripple
                    className="absolute inset-[20%] rounded-full bg-current opacity-0"
                />
            </span>
            <img
                src={asset.src}
                alt=""
                width={compact ? 60 : 100}
                height={compact ? 60 : 100}
                draggable={false}
                className="relative block size-full [clip-path:circle(30%_at_50%_50%)]"
            />
        </span>
    )
}
