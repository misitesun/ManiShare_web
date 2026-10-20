export type TldDialogPlacement = 'center' | 'right'

interface DialogMotionPose {
    readonly x: number
    readonly y: number
    readonly scale: number
}

/** frameLeft使用未变换的布局坐标，反向开关时不把当前动画位移重复算入终点。 */
export function getDialogExitPose(
    placement: TldDialogPlacement,
    frameLeft: number,
    viewportRight: number,
): DialogMotionPose {
    return placement === 'right'
        ? { x: Math.max(0, viewportRight - frameLeft) + 12, y: 0, scale: 1 }
        : { x: 0, y: 12, scale: 0.97 }
}
