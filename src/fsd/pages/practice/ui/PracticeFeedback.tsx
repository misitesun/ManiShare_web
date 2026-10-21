'use client'

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { getLearningAnimation, learningSoundAssets } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import { createLottiePlayback } from '../../../shared/lib/animation'
import type { SoundAudio } from '../../../shared/lib/sound-player'
import {
    createPracticeFeedbackSoundController,
    getPracticeFeedbackAnimation,
    initialPracticeFeedbackSoundSnapshot,
} from '../model/practice-feedback'
import type {
    PracticeAnimationKind,
    PracticeFeedbackEvent,
    PracticeFeedbackSoundAssets,
    PracticeFeedbackSoundController,
} from '../model/practice-feedback'

export interface PracticeFeedbackProps {
    values: LearningPreferences
    event?: PracticeFeedbackEvent | undefined
    active?: boolean
    soundAssets?: PracticeFeedbackSoundAssets
    onStatusChange?: (message: string) => void
    onSoundController?: (controller: PracticeFeedbackSoundController | null) => void
}

function createFeedbackAudio(): SoundAudio {
    return new Audio()
}

function effectClass(kind: PracticeAnimationKind): string {
    if (kind === 'chapter-complete')
        return 'pointer-events-none fixed left-1/2 top-1/2 z-[70] size-[72vmax] -translate-x-1/2 -translate-y-1/2 overflow-hidden leading-none [&_svg]:block [&_svg]:size-full'
    if (kind === 'lottie-1')
        return 'pointer-events-none fixed left-1/2 top-[26%] z-[70] aspect-square w-[min(900px,84vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden leading-none [&_svg]:block [&_svg]:size-full'
    if (kind === 'lottie-4' || kind === 'lottie-6')
        return 'pointer-events-none fixed left-1/2 top-[24%] z-[70] aspect-square w-[min(500px,50vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden leading-none [&_svg]:block [&_svg]:size-full'
    if (kind === 'lottie-7')
        return 'pointer-events-none fixed left-1/2 top-[34%] z-[70] aspect-square w-[min(960px,84vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden leading-none [&_svg]:block [&_svg]:size-full'
    return 'pointer-events-none fixed left-1/2 top-[34%] z-[70] aspect-square w-[min(1200px,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden leading-none [&_svg]:block [&_svg]:size-full'
}

/** The page owns event ordering; source animations only render an accepted event once. */
export function PracticeFeedback({
    values,
    event,
    active = true,
    soundAssets = learningSoundAssets,
    onStatusChange,
    onSoundController,
}: PracticeFeedbackProps): null {
    const lastAnimationEventRef = useRef(-1)
    const lastSoundEventRef = useRef(-1)
    const animationId = event ? getPracticeFeedbackAnimation(values, event) : null
    const animationEventId = event?.id
    const controller = useMemo(
        () => createPracticeFeedbackSoundController(soundAssets, createFeedbackAudio),
        [soundAssets],
    )
    const sound = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        () => initialPracticeFeedbackSoundSnapshot,
    )

    useEffect(() => {
        onSoundController?.(controller)
        return (): void => {
            onSoundController?.(null)
            controller.stop()
        }
    }, [controller, onSoundController])
    useEffect(() => {
        function restore(): void {
            controller.setActive(active && document.visibilityState === 'visible')
        }
        function stop(): void {
            controller.setActive(false)
        }
        restore()
        document.addEventListener('visibilitychange', restore)
        window.addEventListener('blur', stop)
        window.addEventListener('focus', restore)
        return (): void => {
            document.removeEventListener('visibilitychange', restore)
            window.removeEventListener('blur', stop)
            window.removeEventListener('focus', restore)
            controller.stop()
        }
    }, [active, controller])
    useEffect(() => {
        controller.updatePreferences(values)
    }, [controller, values])
    useEffect(() => {
        if (event === undefined) controller.stop()
        else if (event.id > lastSoundEventRef.current && Number.isSafeInteger(event.id)) {
            lastSoundEventRef.current = event.id
            controller.consume(event, values)
        }
    }, [active, controller, event, values])
    useEffect(() => {
        if (sound.phase === 'missing' || sound.phase === 'blocked' || sound.phase === 'failed')
            onStatusChange?.(sound.message)
    }, [onStatusChange, sound.phase, sound.message])

    useEffect(() => {
        if (
            animationEventId === undefined ||
            !Number.isSafeInteger(animationEventId) ||
            animationEventId <= lastAnimationEventRef.current
        )
            return
        lastAnimationEventRef.current = animationEventId
        if (!active || animationId === null) return
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (motion.matches || document.visibilityState !== 'visible') return
        const selection = getLearningAnimation(animationId)
        const host = document.createElement('div')
        host.className = effectClass(animationId)
        host.setAttribute('aria-hidden', 'true')
        host.dataset.practiceFeedbackEffect = animationId
        document.body.append(host)
        const playback = createLottiePlayback(host, {
            loadData: selection.loadData,
            speed: selection.speed,
            loop: animationId === 'chapter-complete',
            onComplete: clear,
            onError(): void {
                clear()
                onStatusChange?.('动画暂不可用，可在设置中重新选择。')
            },
        })
        function clear(): void {
            playback.destroy()
            host.remove()
        }
        function respectMotion(): void {
            if (motion.matches) clear()
        }
        function respectVisibility(): void {
            if (document.visibilityState !== 'visible') clear()
        }
        motion.addEventListener('change', respectMotion)
        document.addEventListener('visibilitychange', respectVisibility)
        playback.play()
        return (): void => {
            motion.removeEventListener('change', respectMotion)
            document.removeEventListener('visibilitychange', respectVisibility)
            clear()
        }
    }, [animationEventId, animationId, active, onStatusChange])

    return null
}
