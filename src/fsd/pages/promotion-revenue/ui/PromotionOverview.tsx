'use client'

import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { VipStewardQr } from './VipStewardQr'
import clicksIconSourceAsset from '../assets/clicks.svg'
import copyIconSourceAsset from '../assets/copy.svg'
import dealsIconSourceAsset from '../assets/deals.svg'
import registrationsIconSourceAsset from '../assets/registrations.svg'
import withdrawIconSourceAsset from '../assets/withdraw.svg'

const clicksIconSource: string = clicksIconSourceAsset.src
const copyIconSource: string = copyIconSourceAsset.src
const dealsIconSource: string = dealsIconSourceAsset.src
const registrationsIconSource: string = registrationsIconSourceAsset.src
const withdrawIconSource: string = withdrawIconSourceAsset.src

export function PromotionOverview(): ReactElement {
    return (
        <>
            <section className="flex min-h-[120px] items-center gap-4 rounded-xl bg-surface-raised px-4 py-[18px] md:gap-[15px] md:px-[22px]">
                <VipStewardQr />
                <div className="min-w-0 text-label leading-[21px] text-content-strong">
                    <p>
                        亲爱的<span className="font-medium text-warning">VIP会员</span>
                        ，您的专属VIP小管家已就位！添加小管家，即可被邀请进入VIP群
                    </p>
                    <p className="mt-[11px]">想参与推广、边学边赚的小伙伴，欢迎与小管家聊聊～</p>
                </div>
            </section>

            <section className="mt-4 rounded-xl bg-surface-raised p-4">
                <h2 className="text-body font-medium text-content-strong">我的邀请链接</h2>
                <p className="mt-2.5 text-label text-hint">
                    复制链接给朋友，朋友通过此链接注册并消费，您将获得佣金
                </p>
                <div className="mt-[7px] flex flex-col gap-3 md:flex-row md:gap-4">
                    <div className="flex min-w-0 flex-1 items-center">
                        <span className="flex h-[34px] min-w-0 flex-1 items-center rounded border border-strong px-2.5 text-label text-accent-green">
                            <span className="truncate">www.manishare.cn/love/8位邀请码</span>
                        </span>
                        <span className="shrink-0">
                            <TldButton size="mini" variant="solid">
                                复制邀请链接
                            </TldButton>
                        </span>
                    </div>
                    <div className="flex h-[34px] min-w-0 shrink-0 items-center rounded border border-strong px-2.5 md:w-[min(357px,40%)]">
                        <span className="text-label font-medium text-accent-green">邀请码：</span>
                        <span className="truncate text-label text-content-strong">12345678</span>
                        <button
                            type="button"
                            aria-label="复制邀请码"
                            className="ml-auto grid size-5 shrink-0 cursor-pointer place-items-center rounded outline-offset-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
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

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,715fr)_minmax(300px,481fr)]">
                <section className="grid gap-5 rounded-xl bg-surface-raised p-5 md:grid-cols-3 md:gap-3 xl:min-h-[127px] xl:gap-2 xl:px-6 xl:py-8 xl:min-[1920px]:flex xl:min-[1920px]:justify-between xl:min-[1920px]:pl-9 xl:min-[1920px]:pr-[37px] xl:min-[1920px]:pt-8 xl:min-[1920px]:pb-[31px]">
                    <div className="flex min-w-0 items-center gap-3 xl:min-[1920px]:items-start">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-metric-blue xl:min-[1920px]:size-16">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-9"
                                src={clicksIconSource}
                            />
                        </span>
                        <span className="xl:min-[1920px]:w-[99px]">
                            <span className="block text-label tracking-[0.01em] text-content-strong">
                                分享链接点击数
                            </span>
                            <strong className="mt-2 block text-[24px] font-medium leading-[34px] tracking-[0.01em] text-content-strong">
                                18
                            </strong>
                        </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-3 xl:min-[1920px]:items-start">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-metric-purple xl:min-[1920px]:size-16">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-9"
                                src={registrationsIconSource}
                            />
                        </span>
                        <span className="xl:min-[1920px]:w-[65px]">
                            <span className="block text-label tracking-[0.01em] text-content-strong">
                                注册总数
                            </span>
                            <strong className="mt-2 block text-[24px] font-medium leading-[34px] tracking-[0.01em] text-content-strong">
                                8
                            </strong>
                        </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-3 xl:min-[1920px]:items-start">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-metric-green xl:min-[1920px]:size-16">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-9"
                                src={dealsIconSource}
                            />
                        </span>
                        <span className="xl:min-[1920px]:w-[62px]">
                            <span className="block text-label tracking-[0.01em] text-content-strong">
                                成交总数
                            </span>
                            <strong className="mt-2 block text-[24px] font-medium leading-[34px] tracking-[0.01em] text-content-strong">
                                39
                            </strong>
                        </span>
                    </div>
                </section>

                <section className="flex min-h-[127px] flex-col justify-between rounded-xl bg-surface-raised px-4 pb-4 pt-2.5">
                    <div className="flex h-10 items-center gap-[6px]">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-10 shrink-0"
                            src={withdrawIconSource}
                        />
                        <span className="text-body-tight tracking-[0.01em] text-content-strong">
                            可提现
                        </span>
                        <strong className="ml-auto translate-y-[3px] whitespace-nowrap text-[30px] font-medium leading-[42px] tracking-[0.01em] text-accent-green">
                            <span className="text-body-tight">¥</span>1000
                        </strong>
                    </div>
                    <div className="mt-[11px]">
                        <TldButton fullWidth size="plan">
                            立即提现
                        </TldButton>
                    </div>
                </section>
            </div>
        </>
    )
}
