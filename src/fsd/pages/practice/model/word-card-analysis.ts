export interface WordExamplePart {
    readonly text: string
    readonly highlighted: boolean
}

/** 页面内部的例句展示模型；标记由数据显式提供，不推断词性或调用补全服务。 */
export interface WordCardExample {
    readonly id: string
    readonly english: readonly WordExamplePart[]
    readonly translation: readonly WordExamplePart[]
}

export interface WordCardAnalysisState {
    readonly questionId: string | null
    readonly open: boolean
}

type WordCardAnalysisAction =
    | { readonly type: 'select'; readonly questionId: string | null }
    | { readonly type: 'open'; readonly questionId: string }
    | { readonly type: 'close' }

export function wordCardAnalysisReducer(
    state: WordCardAnalysisState,
    action: WordCardAnalysisAction,
): WordCardAnalysisState {
    if (action.type === 'select')
        return state.questionId === action.questionId
            ? state
            : { questionId: action.questionId, open: false }
    if (action.type === 'close') return state.open ? { ...state, open: false } : state
    // 只有当前题可以翻面，失效的旧卡事件不能打开另一题。
    return action.questionId === state.questionId ? { ...state, open: true } : state
}

/** 仅为本地示例把 [[重点词]] 转为文本片段；渲染始终使用 React 文本节点。 */
export function parseDemoWordExample(text: string): readonly WordExamplePart[] {
    return text
        .split(/(\[\[[^\[\]]+\]\])/u)
        .filter(Boolean)
        .map((part) => {
            const highlighted = part.startsWith('[[') && part.endsWith(']]')
            return { text: highlighted ? part.slice(2, -2) : part, highlighted }
        })
}
