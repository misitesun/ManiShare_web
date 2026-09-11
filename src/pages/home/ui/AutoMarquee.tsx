import { useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'

export interface AutoMarqueeProps {
    readonly children: ReactNode
    readonly durationSeconds: number
}

export function AutoMarquee({ children, durationSeconds }: AutoMarqueeProps): ReactElement {
    const rootRef = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            const root = rootRef.current
            if (root === null) return undefined

            const track = root.querySelector<HTMLElement>('[data-marquee-track]')
            const cycle = root.querySelector<HTMLElement>('[data-marquee-cycle]')
            if (track === null || cycle === null) return undefined

            const media = gsap.matchMedia()
            media.add('(prefers-reduced-motion: no-preference)', () => {
                const tween = gsap.fromTo(
                    track,
                    { x: (): number => root.clientWidth },
                    {
                        duration: durationSeconds,
                        ease: 'none',
                        repeat: -1,
                        repeatRefresh: true,
                        x: (): number => -cycle.scrollWidth,
                    },
                )

                return (): void => {
                    tween.kill()
                }
            })
            media.add('(prefers-reduced-motion: reduce)', () => {
                gsap.set(track, { x: 0 })
            })

            return (): void => media.revert()
        },
        { scope: rootRef },
    )

    return (
        <div ref={rootRef} className="min-w-0 overflow-hidden">
            <div data-marquee-track className="flex w-max will-change-transform">
                <div data-marquee-cycle className="flex shrink-0 items-center gap-6 pr-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
