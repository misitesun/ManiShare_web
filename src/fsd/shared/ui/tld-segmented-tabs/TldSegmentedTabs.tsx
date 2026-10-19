'use client'

import * as React from 'react'
import type { ReactElement } from 'react'
import { gsap, useGSAP } from '../../lib/animation'
import { TldGradientText } from '../tld-gradient-text'
import { TldMovingHighlight } from '../tld-moving-highlight'
import {
    getEqualSegmentClipPath,
    getRubberSquashEdges,
    getRubberStretchEdges,
    getSegmentBox,
    getSegmentClipPath,
    getSegmentDirection,
    getSegmentLayoutEdges,
    type SegmentEdges,
} from './rubber-geometry'

export interface TldSegmentedChoiceItem {
    readonly id: string
    readonly label: string
}

export interface TldSegmentedTabItem extends TldSegmentedChoiceItem {
    readonly panelId: string
}

export type TldSegmentedTabsActiveTextTone = 'accent-green' | 'brand' | 'gradient' | 'primary'
export type TldSegmentedTabsAppearance = 'brand' | 'glass' | 'neutral' | 'outlined'
export type TldSegmentedTabsBaselineTone = 'strong' | 'subtle'
export type TldSegmentedTabsGap =
    'compact' | 'generous' | 'spacious' | 'spread' | 'standard' | 'wide'
export type TldSegmentedTabsIndicatorThickness = 'medium' | 'thick' | 'thin'
export type TldSegmentedTabsIndicatorTone = 'accent-green' | 'brand' | 'brand-start'
export type TldSegmentedTabsIndicatorWidth = 'item' | 'segment' | number
export type TldSegmentedTabsLayout = 'content' | 'equal'
export type TldSegmentedTabsSemantics = 'filter' | 'tabs'
export type TldSegmentedTabsSize = 'compact' | 'default'
export type TldSegmentedTabsTypography =
    'comfortable' | 'compact' | 'default' | 'display' | 'regular'
export type TldSegmentedTabsVariant = 'segmented' | 'underline'

interface TldSegmentedTabsBaseProps {
    readonly appearance?: TldSegmentedTabsAppearance
    readonly activeTextTone?: TldSegmentedTabsActiveTextTone
    readonly ariaLabel: string
    readonly baselineTone?: TldSegmentedTabsBaselineTone
    readonly gap?: TldSegmentedTabsGap
    readonly indicatorThickness?: TldSegmentedTabsIndicatorThickness
    readonly indicatorTone?: TldSegmentedTabsIndicatorTone
    readonly indicatorWidth?: TldSegmentedTabsIndicatorWidth
    readonly layout?: TldSegmentedTabsLayout
    readonly onValueChange: (value: string) => void
    readonly showBaseline?: boolean
    readonly size?: TldSegmentedTabsSize
    readonly typography?: TldSegmentedTabsTypography
    readonly value: string
    readonly variant?: TldSegmentedTabsVariant
}

interface TldTabsProps extends TldSegmentedTabsBaseProps {
    readonly items: readonly TldSegmentedTabItem[]
    readonly semantics?: 'tabs'
}

interface TldFilterProps extends TldSegmentedTabsBaseProps {
    readonly items: readonly TldSegmentedChoiceItem[]
    readonly semantics: 'filter'
}

export type TldSegmentedTabsProps = TldFilterProps | TldTabsProps

interface AnimatedSegmentEdges {
    left: number
    right: number
}

interface InitialSegmentVisual {
    readonly clipPath: string
    readonly left: string
    readonly width: string
}

const RUBBER_RADIUS = 8
const RUBBER_STRETCH_DURATION = 0.19
const RUBBER_HANDOFF_TIME = 0.15
const RUBBER_LAND_DURATION = 0.3
const RUBBER_RELAX_DURATION = 0.16
const RUBBER_SQUASH = 3

function haveSameEdges(first: SegmentEdges, second: SegmentEdges): boolean {
    return first.left === second.left && first.right === second.right
}

