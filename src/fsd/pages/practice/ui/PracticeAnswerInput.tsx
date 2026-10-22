'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, RefObject } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { copyText } from '../../../shared/lib/clipboard'
import { PracticeInputBridge } from './PracticeInputBridge'
import {
    createWordSpellingInputState,
    clearWordSpellingInputSelection,
    deleteWordSpellingInput,
    getWordSpellingLetters,
    getWordSpellingEntryCursor,
    getPracticeAnswerKeyAction,
    resetEmptyWordSpellingCursor,
    serializeWordSpellingInput,
    submitWordSpellingInput,
    spaceWordSpellingInput,
    typeWordSpellingInput,
} from '../model/word-spelling-input'
import type {
    WordSpellingInputController,
    WordSpellingInputState,
    WordSpellingLayout,
} from '../model/word-spelling-input'

export interface PracticeAnswerInputView {
    readonly layout: WordSpellingLayout
    readonly state: WordSpellingInputState
    readonly focused: boolean
    readonly blocked: boolean
    readonly focus: () => void
}

export interface PracticeAnswerInputProps {
    readonly layout: WordSpellingLayout
    readonly initialValue: string
    readonly blocked: boolean
    readonly ignoreCase: boolean
    readonly showWordHint: boolean
    readonly displayFontSize?: number | undefined
    readonly onChange: (value: string) => void
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
    readonly onSegmentPulse?: ((id: string) => void) | undefined
    readonly inputRef?: RefObject<HTMLInputElement | null> | undefined
    readonly label?: string | undefined
    readonly presentation?: 'spelling' | 'words' | 'inline' | 'typing'
    /** 行内题面保留原有底线设置，其他表现继续使用各自的默认渲染。 */
    readonly borderStyle?: 'solid' | 'dashed' | undefined
    readonly renderSlots?: ((view: PracticeAnswerInputView) => ReactElement) | undefined
    readonly feedback?: { readonly value: string; readonly wrong: readonly number[] } | undefined
    readonly onCursorChange?: ((cursor: number) => void) | undefined
}

function feedbackPositions(positions: readonly number[], length: number): readonly number[] {
    return Array.from(
        new Set(
            positions.filter(
                (position) => Number.isInteger(position) && position >= 0 && position < length,
            ),
        ),
    ).sort((left, right) => left - right)
}

