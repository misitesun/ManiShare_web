'use client'

import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, ReactElement } from 'react'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'

export interface VideoPlaybackChoice<Value extends string | number> {
    readonly value: Value
    readonly label: string
}
interface VideoOptionTracking {
    readonly activeKey: string | null
    readonly point: (key: string, pointerType: string) => void
    readonly leave: () => void
    readonly focus: (key: string) => void
    readonly blur: (event: FocusEvent<HTMLDivElement>) => void
}

/** 临时高亮不提交设置；关闭浮层清理指针／焦点状态。 */
function useVideoOptionTracking(active: boolean): VideoOptionTracking {
    const [pointerKey, setPointerKey] = useState<string | null>(null)
    const [focusKey, setFocusKey] = useState<string | null>(null)
    useEffect((): void => {
        if (!active) {
            setPointerKey(null)
            setFocusKey(null)
        }
    }, [active])
    return {
        activeKey: active ? (pointerKey ?? focusKey) : null,
        point(key, pointerType): void {
            if (pointerType !== 'touch') setPointerKey(key)
        },
        leave: (): void => setPointerKey(null),
        focus: (key): void => setFocusKey(key),
        blur(event): void {
            if (
                !(event.relatedTarget instanceof Node) ||
                !event.currentTarget.contains(event.relatedTarget)
            )
                setFocusKey(null)
        },
    }
}

/** 与项目下拉框共用单条竖向高亮，勾选状态由播放器持有。 */
export function VideoPlaybackOptionList<Value extends string | number>({
    label,
    options,
    active,
    multiple = false,
    onSelect,
}: {
    readonly label: string
    readonly options: readonly (VideoPlaybackChoice<Value> & { readonly checked: boolean })[]
    readonly active: boolean
    readonly multiple?: boolean
    readonly onSelect: (value: Value) => void
}): ReactElement {
    const container = useRef<HTMLDivElement>(null)
    const tracking = useVideoOptionTracking(active)
    const selected = options.find((option) => option.checked)
    const initialKey = multiple ? null : selected ? String(selected.value) : null
    return (
        <div
            ref={container}
            role="group"
            aria-label={label}
            className="relative isolate"
            onPointerLeave={tracking.leave}
            onKeyDownCapture={tracking.leave}
            onBlur={tracking.blur}
        >
            <TldMovingHighlight
                containerRef={container}
                activeKey={active ? (tracking.activeKey ?? initialKey) : null}
                axis="vertical"
                tone="surface"
            />
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role={multiple ? 'checkbox' : undefined}
                    aria-checked={multiple ? option.checked : undefined}
                    aria-pressed={multiple ? undefined : option.checked}
                    data-highlight-key={String(option.value)}
                    className={
                        multiple
                            ? 'relative flex min-h-11 w-full cursor-pointer items-center rounded-lg px-2 text-left text-[18px] focus-visible:outline-2 focus-visible:outline-focus'
                            : 'relative flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-[20px] focus-visible:outline-2 focus-visible:outline-focus'
                    }
                    onPointerEnter={(event): void =>
                        tracking.point(String(option.value), event.pointerType)
                    }
                    onFocus={(): void => tracking.focus(String(option.value))}
                    onClick={(): void => onSelect(option.value)}
                >
                    <span className="relative z-20 flex w-full items-center justify-between gap-4">
                        <span>{option.label}</span>
                        {option.checked && <span aria-hidden="true">✓</span>}
                    </span>
                </button>
            ))}
        </div>
    )
}

/** 选中块复用Tab的橡皮拉伸／回弹，鼠标跟随层与已提交选择分开。 */
export function VideoPlaybackSegments<Value extends string | number>({
    label,
    options,
    value,
    active,
    onSelect,
}: {
    readonly label: string
    readonly options: readonly VideoPlaybackChoice<Value>[]
    readonly value: Value
    readonly active: boolean
    readonly onSelect: (value: Value) => void
}): ReactElement {
    const container = useRef<HTMLDivElement>(null)
    const tracking = useVideoOptionTracking(active)
    return (
        <div
            ref={container}
            role="group"
            aria-label={label}
            className={
                options.length === 2
                    ? 'relative isolate grid grid-cols-2 gap-1 overflow-hidden rounded-[14px] bg-primary/5 p-1'
                    : 'relative isolate grid grid-cols-3 gap-1 overflow-hidden rounded-[14px] bg-primary/5 p-1'
            }
            onPointerLeave={tracking.leave}
            onKeyDownCapture={tracking.leave}
            onBlur={tracking.blur}
        >
            <TldMovingHighlight
                containerRef={container}
                activeKey={tracking.activeKey}
                axis="horizontal"
                tone="surface"
            />
            <TldMovingHighlight
                containerRef={container}
                activeKey={active ? String(value) : null}
                axis="horizontal"
                motion="rubber"
                tone="practice-segment"
            />
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    data-highlight-key={String(option.value)}
                    data-selected={value === option.value}
                    className="relative min-h-11 cursor-pointer rounded-[10px] px-3 text-[18px] text-practice-muted data-[selected=true]:font-medium data-[selected=true]:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                    onPointerEnter={(event): void =>
                        tracking.point(String(option.value), event.pointerType)
                    }
                    onFocus={(): void => tracking.focus(String(option.value))}
                    onClick={(): void => onSelect(option.value)}
                >
                    <span className="relative z-20">{option.label}</span>
                </button>
            ))}
        </div>
    )
}
