'use client'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import mascotAsset from '../assets/checkin-mascot.png'

interface DailyCheckinDialogProps {
    readonly open: boolean
    readonly totalDays: number
    readonly error: string
    readonly onCheckin: () => void
}

export function DailyCheckinDialog({
    open,
    totalDays,
    error,
    onCheckin,
}: DailyCheckinDialogProps): ReactElement {
    return (
        <TldDialog
            open={open}
            onOpenChange={(): void => undefined}
            title="每日打卡"
            size="fit-wide"
            density="compact"
            showHeader={false}
            showCloseButton={false}
            showCancelButton={false}
            showConfirmButton={false}
            closeOnEscape={false}
            closeOnBackdrop={false}
        >
            <div className="relative flex flex-col items-center gap-4 px-5 py-6 md:block md:h-[210px] md:pl-[174px] md:pr-[49px] md:pt-[30px]">
                <div className="relative size-[120px] shrink-0 md:absolute md:left-[30px] md:top-[45px]">
                    <span
                        aria-hidden="true"
                        className="absolute left-[23px] top-[23px] size-[75px] rounded-full bg-checkin-glow blur-[20px]"
                    />
                    <img
                        src={mascotAsset.src}
                        alt="拿着签到日历的漫奇云朵"
                        width={120}
                        height={120}
                        className="relative size-[120px]"
                    />
                </div>
                <div className="w-full min-w-0">
                    <p className="text-body-tight font-normal text-secondary">上线打卡喽～</p>
                    <p className="mt-2 flex items-baseline text-xl font-medium leading-[34px] text-primary">
                        <span>已累计打卡</span>
                        <strong className="text-2xl font-medium leading-[34px] text-checkin-highlight">
                            {totalDays}天
                        </strong>
                        <span>！</span>
                    </p>
                    <div className="mt-[7px] grid max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 md:w-[337px]">
                        <TldProgressBar
                            ariaLabel="千天签到进度"
                            max={1000}
                            value={totalDays}
                            size="large"
                            showValue={false}
                        />
                        <span className="min-w-[47px] text-action-label-small text-secondary">
                            <span className="text-checkin-highlight">{totalDays}</span>/1000
                        </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 text-action-label-small text-primary">
                        <p>加油坚持1000天</p>
                        <p>看看会发生什么神奇的事情！</p>
                    </div>
                </div>
                <div className="w-full md:absolute md:bottom-[25px] md:right-[48px] md:w-[136px]">
                    <TldButton size="slim-tall" fullWidth onClick={onCheckin}>
                        立即打卡
                    </TldButton>
                </div>
                {error ? (
                    <p
                        role="alert"
                        className="text-action-label-small text-danger md:absolute md:bottom-1 md:left-[174px]"
                    >
                        {error}
                    </p>
                ) : null}
            </div>
        </TldDialog>
    )
}
