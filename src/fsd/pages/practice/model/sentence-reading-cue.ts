import type { PracticeFeedbackSoundController } from './practice-feedback'

interface SentenceReadingCueOptions {
    /** 中译英的显式朗读还需等待尚未播完的判题反馈，其他模式保持只等待切题。 */
    readonly waitForAnswerFeedback?: boolean
}

/** 等待本次真实提示音；停止或换事件视为撤销，不补播旧题。 */
export function waitForSentenceReadingCue(
    controller: PracticeFeedbackSoundController | null,
    complete: (allowed: boolean) => void,
    options: SentenceReadingCueOptions = {},
): () => void {
    const initial = controller?.getSnapshot()
    const isReadingCue =
        initial?.soundKey === 'questionChange' ||
        (options.waitForAnswerFeedback === true &&
            (initial?.soundKey?.startsWith('correct:') === true ||
                initial?.soundKey?.startsWith('incorrect:') === true))
    if (
        controller === null ||
        initial === undefined ||
        !isReadingCue ||
        (initial.phase !== 'starting' && initial.phase !== 'playing')
    ) {
        complete(true)
        return (): void => {}
    }

    const cueController = controller
    const cueEventId = initial.eventId
    let pending = true
    let unsubscribe: (() => void) | null = null
    function cancel(): void {
        pending = false
        unsubscribe?.()
        unsubscribe = null
    }
    function inspect(): void {
        if (!pending) return
        const sound = cueController.getSnapshot()
        if (
            sound.eventId === cueEventId &&
            (sound.phase === 'starting' || sound.phase === 'playing')
        )
            return
        cancel()
        complete(
            sound.eventId === cueEventId &&
                (sound.phase === 'ended' ||
                    sound.phase === 'disabled' ||
                    sound.phase === 'missing' ||
                    sound.phase === 'blocked' ||
                    sound.phase === 'failed'),
        )
    }
    unsubscribe = cueController.subscribe(inspect)
    inspect()
    return cancel
}
