import type { ReactElement } from 'react'
import type { PracticeCommand } from '../model/practice-command-types'
import type { PracticeFooterItem } from '../model/practice-footer'
import { formatPracticeShortcut } from '../model/practice-footer'

interface PracticeFooterProps {
    readonly items: readonly PracticeFooterItem[]
    readonly onAction: (action: PracticeCommand) => void
    readonly blocked?: boolean
}

function DirectionIcon({ next }: { readonly next: boolean }): ReactElement {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
        >
            <path
                d={next ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function PlayIcon(): ReactElement {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2" />
            <path d="m11 8 9 6-9 6Z" fill="currentColor" />
        </svg>
    )
}

function ShortcutLabels({
    shortcuts,
}: {
    readonly shortcuts: readonly string[]
}): ReactElement | null {
    if (shortcuts.length === 0) return null
    const labels = shortcuts.map(formatPracticeShortcut)
    const first = labels[0]
    const second = labels[1]
    const pair =
        labels.length === 2 &&
        first?.endsWith('←') &&
        second?.endsWith('→') &&
        first.slice(0, -1) === second.slice(0, -1)
            ? `${first}/${second.slice(-1)}`
            : labels.join(' / ')
    return (
        <kbd className="hidden shrink-0 font-sans font-normal text-practice-control-text md:inline">
            {pair}
        </kbd>
    )
}

function FooterItemContent({ item }: { readonly item: PracticeFooterItem }): ReactElement {
    if (item.id === 'playback')
        return (
            <>
                <span className="md:hidden">{item.label}</span>
                <span className="hidden md:inline-flex">
                    <PlayIcon />
                </span>
            </>
        )
    return (
        <>
            {item.id === 'previous' && <DirectionIcon next={false} />}
            <ShortcutLabels shortcuts={item.shortcuts} />
            <span
                className={
                    item.size === 'direction'
                        ? 'hidden shrink-0 text-practice-control-text md:inline'
                        : 'shrink-0 text-practice-control-text/60'
                }
            >
                {item.label}
            </span>
            {item.id === 'next' && <DirectionIcon next />}
        </>
    )
}

export function PracticeFooter({
    items,
    onAction,
    blocked = false,
}: PracticeFooterProps): ReactElement | null {
    if (items.length === 0) return null
    const reading = items.length === 3 && items[1]?.id === 'playback'
    return (
        <footer
            data-practice-footer
            aria-label="练习底部操作"
            className="fixed inset-x-0 bottom-0 z-30 h-[calc(100px+env(safe-area-inset-bottom))] overflow-x-auto bg-practice-background px-3 pb-[env(safe-area-inset-bottom)]"
        >
            <div
                data-practice-footer-row
                className={
                    reading
                        ? 'mx-auto flex h-[100px] w-max min-w-max items-center gap-2 md:gap-[23px]'
                        : 'mx-auto flex h-[100px] w-max min-w-max items-center gap-2 md:gap-5'
                }
            >
                {items.map((item) => {
                    if (item.kind === 'hint' || !item.action)
                        return (
                            <div
                                key={item.id}
                                data-practice-footer-item={item.id}
                                className={
                                    item.id === 'navigation'
                                        ? 'hidden min-h-10 min-w-[136px] shrink-0 items-center justify-center gap-[10px] rounded-lg border border-practice-control-text/50 px-[10px] text-label-regular font-normal md:inline-flex xl:h-8 xl:min-h-8'
                                        : item.id === 'input'
                                          ? 'hidden min-h-10 min-w-[90px] shrink-0 items-center justify-center gap-[5px] rounded-lg border border-practice-control-text/50 px-[8px] text-label-regular font-normal md:inline-flex xl:h-8 xl:min-h-8'
                                          : 'inline-flex min-h-10 min-w-0 shrink-0 items-center justify-center gap-[5px] rounded-lg border border-practice-control-text/50 px-[8px] text-label-regular font-normal md:min-w-[90px] xl:h-8 xl:min-h-8'
                                }
                                aria-disabled={item.disabled || undefined}
                            >
                                <FooterItemContent item={item} />
                            </div>
                        )
                    const command = item.action
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={item.label}
                            aria-expanded={item.expanded}
                            data-practice-footer-item={item.id}
                            data-practice-footer-action={command}
                            disabled={blocked || item.disabled}
                            onClick={(): void => onAction(command)}
                            className={
                                item.id === 'read-aloud'
                                    ? 'hidden min-h-10 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-practice-control-text/50 px-[10px] text-label-regular font-normal outline-offset-2 hover:bg-practice-control-text/10 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:inline-flex md:min-w-24 xl:h-8 xl:min-h-8'
                                    : item.size === 'playback'
                                      ? 'inline-flex min-h-10 min-w-0 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-practice-control-text/50 px-[10px] text-label-regular text-practice-control-text outline-offset-2 hover:bg-practice-control-text/10 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:w-10 md:border-0 md:p-0 xl:h-7 xl:min-h-7 xl:w-7'
                                      : item.size === 'direction'
                                        ? 'inline-flex min-h-10 w-10 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-practice-control-text/50 px-1 text-label-regular font-normal outline-offset-2 hover:bg-practice-control-text/10 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:w-auto md:min-w-20 xl:h-8 xl:min-h-8'
                                        : item.size === 'panel' || item.size === 'primary'
                                          ? 'inline-flex min-h-10 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-practice-control-text/50 px-[10px] text-label-regular font-normal outline-offset-2 hover:bg-practice-control-text/10 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:min-w-[88px] xl:h-8 xl:min-h-8'
                                          : 'inline-flex min-h-10 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-practice-control-text/50 px-[10px] text-label-regular font-normal outline-offset-2 hover:bg-practice-control-text/10 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:min-w-24 xl:h-8 xl:min-h-8'
                            }
                        >
                            <FooterItemContent item={item} />
                        </button>
                    )
                })}
            </div>
        </footer>
    )
}
