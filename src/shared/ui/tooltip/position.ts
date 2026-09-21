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

const FULL_LEAN_SPEED = 1200
const PLACEMENT_LEAN_SIGN: Record<TooltipPlacement, number> = {
    top: 1,
    right: 1,
    bottom: -1,
    left: -1,
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value))
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

export function getTooltipLeanAngle(
    distance: number,
    elapsedMilliseconds: number,
    placement: TooltipPlacement,
    maxTilt: number,
): number {
    if (distance === 0 || elapsedMilliseconds <= 0 || maxTilt <= 0) return 0
    const velocity = (distance / elapsedMilliseconds) * 1000
    const leanUnit = clamp(-velocity / FULL_LEAN_SPEED, -1, 1)
    return leanUnit * maxTilt * PLACEMENT_LEAN_SIGN[placement]
}
