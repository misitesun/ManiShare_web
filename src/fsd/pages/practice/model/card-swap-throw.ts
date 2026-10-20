interface CardSwapThrowPoint {
    readonly x: number
    readonly y: number
}

interface CardSwapThrowBounds {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

interface CardSwapThrowInput {
    readonly card: CardSwapThrowBounds
    readonly viewport: CardSwapThrowBounds
    readonly position: CardSwapThrowPoint
    readonly direction: CardSwapThrowPoint
    readonly rotation: number
}

export interface CardSwapThrowPath {
    readonly origin: CardSwapThrowPoint
    readonly direction: CardSwapThrowPoint
    readonly clearance: number
    readonly target: CardSwapThrowPoint
}

/** 从释放位置沿惯性方向飞出可见视口，包含旋转外框与卡片光晕余量。 */
export function getCardSwapThrowPath({
    card,
    viewport,
    position,
    direction,
    rotation,
}: CardSwapThrowInput): CardSwapThrowPath {
    const length = Math.hypot(direction.x, direction.y)
    const unit = length > 0 ? { x: direction.x / length, y: direction.y / length } : { x: 1, y: 0 }
    const radians = (rotation * Math.PI) / 180
    const cosine = Math.abs(Math.cos(radians))
    const sine = Math.abs(Math.sin(radians))
    const halfWidth = (card.width * cosine + card.height * sine) / 2
    const halfHeight = (card.height * cosine + card.width * sine) / 2
    const centerX = card.left + card.width / 2 + position.x
    const centerY = card.top + card.height / 2 + position.y
    const margin = 64
    const horizontal =
        unit.x > 0
            ? (viewport.left + viewport.width + margin + halfWidth - centerX) / unit.x
            : unit.x < 0
              ? (viewport.left - margin - halfWidth - centerX) / unit.x
              : Number.POSITIVE_INFINITY
    const vertical =
        unit.y > 0
            ? (viewport.top + viewport.height + margin + halfHeight - centerY) / unit.y
            : unit.y < 0
              ? (viewport.top - margin - halfHeight - centerY) / unit.y
              : Number.POSITIVE_INFINITY
    const clearance = Math.max(1, Math.min(horizontal, vertical))
    return {
        origin: { x: position.x, y: position.y },
        direction: unit,
        clearance,
        // 弹簧目标在完全离屏点之外，保证进入隐藏阶段前能真正越过视口边缘。
        target: {
            x: position.x + unit.x * clearance * 1.3,
            y: position.y + unit.y * clearance * 1.3,
        },
    }
}
