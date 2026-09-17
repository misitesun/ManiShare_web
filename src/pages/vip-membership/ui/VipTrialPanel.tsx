import type { ReactElement } from 'react'
import { notification } from '../../../shared/notification'
import { TldButton } from '../../../shared/ui/tld-button'
import benefitCheckSource from '../assets/benefit-check.svg'
import purchaseWarningSource from '../assets/purchase-warning.svg'

interface VipTrialCardContent {
    readonly actionLabel: string
    readonly actionVariant: 'primary' | 'secondary'
    readonly benefits: readonly string[]
    readonly description: string
    readonly durationBadge?: string
    readonly metric: string
    readonly metricSuffix?: string
    readonly title: string
}

const trialCards: readonly VipTrialCardContent[] = [
    {
        actionLabel: '立即续费',
        actionVariant: 'secondary',
        benefits: [
            '时长不限：告别免费版每天时长限制',
            '玩家俱乐部：加入漫奇说玩家俱乐部，玩中学，共成长',
        ],
        description: '仅限新用户领取',
        metric: '3天',
        title: '体验版·3天不限时',
    },
    {
        actionLabel: '获得分享链接',
        actionVariant: 'primary',
        benefits: [
            '分享获时长：分享1人注册，立得1天免费体验时长，人数越多，体验时长越久',
            '玩家俱乐部：加入漫奇说玩家俱乐部，玩中学，共成长',
        ],
        description: '分享获得免费体验时长',
        durationBadge: '体验时长：0天00:00:00',
        metric: '0人',
        metricSuffix: '/已分享',
        title: '萌芽版·每天30分钟',
    },
]

function PlayerClubIcon(): ReactElement {
    return (
        <div aria-hidden="true" className="flex shrink-0 items-center gap-2">
            <svg
                className="size-10 text-primary"
                fill="none"
                viewBox="0 0 40 40"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="12"
                    x="2"
                    y="2"
                />
                <rect fill="currentColor" height="4" rx="1" width="4" x="6" y="6" />
                <rect
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="12"
                    x="26"
                    y="2"
                />
                <rect fill="currentColor" height="4" rx="1" width="4" x="30" y="6" />
                <rect
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="12"
                    x="2"
                    y="26"
                />
                <rect fill="currentColor" height="4" rx="1" width="4" x="6" y="30" />
                <path
                    d="M26 26H32V32H26V26ZM34 26H38V30H34V26ZM26 34H30V38H26V34ZM32 32H38V38H32V32Z"
                    fill="currentColor"
                />
            </svg>
            <svg
                className="h-9 w-12 text-accent-green"
                fill="currentColor"
                viewBox="0 0 48 36"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M18 1C8.059 1 0 7.268 0 15c0 4.176 2.352 7.925 6.084 10.489L4.5 31l6.119-2.652C12.877 29.422 15.386 30 18 30c9.941 0 18-6.268 18-14S27.941 1 18 1Zm-6 13.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm12 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                <path d="M48 22.5C48 16.701 41.956 12 34.5 12c-.232 0-.463.005-.692.014.126.65.192 1.313.192 1.986 0 7.732-8.059 14-18 14-.322 0-.642-.007-.96-.02C17.875 32.117 23.26 35 29.5 35c1.984 0 3.868-.291 5.564-.815L39.5 36l-1.17-4.205C44.07 30.177 48 26.638 48 22.5ZM28 22a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm10 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
            </svg>
        </div>
    )
}

function VipTrialCard({ content }: { readonly content: VipTrialCardContent }): ReactElement {
    return (
        <article className="flex min-h-[742px] min-w-0 flex-col rounded-[20px] border border-strong bg-surface/50 px-5 pb-7 pt-7 shadow-panel md:px-8 xl:px-[50px]">
            <h2 className="text-section-title font-medium text-primary xl:text-[26px] xl:leading-9">
                {content.title}
            </h2>

            <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-[28px] font-medium leading-10 text-primary">
                    {content.metric}
                </span>
                {content.metricSuffix === undefined ? null : (
                    <span className="text-label text-secondary">{content.metricSuffix}</span>
                )}
                {content.durationBadge === undefined ? null : (
                    <span className="ml-auto rounded border border-accent-orange px-2 py-1 text-caption text-accent-orange">
                        {content.durationBadge}
                    </span>
                )}
            </div>

            <p className="mt-6 text-label text-secondary">{content.description}</p>

            <div className="mt-4">
                <TldButton
                    fullWidth
                    size="large"
                    variant={content.actionVariant}
                    onClick={(): void => notification.info(`${content.actionLabel}功能待接口接入`)}
                >
                    {content.actionLabel}
                </TldButton>
            </div>

            <ul className="mt-8 space-y-[13px] text-label text-primary">
                {content.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="mt-px size-[18px] shrink-0"
                            src={benefitCheckSource}
                        />
                        <span className="min-w-0">{benefit}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-auto pt-8">
                <div className="flex min-h-[80px] items-center justify-center gap-4 rounded-lg bg-surface-raised px-4 py-3 text-primary">
                    <PlayerClubIcon />
                    <div className="min-w-0">
                        <p className="text-label text-accent-green">玩家俱乐部</p>
                        <p className="mt-1 text-caption text-secondary">微信扫码加入专属学友社群</p>
                    </div>
                </div>

                <p className="mt-5 flex items-center justify-center gap-[7px] text-center text-label text-danger">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-6 shrink-0"
                        src={purchaseWarningSource}
                    />
                    <span>学习卡服务为虚拟产品，购买后不支持退款</span>
                </p>
            </div>
        </article>
    )
}

export function VipTrialPanel(): ReactElement {
    return (
        <div
            id="free-trial-panel"
            className="mt-10 grid w-full gap-[35px] xl:grid-cols-[470px_470px] xl:justify-center"
            role="tabpanel"
        >
            {trialCards.map((content) => (
                <VipTrialCard key={content.title} content={content} />
            ))}
        </div>
    )
}
