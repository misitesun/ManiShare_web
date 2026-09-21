import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ReactElement,
    type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { gsap, useGSAP } from '../../lib/animation'
import {
    TooltipGroupContext,
    type GroupedTooltipPayload,
    type TooltipGroupContextValue,
} from './context'
import { getTooltipCoordinates, getTooltipLeanAngle } from './position'
import type { TooltipPlacement } from './position'

export interface TooltipGroupProps {
    readonly children: ReactNode
    readonly maxTilt?: number
    readonly travelDuration?: number
}

type TooltipPhase = 'closed' | 'closing' | 'open'

const CLOSE_GRACE_MS = 80
const CLOSE_DURATION_SECONDS = 0.13
const DEFAULT_MAX_TILT = 3
const DEFAULT_TRAVEL_DURATION = 0.32

function getTransformOrigin(placement: TooltipPlacement): string {
    if (placement === 'top') return 'center bottom'
    if (placement === 'right') return 'left center'
    if (placement === 'bottom') return 'center top'
    return 'right center'
}

function getEntryOffset(placement: TooltipPlacement): { readonly x: number; readonly y: number } {
    if (placement === 'top') return { x: 0, y: 4 }
    if (placement === 'right') return { x: -4, y: 0 }
    if (placement === 'bottom') return { x: 0, y: -4 }
    return { x: 4, y: 0 }
}

function getAxisPosition(element: HTMLElement, placement: TooltipPlacement): number {
    const rawValue =
        placement === 'top' || placement === 'bottom' ? element.style.left : element.style.top
    const value = Number.parseFloat(rawValue)
    return Number.isFinite(value) ? value : 0
}

