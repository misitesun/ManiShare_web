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
    const tabListClassName =
        variant === 'underline'
            ? 'flex h-[62px] w-full min-w-max border-b border-strong'
            : 'flex h-[46px] w-full overflow-hidden rounded-lg border border-strong bg-surface'

    return (
        <div aria-label={ariaLabel} className={tabListClassName} role="tablist">
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
                                  ? 'flex min-w-0 flex-1 cursor-pointer items-center justify-center bg-linear-to-r from-brand-start to-brand-end px-3 text-tab-label font-medium text-inverse'
                                  : 'flex min-w-0 flex-1 cursor-pointer items-center justify-center px-3 text-tab-label text-primary/60 transition-colors hover:bg-surface-hover hover:text-primary'
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
