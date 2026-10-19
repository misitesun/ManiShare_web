'use client'

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { getTypingInputFeedback, getTypingTarget } from './typing-keyboard'
import type { TypingInputFeedback, TypingTarget } from './typing-keyboard'

export interface TypingKeyboardFeedbackSnapshot {
    readonly feedback: TypingInputFeedback | null
    readonly shiftLeft: boolean
    readonly shiftRight: boolean
    readonly capsLock: boolean | null
    readonly composing: boolean
}

export interface TypingKeyboardFeedback extends TypingKeyboardFeedbackSnapshot {
    readonly target: TypingTarget | null
}

export interface TypingKeyboardFeedbackOptions {
    readonly inputRef: RefObject<HTMLInputElement | null>
    readonly targetText?: string | undefined
    readonly input: string
    readonly active: boolean
    readonly sessionKey: string
}

interface PhysicalKey {
    readonly code: string
    readonly shiftKey: boolean
    readonly capsLock: boolean | null
    readonly isComposing: boolean
    readonly keyCode: number
}

interface FeedbackControllerOptions {
    readonly initialInput: string
    readonly targetText: string | undefined
    readonly onChange: (snapshot: TypingKeyboardFeedbackSnapshot) => void
    readonly schedule: (callback: () => void, milliseconds: number) => number
    readonly cancel: (timer: number) => void
}

export interface TypingKeyboardFeedbackController {
    readonly input: (value: string, composing: boolean) => void
    readonly compositionStart: () => void
    readonly compositionEnd: (value: string) => void
    readonly keydown: (event: PhysicalKey) => void
    readonly keyup: (event: PhysicalKey) => void
    readonly synchronize: (value: string) => void
    readonly release: (value: string) => void
    readonly dispose: () => void
}

const idleSnapshot: TypingKeyboardFeedbackSnapshot = {
    feedback: null,
    shiftLeft: false,
    shiftRight: false,
    capsLock: null,
    composing: false,
}

/** 与 DOM 分离的瞬时反馈生命周期；输入结果只读，物理事件只更新修饰状态。 */
export function createTypingKeyboardFeedbackController({
    initialInput,
    targetText,
    onChange,
    schedule,
    cancel,
}: FeedbackControllerOptions): TypingKeyboardFeedbackController {
    let previousInput = initialInput
    let snapshot = idleSnapshot
    let sequence = 0
    let timer: number | undefined
    let disposed = false

    function publish(next: TypingKeyboardFeedbackSnapshot): void {
        if (disposed) return
        snapshot = next
        onChange(snapshot)
    }

    function clearTimer(): void {
        if (timer !== undefined) cancel(timer)
        timer = undefined
    }

    function commit(value: string): void {
        if (disposed) return
        const feedback = getTypingInputFeedback(previousInput, value, targetText)
        previousInput = value
        if (!feedback) return
        clearTimer()
        sequence += 1
        publish({ ...snapshot, feedback: { ...feedback, id: sequence } })
        timer = schedule((): void => {
            timer = undefined
            publish({ ...snapshot, feedback: null })
        }, 220)
    }

    function input(value: string, composing: boolean): void {
        if (disposed) return
        if (composing) {
            if (!snapshot.composing) compositionStart()
            return
        }
        if (!snapshot.composing) commit(value)
    }

    function compositionStart(): void {
        clearTimer()
        publish({ ...snapshot, feedback: null, composing: true })
    }

    function compositionEnd(value: string): void {
        publish({ ...snapshot, composing: false })
        commit(value)
    }

    function updatePhysical(event: PhysicalKey, pressed: boolean): void {
        if (event.isComposing || event.keyCode === 229 || snapshot.composing) return
        const next: TypingKeyboardFeedbackSnapshot = {
            ...snapshot,
            shiftLeft:
                event.code === 'ShiftLeft' ? pressed : event.shiftKey ? snapshot.shiftLeft : false,
            shiftRight:
                event.code === 'ShiftRight'
                    ? pressed
                    : event.shiftKey
                      ? snapshot.shiftRight
                      : false,
            capsLock: event.capsLock,
        }
        if (
            next.shiftLeft !== snapshot.shiftLeft ||
            next.shiftRight !== snapshot.shiftRight ||
            next.capsLock !== snapshot.capsLock
        )
            publish(next)
    }

    function keydown(event: PhysicalKey): void {
        updatePhysical(event, true)
    }

    function keyup(event: PhysicalKey): void {
        updatePhysical(event, false)
    }

    function release(value: string): void {
        clearTimer()
        previousInput = value
        publish(idleSnapshot)
    }

    function synchronize(value: string): void {
        // 原生 input 已先提交同一值时保持反馈；只清理来自重置/恢复的外部变更。
        if (!snapshot.composing && value !== previousInput) release(value)
    }

    function dispose(): void {
        clearTimer()
        disposed = true
    }

    return {
        input,
        compositionStart,
        compositionEnd,
        keydown,
        keyup,
        synchronize,
        release,
        dispose,
    }
}

