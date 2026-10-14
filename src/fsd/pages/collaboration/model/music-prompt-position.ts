export interface MusicPromptAnchor {
    readonly left: number
    readonly top: number
    readonly bottom: number
    readonly width: number
}
export interface MusicPromptPosition {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly maxHeight: number
    readonly arrowLeft: number
    readonly below: boolean
}

export function getMusicPromptPosition(
    anchor: MusicPromptAnchor,
    viewportWidth: number,
    viewportHeight: number,
    contentHeight: number,
): MusicPromptPosition {
    const margin = 12
    const gap = 10
    const width = Math.max(0, Math.min(280, viewportWidth - margin * 2))
    const aboveSpace = Math.max(0, anchor.top - gap - margin)
    const belowSpace = Math.max(0, viewportHeight - anchor.bottom - gap - margin)
    const below = contentHeight > aboveSpace && belowSpace > aboveSpace
    const maxHeight = Math.max(
        0,
        Math.min(below ? belowSpace : aboveSpace, viewportHeight - margin * 2),
    )
    const height = Math.min(contentHeight, maxHeight)
    const left = Math.max(
        margin,
        Math.min(anchor.left + anchor.width / 2 - width / 2, viewportWidth - margin - width),
    )
    const desiredTop = below ? anchor.bottom + gap : anchor.top - gap - height
    return {
        left,
        top: Math.max(margin, Math.min(desiredTop, viewportHeight - margin - height)),
        width,
        maxHeight,
        arrowLeft: Math.max(12, Math.min(anchor.left + anchor.width / 2 - left, width - 12)),
        below,
    }
}
