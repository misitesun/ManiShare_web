'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import {
    createWordSpellingInputState,
    deleteWordSpellingInput,
    getWordSpellingLetters,
    moveWordSpellingCursor,
    serializeWordSpellingInput,
    submitWordSpellingInput,
    typeWordSpellingInput,
} from '../model/word-spelling-input'
import type {
    WordSpellingInputController,
    WordSpellingInputState,
    WordSpellingLayout,
} from '../model/word-spelling-input'

interface WordSpellingInputProps {
    readonly layout: WordSpellingLayout
    readonly initialValue: string
    readonly blocked: boolean
    readonly ignoreCase: boolean
    readonly showWordHint: boolean
    readonly displayFontSize?: number | undefined
    readonly onChange: (value: string) => void
    readonly onSubmit?: ((value: string) => void) | undefined
    readonly onController: (controller: WordSpellingInputController | null) => void
    readonly onSegmentPulse: (id: string) => void
}

/** 只在单词拼写使用固定字母位；其他模式继续走原整词原生编辑器。 */
export function WordSpellingInput(props: WordSpellingInputProps): ReactElement {
    const { layout, blocked, showWordHint, displayFontSize, onController } = props
    const id = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [state, setState] = useState(() =>
        createWordSpellingInputState(layout, props.initialValue),
    )
    const stateRef = useRef(state)
    const propsRef = useRef(props)
    propsRef.current = props
    const [focused, setFocused] = useState(false)
    const [compositionValue, setCompositionValue] = useState<string | null>(null)
    const composing = useRef(false)
    const compositionReplay = useRef<string | null>(null)
    const attemptedFocus = useRef(false)
    const history = useRef<{ past: WordSpellingInputState[]; future: WordSpellingInputState[] }>({
        past: [],
        future: [],
    })
    const selection = useRef<{ start: number; end: number } | null>(null)
    const actionsRef = useRef<WordSpellingInputController>({
        submit: (): void => {},
        selectSegment: (): void => {},
    })
    const buffer = state.letters.join('')
    const fontStyle: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }

    function editable(): boolean {
        return !propsRef.current.blocked && !stateRef.current.completed && !composing.current
    }

    function update(next: WordSpellingInputState, remember = true): void {
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
    }

    function submit(): void {
        if (!editable()) return
        const result = submitWordSpellingInput(
            stateRef.current,
            propsRef.current.layout,
            propsRef.current.ignoreCase,
        )
        update(result.state)
        if (result.value !== null) propsRef.current.onSubmit?.(result.value)
    }

    function selectSegment(segmentId: string): void {
        if (!editable()) return
        const segment = propsRef.current.layout.segments.find((item) => item.id === segmentId)
        const position = segment?.positions[0]
        if (position === undefined) return
        inputRef.current?.focus({ preventScroll: true })
        update({ ...stateRef.current, cursor: position }, false)
        propsRef.current.onSegmentPulse(segmentId)
    }
    actionsRef.current = { submit, selectSegment }

    function restore(redo: boolean): void {
        if (!editable()) return
        const source = redo ? history.current.future : history.current.past
        const next = source.pop()
        if (!next) return
        const destination = redo ? history.current.past : history.current.future
        destination.push(stateRef.current)
        update({ ...next, completed: false }, false)
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
        if (raw === previous) return
        let next = stateRef.current
        if (selected && selected.end > selected.start) {
            const positions = next.letters.flatMap((letter, index) => (letter ? [index] : []))
            const removed = positions.slice(selected.start, selected.end)
            next = {
                ...next,
                letters: next.letters.map((letter, index) =>
                    removed.includes(index) ? '' : letter,
                ),
                wrong: next.wrong.filter((position) => !removed.includes(position)),
                cursor: removed[0] ?? next.cursor,
            }
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
        if (/^\s+$/u.test(entered)) {
            submit()
            return
        }
        if (getWordSpellingLetters(entered).length) update(typeWordSpellingInput(next, entered))
    }

    useEffect(() => {
        const controller: WordSpellingInputController = {
            submit: (): void => actionsRef.current.submit(),
            selectSegment: (segmentId): void => actionsRef.current.selectSegment(segmentId),
        }
        onController(controller)
        return (): void => onController(null)
    }, [onController])

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
    }, [blocked])

    // 原生输入承接IME/剪贴板；固定字母位的逻辑光标由模型拥有。
    useLayoutEffect(() => {
        const input = inputRef.current
        if (!input || composing.current || input.ownerDocument.activeElement !== input) return
        input.setSelectionRange(input.value.length, input.value.length)
    }, [buffer, compositionValue])

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
    return (
        <div
            ref={rootRef}
            data-word-spelling-input
            data-spelling-mode={layout.split ? 'segments' : 'letters'}
            data-spelling-errors={state.wrong.join(',')}
            style={fontStyle}
            className="relative mx-auto w-full min-w-0 max-w-full pt-[max(0px,calc(50px_-_1em))] text-[24px] font-medium leading-none md:text-[30px]"
        >
            <label htmlFor={id} className="sr-only">
                练习答案
            </label>
            <input
                ref={inputRef}
                id={id}
                data-practice-answer-input
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
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
                }}
                onPaste={(event): void => {
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
                }}
                onCut={(event): void => {
                    selection.current = {
                        start: event.currentTarget.selectionStart ?? 0,
                        end: event.currentTarget.selectionEnd ?? 0,
                    }
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
                    update({ ...stateRef.current, cursor: 0 }, false)
                }}
                onBlur={(): void => {
                    setFocused(false)
                    selection.current = null
                }}
                onKeyDown={(event): void => {
                    if (
                        event.nativeEvent.isComposing ||
                        event.nativeEvent.keyCode === 229 ||
                        composing.current
                    )
                        return
                    if (
                        (event.ctrlKey || event.metaKey) &&
                        !event.altKey &&
                        ['z', 'y'].includes(event.key.toLowerCase())
                    ) {
                        event.preventDefault()
                        event.stopPropagation()
                        selection.current = null
                        restore(event.key.toLowerCase() === 'y' || event.shiftKey)
                        return
                    }
                    if (event.ctrlKey || event.altKey || event.metaKey) return
                    if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault()
                        event.stopPropagation()
                        selection.current = null
                        if (!event.repeat) submit()
                    } else if (event.key === 'Backspace' || event.key === 'Delete') {
                        event.preventDefault()
                        event.stopPropagation()
                        selection.current = null
                        if (editable()) update(deleteWordSpellingInput(stateRef.current))
                    } else if (
                        !event.shiftKey &&
                        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
                    ) {
                        event.preventDefault()
                        event.stopPropagation()
                        selection.current = null
                        if (!editable()) return
                        const next = moveWordSpellingCursor(
                            stateRef.current,
                            propsRef.current.layout,
                            event.key === 'ArrowLeft' ? -1 : 1,
                        )
                        update(next, false)
                        if (layout.split) {
                            const segment = layout.segments.find((item) =>
                                item.positions.includes(next.cursor),
                            )
                            if (segment) propsRef.current.onSegmentPulse(segment.id)
                        }
                    }
                }}
                className="pointer-events-none absolute left-0 top-0 h-px w-px cursor-text border-0 bg-transparent p-0 text-[16px] opacity-0 outline-none disabled:cursor-default"
            />
            <div
                aria-hidden="true"
                className="flex min-w-0 max-w-full flex-wrap items-end justify-center gap-x-5 gap-y-4 overflow-x-auto px-1 pb-3"
            >
                {layout.words.map((word) => (
                    <span
                        key={word.id}
                        className="inline-flex max-w-full flex-wrap items-end justify-center gap-y-3"
                    >
                        {word.prefix && <span>{word.prefix}</span>}
                        {word.segments.map((segment) => (
                            <span
                                key={segment.id}
                                data-word-spelling-segment={segment.id}
                                className={
                                    layout.split
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
                                        return <span key={character.id}>{character.target}</span>
                                    const entered = state.letters[position] ?? ''
                                    // 空位保留待纠错身份，字形仍按默写／抄写规则隐藏或提示。
                                    const wrong = Boolean(entered) && state.wrong.includes(position)
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
                                            onPointerDown={(event): void => event.preventDefault()}
                                            onClick={(): void => {
                                                if (!editable()) return
                                                inputRef.current?.focus({ preventScroll: true })
                                                update(
                                                    { ...stateRef.current, cursor: position },
                                                    false,
                                                )
                                            }}
                                            className="relative inline-flex shrink-0 cursor-pointer items-end border-0 bg-transparent p-0 leading-none outline-none disabled:cursor-default"
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
                                                    layout.split
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
            <span role="status" className="sr-only">
                {state.wrong.length ? `有${state.wrong.length}个字母需要修改。` : ''}
            </span>
        </div>
    )
}
