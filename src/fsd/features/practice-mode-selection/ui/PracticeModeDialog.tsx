'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { TldDialog, useTldDialogMotionEnabled } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { isPracticeSelectionMode, practiceModeSelections } from '../model/practice-mode-selections'
import { getPracticeModeDialogFrame } from '../model/practice-mode-selection-layout'
import type {
    PracticeSelectionMode,
    SelectablePracticeFamily,
} from '../model/practice-mode-selections'
import closeAsset from '../assets/close.svg'
import selectedAsset from '../assets/selected.svg'

export interface PracticeModeDialogProps {
    readonly family: SelectablePracticeFamily
    readonly open: boolean
    readonly initialMode?: PracticeSelectionMode
    readonly onOpenChange: (open: boolean) => void
    readonly onStart: (mode: PracticeSelectionMode) => void
}

interface PracticeModeDialogContentProps {
    readonly family: SelectablePracticeFamily
    readonly selectedMode: PracticeSelectionMode
    readonly onSelect: (mode: PracticeSelectionMode) => void
    readonly onCancel: () => void
    readonly onStart: () => void
}

interface SelectionStyle extends CSSProperties {
    '--selection-content-height': string
    '--selection-right-padding': string
    '--selection-close-right': string
    '--selection-row-gap': string
    '--selection-caption-top': string
}

const familyLabels: Readonly<Record<SelectablePracticeFamily, string>> = {
    word: '单词游戏',
    sentence: '句子游戏',
    audio: '音频游戏',
    video: '视频游戏',
    guess: '猜词游戏',
    picture: '看图学词',
}

