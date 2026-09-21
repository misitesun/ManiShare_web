import { useEffect, useId, useRef } from 'react'
import * as React from 'react'
import type { KeyboardEvent, ReactElement, ReactNode } from 'react'
import { TldMovingHighlight } from '../tld-moving-highlight'

export interface TldSelectOption {
    readonly value: string
    readonly label: string
}

export interface TldSelectProps {
    readonly label: string
    readonly value: string
    readonly options: readonly TldSelectOption[]
    readonly onValueChange: (value: string) => void
    readonly icon?: ReactNode
}

export function TldSelect({
    label,
    value,
    options,
    onValueChange,
    icon,
}: TldSelectProps): ReactElement {
    const [open, setOpen] = React.useState(false)
    const [activeOptionValue, setActiveOptionValue] = React.useState<string | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const id = useId()
    const selected = options.find((option) => option.value === value)
    const initialActiveValue = selected?.value ?? options[0]?.value ?? null

    useEffect(() => {
        if (!open) return
        const menu = menuRef.current
        const selectedItem = menu?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ;(selectedItem ?? menu?.querySelector<HTMLButtonElement>('button'))?.focus()
        function onPointerDown(event: PointerEvent): void {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
                setOpen(false)
                setActiveOptionValue(null)
            }
        }
        document.addEventListener('pointerdown', onPointerDown)
        return (): void => document.removeEventListener('pointerdown', onPointerDown)
    }, [open])

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
            setActiveOptionValue(null)
            triggerRef.current?.focus()
            return
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        if (!open) {
            setActiveOptionValue(initialActiveValue)
            setOpen(true)
            return
        }
        const buttons = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
        )
        const index = buttons.findIndex((button) => button === document.activeElement)
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        buttons[next]?.focus()
    }

    return (
        <div
            ref={rootRef}
            className="relative w-full"
            onKeyDown={onKeyDown}
            onBlur={(event): void => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false)
                    setActiveOptionValue(null)
                }
            }}
        >
            <button
                ref={triggerRef}
                id={`${id}-trigger`}
                type="button"
                aria-label={`${label}：${selected?.label ?? '请选择'}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? `${id}-menu` : undefined}
                className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-strong bg-surface px-3 text-label text-primary outline-offset-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none"
                onClick={(): void => {
                    if (open) {
                        setOpen(false)
                        setActiveOptionValue(null)
                        return
                    }
                    setActiveOptionValue(initialActiveValue)
                    setOpen(true)
                }}
            >
                <span className="flex min-w-0 items-center gap-1">
                    {icon}
                    <span className="truncate">{selected?.label ?? '请选择'}</span>
                </span>
                <span
                    aria-hidden="true"
                    className={
                        open
                            ? 'mb-[-4px] size-2 shrink-0 rotate-[225deg] border-b-2 border-r-2 border-primary/60 transition-transform duration-150 motion-reduce:transition-none'
                            : 'mt-[-4px] size-2 shrink-0 rotate-45 border-b-2 border-r-2 border-primary/60 transition-transform duration-150 motion-reduce:transition-none'
                    }
                />
            </button>
            <div
                ref={menuRef}
                id={`${id}-menu`}
                role="menu"
                inert={!open}
                aria-hidden={!open}
                aria-labelledby={`${id}-trigger`}
                className={
                    open
                        ? 'absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-[153px] origin-top translate-y-0 scale-100 overflow-y-auto rounded-2xl border border-strong bg-canvas/95 p-2 opacity-100 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
                        : 'pointer-events-none absolute left-0 top-full z-40 isolate mt-2 max-h-64 w-full min-w-[153px] origin-top -translate-y-1 scale-95 overflow-y-auto rounded-2xl border border-strong bg-canvas/95 p-2 opacity-0 shadow-xl backdrop-blur-xl transition-[opacity,transform,translate,scale] duration-150 motion-reduce:transition-none'
                }
            >
                <TldMovingHighlight
                    containerRef={menuRef}
                    activeKey={open ? activeOptionValue : null}
                    tone="surface"
                />
                {options.map((option) => (
                    <button
                        key={option.value}
                        data-highlight-key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={value === option.value}
                        tabIndex={-1}
                        className={
                            activeOptionValue === null && value === option.value
                                ? 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-lg bg-surface-raised px-3 py-2 text-left text-label text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus'
                                : 'group relative flex min-h-10 w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-label text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus'
                        }
                        onPointerEnter={(): void => setActiveOptionValue(option.value)}
                        onFocus={(): void => setActiveOptionValue(option.value)}
                        onClick={(): void => {
                            onValueChange(option.value)
                            setOpen(false)
                            setActiveOptionValue(null)
                            triggerRef.current?.focus()
                        }}
                    >
                        <span className="relative z-20">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
