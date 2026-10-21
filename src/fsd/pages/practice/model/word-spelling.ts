export type WordSpellingJudgment = 'empty' | 'correct' | 'incorrect'

export interface WordSpellingStatistics {
    readonly submissions: number
    readonly correct: number
}

/** 只用于本地单词拼写样例；不扩展为等价答案或正式服务端判题规则。 */
export function judgeWordSpelling(
    value: string,
    target: string,
    ignoreCase: boolean,
): WordSpellingJudgment {
    const answer = value.trim()
    const expected = target.trim()
    if (!answer || !expected) return 'empty'
    return (ignoreCase ? answer.toLowerCase() === expected.toLowerCase() : answer === expected)
        ? 'correct'
        : 'incorrect'
}

export function getWordSpellingAccuracy(statistics: WordSpellingStatistics): number {
    return statistics.submissions === 0
        ? 0
        : Math.round((statistics.correct / statistics.submissions) * 100)
}

/** 当前暂定每次有效答对加10黄晶；复用已去重的本轮统计，不创建账户或持久化状态。 */
export function getWordSpellingCrystals(statistics: WordSpellingStatistics): number {
    return statistics.correct * 10
}
