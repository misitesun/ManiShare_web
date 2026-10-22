'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { createPracticeAnswerFocusRequest } from './practice-answer-focus'
import type { WordSpellingInputController } from './word-spelling-input'

interface PracticeInteractionFocusOptions {
    readonly rootRef: RefObject<HTMLElement | null>
    readonly answerInput: RefObject<WordSpellingInputController | null>
    readonly keyboardNavigation: RefObject<boolean>
    readonly ready: boolean
    readonly blocked: boolean
    readonly answerEditable: boolean
    readonly reading: boolean
}

const focusControl =
    'button,a[href],summary,[role="button"],[role="switch"],input[type="checkbox"],input[type="radio"]'
const focusEditor =
    'input:not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable="true"],[role="textbox"],[role="slider"]'
const practicePortal = '[data-practice-options],[data-practice-draft-panel]'

function ownsSelectMenu(root: HTMLElement, target: Element): boolean {
    const menu = target.closest('[role="menu"]')
    return Boolean(
        menu?.id &&
        Array.from(root.querySelectorAll('[aria-controls]')).some(
            (trigger): boolean => trigger.getAttribute('aria-controls') === menu.id,
        ),
    )
}

/** 鼠标操作结束后归还练习焦点；键盘导航、编辑器和打开的浮层继续拥有原生按键。 */
export function usePracticeInteractionFocus(options: PracticeInteractionFocusOptions): void {
    const latest = useRef(options)
    latest.current = options
    const { rootRef, keyboardNavigation } = options

    useEffect(() => {
        let pending = false
        let pointerOrigin = false
        let observer: MutationObserver | null = null

        function cancel(): void {
            pending = false
            observer?.disconnect()
            observer = null
            request.cancel()
        }

        function owns(target: Element): boolean {
            return Boolean(
                rootRef.current?.contains(target) ||
                (rootRef.current && ownsSelectMenu(rootRef.current, target)) ||
                target.closest(practicePortal) ||
                (latest.current.blocked && target.closest('[data-tld-dialog-layer]')),
            )
        }

        function canReturn(): boolean {
            const current = latest.current
            if (
                !pending ||
                keyboardNavigation.current ||
                !current.ready ||
                current.blocked ||
                !rootRef.current?.isConnected ||
                document.hidden
            )
                return false
            // 包括退场中的模态层；不与焦点陷阱、内层弹窗或草稿编辑器争抢焦点。
            if (document.querySelector('[data-tld-dialog-layer],[data-practice-draft-panel]'))
                return false
            const active = document.activeElement
            const root = rootRef.current
            // 单选菜单保持打开及原生选项导航；选择/关闭后才归还练习焦点。
            if (active instanceof Element && root && ownsSelectMenu(root, active)) return false
            // 真正的文字/数值编辑器不被按钮归焦打断，作答输入由自己的控制器处理。
            return !(
                active instanceof Element &&
                active.closest(focusEditor) &&
                !active.matches('[data-practice-answer-input]')
            )
        }

        function focusPractice(): void {
            const current = latest.current
            const root = rootRef.current
            if (!root) return
            if (current.answerEditable && current.answerInput.current) {
                // 输入控制器拥有错位/词段及原生选区，不重设题目或移动逻辑光标。
                current.answerInput.current.focus()
            } else {
                const target = current.reading
                    ? (root.querySelector<HTMLElement>('[data-sentence-reading-viewport]') ?? root)
                    : root
                target.focus({ preventScroll: true })
            }
            const active = document.activeElement
            if (
                active === root ||
                (active instanceof Element &&
                    root.contains(active) &&
                    !active.closest(focusControl))
            )
                cancel()
        }

        const request = createPracticeAnswerFocusRequest({
            canFocus: canReturn,
            focus: focusPractice,
            schedule: (callback): number => window.requestAnimationFrame(callback),
            cancelFrame: (frame): void => window.cancelAnimationFrame(frame),
        })

        function requestReturn(): void {
            pending = true
            if (!observer) {
                observer = new MutationObserver((): void => request.request())
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: [
                        'aria-expanded',
                        'aria-hidden',
                        'inert',
                        'data-dialog-open',
                        'hidden',
                    ],
                })
            }
            request.request()
        }

        function pointerdown(event: PointerEvent): void {
            if (event.button !== 0 || !(event.target instanceof Element)) return
            pointerOrigin = true
            const target = event.target
            if (!owns(target)) {
                cancel()
                return
            }
            keyboardNavigation.current = false
            if (target.closest(focusEditor)) {
                // 模态/草稿里的编辑不撤销关闭后归焦意图，但不能抢它的编辑焦点。
                if (!target.closest('[data-tld-dialog-layer],[data-practice-draft-panel]')) cancel()
                return
            }
            if (pending) request.request()
        }

        function click(event: MouseEvent): void {
            if (!(event.target instanceof Element) || !owns(event.target)) return
            const target = event.target
            if (!target.closest(focusControl) || target.closest(focusEditor)) return
            if (!pointerOrigin && event.detail === 0) {
                keyboardNavigation.current = true
                cancel()
                return
            }
            keyboardNavigation.current = false
            requestReturn()
        }

        function keydown(event: KeyboardEvent): void {
            pointerOrigin = false
            if (event.isComposing || event.keyCode === 229) return
            const target = event.target
            if (
                event.key === 'Tab' ||
                (target instanceof Element &&
                    owns(target) &&
                    target.closest(focusControl) &&
                    [
                        'ArrowUp',
                        'ArrowDown',
                        'ArrowLeft',
                        'ArrowRight',
                        'Home',
                        'End',
                        'Enter',
                        ' ',
                    ].includes(event.key))
            ) {
                keyboardNavigation.current = true
                cancel()
            }
        }

        function focusin(event: FocusEvent): void {
            const target = event.target
            if (
                pointerOrigin &&
                !keyboardNavigation.current &&
                target instanceof Element &&
                owns(target) &&
                target.matches(focusControl) &&
                !target.closest(focusEditor)
            )
                requestReturn()
        }

        function visibilitychange(): void {
            if (document.hidden) cancel()
        }

        document.addEventListener('pointerdown', pointerdown, true)
        document.addEventListener('click', click, true)
        document.addEventListener('keydown', keydown, true)
        document.addEventListener('focusin', focusin)
        document.addEventListener('visibilitychange', visibilitychange)
        window.addEventListener('blur', cancel)
        return (): void => {
            cancel()
            document.removeEventListener('pointerdown', pointerdown, true)
            document.removeEventListener('click', click, true)
            document.removeEventListener('keydown', keydown, true)
            document.removeEventListener('focusin', focusin)
            document.removeEventListener('visibilitychange', visibilitychange)
            window.removeEventListener('blur', cancel)
        }
    }, [rootRef, keyboardNavigation])
}
