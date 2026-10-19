interface ToolbarPopoverAnchor {
    readonly left: number
    readonly bottom: number
    readonly width: number
}

interface ToolbarPopoverViewport {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface ToolbarPopoverPosition {
    readonly left: number
    readonly top: number
    readonly arrowLeft: number
    readonly maxHeight: number
}

/** 与页内10px下移保持一致，同时限制在当前可见视口内。 */
export function getToolbarPopoverPosition(
    anchor: ToolbarPopoverAnchor,
    panelWidth: number,
    viewport: ToolbarPopoverViewport,
): ToolbarPopoverPosition {
    const minimumLeft = viewport.left + 4
    const maximumLeft = Math.max(minimumLeft, viewport.left + viewport.width - panelWidth - 4)
    const center = anchor.left + anchor.width / 2
    const left = Math.min(maximumLeft, Math.max(minimumLeft, center - panelWidth / 2))
    const top = Math.max(viewport.top + 4, anchor.bottom + 10)
    return {
        left,
        top,
        arrowLeft: Math.min(panelWidth - 6, Math.max(6, center - left)),
        maxHeight: Math.max(0, viewport.top + viewport.height - top - 4),
    }
}
