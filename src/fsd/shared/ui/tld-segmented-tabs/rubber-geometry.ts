export interface SegmentEdges {
    readonly left: number
    readonly right: number
}

export interface SegmentBox {
    readonly left: number
    readonly width: number
}

export type SegmentDirection = -1 | 0 | 1

export function getEqualSegmentEdges(index: number, count: number): SegmentEdges | null {
    if (!Number.isInteger(index) || !Number.isInteger(count) || count <= 0) return null
    if (index < 0 || index >= count) return null

    const width = 100 / count
    return {
        left: index * width,
        right: (index + 1) * width,
    }
}

export function getRubberStretchEdges(
    current: SegmentEdges,
    target: SegmentEdges,
    stretch = 1,
): SegmentEdges {
    const normalizedStretch = Math.min(1, Math.max(0, stretch))
    return {
        left: target.left + (Math.min(current.left, target.left) - target.left) * normalizedStretch,
        right:
            target.right +
            (Math.max(current.right, target.right) - target.right) * normalizedStretch,
    }
}

export function getSegmentDirection(current: SegmentEdges, target: SegmentEdges): SegmentDirection {
    const currentCenter = (current.left + current.right) / 2
    const targetCenter = (target.left + target.right) / 2

    if (targetCenter > currentCenter) return 1
    if (targetCenter < currentCenter) return -1
    return 0
}

export function getRubberSquashEdges(
    target: SegmentEdges,
    direction: SegmentDirection,
    squash: number,
): SegmentEdges {
    const normalizedSquash = Math.max(0, squash)

    if (direction > 0) {
        return { left: target.left + normalizedSquash, right: target.right }
    }
    if (direction < 0) {
        return { left: target.left, right: target.right - normalizedSquash }
    }
    return target
}

export function getSegmentClipPath(edges: SegmentEdges, width: number, radius: number): string {
    const normalizedWidth = Math.max(0, width)
    const box = getSegmentBox(edges, normalizedWidth)
    const rightInset = normalizedWidth - box.left - box.width

    return `inset(0 ${rightInset}px 0 ${box.left}px round ${Math.max(0, radius)}px)`
}

export function getSegmentBox(edges: SegmentEdges, trackWidth: number): SegmentBox {
    const normalizedTrackWidth = Math.max(0, trackWidth)
    const left = Math.min(normalizedTrackWidth, Math.max(0, edges.left))
    const right = Math.min(normalizedTrackWidth, Math.max(left, edges.right))

    return { left, width: right - left }
}

export function getEqualSegmentClipPath(index: number, count: number, radius: number): string {
    const edges = getEqualSegmentEdges(index, count)
    if (edges === null) return 'inset(0 100% 0 0 round 0)'

    return `inset(0 ${100 - edges.right}% 0 ${edges.left}% round ${Math.max(0, radius)}px)`
}
