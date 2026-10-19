export type TypingHand = 'left' | 'right' | 'both'
export type TypingFinger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb'
export type TypingKeyTone =
    'rose' | 'orange' | 'amber' | 'green' | 'cyan' | 'blue' | 'violet' | 'pink' | 'neutral'

export interface TypingKeyboardKey {
    readonly code: string
    readonly base: string | null
    readonly shift: string | null
    readonly label: string
    readonly hand: TypingHand
    readonly finger: TypingFinger
    readonly tone: TypingKeyTone
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
}

interface KeyDefinition {
    readonly code: string
    readonly base: string | null
    readonly shift: string | null
    readonly label: string
    readonly hand: TypingHand
    readonly finger: TypingFinger
    readonly tone: TypingKeyTone
    readonly units: number
}

export const typingKeyboardGeometry = { width: 720, height: 260 } as const

function fingerTone(hand: TypingHand, finger: TypingFinger): TypingKeyTone {
    if (finger === 'thumb') return 'amber'
    if (hand === 'left') {
        if (finger === 'pinky') return 'rose'
        if (finger === 'ring') return 'orange'
        if (finger === 'middle') return 'amber'
        return 'green'
    }
    if (finger === 'index') return 'cyan'
    if (finger === 'middle') return 'blue'
    if (finger === 'ring') return 'violet'
    return 'pink'
}

function characterKey(
    code: string,
    base: string,
    shift: string,
    hand: TypingHand,
    finger: TypingFinger,
    units = 1,
): KeyDefinition {
    return {
        code,
        base,
        shift,
        label: /^[a-z]$/.test(base) ? base.toUpperCase() : base,
        hand,
        finger,
        tone: fingerTone(hand, finger),
        units,
    }
}

function functionKey(code: string, label: string, hand: TypingHand, units: number): KeyDefinition {
    return {
        code,
        base: null,
        shift: null,
        label,
        hand,
        finger: 'pinky',
        tone: 'neutral',
        units,
    }
}

/** ANSI 主键区，15 个标准键单位；所有层共用此几何，不读取视口。 */
const definitions: readonly (readonly KeyDefinition[])[] = [
    [
        characterKey('Backquote', '`', '~', 'left', 'pinky'),
        characterKey('Digit1', '1', '!', 'left', 'pinky'),
        characterKey('Digit2', '2', '@', 'left', 'ring'),
        characterKey('Digit3', '3', '#', 'left', 'middle'),
        characterKey('Digit4', '4', '$', 'left', 'index'),
        characterKey('Digit5', '5', '%', 'left', 'index'),
        characterKey('Digit6', '6', '^', 'right', 'index'),
        characterKey('Digit7', '7', '&', 'right', 'index'),
        characterKey('Digit8', '8', '*', 'right', 'middle'),
        characterKey('Digit9', '9', '(', 'right', 'ring'),
        characterKey('Digit0', '0', ')', 'right', 'pinky'),
        characterKey('Minus', '-', '_', 'right', 'pinky'),
        characterKey('Equal', '=', '+', 'right', 'pinky'),
        functionKey('Backspace', 'Backspace', 'right', 2),
    ],
    [
        functionKey('Tab', 'Tab', 'left', 1.5),
        characterKey('KeyQ', 'q', 'Q', 'left', 'pinky'),
        characterKey('KeyW', 'w', 'W', 'left', 'ring'),
        characterKey('KeyE', 'e', 'E', 'left', 'middle'),
        characterKey('KeyR', 'r', 'R', 'left', 'index'),
        characterKey('KeyT', 't', 'T', 'left', 'index'),
        characterKey('KeyY', 'y', 'Y', 'right', 'index'),
        characterKey('KeyU', 'u', 'U', 'right', 'index'),
        characterKey('KeyI', 'i', 'I', 'right', 'middle'),
        characterKey('KeyO', 'o', 'O', 'right', 'ring'),
        characterKey('KeyP', 'p', 'P', 'right', 'pinky'),
        characterKey('BracketLeft', '[', '{', 'right', 'pinky'),
        characterKey('BracketRight', ']', '}', 'right', 'pinky'),
        characterKey('Backslash', '\\', '|', 'right', 'pinky', 1.5),
    ],
    [
        functionKey('CapsLock', 'CapsLock', 'left', 1.75),
        characterKey('KeyA', 'a', 'A', 'left', 'pinky'),
        characterKey('KeyS', 's', 'S', 'left', 'ring'),
        characterKey('KeyD', 'd', 'D', 'left', 'middle'),
        characterKey('KeyF', 'f', 'F', 'left', 'index'),
        characterKey('KeyG', 'g', 'G', 'left', 'index'),
        characterKey('KeyH', 'h', 'H', 'right', 'index'),
        characterKey('KeyJ', 'j', 'J', 'right', 'index'),
        characterKey('KeyK', 'k', 'K', 'right', 'middle'),
        characterKey('KeyL', 'l', 'L', 'right', 'ring'),
        characterKey('Semicolon', ';', ':', 'right', 'pinky'),
        characterKey('Quote', "'", '"', 'right', 'pinky'),
        functionKey('Enter', 'Enter', 'right', 2.25),
    ],
    [
        functionKey('ShiftLeft', 'Shift', 'left', 2.25),
        characterKey('KeyZ', 'z', 'Z', 'left', 'pinky'),
        characterKey('KeyX', 'x', 'X', 'left', 'ring'),
        characterKey('KeyC', 'c', 'C', 'left', 'middle'),
        characterKey('KeyV', 'v', 'V', 'left', 'index'),
        characterKey('KeyB', 'b', 'B', 'left', 'index'),
        characterKey('KeyN', 'n', 'N', 'right', 'index'),
        characterKey('KeyM', 'm', 'M', 'right', 'index'),
        characterKey('Comma', ',', '<', 'right', 'middle'),
        characterKey('Period', '.', '>', 'right', 'ring'),
        characterKey('Slash', '/', '?', 'right', 'pinky'),
        functionKey('ShiftRight', 'Shift', 'right', 2.75),
    ],
    [
        functionKey('ControlLeft', 'Ctrl', 'left', 1.25),
        functionKey('MetaLeft', 'Win', 'left', 1.25),
        functionKey('AltLeft', 'Alt', 'left', 1.25),
        { ...characterKey('Space', ' ', ' ', 'both', 'thumb', 6.25), label: 'Space' },
        functionKey('AltRight', 'Alt', 'right', 1.25),
        functionKey('MetaRight', 'Win', 'right', 1.25),
        functionKey('ContextMenu', 'Menu', 'right', 1.25),
        functionKey('ControlRight', 'Ctrl', 'right', 1.25),
    ],
]

