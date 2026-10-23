'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { PracticeQuestion } from '../model/practice-demo'
import {
    getPracticeContentLines,
    practiceContentDisplayOptions,
    resolvePracticeContentDisplay,
} from '../model/practice-content-dialog'
import type { PracticeContentDisplay } from '../model/practice-content-dialog'
import closeAsset from '../assets/error-feedback-close.svg'
import arrowAsset from '../assets/content-arrow-right.svg'

interface PracticeContentListProps {
    readonly questions: readonly PracticeQuestion[]
    readonly currentIndex: number
    readonly display: PracticeContentDisplay
    readonly onSelect: (index: number) => void
}

interface PracticeContentDialogProps extends Omit<PracticeContentListProps, 'display'> {
    readonly open: boolean
    readonly onClose: () => void
    readonly englishOnly?: boolean
}

/** 页面私有列表：保留题目顺序，只渲染当前显示方案，滚动不影响标题与切换区。 */
export function PracticeContentList({
    questions,
    currentIndex,
    display,
    onSelect,
}: PracticeContentListProps): ReactElement {
    return (
        <ol
            aria-label="练习内容列表"
            data-practice-content-list
            className="mt-6 min-h-0 flex-1 space-y-[14px] overflow-y-auto overscroll-contain"
        >
            {questions.map((question, index) => {
                const lines = getPracticeContentLines(question, display)
                return (
                    <li key={question.id}>
                        <button
                            type="button"
                            aria-current={index === currentIndex ? 'true' : undefined}
                            aria-label={`第${index + 1}题，${lines.map((line) => line.text).join('，')}`}
                            data-practice-content-question={index}
                            className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-[10px] rounded-xl border border-foreground/30 p-[10px] text-left font-normal hover:border-accent-green focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
                            onClick={(): void => onSelect(index)}
                        >
                            {lines.map((line, lineIndex) => (
                                <span
                                    key={line.language}
                                    lang={line.language}
                                    className={
                                        lineIndex === 0
                                            ? lines.length === 1
                                                ? 'col-start-1 row-span-2 row-start-1 min-w-0 self-center break-words text-body-notice text-foreground'
                                                : 'col-start-1 row-start-1 min-w-0 break-words text-body-notice text-foreground'
                                            : 'col-start-1 row-start-2 min-w-0 break-words text-body-tight text-foreground/60'
                                    }
                                >
                                    {line.text}
                                </span>
                            ))}
                            <span className="col-start-2 row-start-1 justify-self-end text-body-notice text-accent-green">
                                #{index + 1}
                            </span>
                            <img
                                alt=""
                                aria-hidden="true"
                                src={arrowAsset.src}
                                className="col-start-2 row-start-2 justify-self-end [filter:var(--app-filter-dialog-icon)]"
                            />
                        </button>
                    </li>
                )
            })}
            {questions.length === 0 ? (
                <li className="py-6 text-center text-body-tight text-secondary">暂无练习内容</li>
            ) : null}
        </ol>
    )
}

export function PracticeContentDialog({
    open,
    questions,
    currentIndex,
    onSelect,
    onClose,
    englishOnly = false,
}: PracticeContentDialogProps): ReactElement {
    const [selectedDisplay, setDisplay] = useState<PracticeContentDisplay>('chinese')
    const display = englishOnly ? 'english' : selectedDisplay

    function close(): void {
        setDisplay('chinese')
        onClose()
    }

    return (
        <TldDialog
            open={open}
            onOpenChange={(nextOpen): void => {
                if (!nextOpen) close()
            }}
            title="练习内容"
            size="fit-extra-wide"
            referenceFrame={{ width: 686, offsetX: 0, offsetY: 0.5 }}
            density="compact"
            showHeader={false}
            showCloseButton={false}
            footer={null}
        >
            <section
                aria-label="练习内容"
                data-practice-content-dialog
                data-display={display}
                className="relative flex h-[min(825px,calc(100dvh-26px))] min-h-0 flex-col px-[15px] pb-[23px] pt-[23px] md:h-[min(825px,calc(100dvh-50px))] md:px-[23px]"
            >
                <h3 className="h-[34px] shrink-0 text-center text-section-title-display font-medium tracking-normal">
                    <span className="bg-linear-to-b/srgb from-brand-start to-brand-end bg-clip-text text-transparent">
                        练习内容
                    </span>
                </h3>
                <button
                    type="button"
                    aria-label="关闭练习内容"
                    className="absolute right-[15px] top-5 grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={close}
                >
                    <img
                        alt=""
                        src={closeAsset.src}
                        className="[filter:var(--app-filter-dialog-icon)]"
                    />
                </button>
                {!englishOnly && (
                    <div className="mx-auto mt-6 w-full max-w-[342px] shrink-0">
                        <TldSegmentedTabs
                            ariaLabel="内容显示方式"
                            appearance="glass"
                            semantics="filter"
                            items={practiceContentDisplayOptions}
                            value={display}
                            onValueChange={(value): void =>
                                setDisplay(resolvePracticeContentDisplay(value))
                            }
                        />
                    </div>
                )}
                <PracticeContentList
                    questions={questions}
                    currentIndex={currentIndex}
                    display={display}
                    onSelect={(index): void => {
                        onSelect(index)
                        close()
                    }}
                />
            </section>
        </TldDialog>
    )
}
