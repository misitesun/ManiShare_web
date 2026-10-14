import type { ReactElement } from 'react'
import unavailableAsset from '../assets/promotion-unavailable.png'

export function PromotionUnavailable(): ReactElement {
    return (
        <section
            aria-label="我的推广奖励"
            className="grid min-h-[calc(100svh-80px)] min-w-0 content-center justify-items-center px-3 pb-16 md:px-4 md:pb-[160px] xl:pb-[210px]"
        >
            <img
                alt=""
                aria-hidden="true"
                className="h-[133.6px] w-40 object-contain md:h-[167px] md:w-[200px]"
                src={unavailableAsset.src}
            />
            <h1 className="mt-[26px] text-section-title font-medium text-content-strong xl:min-[1920px]:translate-x-1">
                温馨提示
            </h1>
            <p className="mt-[26px] text-center text-body-notice text-hint">
                亲爱的小伙伴，未开通畅学卡，暂时无法获得推广奖励
            </p>
        </section>
    )
}
