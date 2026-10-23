'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { formatPracticeMediaTime } from '../model/media-controller'
import { videoListeningSegments } from '../model/video-listening-demo'
import { videoPlaybackRates } from '../model/video-listening-playback'
import type {
    VideoListeningPlayback,
    VideoListeningSnapshot,
    VideoSubtitleOptions,
    VideoSentenceRhythm,
} from '../model/video-listening-playback'
import { VideoControlPopover } from './VideoControlPopover'
import { VideoPlaybackOptionList, VideoPlaybackSegments } from './VideoPlaybackOptions'
import type { VideoPlaybackChoice } from './VideoPlaybackOptions'
import previousAsset from '../assets/video-listening/previous.svg'
import pauseAsset from '../assets/video-listening/pause.svg'
import nextAsset from '../assets/video-listening/next.svg'
import volumeAsset from '../assets/video-listening/volume.svg'
import repeatAsset from '../assets/video-listening/repeat.svg'
import subtitlesAsset from '../assets/video-listening/subtitles.svg'
import settingsAsset from '../assets/video-listening/settings.svg'
import fullscreenAsset from '../assets/video-listening/fullscreen.svg'
import playAsset from '../assets/video-listening/play.svg'

const subtitleRows: readonly {
    readonly key: keyof VideoSubtitleOptions
    readonly label: string
}[] = [
    { key: 'translation', label: '中文翻译' },
    { key: 'english', label: '英文字幕' },
    { key: 'phonetics', label: '音标' },
    { key: 'partOfSpeech', label: '词性标注' },
    { key: 'meaning', label: '单词释义' },
]
const repeatChoices: readonly VideoPlaybackChoice<number>[] = [
    { value: 1, label: '1遍' },
    { value: 2, label: '2遍' },
    { value: 3, label: '3遍' },
]
const rhythmChoices: readonly VideoPlaybackChoice<VideoSentenceRhythm>[] = [
    { value: 'continuous', label: '连续' },
    { value: 'sentence-end', label: '句末停' },
]
interface VideoListeningControlsProps {
    readonly controller: VideoListeningPlayback
    readonly state: VideoListeningSnapshot
    readonly answerVisible: boolean
    readonly blocked: boolean
    readonly onAnswer: () => void
    readonly onFullscreen: () => void
}

/** 单色原稿以alpha遮罩着色，保留SVG路径和尺寸，跟随按钮的主题前景色。 */
function VideoControlIcon({
    source,
    size = 24,
}: {
    readonly source: string
    readonly size?: 24 | 28
}): ReactElement {
    return (
        <span
            aria-hidden="true"
            className={
                size === 28
                    ? 'block size-7 shrink-0 bg-current [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]'
                    : 'block size-6 shrink-0 bg-current [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]'
            }
            style={{ maskImage: `url(${source})` }}
        />
    )
}

function RepeatOptions({
    controller,
    state,
    active,
}: Pick<VideoListeningControlsProps, 'controller' | 'state'> & {
    readonly active: boolean
}): ReactElement {
    return (
        <VideoPlaybackSegments
            label="每句播放次数"
            options={repeatChoices}
            value={state.repeat}
            active={active}
            onSelect={controller.setRepeat}
        />
    )
}

