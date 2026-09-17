import { useEffect, useState, type ReactElement, type RefObject } from 'react'
import { getHighlightRect, type HighlightRect } from './geometry'

export interface TldMovingHighlightProps {
    readonly containerRef: RefObject<HTMLElement | null>
    readonly activeKey: string | null
    readonly tone?: 'outline' | 'soft'
    readonly shape?: 'rounded' | 'card' | 'pill-start' | 'pill-end'
}

/** 容器 relative isolate；选项 data-highlight-key；背景 z-0、内容 z-20。 */
export function TldMovingHighlight({
    containerRef,
    activeKey,
    tone = 'outline',
    shape = 'rounded',
}: TldMovingHighlightProps): ReactElement | null {
    const [rect, setRect] = useState<HighlightRect | null>(null)
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
            const next = target
                ? getHighlightRect(
                      {
                          left: bounds.left,
                          top: bounds.top,
                          width: bounds.width,
                          height: bounds.height,
                          scrollLeft: container.scrollLeft,
                          scrollTop: container.scrollTop,
                          clientLeft: container.clientLeft,
                          clientTop: container.clientTop,
                      },
                      target.getBoundingClientRect(),
                  )
                : null
            setRect((previous) =>
                previous?.left === next?.left &&
                previous?.top === next?.top &&
                previous?.width === next?.width &&
                previous?.height === next?.height
                    ? previous
                    : next,
            )
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
        window.addEventListener('resize', measure)
        return (): void => {
            observer.disconnect()
            mutationObserver.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [activeKey, containerRef])

    if (!rect) return null
    return (
        <span
            aria-hidden="true"
            data-moving-highlight=""
            data-shape={shape}
            className="pointer-events-none absolute left-0 top-0 z-10 rounded-lg bg-linear-to-b from-brand-start to-brand-end p-px transition-[transform,width,height,border-radius] duration-200 ease-out motion-reduce:transition-none data-[shape=card]:rounded-xl data-[shape=pill-start]:rounded-l-full data-[shape=pill-start]:rounded-r-none data-[shape=pill-end]:rounded-l-none data-[shape=pill-end]:rounded-r-full"
            style={{
                transform: `translate(${rect.left}px, ${rect.top}px)`,
                width: rect.width,
                height: rect.height,
            }}
        >
            <span
                data-shape={shape}
                className="block size-full rounded-[7px] bg-canvas data-[shape=card]:rounded-[11px] data-[shape=pill-start]:rounded-l-full data-[shape=pill-start]:rounded-r-none data-[shape=pill-end]:rounded-l-none data-[shape=pill-end]:rounded-r-full"
            >
                {tone === 'soft' ? (
                    <span className="block size-full rounded-[inherit] bg-linear-to-b from-brand-start/10 to-brand-end/10" />
                ) : null}
            </span>
        </span>
    )
}