export function PracticeModeDialogContent({
    family,
    selectedMode,
    onSelect,
    onCancel,
    onStart,
}: PracticeModeDialogContentProps): ReactElement {
    const config = practiceModeSelections[family]
    const selectedOption =
        config.options.find((option) => option.id === selectedMode) ??
        config.options.find((option) => option.id === config.defaultMode)
    if (selectedOption === undefined)
        throw new Error('Practice mode selection has no default option')
    const word = family === 'word'
    const style: SelectionStyle = {
        '--selection-content-height': `${config.reference.height - 2}px`,
        '--selection-right-padding': `${config.reference.width - 796}px`,
        '--selection-close-right': `${config.reference.width - 804}px`,
        '--selection-row-gap': `${config.reference.rowGap}px`,
        '--selection-caption-top': `${config.reference.captionTop - 83}px`,
    }
    return (
        <div
            data-practice-mode-selector={family}
            data-practice-mode-selected={selectedOption.id}
            data-word-mode-selector={word ? true : undefined}
            data-word-mode-selected={word ? selectedOption.id : undefined}
            style={style}
            className="relative px-[15px] pb-[23px] pt-[23px] dialog:h-[var(--selection-content-height)] dialog:pb-[29px] dialog:pl-[23px] dialog:pr-[var(--selection-right-padding)]"
        >
            <h3
                data-practice-mode-title
                data-word-mode-title={word ? true : undefined}
                className="h-[34px] pr-12 text-[20px] font-medium leading-5 tracking-normal text-foreground dialog:text-[24px] dialog:leading-6"
            >
                {config.title}
            </h3>
            <button
                type="button"
                aria-label="关闭模式选择"
                className="absolute right-[15px] top-[20px] grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus dialog:right-[var(--selection-close-right)]"
                onClick={onCancel}
            >
                <img
                    alt=""
                    src={closeAsset.src}
                    className="[filter:var(--app-filter-dialog-icon)]"
                />
            </button>
            <div className="mt-[25px] grid min-w-0 gap-6 dialog:grid-cols-[232px_minmax(0,1fr)]">
                <div
                    role="group"
                    aria-label={`${familyLabels[family]}模式`}
                    className="grid min-w-0 grid-cols-1 content-start gap-3 pt-0.5 sm:grid-cols-2 dialog:grid-cols-1 dialog:gap-[var(--selection-row-gap)]"
                >
                    {config.options.map((option) => {
                        const selected = selectedOption.id === option.id
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={selected}
                                data-practice-mode-option={option.id}
                                data-word-mode-option={word ? option.id : undefined}
                                className={
                                    selected
                                        ? 'relative flex h-[62px] min-w-0 cursor-pointer items-center gap-[14px] rounded-lg px-2 pr-10 text-left shadow-mode-selection-option focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
                                        : 'relative flex h-[62px] min-w-0 cursor-pointer items-center gap-[14px] rounded-lg bg-surface-raised px-2 pr-10 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
                                }
                                onClick={(): void => onSelect(option.id)}
                            >
                                {selected && (
                                    <>
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-mode-selection-selected-fill"
                                        />
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-mode-selection-selected-border p-px [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                                        />
                                    </>
                                )}
                                <span className="relative size-[46px] shrink-0 overflow-hidden rounded">
                                    <img
                                        alt=""
                                        data-practice-mode-thumbnail
                                        data-word-mode-thumbnail={word ? true : undefined}
                                        src={option.thumbnail}
                                        className="size-full object-cover"
                                    />
                                    {!selected && config.reference.dimInactiveThumbnail && (
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 bg-mode-selection-thumbnail-overlay"
                                        />
                                    )}
                                </span>
                                <span
                                    data-practice-mode-label
                                    data-word-mode-label={word ? true : undefined}
                                    className={
                                        selected
                                            ? 'relative min-w-0 text-[14px] font-medium leading-[14px] text-foreground dialog:text-[16px] dialog:leading-4'
                                            : 'relative min-w-0 text-[14px] font-normal leading-[14px] text-hint dialog:text-[16px] dialog:leading-4'
                                    }
                                >
                                    {option.label}
                                </span>
                                {selected && (
                                    <img
                                        alt=""
                                        src={selectedAsset.src}
                                        className="absolute right-2 top-[19px]"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="min-w-0">
                    <figure className="relative isolate aspect-[515/315] w-full overflow-hidden rounded-2xl dialog:h-[315px]">
                        <img
                            alt={selectedOption.label}
                            data-practice-mode-preview
                            data-word-mode-preview={word ? true : undefined}
                            src={selectedOption.preview}
                            className="absolute inset-0 size-full object-cover"
                        />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px] bg-mode-selection-preview-caption"
                        />
                        <figcaption
                            data-practice-mode-preview-caption
                            data-word-mode-preview-caption={word ? true : undefined}
                            className="absolute inset-x-0 bottom-3 flex h-[22px] items-center justify-center text-[16px] font-normal leading-4 text-media-foreground dialog:bottom-auto dialog:top-[var(--selection-caption-top)]"
                        >
                            {selectedOption.label}
                        </figcaption>
                    </figure>
                    <div className="mt-5">
                        <TldButton
                            data-practice-mode-start
                            fullWidth
                            size="dialog-action"
                            onClick={onStart}
                        >
                            <span data-practice-mode-start-label>开始练习</span>
                        </TldButton>
                    </div>
                    <div
                        data-practice-mode-cancel
                        className="mt-5 flex h-[25px] items-center justify-center"
                    >
                        <button
                            type="button"
                            data-practice-mode-cancel-label
                            className="cursor-pointer rounded text-[16px] font-normal leading-4 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus dialog:text-[18px] dialog:leading-[18px]"
                            onClick={onCancel}
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function PracticeModeDialog({
    family,
    open,
    initialMode,
    onOpenChange,
    onStart,
}: PracticeModeDialogProps): ReactElement {
    const config = practiceModeSelections[family]
    const [selectedMode, setSelectedMode] = useState<PracticeSelectionMode>(
        isPracticeSelectionMode(family, initialMode) ? initialMode : config.defaultMode,
    )
    const motionEnabled = useTldDialogMotionEnabled()
    const [previousOpen, setPreviousOpen] = useState(open)
    const pendingStart = useRef<PracticeSelectionMode | null>(null)
    // 外壳必须存活到退场结束；每次重新打开仍从当前模式初始化待选值。
    if (open !== previousOpen) {
        setPreviousOpen(open)
        if (open)
            setSelectedMode(
                isPracticeSelectionMode(family, initialMode) ? initialMode : config.defaultMode,
            )
    }
    useEffect((): void => {
        if (open) pendingStart.current = null
    }, [open])
    function close(): void {
        pendingStart.current = null
        onOpenChange(false)
    }
    function start(): void {
        if (!motionEnabled) {
            onOpenChange(false)
            onStart(selectedMode)
            return
        }
        pendingStart.current = selectedMode
        onOpenChange(false)
    }
    return (
        <TldDialog
            open={open}
            onOpenChange={(value): void => {
                if (value) onOpenChange(true)
                else close()
            }}
            onAfterClose={(): void => {
                const selected = pendingStart.current
                pendingStart.current = null
                if (selected !== null) onStart(selected)
            }}
            title={`${familyLabels[family]}：${config.title}`}
            showHeader={false}
            showCloseButton={false}
            size="fit-extra-wide"
            referenceFrame={getPracticeModeDialogFrame(config.reference)}
            surface={config.reference.solidSurface ? 'solid' : 'gradient'}
            density="compact"
            footer={null}
        >
            <PracticeModeDialogContent
                family={family}
                selectedMode={selectedMode}
                onSelect={setSelectedMode}
                onCancel={close}
                onStart={start}
            />
        </TldDialog>
    )
}
