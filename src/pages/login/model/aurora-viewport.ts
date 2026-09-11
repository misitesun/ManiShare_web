const LOGIN_AURORA_REFERENCE_ASPECT_RATIO = 16 / 9

export function getAuroraVerticalScale(width: number, height: number): number {
    const safeWidth = Math.max(1, width)
    const safeHeight = Math.max(1, height)

    return (safeHeight * LOGIN_AURORA_REFERENCE_ASPECT_RATIO) / safeWidth
}
