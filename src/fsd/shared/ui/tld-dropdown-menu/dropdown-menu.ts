export type DropdownMenuNavigationKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'

export interface DropdownMenuAnchor {
    readonly top: number
    readonly right: number
    readonly bottom: number
}

export interface DropdownMenuViewport {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface DropdownMenuGeometry {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly maxHeight: number
}

export function getDropdownMenuFocusIndex(
    key: DropdownMenuNavigationKey,
    current: number,
    count: number,
): number | null {
    if (count <= 0) return null
    if (key === 'Home') return 0
    if (key === 'End') return count - 1
    if (current < 0 || current >= count) return key === 'ArrowUp' ? count - 1 : 0
    return (current + (key === 'ArrowDown' ? 1 : -1) + count) % count
}

/** 固定定位使用CSS视口坐标；右对齐，窄屏夹紧，底部空间不足时向上展开。 */
export function getDropdownMenuGeometry(
    anchor: DropdownMenuAnchor,
    viewport: DropdownMenuViewport,
    itemCount: number,
): DropdownMenuGeometry {
    const margin = 12
    const gap = 8
    const width = Math.min(208, Math.max(0, viewport.width - margin * 2))
    const leftEdge = viewport.left + margin
    const rightEdge = viewport.left + viewport.width - margin
    const topEdge = viewport.top + margin
    const bottomEdge = viewport.top + viewport.height - margin
    const belowTop = Math.min(Math.max(anchor.bottom + gap, topEdge), bottomEdge)
    const below = Math.max(0, bottomEdge - belowTop)
    const above = Math.max(0, Math.min(anchor.top - gap, bottomEdge) - topEdge)
    const desiredHeight = Math.min(480, itemCount * 44 + 18)
    const upwards = below < desiredHeight && above > below
    const maxHeight = Math.min(480, upwards ? above : below)
    return {
        left: Math.max(leftEdge, Math.min(anchor.right - width, rightEdge - width)),
        top: upwards
            ? Math.min(anchor.top - gap, bottomEdge) - Math.min(desiredHeight, maxHeight)
            : belowTop,
        width,
        maxHeight,
    }
}
