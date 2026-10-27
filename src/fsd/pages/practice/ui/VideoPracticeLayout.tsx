'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { formatPracticeMediaTime } from '../model/media-controller'
import type { VideoListeningSegment } from '../model/video-listening-demo'
import { PracticePlaybackList } from './PracticePlaybackList'
import type { PracticePlaybackListContent } from '../model/practice-playback-list'

interface VideoPracticeLayoutProps {
    readonly enabled?: boolean
    readonly variant?: 'listening' | 'exercise' | 'picture'
    /** 将滚动视口与限宽题面分开，默认消费者保持原滚动宿主。 */
    readonly edgeScrollbar?: boolean
    readonly open: boolean
    readonly currentIndex: number
    readonly segments?: readonly VideoListeningSegment[]
    readonly content?: PracticePlaybackListContent
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

/** 视频与看图共用内容列表、响应式与联动布局；不创建媒体或持有题态。 */
export function VideoPracticeLayout(props: VideoPracticeLayoutProps): ReactElement {
    if (props.enabled === false) return <>{props.children}</>
    return <VideoPracticeFrame {...props} />
}

function VideoPracticeFrame({
    variant = 'listening',
    edgeScrollbar = false,
    open,
    currentIndex,
    segments = [],
    content,
    heardIds,
    onSelect,
    onClose,
    onCompactChange,
    controls,
    children,
}: VideoPracticeLayoutProps): ReactElement {
    const listContent: PracticePlaybackListContent = content ?? {
        title: '句子列表',
        label: '视频句子列表',
        closeLabel: '关闭视频句子列表',
        entries: segments.map((segment) => ({
            id: segment.id,
            marker: formatPracticeMediaTime(segment.start),
            english: segment.question.english,
            translation: segment.question.translation,
        })),
    }
    const root = useRef<HTMLDivElement>(null)
    const frame = useRef<HTMLDivElement>(null)
    const stage = useRef<HTMLDivElement>(null)
    const scrollViewport = useRef<HTMLDivElement>(null)
    const controlsDock = useRef<HTMLDivElement>(null)
    const controlsFrame = useRef<HTMLDivElement>(null)
    const sidebar = useRef<HTMLElement>(null)
    const [wide, setWide] = useState(false)
    const sidebarOpen = wide && open
    const edgeScroll = edgeScrollbar && variant !== 'listening'
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
            const container = frame.current
            const viewport = scrollViewport.current
            if (!main || !panel || !controls || !dock || !container) return
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
            const containerBounds = container.getBoundingClientRect()
            const dockBounds = dock.getBoundingClientRect()
            const mainBounds = main.getBoundingClientRect()
            const controlsBounds = controls.getBoundingClientRect()
            const viewportBounds = viewport?.getBoundingClientRect()
            let containerWidth = containerBounds.width
            let dockWidth = dockBounds.width
            const sidebarSpace = sidebarOpen ? panel.offsetWidth + 23 : 0
            function getScrollViewportWidth(): number {
                const rootBounds = root.current?.getBoundingClientRect()
                const bounds = container?.getBoundingClientRect()
                const inset = rootBounds && bounds ? Math.max(0, bounds.left - rootBounds.left) : 0
                return Math.max(0, containerWidth - sidebarSpace) + inset * (sidebarOpen ? 1 : 2)
            }
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
                    if (viewport && viewportBounds)
                        gsap.set(viewport, { width: viewportBounds.width, right: 'auto' })
                    transition = gsap.timeline({
                        defaults: {
                            duration: reduced.matches || !wide ? 0 : 0.24,
                            ease: sidebarOpen ? 'power2.out' : 'power2.in',
                        },
                    })
                    transition.to(main, { ...getVideoFrameLayout(containerWidth, sidebarSpace) }, 0)
                    transition.to(controls, { ...getVideoFrameLayout(dockWidth, sidebarSpace) }, 0)
                    transition.to(panel, panelTarget, 0)
                    if (viewport) transition.to(viewport, { width: getScrollViewportWidth() }, 0)
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
                    if (viewport) gsap.set(viewport, { width: getScrollViewportWidth() })
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
        { scope: root, dependencies: [sidebarOpen, wide, edgeScroll], revertOnUpdate: true },
    )

    const stageContent = (
        <div
            ref={stage}
            data-video-stage
            className={
                variant === 'listening' || edgeScroll
                    ? 'relative mx-auto flex w-full min-w-0 max-w-[1390px] shrink-0 flex-col'
                    : 'relative mx-auto flex min-h-0 w-full min-w-0 max-w-[1390px] shrink-0 flex-col overflow-y-auto overscroll-y-contain'
            }
        >
            {children}
        </div>
    )

    return (
        <div
            ref={root}
            data-video-listening={variant === 'listening' ? '' : undefined}
            data-video-practice-layout={variant === 'picture' ? undefined : variant}
            data-picture-practice-layout={variant === 'picture' ? '' : undefined}
            className={
                variant === 'listening'
                    ? 'relative flex min-w-0 flex-1 flex-col overflow-x-clip px-3 pb-[calc(var(--video-controls-height,180px)+46px+env(safe-area-inset-bottom))] pt-[63px] md:px-[30px]'
                    : 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip px-3 pb-[var(--video-controls-height,100px)] md:px-[30px]'
            }
        >
            <div
                ref={frame}
                className={
                    variant === 'listening'
                        ? 'relative flex min-w-0 flex-1'
                        : 'relative flex min-h-0 min-w-0 flex-1'
                }
            >
                {edgeScroll ? (
                    <div
                        ref={scrollViewport}
                        data-practice-edge-scroll-viewport
                        className="absolute inset-y-0 -left-3 -right-3 min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-width:thin] [scrollbar-color:var(--app-color-practice-muted)_transparent] md:-left-[30px] md:-right-[30px] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-practice-muted/50 [&::-webkit-scrollbar-thumb:hover]:bg-practice-muted/70"
                    >
                        <div
                            className={
                                sidebarOpen
                                    ? 'flex min-h-full min-w-0 pl-3 md:pl-[30px]'
                                    : 'flex min-h-full min-w-0 px-3 md:px-[30px]'
                            }
                        >
                            {stageContent}
                        </div>
                    </div>
                ) : (
                    stageContent
                )}
                <aside
                    ref={sidebar}
                    aria-hidden={!sidebarOpen}
                    inert={!sidebarOpen}
                    data-video-sentence-sidebar={variant === 'picture' ? undefined : ''}
                    data-picture-content-sidebar={variant === 'picture' ? '' : undefined}
                    className={
                        variant === 'listening'
                            ? 'invisible absolute right-0 top-0 hidden h-[calc(100%+var(--video-controls-height,180px)+26px)] min-h-0 w-[447px] overflow-hidden xl:block'
                            : variant === 'picture'
                              ? 'invisible absolute right-0 top-[70px] hidden h-[calc(100%+var(--video-controls-height,100px)-90px)] min-h-0 w-[447px] overflow-hidden xl:block'
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
                    <PracticePlaybackList
                        content={listContent}
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
                title={listContent.title}
                showHeader={false}
                showCloseButton={false}
                footer={null}
                size="medium"
                onOpenChange={(next): void => {
                    if (!next) onClose()
                }}
            >
                <div className="h-[min(700px,70dvh)] min-h-0">
                    <PracticePlaybackList
                        content={listContent}
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
