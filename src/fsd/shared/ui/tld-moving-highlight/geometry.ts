export interface HighlightRect {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface HighlightEdges {
    readonly start: number
    readonly end: number
}

export type HighlightAxis = 'horizontal' | 'vertical'

export type HighlightDirection = -1 | 0 | 1

export interface HighlightContainer extends HighlightRect {
    readonly scrollLeft: number
    readonly scrollTop: number
    readonly clientLeft: number
    readonly clientTop: number
}

export function getLayoutScale(renderedSize: number, layoutSize: number): number {
    if (!Number.isFinite(renderedSize) || !Number.isFinite(layoutSize) || layoutSize <= 0) return 1
    const scale = renderedSize / layoutSize
    return Math.abs(scale - 1) >= 0.01 ? scale : 1
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

export function getHighlightEdges(rect: HighlightRect, axis: HighlightAxis): HighlightEdges {
    return axis === 'vertical'
        ? { start: rect.top, end: rect.top + rect.height }
        : { start: rect.left, end: rect.left + rect.width }
}

export function getHighlightDirection(
    current: HighlightEdges,
    target: HighlightEdges,
): HighlightDirection {
    const currentCenter = (current.start + current.end) / 2
    const targetCenter = (target.start + target.end) / 2

    if (targetCenter > currentCenter) return 1
    if (targetCenter < currentCenter) return -1
    return 0
}

export function getRubberStretchEdges(
    current: HighlightEdges,
    target: HighlightEdges,
): HighlightEdges {
    return {
        start: Math.min(current.start, target.start),
        end: Math.max(current.end, target.end),
    }
}

export function getRubberSquashEdges(
    target: HighlightEdges,
    direction: HighlightDirection,
    squash: number,
): HighlightEdges {
    const normalizedSquash = Math.max(0, squash)

    if (direction > 0) {
        return { start: target.start + normalizedSquash, end: target.end }
    }
    if (direction < 0) {
        return { start: target.start, end: target.end - normalizedSquash }
    }
    return target
}

export function getHighlightRectFromEdges(
    target: HighlightRect,
    axis: HighlightAxis,
    edges: HighlightEdges,
): HighlightRect {
    const size = Math.max(0, edges.end - edges.start)

    return axis === 'vertical'
        ? { ...target, top: edges.start, height: size }
        : { ...target, left: edges.start, width: size }
}
