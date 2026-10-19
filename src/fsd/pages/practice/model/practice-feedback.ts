import { resolveCorrectAnimationId } from '../../../features/learning-settings'
import type { LearningAnimationId, LearningPreferences } from '../../../features/learning-settings'

export type PracticeFeedbackPreferences = Pick<
    LearningPreferences,
    | 'typingSound'
    | 'typingTone'
    | 'typingVolume'
    | 'correctSound'
    | 'correctTone'
    | 'correctVolume'
    | 'errorSound'
    | 'errorTone'
    | 'errorVolume'
    | 'completionSound'
    | 'completionTone'
    | 'completionVolume'
    | 'transitionSound'
    | 'evaluationSound'
    | 'correctEffect'
    | 'correctEffectType'
    | 'completionEffect'
>

export type PracticeFeedbackKind =
    'typing' | 'correct' | 'incorrect' | 'questionChange' | 'chapterComplete' | 'evaluationComplete'

export interface PracticeFeedbackEvent {
    /** 演示会话内递增；相同或更早的事件不会再次播放。 */
    id: number
    kind: PracticeFeedbackKind
}

export interface PracticeFeedbackSoundAsset {
    src: string
    /** 仅切题 / 模拟评测提示使用，经素材确认的 0..1 基准音量。 */
    volume?: number
}

export type PracticeFeedbackSoundAssets = Readonly<
    Record<string, PracticeFeedbackSoundAsset | undefined>
>

export interface PracticeFeedbackSoundSelection {
    key: string
    label: string
    enabled: boolean
    volume: number | null
}

export type PracticeFeedbackSoundPhase =
    | 'idle'
    | 'disabled'
    | 'missing'
    | 'starting'
    | 'playing'
    | 'ended'
    | 'blocked'
    | 'failed'
    | 'stopped'

export interface PracticeFeedbackSoundSnapshot {
    phase: PracticeFeedbackSoundPhase
    eventId: number | null
    soundKey: string | null
    message: string
}

export interface PracticeFeedbackAudio {
    src: string
    volume: number
    preload: string
    play(): Promise<void>
    pause(): void
    load(): void
    removeAttribute(name: string): void
    addEventListener(type: 'ended' | 'error', listener: () => void): void
    removeEventListener(type: 'ended' | 'error', listener: () => void): void
}

export interface PracticeFeedbackSoundController {
    consume(event: PracticeFeedbackEvent, values: PracticeFeedbackPreferences): void
    setActive(active: boolean): void
    updatePreferences(values: PracticeFeedbackPreferences): void
    stop(): void
    dispose(): void
    subscribe(listener: () => void): () => void
    getSnapshot(): PracticeFeedbackSoundSnapshot
}

export const initialPracticeFeedbackSoundSnapshot: PracticeFeedbackSoundSnapshot = {
    phase: 'idle',
    eventId: null,
    soundKey: null,
    message: '',
}

export function getPracticeFeedbackSoundSelection(
    values: PracticeFeedbackPreferences,
    kind: PracticeFeedbackKind,
): PracticeFeedbackSoundSelection {
    switch (kind) {
        case 'typing':
            return {
                key: `typing:${values.typingTone}`,
                label: `打字音效 · ${values.typingTone}`,
                enabled: values.typingSound,
                volume: values.typingVolume / 100,
            }
        case 'correct':
            return {
                key: `correct:${values.correctTone}`,
                label: `答对音效 · ${values.correctTone}`,
                enabled: values.correctSound,
                volume: values.correctVolume / 100,
            }
        case 'incorrect':
            return {
                key: `incorrect:${values.errorTone}`,
                label: `答错音效 · ${values.errorTone}`,
                enabled: values.errorSound,
                volume: values.errorVolume / 100,
            }
        case 'chapterComplete':
            return {
                key: `chapterComplete:${values.completionTone}`,
                label: `章节完成音效 · ${values.completionTone}`,
                enabled: values.completionSound,
                volume: values.completionVolume / 100,
            }
        case 'questionChange':
            return {
                key: 'questionChange',
                label: '切题音效',
                enabled: values.transitionSound,
                volume: null,
            }
        case 'evaluationComplete':
            return {
                key: 'evaluationComplete',
                label: '模拟评测结束音效',
                enabled: values.evaluationSound,
                volume: null,
            }
    }
}

function isPlayableVolume(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1
}

function isPlaybackBlocked(error: unknown): boolean {
    return error instanceof Error && error.name === 'NotAllowedError'
}

