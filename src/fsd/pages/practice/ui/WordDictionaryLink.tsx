import type { ReactElement, ReactNode } from 'react'
import { getWordDictionaryUrl } from '../model/word-dictionary'

interface WordDictionaryLinkProps {
    readonly word: string
    readonly disabled: boolean
    readonly appearance: 'front' | 'analysis'
    readonly children: ReactNode
}

/** 两面使用同一原生外链；Electron由主进程词典白名单交给系统浏览器。 */
export function WordDictionaryLink({
    word,
    disabled,
    appearance,
    children,
}: WordDictionaryLinkProps): ReactElement {
    const url = getWordDictionaryUrl(word)
    const unavailable = disabled || url === null
    return (
        <a
            data-word-dictionary-link
            href={unavailable ? undefined : (url ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查词"
            aria-disabled={unavailable || undefined}
            tabIndex={unavailable ? -1 : undefined}
            className={
                appearance === 'front'
                    ? 'inline-flex size-8 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus aria-disabled:cursor-default'
                    : 'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-practice-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus aria-disabled:cursor-default md:size-8'
            }
        >
            {children}
        </a>
    )
}
