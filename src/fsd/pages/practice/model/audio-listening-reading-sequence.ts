import type {
    PracticeFeedbackEvent,
    PracticeFeedbackPreferences,
    PracticeFeedbackSoundController,
} from './practice-feedback'

export type AudioListeningReadingPhase = 'ready' | 'waiting' | 'cancelled'

export interface AudioListeningReadingSequence {
    start(
        controller: PracticeFeedbackSoundController | null,
        event: PracticeFeedbackEvent,
        values: PracticeFeedbackPreferences,
    ): void
    cancel(): void
    reset(): void
    subscribe(listener: () => void): () => void
    getSnapshot(): AudioListeningReadingPhase
    getServerSnapshot(): AudioListeningReadingPhase
}

interface PendingTransitionSound {
    readonly controller: PracticeFeedbackSoundController
    readonly eventId: number
    unsubscribe: () => void
}

/** 音频听力私有衔接：真实音效结束才释放切读，取消后等待下一次显式操作。 */
export function createAudioListeningReadingSequence(): AudioListeningReadingSequence {
    let phase: AudioListeningReadingPhase = 'ready'
    let pending: PendingTransitionSound | null = null
    const subscribers = new Set<() => void>()

    function publish(next: AudioListeningReadingPhase): void {
        if (phase === next) return
        phase = next
        for (const listener of subscribers) listener()
    }

    function detach(stop: boolean): void {
        const previous = pending
        pending = null
        previous?.unsubscribe()
        if (stop) previous?.controller.stop()
    }

    function finish(next: AudioListeningReadingPhase): void {
        detach(false)
        publish(next)
    }

    return {
        start(controller, event, values): void {
            // 先撤回旧订阅再停止旧音效，旧 stopped / ended 不能释放新题。
            detach(true)
            if (controller === null || !values.transitionSound) {
                publish('ready')
                controller?.consume(event, values)
                return
            }
            const request: PendingTransitionSound = {
                controller,
                eventId: event.id,
                unsubscribe: (): void => undefined,
            }
            pending = request
            publish('waiting')
            function refresh(): void {
                if (pending !== request) return
                const sound = request.controller.getSnapshot()
                if (sound.eventId !== request.eventId || sound.soundKey !== 'questionChange') {
                    if (sound.eventId !== null && sound.eventId > request.eventId)
                        finish('cancelled')
                    return
                }
                if (sound.phase === 'stopped') finish('cancelled')
                else if (
                    sound.phase === 'ended' ||
                    sound.phase === 'disabled' ||
                    sound.phase === 'missing' ||
                    sound.phase === 'blocked' ||
                    sound.phase === 'failed'
                )
                    finish('ready')
            }
            request.unsubscribe = controller.subscribe(refresh)
            controller.consume(event, values)
            refresh()
            // 既有音效策略可能跳过切题事件；没有本次音效时不保留空等待。
            if (pending === request && controller.getSnapshot().eventId !== request.eventId)
                finish('ready')
        },
        cancel(): void {
            detach(true)
            publish('cancelled')
        },
        reset(): void {
            detach(true)
            publish('ready')
        },
        subscribe(listener): () => void {
            subscribers.add(listener)
            return (): void => {
                subscribers.delete(listener)
            }
        },
        getSnapshot: (): AudioListeningReadingPhase => phase,
        getServerSnapshot: (): AudioListeningReadingPhase => 'ready',
    }
}
