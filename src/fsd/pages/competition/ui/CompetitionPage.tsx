import type { ReactElement } from 'react'
import unavailableAsset from '../assets/competition-unavailable.png'

export function CompetitionPage(): ReactElement {
    return (
        <section
            aria-label="风采大赛"
            className="grid min-h-[calc(100svh-4rem)] min-w-0 content-center justify-items-center px-3 pb-16 md:px-4 md:pb-[160px] xl:min-h-[calc(100svh-5rem)] xl:pb-[217px]"
        >
            <img
                alt=""
                aria-hidden="true"
                width={200}
                height={200}
                className="size-40 object-contain md:size-[200px]"
                src={unavailableAsset.src}
            />
            <h1 className="text-section-title font-medium text-primary xl:min-[1920px]:translate-x-1">
                温馨提示
            </h1>
            <p className="mt-[26px] text-center text-body-notice text-hint">
                亲爱的小伙伴，功能正在开发中，敬请期待～
            </p>
        </section>
    )
}