export function VideoListeningControls({
    controller,
    state,
    blocked,
    answerVisible,
    onAnswer,
    onFullscreen,
}: VideoListeningControlsProps): ReactElement {
    const [menu, setMenu] = useState<string | null>(null)
    useEffect((): void => {
        if (blocked) setMenu(null)
    }, [blocked])
    return (
        <footer
            data-video-controls
            aria-label="视频练习底部操作"
            className="relative w-full shrink-0 rounded-xl border border-foreground/30 bg-practice-control-surface px-3 pb-2 pt-3 md:px-5 md:pb-3 design:min-h-[70px]"
        >
            <label className="absolute inset-x-3 -top-2 md:inset-x-5">
                <span className="sr-only">模拟视频播放进度</span>
                <input
                    type="range"
                    min={0}
                    max={state.duration}
                    step={0.01}
                    value={state.position}
                    disabled={blocked}
                    className="block h-3 w-full cursor-pointer accent-brand disabled:cursor-not-allowed"
                    onChange={(event): void => controller.seek(event.currentTarget.valueAsNumber)}
                />
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-3">
                <div className="col-start-1 row-start-1 flex w-full min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-2 md:justify-start md:gap-x-7">
                    <div className="flex shrink-0 items-center gap-0 md:gap-3">
                        <button
                            type="button"
                            aria-label="上一条视频句子"
                            data-practice-command="question.previous"
                            disabled={blocked || state.index === 0}
                            className="grid size-10 cursor-pointer place-items-center rounded text-practice-muted enabled:hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={(): void => controller.move(-1)}
                        >
                            <VideoControlIcon source={previousAsset.src} size={28} />
                        </button>
                        <button
                            type="button"
                            aria-label={state.playRequested ? '暂停视频' : '播放视频'}
                            data-practice-command="practice.readAloud"
                            disabled={blocked}
                            className="grid size-10 cursor-pointer place-items-center rounded text-practice-muted enabled:hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
                            onClick={controller.toggle}
                        >
                            <VideoControlIcon
                                source={state.playRequested ? pauseAsset.src : playAsset.src}
                                size={28}
                            />
                        </button>
                        <button
                            type="button"
                            aria-label="下一条视频句子"
                            data-practice-command="question.next"
                            disabled={blocked || state.index === videoListeningSegments.length - 1}
                            className="grid size-10 cursor-pointer place-items-center rounded text-practice-muted enabled:hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={(): void => controller.move(1)}
                        >
                            <VideoControlIcon source={nextAsset.src} size={28} />
                        </button>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[14px] text-foreground">
                        <VideoControlPopover
                            label="视频音量"
                            layout="volume"
                            open={menu === 'volume'}
                            onOpenChange={(open): void => setMenu(open ? 'volume' : null)}
                            trigger={<VideoControlIcon source={volumeAsset.src} />}
                        >
                            <label className="flex flex-col items-center gap-3 py-1 text-label">
                                <span>音量</span>
                                <input
                                    aria-label="视频音量"
                                    aria-orientation="vertical"
                                    aria-valuetext={`${Math.round(state.volume * 100)}%`}
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={state.volume}
                                    className="h-32 w-10 shrink-0 cursor-pointer touch-none accent-brand [direction:rtl] [writing-mode:vertical-lr]"
                                    onChange={(event): void =>
                                        controller.setVolume(event.currentTarget.valueAsNumber)
                                    }
                                />
                            </label>
                        </VideoControlPopover>
                        <span className="whitespace-nowrap tabular-nums">
                            {formatPracticeMediaTime(state.position)}/
                            {formatPracticeMediaTime(state.duration)}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    aria-expanded={answerVisible}
                    data-practice-command="practice.panel.toggle"
                    disabled={blocked}
                    className="col-start-2 row-start-1 inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-foreground/50 px-3 text-[14px] text-practice-muted enabled:hover:border-foreground enabled:hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed md:justify-self-center md:self-center"
                    onClick={onAnswer}
                >
                    <span aria-hidden="true" className="hidden md:inline">
                        ↓ ↑
                    </span>
                    答案
                </button>
                <div className="col-span-2 col-start-1 row-start-2 flex w-full min-w-0 items-center justify-between gap-1 overflow-x-auto overscroll-x-contain p-0.5 md:col-span-1 md:col-start-3 md:row-start-1 md:flex-wrap md:justify-end md:gap-4 md:overflow-visible md:p-0">
                    <span
                        aria-label={`第${state.index + 1}句，共${videoListeningSegments.length}句`}
                        className="shrink-0 whitespace-nowrap rounded bg-primary/10 px-2.5 py-1 text-[16px] tabular-nums text-foreground"
                    >
                        {state.index + 1}/{videoListeningSegments.length}
                    </span>
                    <VideoControlPopover
                        label="视频倍速"
                        open={menu === 'rate'}
                        onOpenChange={(open): void => setMenu(open ? 'rate' : null)}
                        trigger={
                            <>
                                <span className="text-[14px]">{state.rate}×</span>
                                <span className="hidden md:inline">倍速</span>
                            </>
                        }
                    >
                        <VideoPlaybackOptionList
                            label="视频倍速选项"
                            active={menu === 'rate'}
                            options={videoPlaybackRates.map((rate) => ({
                                value: rate,
                                label: `${rate}×`,
                                checked: state.rate === rate,
                            }))}
                            onSelect={(rate): void => {
                                controller.setRate(rate)
                                setMenu(null)
                            }}
                        />
                    </VideoControlPopover>
                    <VideoControlPopover
                        label="视频重复次数"
                        open={menu === 'repeat'}
                        onOpenChange={(open): void => setMenu(open ? 'repeat' : null)}
                        wide
                        trigger={
                            <>
                                <VideoControlIcon source={repeatAsset.src} />
                                <span className="hidden md:inline">重复</span>
                            </>
                        }
                    >
                        <p className="mb-3 text-[16px] text-practice-muted">每句播放</p>
                        <RepeatOptions
                            controller={controller}
                            state={state}
                            active={menu === 'repeat'}
                        />
                        <p className="mt-3 text-[14px] text-practice-muted">从下一句起生效</p>
                    </VideoControlPopover>
                    <VideoControlPopover
                        label="视频字幕显示"
                        open={menu === 'subtitles'}
                        onOpenChange={(open): void => setMenu(open ? 'subtitles' : null)}
                        trigger={
                            <>
                                <VideoControlIcon source={subtitlesAsset.src} />
                                <span className="hidden md:inline">字幕</span>
                            </>
                        }
                    >
                        <p className="mb-1 px-2 text-[14px] text-practice-muted">字幕显示</p>
                        <VideoPlaybackOptionList
                            label="视频字幕选项"
                            active={menu === 'subtitles'}
                            multiple
                            options={subtitleRows.map(({ key, label }) => ({
                                value: key,
                                label,
                                checked: state.subtitles[key],
                            }))}
                            onSelect={(key): void =>
                                controller.setSubtitle(key, !state.subtitles[key])
                            }
                        />
                    </VideoControlPopover>
                    <VideoControlPopover
                        label="视频播放设置"
                        open={menu === 'settings'}
                        onOpenChange={(open): void => setMenu(open ? 'settings' : null)}
                        wide
                        trigger={
                            <>
                                <VideoControlIcon source={settingsAsset.src} />
                                <span className="hidden md:inline">设置</span>
                            </>
                        }
                    >
                        <p className="mb-3 text-[16px] text-practice-muted">每句播放</p>
                        <RepeatOptions
                            controller={controller}
                            state={state}
                            active={menu === 'settings'}
                        />
                        <p className="mt-3 text-[14px] text-practice-muted">从下一句起生效</p>
                        <p className="mb-3 mt-6 text-[16px] text-practice-muted">句末节奏</p>
                        <VideoPlaybackSegments
                            label="句末节奏"
                            options={rhythmChoices}
                            value={state.rhythm}
                            active={menu === 'settings'}
                            onSelect={controller.setRhythm}
                        />
                        <p className="mt-3 text-[14px] text-practice-muted">
                            {state.rhythm === 'continuous'
                                ? '一句接一句连续播放'
                                : '每句播放完毕后暂停'}
                        </p>
                        <label className="mt-5 block">
                            <span className="flex justify-between text-[16px] text-practice-muted">
                                <span>句间停顿</span>
                                <span>{state.gap.toFixed(1)}s</span>
                            </span>
                            <input
                                aria-label="句间停顿"
                                type="range"
                                min={0}
                                max={5}
                                step={0.5}
                                value={state.gap}
                                disabled={state.rhythm === 'sentence-end'}
                                className="mt-3 block w-full cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-40"
                                onChange={(event): void =>
                                    controller.setGap(event.currentTarget.valueAsNumber)
                                }
                            />
                        </label>
                        <p className="mt-2 text-[14px] text-practice-muted">
                            {state.gap === 0
                                ? '0秒立即进入下一句'
                                : `等待${state.gap.toFixed(1)}秒进入下一句`}
                        </p>
                    </VideoControlPopover>
                    <button
                        type="button"
                        aria-label="视频切换全屏"
                        data-practice-navigation-action="fullscreen"
                        className="flex min-h-10 min-w-10 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-[12px] text-practice-muted hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                        onClick={onFullscreen}
                    >
                        <VideoControlIcon source={fullscreenAsset.src} />
                        <span className="hidden md:inline">放大</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}
