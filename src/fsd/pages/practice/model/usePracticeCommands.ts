'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { PracticeCommand } from './practice-command-types'
import { resolvePracticeShortcut } from './practice-shortcuts'
import type {
    PracticeKeyInput,
    PracticeKeyboardTarget,
    PracticeShortcutContext,
} from './practice-shortcuts'

export interface PracticeKeydownDecision {
    readonly preventDefault: boolean
    readonly command: PracticeCommand | null
}

/** 显式启用的作答输入持续拦截命中后的长按；其他目标沿用原重复键策略。 */
export function getPracticeKeydownDecision(
    event: PracticeKeyInput,
    context: PracticeShortcutContext,
    target: PracticeKeyboardTarget,
    held: boolean,
): PracticeKeydownDecision {
    const answerCommands = target === 'answer-input' && context.answerInputCommands === true
    if (!answerCommands && (held || event.repeat)) return { preventDefault: false, command: null }
    const command = resolvePracticeShortcut({ ...event, repeat: false }, context, target)
    const nativeEdit =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        ['a', 'c', 'x', 'v', 'z', 'y'].includes(event.key.toLowerCase())
    const retainedAnswerPress =
        held &&
        answerCommands &&
        context.scope === 'question' &&
        context.ready &&
        !event.isComposing &&
        !event.defaultPrevented &&
        !nativeEdit
    return {
        preventDefault: command !== null || retainedAnswerPress,
        command: held || event.repeat ? null : command,
    }
}

export function practiceKeyboardTarget(target: EventTarget | null): PracticeKeyboardTarget {
    if (!(target instanceof HTMLElement)) return 'content'
    if (target.closest('[data-practice-answer-input]')) return 'answer-input'
    if (
        target.closest(
            'input:not([type="range"]),textarea,[contenteditable="true"],[role="textbox"]',
        )
    )
        return 'editor'
    if (
        target.closest(
            'button,a,select,input,[role="button"],[role="switch"],[role="slider"],summary',
        )
    )
        return 'native'
    return 'content'
}

interface PracticeKeydownSource<EventType extends Event> {
    addEventListener(type: 'keydown', listener: (event: EventType) => void, capture?: boolean): void
    removeEventListener(
        type: 'keydown',
        listener: (event: EventType) => void,
        capture?: boolean,
    ): void
}

/** 作答输入先于React局部光标拦截；Escape先让浮层处理，其余控件维持冒泡，每次只走一侧。 */
export function subscribePracticeKeydown<EventType extends Event & { readonly key?: string }>(
    source: PracticeKeydownSource<EventType>,
    classify: (target: EventTarget | null) => PracticeKeyboardTarget,
    handle: (event: EventType) => void,
): () => void {
    function capture(event: EventType): void {
        if (event.key !== 'Escape' && classify(event.target) === 'answer-input') handle(event)
    }
    function bubble(event: EventType): void {
        if (event.key === 'Escape' || classify(event.target) !== 'answer-input') handle(event)
    }
    source.addEventListener('keydown', capture, true)
    source.addEventListener('keydown', bubble)
    return (): void => {
        source.removeEventListener('keydown', capture, true)
        source.removeEventListener('keydown', bubble)
    }
}

export function usePracticeCommands({
    rootRef,
    context,
    onCommand,
}: {
    readonly rootRef: RefObject<HTMLElement | null>
    readonly context: PracticeShortcutContext
    readonly onCommand: (command: PracticeCommand) => void
}): void {
    const held = useRef(new Set<string>())
    useEffect(() => {
        function keydown(event: KeyboardEvent): void {
            if (event.keyCode === 229 || event.isComposing || event.defaultPrevented) return
            const root = rootRef.current
            if (!root) return
            const target = event.target
            // Portal中的快捷口语由同一监听处理；其他浮层由自身管理Esc/Tab。
            if (
                context.scope !== 'oral' &&
                context.scope !== 'finish' &&
                target instanceof Node &&
                target !== document.body &&
                target !== document.documentElement &&
                !root.contains(target)
            )
                return
            const key = event.code || event.key.toLowerCase()
            const commandButton =
                target instanceof HTMLElement
                    ? target.closest(
                          '[data-practice-footer-action],[data-practice-command],[data-practice-navigation-action]',
                      )
                    : null
            if (
                commandButton &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey &&
                (event.key === 'Enter' || event.key === ' ')
            ) {
                // 首次由原生按钮点击执行；只拦重复激活，不能再全局派发同一个动作。
                if (event.repeat || held.current.has(key)) event.preventDefault()
                else held.current.add(key)
                return
            }
            const decision = getPracticeKeydownDecision(
                {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                    metaKey: event.metaKey,
                    repeat: event.repeat,
                },
                context,
                practiceKeyboardTarget(target),
                held.current.has(key),
            )
            if (decision.preventDefault) event.preventDefault()
            if (!decision.command) return
            held.current.add(key)
            onCommand(decision.command)
        }
        function keyup(event: KeyboardEvent): void {
            held.current.delete(event.code || event.key.toLowerCase())
        }
        function release(): void {
            held.current.clear()
        }
        const unsubscribe = subscribePracticeKeydown<KeyboardEvent>(
            window,
            practiceKeyboardTarget,
            keydown,
        )
        window.addEventListener('keyup', keyup)
        window.addEventListener('blur', release)
        return (): void => {
            unsubscribe()
            window.removeEventListener('keyup', keyup)
            window.removeEventListener('blur', release)
        }
    }, [rootRef, context, onCommand])
}
