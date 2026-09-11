export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipAnchorRect {
    readonly bottom: number
    readonly height: number
    readonly left: number
    readonly right: number
    readonly top: number
    readonly width: number
}

export interface TooltipCoordinates {
    readonly left: number
    readonly top: number
}

export function getTooltipCoordinates(
    anchor: TooltipAnchorRect,
    placement: TooltipPlacement,
    offset: number,
): TooltipCoordinates {
    if (placement === 'top') {
        return { left: anchor.left + anchor.width / 2, top: anchor.top - offset }
    }

    if (placement === 'right') {
        return { left: anchor.right + offset, top: anchor.top + anchor.height / 2 }
    }

    if (placement === 'bottom') {
        return { left: anchor.left + anchor.width / 2, top: anchor.bottom + offset }
    }

    return { left: anchor.left - offset, top: anchor.top + anchor.height / 2 }
}