/** 全部练习作答共用原生输入桥与推进模型；视觉分组不拥有定位权限。 */
export function PracticeAnswerInput(props: PracticeAnswerInputProps): ReactElement {
    const { layout, blocked, showWordHint, displayFontSize, onController } = props
    const inline = props.presentation === 'inline'
    const typing = props.presentation === 'typing'
    const id = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const internalInputRef = useRef<HTMLInputElement>(null)
    const inputRef = props.inputRef ?? internalInputRef
    const [state, setState] = useState(() => {
        const initial = createWordSpellingInputState(layout, props.initialValue)
        if (!props.feedback || props.feedback.value !== props.initialValue) return initial
        const wrong = feedbackPositions(props.feedback.wrong, initial.letters.length)
        return { ...initial, wrong, cursor: wrong[0] ?? initial.cursor }
    })
    const stateRef = useRef(state)
    const propsRef = useRef(props)
    propsRef.current = props
    const [focused, setFocused] = useState(false)
    const [compositionValue, setCompositionValue] = useState<string | null>(null)
    const composing = useRef(false)
    const compositionReplay = useRef<string | null>(null)
    const attemptedFocus = useRef(false)
    const active = useRef(false)
    const history = useRef<{ past: WordSpellingInputState[]; future: WordSpellingInputState[] }>({
        past: [],
        future: [],
    })
    const selection = useRef<{ start: number; end: number } | null>(null)
    const actionsRef = useRef<WordSpellingInputController>({
        focus: (): void => {},
        submit: (): void => {},
        space: (): void => {},
        selectSegment: (): void => {},
    })
    const buffer = state.letters.join('')
    const feedbackKey = props.feedback ? JSON.stringify(props.feedback) : ''
    const previousFeedback = useRef(feedbackKey)
    const fontStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }

    function editable(): boolean {
        return !propsRef.current.blocked && !stateRef.current.completed && !composing.current
    }

    const update = useCallback((next: WordSpellingInputState, remember = true): void => {
        next = resetEmptyWordSpellingCursor(next)
        const previous = stateRef.current
        if (next === previous) return
        const edited = next.letters !== previous.letters
        if (remember && (edited || next.attempts !== previous.attempts)) {
            history.current.past.push(previous)
            if (history.current.past.length > 100) history.current.past.shift()
            history.current.future = []
        }
        stateRef.current = next
        setState(next)
        if (edited)
            propsRef.current.onChange(serializeWordSpellingInput(propsRef.current.layout, next))
    }, [])

    function submit(space = false): void {
        if (!editable()) return
        collapseBufferSelection()
        const result = (space ? spaceWordSpellingInput : submitWordSpellingInput)(
            stateRef.current,
            propsRef.current.layout,
            propsRef.current.ignoreCase,
        )
        update(result.state)
        if (!result.state.completed) inputRef.current?.focus({ preventScroll: true })
        if (result.value !== null) propsRef.current.onSubmit?.(result.value)
    }

    function focusLetter(): void {
        if (!editable()) return
        const input = inputRef.current
        if (!input || input.disabled || input.closest('[inert]')) return
        const cursor = getWordSpellingEntryCursor(stateRef.current)
        input.focus({ preventScroll: true })
        collapseBufferSelection()
        if (cursor !== stateRef.current.cursor) update({ ...stateRef.current, cursor }, false)
    }

    function collapseBufferSelection(): void {
        selection.current = null
        const input = inputRef.current
        if (
            input &&
            (input.selectionStart !== input.value.length ||
                input.selectionEnd !== input.value.length)
        )
            input.setSelectionRange(input.value.length, input.value.length)
    }

    function selectSegment(segmentId: string): void {
        if (!editable()) return
        const segment = propsRef.current.layout.segments.find((item) => item.id === segmentId)
        if (!segment) return
        focusLetter()
        propsRef.current.onSegmentPulse?.(segment.id)
    }
    actionsRef.current = {
        focus: focusLetter,
        submit: (): void => submit(),
        space: (): void => submit(true),
        selectSegment,
    }

    function restore(redo: boolean): void {
        if (!editable()) return
        collapseBufferSelection()
        const source = redo ? history.current.future : history.current.past
        const next = source.pop()
        if (!next) return
        const destination = redo ? history.current.past : history.current.future
        destination.push(stateRef.current)
        update({ ...next, completed: false }, false)
    }

    async function copySelection(cut: boolean): Promise<void> {
        const current = stateRef.current
        try {
            // 原生缓冲不包含静态标点和词间空白；复制仍输出页面作答值。
            const copied = await copyText(
                serializeWordSpellingInput(propsRef.current.layout, current),
            )
            if (cut && copied && active.current && editable() && stateRef.current === current)
                update(clearWordSpellingInputSelection(current, 0, current.letters.join('').length))
        } catch {
            // 剪贴板失败保留作答内容，不把未成功复制的内容删掉。
        }
    }

    function editBuffer(raw: string, inputType: string): void {
        if (!editable()) return
        if (inputType === 'historyUndo' || inputType === 'historyRedo') {
            restore(inputType === 'historyRedo')
            return
        }
        const previous = stateRef.current.letters.join('')
        const selected = selection.current
        selection.current = null
        if (inputType === 'insertLineBreak' || inputType === 'insertParagraph') {
            submit()
            return
        }
        if (raw === previous) return
        let next = stateRef.current
        if (selected && selected.end > selected.start) {
            next = clearWordSpellingInputSelection(next, selected.start, selected.end)
        }
        if (inputType.startsWith('delete')) {
            update(next === stateRef.current ? deleteWordSpellingInput(next) : next)
            return
        }
        let start = 0
        while (start < previous.length && start < raw.length && previous[start] === raw[start])
            start += 1
        let beforeEnd = previous.length
        let afterEnd = raw.length
        while (
            beforeEnd > start &&
            afterEnd > start &&
            previous[beforeEnd - 1] === raw[afterEnd - 1]
        ) {
            beforeEnd -= 1
            afterEnd -= 1
        }
        const entered =
            selected && selected.end > selected.start
                ? raw.slice(
                      selected.start,
                      selected.start +
                          raw.length -
                          (previous.length - (selected.end - selected.start)),
                  )
                : raw.slice(start, afterEnd)
        if (entered === ' ' && inputType === 'insertText') {
            submit(true)
            return
        }
        if (getWordSpellingLetters(entered, propsRef.current.layout.alphabet).length)
            update(
                typeWordSpellingInput(
                    next,
                    entered,
                    selected && selected.end > selected.start ? 'selection' : 'cursor',
                    propsRef.current.layout.alphabet,
                ),
            )
    }

    useEffect(() => {
        if (previousFeedback.current === feedbackKey) return
        if (composing.current) return
        previousFeedback.current = feedbackKey
        const feedback = propsRef.current.feedback
        const current = stateRef.current
        if (
            !feedback ||
            feedback.value !== serializeWordSpellingInput(propsRef.current.layout, current)
        )
            return
        const wrong = feedbackPositions(feedback.wrong, current.letters.length)
        update({ ...current, wrong, cursor: wrong[0] ?? current.cursor, completed: false }, false)
    }, [feedbackKey, compositionValue, update])

    useLayoutEffect(() => {
        active.current = true
        const controller: WordSpellingInputController = {
            focus: (): void => actionsRef.current.focus(),
            submit: (): void => actionsRef.current.submit(),
            space: (): void => actionsRef.current.space(),
            selectSegment: (segmentId): void => actionsRef.current.selectSegment(segmentId),
        }
        onController?.(controller)
        return (): void => {
            active.current = false
            onController?.(null)
        }
    }, [onController])

    useEffect(() => props.onCursorChange?.(state.cursor), [props.onCursorChange, state.cursor])

    useEffect(() => {
        if (blocked || attemptedFocus.current) return
        attemptedFocus.current = true
        const input = inputRef.current
        if (!input) return
        const document = input.ownerDocument
        const active = document.activeElement
        const root = active?.matches('[data-practice-phase][tabindex="-1"],main[tabindex="-1"]')
        if (!active || active === document.body || active === document.documentElement || root)
            input.focus({ preventScroll: true })
    }, [blocked, inputRef])

    // 原生输入承接IME/剪贴板；固定字母位的逻辑光标由模型拥有。
    useLayoutEffect(() => {
        const input = inputRef.current
        if (!input || composing.current || input.ownerDocument.activeElement !== input) return
        input.setSelectionRange(input.value.length, input.value.length)
    }, [buffer, compositionValue, inputRef])

    useLayoutEffect(() => {
        if (composing.current || !focused) return
        const cursor = rootRef.current?.querySelector('[data-spelling-cursor-active="true"]')
        const container = cursor?.closest('[data-word-slot-scroll]')
        if (!(container instanceof HTMLElement) || !cursor) return
        const rect = cursor.getBoundingClientRect()
        const bounds = container.getBoundingClientRect()
        if (rect.left < bounds.left) container.scrollLeft -= bounds.left - rect.left
        else if (rect.right > bounds.right) container.scrollLeft += rect.right - bounds.right
    }, [buffer, focused, state.cursor])

    useGSAP(
        (): void => {
            if (!focused || blocked || state.completed) return
            const cursors = rootRef.current?.querySelectorAll(
                '[data-spelling-cursor-active="true"]',
            )
            if (!cursors?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                return
            gsap.to(cursors, {
                opacity: 0,
                duration: 0.5,
                ease: 'steps(1)',
                repeat: -1,
                yoyo: true,
            })
        },
        {
            scope: rootRef,
            dependencies: [focused, blocked, state.cursor, state.completed, layout],
            revertOnUpdate: true,
        },
    )

    useGSAP(
        (): void => {
            if (
                !state.attempts ||
                state.wrong.length === 0 ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            )
                return
            gsap.fromTo(
                rootRef.current,
                { x: -5 },
                { x: 5, duration: 0.06, repeat: 3, yoyo: true, clearProps: 'transform' },
            )
        },
        { scope: rootRef, dependencies: [state.attempts], revertOnUpdate: true },
    )

    // 横线顶部 = 上留白 + 片段10px + 1em字母行 + (6px下移 - 4px线高)。
    // 62px目标距离对应上留白max(0px, 50px - 1em)；大字号超出时自然撑高。
    // 行内表现继承句子字号、移除字卡顶部留白；字母槽与逻辑光标仍走同一渲染。
    return (
        <div
            ref={rootRef}
            data-practice-controlled-answer
            data-practice-answer-presentation={props.presentation ?? 'spelling'}
            data-word-spelling-input={props.presentation === 'words' ? undefined : true}
            data-spelling-mode={layout.split ? 'segments' : 'letters'}
            data-spelling-errors={state.wrong.join(',')}
            style={fontStyle}
            onClick={focusLetter}
            onPointerDown={(event): void => {
                if (event.pointerType === 'mouse') event.preventDefault()
            }}
            className={
                inline
                    ? 'relative inline-flex min-w-0 max-w-full select-none cursor-text items-baseline align-baseline text-inherit font-normal leading-none [font-size:inherit]'
                    : typing
                      ? 'relative mx-auto w-full min-w-0 max-w-full select-none cursor-text text-inherit font-medium leading-none [font-size:inherit]'
                      : props.presentation === 'words'
                        ? 'relative mx-auto w-full min-w-0 max-w-full select-none cursor-text text-inherit font-medium leading-[1.2]'
                        : 'relative mx-auto w-full min-w-0 max-w-full select-none cursor-text pt-[max(0px,calc(50px_-_1em))] text-[24px] font-medium leading-none md:text-[30px]'
            }
        >
            <label htmlFor={id} className="sr-only">
                {props.label ?? '练习答案'}
            </label>
            <PracticeInputBridge
                ref={inputRef}
                id={id}
                data-practice-answer-input
                data-answer-cursor={state.cursor}
                aria-label="练习答案"
                type="text"
                lang="en"
                inputMode="text"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={compositionValue ?? buffer}
                disabled={blocked || state.completed}
                onBeforeInput={(event): void => {
                    if (composing.current) return
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
                }}
                onSelect={(event): void => {
                    if (composing.current) return
                    const input = event.currentTarget
                    // 只保留显式全文选择用于复制、剪切、整体替换；不把原生局部选区用作答题定位。
                    if (input.selectionStart === 0 && input.selectionEnd === input.value.length)
                        selection.current = { start: 0, end: input.value.length }
                    else collapseBufferSelection()
                }}
                onPaste={(event): void => {
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
                }}
                onCopy={(event): void => {
                    const input = event.currentTarget
                    if (
                        input.selectionStart !== 0 ||
                        input.selectionEnd !== input.value.length ||
                        !input.value
                    )
                        return
                    event.preventDefault()
                    void copySelection(false)
                }}
                onCut={(event): void => {
                    const input = event.currentTarget
                    if (
                        input.selectionStart !== 0 ||
                        input.selectionEnd !== input.value.length ||
                        !input.value
                    )
                        return
                    event.preventDefault()
                    void copySelection(true)
                }}
                onChange={(event): void => {
                    const raw = event.currentTarget.value
                    const native = event.nativeEvent
                    if (composing.current) {
                        setCompositionValue(raw)
                        return
                    }
                    if (compositionReplay.current === raw) {
                        compositionReplay.current = null
                        return
                    }
                    compositionReplay.current = null
                    editBuffer(raw, native instanceof InputEvent ? native.inputType : 'insertText')
                }}
                onCompositionStart={(event): void => {
                    composing.current = true
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
                    setCompositionValue(event.currentTarget.value)
                }}
                onCompositionEnd={(event): void => {
                    composing.current = false
                    const raw = event.currentTarget.value
                    editBuffer(raw, 'insertCompositionText')
                    compositionReplay.current = raw
                    setCompositionValue(null)
                }}
                onFocus={(): void => {
                    setFocused(true)
                    const cursor = getWordSpellingEntryCursor(stateRef.current)
                    if (cursor !== stateRef.current.cursor)
                        update({ ...stateRef.current, cursor }, false)
                }}
                onBlur={(): void => {
                    setFocused(false)
                    selection.current = null
                }}
                onKeyDown={(event): void => {
                    const action = getPracticeAnswerKeyAction({
                        key: event.key,
                        ctrlKey: event.ctrlKey,
                        altKey: event.altKey,
                        metaKey: event.metaKey,
                        shiftKey: event.shiftKey,
                        defaultPrevented: event.defaultPrevented,
                        isComposing: event.nativeEvent.isComposing || composing.current,
                        keyCode: event.nativeEvent.keyCode,
                    })
                    if (action === 'native') return
                    event.preventDefault()
                    event.stopPropagation()
                    selection.current = null
                    if (action === 'block-position') collapseBufferSelection()
                    else if (action === 'undo' || action === 'redo') restore(action === 'redo')
                    else if (action === 'space' || action === 'submit') {
                        if (!event.repeat) submit(action === 'space')
                    } else if (editable()) {
                        const start = event.currentTarget.selectionStart ?? 0
                        const end = event.currentTarget.selectionEnd ?? start
                        update(
                            end > start
                                ? clearWordSpellingInputSelection(stateRef.current, start, end)
                                : deleteWordSpellingInput(stateRef.current),
                        )
                    }
                }}
            />
            {props.renderSlots ? (
                props.renderSlots({
                    layout,
                    state,
                    blocked,
                    focused: focused && !blocked && !state.completed,
                    focus: focusLetter,
                })
            ) : (
                <div
                    aria-hidden="true"
                    className={
                        inline || typing
                            ? 'flex min-w-0 max-w-full flex-wrap items-baseline justify-center gap-x-5 gap-y-4 px-1 pb-3'
                            : 'flex min-w-0 max-w-full flex-wrap items-end justify-center gap-x-5 gap-y-4 overflow-x-auto px-1 pb-3'
                    }
                >
                    {layout.words.map((word) => (
                        <span
                            key={word.id}
                            className={
                                inline
                                    ? 'inline-flex max-w-full flex-wrap items-baseline justify-center gap-y-3'
                                    : 'inline-flex max-w-full flex-wrap items-end justify-center gap-y-3'
                            }
                        >
                            {word.prefix && <span>{word.prefix}</span>}
                            {word.segments.map((segment) => (
                                <span
                                    key={segment.id}
                                    data-word-spelling-segment={segment.id}
                                    className={
                                        inline
                                            ? 'relative mx-1 inline-flex min-w-0 max-w-full flex-wrap items-baseline gap-y-3 rounded-[4px] px-0.5'
                                            : typing
                                              ? 'relative inline-flex min-w-0 max-w-full flex-wrap items-end gap-y-3'
                                              : layout.split
                                                ? 'relative mx-1 inline-flex shrink-0 items-end rounded-[4px] px-0.5 pt-2.5'
                                                : 'relative inline-flex shrink-0 items-end pt-2.5'
                                    }
                                >
                                    <span
                                        data-spelling-pulse-segment={segment.id}
                                        className="pointer-events-none absolute inset-0 rounded-[4px] bg-practice-control-accent/25 opacity-0"
                                    />
                                    {segment.characters.map((character) => {
                                        const position = character.position
                                        if (position === null)
                                            return (
                                                <span key={character.id}>{character.target}</span>
                                            )
                                        const entered = state.letters[position] ?? ''
                                        // 空位保留待纠错身份，字形仍按默写／抄写规则隐藏或提示。
                                        const wrong =
                                            Boolean(entered) && state.wrong.includes(position)
                                        const active =
                                            focused &&
                                            !blocked &&
                                            !state.completed &&
                                            state.cursor === position
                                        return (
                                            <button
                                                key={character.id}
                                                type="button"
                                                tabIndex={-1}
                                                disabled={blocked || state.completed}
                                                data-spelling-position={position}
                                                onPointerDown={(event): void =>
                                                    event.preventDefault()
                                                }
                                                onClick={focusLetter}
                                                className={
                                                    inline
                                                        ? 'relative inline-flex shrink-0 cursor-pointer items-baseline border-0 bg-transparent p-0 leading-none outline-none disabled:cursor-default'
                                                        : 'relative inline-flex shrink-0 cursor-pointer items-end border-0 bg-transparent p-0 leading-none outline-none disabled:cursor-default'
                                                }
                                            >
                                                <span
                                                    data-spelling-letter={
                                                        wrong
                                                            ? 'incorrect'
                                                            : entered
                                                              ? 'entered'
                                                              : 'empty'
                                                    }
                                                    className={
                                                        wrong
                                                            ? 'relative inline-block leading-none text-danger'
                                                            : entered
                                                              ? 'relative inline-block leading-none text-practice-answer'
                                                              : showWordHint
                                                                ? 'relative inline-block leading-none text-practice-muted'
                                                                : 'invisible relative inline-block leading-none text-practice-muted'
                                                    }
                                                >
                                                    {entered || character.target}
                                                </span>
                                                <span
                                                    data-spelling-cursor-active={active}
                                                    className={
                                                        inline && props.borderStyle === 'dashed'
                                                            ? active
                                                                ? 'pointer-events-none absolute -bottom-[6px] left-0 h-1 w-full border-t-4 border-dashed border-practice-answer'
                                                                : 'pointer-events-none absolute -bottom-[6px] left-0 h-1 w-full border-t-4 border-dashed border-practice-text/50'
                                                            : layout.split
                                                              ? active
                                                                  ? 'pointer-events-none absolute -bottom-[6px] left-0 h-1 w-full bg-practice-answer'
                                                                  : 'pointer-events-none absolute -bottom-[6px] left-0 h-1 w-full bg-practice-text/50'
                                                              : active
                                                                ? 'pointer-events-none absolute -bottom-[6px] left-[10%] h-1 w-[80%] rounded-[2px] bg-practice-answer'
                                                                : 'pointer-events-none absolute -bottom-[6px] left-[10%] h-1 w-[80%] rounded-[2px] bg-practice-text/50'
                                                    }
                                                />
                                            </button>
                                        )
                                    })}
                                </span>
                            ))}
                            {word.suffix && <span>{word.suffix}</span>}
                        </span>
                    ))}
                </div>
            )}
            <span role="status" className="sr-only">
                {state.wrong.length ? `有${state.wrong.length}个字母需要修改。` : ''}
            </span>
        </div>
    )
}
