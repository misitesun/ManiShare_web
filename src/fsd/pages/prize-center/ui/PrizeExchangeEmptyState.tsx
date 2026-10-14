'use client'

import type { ReactElement } from 'react'
import exchangeExpectation from '../assets/exchange-expectation.png'

export function PrizeExchangeEmptyState(): ReactElement {
    return (
        <div className="flex flex-col items-center xl:min-[1920px]:translate-x-[5px]">
            <img
                alt=""
                className="h-[128px] w-[160px] object-contain md:h-[144px] md:w-[180px] xl:min-[1920px]:h-[160px] xl:min-[1920px]:w-[200px]"
                src={exchangeExpectation.src}
            />
            <p className="mt-[13px] text-body-tight text-hint">敬请期待～</p>
        </div>
    )
}
