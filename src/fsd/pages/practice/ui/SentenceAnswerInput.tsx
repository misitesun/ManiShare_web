'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, RefObject } from 'react'
import type { PracticePhase } from '../model/practice-demo'
import type { WordSpellingInputController } from '../model/word-spelling-input'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    editSentenceAnswerSlot,
    getSentenceAnswerEditingSnapshot,
    getSentenceAnswerInputSelection,
    isSentenceAnswerNavigation,
    moveSentenceAnswerSlot,
    selectSentenceAnswerSlot,
    serializeSentenceAnswer,
    spaceSentenceAnswer,
    submitSentenceAnswer,
} from '../model/sentence-answer-input'
import type {
    SentenceAnswerEditingSnapshot,
    SentenceAnswerResult,
    SentenceAnswerState,
    SentenceAnswerSubmission,
} from '../model/sentence-answer-input'
import { getWordSlotHint, getWordSlotPlaceholder } from '../model/word-slot-input'
import { PracticeInputBridge } from './PracticeInputBridge'

interface SentenceAnswerInputProps {
    readonly label?: string
    readonly target: string
    readonly initialValue: string
    readonly showWordHint: boolean
    readonly phase: PracticePhase
    readonly blocked: boolean
    readonly ignoreCase: boolean
    readonly referenceLayout: boolean
    readonly displayFontSize?: number | undefined
    readonly borderStyle: 'solid' | 'dashed'
    readonly inputRef?: RefObject<HTMLInputElement | null> | undefined
    readonly onEditingChange?: ((snapshot: SentenceAnswerEditingSnapshot) => void) | undefined
    readonly onChange: (value: string) => void
    readonly onNavigate?: (() => void) | undefined
    readonly onSubmit?: ((submission: SentenceAnswerSubmission) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
}

interface SentenceSlotStyle extends CSSProperties {
    '--sentence-answer-width'?: string
}

/** 546:33828–33831仅给出这条示例空线的宽度，其他题目按实际文字自然测宽。 */
const readingWidths = [59, 83, 112, 157]

export function SentenceAnswerInput(props: SentenceAnswerInputProps): ReactElement {
    const layout = useMemo(() => createSentenceAnswerLayout(props.target), [props.target])
    const [state, setState] = useState(() => {
        const initial = createSentenceAnswerState(layout, props.initialValue)
        return props.phase === 'incorrect'
            ? submitSentenceAnswer(initial, layout, props.ignoreCase).state
            : initial
    })
    const [focused, setFocused] = useState(false)
    const [compositionValue, setCompositionValue] = useState<string | null>(null)
    const stateRef = useRef(state)
    const propsRef = useRef(props)
    propsRef.current = props
    const internalInputRef = useRef<HTMLInputElement>(null)
    const inputRef = props.inputRef ?? internalInputRef
    const activeValueRef = useRef<HTMLSpanElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const composing = useRef(false)
    const compositionReplay = useRef<string | null>(null)
    const history = useRef<{ past: SentenceAnswerState[]; future: SentenceAnswerState[] }>({
        past: [],
        future: [],
    })
    const attemptedFocus = useRef(false)
    const id = useId()
    const disabled =
        props.blocked || state.completed || props.phase === 'correct' || props.phase === 'revealed'
    const referenceWidths =
        props.referenceLayout && props.target.toLowerCase() === 'we read books together'
    const activeFeedback = state.feedback[state.activeIndex]

    function editable(): boolean {
        const current = propsRef.current
        return (
            !current.blocked &&
            !stateRef.current.completed &&
            current.phase !== 'correct' &&
            current.phase !== 'revealed' &&
            !composing.current
        )
    }

    function focus(): void {
        const input = inputRef.current
        if (!editable() || !input || input.disabled || input.closest('[inert]')) return
        input.focus({ preventScroll: true })
        const selection = getSentenceAnswerInputSelection(stateRef.current)
        input.setSelectionRange(selection.start, selection.end)
    }

    function update(next: SentenceAnswerState, remember = true): void {
        const previous = stateRef.current
        if (next === previous) return
        const edited =
            next.values.some((value, index) => value !== previous.values[index]) ||
            next.feedback.some(
                (feedback, index) =>
                    feedback === 'pending' && previous.feedback[index] === 'incorrect',
            )
        if (remember && edited) {
            history.current.past = [...history.current.past, previous].slice(-100)
            history.current.future = []
        }
        stateRef.current = next
        setState(next)
        if (edited) propsRef.current.onChange(serializeSentenceAnswer(layout, next.values))
    }

    function applyResult(result: SentenceAnswerResult): void {
        const navigated = isSentenceAnswerNavigation(stateRef.current, result)
        update(result.state, false)
        if (result.submission) propsRef.current.onSubmit?.(result.submission)
        else if (navigated) propsRef.current.onNavigate?.()
    }

    function submit(space = false): void {
        if (!editable()) return
        const result = (space ? spaceSentenceAnswer : submitSentenceAnswer)(
            stateRef.current,
            layout,
            propsRef.current.ignoreCase,
        )
        applyResult(result)
        if (!result.state.completed) focus()
    }

    function edit(raw: string): void {
        if (!editable()) return
        update(editSentenceAnswerSlot(stateRef.current, layout, raw))
    }

    function restore(redo: boolean): void {
        if (!editable()) return
        const source = redo ? history.current.future : history.current.past
        const previous = source.at(-1)
        if (!previous) return
        const current = stateRef.current
        if (redo) {
            history.current.future = source.slice(0, -1)
            history.current.past = [...history.current.past, current].slice(-100)
        } else {
            history.current.past = source.slice(0, -1)
            history.current.future = [...history.current.future, current].slice(-100)
        }
        update({ ...previous, attempts: current.attempts, completed: false }, false)
    }

    const actionsRef = useRef<WordSpellingInputController>({
        focus,
        submit,
        space: (): void => submit(true),
        selectSegment: (): void => {},
    })
    actionsRef.current = {
        focus,
        submit,
        space: (): void => submit(true),
        selectSegment: (slotId): void => {
            if (!editable()) return
            const index = layout.slots.findIndex((slot) => slot.id === slotId)
            if (index < 0) return
            update(selectSentenceAnswerSlot(stateRef.current, index), false)
            focus()
        },
    }
    useLayoutEffect(() => {
        const controller: WordSpellingInputController = {
            focus: (): void => actionsRef.current.focus(),
            submit: (): void => actionsRef.current.submit(),
            space: (): void => actionsRef.current.space(),
            selectSegment: (slotId): void => actionsRef.current.selectSegment(slotId),
        }
        props.onController?.(controller)
        return (): void => props.onController?.(null)
    }, [props.onController])

    useEffect(() => {
        if (disabled || attemptedFocus.current) return
        const frame = requestAnimationFrame((): void => {
            const input = inputRef.current
            if (!input || input.disabled || input.closest('[inert]')) return
            attemptedFocus.current = true
            actionsRef.current.focus()
        })
        return (): void => cancelAnimationFrame(frame)
    }, [disabled])

    useLayoutEffect(() => {
        const input = inputRef.current
        if (!input || composing.current) return
        // 重复提交仍定位并全选首错；只按activeIndex同步会漏掉首错位置未变化的情况。
        const selection = getSentenceAnswerInputSelection(stateRef.current)
        input.setSelectionRange(selection.start, selection.end)
    }, [state.activeIndex, state.attempts, activeFeedback])

    useLayoutEffect(() => {
        // 长词仍可横向滚动；编辑或换段时让当前输入末尾可见，不依赖可见滚动条定位。
        const viewport = activeValueRef.current
        const entered = viewport?.querySelector<HTMLElement>('[data-sentence-entered-text]')
        if (viewport && entered)
            viewport.scrollLeft = Math.max(0, entered.offsetWidth - viewport.clientWidth)
    }, [state.activeIndex, state.values, compositionValue])

    useLayoutEffect(() => {
        props.onEditingChange?.(getSentenceAnswerEditingSnapshot(layout, state))
    }, [layout, state, props.onEditingChange])

    return (
        <div
            ref={rootRef}
            data-sentence-answer-input
            data-practice-controlled-answer
            data-sentence-active-slot={state.activeIndex}
            className="relative mx-auto min-w-0 max-w-full text-[28px] font-medium leading-[1.2] md:text-[34px] design:text-[40px]"
            style={
                props.displayFontSize === undefined
                    ? undefined
                    : { fontSize: props.displayFontSize }
            }
            onPointerDown={(event): void => {
                if (event.pointerType === 'mouse') event.preventDefault()
            }}
        >
            <label htmlFor={id} className="sr-only">
                {props.label ?? '句子答案'}，第{state.activeIndex + 1}段
            </label>
            <PracticeInputBridge
                id={id}
                ref={inputRef}
                aria-label={`${props.label ?? '句子答案'}，第${state.activeIndex + 1}段`}
                aria-invalid={state.feedback[state.activeIndex] === 'incorrect'}
                value={compositionValue ?? state.values[state.activeIndex] ?? ''}
                disabled={disabled}
                onFocus={(): void => {
                    setFocused(true)
                    const selection = getSentenceAnswerInputSelection(stateRef.current)
                    inputRef.current?.setSelectionRange(selection.start, selection.end)
                }}
                onBlur={(): void => setFocused(false)}
                // 同字覆盖仍是一次纠错；onChange会按字符串值去重，必须消费原生input事件。
                onInput={(event): void => {
                    const raw = event.currentTarget.value
                    if (composing.current) {
                        setCompositionValue(raw)
                        return
                    }
                    if (compositionReplay.current === raw) {
                        compositionReplay.current = null
                        return
                    }
                    compositionReplay.current = null
                    const native = event.nativeEvent
                    if (native instanceof InputEvent && native.inputType === 'historyUndo')
                        restore(false)
                    else if (native instanceof InputEvent && native.inputType === 'historyRedo')
                        restore(true)
                    else if (
                        stateRef.current.feedback[stateRef.current.activeIndex] === 'incorrect' &&
                        native instanceof InputEvent &&
                        native.inputType.startsWith('delete')
                    )
                        edit('')
                    else if (
                        native instanceof InputEvent &&
                        native.inputType === 'insertText' &&
                        native.data === ' ' &&
                        (raw ===
                            `${stateRef.current.values[stateRef.current.activeIndex] ?? ''} ` ||
                            (raw === ' ' &&
                                stateRef.current.feedback[stateRef.current.activeIndex] ===
                                    'incorrect'))
                    )
                        submit(true)
                    else edit(raw)
                }}
                onCompositionStart={(event): void => {
                    composing.current = true
                    setCompositionValue(event.currentTarget.value)
                }}
                onCompositionEnd={(event): void => {
                    composing.current = false
                    const raw = event.currentTarget.value
                    edit(raw)
                    compositionReplay.current = raw
                    setCompositionValue(null)
                }}
                onKeyDown={(event): void => {
                    if (
                        event.defaultPrevented ||
                        event.nativeEvent.isComposing ||
                        event.nativeEvent.keyCode === 229 ||
                        composing.current
                    )
                        return
                    const key = event.key.toLowerCase()
                    if (
                        (event.ctrlKey || event.metaKey) &&
                        !event.altKey &&
                        (key === 'z' || key === 'y')
                    ) {
                        event.preventDefault()
                        event.stopPropagation()
                        restore(key === 'y' || event.shiftKey)
                        return
                    }
                    if (event.ctrlKey || event.metaKey || event.altKey) return
                    if (
                        editable() &&
                        stateRef.current.feedback[stateRef.current.activeIndex] === 'incorrect'
                    ) {
                        if (
                            !event.shiftKey &&
                            (event.key === 'Backspace' || event.key === 'Delete')
                        ) {
                            event.preventDefault()
                            event.stopPropagation()
                            edit('')
                            return
                        }
                        if (event.key.length === 1 && event.key !== ' ') {
                            // 保留原生字符/粘贴/IME输入，首次键入仅替换当前错误段。
                            const selection = getSentenceAnswerInputSelection(stateRef.current)
                            event.currentTarget.setSelectionRange(selection.start, selection.end)
                        }
                    }
                    if (event.shiftKey) return
                    if (!['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) return
                    event.preventDefault()
                    event.stopPropagation()
                    if (event.repeat || !editable()) return
                    if (event.key === ' ' || event.key === 'Enter') submit(event.key === ' ')
                    else
                        applyResult({
                            state: moveSentenceAnswerSlot(
                                stateRef.current,
                                event.key === 'ArrowLeft' ? -1 : 1,
                            ),
                            submission: null,
                        })
                }}
            />
            <div
                className={
                    referenceWidths
                        ? 'flex min-w-0 flex-wrap items-end justify-center gap-x-5 gap-y-6 design:gap-x-[25px]'
                        : 'flex min-w-0 flex-wrap items-end justify-center gap-x-5 gap-y-6'
                }
            >
                {layout.slots.map((slot, index) => {
                    const value =
                        composing.current && index === state.activeIndex
                            ? (compositionValue ?? state.values[index] ?? '')
                            : (state.values[index] ?? '')
                    const active = focused && !disabled && state.activeIndex === index
                    const wrong = state.feedback[index] === 'incorrect'
                    const hint = props.showWordHint ? getWordSlotHint(slot.target, value) : ''
                    const style: SentenceSlotStyle =
                        referenceWidths && readingWidths[index] !== undefined
                            ? { '--sentence-answer-width': `${readingWidths[index]}px` }
                            : {}
                    return (
                        <span
                            key={slot.id}
                            className={
                                referenceWidths && index === 0
                                    ? 'inline-flex min-w-0 max-w-full items-baseline design:mr-[13px]'
                                    : 'inline-flex min-w-0 max-w-full items-baseline'
                            }
                        >
                            {slot.prefix && (
                                <span className="text-practice-text">{slot.prefix}</span>
                            )}
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={`第${index + 1}段${wrong ? '，答案有误' : ''}`}
                                disabled={disabled}
                                data-sentence-answer-slot={index}
                                data-sentence-slot-value={state.values[index] ?? ''}
                                data-sentence-slot-feedback={state.feedback[index]}
                                data-sentence-slot-active={active}
                                onClick={(): void => {
                                    if (!editable()) return
                                    update(selectSentenceAnswerSlot(stateRef.current, index), false)
                                    focus()
                                }}
                                className="relative inline-grid min-w-[1.2em] max-w-full cursor-pointer grid-cols-1 grid-rows-1 items-end border-0 bg-transparent p-0 text-center outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default design:min-w-[var(--sentence-answer-width,1.2em)]"
                                style={style}
                            >
                                <span
                                    aria-hidden="true"
                                    className="invisible col-start-1 row-start-1 whitespace-pre"
                                >
                                    {getWordSlotPlaceholder(slot.target, value)}
                                </span>
                                <span
                                    ref={state.activeIndex === index ? activeValueRef : undefined}
                                    className="col-start-1 row-start-1 block min-w-0 overflow-x-auto overflow-y-hidden whitespace-pre [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                >
                                    <span
                                        data-sentence-entered-text
                                        className={wrong ? 'text-danger' : 'text-accent-green'}
                                    >
                                        {value || '\u200b'}
                                    </span>
                                    {hint && (
                                        <span
                                            data-sentence-word-hint
                                            aria-hidden="true"
                                            className="text-practice-muted"
                                        >
                                            {hint}
                                        </span>
                                    )}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className={
                                        active
                                            ? 'pointer-events-none absolute -bottom-[3px] inset-x-0 border-t-[3px] border-accent-green'
                                            : 'pointer-events-none absolute -bottom-[3px] inset-x-0 border-t-[3px] border-practice-muted'
                                    }
                                    style={{ borderTopStyle: props.borderStyle }}
                                />
                            </button>
                            {slot.suffix && (
                                <span className="text-practice-text">{slot.suffix}</span>
                            )}
                        </span>
                    )
                })}
            </div>
            <p role="status" className="sr-only">
                {state.attempts > 0
                    ? state.completed
                        ? '回答正确'
                        : '回答有误，请修改标记的词段'
                    : ''}
            </p>
        </div>
    )
}
