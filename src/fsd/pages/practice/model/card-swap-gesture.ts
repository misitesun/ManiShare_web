interface CardSwapVector {
    readonly x: number
    readonly y: number
}

interface CardSwapRelease {
    readonly advance: boolean
    readonly direction: CardSwapVector
}

export interface CardSwapPointerSample extends CardSwapVector {
    readonly t: number
}

/** 起点、合并移动事件和松手共用90ms窗口，并保留窗口前的最近锚点。 */
export function appendCardSwapSample(
    samples: readonly CardSwapPointerSample[],
    sample: CardSwapPointerSample,
): CardSwapPointerSample[] {
    const last = samples.at(-1)
    if (last && sample.t < last.t) return [...samples]
    const result = last?.t === sample.t ? [...samples.slice(0, -1), sample] : [...samples, sample]
    while (result.length > 2 && sample.t - (result[1]?.t ?? sample.t) >= 90) result.shift()
    return result
}

export function getCardSwapVelocity(samples: readonly CardSwapPointerSample[]): CardSwapVector {
    const first = samples[0]
    const last = samples.at(-1)
    if (!first || !last || first === last) return { x: 0, y: 0 }
    const startTime = Math.max(first.t, last.t - 90)
    const next = samples[1]
    const ratio =
        next && next.t > first.t ? Math.min(1, (startTime - first.t) / (next.t - first.t)) : 0
    const startX = first.x + ((next?.x ?? first.x) - first.x) * ratio
    const startY = first.y + ((next?.y ?? first.y) - first.y) * ratio
    const seconds = Math.max(0.016, (last.t - startTime) / 1000)
    return { x: (last.x - startX) / seconds, y: (last.y - startY) / seconds }
}

/** 原版使用二维距离/速度判定，方向不改变本项目“只下一题”的业务语义。 */
export function getCardSwapRelease(
    offset: CardSwapVector,
    velocity: CardSwapVector,
    width: number,
    height: number,
    cancelled: boolean,
): CardSwapRelease {
    const aim = { x: offset.x + velocity.x * 0.12, y: offset.y + velocity.y * 0.12 }
    const length = Math.hypot(aim.x, aim.y) || 1
    return {
        advance:
            !cancelled &&
            (Math.hypot(offset.x, offset.y) > Math.min(width, height) * 0.3 ||
                Math.hypot(velocity.x, velocity.y) > 700),
        direction: { x: aim.x / length, y: aim.y / length },
    }
}
