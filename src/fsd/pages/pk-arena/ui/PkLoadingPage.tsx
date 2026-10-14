import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import { PkSessionBackdrop } from './PkSessionBackdrop'
import title from '../assets/challenge-title.png'
import host from '../assets/loading-host-avatar.png'
import opponent from '../assets/loading-opponent-avatar.png'
import versus from '../assets/versus.png'

export function PkLoadingPage(): ReactElement {
    return (
        <main
            aria-label="PK匹配成功加载"
            className="relative isolate min-h-svh overflow-x-clip bg-canvas px-4 pb-10 pt-9 text-foreground md:px-8 md:pt-12 xl:min-[1920px]:min-h-[1080px] xl:min-[1920px]:pb-[90px] xl:min-[1920px]:pt-[87px]"
        >
            <PkSessionBackdrop loading />
            <header className="relative text-center">
                <h1>
                    <img
                        alt="英语挑战赛"
                        src={title.src}
                        className="mx-auto aspect-[731/244] w-full max-w-[731px] object-cover [mix-blend-mode:var(--app-blend-pk-art)]"
                    />
                </h1>
                <p className="text-[22px] leading-[32px] font-medium italic text-tab-inactive md:text-[32px] md:leading-[42px] xl:min-[1920px]:text-[40px] xl:min-[1920px]:leading-[48px]">
                    ---English Challenge---
                </p>
            </header>
            <section
                aria-label="匹配成功的对战双方"
                className="relative mx-auto mt-12 grid w-full max-w-[627px] grid-cols-[136fr_51fr_247fr_57fr_136fr] items-start xl:min-[1920px]:mt-[119px] xl:min-[1920px]:translate-x-[3.5px]"
            >
                <div className="flex min-w-0 flex-col items-center">
                    <img
                        alt="不落的太阳的头像"
                        src={host.src}
                        className="aspect-square w-full max-w-[136px] rounded-full object-cover"
                    />
                    <p className="mt-3 whitespace-nowrap text-[14px] leading-[24px] font-medium md:text-[20px] md:leading-[30px] xl:min-[1920px]:mt-5 xl:min-[1920px]:text-[24px] xl:min-[1920px]:leading-[34px]">
                        不落的太阳
                    </p>
                    <div className="mt-3 flex xl:min-[1920px]:mt-4">
                        <TldMembershipBadge tone="gold" label="黄金VIP" size="challenge" />
                    </div>
                </div>
                <img
                    alt="PK"
                    src={versus.src}
                    className="col-start-3 mt-[25px] aspect-[247/165] w-full object-cover"
                />
                <div className="col-start-5 flex min-w-0 flex-col items-center">
                    <img
                        alt="夏目友人的头像"
                        src={opponent.src}
                        className="aspect-square w-full max-w-[136px] rounded-full object-cover"
                    />
                    <p className="mt-3 whitespace-nowrap text-[14px] leading-[24px] font-medium md:text-[20px] md:leading-[30px] xl:min-[1920px]:mt-5 xl:min-[1920px]:text-[24px] xl:min-[1920px]:leading-[34px]">
                        夏目友人
                    </p>
                    <div className="mt-3 flex xl:min-[1920px]:mt-4">
                        <TldMembershipBadge tone="lifetime" label="终身VIP" size="challenge" />
                    </div>
                </div>
            </section>
            <section
                aria-label="对战加载进度"
                className="relative mx-auto mt-16 w-full max-w-[1084px] xl:min-[1920px]:mt-[166.6px]"
            >
                <div className="flex items-center justify-center gap-3 text-[16px] leading-[28px] md:gap-6 xl:min-[1920px]:text-[20px]">
                    <span aria-hidden="true" className="flex gap-3 md:gap-6">
                        <span className="size-2 rounded-full bg-foreground md:size-3" />
                        <span className="size-2 rounded-full bg-loading-dot-middle md:size-3" />
                        <span className="size-2 rounded-full bg-loading-dot-dim md:size-3" />
                    </span>
                    <p>正在加载中</p>
                    <span aria-hidden="true" className="flex gap-3 md:gap-6">
                        <span className="size-2 rounded-full bg-loading-dot-dim md:size-3" />
                        <span className="size-2 rounded-full bg-loading-dot-middle md:size-3" />
                        <span className="size-2 rounded-full bg-foreground md:size-3" />
                    </span>
                </div>
                <div className="mt-5 xl:min-[1920px]:mt-[33px]">
                    <TldProgressBar
                        ariaLabel="PK演示加载进度"
                        value={72}
                        max={100}
                        size="challenge"
                        valueFormat="percentage"
                    />
                </div>
            </section>
            <p className="sr-only">
                本地匹配成功示例，固定展示72%加载进度，后续练习暂未开发。可使用浏览器返回回到匹配页。
            </p>
        </main>
    )
}
