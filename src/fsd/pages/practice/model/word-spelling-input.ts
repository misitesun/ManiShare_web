import type { WordPhoneticBreakdown, WordPhoneticMode } from './word-phonetics'
import { getWordSlotView } from './word-slot-input'

export type PracticeAnswerAlphabet = 'latin' | 'text' | 'typing'

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
    readonly alphabet: PracticeAnswerAlphabet
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
    readonly focus: () => void
    readonly submit: () => void
    readonly space: () => void
    readonly selectSegment: (id: string) => void
}

export interface PracticeAnswerKey {
    readonly key: string
    readonly ctrlKey: boolean
    readonly altKey: boolean
    readonly metaKey: boolean
    readonly shiftKey: boolean
    readonly isComposing: boolean
    readonly keyCode: number
    readonly defaultPrevented: boolean
}

export type PracticeAnswerKeyAction =
    'native' | 'block-position' | 'undo' | 'redo' | 'space' | 'submit' | 'delete'

/** 已由页面消费的命令和IME先让行；光标键即使带修饰键也不能产生局部选区。 */
export function getPracticeAnswerKeyAction(event: PracticeAnswerKey): PracticeAnswerKeyAction {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return 'native'
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return 'block-position'
    const key = event.key.toLowerCase()
    if ((event.ctrlKey || event.metaKey) && !event.altKey && (key === 'z' || key === 'y'))
        return key === 'y' || event.shiftKey ? 'redo' : 'undo'
    if (event.ctrlKey || event.altKey || event.metaKey) return 'native'
    if (event.key === ' ') return 'space'
    if (event.key === 'Enter') return 'submit'
    if (event.key === 'Backspace' || event.key === 'Delete') return 'delete'
    return 'native'
}

export function isWordSpellingLetter(
    character: string,
    alphabet: PracticeAnswerAlphabet = 'latin',
): boolean {
    if (alphabet === 'typing') return /^\S$/u.test(character)
    return alphabet === 'text' ? /^[\p{L}\p{N}]$/u.test(character) : /^[A-Za-z]$/u.test(character)
}

/** 单词维持英文字母契约；其余文本练习接受目标中的文字和数字，标点由题目提供。 */
export function getWordSpellingLetters(
    value: string,
    alphabet: PracticeAnswerAlphabet = 'latin',
): readonly string[] {
    return Array.from(value).filter((character) => isWordSpellingLetter(character, alphabet))
}

export function createWordSpellingLayout(
    target: string,
    mode: WordPhoneticMode,
    breakdown?: WordPhoneticBreakdown,
    alphabet: PracticeAnswerAlphabet = 'latin',
): WordSpellingLayout {
    const split = mode === 'syllables' || mode === 'phonics'
    const slots =
        alphabet === 'typing'
            ? target
                  .trim()
                  .split(/\s+/u)
                  .map((word, index) => ({
                      id: `word-slot-${index}`,
                      target: word,
                      prefix: '',
                      suffix: '',
                  }))
            : getWordSlotView(target, '')
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
                        position: isWordSpellingLetter(character, alphabet) ? position++ : null,
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
        alphabet,
        answer: getWordSpellingLetters(target, alphabet),
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
    const entered = getWordSpellingLetters(value, layout.alphabet)
    const letters = layout.answer.map((_, index) => entered[index] ?? '')
    if (layout.alphabet !== 'latin') {
        const slots = getWordSlotView(layout.target, value)
        const words = value.trim().split(/\s+/u)
        for (const [index, word] of layout.words.entries()) {
            const input = getWordSpellingLetters(
                (layout.alphabet === 'typing' ? words[index] : slots[index]?.value) ?? '',
                layout.alphabet,
            )
            const positions = word.segments.flatMap((segment) => segment.positions)
            positions.forEach((position, offset) => {
                letters[position] = input[offset] ?? ''
            })
        }
    }
    return {
        letters,
        wrong: [],
        cursor: Math.max(
            0,
            letters.findIndex((letter) => !letter),
        ),
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
            isWordSpellingLetter(character, layout.alphabet)
                ? (state.letters[position++] ?? '')
                : character,
        )
        .join('')
}

/** 光标只属于模型，重新聚焦不能带入鼠标、原生选区或音标位置。 */
export function getWordSpellingEntryCursor(state: WordSpellingInputState): number {
    if (!state.letters.some(Boolean)) return 0
    if (state.letters[state.cursor]) return state.cursor
    if (state.cursor === state.letters.findIndex((letter) => !letter)) return state.cursor
    const positions = getWordSpellingEditablePositions(state)
    return positions.includes(state.cursor) ? state.cursor : (positions[0] ?? 0)
}

/** 空格的编辑范围：待纠错位，或已填位加首个空位；不会跳过未录入的位置。 */
export function getWordSpellingEditablePositions(state: WordSpellingInputState): readonly number[] {
    if (state.letters.length === 0) return []
    if (state.wrong.length) return state.wrong
    const firstEmpty = state.letters.findIndex((letter) => !letter)
    return state.letters.flatMap((letter, index) => (letter || index === firstEmpty ? [index] : []))
}

