import type { AnimationItem } from 'lottie-web'

export interface LottieData {
    readonly w: number
    readonly h: number
    readonly fr: number
    readonly ip: number
    readonly op: number
    readonly layers: readonly unknown[]
}

export interface LottiePlaybackOptions {
    readonly loadData: () => Promise<LottieData>
    readonly loop: boolean
    readonly speed?: number
    readonly onReady?: () => void
    readonly onComplete?: () => void
    readonly onError?: () => void
}

export interface LottiePlayback {
    readonly play: () => void
    readonly pause: () => void
    readonly stop: () => void
    readonly still: () => void
    readonly destroy: () => void
}

/** Only called after mount. The light SVG player has no expression evaluator. */
export function createLottiePlayback(
    container: HTMLElement,
    options: LottiePlaybackOptions,
): LottiePlayback {
    let animation: AnimationItem | null = null
    let disposed = false
    let ready = false
    let command: 'play' | 'pause' | 'stop' | 'still' = 'pause'

    function apply(): void {
        if (disposed || !ready || animation === null) return
        if (command === 'play') animation.play()
        else if (command === 'pause') animation.pause()
        else if (command === 'stop') animation.stop()
        else animation.goToAndStop(Math.floor(animation.totalFrames * 0.35), true)
    }

    function failed(): void {
        if (disposed) return
        animation?.destroy()
        animation = null
        container.dataset.lottieStatus = 'error'
        options.onError?.()
    }

    container.dataset.lottieStatus = 'loading'
    void Promise.all([import('lottie-web/build/player/lottie_light.js'), options.loadData()])
        .then(([module, data]): void => {
            if (disposed) return
            animation = module.default.loadAnimation({
                container,
                renderer: 'svg',
                loop: options.loop,
                autoplay: false,
                animationData: structuredClone(data),
                rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
            })
            animation.setSpeed(options.speed ?? 1)
            animation.addEventListener('error', failed)
            animation.addEventListener('data_failed', failed)
            animation.addEventListener('complete', (): void => {
                if (disposed) return
                container.dataset.lottieStatus = 'complete'
                options.onComplete?.()
            })
            function loaded(): void {
                if (disposed) return
                ready = true
                container.dataset.lottieStatus = 'ready'
                options.onReady?.()
                apply()
            }
            animation.addEventListener('DOMLoaded', loaded)
            if (animation.isLoaded) loaded()
        })
        .catch(failed)

    return {
        play(): void {
            command = 'play'
            apply()
        },
        pause(): void {
            command = 'pause'
            apply()
        },
        stop(): void {
            command = 'stop'
            apply()
        },
        still(): void {
            command = 'still'
            apply()
        },
        destroy(): void {
            disposed = true
            animation?.destroy()
            animation = null
            container.replaceChildren()
            delete container.dataset.lottieStatus
        },
    }
}
