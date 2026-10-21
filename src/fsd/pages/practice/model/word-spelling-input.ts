import type { WordPhoneticBreakdown, WordPhoneticMode } from './word-phonetics'
import { getWordSlotView } from './word-slot-input'

export interface WordSpellingCharacter {
    readonly id: string
    readonly target: string
    readonly position: number | null
}

export interface WordSpellingSegment {
    readonly id: string
    readonly characters: readonly WordSpellingCharacter[]
    readonly positions: readonly number[]
}

export interface WordSpellingWord {
    readonly id: string
    readonly prefix: string
    readonly suffix: string
    readonly segments: readonly WordSpellingSegment[]
}

export interface WordSpellingLayout {
    readonly target: string
    readonly answer: readonly string[]
    readonly words: readonly WordSpellingWord[]
    readonly segments: readonly WordSpellingSegment[]
    readonly split: boolean
    readonly mapped: boolean
}

export interface WordSpellingInputState {
    readonly letters: readonly string[]
    /** 最近提交后尚待重新填入的错位；删除字母不移除其纠错身份。 */
    readonly wrong: readonly number[]
    readonly cursor: number
    readonly attempts: number
    readonly completed: boolean
}

export interface WordSpellingSubmission {
    readonly state: WordSpellingInputState
    readonly value: string | null
}

export interface WordSpellingInputController {
    readonly submit: () => void
    readonly selectSegment: (id: string) => void
}

export function isWordSpellingLetter(character: string): boolean {
    return /^[A-Za-z]$/u.test(character)
}

/** 与参考输入器一致只接受ASCII英文字母；组合期间由UI保留原生缓冲。 */
export function getWordSpellingLetters(value: string): readonly string[] {
    return Array.from(value).filter(isWordSpellingLetter)
}

export function createWordSpellingLayout(
    target: string,
    mode: WordPhoneticMode,
    breakdown?: WordPhoneticBreakdown,
): WordSpellingLayout {
    const split = mode === 'syllables' || mode === 'phonics'
    const slots = getWordSlotView(target, '')
    const groups = split ? breakdown?.[mode] : undefined
    // 所有词均须有覆盖完整单词的显式映射；旧IPA数组保留整词回退。
    const mapped =
        groups?.length === slots.length &&
        slots.every((slot, index) => {
            const group = groups?.[index]
            if (!group) return false
            return (
                group.word.toLowerCase() === slot.target.toLowerCase() &&
                group.segments.length > 0 &&
                group.segments.every((segment) => Boolean(segment.spelling)) &&
                group.segments
                    .map((segment) => segment.spelling)
                    .join('')
                    .toLowerCase() === slot.target.toLowerCase()
            )
        })
    let position = 0
    const words = slots.map((slot, wordIndex): WordSpellingWord => {
        const group = mapped ? groups?.[wordIndex] : undefined
        const parts = group?.segments ?? [
            { id: `word:${wordIndex}`, ipa: '', spelling: slot.target },
        ]
        let offset = 0
        const original = Array.from(slot.target)
        return {
            id: slot.id,
            prefix: slot.prefix,
            suffix: slot.suffix,
            segments: parts.map((part): WordSpellingSegment => {
                const length = Array.from(part.spelling ?? '').length
                const characters = original
                    .slice(offset, offset + length)
                    .map((character, index) => ({
                        id: `${part.id}:${index}`,
                        target: character,
                        position: isWordSpellingLetter(character) ? position++ : null,
                    }))
                offset += length
                return {
                    id: part.id,
                    characters,
                    positions: characters.flatMap((character) =>
                        character.position === null ? [] : [character.position],
                    ),
                }
            }),
        }
    })
    return {
        target,
        answer: Array.from(target).filter(isWordSpellingLetter),
        words,
        segments: words
            .flatMap((word) => word.segments)
            .filter((segment) => segment.positions.length),
        split,
        mapped,
    }
}

export function createWordSpellingInputState(
    layout: WordSpellingLayout,
    value = '',
): WordSpellingInputState {
    const entered = getWordSpellingLetters(value)
    return {
        letters: layout.answer.map((_, index) => entered[index] ?? ''),
        wrong: [],
        cursor: 0,
        attempts: 0,
        completed: false,
    }
}

export function serializeWordSpellingInput(
    layout: WordSpellingLayout,
    state: WordSpellingInputState,
): string {
    let position = 0
    return Array.from(layout.target)
        .map((character) =>
            isWordSpellingLetter(character) ? (state.letters[position++] ?? '') : character,
        )
        .join('')
}

export function typeWordSpellingInput(
    state: WordSpellingInputState,
    value: string,
): WordSpellingInputState {
    if (state.completed || state.letters.length === 0) return state
    let current = state
    for (const character of getWordSpellingLetters(value)) {
        const letters = [...current.letters]
        const position = current.cursor
        letters[position] = character
        const correcting = current.wrong.includes(position)
        const wrong = current.wrong.filter((item) => item !== position)
        const nextWrong = wrong.find((item) => item > position) ?? wrong[0]
        const cursor = correcting
            ? (nextWrong ?? Math.min(position + 1, letters.length - 1))
            : letters.every(Boolean)
              ? position
              : (position + 1) % letters.length
        current = { ...current, letters, wrong, cursor }
    }
    return current
}

export function deleteWordSpellingInput(state: WordSpellingInputState): WordSpellingInputState {
    if (state.completed || state.letters.length === 0) return state
    if (!state.letters[state.cursor])
        return {
            ...state,
            cursor: (state.cursor + state.letters.length - 1) % state.letters.length,
        }
    return {
        ...state,
        letters: state.letters.map((letter, index) => (index === state.cursor ? '' : letter)),
    }
}

export function moveWordSpellingCursor(
    state: WordSpellingInputState,
    layout: WordSpellingLayout,
    delta = 1,
): WordSpellingInputState {
    if (state.completed || state.letters.length === 0) return state
    const ranges = layout.segments
    const index = ranges.findIndex((segment) => segment.positions.includes(state.cursor))
    const next = ranges[(Math.max(0, index) + delta + ranges.length) % ranges.length]
    return {
        ...state,
        cursor:
            layout.split && next
                ? (next.positions[0] ?? state.cursor)
                : (state.cursor + delta + state.letters.length) % state.letters.length,
    }
}

/** 空格/Enter/底栏同一入口：待填/纠错时只导航，填满后才校验并计一次提交。 */
export function submitWordSpellingInput(
    state: WordSpellingInputState,
    layout: WordSpellingLayout,
    ignoreCase: boolean,
): WordSpellingSubmission {
    if (state.completed || state.letters.length === 0) return { state, value: null }
    if (state.letters.some((letter) => !letter) || state.wrong.length)
        return { state: moveWordSpellingCursor(state, layout), value: null }
    const wrong = layout.answer.flatMap((expected, index) => {
        const actual = state.letters[index] ?? ''
        const correct = ignoreCase
            ? actual.toLowerCase() === expected.toLowerCase()
            : actual === expected
        return correct ? [] : [index]
    })
    return {
        state: {
            ...state,
            wrong,
            cursor: wrong[0] ?? state.cursor,
            attempts: state.attempts + 1,
            completed: wrong.length === 0,
        },
        value: serializeWordSpellingInput(layout, state),
    }
}
