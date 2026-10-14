'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import illustrationAsset from '../assets/redesign/checkin-illustration.png'
import shareAsset from '../assets/redesign/share.svg'
export function CheckinIllustration(): ReactElement {
    const [sharing, setSharing] = useState(false)
    return (
        <>
            <section
                aria-label="打卡陪伴展示"
                className="relative h-[520px] min-w-0 overflow-hidden rounded-xl md:h-[620px] xl:min-[1440px]:h-[738px]"
            >
                <img
                    src={illustrationAsset.src}
                    alt="长着透明翅膀的女孩在夜晚专注学习"
                    width={415}
                    height={738}
                    className="absolute inset-0 size-full object-cover"
                />
                <div
                    aria-label="示例日期：9月23日，星期五"
                    className="absolute left-4 top-4 flex items-center gap-2 text-media-foreground"
                >
                    <div>
                        <p className="text-[34px] font-medium leading-none">23</p>
                        <p className="mt-1 text-body uppercase opacity-70">Sep</p>
                    </div>
                    <p className="text-[10px] leading-4 opacity-70">
                        星<br />期<br />五
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="分享打卡展示"
                    onClick={(): void => setSharing(true)}
                    className="absolute right-2 top-2 grid size-11 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
                >
                    <img src={shareAsset.src} alt="" aria-hidden="true" width={36} height={36} />
                </button>
                <div className="absolute inset-x-3 bottom-10 space-y-2 text-center text-body text-media-foreground">
                    <p>已有20,983名玩家陪你打卡，</p>
                    <p>日日精进，顶峰相见！</p>
                </div>
            </section>
            <TldDialog
                open={sharing}
                title="分享打卡"
                size="small"
                showCancelButton={false}
                confirmLabel="知道了"
                content="当前为打卡展示示例，分享海报功能暂未接入。"
                onOpenChange={setSharing}
            />
        </>
    )
}
