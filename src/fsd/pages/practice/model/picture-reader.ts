/** 图片阅读器独立循环，不改变其他练习的章节完成规则。 */
export function getPictureReaderIndex(index: number, total: number, delta: number): number {
    if (
        !Number.isSafeInteger(total) ||
        total <= 0 ||
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= total ||
        !Number.isSafeInteger(delta)
    )
        return 0
    return (((index + (delta % total)) % total) + total) % total
}

/** 相邻首尾也按单步方向滑入；圆点跨图按题号方向切换。 */
export function getPictureReaderDirection(previous: number, next: number, total: number): number {
    if (previous === next) return 0
    if (previous === 0 && next === total - 1) return -1
    if (previous === total - 1 && next === 0) return 1
    return next > previous ? 1 : -1
}

interface PictureReaderSwipe {
    readonly startX: number
    readonly startY: number
    readonly endX: number
    readonly endY: number
    readonly width: number
}

/** 明确的横向手势才翻页；短触、抖动及纵向滚动不切图。 */
export function getPictureReaderSwipe(gesture: PictureReaderSwipe): number {
    const { startX, startY, endX, endY, width } = gesture
    if (![startX, startY, endX, endY, width].every(Number.isFinite) || width <= 0) return 0
    const horizontal = endX - startX
    const vertical = endY - startY
    const threshold = Math.max(40, Math.min(88, width * 0.12))
    if (Math.abs(horizontal) < threshold || Math.abs(horizontal) <= Math.abs(vertical) * 1.2)
        return 0
    return horizontal < 0 ? 1 : -1
}
