'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { formatPracticeMediaTime } from '../model/media-controller'
import type { VideoListeningSegment } from '../model/video-listening-demo'
import closeAsset from '../assets/video-listening/close.svg'

interface VideoPracticeLayoutProps {
    readonly enabled?: boolean
    readonly variant?: 'listening' | 'exercise'
    readonly open: boolean
    readonly currentIndex: number
    readonly segments: readonly VideoListeningSegment[]
    readonly heardIds?: readonly string[] | undefined
    readonly onSelect: (index: number) => void
    readonly onClose: () => void
    readonly onCompactChange: (compact: boolean) => void
    readonly controls: ReactNode
    readonly children: ReactNode
}

interface VideoFrameLayout {
    readonly width: number
    readonly marginLeft: number
}

function getVideoFrameLayout(containerWidth: number, sidebarSpace: number): VideoFrameLayout {
    const width =
        sidebarSpace > 0
            ? Math.max(0, containerWidth - sidebarSpace)
            : Math.min(containerWidth, 1390)
    return { width, marginLeft: sidebarSpace > 0 ? 0 : (containerWidth - width) / 2 }
}

function VideoSentenceList({
    segments,
    currentIndex,
    open,
    heardIds = [],
    onSelect,
    onClose,
}: {
    readonly segments: readonly VideoListeningSegment[]
    readonly currentIndex: number
    readonly open: boolean
    readonly heardIds?: readonly string[] | undefined
    readonly onSelect: (index: number) => void
    readonly onClose: () => void
}): ReactElement {
    const list = useRef<HTMLUListElement>(null)
    useEffect((): void => {
        const container = list.current
        const active = container?.querySelector('[aria-current="true"]')
        if (!open || !container || !active) return
        const bounds = container.getBoundingClientRect()
        const row = active.getBoundingClientRect()
        if (row.top < bounds.top) container.scrollTop += row.top - bounds.top
        else if (row.bottom > bounds.bottom) container.scrollTop += row.bottom - bounds.bottom
    }, [open, currentIndex])
    return (
        <section
            aria-label="视频句子列表"
            className="flex h-full min-h-0 flex-col rounded-2xl bg-surface-raised/70 p-4 text-foreground"
        >
            <header className="mb-[14px] flex h-6 shrink-0 items-center justify-between gap-3">
                <h2 className="text-[16px] font-medium leading-6">句子列表</h2>
                <button
                    type="button"
                    aria-label="关闭视频句子列表"
                    className="grid size-7 cursor-pointer place-items-center rounded focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={onClose}
                >
                    <img
                        src={closeAsset.src}
                        alt=""
                        className="[filter:var(--app-filter-shell-icon)]"
                    />
                </button>
            </header>
            <ul
                ref={list}
                className="min-h-0 flex-1 space-y-[14px] overflow-y-auto overscroll-contain"
            >
                {segments.map((segment, index) => (
                    <li key={segment.id}>
                        <button
                            type="button"
                            aria-current={currentIndex === index ? 'true' : undefined}
                            data-active={currentIndex === index}
                            className="flex min-h-[72px] w-full cursor-pointer items-start gap-2 rounded-lg border border-transparent bg-primary/5 px-[10px] py-[10px] text-left data-[active=true]:border-brand data-[active=true]:bg-brand/5 focus-visible:outline-2 focus-visible:outline-focus"
                            onClick={(): void => onSelect(index)}
                        >
                            <span
                                data-active={currentIndex === index}
                                className="shrink-0 text-[14px] leading-[22px] tabular-nums text-practice-muted data-[active=true]:text-brand"
                            >
                                {formatPracticeMediaTime(segment.start)}
                            </span>
                            <span className="flex min-w-0 flex-col gap-[10px]">
                                <span className="text-[16px] font-medium leading-[22px]">
                                    {segment.question.english}
                                </span>
                                <span className="text-[14px] leading-5 text-practice-muted">
                                    {segment.question.translation}
                                </span>
                            </span>
                            {heardIds.includes(segment.id) && (
                                <span className="sr-only">已听完</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** 视频各模式共用内容列表、响应式与联动布局；不创建媒体或持有题态。 */
export function VideoPracticeLayout(props: VideoPracticeLayoutProps): ReactElement {
    if (props.enabled === false) return <>{props.children}</>
    return <VideoPracticeFrame {...props} />
}

function VideoPracticeFrame({
    variant = 'listening',
    open,
    currentIndex,
    segments,
    heardIds,
    onSelect,
    onClose,
    onCompactChange,
    controls,
    children,
}: VideoPracticeLayoutProps): ReactElement {
    const root = useRef<HTMLDivElement>(null)
    const stage = useRef<HTMLDivElement>(null)
    const controlsDock = useRef<HTMLDivElement>(null)
    const controlsFrame = useRef<HTMLDivElement>(null)
    const sidebar = useRef<HTMLElement>(null)
    const [wide, setWide] = useState(false)
    const sidebarOpen = wide && open
    function closeSidebar(): void {
        onClose()
        stage.current
            ?.querySelector<HTMLElement>('button, input, [tabindex="0"]')
            ?.focus({ preventScroll: true })
    }
    useEffect(() => {
        const container = root.current
        const dock = controlsDock.current
        if (!container || !dock) return
        function reserveControlsSpace(): void {
            if (!container || !dock) return
            container.style.setProperty(
                '--video-controls-height',
                `${dock.getBoundingClientRect().height}px`,
            )
        }
        reserveControlsSpace()
        const observer = new ResizeObserver(reserveControlsSpace)
        observer.observe(dock)
        return (): void => {
            observer.disconnect()
            container.style.removeProperty('--video-controls-height')
        }
    }, [])
    useEffect(() => {
        const viewport = window.matchMedia('(min-width: 80rem)')
        function update(): void {
            setWide(viewport.matches)
            onCompactChange(!viewport.matches)
        }
        update()
        viewport.addEventListener('change', update)
        return (): void => viewport.removeEventListener('change', update)
    }, [onCompactChange])
    useGSAP(
        (context): (() => void) | undefined => {
            const main = stage.current
            const panel = sidebar.current
            const controls = controlsFrame.current
            const dock = controlsDock.current
            const container = main?.parentElement
            if (!main || !panel || !controls || !dock || !container) return
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
            const containerBounds = container.getBoundingClientRect()
            const dockBounds = dock.getBoundingClientRect()
            const mainBounds = main.getBoundingClientRect()
            const controlsBounds = controls.getBoundingClientRect()
            let containerWidth = containerBounds.width
            let dockWidth = dockBounds.width
            const sidebarSpace = sidebarOpen ? panel.offsetWidth + 23 : 0
            const panelTarget = {
                x: sidebarOpen ? 0 : 30,
                xPercent: sidebarOpen ? 0 : 100,
                autoAlpha: sidebarOpen ? 1 : 0,
            }
            let motionContext: gsap.Context | undefined
            let transition: gsap.core.Timeline | undefined
            context.ignore((): void => {
                motionContext = gsap.context((): void => {
                    // 固定当前可见几何，再同步插值真实宽度与边距，避免先重排再位移。
                    gsap.set(main, {
                        x: 0,
                        width: mainBounds.width,
                        marginLeft: mainBounds.left - containerBounds.left,
                        marginRight: 0,
                        maxWidth: 'none',
                    })
                    gsap.set(controls, {
                        x: 0,
                        width: controlsBounds.width,
                        marginLeft: controlsBounds.left - dockBounds.left,
                        marginRight: 0,
                        maxWidth: 'none',
                    })
                    transition = gsap.timeline({
                        defaults: {
                            duration: reduced.matches || !wide ? 0 : 0.24,
                            ease: sidebarOpen ? 'power2.out' : 'power2.in',
                        },
                    })
                    transition.to(main, { ...getVideoFrameLayout(containerWidth, sidebarSpace) }, 0)
                    transition.to(controls, { ...getVideoFrameLayout(dockWidth, sidebarSpace) }, 0)
                    transition.to(panel, panelTarget, 0)
                }, root)
            })
            function reduceMotion(): void {
                if (reduced.matches) transition?.progress(1)
            }
            reduced.addEventListener('change', reduceMotion)
            function resize(): void {
                if (!container || !dock) return
                const nextContainerWidth = container.getBoundingClientRect().width
                const nextDockWidth = dock.getBoundingClientRect().width
                // 宽度动画会改变内容／底栏高度；仅容器可用宽度变化才重新定位。
                if (containerWidth === nextContainerWidth && dockWidth === nextDockWidth) return
                containerWidth = nextContainerWidth
                dockWidth = nextDockWidth
                motionContext?.add((): void => {
                    transition?.kill()
                    transition = undefined
                    gsap.set(main, { ...getVideoFrameLayout(containerWidth, sidebarSpace) })
                    gsap.set(controls, { ...getVideoFrameLayout(dockWidth, sidebarSpace) })
                    gsap.set(panel, panelTarget)
                })
            }
            const observer = new ResizeObserver(resize)
            observer.observe(container)
            observer.observe(dock)
            return (): void => {
                reduced.removeEventListener('change', reduceMotion)
                observer.disconnect()
                // 保留动画中途的几何，快速反向时从当前画面继续。
                motionContext?.kill(false)
            }
        },
        { scope: root, dependencies: [sidebarOpen, wide], revertOnUpdate: true },
    )

    return (
        <div
            ref={root}
            data-video-listening={variant === 'listening' ? '' : undefined}
            data-video-practice-layout={variant}
            className={
                variant === 'listening'
                    ? 'relative flex min-w-0 flex-1 flex-col overflow-x-clip px-3 pb-[calc(var(--video-controls-height,180px)+46px+env(safe-area-inset-bottom))] pt-[63px] md:px-[30px]'
                    : 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip px-3 pb-[var(--video-controls-height,100px)] md:px-[30px]'
            }
        >
            <div
                className={
                    variant === 'listening'
                        ? 'relative flex min-w-0 flex-1'
                        : 'relative flex min-h-0 min-w-0 flex-1'
                }
            >
                <div
                    ref={stage}
                    data-video-stage
                    className={
                        variant === 'listening'
                            ? 'relative mx-auto flex w-full min-w-0 max-w-[1390px] shrink-0 flex-col'
                            : 'relative mx-auto flex min-h-0 w-full min-w-0 max-w-[1390px] shrink-0 flex-col overflow-y-auto overscroll-y-contain'
                    }
                >
                    {children}
                </div>
                <aside
                    ref={sidebar}
                    aria-hidden={!sidebarOpen}
                    inert={!sidebarOpen}
                    data-video-sentence-sidebar
                    className={
                        variant === 'listening'
                            ? 'invisible absolute right-0 top-0 hidden h-[calc(100%+var(--video-controls-height,180px)+26px)] min-h-0 w-[447px] overflow-hidden xl:block'
                            : 'invisible absolute right-0 top-0 hidden h-[calc(100%+var(--video-controls-height,100px)-20px)] min-h-0 w-[447px] overflow-hidden xl:block'
                    }
                    onKeyDown={(event): void => {
                        if (event.key === 'Escape') {
                            event.preventDefault()
                            event.stopPropagation()
                            closeSidebar()
                        }
                    }}
                >
                    <VideoSentenceList
                        segments={segments}
                        currentIndex={currentIndex}
                        open={sidebarOpen}
                        heardIds={heardIds}
                        onSelect={onSelect}
                        onClose={closeSidebar}
                    />
                </aside>
            </div>
            <div
                ref={controlsDock}
                data-video-controls-dock
                className={
                    variant === 'listening'
                        ? 'pointer-events-none fixed inset-x-3 bottom-[calc(20px+env(safe-area-inset-bottom))] z-30 md:inset-x-[30px]'
                        : 'pointer-events-none fixed inset-x-0 bottom-0 z-30'
                }
            >
                <div
                    ref={controlsFrame}
                    className="pointer-events-auto relative mx-auto w-full min-w-0 max-w-[1390px]"
                >
                    {controls}
                </div>
            </div>
            <TldDialog
                open={!wide && open}
                title="句子列表"
                showHeader={false}
                showCloseButton={false}
                footer={null}
                size="medium"
                onOpenChange={(next): void => {
                    if (!next) onClose()
                }}
            >
                <div className="h-[min(700px,70dvh)] min-h-0">
                    <VideoSentenceList
                        segments={segments}
                        currentIndex={currentIndex}
                        open={!wide && open}
                        heardIds={heardIds}
                        onSelect={onSelect}
                        onClose={onClose}
                    />
                </div>
            </TldDialog>
        </div>
    )
}
