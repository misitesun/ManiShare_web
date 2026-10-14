'use client'

import { useState, type ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldGradientText } from '../../../shared/ui/tld-gradient-text'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { PkSessionBackdrop } from './PkSessionBackdrop'
import course from '../assets/matching-course.png'
import mode from '../assets/matching-mode.svg'
import hostCard from '../assets/matching-host-card.png'
import opponentCard from '../assets/matching-opponent-card.png'
import hostAvatar from '../assets/matching-host-avatar.png'
import placeholder from '../assets/opponent-placeholder.svg'
import flag from '../assets/host-flag.svg'
import robot from '../assets/robot.svg'
import versus from '../assets/versus.png'

interface PkMatchingPageProps {
    readonly onCancel: () => void
    readonly onStart: () => void
}

type MatchingDialog = 'cancel' | 'invite' | 'robot' | null

export function PkMatchingPage({ onCancel, onStart }: PkMatchingPageProps): ReactElement {
    const [dialog, setDialog] = useState<MatchingDialog>(null)
    return (
        <main
            aria-label="PK匹配中"
            className="relative isolate min-h-svh overflow-x-clip bg-canvas px-4 pb-10 pt-7 text-foreground md:px-8 md:pt-10 xl:px-[3.645833%] xl:min-[1920px]:min-h-[1080px] xl:min-[1920px]:pt-[47px]"
        >
            <PkSessionBackdrop />
            <header className="relative text-center">
                <h1 className="text-[28px] leading-[40px] font-normal tracking-[0.01em] md:text-[34px] xl:min-[1920px]:text-[40px]">
                    <TldGradientText
                        animated={false}
                        colors={[
                            'var(--app-color-challenge-start)',
                            'var(--app-color-challenge-end)',
                        ]}
                    >
                        --- 匹配中 ---
                    </TldGradientText>
                </h1>
                <p className="mt-3 text-label-regular tracking-[0.01em] text-match-warning md:text-[16px] md:leading-[25px] xl:min-[1920px]:mt-[21px] xl:min-[1920px]:text-[18px]">
                    （等待房主开启PK，请勿离开该页面）
                </p>
            </header>
            <section
                aria-label="对战课程"
                className="relative mt-7 flex min-w-0 flex-col gap-5 rounded-[24px] bg-match-panel/80 p-5 shadow-match-panel backdrop-blur-[6px] md:flex-row md:flex-wrap md:items-center xl:min-[1920px]:mt-[49px] xl:min-[1920px]:h-[228px] xl:min-[1920px]:flex-nowrap xl:min-[1920px]:py-5 xl:min-[1920px]:pr-[29px]"
            >
                <img
                    alt="发音基础练·小学英语音标入门"
                    src={course.src}
                    className="aspect-[348/188] w-full rounded-2xl object-cover md:w-[300px] xl:min-[1920px]:w-[348px] shrink-0"
                />
                <div className="min-w-0 md:w-[320px]">
                    <h2 className="text-card-title font-medium xl:min-[1920px]:text-[20px] xl:min-[1920px]:leading-[28px]">
                        520句轻松搞定三年级下册英语词组
                    </h2>
                    <p className="mt-[11px] text-body text-tab-inactive xl:min-[1920px]:text-[16px] xl:min-[1920px]:leading-[22px]">
                        Topic 1 - Classroom
                    </p>
                    <div className="mt-5 flex items-center gap-2.5 xl:min-[1920px]:mt-[50px]">
                        <span className="flex items-center gap-[5px] text-label-regular text-tab-inactive">
                            <img alt="" src={mode.src} width={20} height={20} />
                            听写模式
                        </span>
                        <span className="flex h-6 w-20 items-center justify-center rounded border border-match-writing text-label-regular text-match-writing">
                            抄写/默写
                        </span>
                    </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:ml-auto xl:w-auto xl:gap-5 xl:min-[1920px]:gap-10">
                    <button
                        type="button"
                        onClick={(): void => setDialog('cancel')}
                        className="h-12 cursor-pointer rounded-full border-2 border-match-action px-3 text-label text-match-action focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus xl:w-[184px] xl:min-[1920px]:h-14 xl:min-[1920px]:text-[18px] xl:min-[1920px]:leading-[25px]"
                    >
                        取消PK对战
                    </button>
                    <button
                        type="button"
                        onClick={(): void => setDialog('invite')}
                        className="h-12 cursor-pointer rounded-full border-2 border-match-action px-3 text-label text-match-action focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus xl:w-[184px] xl:min-[1920px]:h-14 xl:min-[1920px]:text-[18px] xl:min-[1920px]:leading-[25px]"
                    >
                        邀请用户参与对战
                    </button>
                    <button
                        type="button"
                        onClick={onStart}
                        className="h-12 cursor-pointer rounded-full bg-linear-to-r/srgb from-challenge-start to-challenge-end px-3 text-label text-media-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus xl:w-[184px] xl:min-[1920px]:h-14 xl:min-[1920px]:text-[18px] xl:min-[1920px]:leading-[25px]"
                    >
                        开启对战
                    </button>
                </div>
            </section>
            <section
                aria-label="对战双方"
                className="relative mx-auto mt-10 grid w-full max-w-[1138px] grid-cols-1 xl:grid-cols-[minmax(0,415fr)_minmax(0,220fr)_minmax(0,403fr)] items-start xl:min-[1920px]:mt-[143px] xl:min-[1920px]:translate-x-[19px] xl:min-[1920px]:grid-cols-[415fr_320fr_403fr]"
            >
                <div
                    aria-label="房主资料"
                    className="relative aspect-[415/277] w-full max-w-[415px] justify-self-center min-w-0 max-md:min-h-[225px]"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        src={hostCard.src}
                        className="absolute inset-0 h-full w-full object-fill"
                    />
                    <div className="absolute left-[36.39%] top-[5.78%] h-10 w-[90px] max-md:left-1/2 max-md:-translate-x-1/2">
                        <img alt="" src={flag.src} width={90} height={40} />
                        <span className="absolute left-[27px] top-[5px] text-[18px] leading-[25px] text-media-ink">
                            房主
                        </span>
                    </div>
                    <img
                        alt="不落的太阳的头像"
                        src={hostAvatar.src}
                        className="absolute left-[40%] top-[23.83%] size-[60px] rounded-full object-cover max-md:left-1/2 max-md:size-12 max-md:-translate-x-1/2"
                    />
                    <div className="absolute left-[25.78%] top-[49.1%] flex items-center gap-[13px] max-md:left-0 max-md:w-full max-md:flex-col max-md:gap-1">
                        <p className="whitespace-nowrap text-[14px] leading-[20px] font-medium text-media-foreground md:text-[18px] md:leading-[28px] xl:min-[1920px]:text-[20px]">
                            不落的太阳
                        </p>
                        <span className="flex h-7 w-[65px] items-center justify-center gap-[7px] rounded-lg bg-media-foreground/30 text-label-regular text-media-foreground">
                            <span className="size-2.5 rounded-full bg-match-online" />
                            在线
                        </span>
                    </div>
                    <div className="absolute left-[38.8%] top-[63.9%] max-md:left-1/2 max-md:top-[77%] max-md:-translate-x-1/2">
                        <TldMembershipBadge label="黄金VIP" tone="gold" size="waiting" />
                    </div>
                </div>
                <img
                    alt="PK"
                    src={versus.src}
                    className="my-6 aspect-[247/165] w-[120px] justify-self-center object-cover md:w-[160px] xl:my-0 xl:mt-[17.5%] xl:w-[77.19%] xl:justify-self-start xl:min-[1920px]:ml-[11px] xl:min-[1920px]:mt-14"
                />
                <div
                    aria-label="等待对手"
                    className="relative aspect-[403/280] w-full max-w-[403px] justify-self-center min-w-0 max-md:min-h-[225px]"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        src={opponentCard.src}
                        className="absolute inset-0 h-full w-full object-fill"
                    />
                    <div className="absolute left-[35.73%] top-[22.5%] flex w-[145px] flex-col items-center gap-[11px] max-lg:left-1/2 max-lg:w-full max-lg:-translate-x-1/2 max-md:gap-2">
                        <img
                            alt="等待对手的默认头像"
                            src={placeholder.src}
                            width={60}
                            height={60}
                        />
                        <p className="text-[12px] leading-[22px] text-media-foreground md:text-[16px]">
                            快去寻找对手...
                        </p>
                        <p className="whitespace-nowrap text-caption-tight text-media-foreground/60 md:text-label-regular">
                            准备一场精彩的PK吧！
                        </p>
                        <button
                            type="button"
                            onClick={(): void => setDialog('robot')}
                            className="flex h-7 w-[114px] cursor-pointer items-center justify-center gap-1.5 rounded border border-media-foreground text-label-regular text-media-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                            <img alt="" src={robot.src} width={18} height={18} />
                            添加机器人
                        </button>
                    </div>
                </div>
            </section>
            <p className="sr-only">当前为本地演示房间；邀请、机器人及真实匹配尚未接入。</p>
            <TldDialog
                open={dialog !== null}
                title={
                    dialog === 'cancel'
                        ? '取消PK对战'
                        : dialog === 'invite'
                          ? '邀请用户参与对战'
                          : '添加机器人'
                }
                content={
                    dialog === 'cancel'
                        ? '确认离开当前PK演示并返回大厅？此操作不会删除房间。'
                        : dialog === 'invite'
                          ? '邀请用户功能暂未接入。'
                          : '机器人功能暂未接入。'
                }
                showCancelButton={dialog === 'cancel'}
                confirmLabel={dialog === 'cancel' ? '确认取消' : '知道了'}
                onOpenChange={(open): void => {
                    if (!open) setDialog(null)
                }}
                onConfirm={(): void => {
                    if (dialog === 'cancel') onCancel()
                    setDialog(null)
                }}
            />
        </main>
    )
}
