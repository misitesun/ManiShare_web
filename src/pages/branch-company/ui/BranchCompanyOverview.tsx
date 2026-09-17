import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import pendingSettlementIconSource from '../assets/pending-settlement.svg'
import withdrawableBalanceIconSource from '../assets/withdrawable-balance.svg'

export function BranchCompanyOverview(): ReactElement {
    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,445fr)_minmax(0,751fr)]">
            <section className="flex min-h-[110px] items-center rounded-xl bg-surface-raised px-4 py-5 md:px-[30px]">
                <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-brand-start/20">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[31px]"
                        src={pendingSettlementIconSource}
                    />
                </span>
                <span className="ml-3 text-card-title text-secondary">待结算</span>
                <strong className="ml-auto whitespace-nowrap text-danger">
                    <span className="text-card-title font-normal">¥</span>
                    <span className="text-page-title font-normal">500</span>
                </strong>
            </section>

            <section className="flex min-h-[110px] flex-col gap-4 rounded-xl bg-surface-raised px-4 py-5 md:px-[30px] lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center">
                    <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-accent-green/20">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-[29px]"
                            src={withdrawableBalanceIconSource}
                        />
                    </span>
                    <span className="ml-3 min-w-0">
                        <span className="block text-body text-secondary">可提现金额</span>
                        <strong className="mt-1 block whitespace-nowrap text-accent-green">
                            <span className="text-card-title font-normal">¥</span>
                            <span className="text-page-title font-normal">500</span>
                        </strong>
                    </span>
                </div>
                <div className="w-full shrink-0 lg:w-[350px]">
                    <TldButton fullWidth>立即提现</TldButton>
                </div>
            </section>
        </div>
    )
}
