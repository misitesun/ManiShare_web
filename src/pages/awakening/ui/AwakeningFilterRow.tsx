import type { ReactElement } from 'react'

interface AwakeningFilterRowProps {
    readonly label: string
    readonly options: readonly string[]
    readonly value: string
    readonly onChange: (value: string) => void
    readonly primary?: boolean
}

export function AwakeningFilterRow({
    label,
    options,
    value,
    onChange,
    primary = false,
}: AwakeningFilterRowProps): ReactElement {
    return (
        <div
            role="group"
            aria-label={label}
            className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            <div
                className={
                    primary
                        ? 'flex w-max gap-6 md:gap-12 xl:gap-14'
                        : 'flex w-max gap-6 md:gap-10 xl:gap-12'
                }
            >
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={option === value}
                        onClick={(): void => onChange(option)}
                        className={
                            option === value
                                ? 'relative flex min-h-10 shrink-0 cursor-pointer items-center whitespace-nowrap px-1 pb-2 text-tab-label font-medium text-primary outline-none after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-accent-green focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                : 'flex min-h-10 shrink-0 cursor-pointer items-center whitespace-nowrap px-1 pb-2 text-tab-label text-primary/60 outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none'
                        }
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}
