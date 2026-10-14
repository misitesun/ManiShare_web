export type BackgroundMusicPhase = 'idle' | 'empty' | 'starting' | 'playing' | 'paused' | 'error'
export type BackgroundMusicIssue = 'missing' | 'blocked' | 'failed' | null

export interface BackgroundMusicSnapshot {
    readonly phase: BackgroundMusicPhase
    readonly issue: BackgroundMusicIssue
    readonly promptOpen: boolean
    readonly trackIndex: number
}

type MusicEvent = 'playing' | 'pause' | 'ended' | 'error'

export interface BackgroundMusicPlayer {
    src: string
    preload: string
    play(): Promise<void>
    pause(): void
    load(): void
    removeAttribute(name: string): void
    addEventListener(event: MusicEvent, listener: () => void): void
    removeEventListener(event: MusicEvent, listener: () => void): void
}

export interface BackgroundMusicController {
    getSnapshot(): BackgroundMusicSnapshot
    subscribe(listener: () => void): () => void
    start(): Promise<void>
    confirm(): Promise<void>
    pause(): void
    openPrompt(): void
    dismiss(): void
    dispose(): void
}

export const initialBackgroundMusicSnapshot: BackgroundMusicSnapshot = {
    phase: 'idle',
    issue: null,
    promptOpen: false,
    trackIndex: 0,
}

// 后续补充素材时，将可用的同源音频 URL 填入此列表。
// 保持为空时不创建播放器、不设置空 src，也不发起音频请求。
export const collaborationMusicTracks: readonly string[] = []

function isAutoplayBlocked(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'NotAllowedError'
    )
}

export function createBackgroundMusicController(
    playlist: readonly string[],
    createPlayer: () => BackgroundMusicPlayer,
): BackgroundMusicController {
    const tracks = playlist.map((track) => track.trim()).filter((track) => track.length > 0)
    const subscribers = new Set<() => void>()
    let snapshot = initialBackgroundMusicSnapshot
    let active = false
    let dismissed = false
    let player: BackgroundMusicPlayer | null = null
    let loadedTrackIndex: number | null = null
    let requestId = 0

    function getSnapshot(): BackgroundMusicSnapshot {
        return snapshot
    }

    function update(patch: Partial<BackgroundMusicSnapshot>): void {
        snapshot = { ...snapshot, ...patch }
        subscribers.forEach((listener) => listener())
    }
    function fail(issue: BackgroundMusicIssue): void {
        requestId += 1
        update({ phase: 'error', issue, promptOpen: !dismissed })
    }
    function onPlaying(): void {
        if (!active) return
        if (snapshot.phase === 'starting' || snapshot.phase === 'playing') {
            update({ phase: 'playing', issue: null, promptOpen: false })
        } else player?.pause()
    }
    function onPause(): void {
        if (active && snapshot.phase === 'playing') {
            requestId += 1
            update({ phase: 'paused', promptOpen: false })
        }
    }
    function onEnded(): void {
        if (!active || snapshot.phase !== 'playing' || tracks.length === 0) return
        loadedTrackIndex = null
        update({ phase: 'paused', trackIndex: (snapshot.trackIndex + 1) % tracks.length })
        void attempt()
    }
    function onError(): void {
        if (active) fail('failed')
    }
    const listeners: Readonly<Record<MusicEvent, () => void>> = {
        playing: onPlaying,
        pause: onPause,
        ended: onEnded,
        error: onError,
    }

    function preparePlayer(): BackgroundMusicPlayer {
        if (player === null) {
            player = createPlayer()
            player.preload = 'none'
            for (const event of ['playing', 'pause', 'ended', 'error'] as const) {
                player.addEventListener(event, listeners[event])
            }
        }
        const track = tracks[snapshot.trackIndex]
        if (track !== undefined && loadedTrackIndex !== snapshot.trackIndex) {
            player.src = track
            loadedTrackIndex = snapshot.trackIndex
        }
        return player
    }

    async function attempt(): Promise<void> {
        if (!active || snapshot.phase === 'starting') return
        if (tracks.length === 0) {
            fail('missing')
            return
        }
        const currentRequest = ++requestId
        let attemptedPlayer: BackgroundMusicPlayer | null = null
        update({ phase: 'starting', issue: null })
        try {
            attemptedPlayer = preparePlayer()
            // 在确认按钮的调用栈里直接调用 play，不能先 await 接口或定时器。
            await attemptedPlayer.play()
            const latestPhase = getSnapshot().phase
            if (!active || currentRequest !== requestId || attemptedPlayer !== player) {
                if (
                    !active ||
                    attemptedPlayer !== player ||
                    (latestPhase !== 'starting' && latestPhase !== 'playing')
                )
                    attemptedPlayer.pause()
                return
            }
            update({ phase: 'playing', issue: null, promptOpen: false })
        } catch (error: unknown) {
            if (active && currentRequest === requestId)
                fail(isAutoplayBlocked(error) ? 'blocked' : 'failed')
        }
    }

    function pause(): void {
        requestId += 1
        update({ phase: 'paused', issue: null, promptOpen: false })
        player?.pause()
    }

    return {
        getSnapshot,
        subscribe(listener): () => void {
            subscribers.add(listener)
            return (): void => {
                subscribers.delete(listener)
            }
        },
        start(): Promise<void> {
            if (active) return Promise.resolve()
            active = true
            dismissed = false
            update({ ...initialBackgroundMusicSnapshot })
            if (tracks.length === 0) {
                update({ phase: 'empty', issue: 'missing', promptOpen: true })
                return Promise.resolve()
            }
            return attempt()
        },
        confirm(): Promise<void> {
            dismissed = false
            if (snapshot.issue === 'failed') loadedTrackIndex = null
            return attempt()
        },
        pause,
        openPrompt(): void {
            dismissed = false
            update({ promptOpen: true })
        },
        dismiss(): void {
            dismissed = true
            if (snapshot.phase === 'starting') pause()
            else update({ promptOpen: false })
        },
        dispose(): void {
            active = false
            requestId += 1
            if (player !== null) {
                const previousPlayer = player
                player = null
                loadedTrackIndex = null
                for (const event of ['playing', 'pause', 'ended', 'error'] as const)
                    previousPlayer.removeEventListener(event, listeners[event])
                previousPlayer.pause()
                previousPlayer.removeAttribute('src')
                previousPlayer.load()
            }
        },
    }
}

export function backgroundMusicPromptMessage(snapshot: BackgroundMusicSnapshot): string {
    if (snapshot.issue === 'missing')
        return snapshot.phase === 'empty' ? '背景音乐暂未配置。' : '音乐暂未配置，无法播放。'
    if (snapshot.issue === 'blocked') return '浏览器限制自动播放，请确认。'
    if (snapshot.issue === 'failed') return '音乐加载失败，请确认后重试。'
    if (snapshot.phase === 'starting') return '正在尝试播放背景音乐…'
    return '是否播放本页面的背景音乐？'
}
