'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactElement, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { constrainMascot, isMascotDrag, mascotGreetingPosition } from '../model/mascot-position'
import type { MascotBounds, MascotPoint } from '../model/mascot-position'
import mascotAsset from '../assets/redesign/message-mascot.png'

interface HomeMascotProps {
    readonly anchorRef: RefObject<HTMLSpanElement | null>
}

interface MascotGeometry {
    readonly position: MascotPoint
    readonly bounds: MascotBounds
}

interface MascotDrag {
    readonly pointerId: number
    readonly pointerStart: MascotPoint
    readonly positionStart: MascotPoint
    moved: boolean
}

function FloatingMascot({ anchorRef }: HomeMascotProps): ReactElement {
    const safeAreaRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<MascotDrag | null>(null)
    const movedRef = useRef(false)
    const suppressClickRef = useRef(false)
    const pointerTypeRef = useRef('mouse')
    const [geometry, setGeometry] = useState<MascotGeometry | null>(null)
    const [greeting, setGreeting] = useState(false)
    const [dragging, setDragging] = useState(false)
    const greetingId = useId()

    useEffect(() => {
        const safeArea = safeAreaRef.current
        const anchor = anchorRef.current
        if (safeArea === null || anchor === null) return undefined
        const updateGeometry = (): void => {
            const bounds = safeArea.getBoundingClientRect()
            const anchorRect = anchor.getBoundingClientRect()
            setGeometry((current) => ({
                bounds,
                position: constrainMascot(
                    movedRef.current && current !== null
                        ? current.position
                        : { x: anchorRect.left, y: anchorRect.top },
                    bounds,
                ),
            }))
        }
        updateGeometry()
        const observer = new ResizeObserver(updateGeometry)
        observer.observe(safeArea)
        if (anchor.parentElement !== null) observer.observe(anchor.parentElement)
        window.addEventListener('resize', updateGeometry)
        const dismissOnOutsidePointer = (event: globalThis.PointerEvent): void => {
            if (event.target instanceof Node && !layerRef.current?.contains(event.target)) {
                setGreeting(false)
            }
        }
        document.addEventListener('pointerdown', dismissOnOutsidePointer)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', updateGeometry)
            document.removeEventListener('pointerdown', dismissOnOutsidePointer)
        }
    }, [anchorRef])

    function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
        if (!event.isPrimary || event.button !== 0 || geometry === null) return
        pointerTypeRef.current = event.pointerType
        suppressClickRef.current = false
        dragRef.current = {
            pointerId: event.pointerId,
            pointerStart: { x: event.clientX, y: event.clientY },
            positionStart: geometry.position,
            moved: false,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function handlePointerMove(event: PointerEvent<HTMLButtonElement>): void {
        const drag = dragRef.current
        if (drag === null || drag.pointerId !== event.pointerId) return
        const point = { x: event.clientX, y: event.clientY }
        if (!drag.moved && !isMascotDrag(drag.pointerStart, point)) return
        drag.moved = true
        movedRef.current = true
        setDragging(true)
        setGreeting(false)
        setGeometry((current) =>
            current === null
                ? null
                : {
                      bounds: current.bounds,
                      position: constrainMascot(
                          {
                              x: drag.positionStart.x + point.x - drag.pointerStart.x,
                              y: drag.positionStart.y + point.y - drag.pointerStart.y,
                          },
                          current.bounds,
                      ),
                  },
        )
    }

    function finishDrag(event: PointerEvent<HTMLButtonElement>): void {
        const drag = dragRef.current
        if (drag === null || drag.pointerId !== event.pointerId) return
        suppressClickRef.current = drag.moved
        dragRef.current = null
        setDragging(false)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
        if (event.key === 'Escape') {
            setGreeting(false)
            return
        }
        const movements: Readonly<Record<string, MascotPoint>> = {
            ArrowLeft: { x: -10, y: 0 },
            ArrowRight: { x: 10, y: 0 },
            ArrowUp: { x: 0, y: -10 },
            ArrowDown: { x: 0, y: 10 },
        }
        const movement = movements[event.key]
        if (movement === undefined) return
        event.preventDefault()
        movedRef.current = true
        setGeometry((current) =>
            current === null
                ? null
                : {
                      bounds: current.bounds,
                      position: constrainMascot(
                          {
                              x: current.position.x + movement.x,
                              y: current.position.y + movement.y,
                          },
                          current.bounds,
                      ),
                  },
        )
    }

    const showGreeting = greeting && !dragging
    const bubble =
        geometry === null ? null : mascotGreetingPosition(geometry.position, geometry.bounds)
    return (
        <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[55]">
            <div
                ref={safeAreaRef}
                aria-hidden="true"
                className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-[max(12px,env(safe-area-inset-left))] right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))]"
            />
            {geometry === null ? null : (
                <button
                    type="button"
                    aria-label="Mani漫奇云朵，按住拖动或使用方向键移动"
                    aria-describedby={showGreeting ? greetingId : undefined}
                    className="pointer-events-auto absolute size-[70px] cursor-pointer touch-none select-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    style={{ left: geometry.position.x, top: geometry.position.y }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishDrag}
                    onPointerCancel={finishDrag}
                    onLostPointerCapture={finishDrag}
                    onPointerEnter={(event): void => {
                        if (event.pointerType !== 'touch' && dragRef.current === null)
                            setGreeting(true)
                    }}
                    onPointerLeave={(): void => setGreeting(false)}
                    onFocus={(): void => {
                        if (dragRef.current === null) setGreeting(true)
                    }}
                    onBlur={(): void => setGreeting(false)}
                    onKeyDown={handleKeyDown}
                    onClick={(event): void => {
                        if (suppressClickRef.current) {
                            suppressClickRef.current = false
                            return
                        }
                        if (event.detail === 0 || pointerTypeRef.current === 'touch') {
                            setGreeting((visible) => !visible)
                        }
                    }}
                >
                    <img
                        src={mascotAsset.src}
                        alt=""
                        aria-hidden="true"
                        width={70}
                        height={70}
                        draggable={false}
                        className={
                            showGreeting
                                ? 'pointer-events-none size-full -translate-y-0.5 scale-105 object-contain transition-transform duration-200 ease-out motion-reduce:translate-none motion-reduce:scale-100 motion-reduce:transition-none'
                                : 'pointer-events-none size-full object-contain transition-transform duration-200 ease-out motion-reduce:transition-none'
                        }
                    />
                </button>
            )}
            {!showGreeting || bubble === null ? null : (
                <div
                    id={greetingId}
                    role="tooltip"
                    className="absolute flex h-16 flex-col items-center justify-center rounded-xl bg-tooltip px-3 text-center text-caption leading-5 text-tooltip-text shadow-panel md:text-label"
                    style={{ left: bubble.x, top: bubble.y, width: bubble.width }}
                >
                    <p className="whitespace-nowrap">你好，我是Mani漫奇，</p>
                    <p className="whitespace-nowrap">在这里见证每一位小伙伴的成长之路！</p>
                </div>
            )}
        </div>
    )
}

export function HomeMascot(props: HomeMascotProps): ReactElement | null {
    const [target, setTarget] = useState<HTMLElement | null>(null)
    useEffect(() => {
        setTarget(document.body)
    }, [])
    return target === null ? null : createPortal(<FloatingMascot {...props} />, target)
}
