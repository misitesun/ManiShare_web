export interface WordSlotView {
    readonly id: string
    readonly index: number
    readonly target: string
    readonly value: string
    readonly prefix: string
    readonly suffix: string
    /** 原生完整输入中的 UTF-16 偏移；未出现的词槽位于输入末尾。 */
    readonly start: number
    readonly end: number
}

export interface WordSlotSelection {
    readonly value: string
    readonly start: number
    readonly end: number
}

interface InputWord {
    readonly value: string
    readonly start: number
    readonly end: number
}

interface TargetWord {
    readonly target: string
    readonly prefix: string
    readonly suffix: string
}

/** 每个空白字符保留一个分隔位置，连续空格、换行和末尾空槽不会被归一化。 */
function getInputWords(value: string): readonly InputWord[] {
    const words: InputWord[] = []
    let start = 0
    for (let position = 0; position < value.length; position += 1) {
        if (!/\s/u.test(value.charAt(position))) continue
        words.push({ value: value.slice(start, position), start, end: position })
        start = position + 1
    }
    words.push({ value: value.slice(start), start, end: value.length })
    return words
}

/** 只分离词首、词尾标点，词内撇号和连字符仍属于同一可编辑词。 */
function getTargetWord(value: string): TargetWord {
    const prefix = value.match(/^\p{P}+(?=[^\p{P}])/u)?.[0] ?? ''
    const remaining = value.slice(prefix.length)
    const suffix = remaining.match(/\p{P}+$/u)?.[0] ?? ''
    return {
        target: remaining.slice(0, remaining.length - suffix.length),
        prefix,
        suffix,
    }
}

/** 独立标点归入相邻词的静态前后缀，不消耗输入词索引；全标点目标保留一个空词兜底。 */
function getTargetWords(value: string): readonly TargetWord[] {
    const trimmedTarget = value.trim()
    if (trimmedTarget.length === 0) return []
    const words: TargetWord[] = []
    let prefix = ''
    for (const target of trimmedTarget.split(/\s+/u)) {
        const word = getTargetWord(target)
        if (word.target.length > 0) {
            words.push({ ...word, prefix: prefix + word.prefix })
            prefix = ''
            continue
        }
        const previous = words[words.length - 1]
        const punctuation = word.prefix + word.suffix
        if (previous) {
            words[words.length - 1] = { ...previous, suffix: previous.suffix + punctuation }
        } else prefix += punctuation
    }
    return words.length > 0 ? words : [{ target: '', prefix: '', suffix: prefix }]
}

function getDisplayValue(value: string, prefix: string, suffix: string): string {
    const withoutPrefix =
        prefix.length > 0 && value.startsWith(prefix) ? value.slice(prefix.length) : value
    return suffix.length > 0 && withoutPrefix.endsWith(suffix)
        ? withoutPrefix.slice(0, -suffix.length)
        : withoutPrefix
}

/** 由完整原生输入派生词槽展示；不建立第二份输入状态，也不判题或过滤原值。 */
export function getWordSlotView(target: string, value: string): readonly WordSlotView[] {
    const targets = getTargetWords(target)
    const words = getInputWords(value)
    const length = Math.max(targets.length, 1)
    return Array.from({ length }, (_, index): WordSlotView => {
        const word = words[index]
        const targetWord = targets[index] ?? { target: '', prefix: '', suffix: '' }
        const start = word?.start ?? value.length
        // 多余录入仍完整保留在末槽，不能用额外空格扩张题目的词槽数量。
        const end = index === length - 1 ? value.length : (word?.end ?? value.length)
        return {
            id: `word-slot-${index}`,
            index,
            ...targetWord,
            value: getDisplayValue(value.slice(start, end), targetWord.prefix, targetWord.suffix),
            start,
            end,
        }
    })
}

/** 测宽和抄写提示共用参考规则；输入超长时完整展示，不按答案长度截断。 */
export function getWordSlotPlaceholder(target: string, value: string): string {
    return value.toLowerCase() + target.toLowerCase().slice(value.length)
}

/** 显示层只剥离实际出现的目标标点，原生 UTF-16 选区映射回可见词内位置。 */
export function getWordSlotVisibleCaret(value: string, caret: number, slot: WordSlotView): number {
    const nativeWord = value.slice(slot.start, slot.end)
    const prefixLength = slot.prefix && nativeWord.startsWith(slot.prefix) ? slot.prefix.length : 0
    return Math.max(0, Math.min(slot.value.length, caret - slot.start - prefixLength))
}

/** 光标在分隔字符之前属于前词，在其后属于后词；偏移沿用原生 UTF-16 选区。 */
export function getWordSlotIndex(value: string, selectionStart: number | null): number {
    const requested =
        selectionStart === null || Number.isNaN(selectionStart) ? value.length : selectionStart
    const position = Math.max(0, Math.min(value.length, Math.trunc(requested)))
    let index = 0
    for (let offset = 0; offset < position; offset += 1) {
        if (/\s/u.test(value.charAt(offset))) index += 1
    }
    return index
}

/** 点击未出现的后续词只补必要空格；已有文本和分隔字符保持原样，光标置词末。 */
export function getWordSlotSelection(
    value: string,
    index: number,
    target?: string,
): WordSlotSelection {
    const selectedIndex = Number.isFinite(index) ? Math.max(0, Math.trunc(index)) : 0
    if (target !== undefined) {
        const slots = getWordSlotView(target, value)
        const slot = slots[Math.min(selectedIndex, slots.length - 1)]
        if (slot && selectedIndex < getInputWords(value).length)
            return { value, start: slot.end, end: slot.end }
    }
    const words = getInputWords(value)
    const selectedWord = words[selectedIndex]
    if (selectedWord) return { value, start: selectedWord.end, end: selectedWord.end }
    const nextValue = value + ' '.repeat(selectedIndex - words.length + 1)
    return { value: nextValue, start: nextValue.length, end: nextValue.length }
}

/** 只有末槽已录入、光标在全文末尾且没有选区时，空格才是提交意图。 */
export function shouldSubmitWordSlots(
    target: string,
    value: string,
    start: number | null,
    end: number | null,
): boolean {
    const slots = getWordSlotView(target, value)
    return (
        start === value.length &&
        end === start &&
        slots.every((slot) => slot.value.trim().length > 0) &&
        getWordSlotIndex(value, start) >= slots.length - 1
    )
}
