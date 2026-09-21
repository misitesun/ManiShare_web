import type { ReactElement } from 'react'

export function PrizeExchangeEmptyState(): ReactElement {
    return (
        <div className="flex flex-col items-center">
            <div className="grid h-[210px] w-[237px] max-w-full place-items-center bg-secondary px-3 text-center text-body text-canvas">
                IP形象缺省图
            </div>
            <p className="mt-4 text-body text-secondary">敬请期待～</p>
        </div>
    )
}
