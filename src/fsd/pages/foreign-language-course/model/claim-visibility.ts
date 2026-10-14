export interface ClaimVisibility {
    readonly viewportTop: number
    readonly viewportBottom: number
    readonly noticeTop: number
    readonly noticeBottom: number
    readonly currentScrollTop: number
    readonly maxScrollTop: number
}

export function getClaimNoticeScrollTop(bounds: ClaimVisibility): number {
    const edgeGap = 16
    let next = bounds.currentScrollTop
    if (bounds.noticeBottom > bounds.viewportBottom - edgeGap) {
        next += bounds.noticeBottom - bounds.viewportBottom + edgeGap
    } else if (bounds.noticeTop < bounds.viewportTop + edgeGap) {
        next += bounds.noticeTop - bounds.viewportTop - edgeGap
    }
    return Math.max(0, Math.min(Math.max(0, bounds.maxScrollTop), next))
}