/** 整词清空后回到首位并丢弃过期错位，重新输入从头开始。 */
export function resetEmptyWordSpellingCursor(
    state: WordSpellingInputState,
): WordSpellingInputState {
    if (state.letters.some(Boolean) || (state.cursor === 0 && state.wrong.length === 0))
        return state
    return { ...state, cursor: 0, wrong: [] }
}

/** 原生选区按已填缓冲定位；删除保留待纠错身份，重新填入后仍能跳到下一错位。 */
export function clearWordSpellingInputSelection(
    state: WordSpellingInputState,
    start: number,
    end: number,
): WordSpellingInputState {
    if (state.completed || end <= start) return state
    let offset = 0
    const removed = state.letters.flatMap((letter, index) => {
        const previous = offset
        offset += letter.length
        return letter && previous < end && offset > start ? [index] : []
    })
    const first = removed[0]
    if (first === undefined) return state
    return resetEmptyWordSpellingCursor({
        ...state,
        letters: state.letters.map((letter, index) => (removed.includes(index) ? '' : letter)),
        cursor: first,
    })
}

export function typeWordSpellingInput(
    state: WordSpellingInputState,
    value: string,
    placement: 'cursor' | 'selection' = 'cursor',
    alphabet: PracticeAnswerAlphabet = 'latin',
): WordSpellingInputState {
    if (state.completed || state.letters.length === 0) return state
    let current = resetEmptyWordSpellingCursor(state)
    const entered = getWordSpellingLetters(value, alphabet)
    for (const [offset, character] of entered.entries()) {
        const letters = [...current.letters]
        const position = getWordSpellingEntryCursor(current)
        letters[position] = character
        const wrong = current.wrong.filter((item) => item !== position)
        const nextWrong = wrong.find((item) => item > position) ?? wrong[0]
        // 选区覆盖先连续填入；有待纠错位时，编辑已处理位置也继续跳错位。
        const positions = getWordSpellingEditablePositions({ ...current, letters, wrong })
        const cursor =
            placement === 'selection' && offset < entered.length - 1
                ? Math.min(position + 1, letters.length - 1)
                : current.wrong.length > 0 || placement === 'selection'
                  ? (nextWrong ?? Math.min(position + 1, letters.length - 1))
                  : letters.every(Boolean)
                    ? position
                    : (positions.find((item) => item > position) ?? positions[0] ?? position)
        current = { ...current, letters, wrong, cursor }
        if (placement !== 'selection' && letters.every(Boolean) && wrong.length === 0) break
        // 单次粘贴到末位即结束，不把余下内容循环覆盖到前面的字母。
        if (position === letters.length - 1 && offset < entered.length - 1) break
    }
    return current
}

export function deleteWordSpellingInput(state: WordSpellingInputState): WordSpellingInputState {
    if (state.completed || state.letters.length === 0) return state
    if (!state.letters.some(Boolean)) return resetEmptyWordSpellingCursor(state)
    if (!state.letters[state.cursor]) {
        const previous = state.letters.flatMap((letter, index) =>
            letter && index < state.cursor ? [index] : [],
        )
        return {
            ...state,
            cursor: previous.at(-1) ?? state.cursor,
        }
    }
    return resetEmptyWordSpellingCursor({
        ...state,
        letters: state.letters.map((letter, index) => (index === state.cursor ? '' : letter)),
    })
}

/** 空格逐字编辑，与单词、音节和音标的视觉分段无关。 */
export function moveWordSpellingCursor(
    state: WordSpellingInputState,
    layout: WordSpellingLayout,
    delta = 1,
): WordSpellingInputState {
    if (
        state.completed ||
        state.letters.length === 0 ||
        layout.answer.length !== state.letters.length
    )
        return state
    if (!state.letters.some(Boolean)) return resetEmptyWordSpellingCursor(state)
    const positions = getWordSpellingEditablePositions(state)
    const index = positions.indexOf(state.cursor)
    return {
        ...state,
        cursor:
            index < 0
                ? ((delta < 0 ? positions.at(-1) : positions[0]) ?? 0)
                : (positions[(index + delta + positions.length) % positions.length] ?? 0),
    }
}

/** Enter/提交按钮仅校验；未填满或尚有待修改位时保持光标，不增加提交次数。 */
export function submitWordSpellingInput(
    state: WordSpellingInputState,
    layout: WordSpellingLayout,
    ignoreCase: boolean,
): WordSpellingSubmission {
    if (state.completed || state.letters.length === 0) return { state, value: null }
    if (state.letters.some((letter) => !letter) || state.wrong.length) return { state, value: null }
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

/** 空格优先用于编辑；只有填写完毕且没有待修改位时才执行一次提交。 */
export function spaceWordSpellingInput(
    state: WordSpellingInputState,
    layout: WordSpellingLayout,
    ignoreCase: boolean,
): WordSpellingSubmission {
    if (state.letters.some((letter) => !letter) || state.wrong.length)
        return { state: moveWordSpellingCursor(state, layout), value: null }
    return submitWordSpellingInput(state, layout, ignoreCase)
}
