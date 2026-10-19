'use client'

import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import type { PracticeExitAction } from '../model/practice-exit'
import homeAsset from '../assets/exit/home.png'
import courseAsset from '../assets/exit/course.png'
import closeAsset from '../assets/exit/close.svg'
import homeArrowAsset from '../assets/exit/home-arrow.svg'
import courseArrowAsset from '../assets/exit/course-arrow.svg'
import continueAsset from '../assets/exit/continue.svg'

interface PracticeExitDialogProps {
    readonly open: boolean
    readonly onAction: (action: PracticeExitAction) => void
    readonly onAfterClose: () => void
}

/** 退出确认只发出意图；课程来源和实际导航由app装配层负责。 */
export function PracticeExitDialog({
    open,
    onAction,
    onAfterClose,
}: PracticeExitDialogProps): ReactElement {
    return (
        <TldDialog
            open={open}
            onOpenChange={(value): void => {
                if (!value) onAction('continue')
            }}
            onAfterClose={onAfterClose}
            title="退出练习"
            size="fit-extra-wide"
            referenceFrame={{ width: 580, offsetX: 0, offsetY: 0 }}
            density="compact"
            showHeader={false}
            showCloseButton={false}
            footer={null}
        >
            <section data-practice-exit className="relative min-h-[412px] pb-8 text-foreground">
                <header className="h-[88px] px-14 pt-[19px]">
                    <h3
                        data-exit-title
                        className="mx-auto w-fit text-center text-[22px] font-medium leading-[normal] md:text-[24px]"
                    >
                        退出练习
                    </h3>
                    <button
                        type="button"
                        aria-label="关闭退出提示并继续游戏"
                        data-exit-action="close"
                        onClick={(): void => onAction('continue')}
                        className="absolute right-[15px] top-4 grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                        <img
                            alt=""
                            src={closeAsset.src}
                            className="[filter:var(--app-filter-dialog-icon)]"
                        />
                    </button>
                </header>
                <div
                    data-exit-destinations
                    className="grid grid-cols-1 justify-items-center gap-5 px-[23px] md:grid-cols-2 md:gap-8"
                >
                    <button
                        type="button"
                        data-exit-action="home"
                        onClick={(): void => onAction('home')}
                        className="relative h-[220px] w-full max-w-[250px] cursor-pointer rounded-xl border border-practice-exit-home-border bg-practice-exit-home text-left transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
                    >
                        <img
                            alt=""
                            src={homeAsset.src}
                            data-exit-asset="home"
                            className="absolute -top-px left-8 h-[165px] w-[165px] max-w-[calc(100%_-_64px)] object-contain"
                        />
                        <span
                            data-exit-label="home"
                            className="absolute bottom-[19px] left-[19px] text-[18px] font-medium leading-[normal] md:text-[20px]"
                        >
                            返回首页
                        </span>
                        <span
                            data-exit-arrow="home"
                            aria-hidden="true"
                            className="absolute bottom-5 right-[19px] grid size-[26px] place-items-center rounded-full bg-media-foreground"
                        >
                            <img alt="" src={homeArrowAsset.src} />
                        </span>
                    </button>
                    <button
                        type="button"
                        data-exit-action="course"
                        onClick={(): void => onAction('course')}
                        className="relative h-[220px] w-full max-w-[250px] cursor-pointer rounded-xl border border-practice-exit-course-border bg-practice-exit-course text-left transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
                    >
                        <img
                            alt=""
                            src={courseAsset.src}
                            data-exit-asset="course"
                            className="absolute left-4 top-[23px] h-32 w-[213px] max-w-[calc(100%_-_32px)] object-contain"
                        />
                        <span
                            data-exit-label="course"
                            className="absolute bottom-[19px] left-[19px] text-[18px] font-medium leading-[normal] md:text-[20px]"
                        >
                            返回课程
                        </span>
                        <span
                            data-exit-arrow="course"
                            aria-hidden="true"
                            className="absolute bottom-5 right-[19px] grid size-[26px] place-items-center rounded-full bg-media-foreground"
                        >
                            <img alt="" src={courseArrowAsset.src} />
                        </span>
                    </button>
                </div>
                <div
                    data-exit-continue
                    className="mx-auto mt-7 w-[280px] max-w-[calc(100%_-_48px)]"
                >
                    <TldButton
                        fullWidth
                        size="dialog-emphasis"
                        data-exit-action="continue"
                        onClick={(): void => onAction('continue')}
                    >
                        <img
                            alt=""
                            src={continueAsset.src}
                            className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                        />
                        继续游戏
                    </TldButton>
                </div>
            </section>
        </TldDialog>
    )
}
