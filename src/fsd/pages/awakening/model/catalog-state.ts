export const awakeningFilters = {
    category: ['全部课程', '分级阅读', '中小学同步', '应试考试', '实用英语', '职场商务'],
    recommendation: [
        '热门推荐',
        '最新上架',
        '免费共享',
        'VIP专享',
        '终身VIP专享',
        '标签1',
        '标签2',
        '标签3',
    ],
    access: ['时间顺序', '免费', '会员共享'],
} as const

export type AwakeningFilterGroup = keyof typeof awakeningFilters

export interface AwakeningCatalogState {
    readonly category: string
    readonly recommendation: string
    readonly access: string
    readonly visibleCount: number
}

export const awakeningPageSize = 8
export const initialAwakeningCatalogState: AwakeningCatalogState = {
    category: '全部课程',
    recommendation: '最新上架',
    access: '免费',
    visibleCount: awakeningPageSize,
}

export type AwakeningCatalogAction =
    | { readonly type: 'select'; readonly group: AwakeningFilterGroup; readonly value: string }
    | { readonly type: 'load'; readonly total: number }

export function awakeningCatalogReducer(
    state: AwakeningCatalogState,
    action: AwakeningCatalogAction,
): AwakeningCatalogState {
    if (action.type === 'load')
        return {
            ...state,
            visibleCount: Math.min(state.visibleCount + awakeningPageSize, action.total),
        }
    if (
        !awakeningFilters[action.group].some((value) => value === action.value) ||
        state[action.group] === action.value
    )
        return state
    return { ...state, [action.group]: action.value, visibleCount: awakeningPageSize }
}
