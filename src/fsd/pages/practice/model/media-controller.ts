export type PracticeMediaStatus =
    'unavailable' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export interface PracticeMediaSnapshot {
    readonly status: PracticeMediaStatus
    readonly position: number
    readonly duration: number
    readonly volume: number
    readonly rate: number
    readonly playRequested: boolean
    readonly error: string | null
}

export interface PracticeMediaElement {
    src: string
    currentTime: number
    readonly duration: number
    readonly readyState: number
    volume: number
    playbackRate: number
    readonly paused: boolean
    readonly error: { readonly code: number } | null
    play: () => Promise<void>
    pause: () => void
    load: () => void
    removeAttribute: (name: string) => void
    addEventListener: (type: string, listener: EventListener) => void
    removeEventListener: (type: string, listener: EventListener) => void
}

export interface PracticeMediaController {
    readonly snapshot: () => PracticeMediaSnapshot
    readonly setSource: (source: string | undefined) => void
    readonly play: () => Promise<void>
    readonly pause: () => void
    readonly stop: () => void
    readonly seek: (position: number) => void
    readonly setVolume: (volume: number) => void
    readonly setRate: (rate: number) => void
    readonly dispose: () => void
}

export interface PracticeMediaGroup {
    readonly register: (stop: () => void) => () => void
    readonly activate: (stop: () => void) => void
    readonly release: (stop: () => void) => void
    readonly stopAll: () => void
}

export const emptyPracticeMediaSnapshot: PracticeMediaSnapshot = {
    status: 'unavailable',
    position: 0,
    duration: 0,
    volume: 1,
    rate: 1,
    playRequested: false,
    error: null,
}

