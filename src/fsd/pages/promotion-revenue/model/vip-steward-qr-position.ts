export interface VipStewardQrAnchor {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly bottom: number
}

export interface VipStewardQrPosition {
    readonly left: number
    readonly top: number
}

export function getVipStewardQrPosition(
    anchor: VipStewardQrAnchor,
    viewportWidth: number,
    viewportHeight: number,
): VipStewardQrPosition {
    const width = 118
    const height = 143
    const gap = 8
    const below = anchor.bottom + gap + height <= viewportHeight - gap
    return {
        left: Math.max(
            gap,
            Math.min(anchor.left + anchor.width / 2 - width / 2, viewportWidth - width - gap),
        ),
        top: Math.max(
            gap,
            Math.min(
                below ? anchor.bottom + gap : anchor.top - height - gap,
                viewportHeight - height - gap,
            ),
        ),
    }
}
