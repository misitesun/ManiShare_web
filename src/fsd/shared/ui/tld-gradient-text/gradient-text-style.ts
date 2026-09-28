import type { CSSProperties } from 'react'

export type TldGradientTextDirection = 'horizontal' | 'vertical' | 'diagonal'

export interface TldGradientTextStyleOptions {
    readonly animationSpeed: number
    readonly colors: readonly string[]
    readonly direction: TldGradientTextDirection
    readonly yoyo: boolean
}

type GradientTextColors = readonly [string, string, ...string[]]
type TldGradientTextStyle = CSSProperties & {
    readonly '--tld-gradient-text-duration': string
    readonly '--tld-gradient-text-end': string
    readonly '--tld-gradient-text-start': string
    readonly '--tld-gradient-text-direction': 'alternate' | 'normal'
}

const defaultGradientTextColors = [
    'var(--app-color-brand-start)',
    'var(--app-color-brand-end)',
] as const satisfies GradientTextColors
const defaultAnimationSpeed = 8

function getGradientAngle(direction: TldGradientTextDirection): string {
    if (direction === 'vertical') return 'to bottom'
    if (direction === 'diagonal') return 'to bottom right'
    return 'to right'
}

function getGradientPosition(direction: TldGradientTextDirection): readonly [string, string] {
    if (direction === 'vertical') return ['50% 0%', '50% 100%']
    if (direction === 'diagonal') return ['0% 0%', '100% 100%']
    return ['0% 50%', '100% 50%']
}

function getGradientSize(direction: TldGradientTextDirection): string {
    if (direction === 'vertical') return '100% 300%'
    if (direction === 'diagonal') return '300% 300%'
    return '300% 100%'
}

function getAnimationSpeed(animationSpeed: number): number {
    return Number.isFinite(animationSpeed) && animationSpeed > 0
        ? animationSpeed
        : defaultAnimationSpeed
}

export function getGradientTextColors(colors: readonly string[]): GradientTextColors {
    const nonEmptyColors = colors.filter((color) => color.trim().length > 0)
    const [firstColor, secondColor, ...remainingColors] = nonEmptyColors

    if (firstColor === undefined || secondColor === undefined) return defaultGradientTextColors

    return [firstColor, secondColor, ...remainingColors]
}

export function getGradientTextStyle({
    animationSpeed,
    colors,
    direction,
    yoyo,
}: TldGradientTextStyleOptions): TldGradientTextStyle {
    const gradientColors = getGradientTextColors(colors)
    const [startPosition, endPosition] = getGradientPosition(direction)
    const firstColor = gradientColors[0]

    return {
        backgroundImage: `linear-gradient(${getGradientAngle(direction)}, ${[
            ...gradientColors,
            firstColor,
        ].join(', ')})`,
        backgroundRepeat: 'repeat',
        backgroundSize: getGradientSize(direction),
        '--tld-gradient-text-direction': yoyo ? 'alternate' : 'normal',
        '--tld-gradient-text-duration': `${getAnimationSpeed(animationSpeed)}s`,
        '--tld-gradient-text-end': endPosition,
        '--tld-gradient-text-start': startPosition,
    }
}
