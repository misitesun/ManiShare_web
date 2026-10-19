export type WordCardDirection = 'left' | 'right'
export type WordCardNavigation = 'next' | 'previous'

/** 卡面几何以本项目Figma为准；运动由原版CardSwap组件维护。 */
export const wordCardMotion = {
    referenceWidth: 500,
    swipeThreshold: 150,
    nearX: 22 / 500,
    nearY: 14 / 500,
    nearScaleX: 492 / 500,
    nearScaleY: 472 / 500,
    farX: 36 / 500,
    farY: 28 / 500,
    farScaleX: 492 / 500,
    farScaleY: 444 / 500,
} as const

export type WordCardStackDepth = 'near' | 'far'

export interface WordCardStackPose {
    readonly x: number
    readonly y: number
    readonly scaleX: number
    readonly scaleY: number
}

/** 一层一层补位；回弹使用同一路径回到progress=0，不改变后卡的可见性。 */
export function getWordCardStackPose(
    depth: WordCardStackDepth,
    progress: number,
    width: number,
    height: number,
): WordCardStackPose {
    const near = {
        x: wordCardMotion.nearX,
        y: wordCardMotion.nearY,
        scaleX: wordCardMotion.nearScaleX,
        scaleY: wordCardMotion.nearScaleY,
    }
    const start =
        depth === 'near'
            ? near
            : {
                  x: wordCardMotion.farX,
                  y: wordCardMotion.farY,
                  scaleX: wordCardMotion.farScaleX,
                  scaleY: wordCardMotion.farScaleY,
              }
    const end = depth === 'near' ? { x: 0, y: 0, scaleX: 1, scaleY: 1 } : near
    const ratio = Math.max(0, Math.min(1, progress))
    return {
        x: (start.x + (end.x - start.x) * ratio) * width,
        y: (start.y + (end.y - start.y) * ratio) * height,
        scaleX: start.scaleX + (end.scaleX - start.scaleX) * ratio,
        scaleY: start.scaleY + (end.scaleY - start.scaleY) * ratio,
    }
}

/** 页面私有接线，所有下一题按钮/快捷键和手势进入同一动画门禁。 */
export interface WordPronunciationDeckController {
    readonly next: () => boolean
    readonly previous: () => boolean
    /** 保留当前卡到专用退场结束；完成回调由宿主原子删除题目，不触发普通切题。 */
    readonly dismiss: (onComplete: () => void, onCancel?: () => void) => boolean
    /** 沿原卡牌轮转退场轨道，将当前卡移到待练队尾后再提交宿主顺序。 */
    readonly requeue: (onComplete: () => void, onCancel?: () => void) => boolean
    readonly cancel: () => void
    readonly reset: () => void
    readonly isBusy: () => boolean
    /** 底栏/快捷键接管按住中的手势，保留当前位姿交给弹簧，不瞬移归零。 */
    readonly interruptDrag: () => boolean
}
