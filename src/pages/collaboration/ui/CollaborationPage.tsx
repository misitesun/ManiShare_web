import type { ReactElement } from 'react'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import coCreateSource from '../assets/co-create.svg'
import earningsSource from '../assets/earnings.svg'
import exclusiveSource from '../assets/exclusive.svg'
import launchBenefitSource from '../assets/launch-benefit.svg'
import lifetimeSource from '../assets/lifetime.svg'
import moreBenefitsSource from '../assets/more-benefits.svg'
import pauseSource from '../assets/pause.svg'
import paymentSource from '../assets/payment.svg'

interface CollaborationBenefit {
    readonly iconSource: string
    readonly id: string
    readonly label: string
}

const collaborationBenefits: readonly CollaborationBenefit[] = [
    { id: 'lifetime', label: '终身畅享', iconSource: lifetimeSource },
    { id: 'co-create', label: '事业共创', iconSource: coCreateSource },
    { id: 'earnings', label: '持续收益', iconSource: earningsSource },
    { id: 'exclusive', label: '限量尊享', iconSource: exclusiveSource },
    { id: 'more', label: '更多权益', iconSource: moreBenefitsSource },
]

function CollaborationOffer(): ReactElement {
    return (
        <section
            aria-label="漫奇联创天使首发福利"
            className="grid shrink-0 gap-6 rounded-[20px] bg-linear-to-r from-brand-start/50 to-brand-end/50 px-5 py-6 md:px-8 min-[1440px]:h-[208px] min-[1440px]:grid-cols-[minmax(340px,1fr)_670px] min-[1440px]:items-center min-[1440px]:gap-10 min-[1440px]:px-10 min-[1440px]:py-6"
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <div className="inline-flex h-[38px] items-center gap-1 rounded-lg bg-inverse/20 px-2.5 text-card-title text-inverse">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-6 shrink-0"
                            src={launchBenefitSource}
                        />
                        <span>
                            首发福利仅限
                            <strong className="font-medium text-danger">999</strong>名
                        </span>
                    </div>
                    <img alt="" aria-hidden="true" className="size-7 shrink-0" src={pauseSource} />
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                    <p className="whitespace-nowrap font-medium text-inverse">
                        <span className="text-[24px] md:text-[30px]">¥ </span>
                        <span className="text-[34px] md:text-[40px]">999</span>
                        <span className="text-[24px] md:text-[30px]">.00</span>
                    </p>
                    <p className="text-card-title text-danger line-through">¥2999</p>
                </div>

                <div className="mt-4 max-w-[289px]">
                    <p className="mb-1.5 text-label text-inverse/60">限量553/999</p>
                    <TldProgressBar
                        ariaLabel="首发福利名额进度"
                        max={999}
                        showValue={false}
                        size="large"
                        value={717}
                    />
                </div>
            </div>

            <ul
                aria-label="漫奇联创天使权益"
                className="grid min-w-0 grid-cols-5 items-center gap-2 rounded-xl border border-inverse/15 bg-inverse/5 px-3 py-4 md:px-6 min-[1440px]:h-[118px] min-[1440px]:px-[30px] min-[1440px]:py-2.5"
            >
                {collaborationBenefits.map((benefit) => (
                    <li
                        key={benefit.id}
                        className="flex min-w-0 flex-col items-center justify-center gap-2 text-center md:gap-2.5"
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-8 shrink-0 md:size-[38px]"
                            src={benefit.iconSource}
                        />
                        <span className="whitespace-nowrap text-caption text-inverse/60 md:text-body">
                            {benefit.label}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function CollaborationPaymentBar(): ReactElement {
    return (
        <footer
            aria-label="漫奇联创天使支付"
            className="sticky bottom-0 z-20 grid min-h-[104px] shrink-0 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-b-[20px] bg-surface-raised px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:grid-cols-[auto_1fr_auto] md:px-8 min-[1440px]:static min-[1440px]:h-[82px] min-[1440px]:min-h-0 min-[1440px]:px-10 min-[1440px]:py-0"
        >
            <div className="flex items-center gap-2 text-body text-warning md:col-start-1 md:row-start-1">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-[30px] shrink-0"
                    src={paymentSource}
                />
                <span className="whitespace-nowrap">支付开通</span>
            </div>

            <p className="col-span-2 row-start-2 text-center text-label text-primary md:col-span-1 md:col-start-2 md:row-start-1 md:text-right md:text-body">
                支付即视为您已同意
                <span className="text-warning">《开通会员协议》</span>
            </p>

            <button
                type="button"
                className="col-start-2 row-start-1 inline-flex h-11 w-[120px] cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-brand-start to-brand-end text-action-label text-inverse outline-offset-2 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:col-start-3 md:h-[50px] md:w-40"
            >
                立即支付
            </button>
        </footer>
    )
}

export function CollaborationPage(): ReactElement {
    return (
        <section
            aria-label="漫奇联创天使"
            className="min-w-0 px-3 md:px-4 min-[1440px]:h-[calc(100dvh-5rem)] min-[1440px]:overflow-hidden"
        >
            <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1212px] min-w-0 flex-col gap-4 pb-0 pt-4 md:gap-6 md:pt-6 min-[1440px]:h-full min-[1440px]:min-h-0 min-[1440px]:gap-[30px] min-[1440px]:pb-6 min-[1440px]:pt-11">
                <CollaborationOffer />

                <div className="flex min-h-0 min-w-0 flex-col min-[1440px]:flex-1">
                    <article
                        aria-label="漫奇联创天使详情"
                        tabIndex={0}
                        className="min-h-[32rem] rounded-t-[20px] bg-surface px-5 py-6 outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-focus md:min-h-[36rem] md:px-8 min-[1440px]:min-h-0 min-[1440px]:flex-1 min-[1440px]:overflow-y-auto min-[1440px]:overscroll-contain min-[1440px]:px-10 [scrollbar-color:var(--app-color-border-strong)_transparent] [scrollbar-width:thin]"
                    />
                    <CollaborationPaymentBar />
                </div>
            </div>
        </section>
    )
}
