export type SoundPlaybackPhase = 'starting' | 'playing' | 'ended' | 'blocked' | 'failed' | 'stopped'

export interface SoundAudio {
    src: string
    volume: number
    currentTime: number
    preload: string
    play(): Promise<void>
    pause(): void
    load(): void
    removeAttribute(name: string): void
    addEventListener(type: 'ended' | 'error', listener: () => void): void
    removeEventListener(type: 'ended' | 'error', listener: () => void): void
}

export interface SoundPlayback {
    readonly src: string
    readonly volume: number
    readonly onPhase: (phase: SoundPlaybackPhase) => void
}

export interface SoundPlayer {
    play(request: SoundPlayback): void
    stop(): void
    dispose(): void
    isActive(): boolean
    setVolume(volume: number): void
}

/** 单通道、按需创建；高频输入可保留一个解码后的媒体元素，资源切换和卸载均释放。 */
export function createSoundPlayer(
    createAudio: () => SoundAudio,
    retainSource = false,
): SoundPlayer {
    let disposed = false
    let generation = 0
    let cached: { readonly audio: SoundAudio; readonly src: string } | undefined
    let current:
        | {
              readonly onPhase: SoundPlayback['onPhase']
              readonly ended: () => void
              readonly error: () => void
          }
        | undefined

    function release(clearSource: boolean): void {
        generation += 1
        const request = current
        current = undefined
        if (!cached) return
        const { audio } = cached
        if (request) {
            audio.removeEventListener('ended', request.ended)
            audio.removeEventListener('error', request.error)
        }
        audio.pause()
        try {
            audio.currentTime = 0
        } catch {
            // 尚未加载元数据时部分浏览器拒绝定位；停止和资源释放仍继续。
        }
        if (clearSource) {
            cached = undefined
            audio.removeAttribute('src')
            audio.load()
        }
    }

    function play(request: SoundPlayback): void {
        if (disposed) return
        release(!retainSource || cached?.src !== request.src)
        if (
            !request.src.trim() ||
            !Number.isFinite(request.volume) ||
            request.volume < 0 ||
            request.volume > 1
        ) {
            request.onPhase('failed')
            return
        }
        const run = generation
        function finish(phase: 'ended' | 'failed' | 'blocked'): void {
            if (disposed || generation !== run || !current) return
            release(!retainSource || phase !== 'ended')
            request.onPhase(phase)
        }
        function ended(): void {
            finish('ended')
        }
        function error(): void {
            finish('failed')
        }
        try {
            if (!cached) {
                const audio = createAudio()
                cached = { audio, src: request.src }
                audio.preload = 'auto'
                audio.src = request.src
            }
            const { audio } = cached
            current = { onPhase: request.onPhase, ended, error }
            audio.addEventListener('ended', ended)
            audio.addEventListener('error', error)
            audio.volume = request.volume
            request.onPhase('starting')
            void audio.play().then(
                (): void => {
                    if (!disposed && generation === run && current) request.onPhase('playing')
                },
                (reason: unknown): void => {
                    finish(
                        reason instanceof Error && reason.name === 'NotAllowedError'
                            ? 'blocked'
                            : 'failed',
                    )
                },
            )
        } catch {
            release(true)
            request.onPhase('failed')
        }
    }

    return {
        play,
        stop(): void {
            const onPhase = current?.onPhase
            release(true)
            onPhase?.('stopped')
        },
        dispose(): void {
            release(true)
            disposed = true
        },
        isActive(): boolean {
            return current !== undefined
        },
        setVolume(volume: number): void {
            if (cached && Number.isFinite(volume) && volume >= 0 && volume <= 1)
                cached.audio.volume = volume
        },
    }
}
