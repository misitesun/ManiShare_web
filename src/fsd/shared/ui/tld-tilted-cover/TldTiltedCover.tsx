'use client'

import { useEffect, useRef, type ReactElement } from 'react'
import { createCoverTiltController, type CoverTilt } from './cover-tilt'

export interface TldTiltedCoverProps {
    readonly src: string
    readonly alt: string
    readonly loading?: 'eager' | 'lazy'
    readonly disabled?: boolean
}

const tiltProperties = [
    '--cover-rotate-x',
    '--cover-rotate-y',
    '--cover-scale',
    '--cover-glare-x',
    '--cover-glare-y',
]

/** 尺寸、比例、圆角和点击目标仍由调用方拥有；这里只变换图片表面。 */
export function TldTiltedCover({
    src,
    alt,
    loading,
    disabled = false,
}: TldTiltedCoverProps): ReactElement {
    const frameRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const frame = frameRef.current
        if (frame === null || disabled) return
        const motion = window.matchMedia(
            '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)',
        )
        let watchingWindow = false

        function apply(tilt: CoverTilt): void {
            if (frame === null) return
            if (!tilt.active) {
                delete frame.dataset.tilted
                for (const property of tiltProperties) frame.style.removeProperty(property)
                return
            }
            frame.dataset.tilted = 'true'
            frame.style.setProperty('--cover-rotate-x', `${tilt.rotateX}deg`)
            frame.style.setProperty('--cover-rotate-y', `${tilt.rotateY}deg`)
            frame.style.setProperty('--cover-scale', String(tilt.scale))
            frame.style.setProperty('--cover-glare-x', `${tilt.glareX}%`)
            frame.style.setProperty('--cover-glare-y', `${tilt.glareY}%`)
        }

        const controller = createCoverTiltController({
            measure: () => frame.getBoundingClientRect(),
            apply,
            requestFrame: (callback) => window.requestAnimationFrame(callback),
            cancelFrame: (id) => window.cancelAnimationFrame(id),
        })

        function unwatchWindow(): void {
            if (!watchingWindow) return
            watchingWindow = false
            window.removeEventListener('blur', reset)
            window.removeEventListener('resize', reset)
            window.removeEventListener('scroll', reset, true)
            document.removeEventListener('visibilitychange', reset)
        }

        function reset(): void {
            controller.reset()
            unwatchWindow()
        }

        function move(event: PointerEvent): void {
            if (event.pointerType !== 'mouse' || !motion.matches || document.hidden) {
                reset()
                return
            }
            if (!watchingWindow) {
                watchingWindow = true
                window.addEventListener('blur', reset)
                window.addEventListener('resize', reset)
                window.addEventListener('scroll', reset, { capture: true, passive: true })
                document.addEventListener('visibilitychange', reset)
            }
            controller.move({ x: event.clientX, y: event.clientY })
        }

        function pointerDown(event: PointerEvent): void {
            if (event.pointerType !== 'mouse') reset()
        }

        frame.addEventListener('pointerenter', move)
        frame.addEventListener('pointermove', move)
        frame.addEventListener('pointerleave', reset)
        frame.addEventListener('pointercancel', reset)
        frame.addEventListener('pointerdown', pointerDown)
        motion.addEventListener('change', reset)

        return (): void => {
            unwatchWindow()
            controller.destroy()
            frame.removeEventListener('pointerenter', move)
            frame.removeEventListener('pointermove', move)
            frame.removeEventListener('pointerleave', reset)
            frame.removeEventListener('pointercancel', reset)
            frame.removeEventListener('pointerdown', pointerDown)
            motion.removeEventListener('change', reset)
        }
    }, [disabled, src])

    return (
        <span
            ref={frameRef}
            data-tilted-cover=""
            className="group/cover relative block size-full overflow-hidden rounded-[inherit] [perspective:800px]"
        >
            <span
                data-tilted-surface=""
                className="relative block size-full overflow-hidden rounded-[inherit] transition-[transform,box-shadow] duration-300 ease-out [backface-visibility:hidden] [transform:rotateX(var(--cover-rotate-x,0deg))_rotateY(var(--cover-rotate-y,0deg))_scale(var(--cover-scale,1))] group-data-[tilted=true]/cover:shadow-tilted-cover group-data-[tilted=true]/cover:duration-150 group-data-[tilted=true]/cover:will-change-transform motion-reduce:transform-none motion-reduce:transition-none"
            >
                <img
                    src={src}
                    alt={alt}
                    aria-hidden={alt === '' ? true : undefined}
                    loading={loading}
                    className="block size-full rounded-[inherit] object-cover"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_var(--cover-glare-x,50%)_var(--cover-glare-y,50%),var(--app-color-cover-glare),transparent_65%)] opacity-0 transition-opacity duration-300 group-data-[tilted=true]/cover:opacity-100 motion-reduce:hidden"
                />
            </span>
        </span>
    )
}
