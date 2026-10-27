'use client'

import type { ReactElement, ReactNode } from 'react'
import { Tooltip } from '../../../shared/ui/tooltip'
import type {
    ImmersiveListeningFamily,
    SentenceListeningPlaybackOptions,
    SentenceListeningPlaybackToggle,
} from '../model/sentence-listening-playback'
import blindIcon from '../assets/sentence-listening-blind.svg'
import autoAdvanceIcon from '../assets/sentence-listening-auto-advance.svg'
import chapterLoopIcon from '../assets/sentence-listening-chapter-loop.svg'
import pauseIcon from '../assets/sentence-listening-pause.svg'
import autoNextChapterIcon from '../assets/sentence-listening-auto-next-chapter.svg'
import blindOnIcon from '../assets/sentence-listening-blind-on.svg'
import autoAdvanceOnIcon from '../assets/sentence-listening-auto-advance-on.svg'
import chapterLoopOnIcon from '../assets/sentence-listening-chapter-loop-on.svg'
import playIcon from '../assets/sentence-listening-play.svg'
import autoNextChapterOnIcon from '../assets/sentence-listening-auto-next-chapter-on.svg'

interface SentenceListeningControlsProps {
    readonly family?: ImmersiveListeningFamily | 'picture'
    readonly variant?: 'listening' | 'reading'
    readonly children?: ReactNode
    readonly options: SentenceListeningPlaybackOptions
    readonly paused: boolean
    readonly blocked: boolean
    readonly nextChapterAvailable: boolean
    readonly onToggle: (key: SentenceListeningPlaybackToggle) => void
    readonly onPause: () => void
    readonly onPlay: () => void
}

interface ListeningControl {
    readonly key: SentenceListeningPlaybackToggle | 'pause'
    readonly label: string
    readonly description: string
    readonly icon: string
    readonly selected: boolean
    readonly unavailable?: boolean
    readonly preserveColor?: boolean
}

function getListeningControlHint(control: ListeningControl): string {
    if (control.key === 'pause') return control.label
    if (control.unavailable) return '自动下节不可用：暂无下一章节'
    return `${control.label}${control.selected ? '开启' : '关闭'}`
}

export function SentenceListeningControls({
    family = 'sentence',
    variant = 'listening',
    children,
    options,
    paused,
    blocked,
    nextChapterAvailable,
    onToggle,
    onPause,
    onPlay,
}: SentenceListeningControlsProps): ReactElement {
    const controls: readonly ListeningControl[] = [
        {
            key: 'blind',
            label: '盲听',
            description:
                family === 'picture'
                    ? '隐藏音标和单词，保留场景图片和中文'
                    : '隐藏逐词解析，保留图片和整句译文',
            icon: options.blind ? blindOnIcon.src : blindIcon.src,
            selected: options.blind,
        },
        {
            key: 'autoAdvance',
            label: '自动切题',
            description:
                family === 'picture'
                    ? '朗读当前词条，播完等待1秒后自动下一题'
                    : '播放当前句子，播完等待1秒后自动下一题',
            icon: options.autoAdvance ? autoAdvanceOnIcon.src : autoAdvanceIcon.src,
            selected: options.autoAdvance,
            preserveColor: options.autoAdvance,
        },
        {
            key: 'chapterLoop',
            label: '章节循环',
            description:
                variant === 'reading'
                    ? '自动播放到末题后从第一题循环'
                    : '自动播放到末题后从第一题循环，与自动下节互斥',
            icon: options.chapterLoop ? chapterLoopOnIcon.src : chapterLoopIcon.src,
            selected: options.chapterLoop,
            preserveColor: options.chapterLoop,
        },
        {
            key: 'pause',
            label: paused ? '播放' : '暂停',
            description: paused
                ? family === 'picture'
                    ? '朗读当前词条；暂停后继续播放仍保留手动切题'
                    : '播放当前句子；暂停后继续播放仍保留手动切题'
                : '暂停当前播放并退出自动切题，保留手动切题和切读',
            icon: paused ? playIcon.src : pauseIcon.src,
            selected: paused,
        },
        {
            key: 'autoNextChapter',
            label: '自动下节',
            description: nextChapterAvailable
                ? '配合自动切题，播完末题进入下一章节，与章节循环互斥'
                : '当前没有可用的下一章节；请从课程章节进入',
            icon:
                options.autoNextChapter && nextChapterAvailable
                    ? autoNextChapterOnIcon.src
                    : autoNextChapterIcon.src,
            selected: options.autoNextChapter && nextChapterAvailable,
            unavailable: !nextChapterAvailable,
            preserveColor: options.autoNextChapter && nextChapterAvailable,
        },
    ]
    const controlButtons = controls
        .filter(
            (control) =>
                variant === 'listening' ||
                control.key === 'autoAdvance' ||
                control.key === 'chapterLoop' ||
                control.key === 'pause',
        )
        .map((control) => (
            <Tooltip
                key={control.key}
                content={getListeningControlHint(control)}
                placement={control.key === 'autoNextChapter' ? 'left' : 'bottom'}
            >
                <button
                    type="button"
                    aria-label={control.label}
                    aria-description={control.description}
                    aria-pressed={control.key === 'pause' ? undefined : control.selected}
                    disabled={blocked || control.unavailable}
                    onClick={(): void => {
                        if (control.key === 'pause') {
                            if (paused) onPlay()
                            else onPause()
                        } else onToggle(control.key)
                    }}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-focus enabled:hover:bg-brand/10 disabled:cursor-default disabled:opacity-40 xl:size-6"
                >
                    <img
                        src={control.icon}
                        alt=""
                        width={24}
                        height={24}
                        className={
                            control.preserveColor ? '' : '[filter:var(--app-filter-dialog-icon)]'
                        }
                    />
                </button>
            </Tooltip>
        ))
    return (
        <div
            role="group"
            aria-label={variant === 'reading' ? '阅读全览播放控制' : '沉浸听力播放控制'}
            data-practice-listening-controls={variant === 'listening' ? family : undefined}
            data-sentence-listening-controls={
                variant === 'listening' && family === 'sentence' ? '' : undefined
            }
            data-audio-listening-controls={
                variant === 'listening' && family === 'audio' ? '' : undefined
            }
            data-sentence-reading-controls={variant === 'reading' || undefined}
            className={
                variant === 'reading'
                    ? 'relative z-40 mx-3 mt-[60px] flex w-fit shrink-0 self-end items-center gap-1 md:absolute md:right-4 md:top-[14px] md:m-0 md:gap-[10px]'
                    : 'relative z-40 mx-3 mt-[60px] flex w-fit shrink-0 self-end items-center gap-1 md:absolute md:right-0 md:top-5 md:m-0 md:gap-4 md:px-[10px] md:py-[5px]'
            }
        >
            {variant === 'reading' ? (
                <div className="flex shrink-0 items-center gap-1 md:gap-4 md:px-[10px] md:py-[5px] xl:w-[122px]">
                    {controlButtons}
                </div>
            ) : (
                controlButtons
            )}
            {children}
        </div>
    )
}