/** P0 仅接收站内根路径；同一地址可由 Web 和 Electron 静态资源映射读取。 */
export function practiceMediaSource(source: string | undefined): string | null {
    if (!source || source.trim() !== source || !source.startsWith('/') || source.startsWith('//'))
        return null
    if (
        [...source].some(
            (character) =>
                character === '\\' ||
                character.charCodeAt(0) <= 32 ||
                character.charCodeAt(0) === 127,
        )
    )
        return null
    try {
        const pathname = decodeURIComponent(source.split(/[?#]/, 1)[0] ?? '')
        if (pathname.startsWith('//') || pathname.includes('\\')) return null
        if (pathname.split('/').some((segment) => segment === '.' || segment === '..')) return null
    } catch {
        return null
    }
    return source
}

export function formatPracticeMediaTime(seconds: number): string {
    const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    return `${Math.floor(total / 60)
        .toString()
        .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export function createPracticeMediaGroup(): PracticeMediaGroup {
    const members = new Set<() => void>()
    let active: (() => void) | null = null
    return {
        register(stop): () => void {
            members.add(stop)
            return (): void => {
                members.delete(stop)
                if (active === stop) active = null
            }
        },
        activate(stop): void {
            if (active !== null && active !== stop) active()
            active = stop
        },
        release(stop): void {
            if (active === stop) active = null
        },
        stopAll(): void {
            for (const stop of members) stop()
            active = null
        },
    }
}

// 仅本练习页的内容媒体共享，不含短音效、TTS 或录音。
const practiceMediaGroup = createPracticeMediaGroup()

export function stopPracticeMedia(): void {
    practiceMediaGroup.stopAll()
}

function bounded(value: number, maximum: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.min(maximum, value)) : 0
}

function playbackError(error: unknown): string {
    if (error instanceof Error && error.name === 'NotAllowedError')
        return '浏览器尚未允许播放，请点击播放重试。'
    if (error instanceof Error && error.name === 'NotSupportedError')
        return '当前媒体格式无法播放，请更换受支持的本地素材。'
    return '播放失败，请检查素材后重试。'
}

function mediaError(code: number): string {
    if (code === 1) return '媒体加载已中止，可点击播放重试。'
    if (code === 2) return '媒体加载失败，请检查本地素材或连接后重试。'
    if (code === 3) return '媒体解码失败，请更换受支持的素材。'
    if (code === 4) return '当前媒体格式或地址无法播放。'
    return '媒体无法加载，请检查素材后重试。'
}

export function createPracticeMediaController(
    element: PracticeMediaElement,
    onChange: (snapshot: PracticeMediaSnapshot) => void,
    group: PracticeMediaGroup = practiceMediaGroup,
): PracticeMediaController {
    let current: PracticeMediaSnapshot = {
        ...emptyPracticeMediaSnapshot,
        volume: element.volume,
        rate: element.playbackRate,
    }
    let source: string | null = null
    let disposed = false
    let playbackVersion = 0
    let wantsPlayback = false

    function update(next: Partial<PracticeMediaSnapshot>): void {
        if (disposed) return
        current = { ...current, ...next }
        onChange(current)
    }

    function position(): number {
        return Number.isFinite(element.currentTime) ? Math.max(0, element.currentTime) : 0
    }

    function duration(): number {
        return Number.isFinite(element.duration) ? Math.max(0, element.duration) : 0
    }

    function pause(): void {
        if (disposed) return
        playbackVersion += 1
        wantsPlayback = false
        element.pause()
        group.release(stop)
        update({
            status: source === null ? 'unavailable' : 'paused',
            position: position(),
            playRequested: false,
        })
    }

    function stop(): void {
        if (disposed) return
        pause()
        try {
            element.currentTime = 0
        } catch {
            // 尚无可定位数据时仍保留真实媒体的当前位置。
        }
        update({
            status: source === null ? 'unavailable' : element.readyState >= 2 ? 'ready' : 'loading',
            position: position(),
        })
    }

    const unregister = group.register(stop)

    function onMetadata(): void {
        update({
            duration: duration(),
            position: position(),
        })
    }

    function onCanPlay(): void {
        onMetadata()
        if (current.status === 'loading' && !wantsPlayback) update({ status: 'ready' })
    }

    function onPlaying(): void {
        if (!wantsPlayback || disposed) {
            element.pause()
            return
        }
        group.activate(stop)
        update({ status: 'playing', playRequested: true, error: null })
    }

    function onPause(): void {
        if (disposed || !element.paused) return
        wantsPlayback = false
        group.release(stop)
        update({
            status: source === null ? 'unavailable' : 'paused',
            position: position(),
            playRequested: false,
        })
    }

    function onEnded(): void {
        wantsPlayback = false
        group.release(stop)
        update({ status: 'ended', position: position(), playRequested: false })
    }

    function onError(): void {
        if (element.error === null || disposed) return
        wantsPlayback = false
        playbackVersion += 1
        group.release(stop)
        update({ status: 'error', error: mediaError(element.error.code), playRequested: false })
    }

    const listeners: readonly [string, EventListener][] = [
        ['loadedmetadata', onMetadata],
        ['durationchange', onMetadata],
        ['canplay', onCanPlay],
        ['playing', onPlaying],
        ['pause', onPause],
        ['ended', onEnded],
        ['error', onError],
        ['timeupdate', (): void => update({ position: position(), duration: duration() })],
        ['volumechange', (): void => update({ volume: element.volume })],
        ['ratechange', (): void => update({ rate: element.playbackRate })],
        [
            'waiting',
            (): void => {
                if (wantsPlayback) update({ status: 'loading' })
            },
        ],
    ]
    for (const [type, listener] of listeners) element.addEventListener(type, listener)

    return {
        snapshot: (): PracticeMediaSnapshot => current,
        setSource(nextSource): void {
            if (disposed) return
            stop()
            source = practiceMediaSource(nextSource)
            update({
                status: source === null ? 'unavailable' : 'loading',
                position: 0,
                duration: 0,
                error: nextSource && source === null ? '仅支持项目内已落实的本地媒体地址。' : null,
                playRequested: false,
            })
            if (source === null) element.removeAttribute('src')
            else element.src = source
            try {
                element.load()
            } catch (error: unknown) {
                update({ status: 'error', error: playbackError(error) })
            }
        },
        async play(): Promise<void> {
            if (disposed || source === null) return
            const version = ++playbackVersion
            wantsPlayback = true
            group.activate(stop)
            update({ playRequested: true, error: null })
            try {
                await element.play()
                if (disposed || (version !== playbackVersion && !wantsPlayback)) element.pause()
            } catch (error: unknown) {
                if (disposed || version !== playbackVersion) return
                wantsPlayback = false
                group.release(stop)
                update({ status: 'error', error: playbackError(error), playRequested: false })
            }
        },
        pause,
        stop,
        seek(nextPosition): void {
            if (disposed || source === null || duration() === 0) return
            try {
                element.currentTime = bounded(nextPosition, duration())
                update({ position: position() })
            } catch {
                update({ error: '当前媒体尚不可定位，请稍后重试。' })
            }
        },
        setVolume(volume): void {
            if (disposed) return
            try {
                element.volume = bounded(volume, 1)
                update({ volume: element.volume })
            } catch {
                update({ error: '当前浏览器不支持页面内调节音量，请使用设备音量。' })
            }
        },
        setRate(rate): void {
            if (disposed || !Number.isFinite(rate)) return
            try {
                element.playbackRate = Math.max(0.5, Math.min(2, rate))
                update({ rate: element.playbackRate })
            } catch {
                update({ error: '当前媒体不支持该播放倍速。' })
            }
        },
        dispose(): void {
            if (disposed) return
            disposed = true
            playbackVersion += 1
            wantsPlayback = false
            unregister()
            for (const [type, listener] of listeners) element.removeEventListener(type, listener)
            element.pause()
            element.removeAttribute('src')
            try {
                element.load()
            } catch {
                // 本轮已销毁，清理异常不允许重新写入 UI 或重试播放。
            }
        },
    }
}
