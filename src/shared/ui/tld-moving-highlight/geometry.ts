export interface HighlightRect {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface HighlightContainer extends HighlightRect {
    readonly scrollLeft: number
    readonly scrollTop: number
    readonly clientLeft: number
    readonly clientTop: number
}

export function getHighlightRect(
    container: HighlightContainer,
    target: HighlightRect,
): HighlightRect {
    return {
        left: target.left - container.left + container.scrollLeft - container.clientLeft,
        top: target.top - container.top + container.scrollTop - container.clientTop,
        width: target.width,
        height: target.height,
    }
}
