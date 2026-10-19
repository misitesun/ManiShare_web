export interface SelectMenuAnchor {
    readonly left: number
    readonly top: number
    readonly bottom: number
    readonly width: number
}

export interface SelectMenuViewport {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface SelectMenuContentSize {
    readonly width: number
    readonly height: number
}

export interface SelectMenuGeometry {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly maxHeight: number
}

/** Portal 使用 CSS 视口坐标，优先左对齐，并在可见视口内限制宽高。 */
export function getSelectMenuGeometry(
    anchor: SelectMenuAnchor,
    viewport: SelectMenuViewport,
    content: SelectMenuContentSize,
): SelectMenuGeometry {
    const margin = 8
    const gap = 8
    const leftEdge = viewport.left + margin
    const rightEdge = viewport.left + viewport.width - margin
    const topEdge = viewport.top + margin
    const bottomEdge = viewport.top + viewport.height - margin
    const width = Math.min(
        Math.max(anchor.width, content.width),
        Math.max(0, viewport.width - margin * 2),
    )
    const belowTop = Math.min(Math.max(anchor.bottom + gap, topEdge), bottomEdge)
    const below = Math.max(0, bottomEdge - belowTop)
    const above = Math.max(0, Math.min(anchor.top - gap, bottomEdge) - topEdge)
    const desiredHeight = Math.min(256, content.height)
    const upwards = below < desiredHeight && above > below
    const maxHeight = Math.min(256, upwards ? above : below)
    return {
        left: Math.max(leftEdge, Math.min(anchor.left, rightEdge - width)),
        top: upwards
            ? Math.min(anchor.top - gap, bottomEdge) - Math.min(desiredHeight, maxHeight)
            : belowTop,
        width,
        maxHeight,
    }
}