function placeRow(row: readonly KeyDefinition[], index: number): readonly TypingKeyboardKey[] {
    const unitWidth = 47.2
    let offset = 0
    return row.map((definition) => {
        const key: TypingKeyboardKey = {
            code: definition.code,
            base: definition.base,
            shift: definition.shift,
            label: definition.label,
            hand: definition.hand,
            finger: definition.finger,
            tone: definition.tone,
            x: 8 + offset * unitWidth,
            y: 12 + index * 48,
            width: definition.units * unitWidth - 4,
            height: 44,
        }
        offset += definition.units
        return key
    })
}

export const typingKeyboardRows: readonly (readonly TypingKeyboardKey[])[] =
    definitions.map(placeRow)
export const typingKeyboardKeys: readonly TypingKeyboardKey[] = typingKeyboardRows.flat()

export interface TypingCharacterTarget {
    readonly character: string
    readonly key: TypingKeyboardKey
    /** 指法建议；不代表实体 Shift 已按下，也不推断 CapsLock。 */
    readonly shiftKey: TypingKeyboardKey | null
}

export interface TypingTarget extends TypingCharacterTarget {
    /** Unicode 字符位置；仅用于提示，不参与提交或判题。 */
    readonly index: number
}

export function mapTypingCharacter(character: string): TypingCharacterTarget | null {
    if (Array.from(character).length !== 1) return null
    const key = typingKeyboardKeys.find(
        (item) => item.base === character || item.shift === character,
    )
    if (!key) return null
    const shiftKey =
        character !== key.base
            ? (typingKeyboardKeys.find(
                  (item) => item.code === (key.hand === 'left' ? 'ShiftRight' : 'ShiftLeft'),
              ) ?? null)
            : null
    return { character, key, shiftKey }
}

/** 保留大小写、空格和标点的原值；只提示首个未匹配字符。 */
export function getTypingTarget(
    targetText: string | undefined,
    input: string,
): TypingTarget | null {
    if (targetText === undefined) return null
    const expected = Array.from(targetText)
    const entered = Array.from(input)
    const index = expected.findIndex((character, position) => character !== entered[position])
    const character = expected[index]
    if (index < 0 || character === undefined) return null
    const target = mapTypingCharacter(character)
    return target ? { ...target, index } : null
}

export interface TypingInputChange {
    readonly index: number
    readonly inserted: string
    readonly removed: string
}

/** 以完整输入结果比较，覆盖软键盘、粘贴、删除及中间选择替换。 */
export function getTypingInputChange(previous: string, current: string): TypingInputChange | null {
    if (previous === current) return null
    const before = Array.from(previous)
    const after = Array.from(current)
    let start = 0
    while (start < before.length && start < after.length && before[start] === after[start])
        start += 1
    let endBefore = before.length
    let endAfter = after.length
    while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
        endBefore -= 1
        endAfter -= 1
    }
    return {
        index: start,
        inserted: after.slice(start, endAfter).join(''),
        removed: before.slice(start, endBefore).join(''),
    }
}

export interface TypingInputFeedbackValue {
    readonly kind: 'actual' | 'error' | 'delete'
    readonly character: string | null
    readonly key: TypingKeyboardKey | null
}

export interface TypingInputFeedback extends TypingInputFeedbackValue {
    readonly id: number
}

/** 不创建输入事件、不改变原值；多字符提交提示首个错误或最后插入字符。 */
export function getTypingInputFeedback(
    previous: string,
    current: string,
    targetText: string | undefined,
): TypingInputFeedbackValue | null {
    const change = getTypingInputChange(previous, current)
    if (!change) return null
    const inserted = Array.from(change.inserted)
    if (inserted.length === 0)
        return {
            kind: 'delete',
            character: null,
            key: typingKeyboardKeys.find((key) => key.code === 'Backspace') ?? null,
        }
    const expected = targetText === undefined ? undefined : Array.from(targetText)
    const errorIndex = expected
        ? inserted.findIndex(
              (character, position) => character !== expected[change.index + position],
          )
        : -1
    const character = inserted[errorIndex >= 0 ? errorIndex : inserted.length - 1]
    if (character === undefined) return null
    return {
        kind: errorIndex >= 0 ? 'error' : 'actual',
        character,
        key: mapTypingCharacter(character)?.key ?? null,
    }
}
