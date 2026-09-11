import type { ReactElement, ReactNode } from 'react'
import { getGradientTextStyle } from './gradient-text-style'
import type { TldGradientTextDirection } from './gradient-text-style'

export interface TldGradientTextProps {
    readonly animationSpeed?: number
    readonly children: ReactNode
    readonly className?: string
    readonly colors?: readonly string[]
    readonly direction?: TldGradientTextDirection
    readonly pauseOnHover?: boolean
    readonly showBorder?: boolean
    readonly yoyo?: boolean
}

const defaultColors = ['var(--app-color-brand-start)', 'var(--app-color-brand-end)'] as const

export function TldGradientText({
    animationSpeed = 8,
    children,
    className = '',
    colors = defaultColors,
    direction = 'horizontal',
    pauseOnHover = false,
    showBorder = false,
    yoyo = true,
}: TldGradientTextProps): ReactElement {
    const gradientStyle = getGradientTextStyle({ animationSpeed, colors, direction, yoyo })
    const containerClassName = showBorder
        ? pauseOnHover
            ? 'relative inline-flex max-w-full overflow-hidden rounded-[1.25rem] p-px animate-[tld-gradient-text-shift_var(--tld-gradient-text-duration)_ease-in-out_infinite] [animation-direction:var(--tld-gradient-text-direction)] hover:[animation-play-state:paused] motion-reduce:animate-none'
            : 'relative inline-flex max-w-full overflow-hidden rounded-[1.25rem] p-px animate-[tld-gradient-text-shift_var(--tld-gradient-text-duration)_ease-in-out_infinite] [animation-direction:var(--tld-gradient-text-direction)] motion-reduce:animate-none'
        : 'inline-block max-w-full'
    const contentClassName = showBorder
        ? 'relative z-10 inline-block max-w-full rounded-[calc(1.25rem-1px)] bg-canvas px-2 py-1'
        : 'inline-block max-w-full'
    const gradientTextClassName = pauseOnHover
        ? 'inline-block max-w-full bg-clip-text text-transparent animate-[tld-gradient-text-shift_var(--tld-gradient-text-duration)_ease-in-out_infinite] [animation-direction:var(--tld-gradient-text-direction)] hover:[animation-play-state:paused] motion-reduce:animate-none'
        : 'inline-block max-w-full bg-clip-text text-transparent animate-[tld-gradient-text-shift_var(--tld-gradient-text-duration)_ease-in-out_infinite] [animation-direction:var(--tld-gradient-text-direction)] motion-reduce:animate-none'

    return (
        <span className={className}>
            <span className={containerClassName} style={showBorder ? gradientStyle : undefined}>
                <span className={contentClassName}>
                    <span className={gradientTextClassName} style={gradientStyle}>
                        {children}
                    </span>
                </span>
            </span>
        </span>
    )
}
