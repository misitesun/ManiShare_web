'use client'

import { useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import type { VideoListeningPlayback } from '../model/video-listening-playback'
import posterAsset from '../assets/video-listening/poster.png'
import playAsset from '../assets/video-listening/play.png'

interface VideoExerciseCoverProps {
    readonly controller: VideoListeningPlayback
    readonly mode: 'check' | 'typing' | 'oral' | 'blocks' | 'translate'
    readonly blocked: boolean
    readonly maskSubtitles: boolean
    readonly onToggle: () => void
}

/** 中译英封面900×500，其余练习600×337；显示层不拥有媒体宿主。 */
export function VideoExerciseCover({
    controller,
    mode,
    blocked,
    maskSubtitles,
    onToggle,
}: VideoExerciseCoverProps): ReactElement {
    const state = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot,
    )
    const translation = mode === 'translate'
    return (
        <button
            type="button"
            data-video-exercise-cover
            data-video-check-cover={mode === 'check' || undefined}
            data-video-typing-cover={mode === 'typing' || undefined}
            data-video-oral-cover={mode === 'oral' || undefined}
            data-video-blocks-cover={mode === 'blocks' || undefined}
            data-video-translate-cover={translation || undefined}
            data-practice-command="practice.readAloud"
            aria-label={state.playRequested ? '暂停当前视频句子' : '播放当前视频句子'}
            aria-pressed={state.playRequested}
            disabled={blocked}
            onClick={onToggle}
            className={
                translation
                    ? 'relative block aspect-[900/500] w-full max-w-[900px] shrink-0 cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed'
                    : 'relative block aspect-[600/337] w-full max-w-[600px] shrink-0 cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed'
            }
        >
            <img
                src={posterAsset.src}
                alt="两位同学一起读书的视频封面"
                width={translation ? 900 : 600}
                height={translation ? 500 : 337}
                className="h-full w-full object-cover"
            />
            {maskSubtitles && (
                <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-[77.023%] h-[8.738%] bg-canvas/50 backdrop-blur-[4px]"
                />
            )}
            {!state.playRequested && (
                <img
                    src={playAsset.src}
                    alt=""
                    width={80}
                    height={80}
                    className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 md:size-20"
                />
            )}
        </button>
    )
}
