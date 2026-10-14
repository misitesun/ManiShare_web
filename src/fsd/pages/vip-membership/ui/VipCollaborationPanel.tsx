'use client'

import type { ReactElement, ReactNode } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import lifetimeAsset from '../assets/collaboration-lifetime.svg'
import earningsAsset from '../assets/collaboration-earnings.svg'
import mentoringAsset from '../assets/collaboration-mentoring.svg'
import localAsset from '../assets/collaboration-local.svg'
import plusAsset from '../assets/collaboration-plus.svg'

interface VipCollaborationPanelProps {
    readonly onExplore: () => void
}

interface CollaborationBenefitProps {
    readonly children: ReactNode
    readonly iconSource: string
    readonly title: string
    readonly compact?: boolean
}

const lifetimeSource: string = lifetimeAsset.src
const earningsSource: string = earningsAsset.src
const mentoringSource: string = mentoringAsset.src
const localSource: string = localAsset.src
const plusSource: string = plusAsset.src

function CollaborationBenefit({
    children,
    iconSource,
    title,
    compact = false,
}: CollaborationBenefitProps): ReactElement {
    return (
        <section className="flex min-w-0 flex-col items-center gap-[14px] text-center">
            <img alt="" aria-hidden="true" src={iconSource} className="size-[34px] shrink-0" />
            <div
                className={
                    compact ? 'w-full min-w-0 space-y-[9px]' : 'w-full min-w-0 space-y-[10px]'
                }
            >
                <h2 className="text-section-title font-medium tracking-[0.01em] text-primary">
                    {title}
                </h2>
                <div
                    className={
                        compact
                            ? 'space-y-2 text-body-tight tracking-[0.01em] text-primary [&>p]:xl:whitespace-nowrap'
                            : 'space-y-[10px] text-body-tight tracking-[0.01em] text-primary [&>p]:xl:whitespace-nowrap'
                    }
                >
                    {children}
                </div>
            </div>
        </section>
    )
}

export function VipCollaborationPanel({ onExplore }: VipCollaborationPanelProps): ReactElement {
    return (
        <div
            id="collaboration-vip-panel"
            className="mt-[34px] flex w-full flex-col items-center"
            role="tabpanel"
        >
            <div className="w-full max-w-[996px] rounded-[20px] border border-plan-border bg-collaboration-panel px-5 py-8 md:px-8 xl:min-h-[276px] xl:px-[54px] xl:pb-[34px] xl:pt-[35px]">
                <div className="relative grid gap-9 md:grid-cols-2 xl:grid-cols-[154px_135px_178px_179px] xl:gap-x-20 xl:gap-y-0">
                    <CollaborationBenefit iconSource={lifetimeSource} title="【终身VIP】">
                        <p>
                            解锁<span className="text-collaboration-violet">终身VIP</span>全量权益
                        </p>
                        <p>参与产品共创</p>
                        <p>建议优先采纳</p>
                    </CollaborationBenefit>
                    <CollaborationBenefit iconSource={earningsSource} title="【持续收益】">
                        <p>赠产品推广权</p>
                        <p>
                            首单<span className="text-collaboration-cyan">60%</span>
                        </p>
                        <p>
                            续费<span className="text-collaboration-cyan">50%</span>长期收益
                        </p>
                        <p>善意流动 生生不息</p>
                    </CollaborationBenefit>
                    <CollaborationBenefit iconSource={mentoringSource} title="【赋能陪跑】">
                        <p>
                            <span className="text-collaboration-blue">1v1</span>资深运营指导
                        </p>
                        <p>直播·短视频·AI培训</p>
                        <p>
                            线上+线下<span className="text-collaboration-blue">全域赋能</span>
                        </p>
                        <p>零基础也能轻松开启副业</p>
                    </CollaborationBenefit>
                    <CollaborationBenefit compact iconSource={localSource} title="【赋能陪跑】">
                        <p>表现优异者可优先申请</p>
                        <p>
                            成为线下区域<span className="text-collaboration-gold">独家</span>运营商
                        </p>
                        <p>
                            或玩咖空间<span className="text-collaboration-gold">负责人</span>
                        </p>
                        <p>深耕本地，共赢蓝海</p>
                    </CollaborationBenefit>
                    <img
                        alt=""
                        aria-hidden="true"
                        src={plusSource}
                        className="pointer-events-none absolute left-[182px] top-[103px] hidden size-6 xl:block"
                    />
                    <img
                        alt=""
                        aria-hidden="true"
                        src={plusSource}
                        className="pointer-events-none absolute left-[397px] top-[103px] hidden size-6 xl:block"
                    />
                    <img
                        alt=""
                        aria-hidden="true"
                        src={plusSource}
                        className="pointer-events-none absolute left-[652px] top-[103px] hidden size-6 xl:block"
                    />
                </div>
            </div>

            <div className="mt-12 w-full max-w-[996px] xl:mt-[78px]">
                <div className="flex w-full flex-col items-center gap-5 text-center text-body [&>p]:xl:whitespace-nowrap text-primary md:text-[18px] md:leading-[22px] xl:ml-[488px] xl:w-[388px]">
                    <p className="max-w-full xl:max-w-none xl:w-[395px]">太棒啦，你终于来啦～</p>
                    <p>
                        我是漫奇Mani，
                        <span className="bg-linear-to-b from-brand-start to-brand-end bg-clip-text text-transparent">
                            漫奇联创天使
                        </span>
                        们的忠实小伙伴。
                    </p>
                    <p className="max-w-full xl:max-w-none xl:w-[395px]">这里只留同频的人，</p>
                    <p className="max-w-full xl:max-w-none xl:w-[395px]">
                        点一点👇，看看这儿是不你刚好在找的地方...
                    </p>
                    <p className="max-w-full xl:max-w-none xl:w-[395px]">我们等你哦～</p>
                </div>
            </div>

            <p className="mt-12 text-center text-body-tight tracking-[0.01em] text-primary xl:mt-[110px]">
                不只是终身 VIP，更是漫奇说事业共创人
            </p>
            <div className="mt-8 w-full max-w-[498px] xl:mt-[42px]">
                <TldButton fullWidth size="plan-compact" onClick={onExplore}>
                    这就去看看
                </TldButton>
            </div>
        </div>
    )
}
