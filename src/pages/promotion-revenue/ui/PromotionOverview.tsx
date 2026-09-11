import type { ReactElement } from 'react'
import { projectConstants } from '../../../shared/constants'
import { TldButton } from '../../../shared/ui/tld-button'
import clicksIconSource from '../assets/clicks.svg'
import copyIconSource from '../assets/copy.svg'
import dealsIconSource from '../assets/deals.svg'
import registrationsIconSource from '../assets/registrations.svg'
import withdrawIconSource from '../assets/withdraw.svg'

export function PromotionOverview(): ReactElement {
    return (
        <>
            <section className="flex min-h-[120px] items-center gap-4 rounded-xl bg-surface-raised px-4 py-4 md:px-7">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-16 shrink-0 object-contain xl:min-[1920px]:size-[84px]"
                    src={projectConstants.assets.mascotSource}
                />
                <p className="text-label leading-7 text-secondary">
                    亲爱的<span className="text-warning">VIP会员</span>
                    ，您的专属VIP小管家已就位！添加小管家，即可被邀请进入VIP群，享受专属答疑服务想参与推广、
                    <br className="hidden md:block" />
                    一起搞钱的小伙伴，也欢迎与小管家聊聊~
                </p>
            </section>

            <section className="mt-4 rounded-xl bg-surface-raised p-4 md:px-5 md:py-4">
                <h2 className="text-card-title font-medium text-primary">我的推广链接</h2>
                <p className="mt-2 text-label text-muted">
                    复制链接给朋友，还有通过此链接注册并消费，您将获得佣金
                </p>
                <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <div className="flex min-w-0 flex-1 items-center rounded border border-strong">
                        <span className="min-w-0 flex-1 truncate px-3 text-label text-accent-green">
                            https://manqishuo.www.com
                        </span>
                        <TldButton size="compact">复制推广链接</TldButton>
                    </div>
                    <div className="flex h-8 shrink-0 items-center gap-2 rounded border border-strong px-3 md:min-w-[356px]">
                        <span className="text-label text-accent-green">邀请码:</span>
                        <span className="text-label text-secondary">12345678</span>
                        <button
                            type="button"
                            aria-label="复制邀请码"
                            className="ml-auto grid size-6 cursor-pointer place-items-center rounded transition-colors hover:bg-surface-hover"
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-5 [filter:var(--app-filter-shell-icon)]"
                                src={copyIconSource}
                            />
                        </button>
                    </div>
                </div>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.48fr)_minmax(300px,1fr)]">
                <section className="grid gap-5 rounded-xl bg-surface-raised p-5 md:grid-cols-3 md:gap-3 md:px-9 md:py-8">
                    <div className="flex items-center gap-3">
                        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-accent-blue/15">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-10"
                                src={clicksIconSource}
                            />
                        </span>
                        <span>
                            <span className="block text-label text-secondary">分享链接点击数</span>
                            <strong className="mt-1 block text-section-title font-normal text-primary">
                                18
                            </strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-brand-start/20">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-10"
                                src={registrationsIconSource}
                            />
                        </span>
                        <span>
                            <span className="block text-label text-secondary">注册总数</span>
                            <strong className="mt-1 block text-section-title font-normal text-primary">
                                8
                            </strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-accent-green/15">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-10"
                                src={dealsIconSource}
                            />
                        </span>
                        <span>
                            <span className="block text-label text-secondary">成交总数</span>
                            <strong className="mt-1 block text-section-title font-normal text-primary">
                                39
                            </strong>
                        </span>
                    </div>
                </section>

                <section className="flex flex-col justify-between rounded-xl bg-surface-raised p-4">
                    <div className="flex items-center gap-3">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-10 shrink-0"
                            src={withdrawIconSource}
                        />
                        <span className="text-card-title text-secondary">可提现</span>
                        <strong className="ml-auto text-page-title font-normal text-accent-green">
                            ¥1000
                        </strong>
                    </div>
                    <div className="mt-4">
                        <TldButton fullWidth>立即提现</TldButton>
                    </div>
                </section>
            </div>
        </>
    )
}
