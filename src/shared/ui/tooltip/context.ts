import { createContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { TooltipPlacement } from './position'

export interface GroupedTooltipPayload {
    readonly content: ReactNode
    readonly height: CSSProperties['height']
    readonly id: string
    readonly offset: number
    readonly placement: TooltipPlacement
    readonly trigger: HTMLElement
}

export interface TooltipGroupContextValue {
    readonly activeId: string | null
    readonly hide: (id: string, instant?: boolean) => void
    readonly show: (payload: GroupedTooltipPayload) => void
    readonly tooltipId: string
}

export const TooltipGroupContext = createContext<TooltipGroupContextValue | null>(null)
