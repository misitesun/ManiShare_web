'use client'

import { useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { LearningAudioWave } from '../../../features/learning-settings'
import { getPracticeReference } from '../model/reference-layout'
import playAsset from '../assets/audio-reader/play.svg'
import pauseAsset from '../assets/audio-reader/pause.png'

interface ReaderStyle extends CSSProperties {
    readonly '--practice-reference-top': string
}

interface PureAudioReaderProps {
    readonly waveStyle: string
    readonly active: boolean
}

/** 无真实音源时播放／暂停仅控制声纹预览，不模拟媒体进度。 */
export function PureAudioReader({ waveStyle, active }: PureAudioReaderProps): ReactElement {
    const [previewPlaying, setPreviewPlaying] = useState(false)
    const reference = getPracticeReference('audio-reader', 'read')
    const style: ReaderStyle = { '--practice-reference-top': `${reference.top}px` }
    return (
        <section
            aria-label="纯音频"
            data-pure-audio-reader
            data-reference-node={reference.node}
            className="min-h-[calc(100dvh-72px)] min-w-0 px-4 pb-16 pt-20 md:px-8 md:pt-32 design:pt-[var(--practice-reference-top)]"
            style={style}
        >
            <div
                data-pure-audio-wave-slot
                className="mx-auto flex aspect-[62/35] w-full max-w-[496px] items-center justify-center"
            >
                <LearningAudioWave
                    style={waveStyle}
                    active={active && previewPlaying}
                    label="纯音频声纹预览"
                />
            </div>
            <div
                aria-hidden="true"
                data-pure-audio-progress
                className="relative mx-auto mt-1.5 h-4 w-full max-w-[755px] design:left-[0.5px]"
            >
                <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-[11px] bg-primary/30">
                    <span className="absolute inset-y-0 left-0 w-[35.099%] rounded-lg bg-linear-to-r from-brand-start to-brand-end" />
                </div>
                <span className="absolute left-[35.099%] top-0 size-4 -translate-x-full rounded-full bg-brand-end" />
            </div>
            <div
                role="group"
                aria-label="音频控制栏"
                className="mx-auto mt-[38px] flex w-fit max-w-full items-center justify-center"
            >
                <button
                    type="button"
                    aria-label={previewPlaying ? '暂停声纹预览' : '播放声纹预览'}
                    disabled={!active}
                    onClick={(): void => setPreviewPlaying((playing) => !playing)}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full outline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:size-8"
                >
                    <img
                        src={previewPlaying ? pauseAsset.src : playAsset.src}
                        alt=""
                        width={32}
                        height={32}
                        className="shrink-0 [filter:var(--app-filter-shell-icon)]"
                    />
                </button>
            </div>
        </section>
    )
}
