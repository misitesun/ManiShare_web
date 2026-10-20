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

interface CardSwapPointerEndInput {
    readonly source: 'release' | 'cancel' | 'capture-loss'
    readonly buttons: number
    readonly sample: CardSwapPointerSample
    readonly samples: readonly CardSwapPointerSample[]
}

interface CardSwapPointerEnd {
    readonly sample: CardSwapPointerSample
    readonly cancelled: boolean
}

/** 捕获丢失可能先于pointerup；按键已松开时保留最后有效轨迹，不能直接回弹。 */
export function getCardSwapPointerEnd({
    source,
    buttons,
    sample,
    samples,
}: CardSwapPointerEndInput): CardSwapPointerEnd {
    const last = samples.at(-1)
    const final = last && (source === 'capture-loss' || last.t > sample.t) ? last : sample
    return {
        sample: { x: final.x, y: final.y, t: Math.max(final.t, sample.t) },
        cancelled: source === 'cancel' || (source === 'capture-loss' && buttons !== 0),
    }
}

/** 起点、合并移动事件和松手共用90ms窗口，并保留窗口前的最近锚点。 */
export function appendCardSwapSample(
    samples: readonly CardSwapPointerSample[],
    sample: CardSwapPointerSample,
): CardSwapPointerSample[] {
    const last = samples.at(-1)
    if (last && sample.t < last.t) return [...samples]
    // 时间戳精度相同的首次move不能覆盖down锚点，否则即时轻甩会被算成零速度。
    const result =
        last?.t === sample.t && samples.length > 1
            ? [...samples.slice(0, -1), sample]
            : [...samples, sample]
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
    const projected = Math.hypot(aim.x, aim.y) > 0 ? aim : offset
    const length = Math.hypot(projected.x, projected.y) || 1
    return {
        advance:
            !cancelled &&
            (Math.hypot(offset.x, offset.y) > Math.min(width, height) * 0.3 ||
                Math.hypot(velocity.x, velocity.y) > 700),
        direction: { x: projected.x / length, y: projected.y / length },
    }
}
