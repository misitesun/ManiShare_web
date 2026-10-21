import type { ReactElement } from 'react'
import crystalAsset from '../assets/word-spelling-crystal.png'

/** 仅显示本轮演示奖励，不代表账户余额或真实发放结果。 */
export function WordSpellingCrystals({ value }: { readonly value: number }): ReactElement {
    return (
        <output
            data-word-spelling-crystals
            aria-label="本轮黄晶"
            aria-live="polite"
            aria-atomic="true"
            className="inline-flex min-h-10 shrink-0 items-center gap-[3px] text-[16px] font-medium leading-[normal] text-practice-crystal xl:min-h-6"
        >
            <img src={crystalAsset.src} alt="" width={24} height={24} className="shrink-0" />
            <span className="sr-only">本轮黄晶：</span>
            <span>{value}</span>
        </output>
    )
}
