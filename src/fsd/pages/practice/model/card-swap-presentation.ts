export const cardSwapPresentation = {
    visible: 4,
    distance: 32,
    verticalDistance: 2,
    depth: 80,
    perspective: 900,
    parallax: 0.5,
    hoverSpread: 0.12,
} as const

export interface CardSwapPresentationPose {
    readonly x: number
    readonly y: number
    readonly z: number
    readonly r: number
    readonly p: number
    readonly sx: number
    readonly sy: number
}

/** 仅成员增删重建实例；业务重排不销毁正在回插的同一节点。 */
export function getCardSwapMembershipIdentity(keys: readonly string[]): string {
    return JSON.stringify([...keys].sort())
}

/** React Bits 原位姿：深度由 perspective 投影，卡面不做横纵非等比缩放。 */
export function getCardSwapPresentationPose(
    position: number,
    spread: number,
): CardSwapPresentationPose {
    const q = Math.max(0, Math.min(cardSwapPresentation.visible, position))
    return {
        x: q * cardSwapPresentation.distance * (1 + spread),
        y: -q * cardSwapPresentation.verticalDistance * (1 + spread),
        z: -q * cardSwapPresentation.depth,
        r: 0,
        p: q,
        sx: 1,
        sy: 1,
    }
}

/** 只轮转眼前的展示槽，完整业务队列仍由宿主 retryWord 管理。 */
export function getCardSwapRetryPresentation(
    presentation: readonly number[],
    logical: readonly number[],
    current: number,
): number[] {
    const at = logical.indexOf(current)
    if (at < 0 || logical.length < 2) return [...presentation]
    const following =
        at === logical.length - 1 ? logical.filter((id) => id !== current) : logical.slice(at + 1)
    const visible = [...following.slice(0, cardSwapPresentation.visible - 1), current]
    const used = new Set(visible)
    return [...visible, ...presentation.filter((id) => !used.has(id))]
}
