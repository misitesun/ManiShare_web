import { useEffect, useRef, useState, type ReactElement, type RefObject } from 'react'
import { gsap, useGSAP } from '../../lib/animation'
import {
    getHighlightDirection,
    getHighlightEdges,
    getHighlightRect,
    getHighlightRectFromEdges,
    getLayoutScale,
    getRubberSquashEdges,
    getRubberStretchEdges,
    type HighlightAxis,
    type HighlightRect,
} from './geometry'

export interface TldMovingHighlightProps {
    readonly containerRef: RefObject<HTMLElement | null>
    readonly activeKey: string | null
    readonly axis?: HighlightAxis
    readonly motion?: 'rubber' | 'slide'
    readonly tone?: TldMovingHighlightTone
    readonly shape?: 'rounded' | 'card' | 'pill-start' | 'pill-end'
}

export type TldMovingHighlightTone =
    'accent-green' | 'brand' | 'brand-start' | 'outline' | 'soft' | 'surface'

interface HighlightMeasurement {
    readonly key: string | null
    readonly rect: HighlightRect | null
}

const RUBBER_STRETCH_DURATION = 0.19
const RUBBER_HANDOFF_TIME = 0.15
const RUBBER_LAND_DURATION = 0.3
const RUBBER_RELAX_DURATION = 0.16
const RUBBER_SQUASH = 3

function haveSameRect(first: HighlightRect | null, second: HighlightRect | null): boolean {
    return (
        first?.left === second?.left &&
        first?.top === second?.top &&
        first?.width === second?.width &&
        first?.height === second?.height
    )
}

