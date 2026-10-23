import { createPracticeMediaController, emptyPracticeMediaSnapshot } from './media-controller'
import type {
    PracticeMediaController,
    PracticeMediaElement,
    PracticeMediaSnapshot,
} from './media-controller'
import {
    videoListeningDuration,
    videoListeningSegments,
    videoListeningSource,
} from './video-listening-demo'

export const videoPlaybackRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
export type VideoSentenceRhythm = 'continuous' | 'sentence-end'
export interface VideoSubtitleOptions {
    readonly translation: boolean
    readonly english: boolean
    readonly phonetics: boolean
    readonly partOfSpeech: boolean
    readonly meaning: boolean
}
export interface VideoListeningNavigation {
    readonly index: number
    readonly finished: boolean
    readonly contentOpen: boolean
    readonly modalOpen: boolean
}
export interface VideoListeningSnapshot extends PracticeMediaSnapshot, VideoListeningNavigation {
    readonly repeat: number
    readonly activeRepeat: number
    readonly pass: number
    readonly rhythm: VideoSentenceRhythm
    readonly gap: number
    readonly waiting: boolean
    readonly heardIds: readonly string[]
    readonly subtitles: VideoSubtitleOptions
}
export interface VideoReadingSnapshot {
    readonly status: PracticeMediaSnapshot['status']
    readonly error: string | null
    readonly playRequested: boolean
}
const emptyVideoReadingSnapshot: VideoReadingSnapshot = {
    status: 'unavailable',
    error: null,
    playRequested: false,
}
export function getEmptyVideoReadingSnapshot(): VideoReadingSnapshot {
    return emptyVideoReadingSnapshot
}
export const emptyVideoListeningNavigation: VideoListeningNavigation = {
    index: 0,
    finished: false,
    contentOpen: false,
    modalOpen: false,
}
export function getEmptyVideoListeningNavigation(): VideoListeningNavigation {
    return emptyVideoListeningNavigation
}
export function subscribeInactiveVideoListening(): () => void {
    return (): void => {}
}
export function getVideoSentenceIndex(position: number): number {
    if (!Number.isFinite(position)) return 0
    const index = videoListeningSegments.findIndex((segment) => position < segment.end)
    return index < 0 ? videoListeningSegments.length - 1 : index
}
export function getVideoSubtitleOptions(): VideoSubtitleOptions {
    return { translation: true, english: true, phonetics: true, partOfSpeech: true, meaning: true }
}
export interface VideoListeningPlayback {
    readonly getSnapshot: () => VideoListeningSnapshot
    readonly getReadingSnapshot: () => VideoReadingSnapshot
    readonly getNavigation: () => VideoListeningNavigation
    readonly getServerNavigation: () => VideoListeningNavigation
    readonly subscribe: (listener: () => void) => () => void
    readonly subscribeNavigation: (listener: () => void) => () => void
    readonly attach: (element: PracticeMediaElement) => () => void
    readonly play: () => Promise<void>
    readonly pause: () => void
    readonly toggle: () => void
    /** 内容列表选句：从句首播放，窄屏先关闭列表；其他切题入口沿原播放意图。 */
    readonly select: (index: number) => void
    readonly move: (delta: number) => void
    readonly seek: (position: number) => void
    readonly reset: () => void
    readonly setBlocked: (blocked: boolean) => void
    readonly setCompact: (compact: boolean) => void
    readonly toggleContent: () => void
    readonly closeContent: () => void
    readonly setRate: (rate: number) => void
    readonly setVolume: (volume: number) => void
    readonly setRepeat: (repeat: number) => void
    readonly setRhythm: (rhythm: VideoSentenceRhythm) => void
    readonly setGap: (gap: number) => void
    readonly setSubtitle: (key: keyof VideoSubtitleOptions, checked: boolean) => void
}

interface VideoPlaybackOptions {
    readonly completion?: 'heard-all' | 'manual'
    readonly rhythm?: VideoSentenceRhythm
}