function setAnimatedEdges(edges: AnimatedSegmentEdges, target: SegmentEdges): void {
    edges.left = target.left
    edges.right = target.right
}

function getUnderlineTargetKey(componentId: string, itemId: string): string {
    return `${componentId}-${itemId}-underline`
}

function getPanelId(item: TldSegmentedChoiceItem): string | undefined {
    return 'panelId' in item && typeof item.panelId === 'string' ? item.panelId : undefined
}

export function TldSegmentedTabs({
    activeTextTone = 'brand',
    appearance = 'brand',
    ariaLabel,
    baselineTone = 'strong',
    gap = 'standard',
    indicatorThickness = 'thin',
    indicatorTone = 'brand',
    indicatorWidth = 'segment',
    items,
    layout = 'content',
    onValueChange,
    semantics = 'tabs',
    showBaseline = true,
    size = 'default',
    typography = 'default',
    value,
    variant = 'segmented',
}: TldSegmentedTabsProps): ReactElement {
    const componentId = React.useId()
    const activeIndex = items.findIndex((item) => item.id === value)
    const itemCount = items.length
    const itemKey = items.map((item) => item.id).join('|')
    const tabListRef = React.useRef<HTMLDivElement>(null)
    const highlightRef = React.useRef<HTMLDivElement>(null)
    const labelOverlayRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const slotsRef = React.useRef<readonly SegmentEdges[]>([])
    const trackWidthRef = React.useRef(0)
    const activeIndexRef = React.useRef(activeIndex)
    const previousActiveIndexRef = React.useRef(activeIndex)
    const animationRef = React.useRef<ReturnType<typeof gsap.timeline> | null>(null)
    const initialVisualRef = React.useRef<InitialSegmentVisual | undefined>(undefined)
    const initialEdges =
        activeIndex >= 0 && items.length > 0
            ? {
                  left: (activeIndex / items.length) * 100,
                  right: ((activeIndex + 1) / items.length) * 100,
              }
            : { left: 0, right: 0 }
    const animatedEdgesRef = React.useRef<AnimatedSegmentEdges>({ ...initialEdges })

    activeIndexRef.current = activeIndex
    if (initialVisualRef.current === undefined && activeIndex >= 0) {
        initialVisualRef.current = {
            clipPath: getEqualSegmentClipPath(activeIndex, items.length, RUBBER_RADIUS),
            left: `${initialEdges.left}%`,
            width: `${initialEdges.right - initialEdges.left}%`,
        }
    }

    const activeUnderlineKey =
        variant === 'underline' && activeIndex >= 0
            ? getUnderlineTargetKey(componentId, value)
            : null
    const normalizedIndicatorWidth =
        typeof indicatorWidth === 'number' && Number.isFinite(indicatorWidth)
            ? Math.max(1, indicatorWidth)
            : indicatorWidth
    const tabListClassName =
        variant === 'segmented' && appearance === 'glass'
            ? 'relative isolate flex h-[46px] w-full overflow-hidden rounded-lg bg-foreground/10 ring-1 ring-inset ring-segment-outline [--app-text-tab-label:var(--app-text-tab-label-regular)] [--app-leading-tab-label:var(--app-leading-tab-label-regular)]'
            : variant === 'segmented' && appearance === 'outlined'
              ? 'relative isolate flex h-8 w-full overflow-hidden rounded-full bg-canvas [--app-text-tab-label:1rem] [--app-leading-tab-label:1.375rem]'
              : variant === 'underline' && layout === 'content' && gap === 'generous'
                ? 'relative isolate flex h-[45px] w-max min-w-full gap-6 md:gap-10 xl:min-[1920px]:gap-[70px]'
                : variant === 'segmented' && appearance === 'neutral'
                  ? 'relative isolate flex h-8 w-full overflow-hidden rounded-lg bg-transparent ring-1 ring-inset ring-plan-divider [--app-text-tab-label:var(--app-text-tab-label-compact)] [--app-leading-tab-label:var(--app-leading-tab-label-compact)]'
                  : variant === 'segmented'
                    ? 'relative isolate flex h-[46px] w-full overflow-hidden rounded-lg border border-strong bg-surface data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                    : typography === 'regular' && layout === 'content'
                      ? gap === 'spread'
                          ? 'relative isolate flex h-10 w-max min-w-0 gap-6 md:gap-16 xl:min-[1920px]:gap-[130px] [--app-text-tab-label:var(--app-text-tab-label-regular)] [--app-leading-tab-label:var(--app-leading-tab-label-regular)]'
                          : 'relative isolate flex h-10 w-max min-w-0 gap-6 md:gap-10 xl:gap-12 [--app-text-tab-label:var(--app-text-tab-label-regular)] [--app-leading-tab-label:var(--app-leading-tab-label-regular)]'
                      : layout === 'equal'
                        ? size === 'compact'
                            ? 'relative isolate flex h-11 w-full min-w-max data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                            : 'relative isolate flex h-[62px] w-full min-w-max data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                        : gap === 'spacious'
                          ? size === 'compact'
                              ? 'relative isolate flex h-11 w-max min-w-full gap-6 md:gap-10 xl:min-[1920px]:gap-[60px] data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                              : 'relative isolate flex h-[62px] w-max min-w-full gap-6 md:gap-10 xl:min-[1920px]:gap-[60px] data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                          : gap === 'compact'
                            ? size === 'compact'
                                ? 'relative isolate flex h-11 w-max min-w-full gap-4 md:gap-5 xl:gap-9 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                                : 'relative isolate flex h-[62px] w-max min-w-full gap-4 md:gap-5 xl:gap-9 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                            : gap === 'wide'
                              ? size === 'compact'
                                  ? 'relative isolate flex h-11 w-max min-w-full gap-6 md:gap-12 xl:gap-14 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                                  : 'relative isolate flex h-[62px] w-max min-w-full gap-6 md:gap-12 xl:gap-14 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                              : size === 'compact'
                                ? 'relative isolate flex h-11 w-max min-w-full gap-6 md:gap-10 xl:gap-12 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
                                : 'relative isolate flex h-[62px] w-max min-w-full gap-6 md:gap-10 xl:gap-12 data-[typography=compact]:[--app-text-tab-label:var(--app-text-tab-label-compact)] data-[typography=compact]:[--app-leading-tab-label:var(--app-leading-tab-label-compact)] data-[typography=compact]:tracking-[0.01em] data-[typography=display]:[--app-text-tab-label:var(--app-text-tab-label-display)] data-[typography=display]:[--app-leading-tab-label:var(--app-leading-tab-label-display)] data-[typography=display]:tracking-[0.01em] data-[typography=display]:min-w-0 md:data-[typography=display]:h-12 xl:min-[1920px]:data-[typography=display]:h-[54px]'
    function applyIndicatorVisual(): void {
        const highlight = highlightRef.current
        const labelOverlay = labelOverlayRef.current
        if (highlight === null || labelOverlay === null) return
        const box = getSegmentBox(animatedEdgesRef.current, trackWidthRef.current)

        highlight.style.left = `${box.left}px`
        highlight.style.width = `${box.width}px`
        labelOverlay.style.clipPath = getSegmentClipPath(
            animatedEdgesRef.current,
            trackWidthRef.current,
            RUBBER_RADIUS,
        )
    }

    function snapToActiveSegment(): void {
        const target = slotsRef.current[activeIndexRef.current]
        if (target === undefined) return
        animationRef.current?.kill()
        setAnimatedEdges(animatedEdgesRef.current, target)
        applyIndicatorVisual()
    }

    React.useLayoutEffect(() => {
        if (variant !== 'segmented') return
        const tabList = tabListRef.current
        if (tabList === null) return
        const measuredTabList = tabList
        let isActive = true
        let previousSlots: readonly SegmentEdges[] = []
        let previousWidth = 0

        function measure(): void {
            if (!isActive) return
            const bounds = measuredTabList.getBoundingClientRect()
            const cssWidth =
                appearance === 'glass'
                    ? Number.parseFloat(window.getComputedStyle(measuredTabList).width)
                    : bounds.width
            const layoutWidth = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : bounds.width
            const nextSlots = Array.from({ length: itemCount }, (_, index) => {
                const itemBounds = itemRefs.current[index]?.getBoundingClientRect()
                if (itemBounds === undefined) return { left: 0, right: 0 }
                const edges = {
                    left: itemBounds.left - bounds.left,
                    right: itemBounds.right - bounds.left,
                }
                return appearance === 'glass'
                    ? getSegmentLayoutEdges(edges, bounds.width, layoutWidth)
                    : edges
            })
            const didGeometryChange =
                layoutWidth !== previousWidth ||
                nextSlots.length !== previousSlots.length ||
                nextSlots.some(
                    (slot, index) =>
                        previousSlots[index] === undefined ||
                        !haveSameEdges(slot, previousSlots[index]),
                )
            slotsRef.current = nextSlots
            trackWidthRef.current = layoutWidth

            if (didGeometryChange) {
                previousSlots = nextSlots
                previousWidth = layoutWidth
                snapToActiveSegment()
            }
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(measuredTabList)
        itemRefs.current.forEach((item) => {
            if (item !== null) observer.observe(item)
        })
        if (document.fonts !== undefined) {
            void document.fonts.ready.then(() => measure())
        }

        return (): void => {
            isActive = false
            observer.disconnect()
        }
    }, [appearance, itemCount, itemKey, variant])

    useGSAP(
        () => {
            if (variant !== 'segmented' || activeIndex < 0) return
            const target = slotsRef.current[activeIndex]
            if (target === undefined) return
            const previousIndex = previousActiveIndexRef.current
            previousActiveIndexRef.current = activeIndex
            animationRef.current?.kill()

            const media = gsap.matchMedia()
            media.add('(prefers-reduced-motion: reduce)', () => {
                setAnimatedEdges(animatedEdgesRef.current, target)
                applyIndicatorVisual()
            })
            media.add('(prefers-reduced-motion: no-preference)', () => {
                if (previousIndex < 0 || previousIndex === activeIndex) {
                    setAnimatedEdges(animatedEdgesRef.current, target)
                    applyIndicatorVisual()
                    return
                }

                const current = { ...animatedEdgesRef.current }
                const direction = getSegmentDirection(current, target)
                const stretched = getRubberStretchEdges(current, target)
                const squashed = getRubberSquashEdges(target, direction, RUBBER_SQUASH)
                const timeline = gsap.timeline({
                    onComplete: (): void => {
                        setAnimatedEdges(animatedEdgesRef.current, target)
                        applyIndicatorVisual()
                    },
                    onUpdate: applyIndicatorVisual,
                })
                animationRef.current = timeline
                timeline.to(
                    animatedEdgesRef.current,
                    {
                        left: stretched.left,
                        right: stretched.right,
                        duration: RUBBER_STRETCH_DURATION,
                        ease: 'power3.out',
                    },
                    0,
                )

                if (direction > 0) {
                    timeline.to(
                        animatedEdgesRef.current,
                        {
                            right: target.right,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(
                        animatedEdgesRef.current,
                        {
                            left: squashed.left,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(animatedEdgesRef.current, {
                        left: target.left,
                        duration: RUBBER_RELAX_DURATION,
                        ease: 'power2.out',
                    })
                } else if (direction < 0) {
                    timeline.to(
                        animatedEdgesRef.current,
                        {
                            left: target.left,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(
                        animatedEdgesRef.current,
                        {
                            right: squashed.right,
                            duration: RUBBER_LAND_DURATION,
                            ease: 'power3.out',
                            overwrite: 'auto',
                        },
                        RUBBER_HANDOFF_TIME,
                    )
                    timeline.to(animatedEdgesRef.current, {
                        right: target.right,
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
        { dependencies: [activeIndex, itemKey, variant], scope: tabListRef },
    )

    return (
        <div
            ref={tabListRef}
            data-typography={typography}
            aria-label={ariaLabel}
            className={tabListClassName}
            role={semantics === 'tabs' ? 'tablist' : 'group'}
        >
            {variant === 'underline' && showBaseline ? (
                <span
                    aria-hidden="true"
                    data-typography={typography}
                    className={
                        baselineTone === 'subtle'
                            ? 'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px bg-subtle data-[typography=comfortable]:h-0.5'
                            : 'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px bg-strong data-[typography=comfortable]:h-0.5'
                    }
                />
            ) : null}
            {variant === 'underline' ? (
                <TldMovingHighlight
                    activeKey={activeUnderlineKey}
                    axis="horizontal"
                    containerRef={tabListRef}
                    motion="rubber"
                    shape="rounded"
                    tone={indicatorTone}
                />
            ) : null}
            {variant === 'segmented' && activeIndex >= 0 ? (
                <>
                    <div
                        ref={highlightRef}
                        aria-hidden="true"
                        className={
                            appearance === 'outlined' || appearance === 'glass'
                                ? 'pointer-events-none absolute inset-y-0 z-20 bg-linear-to-r/srgb from-brand-start to-brand-end'
                                : appearance === 'neutral'
                                  ? 'pointer-events-none absolute inset-y-0 z-20 bg-plan-selected'
                                  : 'pointer-events-none absolute inset-y-0 z-20 rounded-lg bg-linear-to-r from-brand-start to-brand-end'
                        }
                        style={{
                            left: initialVisualRef.current?.left,
                            width: initialVisualRef.current?.width,
                        }}
                    />
                    <div
                        ref={labelOverlayRef}
                        aria-hidden="true"
                        className={
                            appearance === 'neutral'
                                ? 'pointer-events-none absolute inset-0 z-30 flex text-primary'
                                : 'pointer-events-none absolute inset-0 z-30 flex text-inverse'
                        }
                        style={{ clipPath: initialVisualRef.current?.clipPath }}
                    >
                        {items.map((item) => (
                            <span
                                key={item.id}
                                className={
                                    appearance === 'outlined'
                                        ? 'flex min-w-0 flex-1 items-center justify-center px-3 text-label-regular font-medium'
                                        : 'flex min-w-0 flex-1 items-center justify-center px-3 text-tab-label font-medium'
                                }
                            >
                                <span className="truncate">{item.label}</span>
                            </span>
                        ))}
                    </div>
                </>
            ) : null}
            {items.map((item, index) => {
                const isActive = item.id === value
                const panelId = getPanelId(item)
                const underlineTargetKey = getUnderlineTargetKey(componentId, item.id)

                return (
                    <button
                        key={item.id}
                        ref={(element): void => {
                            itemRefs.current[index] = element
                        }}
                        id={`${componentId}-${item.id}`}
                        type="button"
                        aria-controls={semantics === 'tabs' ? panelId : undefined}
                        data-typography={typography}
                        aria-pressed={semantics === 'filter' ? isActive : undefined}
                        aria-selected={semantics === 'tabs' ? isActive : undefined}
                        className={
                            variant === 'segmented' && appearance === 'glass'
                                ? 'relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center border-l border-segment-outline px-2 text-tab-label font-normal text-primary/60 outline-none first:border-l-0 hover:bg-surface-hover hover:text-primary focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                : variant === 'segmented' && appearance === 'outlined'
                                  ? 'relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center px-3 text-tab-label text-hint before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-linear-to-b/srgb before:from-brand-start before:to-brand-end first:before:hidden outline-none first:border-l-0 hover:text-foreground focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                  : variant === 'segmented' && appearance === 'neutral'
                                    ? 'relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center border-l border-plan-divider px-2 text-tab-label text-hint outline-none first:border-l-0 hover:bg-surface-hover hover:text-primary focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                    : variant === 'segmented'
                                      ? 'relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center px-3 text-tab-label text-primary/60 outline-none hover:bg-surface-hover hover:text-primary focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                      : layout === 'equal'
                                        ? 'relative z-20 flex min-w-0 flex-1 cursor-pointer items-center justify-center px-5 text-tab-label outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none'
                                        : 'relative z-20 flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap px-1 text-tab-label data-[typography=comfortable]:items-start data-[typography=comfortable]:px-0 data-[typography=comfortable]:text-tab-label-comfortable data-[typography=comfortable]:tracking-[0.01em] data-[typography=compact]:px-0 data-[typography=display]:px-0 data-[typography=regular]:px-0 data-[typography=regular]:items-start data-[typography=display]:tracking-[0.01em] outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none'
                        }
                        role={semantics === 'tabs' ? 'tab' : undefined}
                        onClick={(): void => onValueChange(item.id)}
                    >
                        <span
                            className={
                                variant === 'underline' && isActive
                                    ? activeTextTone === 'gradient'
                                        ? 'truncate font-medium text-primary'
                                        : activeTextTone === 'primary'
                                          ? 'truncate font-medium text-primary'
                                          : activeTextTone === 'accent-green'
                                            ? 'truncate font-medium text-accent-green'
                                            : 'truncate font-medium text-brand'
                                    : appearance === 'outlined' ||
                                        typography === 'comfortable' ||
                                        typography === 'display' ||
                                        typography === 'regular'
                                      ? 'truncate text-tab-inactive'
                                      : 'truncate text-primary/60'
                            }
                        >
                            {variant === 'underline' &&
                            isActive &&
                            activeTextTone === 'gradient' ? (
                                <TldGradientText animationSpeed={3}>{item.label}</TldGradientText>
                            ) : (
                                item.label
                            )}
                        </span>
                        {variant === 'underline' ? (
                            <span
                                aria-hidden="true"
                                data-typography={typography}
                                data-highlight-key={underlineTargetKey}
                                className={
                                    normalizedIndicatorWidth === 'segment'
                                        ? indicatorThickness === 'thick'
                                            ? 'pointer-events-none absolute inset-x-0 bottom-[-1px] h-1 opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                            : indicatorThickness === 'medium'
                                              ? 'pointer-events-none absolute inset-x-0 bottom-[-1px] h-[3px] opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                              : 'pointer-events-none absolute inset-x-0 bottom-[-1px] h-0.5 opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                        : indicatorThickness === 'thick'
                                          ? 'pointer-events-none absolute bottom-[-1px] left-1/2 h-1 w-max -translate-x-1/2 whitespace-nowrap text-transparent opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                          : indicatorThickness === 'medium'
                                            ? 'pointer-events-none absolute bottom-[-1px] left-1/2 h-[3px] w-max -translate-x-1/2 whitespace-nowrap text-transparent opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                            : 'pointer-events-none absolute bottom-[-1px] left-1/2 h-0.5 w-max -translate-x-1/2 whitespace-nowrap text-transparent opacity-0 data-[typography=comfortable]:bottom-0 data-[typography=comfortable]:overflow-hidden data-[typography=compact]:bottom-0 data-[typography=compact]:overflow-hidden data-[typography=display]:bottom-0 data-[typography=display]:overflow-hidden data-[typography=regular]:bottom-0 data-[typography=regular]:overflow-hidden'
                                }
                                style={
                                    typeof normalizedIndicatorWidth === 'number'
                                        ? { width: normalizedIndicatorWidth }
                                        : undefined
                                }
                            >
                                {normalizedIndicatorWidth === 'item' ? item.label : null}
                            </span>
                        ) : null}
                    </button>
                )
            })}
        </div>
    )
}
