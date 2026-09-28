'use client'
import type { ReactElement } from 'react'
export default function ErrorPage({ reset }: { readonly reset: () => void }): ReactElement {
    return (
        <main className="p-6 text-primary">
            <h1>页面加载失败</h1>
            <button className="cursor-pointer text-brand" onClick={reset}>
                重试
            </button>
        </main>
    )
}
