import type { ReactElement } from 'react'
import { TldCircularProgress } from '../../../shared/ui/tld-progress-bar'

export function AttentionProgress(): ReactElement {
    return (
        <article className="h-[105px] rounded-xl bg-linear-to-r from-brand-start to-brand-end p-px">
            <div className="flex h-full min-w-0 items-center justify-between gap-4 rounded-[11px] bg-canvas px-5">
                <h1 className="min-w-0 text-sm font-semibold leading-6 tracking-[0.01em] text-primary md:text-lg md:leading-7 xl:text-xl xl:leading-8 min-[1920px]:text-[22px] min-[1920px]:leading-9">
                    用你的注意力填满一千小时，
                    <br />
                    就能练成任何你所需要的技能。
                </h1>
                <TldCircularProgress
                    ariaLabel="千小时注意力进度"
                    detailLabel="0.12h/1000h"
                    max={100}
                    percentageLabel="0.12%"
                    value={0.12}
                />
            </div>
        </article>
    )
}