export function TooltipGroup({
    children,
    maxTilt = DEFAULT_MAX_TILT,
    travelDuration = DEFAULT_TRAVEL_DURATION,
}: TooltipGroupProps): ReactElement {
    const tooltipId = useId()
    const positionRef = useRef<HTMLSpanElement>(null)
    const surfaceRef = useRef<HTMLSpanElement>(null)
    const contentRef = useRef<HTMLSpanElement>(null)
    const measurementRef = useRef<HTMLSpanElement>(null)
    const activeRef = useRef<GroupedTooltipPayload | null>(null)
    const phaseRef = useRef<TooltipPhase>('closed')
    const previousIdRef = useRef<string | null>(null)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const [active, setActive] = useState<GroupedTooltipPayload | null>(null)
    const [phase, setPhase] = useState<TooltipPhase>('closed')

    const setCurrentPhase = useCallback((nextPhase: TooltipPhase): void => {
        phaseRef.current = nextPhase
        setPhase(nextPhase)
    }, [])

    const show = useCallback(
        (payload: GroupedTooltipPayload): void => {
            clearTimeout(closeTimerRef.current)
            activeRef.current = payload
            setCurrentPhase('open')
            setActive(payload)
        },
        [setCurrentPhase],
    )

    const hide = useCallback(
        (id: string, instant = false): void => {
            if (activeRef.current?.id !== id) return
            clearTimeout(closeTimerRef.current)
            if (instant) {
                activeRef.current = null
                previousIdRef.current = null
                setCurrentPhase('closed')
                setActive(null)
                return
            }
            closeTimerRef.current = setTimeout((): void => {
                if (activeRef.current?.id === id) setCurrentPhase('closing')
            }, CLOSE_GRACE_MS)
        },
        [setCurrentPhase],
    )

    useEffect(
        () => (): void => {
            clearTimeout(closeTimerRef.current)
        },
        [],
    )

    useGSAP(
        () => {
            const current = active
            const position = positionRef.current
            const surface = surfaceRef.current
            const content = contentRef.current
            const measurement = measurementRef.current
            if (current === null || position === null || surface === null || measurement === null) {
                return
            }

            const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (phase === 'closing') {
                if (shouldReduceMotion) {
                    activeRef.current = null
                    previousIdRef.current = null
                    setCurrentPhase('closed')
                    setActive(null)
                    return
                }
                const entryOffset = getEntryOffset(current.placement)
                gsap.to(surface, {
                    autoAlpha: 0,
                    filter: 'blur(3px)',
                    scale: 0.96,
                    x: entryOffset.x,
                    y: entryOffset.y,
                    duration: CLOSE_DURATION_SECONDS,
                    ease: 'power3.out',
                    onComplete: (): void => {
                        if (
                            phaseRef.current !== 'closing' ||
                            activeRef.current?.id !== current.id
                        ) {
                            return
                        }
                        activeRef.current = null
                        previousIdRef.current = null
                        setCurrentPhase('closed')
                        setActive(null)
                    },
                })
                return
            }

            const coordinates = getTooltipCoordinates(
                current.trigger.getBoundingClientRect(),
                current.placement,
                current.offset,
            )
            const measurementBounds = measurement.getBoundingClientRect()
            const targetWidth = measurementBounds.width
            const targetHeight = measurementBounds.height
            const isMoving = previousIdRef.current !== null && previousIdRef.current !== current.id
            previousIdRef.current = current.id

            if (shouldReduceMotion) {
                gsap.set(position, {
                    autoAlpha: 1,
                    height: targetHeight,
                    left: coordinates.left,
                    top: coordinates.top,
                    width: targetWidth,
                })
                gsap.set(surface, {
                    autoAlpha: 1,
                    filter: 'blur(0px)',
                    rotation: 0,
                    scale: 1,
                    x: 0,
                    y: 0,
                })
                if (content !== null) {
                    gsap.set(content, { autoAlpha: 1, filter: 'blur(0px)', y: 0 })
                }
                return
            }

            if (!isMoving) {
                const entryOffset = getEntryOffset(current.placement)
                gsap.set(position, {
                    autoAlpha: 1,
                    height: targetHeight,
                    left: coordinates.left,
                    top: coordinates.top,
                    width: targetWidth,
                })
                gsap.fromTo(
                    surface,
                    {
                        autoAlpha: 0,
                        filter: 'blur(4px)',
                        rotation: 0,
                        scale: 0.94,
                        x: entryOffset.x,
                        y: entryOffset.y,
                    },
                    {
                        autoAlpha: 1,
                        filter: 'blur(0px)',
                        rotation: 0,
                        scale: 1,
                        x: 0,
                        y: 0,
                        duration: 0.16,
                        ease: 'power3.out',
                    },
                )
                return
            }

            let previousAxisPosition = getAxisPosition(position, current.placement)
            let previousTime = performance.now()
            gsap.killTweensOf(position)
            gsap.killTweensOf(surface)
            gsap.set(surface, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, x: 0, y: 0 })
            gsap.to(position, {
                height: targetHeight,
                left: coordinates.left,
                top: coordinates.top,
                width: targetWidth,
                duration: travelDuration,
                ease: 'power3.out',
                onUpdate: (): void => {
                    const currentTime = performance.now()
                    const currentAxisPosition = getAxisPosition(position, current.placement)
                    const rotation = getTooltipLeanAngle(
                        currentAxisPosition - previousAxisPosition,
                        currentTime - previousTime,
                        current.placement,
                        maxTilt,
                    )
                    gsap.set(surface, { rotation })
                    previousAxisPosition = currentAxisPosition
                    previousTime = currentTime
                },
                onComplete: (): void => {
                    gsap.to(surface, {
                        rotation: 0,
                        duration: 0.2,
                        ease: 'back.out(2)',
                    })
                },
            })
            if (content !== null) {
                const swapDirection =
                    coordinates.top >= Number.parseFloat(position.style.top) ? 1 : -1
                gsap.fromTo(
                    content,
                    { autoAlpha: 0, filter: 'blur(3px)', y: swapDirection * 6 },
                    {
                        autoAlpha: 1,
                        filter: 'blur(0px)',
                        y: 0,
                        duration: 0.14,
                        ease: 'power3.out',
                    },
                )
            }
        },
        {
            dependencies: [active, maxTilt, phase, setCurrentPhase, travelDuration],
            scope: positionRef,
        },
    )

    useEffect(() => {
        if (active === null || phase === 'closed') return undefined
        let frame = 0
        const followTrigger = (): void => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame((): void => {
                const current = activeRef.current
                const position = positionRef.current
                const surface = surfaceRef.current
                if (current === null || position === null) return
                const coordinates = getTooltipCoordinates(
                    current.trigger.getBoundingClientRect(),
                    current.placement,
                    current.offset,
                )
                gsap.killTweensOf(position)
                gsap.set(position, { left: coordinates.left, top: coordinates.top })
                if (surface !== null) gsap.set(surface, { rotation: 0 })
            })
        }
        window.addEventListener('resize', followTrigger)
        window.addEventListener('scroll', followTrigger, true)
        return (): void => {
            window.cancelAnimationFrame(frame)
            window.removeEventListener('resize', followTrigger)
            window.removeEventListener('scroll', followTrigger, true)
        }
    }, [active, phase])

    const contextValue = useMemo<TooltipGroupContextValue>(
        () => ({ activeId: active?.id ?? null, hide, show, tooltipId }),
        [active?.id, hide, show, tooltipId],
    )

    const canRenderPortal = active !== null && phase !== 'closed' && typeof document !== 'undefined'

    return (
        <TooltipGroupContext.Provider value={contextValue}>
            {children}
            {canRenderPortal
                ? createPortal(
                      <>
                          <span
                              ref={measurementRef}
                              aria-hidden="true"
                              className="pointer-events-none fixed invisible left-0 top-0 -z-10 inline-flex w-max items-center whitespace-nowrap rounded-md bg-tooltip px-3 text-sm font-normal text-tooltip-text"
                              style={{ height: active.height }}
                          >
                              {active.content}
                          </span>
                          <span
                              ref={positionRef}
                              id={tooltipId}
                              role="tooltip"
                              className={
                                  active.placement === 'top'
                                      ? 'pointer-events-none invisible fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-full'
                                      : active.placement === 'right'
                                        ? 'pointer-events-none invisible fixed left-0 top-0 z-[9999] -translate-y-1/2'
                                        : active.placement === 'bottom'
                                          ? 'pointer-events-none invisible fixed left-0 top-0 z-[9999] -translate-x-1/2'
                                          : 'pointer-events-none invisible fixed left-0 top-0 z-[9999] -translate-x-full -translate-y-1/2'
                              }
                          >
                              <span
                                  ref={surfaceRef}
                                  className="absolute inset-0 flex items-center justify-center rounded-md bg-tooltip text-sm font-normal text-tooltip-text shadow-panel"
                                  style={{ transformOrigin: getTransformOrigin(active.placement) }}
                              >
                                  <span
                                      ref={contentRef}
                                      className="inline-flex items-center whitespace-nowrap px-3"
                                  >
                                      {active.content}
                                  </span>
                                  <span
                                      aria-hidden="true"
                                      className={
                                          active.placement === 'top'
                                              ? 'absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-tooltip'
                                              : active.placement === 'right'
                                                ? 'absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-r-[6px] border-y-transparent border-r-tooltip'
                                                : active.placement === 'bottom'
                                                  ? 'absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[6px] border-x-transparent border-b-tooltip'
                                                  : 'absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent border-l-tooltip'
                                      }
                                  />
                              </span>
                          </span>
                      </>,
                      document.body,
                  )
                : null}
        </TooltipGroupContext.Provider>
    )
}