/** 一个稳定媒体宿主和一条音轨；自查可由题目流程完成，默认仍为听完全部句子。 */
export function createVideoListeningPlayback(
    options: VideoPlaybackOptions = {},
): VideoListeningPlayback {
    let state: VideoListeningSnapshot = {
        ...emptyPracticeMediaSnapshot,
        ...emptyVideoListeningNavigation,
        duration: videoListeningDuration,
        repeat: 1,
        activeRepeat: 1,
        pass: 1,
        rhythm: options.rhythm ?? 'continuous',
        gap: 0,
        waiting: false,
        heardIds: [],
        subtitles: getVideoSubtitleOptions(),
    }
    let navigation: VideoListeningNavigation = emptyVideoListeningNavigation
    let reading: VideoReadingSnapshot = emptyVideoReadingSnapshot
    const listeners = new Set<() => void>()
    const navigationListeners = new Set<() => void>()
    let media: PracticeMediaController | null = null
    let element: PracticeMediaElement | null = null
    let frame: number | null = null
    let task: ReturnType<typeof setTimeout> | null = null
    let generation = 0
    let attachment = 0
    let blocked = false
    let compact = true
    let wanted = false
    let internal = false
    let boundaryHandled = false
    let eligible = true
    let restorePosition: number | null = null

    function publish(next: Partial<VideoListeningSnapshot>): void {
        state = { ...state, ...next }
        if (
            reading.status !== state.status ||
            reading.error !== state.error ||
            reading.playRequested !== state.playRequested
        )
            reading = {
                status: state.status,
                error: state.error,
                playRequested: state.playRequested,
            }
        for (const listener of listeners) listener()
        if (
            navigation.index !== state.index ||
            navigation.finished !== state.finished ||
            navigation.contentOpen !== state.contentOpen ||
            navigation.modalOpen !== state.modalOpen
        ) {
            navigation = {
                index: state.index,
                finished: state.finished,
                contentOpen: state.contentOpen,
                modalOpen: state.modalOpen,
            }
            for (const listener of navigationListeners) listener()
        }
    }
    function cancelPending(): void {
        generation += 1
        if (task !== null) clearTimeout(task)
        task = null
        if (frame !== null) cancelAnimationFrame(frame)
        frame = null
    }
    function pauseMedia(): void {
        internal = true
        media?.pause()
        internal = false
    }
    function locate(position: number): void {
        restorePosition = position
        if (media && (element?.duration ?? 0) > 0) {
            restorePosition = null
            internal = true
            media.seek(position)
            internal = false
        }
        publish({ position })
    }
    function pause(): void {
        const segment = videoListeningSegments[state.index]
        const position = restorePosition ?? element?.currentTime ?? state.position
        wanted = false
        cancelPending()
        pauseMedia()
        publish({
            playRequested: false,
            waiting: false,
            status: state.finished ? 'ended' : 'paused',
            position:
                segment && Number.isFinite(position)
                    ? Math.max(segment.start, Math.min(segment.end, position))
                    : state.position,
        })
    }
    function scheduleFrame(): void {
        if (frame !== null || !wanted || blocked || state.waiting || !element) return
        frame = requestAnimationFrame((): void => {
            frame = null
            if (element && wanted && !blocked) samplePosition(element.currentTime)
            scheduleFrame()
        })
    }
    async function resumeMedia(): Promise<void> {
        if (!media || blocked || state.modalOpen || state.finished || !wanted) return
        publish({ playRequested: true, waiting: false, error: null })
        await media.play()
        if (wanted && !blocked) scheduleFrame()
    }
    async function play(): Promise<void> {
        if (blocked || state.modalOpen || state.finished || !media) return
        const segment = videoListeningSegments[state.index]
        if (!segment) return
        cancelPending()
        if (state.position >= segment.end - 0.01) {
            eligible = true
            boundaryHandled = false
            publish({ pass: 1 })
            locate(segment.start)
        } else locate(state.position)
        wanted = true
        await resumeMedia()
    }
    function select(index: number, autoplay = wanted): void {
        if (!Number.isFinite(index) || state.finished) return
        const nextIndex = Math.min(
            videoListeningSegments.length - 1,
            Math.max(0, Math.trunc(index)),
        )
        const segment = videoListeningSegments[nextIndex]
        if (!segment) return
        cancelPending()
        pauseMedia()
        wanted = autoplay && !blocked
        eligible = true
        boundaryHandled = false
        publish({
            index: nextIndex,
            position: segment.start,
            pass: 1,
            activeRepeat: state.repeat,
            waiting: false,
            playRequested: wanted,
            status: 'paused',
            error: null,
        })
        locate(segment.start)
        if (wanted) void resumeMedia()
    }
    function completeSegment(): void {
        const segment = videoListeningSegments[state.index]
        if (!segment || boundaryHandled || !wanted || blocked) return
        boundaryHandled = true
        if (state.pass < state.activeRepeat) {
            pauseMedia()
            publish({ pass: state.pass + 1 })
            locate(segment.start)
            boundaryHandled = false
            void resumeMedia()
            return
        }
        const heardIds =
            eligible && !state.heardIds.includes(segment.id)
                ? [...state.heardIds, segment.id]
                : state.heardIds
        publish({ heardIds, position: segment.end })
        if (options.completion !== 'manual' && heardIds.length === videoListeningSegments.length) {
            pauseMedia()
            wanted = false
            cancelPending()
            publish({
                finished: true,
                status: 'ended',
                playRequested: false,
                waiting: false,
                contentOpen: false,
                modalOpen: false,
            })
            return
        }
        if (state.rhythm === 'sentence-end' || state.index === videoListeningSegments.length - 1) {
            pause()
            return
        }
        const nextIndex = state.index + 1
        if (state.gap === 0) {
            const next = videoListeningSegments[nextIndex]
            if (!next) return
            // 时间段连续：音轨继续播放，仅同步句子，不在零停顿模式逐句 pause/play。
            eligible = true
            boundaryHandled = false
            publish({
                index: nextIndex,
                position: Math.max(
                    next.start,
                    Math.min(next.end, element?.currentTime ?? next.start),
                ),
                pass: 1,
                activeRepeat: state.repeat,
            })
        } else {
            pauseMedia()
            const version = generation
            publish({ waiting: true, playRequested: true, status: 'paused' })
            task = setTimeout((): void => {
                task = null
                if (version === generation && wanted && !blocked) select(nextIndex, true)
            }, state.gap * 1000)
        }
    }
    function samplePosition(position: number): void {
        const segment = videoListeningSegments[state.index]
        if (!segment || !Number.isFinite(position)) return
        const bounded = Math.max(segment.start, Math.min(segment.end, position))
        if (Math.abs(bounded - state.position) >= 0.04) publish({ position: bounded })
        // 整轨末尾由 ended 收口，避免原生 pause/ended 先后触发时打断最后一句的重播。
        if (
            wanted &&
            !state.waiting &&
            state.index < videoListeningSegments.length - 1 &&
            position >= segment.end
        ) {
            const previousIndex = state.index
            completeSegment()
            // 连续播放下事件可能跨过多个短句；只追上实际已播放的时间，不跳过重复或停顿。
            if (state.index !== previousIndex) samplePosition(position)
        }
    }
    function receiveMedia(next: PracticeMediaSnapshot): void {
        if (!media) return
        if (restorePosition !== null && next.duration > 0) {
            const position = restorePosition
            restorePosition = null
            media.seek(position)
            return
        }
        if (next.status === 'error') {
            wanted = false
            cancelPending()
        } else if (!internal && next.status === 'paused' && !next.playRequested && !state.waiting) {
            const ending =
                wanted &&
                state.index === videoListeningSegments.length - 1 &&
                next.position >= videoListeningDuration - 0.02
            if (!ending) {
                wanted = false
                cancelPending()
            }
        }
        publish({
            status: next.status,
            duration: next.duration || videoListeningDuration,
            error: next.error,
            rate: next.rate,
            volume: next.volume,
            playRequested: wanted,
        })
        if (!internal && !state.waiting) samplePosition(next.position)
        if (next.status === 'playing') scheduleFrame()
        if (next.status === 'ended' && wanted) {
            if (
                state.index === videoListeningSegments.length - 1 &&
                next.position >= videoListeningDuration - 0.02
            )
                completeSegment()
            else void resumeMedia()
        }
    }
    function setContent(open: boolean): void {
        if (open && compact) pause()
        publish({ contentOpen: open, modalOpen: open && compact })
    }

    return {
        getSnapshot: (): VideoListeningSnapshot => state,
        getReadingSnapshot: (): VideoReadingSnapshot => reading,
        getNavigation: (): VideoListeningNavigation => navigation,
        getServerNavigation: getEmptyVideoListeningNavigation,
        subscribe(listener): () => void {
            listeners.add(listener)
            return (): void => {
                listeners.delete(listener)
            }
        },
        subscribeNavigation(listener): () => void {
            navigationListeners.add(listener)
            return (): void => {
                navigationListeners.delete(listener)
            }
        },
        attach(nextElement): () => void {
            const version = ++attachment
            const savedRate = state.rate
            const savedVolume = state.volume
            cancelPending()
            media?.dispose()
            element = nextElement
            restorePosition = state.position
            media = createPracticeMediaController(nextElement, (next): void => {
                if (version === attachment) receiveMedia(next)
            })
            media.setSource(videoListeningSource)
            media.setRate(savedRate)
            media.setVolume(savedVolume)
            return (): void => {
                if (version !== attachment) return
                attachment += 1
                pause()
                media?.dispose()
                media = null
                element = null
            }
        },
        play,
        pause,
        toggle(): void {
            if (wanted) pause()
            else void play()
        },
        select(index): void {
            if (blocked || state.finished || !Number.isFinite(index)) return
            if (compact) setContent(false)
            // 保留在选句的用户手势内调用媒体播放，不依赖弹窗退场后的定时器。
            select(index, true)
        },
        move: (delta): void => {
            const index = state.index + delta
            if (index >= 0 && index < videoListeningSegments.length && index !== state.index)
                select(index)
        },
        seek(position): void {
            if (!Number.isFinite(position) || blocked || state.finished) return
            const bounded = Math.max(0, Math.min(videoListeningDuration, position))
            const index = getVideoSentenceIndex(bounded)
            const autoplay = wanted
            select(index, false)
            eligible = bounded <= (videoListeningSegments[index]?.start ?? 0) + 0.001
            locate(bounded)
            if (bounded >= videoListeningDuration) {
                pause()
                return
            }
            wanted = autoplay
            if (wanted) void resumeMedia()
        },
        reset(): void {
            pause()
            publish({ finished: false, heardIds: [], contentOpen: false, modalOpen: false })
            select(0, false)
        },
        setBlocked(next): void {
            blocked = next
            if (next) pause()
        },
        setCompact(next): void {
            compact = next
            if (compact && state.contentOpen) pause()
            publish({ modalOpen: compact && state.contentOpen })
        },
        toggleContent: (): void => setContent(!state.contentOpen),
        closeContent: (): void => setContent(false),
        setRate(rate): void {
            if (videoPlaybackRates.some((value) => value === rate)) {
                if (media) media.setRate(rate)
                else publish({ rate })
            }
        },
        setVolume(volume): void {
            if (!Number.isFinite(volume)) return
            const bounded = Math.min(1, Math.max(0, volume))
            if (media) media.setVolume(bounded)
            else publish({ volume: bounded })
        },
        setRepeat(repeat): void {
            if (repeat === 1 || repeat === 2 || repeat === 3) publish({ repeat })
        },
        setRhythm: (rhythm): void => {
            publish({ rhythm })
            if (rhythm === 'sentence-end' && state.waiting) pause()
        },
        setGap(gap): void {
            if (Number.isFinite(gap)) publish({ gap: Math.max(0, Math.min(5, gap)) })
        },
        setSubtitle: (key, checked): void => {
            publish({ subtitles: { ...state.subtitles, [key]: checked } })
        },
    }
}
