export interface NormalizedProgress {
    readonly value: number
    readonly max: number
    readonly percentage: number
}

function normalizeFiniteNumber(value: number): number {
    return Number.isFinite(value) ? value : 0
}

export function normalizeProgress(value: number, max: number): NormalizedProgress {
    const normalizedMax = Math.max(0, normalizeFiniteNumber(max))
    const normalizedValue = Math.min(normalizedMax, Math.max(0, normalizeFiniteNumber(value)))

    return {
        value: normalizedValue,
        max: normalizedMax,
        percentage: normalizedMax === 0 ? 0 : (normalizedValue / normalizedMax) * 100,
    }
}
