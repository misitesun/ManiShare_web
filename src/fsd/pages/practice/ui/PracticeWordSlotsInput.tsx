'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, RefObject } from 'react'
import type { PracticePhase } from '../model/practice-demo'
import {
    getWordSlotIndex,
    getWordSlotCharacters,
    getWordSlotTextPosition,
    getWordSlotPlaceholder,
    getWordSlotSelection,
    getWordSlotView,
    getWordSlotVisibleCaret,
    shouldSubmitWordSlots,
} from '../model/word-slot-input'
import type { WordSlotsFeedback } from '../model/word-slot-input'

interface VisibleCaretVisit {
    readonly value: string
    readonly target: string
    readonly caret: number
    readonly wordIndex: number
}

export interface PracticeWordSlotsInputProps {
    readonly target: string
    readonly value: string
    readonly onChange: (value: string) => void
    readonly blocked: boolean
    readonly phase: PracticePhase
    readonly displayFontSize?: number | undefined
    readonly borderStyle?: 'solid' | 'dashed' | undefined
    readonly inputRef?: RefObject<HTMLInputElement | null> | undefined
    readonly label?: string | undefined
    readonly compact?: boolean | undefined
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly feedback?: WordSlotsFeedback | undefined
}

/** 词槽只映射完整原生文本与选区；提交、编辑快捷键和输入法仍由原生输入及页面命令负责。 */
export function PracticeWordSlotsInput({
    target,
    value,
    onChange,
    blocked,
    phase,
    displayFontSize,
    borderStyle = 'solid',
    inputRef,
    label = '练习答案',
    compact = false,
    onSubmit,
    feedback,
}: PracticeWordSlotsInputProps): ReactElement {
    const id = useId()
    const internalInputRef = useRef<HTMLInputElement>(null)
    const captureRef = inputRef ?? internalInputRef
    const composingRef = useRef(false)
    const spaceKeyRef = useRef(false)
    const scrollContainersRef = useRef(new Map<number, HTMLSpanElement>())
    const visibleCaretVisitRef = useRef<VisibleCaretVisit | null>(null)
    const initialFocusAttemptedRef = useRef(false)
    const [focused, setFocused] = useState(false)
    const [caret, setCaret] = useState(0)
    const [composing, setComposing] = useState(false)
    const slots = getWordSlotView(target, value)
    const needsFallbackSlot = slots.every((slot): boolean => !slot.target)
    const activeIndex = Math.min(slots.length - 1, getWordSlotIndex(value, caret))
    const fontStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }

    // 每次挂载只在首次可操作时尝试一次；已有控件/弹窗焦点和后续暂停恢复均不接管。
    useEffect((): void => {
        if (blocked || initialFocusAttemptedRef.current) return
        const input = captureRef.current
        if (!input) return
        initialFocusAttemptedRef.current = true
        const document = input.ownerDocument
        const active = document.activeElement
        const hasControlFocus =
            active?.matches(
                'input, textarea, select, button, a[href], summary, [role]:not([role="main"])',
            ) ||
            active?.closest(
                '[role="dialog"], [aria-modal="true"], [contenteditable]:not([contenteditable="false"])',
            )
        const isPageRoot =
            !hasControlFocus &&
            active?.matches(
                'main[tabindex="-1"], [role="main"][tabindex="-1"], [data-practice-phase][tabindex="-1"]',
            )
        if (
            active === null ||
            active === document.body ||
            active === document.documentElement ||
            isPageRoot
        ) {
            input.focus({ preventScroll: true })
        }
    }, [blocked, captureRef])

    // 隐藏原生输入的滚动不能带动词槽；仅编辑或选区真正改变时把可见字形移到最近边缘。
    useLayoutEffect((): void => {
        if (blocked || !focused || composing || composingRef.current) return
        const previous = visibleCaretVisitRef.current
        if (
            previous?.value === value &&
            previous.target === target &&
            previous.caret === caret &&
            previous.wordIndex === activeIndex
        ) {
            return
        }
        visibleCaretVisitRef.current = { value, target, caret, wordIndex: activeIndex }
        const container = scrollContainersRef.current.get(activeIndex)
        const slot = getWordSlotView(target, value)[activeIndex]
        const answer = container?.querySelector('[data-word-slot-answer]')
        if (!container || !slot || !answer) return
        const walker = container.ownerDocument.createTreeWalker(answer, 4)
        const texts: Node[] = []
        let node = walker.nextNode()
        while (node) {
            if (!node.parentElement?.closest('[data-word-slot-placeholder-character]'))
                texts.push(node)
            node = walker.nextNode()
        }
        const position = getWordSlotTextPosition(
            texts.map((text) => text.textContent ?? ''),
            getWordSlotVisibleCaret(value, caret, slot),
        )
        const text = position ? texts[position.index] : undefined
        if (!text || !position) {
            if (!slot.value) container.scrollLeft = 0
            return
        }
        const range = container.ownerDocument.createRange()
        range.setStart(text, position.offset)
        range.collapse(true)
        const caretRect = range.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const left = containerRect.left + container.clientLeft
        const right = left + container.clientWidth
        if (caretRect.left < left) container.scrollLeft += caretRect.left - left
        else if (caretRect.right > right) container.scrollLeft += caretRect.right - right
    }, [activeIndex, blocked, caret, composing, focused, target, value])

    function readCaret(input: HTMLInputElement): void {
        if (composingRef.current) return
        setCaret(input.selectionStart ?? input.value.length)
    }

    function focusWord(index: number): void {
        if (blocked || composingRef.current) return
        const input = captureRef.current
        if (!input) return
        input.focus({ preventScroll: true })
        if (input.ownerDocument.activeElement !== input) return
        const nativeValue = input.value
        const selection = getWordSlotSelection(nativeValue, index, target)
        if (selection.value === nativeValue) {
            input.setSelectionRange(selection.start, selection.end)
            readCaret(input)
            return
        }
        input.setSelectionRange(nativeValue.length, nativeValue.length)
        // 仅指针定位缺失词时尝试原生插入，以保留撤销历史；正常录入不依赖该兼容命令。
        // 命令触发的真实 input 事件负责唯一的 onChange，失败只保留末尾焦点。
        const padding = selection.value.slice(nativeValue.length)
        try {
            input.ownerDocument.execCommand('insertText', false, padding)
            if (input.value === nativeValue) {
                readCaret(input)
                return
            }
        } catch {
            // 不直接写 value 或补发输入事件；用户仍可用原生空格继续定位。
        }
        readCaret(input)
    }

    return (
        <div
            data-word-slot-input
            data-word-slot-focused={focused && !blocked}
            data-word-slot-phase={phase}
            style={fontStyle}
            className={
                compact
                    ? 'relative mx-auto w-full min-w-0 max-w-full text-[24px] font-medium leading-[1.2] md:text-[30px]'
                    : 'relative mx-auto w-full min-w-0 max-w-full text-[28px] font-medium leading-[1.2] md:text-[34px] design:text-[40px]'
            }
        >
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                ref={captureRef}
                data-practice-answer-input
                aria-label="练习答案"
                type="text"
                lang="en"
                inputMode="text"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={value}
                disabled={blocked}
                onChange={(event): void => {
                    const input = event.currentTarget
                    const native = event.nativeEvent
                    const nextValue = input.value
                    const fromSpaceKey = spaceKeyRef.current
                    spaceKeyRef.current = false
                    onChange(nextValue)
                    readCaret(input)
                    // 系统软键盘可能仅派发 input；只消费本次追加的普通空格，不接管粘贴/IME。
                    if (
                        onSubmit &&
                        !fromSpaceKey &&
                        !composingRef.current &&
                        native instanceof InputEvent &&
                        !native.isComposing &&
                        native.inputType === 'insertText' &&
                        native.data === ' ' &&
                        nextValue === value + ' ' &&
                        shouldSubmitWordSlots(target, value, value.length, value.length)
                    )
                        onSubmit(nextValue)
                }}
                onKeyDown={(event): void => {
                    const input = event.currentTarget
                    if (event.key === ' ') spaceKeyRef.current = true
                    if (
                        onSubmit &&
                        event.key === ' ' &&
                        !event.ctrlKey &&
                        !event.altKey &&
                        !event.metaKey &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing &&
                        event.nativeEvent.keyCode !== 229 &&
                        !composingRef.current &&
                        shouldSubmitWordSlots(
                            target,
                            input.value,
                            input.selectionStart,
                            input.selectionEnd,
                        )
                    ) {
                        event.preventDefault()
                        if (!event.repeat) onSubmit(input.value)
                    }
                }}
                onKeyUp={(event): void => {
                    if (event.key === ' ') spaceKeyRef.current = false
                }}
                onFocus={(event): void => {
                    setFocused(true)
                    readCaret(event.currentTarget)
                }}
                onBlur={(): void => {
                    spaceKeyRef.current = false
                    setFocused(false)
                }}
                onSelect={(event): void => readCaret(event.currentTarget)}
                onCompositionStart={(): void => {
                    composingRef.current = true
                    setComposing(true)
                }}
                onCompositionEnd={(event): void => {
                    composingRef.current = false
                    setComposing(false)
                    readCaret(event.currentTarget)
                }}
                className="pointer-events-none absolute left-0 top-0 h-px w-px min-w-0 cursor-text border-0 bg-transparent p-0 text-[16px] opacity-0 outline-none disabled:cursor-not-allowed"
            />
            <div
                aria-hidden="true"
                className="flex min-w-0 max-w-full flex-wrap items-end justify-center gap-x-5 gap-y-3"
            >
                {slots.map((slot): ReactElement => {
                    const active = focused && !blocked && slot.index === activeIndex
                    const characters =
                        feedback === undefined
                            ? undefined
                            : getWordSlotCharacters(slot, value, feedback)
                    const hasInputSlot = Boolean(
                        slot.target ||
                        slot.value ||
                        (!slot.prefix && !slot.suffix) ||
                        (needsFallbackSlot && slot.index === 0),
                    )
                    return (
                        <span
                            key={slot.id}
                            data-word-slot-group={slot.index}
                            className="inline-flex min-w-0 max-w-full items-baseline"
                        >
                            {slot.prefix && (
                                <span
                                    data-word-slot-punctuation
                                    className="shrink-0 text-practice-text"
                                >
                                    {slot.prefix}
                                </span>
                            )}
                            {hasInputSlot && (
                                <span
                                    ref={(element): void => {
                                        if (element)
                                            scrollContainersRef.current.set(slot.index, element)
                                        else scrollContainersRef.current.delete(slot.index)
                                    }}
                                    data-word-slot-scroll={slot.index}
                                    className="min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
                                >
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        disabled={blocked}
                                        data-word-slot={slot.index}
                                        data-word-slot-active={active}
                                        data-word-slot-target={slot.target}
                                        data-word-slot-value={slot.value}
                                        data-word-slot-start={slot.start}
                                        data-word-slot-end={slot.end}
                                        onPointerDown={(event): void => {
                                            if (!blocked) event.preventDefault()
                                        }}
                                        onClick={(): void => focusWord(slot.index)}
                                        style={{ borderBottomStyle: borderStyle }}
                                        className={
                                            characters
                                                ? 'relative inline-grid min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-transparent bg-transparent px-[0.12em] py-0 align-bottom text-practice-answer outline-none disabled:cursor-not-allowed'
                                                : phase === 'incorrect'
                                                  ? 'relative inline-grid min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-danger bg-transparent px-[0.12em] py-0 align-bottom text-danger outline-none disabled:cursor-not-allowed'
                                                  : active
                                                    ? slot.value
                                                        ? 'relative inline-grid min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-practice-answer bg-transparent px-[0.12em] py-0 align-bottom text-practice-answer outline-none disabled:cursor-not-allowed'
                                                        : 'relative inline-grid min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-accent-blue bg-transparent px-[0.12em] py-0 align-bottom text-practice-answer outline-none disabled:cursor-not-allowed'
                                                    : 'relative inline-grid min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-practice-muted bg-transparent px-[0.12em] py-0 align-bottom text-practice-answer outline-none disabled:cursor-not-allowed'
                                        }
                                    >
                                        <span
                                            data-word-slot-placeholder
                                            className="invisible col-start-1 row-start-1"
                                        >
                                            {getWordSlotPlaceholder(slot.target, slot.value) ||
                                                '\u00a0'}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            data-word-slot-input-measure
                                            className="invisible col-start-1 row-start-1"
                                        >
                                            {slot.value}
                                        </span>
                                        <span
                                            data-word-slot-answer
                                            className="pointer-events-none absolute inset-x-0 top-0 text-center"
                                        >
                                            {characters ? (
                                                <span className="inline-flex whitespace-pre">
                                                    {characters.map((character, index) => (
                                                        <span
                                                            key={index}
                                                            data-word-slot-character={
                                                                character.state
                                                            }
                                                            className={
                                                                character.state === 'incorrect' ||
                                                                character.state === 'extra' ||
                                                                character.state === 'missing'
                                                                    ? 'inline-block shrink-0 border-b-[3px] border-danger text-danger'
                                                                    : character.state === 'correct'
                                                                      ? 'inline-block shrink-0 border-b-[3px] border-practice-answer text-practice-answer'
                                                                      : active
                                                                        ? 'inline-block shrink-0 border-b-[3px] border-accent-blue text-practice-answer'
                                                                        : 'inline-block shrink-0 border-b-[3px] border-practice-muted text-practice-answer'
                                                            }
                                                            style={{
                                                                borderBottomStyle: borderStyle,
                                                            }}
                                                        >
                                                            <span
                                                                data-word-slot-placeholder-character={
                                                                    character.typed
                                                                        ? undefined
                                                                        : true
                                                                }
                                                                className={
                                                                    character.typed
                                                                        ? ''
                                                                        : 'invisible'
                                                                }
                                                            >
                                                                {character.value}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                slot.value
                                            )}
                                        </span>
                                        {characters && (
                                            <span
                                                data-word-slot-feedback-measure
                                                className="invisible col-start-1 row-start-1 inline-flex whitespace-pre"
                                            >
                                                {characters.map((character, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-block shrink-0"
                                                    >
                                                        {character.value}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </button>
                                </span>
                            )}
                            {slot.suffix && (
                                <span
                                    data-word-slot-punctuation
                                    className="shrink-0 text-practice-text"
                                >
                                    {slot.suffix}
                                </span>
                            )}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}
