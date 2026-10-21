'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { createPopoverTrigger, DESKTOP_POPOVER_HOVER_QUERY } from './popover-trigger'
import type { PopoverTrigger } from './popover-trigger'

interface PopoverTriggerOptions {
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly rootRef: RefObject<HTMLElement | null>
    readonly panelRef: RefObject<HTMLElement | null>
}

interface PopoverTriggerView extends PopoverTrigger {
    readonly onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => void
    readonly onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void
}

export function usePopoverTrigger(options: PopoverTriggerOptions): PopoverTriggerView {
    const latest = useRef(options)
    latest.current = options
    const hoverAvailable = useRef(false)
    const [trigger] = useState(() =>
        createPopoverTrigger({
            canHover: (): boolean => hoverAvailable.current,
            isOpen: (): boolean => latest.current.open,
            setOpen: (open): void => latest.current.onOpenChange(open),
            contains: (target): boolean =>
                target instanceof Node &&
                Boolean(
                    latest.current.rootRef.current?.contains(target) ||
                    latest.current.panelRef.current?.contains(target),
                ),
            hasFocusWithin: (): boolean => {
                const { rootRef, panelRef } = latest.current
                const active = rootRef.current?.ownerDocument.activeElement
                return Boolean(
                    active &&
                    (rootRef.current?.contains(active) || panelRef.current?.contains(active)),
                )
            },
            schedule: (callback, delay): number => window.setTimeout(callback, delay),
            cancelFrame: (frame): void => window.clearTimeout(frame),
        }),
    )
    useEffect(() => {
        const media = window.matchMedia(DESKTOP_POPOVER_HOVER_QUERY)
        function update(): void {
            hoverAvailable.current = media.matches
            if (!media.matches) {
                trigger.cancel()
                if (latest.current.open && !trigger.shouldFocusOnOpen())
                    latest.current.onOpenChange(false)
            }
        }
        update()
        media.addEventListener('change', update)
        return (): void => {
            media.removeEventListener('change', update)
            trigger.cancel()
        }
    }, [trigger])
    useEffect(() => {
        if (!options.open) trigger.cancel()
    }, [options.open, trigger])
    return {
        ...trigger,
        onPointerEnter: (event): void => trigger.enter(event.pointerType),
        onPointerLeave: (event): void => trigger.leave(event.pointerType, event.relatedTarget),
    }
}
