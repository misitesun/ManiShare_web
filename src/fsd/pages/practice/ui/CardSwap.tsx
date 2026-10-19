'use client'

/*!
 * @license React Bits CardSwap
 * MIT + Commons Clause License Condition v1.0
 *
 * Copyright (c) 2026 David Haz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, and distribute the Software as part of an application, website, or product, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * Commons Clause Restriction
 *
 * You may use this Software, including for any commercial purpose, so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.
 *
 * The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.
 *
 * What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.
 *
 * No Warranty
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
    Children,
    forwardRef,
    isValidElement,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { useGSAP } from '../../../shared/lib/animation'
import { getMonotonicMilliseconds } from '../../../shared/lib/time'
import { createCardSwapDismissal } from '../model/card-swap-dismissal'
import {
    appendCardSwapSample,
    getCardSwapRelease,
    getCardSwapVelocity,
} from '../model/card-swap-gesture'
import type { CardSwapPointerSample } from '../model/card-swap-gesture'
import { getCardSwapSeed } from '../model/card-swap-seed'
import {
    cardSwapPresentation,
    getCardSwapMembershipIdentity,
    getCardSwapPresentationPose,
    getCardSwapRetryPresentation,
} from '../model/card-swap-presentation'
import { getCardSwapNavigation, getCardSwapOrder } from '../model/card-swap-sequence'
import type { WordPronunciationDeckController } from '../model/word-card-deck'

// Actual React Bits CardSwap component copied from the user-supplied source.
// Source SHA-256, minimal app-boundary changes and full license: ../model/card-swap-source.md.

interface CardSwapProps {
    readonly children: ReactNode
    readonly index: number
    readonly blocked: boolean
    readonly isBlocked: () => boolean
    readonly allowFinish?: boolean
    readonly onChange: (index: number) => void
    readonly onFinish: () => void
    readonly onDragStart: () => void
    readonly onBusyChange: (busy: boolean) => void
}

type Axis = 'x' | 'y' | 'z' | 'r' | 'p' | 'sx' | 'sy'
interface Vec {
    x: number
    y: number
}
type Pose = Record<Axis, number>

interface Bounds {
    width: number
    height: number
    originX: number
    originY: number
}

interface Settings {
    keys: readonly string[]
    width: number
    height: number
    dx: number
    dy: number
    dz: number
    skew: number
    visible: number
    delay: number
    autoplay: boolean
    pauseOnHover: boolean
    draggable: boolean
    speed: number
    bounce: number
    parallax: number
    hoverSpread: number
    dim: number
    bounds: Bounds
    index: number
    blocked: boolean
    isBlocked: () => boolean
    allowFinish: boolean
    onChange: (index: number) => void
    onFinish: () => void
    onDragStart: () => void
    onBusyChange: (busy: boolean) => void
    onCardClick?: (index: number) => void
}

interface DeckCard extends Pose {
    key: string
    el: HTMLDivElement | null
    shade: HTMLSpanElement | null
    index: number
    pos: number
    from: number
    hold: number
    nudge: number
    phase: 'rest' | 'exit' | 'enter' | 'drag' | 'restore' | 'gone'
    dir: Vec
    tilt: number
    top: number
    under: boolean
    v: Pose
}

interface DragState {
    id: number
    index: number
    startX: number
    startY: number
    active: boolean
    samples: CardSwapPointerSample[]
}

interface EngineState {
    order: number[]
    raf: number
    last: number
    timer: number
    queue: number[]
    layers: number
    scale: number
    hovered: boolean
    overCard: boolean
    inView: boolean
    drag: DragState | null
    spread: number
    spreadV: number
    px: number
    py: number
    pvx: number
    pvy: number
    tx: number
    ty: number
    dragged: boolean
    autoplay: boolean
    delay: number
    finishing: boolean
}

interface ShiftOptions {
    dir?: Vec
    tilt?: number
    velocity?: Vec
}

interface SwapApi {
    next: () => boolean
    prev: () => boolean
    dismiss: (onComplete: () => void, onCancel?: () => void) => boolean
    requeue: (onComplete: () => void, onCancel?: () => void) => boolean
    cancel: () => void
    reset: () => void
    isBusy: () => boolean
    interruptDrag: () => boolean
    refresh: () => void
}

const TAU = Math.PI * 2
const STEP = 1 / 240
const AXES: Axis[] = ['x', 'y', 'z', 'r', 'p', 'sx', 'sy']
const DOWN: Vec = { x: 0, y: 1 }
const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

const CardSwap = forwardRef<WordPronunciationDeckController, CardSwapProps>(function CardSwap(
    {
        children,
        index,
        blocked: disabled,
        isBlocked,
        allowFinish = true,
        onChange,
        onFinish,
        onDragStart,
        onBusyChange,
    },
    ref,
): ReactElement {
    const rootRef = useRef<HTMLDivElement>(null)
    const slotRefs = useRef(new Map<string, HTMLDivElement | null>())
    const shadeRefs = useRef(new Map<string, HTMLSpanElement | null>())
    const apiRef = useRef<SwapApi | null>(null)
    const geometryRef = useRef({ width: 500, height: 500 })
    const cards = useMemo(
        (): ReactElement[] => Children.toArray(children).filter(isValidElement),
        [children],
    )
    const count = cards.length
    const keys = cards.map((card, at): string => card.key ?? String(at))
    const cardIdentity = getCardSwapMembershipIdentity(keys)
    const membership = useRef({ identity: cardIdentity, keys })
    if (membership.current.identity !== cardIdentity)
        membership.current = { identity: cardIdentity, keys }
    const physicalKeys = membership.current.keys
    const seedRef = useRef({ identity: cardIdentity, index })
    seedRef.current = getCardSwapSeed(seedRef.current, cardIdentity, index)
    const seedIndex = seedRef.current.index
    const settings: Settings = {
        keys,
        ...geometryRef.current,
        dx: cardSwapPresentation.distance,
        dy: cardSwapPresentation.verticalDistance,
        dz: cardSwapPresentation.depth,
        skew: 0,
        visible: cardSwapPresentation.visible,
        delay: 3500,
        autoplay: false,
        pauseOnHover: true,
        draggable: true,
        speed: 1,
        bounce: 0.35,
        parallax: cardSwapPresentation.parallax,
        hoverSpread: cardSwapPresentation.hoverSpread,
        dim: 0,
        bounds: {
            ...geometryRef.current,
            originX: geometryRef.current.width / 2,
            originY: geometryRef.current.height / 2,
        },
        index,
        blocked: disabled,
        isBlocked,
        allowFinish,
        onChange,
        onFinish,
        onDragStart,
        onBusyChange,
    }
    const settingsRef = useRef(settings)
    settingsRef.current = settings
    const initialStyles = useMemo(
        (): Map<string, CSSProperties> =>
            getCardSwapOrder(seedIndex, physicalKeys.length).reduce<Map<string, CSSProperties>>(
                (result, id, position): Map<string, CSSProperties> => {
                    const key = physicalKeys[id]
                    if (key === undefined) return result
                    const pose = getCardSwapPresentationPose(position, 0)
                    result.set(key, {
                        transform:
                            position < cardSwapPresentation.visible && id >= seedIndex
                                ? `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px)`
                                : 'none',
                        transformOrigin: 'center center',
                        zIndex: 10 + (count - position) * 2,
                        opacity: id >= seedIndex && position < cardSwapPresentation.visible ? 1 : 0,
                        visibility:
                            id >= seedIndex && position < cardSwapPresentation.visible
                                ? 'visible'
                                : 'hidden',
                    })
                    return result
                },
                new Map(),
            ),
        [physicalKeys, count, seedIndex],
    )
    useImperativeHandle(
        ref,
        (): WordPronunciationDeckController => ({
            next: (): boolean => apiRef.current?.next() ?? false,
            previous: (): boolean => apiRef.current?.prev() ?? false,
            dismiss: (onComplete, onCancel): boolean =>
                apiRef.current?.dismiss(onComplete, onCancel) ?? false,
            requeue: (onComplete, onCancel): boolean =>
                apiRef.current?.requeue(onComplete, onCancel) ?? false,
            cancel: (): void => apiRef.current?.cancel(),
            reset: (): void => apiRef.current?.reset(),
            isBusy: (): boolean => apiRef.current?.isBusy() ?? false,
            interruptDrag: (): boolean => apiRef.current?.interruptDrag() ?? false,
        }),
        [],
    )
    useGSAP(
        (): (() => void) | undefined => {
            const rootElement = rootRef.current
            const stageElement = rootRef.current
            if (!rootElement || !stageElement || !count) return undefined
            const root = rootElement
            const stage = stageElement
            const media = window.matchMedia('(prefers-reduced-motion: reduce)')
            let reduce = media.matches
            let disposed = false
            const s0 = settingsRef.current

            const deck = Array.from({ length: count }, (_, index): DeckCard => ({
                key: s0.keys[index] ?? String(index),
                el: slotRefs.current.get(s0.keys[index] ?? String(index)) ?? null,
                shade: shadeRefs.current.get(s0.keys[index] ?? String(index)) ?? null,
                index,
                pos: index,
                from: index,
                hold: 0,
                nudge: 0,
                phase: 'rest',
                dir: { x: 0, y: 1 },
                tilt: 0,
                top: 0,
                under: false,
                x: 0,
                y: 0,
                z: 0,
                r: 0,
                p: 0,
                sx: 1,
                sy: 1,
                v: { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 },
            }))
            const state: EngineState = {
                order: deck.map((card) => card.index),
                raf: 0,
                last: 0,
                timer: 0,
                queue: [],
                layers: 0,
                scale: 1,
                hovered: false,
                overCard: false,
                inView: true,
                drag: null,
                spread: 0,
                spreadV: 0,
                px: 0,
                py: 0,
                pvx: 0,
                pvy: 0,
                tx: 0,
                ty: 0,
                dragged: false,
                autoplay: s0.autoplay,
                delay: s0.delay,
                finishing: false,
            }
            const dismissal = createCardSwapDismissal()
            let requeueIndex: number | null = null
            let returnedTail: number | null = null

            const slot = (position: number, s: Settings): Pose => {
                const q = Math.min(position, s.visible)
                return { ...getCardSwapPresentationPose(q, state.spread) }
            }
            const logicalIndex = (physical: number): number =>
                settingsRef.current.keys.indexOf(deck[physical]?.key ?? '')
            const physicalIndex = (logical: number): number =>
                deck.findIndex((card) => card.key === settingsRef.current.keys[logical])
            const logicalOrder = (): number[] =>
                settingsRef.current.keys.map((key): number =>
                    deck.findIndex((card) => card.key === key),
                )
            const canonicalOrder = (at: number): number[] =>
                getCardSwapOrder(at, count).map(physicalIndex)
            const clearance = (s: Settings, dir: Vec): number =>
                Math.abs(dir.x) * s.width + Math.abs(dir.y) * s.height + 12
            const currentIndex = (): number => state.order[0] ?? 0
            const blocked = (): boolean =>
                settingsRef.current.blocked || settingsRef.current.isBlocked()
            const setPhase = (phase: string): void => {
                root.dataset.wordDeckState = phase
            }
            const notifyBusy = (): void =>
                settingsRef.current.onBusyChange(
                    Boolean(state.drag?.active || state.finishing || dismissal.pending()),
                )
            const targetOf = (card: DeckCard, s: Settings, time: number): Pose => {
                if (card.phase === 'exit' || card.phase === 'gone') {
                    const base = slot(0, s)
                    const reach = clearance(s, card.dir) * 1.3
                    return {
                        x: base.x + card.dir.x * reach,
                        y: base.y + card.dir.y * reach,
                        z: base.z,
                        r: card.tilt,
                        p: card.phase === 'gone' ? s.visible : 0,
                        sx: 1,
                        sy: 1,
                    }
                }
                if (card.phase === 'restore') return slot(0, s)
                if (card.phase === 'enter') {
                    const base = slot(0, s)
                    return {
                        x: base.x,
                        y: base.y + clearance(s, DOWN) * 1.3,
                        z: base.z,
                        r: 0,
                        p: card.p,
                        sx: 1,
                        sy: 1,
                    }
                }
                const position = (time < card.hold ? card.from : card.pos) + card.nudge
                return slot(Math.max(0, position), s)
            }

            const layerOf = (card: DeckCard): number => {
                if (card.top) return 1000 + card.top
                if (card.under) return 1
                return 10 + (count - card.pos) * 2
            }

            const write = (card: DeckCard, s: Settings): void => {
                const { el, shade } = card
                if (!el) return
                el.style.zIndex = String(layerOf(card))
                const available =
                    (card.pos < s.visible &&
                        logicalIndex(card.index) >= logicalIndex(currentIndex())) ||
                    card.phase === 'exit' ||
                    card.phase === 'gone' ||
                    card.index === requeueIndex ||
                    card.index === returnedTail
                const fade = available ? clamp(s.visible - card.p, 0, 1) : 0
                el.style.transform =
                    fade <= 0.001
                        ? 'none'
                        : `translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, ${card.z.toFixed(2)}px) rotate(${card.r.toFixed(3)}deg) skewY(${s.skew}deg)`
                el.style.opacity = fade < 1 ? fade.toFixed(3) : ''
                el.style.visibility = fade <= 0.001 ? 'hidden' : ''
                if (shade) {
                    const depthT = clamp(card.p / Math.max(1, s.visible - 1), 0, 1)
                    shade.style.opacity = (s.dim * 0.62 * depthT).toFixed(3)
                }
                el.style.cursor =
                    card.phase === 'drag'
                        ? 'grabbing'
                        : card.pos === 0 && !blocked() && dismissal.pending() === null
                          ? 'grab'
                          : 'default'
                const active = card.index === currentIndex()
                const inert =
                    dismissal.pending() !== null ||
                    !active ||
                    blocked() ||
                    card.phase === 'exit' ||
                    card.phase === 'restore'
                if (el.inert !== inert) el.inert = inert
                if (el.getAttribute('aria-hidden') !== String(!active))
                    el.setAttribute('aria-hidden', String(!active))
                const near = available && card.pos === 1 && card.phase === 'rest'
                const far = available && card.pos === 2 && card.phase === 'rest'
                const markers: readonly [string, boolean][] = [
                    ['data-word-deck-front', active],
                    ['data-word-deck-next', near],
                    ['data-word-deck-third', far],
                    ['data-word-deck-fourth', available && card.pos === 3 && card.phase === 'rest'],
                    ['data-word-deck-previous', card.phase === 'restore'],
                    ['data-card-swap-exiting', card.phase === 'exit' || card.phase === 'gone'],
                ]
                for (const [name, present] of markers)
                    if (el.hasAttribute(name) !== present) el.toggleAttribute(name, present)
                const depth = near ? 'near' : far ? 'far' : null
                if (el.getAttribute('data-word-card-back') !== depth) {
                    if (depth === null) el.removeAttribute('data-word-card-back')
                    else el.setAttribute('data-word-card-back', depth)
                }
            }

            const writeStage = (s: Settings): void => {
                const ox = s.bounds.originX + state.px
                const oy = s.bounds.originY + state.py
                stage.style.perspectiveOrigin = `${ox.toFixed(2)}px ${oy.toFixed(2)}px`
            }

            const integrate = (
                card: DeckCard,
                target: Pose,
                omega: number,
                zeta: number,
                dt: number,
            ): void => {
                const k = omega * omega
                const d = 2 * zeta * omega
                const steps = Math.max(1, Math.ceil(dt / STEP))
                const h = dt / steps
                for (let i = 0; i < steps; i++) {
                    for (const axis of AXES) {
                        const velocity =
                            card.v[axis] + (k * (target[axis] - card[axis]) - d * card.v[axis]) * h
                        card.v[axis] = velocity
                        card[axis] += velocity * h
                    }
                }
            }

            const scalar = (
                value: number,
                velocity: number,
                target: number,
                omega: number,
                zeta: number,
                dt: number,
            ): [number, number] => {
                const k = omega * omega
                const d = 2 * zeta * omega
                const steps = Math.max(1, Math.ceil(dt / STEP))
                const h = dt / steps
                let x = value
                let v = velocity
                for (let i = 0; i < steps; i++) {
                    v += (k * (target - x) - d * v) * h
                    x += v * h
                }
                return [x, v]
            }

            const frame = (time: number): void => {
                if (disposed) return
                if (blocked()) {
                    cancel()
                    return
                }
                state.raf = 0
                const s = settingsRef.current
                const dt = state.last ? Math.min(0.05, (time - state.last) / 1000) : 1 / 60
                state.last = time
                const speed = s.speed
                const restOmega = TAU * 1.7 * speed
                const restZeta = reduce ? 1 : 1 - 0.72 * s.bounce
                const exitOmega = TAU * 1.9 * speed
                let busy = false

                const spreadTarget = state.hovered && !reduce ? s.hoverSpread : 0
                ;[state.spread, state.spreadV] = scalar(
                    state.spread,
                    state.spreadV,
                    spreadTarget,
                    TAU * 1.4,
                    0.9,
                    dt,
                )
                ;[state.px, state.pvx] = scalar(
                    state.px,
                    state.pvx,
                    reduce ? 0 : state.tx,
                    TAU * 1.1,
                    1,
                    dt,
                )
                ;[state.py, state.pvy] = scalar(
                    state.py,
                    state.pvy,
                    reduce ? 0 : state.ty,
                    TAU * 1.1,
                    1,
                    dt,
                )
                if (
                    Math.abs(state.spread - spreadTarget) > 0.0005 ||
                    Math.abs(state.spreadV) > 0.0005 ||
                    Math.abs(state.px - state.tx) > 0.05 ||
                    Math.abs(state.py - state.ty) > 0.05 ||
                    Math.abs(state.pvx) + Math.abs(state.pvy) > 0.05
                ) {
                    busy = true
                }
                writeStage(s)

                for (const card of deck) {
                    if (
                        logicalIndex(card.index) < logicalIndex(currentIndex()) &&
                        card.phase === 'rest' &&
                        card.index !== requeueIndex
                    ) {
                        write(card, s)
                        continue
                    }
                    if (card.phase === 'drag') {
                        busy = true
                        write(card, s)
                        continue
                    }
                    const target = targetOf(card, s, time)
                    const moving =
                        card.phase === 'exit' || card.phase === 'enter' || card.phase === 'restore'
                    integrate(
                        card,
                        target,
                        moving ? exitOmega : restOmega,
                        moving ? 1 : restZeta,
                        dt,
                    )
                    if (card.phase === 'exit') {
                        const base = slot(0, s)
                        const travelled =
                            (card.x - base.x) * card.dir.x + (card.y - base.y) * card.dir.y
                        if (travelled >= clearance(s, card.dir)) {
                            // 原组件正向轮转：下落清出前卡后降层，沿原弹簧回到尾槽。
                            card.phase = card.index === requeueIndex ? 'rest' : 'gone'
                            card.top = 0
                            card.hold = 0
                        }
                    } else if (card.phase === 'gone') {
                        if (card.p >= s.visible - 0.001) {
                            if (finishDismiss(card.index)) return
                            card.phase = 'rest'
                            if (state.finishing && card.index === currentIndex()) {
                                state.finishing = false
                                notifyBusy()
                                settingsRef.current.onFinish()
                                return
                            }
                        }
                    } else if (card.phase === 'restore') {
                        if (
                            Math.hypot(card.x, card.y) < 0.1 &&
                            Math.hypot(card.v.x, card.v.y) < 0.5
                        )
                            card.phase = 'rest'
                    } else if (card.phase === 'enter') {
                        const base = slot(0, s)
                        if (card.y - base.y >= clearance(s, DOWN)) {
                            card.phase = 'rest'
                            card.under = false
                            card.hold = 0
                        }
                    }
                    if (card.hold > time || card.phase !== 'rest') busy = true
                    let settled = true
                    for (const axis of AXES) {
                        const limit = axis === 'p' || axis === 'sx' || axis === 'sy' ? 0.001 : 0.02
                        if (
                            Math.abs(target[axis] - card[axis]) > limit ||
                            Math.abs(card.v[axis]) > limit
                        ) {
                            busy = true
                            settled = false
                        }
                    }
                    write(card, s)
                    if (card.index === requeueIndex && card.phase === 'rest' && settled) {
                        if (finishDismiss(card.index)) return
                    }
                }

                if (busy) {
                    state.raf = requestAnimationFrame(frame)
                } else {
                    state.last = 0
                    setPhase('idle')
                    for (const card of deck) {
                        if (card.top && card.phase === 'rest') card.top = 0
                    }
                }
            }

            const wake = (): void => {
                if (!disposed && !state.raf) state.raf = requestAnimationFrame(frame)
            }

            const paused = (): boolean => {
                const s = settingsRef.current
                return (
                    !s.autoplay ||
                    count < 2 ||
                    (s.pauseOnHover && state.overCard) ||
                    Boolean(state.drag) ||
                    !state.inView ||
                    document.visibilityState === 'hidden'
                )
            }

            const schedule = (): void => {
                clearTimeout(state.timer)
                state.timer = 0
                if (paused()) return
                state.timer = window.setTimeout(
                    () => {
                        state.timer = 0
                        shift(1)
                    },
                    Math.max(400, settingsRef.current.delay),
                )
            }

            const settleOrder = (time: number, stagger: number): void => {
                state.order.forEach((index, position) => {
                    const card = deck[index]
                    if (!card || card.pos === position) return
                    card.from = card.pos
                    card.pos = position
                    card.hold = time + Math.max(0, position) * stagger
                })
            }

            const shift = (direction: number, options: ShiftOptions = {}): boolean => {
                if (blocked() || state.finishing || dismissal.pending() || state.drag) return false
                const s = settingsRef.current
                const step = getCardSwapNavigation(
                    logicalIndex(currentIndex()),
                    count,
                    direction > 0 ? 'next' : 'previous',
                )
                if (step.kind === 'none') return false
                if (step.kind === 'finish' && !s.allowFinish) return false
                returnedTail = null
                const time = getMonotonicMilliseconds()
                const stagger = 0.05 / s.speed
                s.onDragStart()
                if (direction > 0) {
                    const front = deck[currentIndex()]
                    if (!front) return false
                    if (step.kind === 'move') state.order = canonicalOrder(step.index)
                    else state.finishing = true
                    settleOrder(time, stagger * 1000)
                    front.phase = 'exit'
                    front.dir = options.dir ?? { x: 1, y: 0 }
                    front.tilt = options.tilt ?? 0
                    front.top = ++state.layers
                    front.under = false
                    front.nudge = 0
                    front.hold = 0
                    if (options.velocity) {
                        front.v.x = options.velocity.x
                        front.v.y = options.velocity.y
                    }
                } else {
                    const previousIndex =
                        step.kind === 'move' ? physicalIndex(step.index) : undefined
                    const back = previousIndex === undefined ? undefined : deck[previousIndex]
                    if (!back) return false
                    const alreadyExiting = back.phase === 'exit'
                    state.order = canonicalOrder(step.kind === 'move' ? step.index : 0)
                    settleOrder(time, stagger * 1000)
                    if (!alreadyExiting) {
                        const reach = clearance(s, back.dir) * 1.3
                        Object.assign(back, slot(0, s), {
                            x: back.dir.x * reach,
                            y: back.dir.y * reach,
                            r: back.tilt,
                        })
                        back.v = { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 }
                    }
                    back.phase = 'restore'
                    back.top = ++state.layers
                    back.under = false
                    back.nudge = 0
                    back.hold = 0
                }
                deck.forEach((card) => {
                    if (card.phase === 'rest') card.nudge = 0
                })
                notifyBusy()
                setPhase(direction > 0 ? 'next' : 'previous')
                deck.forEach((card) => write(card, s))
                if (step.kind === 'move') s.onChange(step.index)
                if (reduce) {
                    if (step.kind === 'finish') {
                        state.finishing = false
                        s.onFinish()
                    }
                    cancel()
                } else wake()
                schedule()
                return true
            }

            const finishDismiss = (index: number): boolean => {
                const complete = dismissal.take(index)
                if (complete === null) return false
                const restoreTail = requeueIndex === index
                requeueIndex = null
                cancelAnimationFrame(state.raf)
                state.raf = 0
                const card = deck[index]
                if (card) {
                    const s = settingsRef.current
                    card.phase = restoreTail ? 'rest' : 'gone'
                    if (restoreTail) {
                        Object.assign(card, slot(card.pos, s))
                        card.v = { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 }
                        card.from = card.pos
                        card.hold = 0
                        card.nudge = 0
                        card.under = false
                    } else card.p = s.visible
                    card.top = 0
                    write(card, s)
                }
                if (restoreTail) for (const item of deck) write(item, settingsRef.current)
                state.last = 0
                setPhase('idle')
                notifyBusy()
                if (!disposed && !blocked() && !document.hidden) complete()
                return true
            }

            const finishReducedDismiss = (): void => {
                const pending = dismissal.pending()
                if (pending === null) return
                const s = settingsRef.current
                for (const card of deck) {
                    Object.assign(card, slot(card.pos, s))
                    card.v = { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 }
                    write(card, s)
                }
                finishDismiss(pending.index)
            }

            const exitCurrent = (
                onComplete: () => void,
                onCancel: (() => void) | undefined,
                requeue: boolean,
            ): boolean => {
                if (blocked() || document.hidden || state.finishing || dismissal.pending())
                    return false
                const index = currentIndex()
                const front = deck[index]
                if (!front) return false
                if (requeue && count <= 1) return false
                interruptDrag()
                if (!dismissal.begin(index, onComplete, onCancel)) return false
                requeueIndex = requeue ? index : null
                returnedTail = requeue ? index : null
                const s = settingsRef.current
                s.onDragStart()
                if (requeue || logicalIndex(index) < count - 1) {
                    state.order = requeue
                        ? getCardSwapRetryPresentation(state.order, logicalOrder(), index)
                        : canonicalOrder(logicalIndex(index) + 1)
                    settleOrder(getMonotonicMilliseconds(), 50 / s.speed)
                }
                front.phase = 'exit'
                front.dir = requeue ? DOWN : { x: 0, y: -1 }
                front.tilt = 0
                front.top = ++state.layers
                front.under = false
                front.nudge = 0
                front.hold = 0
                setPhase(requeue ? 'requeue' : 'dismiss')
                notifyBusy()
                for (const card of deck) write(card, s)
                if (reduce) finishReducedDismiss()
                else wake()
                schedule()
                return true
            }
            const dismiss = (onComplete: () => void, onCancel?: () => void): boolean =>
                exitCurrent(onComplete, onCancel, false)
            const requeue = (onComplete: () => void, onCancel?: () => void): boolean =>
                exitCurrent(onComplete, onCancel, true)

            const fit = (): void => {
                const s = settingsRef.current
                const width = root.clientWidth || 500
                const height = root.clientHeight || 500
                const changed = width !== s.width || height !== s.height
                geometryRef.current = { width, height }
                s.width = width
                s.height = height
                s.bounds = { width, height, originX: width / 2, originY: height / 2 }
                state.scale = 1
                if (changed) cancel()
            }

            const local = (event: PointerEvent): { x: number; y: number; w: number; h: number } => {
                const box = root.getBoundingClientRect()
                return {
                    x: event.clientX - box.left,
                    y: event.clientY - box.top,
                    w: box.width,
                    h: box.height,
                }
            }

            const onMove = (event: PointerEvent): void => {
                if (blocked()) {
                    cancel()
                    return
                }
                const s = settingsRef.current
                if (event.pointerType !== 'touch' && !reduce) {
                    const point = local(event)
                    const nx = clamp((point.x / Math.max(1, point.w)) * 2 - 1, -1, 1)
                    const ny = clamp((point.y / Math.max(1, point.h)) * 2 - 1, -1, 1)
                    state.tx = nx * s.parallax * 0.35 * s.bounds.width
                    state.ty = ny * s.parallax * 0.35 * s.bounds.height
                    state.hovered = true
                    const overCard = Boolean(
                        event.target instanceof Element
                            ? event.target.closest('[data-swap-index]')
                            : null,
                    )
                    if (overCard !== state.overCard) {
                        state.overCard = overCard
                        schedule()
                    }
                    wake()
                }
                const drag = state.drag
                if (!drag || drag.id !== event.pointerId) return
                const dx = (event.clientX - drag.startX) / state.scale
                const dy = (event.clientY - drag.startY) / state.scale
                if (!drag.active) {
                    if (Math.hypot(dx, dy) < 5) return
                    drag.active = true
                    setPhase('dragging')
                    notifyBusy()
                    s.onDragStart()
                    state.dragged = true
                    const card = deck[drag.index]
                    if (!card) return
                    card.phase = 'drag'
                    card.v = { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 }
                    root.setPointerCapture?.(event.pointerId)
                    root.style.cursor = 'grabbing'
                }
                const card = deck[drag.index]
                if (!card) return
                const base = slot(0, s)
                card.x = base.x + dx
                card.y = base.y + dy
                card.z = base.z
                card.sx = base.sx
                card.sy = base.sy
                card.r = clamp(dx * 0.035, -9, 9)
                card.p = 0
                const history = event.getCoalescedEvents?.() ?? []
                for (const point of [...history, event]) {
                    drag.samples = appendCardSwapSample(drag.samples, {
                        x: (point.clientX - drag.startX) / state.scale,
                        y: (point.clientY - drag.startY) / state.scale,
                        t: point.timeStamp,
                    })
                }
                const progress = clamp(
                    Math.hypot(dx, dy) / (Math.min(s.width, s.height) * 0.3),
                    0,
                    1,
                )
                const nextIndex = state.order[1]
                const next = nextIndex === undefined ? undefined : deck[nextIndex]
                if (next && next.phase === 'rest') next.nudge = -0.22 * progress
                wake()
            }

            const onLeave = (event: PointerEvent): void => {
                if (event.pointerType === 'touch') return
                if (state.drag?.active) return
                state.hovered = false
                state.overCard = false
                state.tx = 0
                state.ty = 0
                schedule()
                wake()
            }

            const onDown = (event: PointerEvent): void => {
                const s = settingsRef.current
                state.dragged = false
                if (
                    blocked() ||
                    state.finishing ||
                    dismissal.pending() !== null ||
                    !event.isPrimary ||
                    !s.draggable ||
                    event.button > 0
                )
                    return
                if (
                    event.target instanceof Element &&
                    event.target.closest(
                        'button, a, input, textarea, select, [contenteditable="true"]',
                    )
                )
                    return
                const target =
                    event.target instanceof Element
                        ? event.target.closest('[data-swap-index]')
                        : null
                if (!target || !root.contains(target)) return
                const index = physicalIndex(Number(target.getAttribute('data-swap-index')))
                if (index !== currentIndex() || deck[index]?.phase !== 'rest') return
                state.drag = {
                    id: event.pointerId,
                    index,
                    startX: event.clientX,
                    startY: event.clientY,
                    active: false,
                    samples: [{ x: 0, y: 0, t: event.timeStamp }],
                }
                schedule()
            }

            const onUp = (event: PointerEvent): void => {
                const drag = state.drag
                if (!drag || drag.id !== event.pointerId) return
                state.drag = null
                notifyBusy()
                root.style.cursor = ''
                const finalOffset = {
                    x: (event.clientX - drag.startX) / state.scale,
                    y: (event.clientY - drag.startY) / state.scale,
                }
                if (
                    !drag.active &&
                    (event.type === 'pointercancel' || Math.hypot(finalOffset.x, finalOffset.y) < 5)
                ) {
                    schedule()
                    return
                }
                if (root.hasPointerCapture(event.pointerId))
                    root.releasePointerCapture(event.pointerId)
                const s = settingsRef.current
                const card = deck[drag.index]
                if (!card) return
                const base = slot(0, s)
                if (event.type !== 'pointercancel') {
                    if (!drag.active) {
                        state.dragged = true
                        s.onDragStart()
                    }
                    card.x = base.x + finalOffset.x
                    card.y = base.y + finalOffset.y
                    card.r = clamp(finalOffset.x * 0.035, -9, 9)
                    drag.samples = appendCardSwapSample(drag.samples, {
                        ...finalOffset,
                        t: event.timeStamp,
                    })
                }
                const velocity = getCardSwapVelocity(drag.samples)
                const offset = { x: card.x - base.x, y: card.y - base.y }
                const nextIndex = state.order[1]
                const next = nextIndex === undefined ? undefined : deck[nextIndex]
                if (next) next.nudge = 0
                const release = getCardSwapRelease(
                    offset,
                    velocity,
                    s.width,
                    s.height,
                    event.type === 'pointercancel',
                )
                if (release.advance) {
                    card.phase = 'rest'
                    if (
                        shift(1, {
                            dir: release.direction,
                            tilt: card.r,
                            velocity,
                        })
                    )
                        return
                }
                card.phase = 'rest'
                setPhase('returning')
                card.v.x = velocity.x
                card.v.y = velocity.y
                wake()
                schedule()
            }

            const onClick = (event: MouseEvent): void => {
                if (state.dragged) {
                    state.dragged = false
                    event.preventDefault()
                    event.stopPropagation()
                    return
                }
                const target =
                    event.target instanceof Element
                        ? event.target.closest('[data-swap-index]')
                        : null
                if (!target || !root.contains(target)) return
                const index = Number(target.getAttribute('data-swap-index'))
                settingsRef.current.onCardClick?.(index)
            }

            const snap = (index: number): void => {
                cancelAnimationFrame(state.raf)
                state.raf = 0
                state.last = 0
                clearTimeout(state.timer)
                state.timer = 0
                const drag = state.drag
                state.drag = null
                const onCancel = dismissal.cancel()
                requeueIndex = null
                returnedTail = null
                if (drag && root.hasPointerCapture(drag.id)) root.releasePointerCapture(drag.id)
                state.order = canonicalOrder(index)
                state.finishing = false
                state.dragged = false
                state.order.forEach((id, position) => {
                    const card = deck[id]
                    if (!card) return
                    card.pos = position
                    card.from = position
                    card.hold = 0
                    card.nudge = 0
                    card.phase = 'rest'
                    card.top = 0
                    card.under = false
                    Object.assign(card, slot(position, settingsRef.current))
                    card.v = { x: 0, y: 0, z: 0, r: 0, p: 0, sx: 0, sy: 0 }
                    write(card, settingsRef.current)
                })
                setPhase('idle')
                notifyBusy()
                onCancel?.()
            }
            const cancel = (): void =>
                snap(logicalIndex(dismissal.pending()?.index ?? currentIndex()))
            const onVisibility = (): void => {
                if (document.hidden) cancel()
                schedule()
            }
            const onReducedChange = (): void => {
                reduce = media.matches
                if (reduce) {
                    state.hovered = false
                    state.spread = state.spreadV = 0
                    state.px = state.py = state.pvx = state.pvy = 0
                    state.tx = state.ty = 0
                    writeStage(settingsRef.current)
                    if (dismissal.pending()) {
                        if (blocked() || document.hidden) cancel()
                        else finishReducedDismiss()
                        return
                    }
                    const finishing = state.finishing
                    cancel()
                    if (finishing && !blocked()) settingsRef.current.onFinish()
                }
            }
            const onLostPointerCapture = (event: PointerEvent): void => {
                // 触屏先由命中的图片隐式捕获；转交root会冒泡图片的lost事件，不是拖动中断。
                if (
                    event.target === root &&
                    state.drag?.id === event.pointerId &&
                    !root.hasPointerCapture(event.pointerId)
                )
                    interruptDrag()
            }

            const interruptDrag = (): boolean => {
                const drag = state.drag
                if (!drag) return false
                state.drag = null
                if (root.hasPointerCapture(drag.id)) root.releasePointerCapture(drag.id)
                root.style.cursor = ''
                const card = deck[drag.index]
                if (card?.phase === 'drag') card.phase = 'rest'
                deck.forEach((item) => {
                    if (item.phase === 'rest') item.nudge = 0
                })
                notifyBusy()
                setPhase('returning')
                wake()
                schedule()
                return true
            }

            apiRef.current = {
                next: (): boolean => shift(1),
                prev: (): boolean => shift(-1),
                dismiss,
                requeue,
                cancel,
                reset: (): void => snap(0),
                isBusy: (): boolean =>
                    Boolean(state.drag || state.finishing || dismissal.pending()),
                interruptDrag,
                refresh: (): void => {
                    if (blocked()) cancel()
                    const expectedIndex = logicalIndex(dismissal.pending()?.index ?? currentIndex())
                    if (settingsRef.current.index !== expectedIndex) snap(settingsRef.current.index)
                    const s = settingsRef.current
                    deck.forEach((card) => {
                        const el = slotRefs.current.get(card.key) ?? null
                        const shade = shadeRefs.current.get(card.key) ?? null
                        if (el === card.el && shade === card.shade) return
                        card.el = el
                        card.shade = shade
                        write(card, s)
                    })
                    if (s.autoplay !== state.autoplay || s.delay !== state.delay) {
                        state.autoplay = s.autoplay
                        state.delay = s.delay
                        schedule()
                    }
                    fit()
                    wake()
                },
            }

            snap(settingsRef.current.index)
            fit()
            writeStage(s0)
            deck.forEach((card) => write(card, s0))

            const resizeObserver = new ResizeObserver(fit)
            resizeObserver.observe(root)
            const intersectionObserver = new IntersectionObserver((entries) => {
                state.inView = entries[entries.length - 1]?.isIntersecting ?? true
                schedule()
            })
            intersectionObserver.observe(root)
            root.addEventListener('pointermove', onMove)
            root.addEventListener('pointerleave', onLeave)
            root.addEventListener('pointerdown', onDown)
            root.addEventListener('pointerup', onUp)
            root.addEventListener('pointercancel', onUp)
            root.addEventListener('click', onClick, true)
            root.addEventListener('lostpointercapture', onLostPointerCapture)
            media.addEventListener('change', onReducedChange)
            document.addEventListener('visibilitychange', onVisibility)
            schedule()

            return (): void => {
                disposed = true
                const wasDismissing = dismissal.pending() !== null
                dismissal.cancel()
                requeueIndex = null
                cancelAnimationFrame(state.raf)
                clearTimeout(state.timer)
                state.queue.forEach(clearTimeout)
                resizeObserver.disconnect()
                intersectionObserver.disconnect()
                root.removeEventListener('pointermove', onMove)
                root.removeEventListener('pointerleave', onLeave)
                root.removeEventListener('pointerdown', onDown)
                root.removeEventListener('pointerup', onUp)
                root.removeEventListener('pointercancel', onUp)
                root.removeEventListener('click', onClick, true)
                root.removeEventListener('lostpointercapture', onLostPointerCapture)
                media.removeEventListener('change', onReducedChange)
                const drag = state.drag
                state.drag = null
                if (drag && root.hasPointerCapture(drag.id)) root.releasePointerCapture(drag.id)
                document.removeEventListener('visibilitychange', onVisibility)
                apiRef.current = null
                if (wasDismissing) settingsRef.current.onBusyChange(false)
            }
        },
        { scope: rootRef, dependencies: [count, cardIdentity], revertOnUpdate: true },
    )

    useEffect((): void => {
        apiRef.current?.refresh()
    })
    return (
        <div
            ref={rootRef}
            data-card-swap
            data-word-deck-stage
            data-word-deck-state="idle"
            className="relative isolate grid min-w-0"
            style={{ perspective: cardSwapPresentation.perspective }}
            role="group"
            aria-label="单词拼读卡片堆"
        >
            {cards.map((card, cardIndex) => (
                <div
                    key={card.key}
                    ref={(node): void => {
                        slotRefs.current.set(card.key ?? String(cardIndex), node)
                    }}
                    data-swap-index={cardIndex}
                    data-word-deck-front={cardIndex === seedIndex ? '' : undefined}
                    aria-hidden={cardIndex !== seedIndex}
                    inert={cardIndex !== seedIndex}
                    style={initialStyles.get(card.key ?? String(cardIndex))}
                    className={
                        cardIndex === index && !disabled
                            ? 'relative col-start-1 row-start-1 w-full min-w-0 cursor-pointer touch-pinch-zoom select-none self-start'
                            : 'relative col-start-1 row-start-1 w-full min-w-0 touch-pinch-zoom select-none self-start'
                    }
                >
                    {card}
                    <span
                        ref={(node): void => {
                            shadeRefs.current.set(card.key ?? String(cardIndex), node)
                        }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-0"
                    />
                </div>
            ))}
        </div>
    )
})
CardSwap.displayName = 'CardSwap'
export default CardSwap
