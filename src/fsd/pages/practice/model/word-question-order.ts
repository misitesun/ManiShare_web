import type { PracticeQuestion } from './practice-demo'
import type { WordToolbarOptions } from './word-toolbar-options'

/** 仅在挂载后恢复排序、用户切换或重练时调用，普通渲染不重新洗牌。 */
export function getWordQuestionOrder(
    questions: readonly PracticeQuestion[],
    order: WordToolbarOptions['order'],
    random: () => number = Math.random,
): readonly string[] {
    const ordered = [...questions]
    if (order === 'alphabetical')
        ordered.sort((left, right) =>
            left.english.localeCompare(right.english, 'en', { sensitivity: 'base' }),
        )
    else if (order === 'random') {
        for (let index = ordered.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1))
            const current = ordered[index]
            const replacement = ordered[target]
            if (current === undefined || replacement === undefined) continue
            ordered[index] = replacement
            ordered[target] = current
        }
    }
    return ordered.map((question) => question.id)
}