/** 容器 relative isolate；选项 data-highlight-key；背景 z-0、内容 z-20。 */
export function TldMovingHighlight({
    containerRef,
    activeKey,
    axis = 'horizontal',
    motion = 'slide',
    tone = 'outline',
    shape = 'rounded',
}: TldMovingHighlightProps): ReactElement | null {
    const highlightRef = useRef<HTMLSpanElement>(null)
    const previousActiveKeyRef = useRef(activeKey)
    const visualRectRef = useRef<HighlightRect | null>(null)
    const [measurement, setMeasurement] = useState<HighlightMeasurement>({
        key: activeKey,
        rect: null,
    })

    // 父容器 ref 在子组件 layout effect 执行时可能尚未挂载；commit 后再启动测量。
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        function measure(): void {
            if (!container) return
            const target = Array.from(
                container.querySelectorAll<HTMLElement>('[data-highlight-key]'),
            ).find((item) => item.dataset.highlightKey === activeKey)
            const bounds = container.getBoundingClientRect()
            const scaleX = getLayoutScale(bounds.width, container.offsetWidth)
            const scaleY = getLayoutScale(bounds.height, container.offsetHeight)
            const targetBounds = target?.getBoundingClientRect()
            const next = targetBounds
                ? getHighlightRect(
                      {
                          left: 0,
                          top: 0,
                          width: bounds.width / scaleX,
                          height: bounds.height / scaleY,
                          scrollLeft: container.scrollLeft,
                          scrollTop: container.scrollTop,
                          clientLeft: container.clientLeft,
                          clientTop: container.clientTop,
                      },
                      {
                          left: (targetBounds.left - bounds.left) / scaleX,
                          top: (targetBounds.top - bounds.top) / scaleY,
                          width: targetBounds.width / scaleX,
                          height: targetBounds.height / scaleY,
                      },
                  )
                : null
            setMeasurement((previous) => {
                if (previous.key === activeKey && haveSameRect(previous.rect, next)) {
                    return previous
                }
                return { key: activeKey, rect: next }
            })
        }
        const observer = new ResizeObserver(measure)
        function observeTargets(): void {
            if (!container) return
            observer.disconnect()
            observer.observe(container)
            container
                ?.querySelectorAll<HTMLElement>('[data-highlight-key]')
                .forEach((target) => observer.observe(target))
            measure()
        }
        observeTargets()
        const mutationObserver = new MutationObserver(observeTargets)
        mutationObserver.observe(container, { childList: true, subtree: true })
        function onTransitionEnd(event: TransitionEvent): void {
            if (event.target === container) measure()
        }
        container.addEventListener('transitionend', onTransitionEnd)
        window.addEventListener('resize', measure)
        return (): void => {
            observer.disconnect()
            mutationObserver.disconnect()
            container.removeEventListener('transitionend', onTransitionEnd)
            window.removeEventListener('resize', measure)
        }
    }, [activeKey, containerRef])

    const hasCurrentMeasurement = measurement.key === activeKey
    const targetRect = hasCurrentMeasurement ? measurement.rect : null

    function applyIndicatorRect(nextRect: HighlightRect): void {
        visualRectRef.current = nextRect
        const highlight = highlightRef.current
        if (highlight === null) return
        highlight.style.transform = `translate(${nextRect.left}px, ${nextRect.top}px)`
        highlight.style.width = `${nextRect.width}px`
        highlight.style.height = `${nextRect.height}px`
    }

    useGSAP(
        () => {
            if (motion !== 'rubber' || !hasCurrentMeasurement) return
            if (targetRect === null) {
                visualRectRef.current = null
                previousActiveKeyRef.current = activeKey
                return
            }

            const previousActiveKey = previousActiveKeyRef.current
            const currentRect = visualRectRef.current
            previousActiveKeyRef.current = activeKey
            if (
                currentRect === null ||
                previousActiveKey === null ||
                previousActiveKey === activeKey
            ) {
                applyIndicatorRect(targetRect)
                return
            }

            const currentEdges = getHighlightEdges(currentRect, axis)
            const targetEdges = getHighlightEdges(targetRect, axis)
            const direction = getHighlightDirection(currentEdges, targetEdges)
            if (direction === 0) {
                applyIndicatorRect(targetRect)
                return
            }

            const animatedEdges = { ...currentEdges }
            const stretched = getRubberStretchEdges(currentEdges, targetEdges)
            const squashed = getRubberSquashEdges(targetEdges, direction, RUBBER_SQUASH)
            const media = gsap.matchMedia()

            media.add('(prefers-reduced-motion: reduce)', () => {
                applyIndicatorRect(targetRect)
            })
            media.add('(prefers-reduced-motion: no-preference)', () => {
                const timeline = gsap.timeline({
                    onComplete: (): void => applyIndicatorRect(targetRect),
                    onUpdate: (): void =>
                        applyIndicatorRect(
                            getHighlightRectFromEdges(targetRect, axis, animatedEdges),
                        ),
                })

                timeline.to(
                    animatedEdges,
                    {
                        start: stretched.start,
                        end: stretched.end,
                        duration: RUBBER_STRETCH_DURATION,
                        ease: 'power3.out',
                    },
                    0,
                )

                if (direction > 0) {
                    timeline.to(
                        animatedEdges,
                        {
                            end: targetEdges.end,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(
                        animatedEdges,
                        {
                            start: squashed.start,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(animatedEdges, {
                        start: targetEdges.start,
                        duration: RUBBER_RELAX_DURATION,
                        ease: 'power2.out',
                    })
                } else {
                    timeline.to(
                        animatedEdges,
                        {
                            start: targetEdges.start,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(
                        animatedEdges,
                        {
                            end: squashed.end,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(animatedEdges, {
                        end: targetEdges.end,
                        duration: RUBBER_RELAX_DURATION,
                        ease: 'power2.out',
                    })
                }

                return (): void => {
                    timeline.kill()
                }
            })

            return (): void => media.revert()
        },
        {
            dependencies: [
                activeKey,
                axis,
                hasCurrentMeasurement,
                motion,
                targetRect?.height,
                targetRect?.left,
                targetRect?.top,
                targetRect?.width,
            ],
        },
    )

    const renderedRect =
        motion === 'rubber' ? (visualRectRef.current ?? targetRect) : measurement.rect
    if (
        activeKey === null ||
        renderedRect === null ||
        (hasCurrentMeasurement && targetRect === null)
    ) {
        return null
    }

    return (
        <span
            ref={highlightRef}
            aria-hidden="true"
            data-moving-highlight=""
            data-motion={motion}
            data-shape={shape}
            data-tone={tone}
            className={
                tone === 'surface'
                    ? 'pointer-events-none absolute left-0 top-0 z-10 rounded-lg bg-surface-hover transition-[transform,width,height,border-radius] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none data-[motion=rubber]:transition-none data-[shape=card]:rounded-xl data-[shape=pill-start]:rounded-l-full data-[shape=pill-start]:rounded-r-none data-[shape=pill-end]:rounded-l-none data-[shape=pill-end]:rounded-r-full'
                    : tone === 'brand'
                      ? 'pointer-events-none absolute left-0 top-0 z-10 rounded-full bg-brand transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none data-[motion=rubber]:transition-none'
                      : tone === 'brand-start'
                        ? 'pointer-events-none absolute left-0 top-0 z-10 rounded-full bg-brand-start transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none data-[motion=rubber]:transition-none'
                        : tone === 'accent-green'
                          ? 'pointer-events-none absolute left-0 top-0 z-10 rounded-full bg-accent-green transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none data-[motion=rubber]:transition-none'
                          : 'pointer-events-none absolute left-0 top-0 z-10 rounded-lg bg-linear-to-b from-brand-start to-brand-end p-px transition-[transform,width,height,border-radius] duration-200 ease-out motion-reduce:transition-none data-[motion=rubber]:transition-none data-[shape=card]:rounded-xl data-[shape=pill-start]:rounded-l-full data-[shape=pill-start]:rounded-r-none data-[shape=pill-end]:rounded-l-none data-[shape=pill-end]:rounded-r-full'
            }
            style={{
                transform: `translate(${renderedRect.left}px, ${renderedRect.top}px)`,
                width: renderedRect.width,
                height: renderedRect.height,
            }}
        >
            {tone === 'surface' ||
            tone === 'brand' ||
            tone === 'brand-start' ||
            tone === 'accent-green' ? null : (
                <span
                    data-shape={shape}
                    className="block size-full rounded-[7px] bg-canvas data-[shape=card]:rounded-[11px] data-[shape=pill-start]:rounded-l-full data-[shape=pill-start]:rounded-r-none data-[shape=pill-end]:rounded-l-none data-[shape=pill-end]:rounded-r-full"
                >
                    {tone === 'soft' ? (
                        <span className="block size-full rounded-[inherit] bg-linear-to-b from-brand-start/10 to-brand-end/10" />
                    ) : null}
                </span>
            )}
        </span>
    )
}