interface ScopedSnapshot {
    readonly sessionKey: string
    readonly value: TypingKeyboardFeedbackSnapshot
}

function physicalKey(event: KeyboardEvent): PhysicalKey {
    return {
        code: event.code,
        shiftKey: event.shiftKey,
        capsLock:
            typeof event.getModifierState === 'function'
                ? event.getModifierState('CapsLock')
                : null,
        isComposing: event.isComposing,
        keyCode: event.keyCode,
    }
}

/** 原生答案框为唯一输入来源；不注册全局按键，也不修改练习输入或命令。 */
export function useTypingKeyboardFeedback({
    inputRef,
    targetText,
    input,
    active,
    sessionKey,
}: TypingKeyboardFeedbackOptions): TypingKeyboardFeedback {
    const [observed, setObserved] = useState<ScopedSnapshot>({
        sessionKey,
        value: idleSnapshot,
    })
    const controllerRef = useRef<TypingKeyboardFeedbackController | null>(null)

    useEffect(() => {
        const currentElement = inputRef.current
        // 订阅所有者改变时清除外部按下/组合状态，避免恢复隐藏组件时留下旧反馈。
        setObserved({ sessionKey, value: idleSnapshot })
        if (!active || !currentElement) return
        const element: HTMLInputElement = currentElement
        const ownerWindow = element.ownerDocument.defaultView
        if (!ownerWindow) return
        const controller = createTypingKeyboardFeedbackController({
            initialInput: element.value,
            targetText,
            onChange: (value): void => setObserved({ sessionKey, value }),
            schedule: (callback, milliseconds): number =>
                ownerWindow.setTimeout(callback, milliseconds),
            cancel: (timer): void => ownerWindow.clearTimeout(timer),
        })
        controllerRef.current = controller

        function onInput(event: Event): void {
            const composing = 'isComposing' in event && event.isComposing === true
            controller.input(element.value, composing)
        }

        function compositionStart(): void {
            controller.compositionStart()
        }

        function compositionEnd(): void {
            controller.compositionEnd(element.value)
        }

        function keydown(event: KeyboardEvent): void {
            controller.keydown(physicalKey(event))
        }

        function keyup(event: KeyboardEvent): void {
            controller.keyup(physicalKey(event))
        }

        function release(): void {
            controller.release(element.value)
        }

        element.addEventListener('input', onInput)
        element.addEventListener('compositionstart', compositionStart)
        element.addEventListener('compositionend', compositionEnd)
        element.addEventListener('keydown', keydown)
        element.addEventListener('keyup', keyup)
        element.addEventListener('blur', release)
        ownerWindow.addEventListener('blur', release)
        return (): void => {
            controller.dispose()
            controllerRef.current = null
            element.removeEventListener('input', onInput)
            element.removeEventListener('compositionstart', compositionStart)
            element.removeEventListener('compositionend', compositionEnd)
            element.removeEventListener('keydown', keydown)
            element.removeEventListener('keyup', keyup)
            element.removeEventListener('blur', release)
            ownerWindow.removeEventListener('blur', release)
        }
    }, [inputRef, targetText, active, sessionKey])

    useEffect(() => {
        controllerRef.current?.synchronize(input)
    }, [input])

    const snapshot = active && observed.sessionKey === sessionKey ? observed.value : idleSnapshot
    return {
        ...snapshot,
        target: active && !snapshot.composing ? getTypingTarget(targetText, input) : null,
    }
}