/** 一次仅持有一个短音效；未确认素材不创建播放器，不回退为其他音色。 */
export function createPracticeFeedbackSoundController(
    assets: PracticeFeedbackSoundAssets,
    createAudio: () => PracticeFeedbackAudio,
): PracticeFeedbackSoundController {
    let snapshot = initialPracticeFeedbackSoundSnapshot
    let active = true
    let disposed = false
    let lastEventId = -1
    let generation = 0
    let current:
        | {
              audio: PracticeFeedbackAudio
              kind: PracticeFeedbackKind
              onEnded: () => void
              onError: () => void
          }
        | undefined
    const subscribers = new Set<() => void>()

    function publish(next: PracticeFeedbackSoundSnapshot): void {
        if (disposed) return
        snapshot = next
        for (const listener of subscribers) listener()
    }

    function release(): void {
        generation += 1
        if (current === undefined) return
        const { audio, onEnded, onError } = current
        current = undefined
        audio.removeEventListener('ended', onEnded)
        audio.removeEventListener('error', onError)
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
    }

    function stop(): void {
        const hadAudio = current !== undefined
        release()
        if (hadAudio) publish({ ...snapshot, phase: 'stopped', message: '反馈音效已停止' })
    }

    function consume(event: PracticeFeedbackEvent, values: PracticeFeedbackPreferences): void {
        if (disposed || !Number.isSafeInteger(event.id) || event.id < 0 || event.id <= lastEventId)
            return
        lastEventId = event.id
        release()
        const selection = getPracticeFeedbackSoundSelection(values, event.kind)
        const eventSnapshot = { eventId: event.id, soundKey: selection.key }
        if (!active || !selection.enabled) {
            publish({
                ...eventSnapshot,
                phase: 'disabled',
                message: active ? `${selection.label}已关闭` : '练习暂停，未播放反馈音效',
            })
            return
        }
        const asset = assets[selection.key]
        if (asset === undefined || asset.src.trim().length === 0) {
            publish({
                ...eventSnapshot,
                phase: 'missing',
                message: `素材未接入：${selection.label}`,
            })
            return
        }
        const volume = selection.volume ?? asset.volume
        if (!isPlayableVolume(volume)) {
            publish({
                ...eventSnapshot,
                phase: 'missing',
                message: `播放参数未确认：${selection.label}音量`,
            })
            return
        }
        const run = generation
        let audio: PracticeFeedbackAudio
        try {
            audio = createAudio()
        } catch {
            publish({ ...eventSnapshot, phase: 'failed', message: `${selection.label}暂不可播放` })
            return
        }

        function finish(phase: 'ended' | 'failed'): void {
            if (disposed || run !== generation) return
            release()
            publish({
                ...eventSnapshot,
                phase,
                message:
                    phase === 'ended' ? `${selection.label}播放结束` : `${selection.label}加载失败`,
            })
        }

        function onEnded(): void {
            finish('ended')
        }

        function onError(): void {
            finish('failed')
        }

        current = { audio, kind: event.kind, onEnded, onError }
        audio.addEventListener('ended', onEnded)
        audio.addEventListener('error', onError)
        audio.preload = 'none'
        audio.volume = volume
        audio.src = asset.src
        publish({ ...eventSnapshot, phase: 'starting', message: `正在加载：${selection.label}` })
        try {
            void audio.play().then(
                (): void => {
                    if (disposed || run !== generation) return
                    publish({
                        ...eventSnapshot,
                        phase: 'playing',
                        message: `正在播放：${selection.label}`,
                    })
                },
                (error: unknown): void => {
                    if (disposed || run !== generation) return
                    release()
                    publish({
                        ...eventSnapshot,
                        phase: isPlaybackBlocked(error) ? 'blocked' : 'failed',
                        message: isPlaybackBlocked(error)
                            ? '浏览器阻止播放，请再次点击演示按钮重试'
                            : `${selection.label}播放失败`,
                    })
                },
            )
        } catch {
            finish('failed')
        }
    }

    return {
        consume,
        setActive(next: boolean): void {
            active = next
            if (!active) stop()
        },
        updatePreferences(values: PracticeFeedbackPreferences): void {
            if (
                current !== undefined &&
                !getPracticeFeedbackSoundSelection(values, current.kind).enabled
            )
                stop()
        },
        stop,
        dispose(): void {
            release()
            disposed = true
            subscribers.clear()
        },
        subscribe(listener: () => void): () => void {
            subscribers.add(listener)
            return (): void => {
                subscribers.delete(listener)
            }
        },
        getSnapshot(): PracticeFeedbackSoundSnapshot {
            return snapshot
        },
    }
}

export type PracticeAnimationKind = LearningAnimationId

export function getPracticeFeedbackAnimation(
    values: PracticeFeedbackPreferences,
    event: PracticeFeedbackEvent,
): PracticeAnimationKind | null {
    if (event.kind === 'chapterComplete') return values.completionEffect ? 'chapter-complete' : null
    if (event.kind !== 'correct' || !values.correctEffect) return null
    return resolveCorrectAnimationId(values.correctEffectType)
}
