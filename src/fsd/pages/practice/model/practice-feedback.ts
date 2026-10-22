import { resolveCorrectAnimationId } from '../../../features/learning-settings'
import type { LearningAnimationId, LearningPreferences } from '../../../features/learning-settings'
import { createSoundPlayer } from '../../../shared/lib/sound-player'
import type { SoundAudio, SoundPlaybackPhase } from '../../../shared/lib/sound-player'
import { getMonotonicMilliseconds } from '../../../shared/lib/time'

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
    | 'typing'
    | 'correct'
    | 'answerReveal'
    | 'incorrect'
    | 'questionChange'
    | 'chapterComplete'
    | 'evaluationComplete'
    | 'wordRetry'
    | 'wordRemember'
    | 'recordStart'

export interface PracticeFeedbackEvent {
    /** 演示会话内递增；相同或更早的事件不会再次播放。 */
    id: number
    kind: PracticeFeedbackKind
    rating?: 'KEEP TRYING' | 'GOOD' | 'EXCELLENT' | 'PERFECT'
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
    rating?: PracticeFeedbackEvent['rating'],
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
        case 'answerReveal':
            return {
                key: `correct:${values.correctTone}`,
                label: `${kind === 'answerReveal' ? '答案出现提示音' : '答对音效'} · ${values.correctTone}`,
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
                key: `evaluationComplete:${rating ?? 'GOOD'}`,
                label: '模拟评测结束音效',
                enabled: values.evaluationSound,
                volume: null,
            }
        case 'wordRetry':
        case 'wordRemember':
            return {
                key: kind,
                label: kind === 'wordRetry' ? '再来音效' : '记住音效',
                enabled: values.transitionSound,
                volume: null,
            }
        case 'recordStart':
            return { key: kind, label: '录音开始提示音', enabled: true, volume: null }
    }
}

function isPlayableVolume(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1
}

/** 打字与结果分通道；输入不打断结果，切题不截断正在播放的正确／卡牌操作音。 */
export function createPracticeFeedbackSoundController(
    assets: PracticeFeedbackSoundAssets,
    createAudio: () => SoundAudio,
    now: () => number = getMonotonicMilliseconds,
): PracticeFeedbackSoundController {
    let snapshot = initialPracticeFeedbackSoundSnapshot
    let active = true
    let disposed = false
    let lastEventId = -1
    let lastTypingTime = Number.NEGATIVE_INFINITY
    let typingKey = ''
    let effectKind: PracticeFeedbackKind | undefined
    const typing = createSoundPlayer(createAudio, true)
    const effect = createSoundPlayer(createAudio)
    const playing = new Map<'typing' | 'effect', { event: PracticeFeedbackEvent }>()
    const subscribers = new Set<() => void>()

    function publish(next: PracticeFeedbackSoundSnapshot): void {
        if (disposed) return
        snapshot = next
        for (const listener of subscribers) listener()
    }

    function stop(): void {
        typing.stop()
        effect.stop()
        playing.clear()
        effectKind = undefined
    }

    function consume(event: PracticeFeedbackEvent, values: PracticeFeedbackPreferences): void {
        if (disposed || !Number.isSafeInteger(event.id) || event.id < 0 || event.id <= lastEventId)
            return
        lastEventId = event.id
        const selection = getPracticeFeedbackSoundSelection(values, event.kind, event.rating)
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
        const channel = event.kind === 'typing' ? 'typing' : 'effect'
        if (channel === 'typing') {
            if (effect.isActive()) return
            const time = now()
            if (typingKey === selection.key && time - lastTypingTime < 50) return
            typingKey = selection.key
            lastTypingTime = time
        } else {
            typing.stop()
            if (
                event.kind === 'questionChange' &&
                effect.isActive() &&
                (effectKind === 'correct' ||
                    effectKind === 'wordRetry' ||
                    effectKind === 'wordRemember')
            )
                return
            effectKind = event.kind
        }
        const player = channel === 'typing' ? typing : effect
        playing.set(channel, { event })
        player.play({
            src: asset.src,
            volume,
            onPhase(phase: SoundPlaybackPhase): void {
                if (disposed || playing.get(channel)?.event !== event) return
                if (phase !== 'starting' && phase !== 'playing') playing.delete(channel)
                if (snapshot.eventId !== null && event.id < snapshot.eventId) return
                publish({
                    ...eventSnapshot,
                    phase,
                    message:
                        phase === 'blocked'
                            ? '浏览器未允许播放提示音，请再次点击或按键重试。'
                            : phase === 'failed'
                              ? `${selection.label}播放失败`
                              : phase === 'starting'
                                ? `正在加载：${selection.label}`
                                : phase === 'playing'
                                  ? `正在播放：${selection.label}`
                                  : phase === 'ended'
                                    ? `${selection.label}播放结束`
                                    : '反馈音效已停止',
                })
            },
        })
    }

    return {
        consume,
        setActive(next: boolean): void {
            active = next
            if (!active) stop()
        },
        updatePreferences(values: PracticeFeedbackPreferences): void {
            for (const [channel, current] of playing) {
                const next = getPracticeFeedbackSoundSelection(
                    values,
                    current.event.kind,
                    current.event.rating,
                )
                const player = channel === 'typing' ? typing : effect
                if (!next.enabled) player.stop()
            }
        },
        stop,
        dispose(): void {
            disposed = true
            typing.dispose()
            effect.dispose()
            playing.clear()
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
    if ((event.kind !== 'correct' && event.kind !== 'answerReveal') || !values.correctEffect)
        return null
    return resolveCorrectAnimationId(values.correctEffectType)
}
