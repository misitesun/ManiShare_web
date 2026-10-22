'use client'

import { useMemo } from 'react'
import type { CSSProperties, ReactElement, RefObject } from 'react'
import type { PracticePhase } from '../model/practice-demo'
import type {
    PracticeAnswerAlphabet,
    WordSpellingInputController,
} from '../model/word-spelling-input'
import { createWordSpellingLayout } from '../model/word-spelling-input'
import type { WordSlotsFeedback } from '../model/word-slot-input'
import { PracticeAnswerInput } from './PracticeAnswerInput'
import type { PracticeAnswerInputView } from './PracticeAnswerInput'

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
    readonly onController?: ((controller: WordSpellingInputController | null) => void) | undefined
    readonly ignoreCase?: boolean | undefined
    readonly alphabet?: PracticeAnswerAlphabet
    readonly onCursorChange?: ((cursor: number) => void) | undefined
    readonly feedback?: WordSlotsFeedback | undefined
    readonly showWordHint?: boolean
}

interface WordSlotsViewProps extends PracticeAnswerInputView {
    readonly borderStyle: 'solid' | 'dashed'
    readonly showWordHint: boolean
}

/** 整词下划线保持原布局；点击任意词都只聚焦，不再创建选区、补空格或改变逻辑位置。 */
function WordSlotsView({
    layout,
    state,
    blocked,
    focused,
    focus,
    borderStyle,
    showWordHint,
}: WordSlotsViewProps): ReactElement {
    return (
        <div
            aria-hidden="true"
            className="flex min-w-0 max-w-full flex-wrap items-end justify-center gap-x-5 gap-y-3"
        >
            {layout.words.map((word, index) => {
                const characters = word.segments.flatMap((segment) => segment.characters)
                const positions = word.segments.flatMap((segment) => segment.positions)
                const active = focused && positions.includes(state.cursor)
                const value = characters
                    .map((character) =>
                        character.position === null
                            ? character.target
                            : (state.letters[character.position] ?? ''),
                    )
                    .join('')
                return (
                    <span
                        key={word.id}
                        data-word-slot-group={index}
                        className="inline-flex min-w-0 max-w-full items-baseline"
                    >
                        {word.prefix && (
                            <span
                                data-word-slot-punctuation
                                className="shrink-0 text-practice-text"
                            >
                                {word.prefix}
                            </span>
                        )}
                        <span
                            data-word-slot-scroll={index}
                            className="min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
                        >
                            <button
                                type="button"
                                tabIndex={-1}
                                disabled={blocked || state.completed}
                                data-word-slot={index}
                                data-word-slot-active={active}
                                data-word-slot-target={characters
                                    .map((character) => character.target)
                                    .join('')}
                                data-word-slot-value={value}
                                onClick={focus}
                                style={{ borderBottomStyle: borderStyle }}
                                className={
                                    active
                                        ? 'relative inline-flex min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-practice-answer bg-transparent px-[0.12em] py-0 text-practice-answer outline-none disabled:cursor-default'
                                        : 'relative inline-flex min-w-[0.8em] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-practice-muted bg-transparent px-[0.12em] py-0 text-practice-answer outline-none disabled:cursor-default'
                                }
                            >
                                <span
                                    data-word-slot-answer
                                    className="inline-flex whitespace-pre text-left"
                                >
                                    {characters.map((character) => {
                                        const position = character.position
                                        const entered =
                                            position === null
                                                ? character.target
                                                : (state.letters[position] ?? '')
                                        const wrong =
                                            position !== null && state.wrong.includes(position)
                                        const cursor = focused && position === state.cursor
                                        return (
                                            <span
                                                key={character.id}
                                                className="relative inline-block"
                                            >
                                                <span
                                                    data-word-slot-character={
                                                        wrong
                                                            ? 'incorrect'
                                                            : entered
                                                              ? 'entered'
                                                              : 'missing'
                                                    }
                                                    className={
                                                        wrong && entered
                                                            ? 'text-danger'
                                                            : entered
                                                              ? 'text-practice-answer'
                                                              : showWordHint
                                                                ? 'text-practice-muted'
                                                                : 'invisible'
                                                    }
                                                >
                                                    {entered || character.target}
                                                </span>
                                                <span
                                                    data-spelling-cursor-active={cursor}
                                                    className={
                                                        cursor
                                                            ? 'pointer-events-none absolute -bottom-[3px] left-0 h-[3px] w-full bg-practice-answer'
                                                            : 'hidden'
                                                    }
                                                />
                                            </span>
                                        )
                                    })}
                                </span>
                            </button>
                        </span>
                        {word.suffix && (
                            <span
                                data-word-slot-punctuation
                                className="shrink-0 text-practice-text"
                            >
                                {word.suffix}
                            </span>
                        )}
                    </span>
                )
            })}
        </div>
    )
}

/** 句子／音视频／指法／看图等真实输入分支，统一复用拼写的推进与纠错引擎。 */
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
    onController,
    ignoreCase = true,
    feedback,
    showWordHint = false,
    onCursorChange,
    alphabet = 'text',
}: PracticeWordSlotsInputProps): ReactElement {
    const layout = useMemo(
        () => createWordSpellingLayout(target, 'syllables', undefined, alphabet),
        [target, alphabet],
    )
    const initialFeedback = feedback?.value === value ? feedback : undefined
    const wrong = initialFeedback?.slots.flatMap((slot) => {
        const word = layout.words[slot.index]
        const positions = word?.segments.flatMap((segment) => segment.positions) ?? []
        return positions.filter((_, index) =>
            ['incorrect', 'missing'].includes(slot.states[index] ?? 'pending'),
        )
    })
    const style: CSSProperties | undefined =
        displayFontSize === undefined ? undefined : { fontSize: displayFontSize }
    return (
        <div
            data-word-slot-input
            data-word-slot-phase={phase}
            style={style}
            className={
                compact
                    ? 'mx-auto w-full min-w-0 max-w-full text-[24px] font-medium leading-[1.2] md:text-[30px]'
                    : 'mx-auto w-full min-w-0 max-w-full text-[28px] font-medium leading-[1.2] md:text-[34px] design:text-[40px]'
            }
        >
            <PracticeAnswerInput
                key={`${alphabet}:${target}`}
                layout={layout}
                initialValue={value}
                feedback={
                    initialFeedback
                        ? { value: initialFeedback.value, wrong: wrong ?? [] }
                        : undefined
                }
                blocked={blocked}
                ignoreCase={ignoreCase}
                showWordHint={showWordHint}
                inputRef={inputRef}
                label={label}
                presentation="words"
                onChange={onChange}
                onSubmit={onSubmit}
                onController={onController}
                onCursorChange={onCursorChange}
                renderSlots={(view): ReactElement => (
                    <WordSlotsView
                        {...view}
                        borderStyle={borderStyle}
                        showWordHint={showWordHint}
                    />
                )}
            />
        </div>
    )
}
