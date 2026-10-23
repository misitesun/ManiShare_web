'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import type { LearningPreferences } from '../../../features/learning-settings'
import { videoListeningSegments } from '../model/video-listening-demo'
import type { VideoListeningPlayback } from '../model/video-listening-playback'
import { AnnotatedText } from './AnnotatedText'
import { VideoListeningControls } from './VideoListeningControls'
import { VideoPracticeLayout } from './VideoPracticeLayout'
import posterAsset from '../assets/video-listening/poster.png'
import playAsset from '../assets/video-listening/play.png'

interface VideoListeningExerciseProps {
    readonly controller: VideoListeningPlayback
    readonly values: LearningPreferences
    readonly blocked: boolean
    readonly answerVisible: boolean
    readonly onAnswer: () => void
    readonly onFullscreen: () => void
}

/** 封面与一条模拟音轨共享生命周期，切句只定位媒体时间。 */
export function VideoListeningExercise({
    controller,
    values,
    blocked,
    answerVisible,
    onAnswer,
    onFullscreen,
}: VideoListeningExerciseProps): ReactElement {
    const state = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot,
    )
    const audio = useRef<HTMLAudioElement>(null)
    const segment = videoListeningSegments[state.index]
    useEffect(() => {
        const element = audio.current
        if (!element) return
        return controller.attach(element)
    }, [controller])
    useEffect(() => {
        function suspend(): void {
            if (document.hidden) controller.pause()
        }
        document.addEventListener('visibilitychange', suspend)
        return (): void => document.removeEventListener('visibilitychange', suspend)
    }, [controller])
    return (
        <VideoPracticeLayout
            open={state.contentOpen}
            currentIndex={state.index}
            segments={videoListeningSegments}
            heardIds={state.heardIds}
            onSelect={controller.select}
            onClose={controller.closeContent}
            onCompactChange={controller.setCompact}
            controls={
                <VideoListeningControls
                    controller={controller}
                    state={state}
                    blocked={blocked}
                    answerVisible={answerVisible}
                    onAnswer={onAnswer}
                    onFullscreen={onFullscreen}
                />
            }
        >
            <audio ref={audio} preload="metadata" className="hidden" aria-hidden="true" />
            <span className="sr-only">当前使用封面和单条模拟音轨演示视频播放。</span>
            <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
                <button
                    type="button"
                    aria-label={state.playRequested ? '暂停视频' : '播放视频'}
                    data-practice-command="practice.readAloud"
                    disabled={blocked}
                    className="relative block aspect-[1100/618] w-full cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
                    onClick={controller.toggle}
                >
                    <img
                        src={posterAsset.src}
                        alt="两位同学一起读书的视频封面"
                        width={1100}
                        height={618}
                        className="h-full w-full object-cover"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-canvas/20" />
                    {values.maskSubtitles && (
                        <span
                            aria-hidden="true"
                            data-video-subtitle-mask
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
                {segment && (
                    <div
                        aria-label="当前视频句子解析"
                        className="mt-[18px] flex max-w-full flex-col items-center gap-[14px] text-foreground"
                    >
                        <AnnotatedText
                            question={segment.question}
                            values={values}
                            variant="video-listening"
                            videoDisplay={state.subtitles}
                        />
                        {state.subtitles.translation && (
                            <p className="px-3 text-center text-[20px] font-medium leading-7">
                                {segment.question.translation}
                            </p>
                        )}
                    </div>
                )}
                {state.error && (
                    <p role="alert" className="mt-4 text-body text-danger">
                        {state.error}
                    </p>
                )}
                {state.waiting && (
                    <p role="status" className="mt-2 text-caption text-practice-muted">
                        句间停顿，稍后播放下一句
                    </p>
                )}
            </div>
        </VideoPracticeLayout>
    )
}
