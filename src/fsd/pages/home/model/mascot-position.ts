export interface MascotPoint {
    readonly x: number
    readonly y: number
}

export interface MascotBounds {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export const mascotSize = 70

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
}

export function constrainMascot(point: MascotPoint, bounds: MascotBounds): MascotPoint {
    return {
        x: clamp(point.x, bounds.left, bounds.left + bounds.width - mascotSize),
        y: clamp(point.y, bounds.top, bounds.top + bounds.height - mascotSize),
    }
}

export function mascotGreetingPosition(
    point: MascotPoint,
    bounds: MascotBounds,
): MascotPoint & { readonly width: number } {
    const width = Math.min(352, bounds.width)
    const height = 64
    const gap = 10
    const above = point.y - height - gap
    return {
        x: clamp(
            point.x + mascotSize / 2 - width / 2,
            bounds.left,
            bounds.left + bounds.width - width,
        ),
        y: clamp(
            above >= bounds.top ? above : point.y + mascotSize + gap,
            bounds.top,
            bounds.top + bounds.height - height,
        ),
        width,
    }
}

export function isMascotDrag(start: MascotPoint, current: MascotPoint): boolean {
    return Math.hypot(current.x - start.x, current.y - start.y) >= 4
}
