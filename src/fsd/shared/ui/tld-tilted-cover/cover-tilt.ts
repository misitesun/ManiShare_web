export interface CoverPoint {
    readonly x: number
    readonly y: number
}

export interface CoverBounds {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
}

export interface CoverTilt {
    readonly active: boolean
    readonly rotateX: number
    readonly rotateY: number
    readonly glareX: number
    readonly glareY: number
    readonly scale: number
}

export const restingCoverTilt: CoverTilt = {
    active: false,
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    scale: 1,
}

export function getCoverTilt(bounds: CoverBounds, point: CoverPoint): CoverTilt {
    if (
        ![bounds.left, bounds.top, bounds.width, bounds.height, point.x, point.y].every(
            Number.isFinite,
        ) ||
        bounds.width <= 0 ||
        bounds.height <= 0
    ) {
        return restingCoverTilt
    }
    const x = Math.max(-1, Math.min(1, ((point.x - bounds.left) / bounds.width) * 2 - 1))
    const y = Math.max(-1, Math.min(1, ((point.y - bounds.top) / bounds.height) * 2 - 1))
    return {
        active: true,
        rotateX: y === 0 ? 0 : -y * 8,
        rotateY: x * 8,
        glareX: (x + 1) * 50,
        glareY: (y + 1) * 50,
        scale: 1.035,
    }
}

interface CoverTiltDriver {
    readonly measure: () => CoverBounds
    readonly apply: (tilt: CoverTilt) => void
    readonly requestFrame: (callback: () => void) => number
    readonly cancelFrame: (id: number) => void
}

export interface CoverTiltController {
    readonly move: (point: CoverPoint) => void
    readonly reset: () => void
    readonly destroy: () => void
}

/** 每帧只提交最后一个指针位置；复位和卸载使已排队的旧帧失效。 */
export function createCoverTiltController(driver: CoverTiltDriver): CoverTiltController {
    let frame: number | null = null
    let pending: CoverPoint | null = null
    let generation = 0
    let destroyed = false

    function reset(): void {
        generation += 1
        if (frame !== null) driver.cancelFrame(frame)
        frame = null
        pending = null
        driver.apply(restingCoverTilt)
    }

    return {
        move(point): void {
            if (destroyed) return
            pending = point
            if (frame !== null) return
            const currentGeneration = generation
            frame = driver.requestFrame((): void => {
                if (destroyed || currentGeneration !== generation) return
                frame = null
                const next = pending
                pending = null
                if (next !== null) driver.apply(getCoverTilt(driver.measure(), next))
            })
        },
        reset(): void {
            if (!destroyed) reset()
        },
        destroy(): void {
            if (destroyed) return
            destroyed = true
            reset()
        },
    }
}
