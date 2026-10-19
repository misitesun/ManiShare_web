import { getWordCardStackPose } from './word-card-deck'
import type { WordCardNavigation } from './word-card-deck'

interface CardSwapLayout {
    readonly x: number
    readonly y: number
    readonly sx: number
    readonly sy: number
}

type CardSwapNavigation =
    | { readonly kind: 'none' }
    | { readonly kind: 'move'; readonly index: number }
    | { readonly kind: 'finish'; readonly index: number }

/** 仅约束原组件的导航边界，不接管它的运动、帧循环或速度。 */
export function getCardSwapNavigation(
    index: number,
    count: number,
    direction: WordCardNavigation,
): CardSwapNavigation {
    if (
        !Number.isInteger(index) ||
        !Number.isInteger(count) ||
        count <= 0 ||
        index < 0 ||
        index >= count
    )
        return { kind: 'none' }
    if (direction === 'previous')
        return index === 0 ? { kind: 'none' } : { kind: 'move', index: index - 1 }
    return index === count - 1 ? { kind: 'finish', index } : { kind: 'move', index: index + 1 }
}

export function getCardSwapOrder(index: number, count: number): number[] {
    if (
        !Number.isInteger(index) ||
        !Number.isInteger(count) ||
        count <= 0 ||
        index < 0 ||
        index >= count
    )
        return []
    return Array.from({ length: count }, (_, offset): number => (index + offset) % count)
}

/** 原稿几何适配口：原组件依旧积分所有轴，前卡保持500px，后卡保留原缩放。 */
export function getCardSwapLayout(position: number, width: number, height: number): CardSwapLayout {
    const q = Math.max(0, Math.min(3, position))
    const near = getWordCardStackPose('near', 0, width, height)
    const far = getWordCardStackPose('far', 0, width, height)
    const start = q <= 1 ? { x: 0, y: 0, scaleX: 1, scaleY: 1 } : near
    const end = q <= 1 ? near : far
    const t = q <= 1 ? q : q - 1
    const sx = start.scaleX + (end.scaleX - start.scaleX) * t
    const sy = start.scaleY + (end.scaleY - start.scaleY) * t
    return {
        x: start.x + (end.x - start.x) * t + ((sx - 1) * width) / 2,
        y: start.y + (end.y - start.y) * t + ((sy - 1) * height) / 2,
        sx,
        sy,
    }
}
