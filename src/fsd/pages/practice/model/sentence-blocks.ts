import type { PracticeQuestion, PracticeToken } from './practice-demo'

export type SentenceBlockEdit =
    | { readonly type: 'toggle'; readonly id: string }
    | { readonly type: 'undo' }
    | { readonly type: 'clear' }

export type SentenceBlocksJudgment = 'empty' | 'correct' | 'incorrect'

/** 选择按唯一词块ID保存；重复词仍可分别选择与撤回。 */
export function editSentenceBlocks(
    tokens: readonly PracticeToken[],
    selected: readonly string[],
    edit: SentenceBlockEdit,
): readonly string[] {
    if (edit.type === 'clear') return selected.length === 0 ? selected : []
    if (edit.type === 'undo') return selected.length === 0 ? selected : selected.slice(0, -1)
    if (!tokens.some((token) => token.id === edit.id)) return selected
    return selected.includes(edit.id)
        ? selected.filter((id) => id !== edit.id)
        : [...selected, edit.id]
}

/** 只判断实际词序，不把相同拼写的两次出现当成不同答案。 */
export function judgeSentenceBlocks(
    tokens: readonly PracticeToken[],
    selected: readonly string[],
): SentenceBlocksJudgment {
    if (selected.length === 0) return 'empty'
    if (
        tokens.length === 0 ||
        selected.length !== tokens.length ||
        new Set(selected).size !== selected.length
    )
        return 'incorrect'
    return selected.every((id, index) => {
        const token = tokens.find((item) => item.id === id)
        return token !== undefined && token.text === tokens[index]?.text
    })
        ? 'correct'
        : 'incorrect'
}

export function usesReadingBlockReference(question: PracticeQuestion): boolean {
    return question.english === 'we read books together'
}

function candidateRank(value: string): number {
    let rank = 0
    for (const character of value) rank = (rank * 31 + (character.codePointAt(0) ?? 0)) >>> 0
    return rank
}

/** 首题沿设计稿；其余题使用稳定乱序，预渲染与水合不产生随机差异。 */
export function getSentenceBlockCandidates(question: PracticeQuestion): readonly PracticeToken[] {
    const referenceOrder = ['read', 'together', 'we', 'books']
    const candidates = question.tokens.slice().sort((left, right): number => {
        if (usesReadingBlockReference(question))
            return referenceOrder.indexOf(left.text) - referenceOrder.indexOf(right.text)
        const difference =
            candidateRank(`${question.id}:${left.id}`) - candidateRank(`${question.id}:${right.id}`)
        return difference || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
    })
    if (
        candidates.length > 1 &&
        candidates.every((token, index) => token.id === question.tokens[index]?.id)
    ) {
        const first = candidates.shift()
        if (first) candidates.push(first)
    }
    return candidates
}
