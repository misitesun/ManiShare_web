import * as React from 'react'
import { Link } from 'react-router-dom'
import type { To } from 'react-router-dom'

const arrowLeftSource = new URL('./assets/arrow-left.svg', import.meta.url).href

export interface TldBackButtonProps {
    readonly to: To
    readonly label?: string
}

export function TldBackButton({ to, label = '返回' }: TldBackButtonProps): React.ReactElement {
    return (
        <Link
            to={to}
            className="inline-flex h-[38px] min-w-[112px] cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary/30 bg-surface px-4 text-label text-primary transition-colors hover:bg-surface-hover motion-reduce:transition-none"
        >
            <img
                alt=""
                aria-hidden="true"
                className="size-6 [filter:var(--app-filter-shell-icon)]"
                src={arrowLeftSource}
            />
            <span>{label}</span>
        </Link>
    )
}
