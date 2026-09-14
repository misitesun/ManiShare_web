import * as React from 'react'
import type { ReactElement } from 'react'

export interface TldSegmentedTabItem {
    readonly id: string
    readonly label: string
    readonly panelId: string
}

export type TldSegmentedTabsVariant = 'segmented' | 'underline'

export interface TldSegmentedTabsProps {
    readonly ariaLabel: string
    readonly items: readonly TldSegmentedTabItem[]
    readonly onValueChange: (value: string) => void
    readonly value: string
    readonly variant?: TldSegmentedTabsVariant
}

export function TldSegmentedTabs({
    ariaLabel,
    items,
    onValueChange,
    value,
    variant = 'segmented',
}: TldSegmentedTabsProps): ReactElement {
    const componentId = React.useId()
    const activeIndex = items.findIndex((item) => item.id === value)
    const tabListClassName =
        variant === 'underline'
            ? 'flex h-[62px] w-full min-w-max border-b border-strong'
            : 'relative isolate flex h-[46px] w-full overflow-hidden rounded-lg border border-strong bg-surface'

    return (
        <div aria-label={ariaLabel} className={tabListClassName} role="tablist">
            {variant === 'segmented' && activeIndex >= 0 && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 bg-linear-to-r from-brand-start to-brand-end transition-transform duration-300 ease-out motion-reduce:transition-none"
                    style={{
                        width: `${100 / items.length}%`,
                        transform: `translateX(${activeIndex * 100}%)`,
                    }}
                />
            )}
            {items.map((item) => {
                const isActive = item.id === value

                return (
                    <button
                        key={item.id}
                        id={`${componentId}-${item.id}`}
                        type="button"
                        aria-controls={item.panelId}
                        aria-selected={isActive}
                        className={
                            variant === 'underline'
                                ? isActive
                                    ? 'relative flex min-w-[130px] cursor-pointer items-center justify-center px-5 text-tab-label font-medium text-brand after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-brand'
                                    : 'flex min-w-[130px] cursor-pointer items-center justify-center px-5 text-tab-label text-primary/60 transition-colors hover:text-primary'
                                : isActive
                                  ? 'relative flex min-w-0 flex-1 cursor-pointer items-center justify-center px-3 text-tab-label font-medium text-inverse outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                                  : 'relative flex min-w-0 flex-1 cursor-pointer items-center justify-center px-3 text-tab-label text-primary/60 outline-none hover:bg-surface-hover hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
                        }
                        role="tab"
                        onClick={(): void => onValueChange(item.id)}
                    >
                        <span className="truncate">{item.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
