export const backgroundPresets = [
    { id: 'default', label: '默认', color: 'var(--app-color-practice-preset-default)' },
    { id: 'warm', label: '暖色护眼', color: 'var(--app-color-practice-preset-warm)' },
    { id: 'green', label: '绿色护眼', color: 'var(--app-color-practice-preset-green)' },
    { id: 'blue', label: '蓝色护眼', color: 'var(--app-color-practice-preset-blue)' },
] as const

export const maxBackgroundFileBytes = 10 * 1024 * 1024
export const maxBackgroundSourceLength = 1024 * 1024
export const maxBackgroundEdge = 2560

export interface PracticeBackgroundImage {
    readonly version: 1
    readonly source: string
    readonly name: string
    readonly width: number
    readonly height: number
}

export function getBackgroundPresetColor(id: string): string {
    return (backgroundPresets.find((preset) => preset.id === id) ?? backgroundPresets[0]).color
}

export function parseBackgroundImage(value: unknown): PracticeBackgroundImage | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const candidate: Record<string, unknown> = value as Record<string, unknown>
    if (
        candidate.version !== 1 ||
        typeof candidate.source !== 'string' ||
        candidate.source.length > maxBackgroundSourceLength ||
        !/^data:image\/(?:webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(candidate.source) ||
        typeof candidate.name !== 'string' ||
        candidate.name.length > 120 ||
        typeof candidate.width !== 'number' ||
        !Number.isInteger(candidate.width) ||
        candidate.width < 1 ||
        candidate.width > maxBackgroundEdge ||
        typeof candidate.height !== 'number' ||
        !Number.isInteger(candidate.height) ||
        candidate.height < 1 ||
        candidate.height > maxBackgroundEdge
    )
        return null
    return {
        version: 1,
        source: candidate.source,
        name: candidate.name,
        width: candidate.width,
        height: candidate.height,
    }
}

export function getBackgroundFileError(size: number, bytes: Uint8Array): string | null {
    if (size <= 0) return '图片为空，请重新选择。'
    if (size > maxBackgroundFileBytes) return '图片不能超过10MB，请选择较小的图片。'
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    const webp =
        bytes[0] === 82 &&
        bytes[1] === 73 &&
        bytes[2] === 70 &&
        bytes[3] === 70 &&
        bytes[8] === 87 &&
        bytes[9] === 69 &&
        bytes[10] === 66 &&
        bytes[11] === 80
    return jpeg || png || webp ? null : '请选择有效的JPG、PNG或WebP图片。'
}

export function getBackgroundDimensions(
    width: number,
    height: number,
): { width: number; height: number } {
    const scale = Math.min(1, maxBackgroundEdge / Math.max(width, height))
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    }
}

export function resolvePreferenceColor(value: string, defaultColor: string): string {
    if (value === 'theme') return defaultColor
    if (value === 'light-default') return 'var(--app-color-answer-default-light)'
    if (value === 'dark-default') return 'var(--app-color-answer-default-dark)'
    return value
}

export function preferenceColorLabel(value: string): string {
    if (value === 'theme') return '默认主题色'
    if (value === 'light-default') return '白天模式默认色'
    if (value === 'dark-default') return '夜间模式默认色'
    return value
}
