'use client'

import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import mascotAsset from '../assets/pause/mascot.png'
import closeAsset from '../assets/pause/close.svg'

interface PracticePauseDialogProps {
    readonly open: boolean
    readonly onContinue: () => void
    readonly onAfterClose: () => void
}

/** 共用模态隔离与进退场；仅显式继续才恢复，不用遮罩点击解除自动暂停。 */
export function PracticePauseDialog({
    open,
    onContinue,
    onAfterClose,
}: PracticePauseDialogProps): ReactElement {
    return (
        <TldDialog
            open={open}
            onOpenChange={(next): void => {
                if (!next) onContinue()
            }}
            onAfterClose={onAfterClose}
            title="游戏暂停"
            size="fit-extra-wide"
            referenceFrame={{ width: 470, offsetX: 0, offsetY: -0.5 }}
            density="compact"
            showHeader={false}
            showCloseButton={false}
            closeOnBackdrop={false}
            footer={null}
        >
            <section data-practice-pause className="relative min-h-[193px] text-foreground">
                <header className="h-[58px] border-b border-foreground/10 px-[15px] pt-[15px]">
                    <h3 data-pause-title className="w-fit text-[20px] font-medium leading-7">
                        游戏暂停
                    </h3>
                    <button
                        type="button"
                        aria-label="关闭暂停提示并继续游戏"
                        data-pause-action="close"
                        onClick={onContinue}
                        className="absolute right-[3px] top-[3px] grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:right-[5px] md:top-[5px] md:size-10"
                    >
                        <img
                            alt=""
                            src={closeAsset.src}
                            className="size-5 [filter:var(--app-filter-dialog-icon)]"
                        />
                    </button>
                </header>
                <div className="grid grid-cols-[106px_minmax(0,1fr)] items-start gap-x-3 px-4 pb-[22px] pt-[11px] md:gap-x-[21px] md:pl-[33px] md:pr-[15px]">
                    <img
                        alt=""
                        data-pause-mascot
                        src={mascotAsset.src}
                        className="row-span-2 h-[86px] w-[106px] object-cover"
                    />
                    <p
                        data-pause-message
                        className="mt-3 min-w-0 text-[16px] font-normal leading-[22px] md:mt-8 md:w-[210px] md:max-w-full"
                    >
                        喝口水，歇会再战，不着急～
                    </p>
                    <div className="mt-4 flex justify-end md:mt-4">
                        <div className="w-[76px] shrink-0">
                            <TldButton
                                fullWidth
                                size="dialog-slim"
                                data-pause-action="continue"
                                onClick={onContinue}
                            >
                                继续游戏
                            </TldButton>
                        </div>
                    </div>
                </div>
            </section>
        </TldDialog>
    )
}
