'use client'

import type { ReactElement } from 'react'
import { notification } from '../../../shared/notification'
import { TldButton } from '../../../shared/ui/tld-button'
import benefitCheckAsset from '../assets/benefit-check.svg'
import clubWechatAsset from '../assets/trial-club-wechat.svg'
import clubQrAsset from '../assets/trial-club-qr.svg'

const benefitCheckSource: string = benefitCheckAsset.src
const clubWechatSource: string = clubWechatAsset.src
const clubQrSource: string = clubQrAsset.src

interface VipTrialPanelProps {
    readonly claimed: boolean
    readonly onClaim: () => void
}

interface TrialBenefitListProps {
    readonly sharing?: boolean
}

function TrialBenefits({ sharing = false }: TrialBenefitListProps): ReactElement {
    return (
        <ul
            className={
                sharing
                    ? 'mt-[30px] space-y-3 text-field-label text-primary'
                    : 'mt-[30px] space-y-[14px] text-field-label text-primary'
            }
        >
            <li className="flex gap-[6px]">
                <img
                    alt=""
                    aria-hidden="true"
                    className={sharing ? 'mt-0.5 size-[18px] shrink-0' : 'size-[18px] shrink-0'}
                    src={benefitCheckSource}
                />
                <span className="min-w-0">
                    {sharing
                        ? '分享获时长：分享1人注册，立得1天免费体验时长，人数越多，体验时长越久'
                        : '时长不限：告别免费版每天时长限制'}
                </span>
            </li>
            <li className="flex gap-[6px]">
                <img
                    alt=""
                    aria-hidden="true"
                    className={sharing ? 'mt-0.5 size-[18px] shrink-0' : 'size-[18px] shrink-0'}
                    src={benefitCheckSource}
                />
                <span className="min-w-0">玩家俱乐部：与同频小伙伴，玩中学，共成长</span>
            </li>
        </ul>
    )
}

function TrialFooter(): ReactElement {
    return (
        <div className="mt-auto pt-8">
            <div className="flex h-[95px] items-center justify-center rounded-[10px] bg-surface-raised">
                <div className="flex h-[45px] w-[194px] items-start gap-3">
                    <span
                        aria-hidden="true"
                        className="mt-[5px] size-9 shrink-0 bg-primary [mask-repeat:no-repeat] [mask-size:contain]"
                        style={{ maskImage: `url(${clubQrSource})` }}
                    />
                    <div className="min-w-0">
                        <div className="flex items-center gap-[7px] text-field-label text-accent-green">
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-4 shrink-0"
                                src={clubWechatSource}
                            />
                            <span>玩家俱乐部</span>
                        </div>
                        <p className="ml-[23px] mt-[6px] text-caption-tight text-hint">
                            微信扫码加入
                        </p>
                    </div>
                </div>
            </div>
            <p className="mt-[31px] text-center text-field-label text-plan-note">
                学习卡服务为虚拟产品，购买后不支持退款哦
            </p>
        </div>
    )
}

export function VipTrialPanel({ claimed, onClaim }: VipTrialPanelProps): ReactElement {
    return (
        <div
            id="free-trial-panel"
            className="mt-[41px] grid w-full max-w-[470px] gap-[35px] xl:max-w-[992px] xl:grid-cols-[470px_470px]"
            role="tabpanel"
        >
            <article
                aria-label="体验版"
                className="flex min-h-[742px] min-w-0 flex-col rounded-[20px] border border-plan-border bg-plan-surface px-5 pb-[27px] pt-[29px] md:px-[29px]"
            >
                <h2 className="text-section-title font-medium tracking-[0.01em] text-primary xl:text-[26px] xl:leading-9">
                    体验版·3天不限时
                </h2>
                <p className="mt-[21px] h-12 text-[28px] font-medium leading-[48px] tracking-[0.01em] text-primary md:text-[34px]">
                    3天
                </p>
                <p className="mt-[41px] text-body-tight text-hint">仅限新用户领取</p>
                <div className="mt-[22px]">
                    <TldButton
                        fullWidth
                        size="plan"
                        variant="subtle"
                        disabled={claimed}
                        onClick={onClaim}
                    >
                        {claimed ? '已领取' : '领取体验卡'}
                    </TldButton>
                </div>
                <TrialBenefits />
                <TrialFooter />
            </article>
            <article
                aria-label="萌芽版"
                className="flex min-h-[742px] min-w-0 flex-col rounded-[20px] border border-plan-border bg-plan-surface px-5 pb-[27px] pt-[29px] md:px-[29px]"
            >
                <h2 className="text-section-title font-medium tracking-[0.01em] text-primary xl:text-[26px] xl:leading-9">
                    萌芽版·每天30分钟
                </h2>
                <div className="mt-[21px] flex min-h-12 flex-wrap items-baseline gap-x-3 gap-y-2 text-primary">
                    <span className="text-[28px] font-medium leading-[48px] tracking-[0.01em] md:text-[34px]">
                        0人
                    </span>
                    <span className="text-action-label-compact">/已分享</span>
                    <span className="relative top-[3px] ml-auto inline-flex h-7 w-[166px] items-center justify-center self-center whitespace-nowrap rounded border border-plan-savings px-1 text-field-label text-plan-savings">
                        体验时长：0天00:00:00
                    </span>
                </div>
                <p className="mt-[41px] text-body-tight text-hint">分享获得免费体验时长</p>
                <div className="mt-[22px]">
                    <TldButton
                        fullWidth
                        size="plan"
                        onClick={(): void => notification.info('分享链接功能待接口接入')}
                    >
                        获得分享链接
                    </TldButton>
                </div>
                <TrialBenefits sharing />
                <TrialFooter />
            </article>
        </div>
    )
}
