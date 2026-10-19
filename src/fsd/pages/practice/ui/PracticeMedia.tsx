'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { LearningAudioWave } from '../../../features/learning-settings'
import { TldButton } from '../../../shared/ui/tld-button'
import {
    createPracticeMediaController,
    emptyPracticeMediaSnapshot,
    formatPracticeMediaTime,
    practiceMediaSource,
} from '../model/media-controller'
import type { PracticeMediaController, PracticeMediaSnapshot } from '../model/media-controller'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import {
    isPracticeTechnicalSample,
    practiceTechnicalMediaLabel,
} from '../model/technical-media-samples'

export interface PracticeMediaProps {
    readonly kind: 'audio' | 'video'
    readonly source?: string
    readonly poster?: string
    readonly title: string
    readonly blocked?: boolean
    readonly paused?: boolean
    /** 仅定义媒体槽比例；播放器控制栏不计入视频尺寸。 */
    readonly aspectRatio?: string
    readonly onController?: (controller: PracticeMediaController | null) => void
    readonly waveStyle?: string
    readonly reading?: PracticeReadingView | undefined
    readonly showPlaybackWave?: boolean
    readonly onPlaybackStateChange?: (state: PracticePlaybackState) => void
}

export type PracticePlaybackState = Pick<
    PracticeMediaSnapshot,
    'status' | 'error' | 'playRequested'
>

const statusLabels = {
    unavailable: '素材未接入',
    loading: '正在加载媒体',
    ready: '可播放',
    playing: '播放中',
    paused: '已暂停',
    ended: '播放结束',
    error: '播放失败',
} as const

export function PracticeMedia({
    kind,
    source,
    poster,
    title,
    blocked = false,
    paused = false,
    aspectRatio = '16 / 9',
    onController,
    waveStyle = '默认竖条',
    reading,
    showPlaybackWave = true,
    onPlaybackStateChange,
}: PracticeMediaProps): ReactElement {
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const controllerRef = useRef<PracticeMediaController | null>(null)
    const [snapshot, setSnapshot] = useState<PracticeMediaSnapshot>(emptyPracticeMediaSnapshot)
    const hasSource = practiceMediaSource(source) !== null
    const disabled = blocked || !hasSource

    useEffect(() => {
        const element = kind === 'audio' ? audioRef.current : videoRef.current
        if (element === null) return
        const controller = createPracticeMediaController(element, setSnapshot)
        controllerRef.current = controller
        controller.setSource(source)
        onController?.(controller)
        return (): void => {
            controller.dispose()
            if (controllerRef.current === controller) controllerRef.current = null
            onController?.(null)
        }
    }, [kind, source, onController])

    useEffect(() => {
        if (blocked) {
            if (paused) controllerRef.current?.pause()
            else controllerRef.current?.stop()
        }
    }, [blocked, paused, kind, source])

    useEffect(() => {
        onPlaybackStateChange?.({
            status: snapshot.status,
            error: snapshot.error,
            playRequested: snapshot.playRequested,
        })
    }, [onPlaybackStateChange, snapshot.status, snapshot.error, snapshot.playRequested])

    function togglePlayback(): void {
        if (disabled) return
        const controller = controllerRef.current
        if (controller === null) return
        if (snapshot.playRequested) controller.pause()
        else void controller.play()
    }

    return (
        <section
            aria-label={`${title}${kind === 'audio' ? '音频' : '视频'}播放器`}
            className="w-full min-w-0"
        >
            {showPlaybackWave && snapshot.status === 'playing' && !blocked ? (
                <div
                    data-practice-playback-wave
                    className="pointer-events-none fixed bottom-[110px] left-1/2 z-30 w-[min(520px,calc(100%-24px))] -translate-x-1/2"
                >
                    <LearningAudioWave style={waveStyle} />
                </div>
            ) : null}
            {kind === 'video' ? (
                <div
                    data-practice-reading-surface
                    style={{ aspectRatio }}
                    className="relative overflow-hidden rounded-xl border border-strong bg-surface-raised"
                >
                    <video
                        ref={videoRef}
                        aria-label={title}
                        className="block size-full object-contain"
                        playsInline
                        preload="metadata"
                        poster={practiceMediaSource(poster) ?? undefined}
                    />
                    {!hasSource && (
                        <div className="absolute inset-0 flex items-center justify-center bg-canvas/70 px-4 text-center text-body text-secondary">
                            视频素材未接入
                        </div>
                    )}
                    <PracticeReadingOverlay reading={reading} />
                </div>
            ) : (
                <>
                    <audio ref={audioRef} aria-label={title} preload="metadata" />
                    <p className="text-center text-body text-practice-text">{title}</p>
                </>
            )}
            {isPracticeTechnicalSample(source) && (
                <p className="mt-2 text-center text-caption text-secondary">
                    {practiceTechnicalMediaLabel}
                </p>
            )}
            <div className="mt-3 space-y-3 rounded-xl border border-strong bg-surface/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-secondary">
                    <span role="status" aria-live="polite">
                        {blocked
                            ? paused
                                ? '已暂停播放'
                                : '已停止播放'
                            : statusLabels[snapshot.status]}
                    </span>
                    <span aria-label="播放进度与总时长" className="tabular-nums">
                        {formatPracticeMediaTime(snapshot.position)} /{' '}
                        {formatPracticeMediaTime(snapshot.duration)}
                    </span>
                </div>
                <label className="block">
                    <span className="sr-only">{title}播放进度</span>
                    <input
                        type="range"
                        min={0}
                        max={snapshot.duration || 1}
                        step={0.1}
                        value={snapshot.position}
                        disabled={disabled || snapshot.duration === 0}
                        className="block w-full cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(event): void =>
                            controllerRef.current?.seek(event.currentTarget.valueAsNumber)
                        }
                    />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                    <TldButton size="compact" disabled={disabled} onClick={togglePlayback}>
                        {snapshot.playRequested
                            ? '暂停'
                            : snapshot.status === 'error'
                              ? '重试播放'
                              : '播放'}
                    </TldButton>
                    <TldButton
                        size="compact"
                        variant="secondary"
                        disabled={disabled}
                        onClick={(): void => controllerRef.current?.stop()}
                    >
                        停止
                    </TldButton>
                    <label className="flex min-w-0 flex-1 items-center gap-2 text-caption text-secondary">
                        <span className="shrink-0">音量</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={snapshot.volume}
                            disabled={disabled}
                            className="w-full min-w-0 cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event): void =>
                                controllerRef.current?.setVolume(event.currentTarget.valueAsNumber)
                            }
                        />
                    </label>
                    <label className="flex items-center gap-2 text-caption text-secondary">
                        <span>倍速</span>
                        <select
                            aria-label={`${title}播放倍速`}
                            value={snapshot.rate}
                            disabled={disabled}
                            className="cursor-pointer rounded-lg border border-strong bg-surface px-2 py-1 text-primary outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event): void =>
                                controllerRef.current?.setRate(Number(event.currentTarget.value))
                            }
                        >
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <option key={rate} value={rate}>
                                    {rate}×
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {!hasSource && (
                    <p className="text-caption text-secondary">
                        当前为静态演示，尚未接入{kind === 'audio' ? '音频' : '视频'}素材。
                    </p>
                )}
                {snapshot.error && (
                    <p role="alert" className="text-caption text-danger">
                        {snapshot.error}
                    </p>
                )}
            </div>
        </section>
    )
}
