'use client'

import { useId } from 'react'
import type { ReactElement } from 'react'
import type { ShortcutPreferences } from '../../../features/learning-settings'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { getPracticeCommandBindings } from '../model/practice-bindings'
import { formatPracticeShortcut } from '../model/practice-footer'
import type { PracticeCommand } from '../model/practice-command-types'
import medalAsset from '../assets/completion/medal.png'
import durationAsset from '../assets/completion/duration.png'
import questionCountAsset from '../assets/completion/question-count-1a77cc.png'
import closeAsset from '../assets/completion/close.svg'
import replayAsset from '../assets/completion/replay.svg'
import nextAsset from '../assets/completion/next.svg'
import returnAsset from '../assets/completion/return.svg'

interface PracticeCompletionDialogProps {
    readonly open: boolean
    readonly questionCount: number
    readonly shortcuts: ShortcutPreferences
    readonly notice: string
    readonly onReplay: () => void
    readonly onReturn: () => void
    readonly onAfterClose: () => void
}

function shortcutLabel(command: PracticeCommand, values: ShortcutPreferences): string {
    return getPracticeCommandBindings(command, values)
        .map((binding) => (binding === 'Enter' ? '回车' : formatPracticeShortcut(binding)))
        .join(' / ')
}

/** 共用完成态外观；只展示当前本地列表，不推算时长、正确率或下一章。 */
export function PracticeCompletionDialog({
    open,
    questionCount,
    shortcuts,
    notice,
    onReplay,
    onReturn,
    onAfterClose,
}: PracticeCompletionDialogProps): ReactElement {
    const id = useId()
    return (
        <TldDialog
            open={open}
            onOpenChange={(value): void => {
                if (!value) onReturn()
            }}
            onAfterClose={onAfterClose}
            title="完成练习"
            size="fit-extra-wide"
            referenceFrame={{ width: 580, offsetX: 0, offsetY: 0 }}
            density="compact"
            showHeader={false}
            showCloseButton={false}
            footer={null}
        >
            <section
                data-practice-completion
                className="relative min-h-[366px] pb-[23px] text-foreground"
            >
                <header className="h-[59px] px-[15px] pt-[15px]">
                    <h3 data-completion-title className="text-[20px] font-medium leading-[normal]">
                        完成练习
                    </h3>
                    <button
                        type="button"
                        aria-label="关闭完成练习"
                        className="absolute right-[5px] top-[5px] grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                        onClick={onReturn}
                    >
                        <img
                            alt=""
                            src={closeAsset.src}
                            className="[filter:var(--app-filter-dialog-icon)]"
                        />
                    </button>
                </header>
                <div
                    aria-hidden="true"
                    data-completion-divider
                    className="absolute inset-x-0 top-[59px] border-t border-foreground/10"
                />
                <div
                    data-completion-encouragement
                    className="mx-auto mt-[19px] flex w-fit items-center gap-[3px] md:ml-[200px] md:mr-0"
                >
                    <img
                        alt=""
                        src={medalAsset.src}
                        data-completion-asset="medal"
                        className="size-[50px] shrink-0 object-cover"
                    />
                    <div className="flex w-[126px] flex-col gap-[5px]">
                        <p
                            data-completion-praise
                            className="text-[18px] font-medium leading-[normal]"
                        >
                            你也太棒了吧！
                        </p>
                        <p className="text-[14px] font-normal leading-[normal] text-foreground/60">
                            本次练习已完成
                        </p>
                    </div>
                </div>
                <div className="mx-auto mt-[25px] w-full max-w-[457px] px-[15px] md:ml-[61px] md:mr-0">
                    <dl
                        data-completion-statistics
                        className="grid grid-cols-1 gap-[13px] min-[480px]:grid-cols-2 md:h-[98px] md:items-start"
                    >
                        <div
                            data-completion-stat="duration"
                            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-foreground/20 p-[9px]"
                        >
                            <img
                                alt=""
                                src={durationAsset.src}
                                data-completion-asset="duration"
                                className="size-[42px] shrink-0 object-cover"
                            />
                            <div className="flex min-w-0 flex-col gap-1">
                                <dt className="text-[16px] font-normal leading-[normal] text-foreground/60">
                                    今日练习时长
                                </dt>
                                <dd
                                    className="text-[18px] font-medium leading-[normal]"
                                    title="暂未接入今日练习时长"
                                >
                                    —<span className="sr-only">（暂未接入）</span>
                                </dd>
                            </div>
                        </div>
                        <div
                            data-completion-stat="questions"
                            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-foreground/20 p-[9px]"
                        >
                            <span className="relative block size-[42px] shrink-0">
                                <img
                                    alt=""
                                    src={questionCountAsset.src}
                                    data-completion-asset="questions"
                                    className="absolute left-1 top-[3px] h-9 w-[35px]"
                                />
                            </span>
                            <div className="flex min-w-0 flex-col gap-1">
                                <dt className="text-[16px] font-normal leading-[normal] text-foreground/60">
                                    此章题目数量
                                </dt>
                                <dd className="text-[18px] font-medium leading-[normal]">
                                    <span data-completion-count>{questionCount}</span>
                                    <span className="text-[14px] font-normal">道</span>
                                </dd>
                            </div>
                        </div>
                    </dl>
                    <div
                        data-completion-actions
                        className="relative mt-[25px] grid grid-cols-1 gap-[13px] min-[480px]:grid-cols-2 md:mt-0"
                    >
                        <TldButton
                            fullWidth
                            size="dialog-compact"
                            variant="soft"
                            onClick={onReplay}
                            data-completion-action="replay"
                        >
                            <img
                                alt=""
                                src={replayAsset.src}
                                className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                            />
                            再练一次({shortcutLabel('session.replay', shortcuts)})
                        </TldButton>
                        <TldButton
                            fullWidth
                            size="dialog-compact"
                            disabled
                            aria-describedby={`${id}-next`}
                            data-completion-action="next"
                        >
                            下一章({shortcutLabel('session.nextChapter', shortcuts)})
                            <img
                                alt=""
                                src={nextAsset.src}
                                className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                            />
                        </TldButton>
                        <p
                            id={`${id}-next`}
                            className="absolute right-0 top-full mt-0.5 text-[12px] leading-[17px] text-foreground/60"
                        >
                            暂无可用下一章
                        </p>
                    </div>
                </div>
                <div className="mt-[25px] flex justify-center">
                    <button
                        type="button"
                        data-completion-action="return"
                        onClick={onReturn}
                        className="inline-flex cursor-pointer items-center gap-1 rounded text-[16px] font-normal leading-[normal] text-foreground/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                        <img
                            alt=""
                            src={returnAsset.src}
                            className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                        />
                        <span className="underline underline-offset-2">
                            返回({shortcutLabel('session.return', shortcuts)})
                        </span>
                    </button>
                </div>
                <p role="status" className="sr-only">
                    {notice}
                </p>
            </section>
        </TldDialog>
    )
}
