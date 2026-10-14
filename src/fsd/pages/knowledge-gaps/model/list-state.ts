import type { KnowledgeGapPage } from './knowledge-gap-items'
import type { KnowledgeGapCategoryId } from './categories'

export interface KnowledgeGapListState {
    readonly categoryId: KnowledgeGapCategoryId
    readonly batch: boolean
    readonly selectedIds: readonly string[]
    readonly clearedCategoryIds: readonly KnowledgeGapCategoryId[]
}

export type KnowledgeGapListAction =
    | { readonly type: 'batch'; readonly checked: boolean }
    | { readonly type: 'select'; readonly id: string; readonly checked: boolean }
    | { readonly type: 'category'; readonly categoryId: KnowledgeGapCategoryId }
    | { readonly type: 'clear'; readonly categoryId: KnowledgeGapCategoryId }

export const initialKnowledgeGapListState: KnowledgeGapListState = {
    categoryId: 'sentence-mistakes',
    batch: false,
    selectedIds: [],
    clearedCategoryIds: [],
}

export function knowledgeGapListReducer(
    state: KnowledgeGapListState,
    action: KnowledgeGapListAction,
): KnowledgeGapListState {
    if (action.type === 'category') {
        if (action.categoryId === state.categoryId) return state
        return { ...state, categoryId: action.categoryId, batch: false, selectedIds: [] }
    }
    if (action.type === 'clear') {
        return {
            ...state,
            clearedCategoryIds: [...new Set([...state.clearedCategoryIds, action.categoryId])],
            ...(action.categoryId === state.categoryId ? { batch: false, selectedIds: [] } : {}),
        }
    }
    if (state.clearedCategoryIds.includes(state.categoryId)) return state
    if (action.type === 'batch') return { ...state, batch: action.checked, selectedIds: [] }
    if (!state.batch) return state
    return {
        ...state,
        selectedIds: action.checked
            ? [...new Set([...state.selectedIds, action.id])]
            : state.selectedIds.filter((id) => id !== action.id),
    }
}

export function filterKnowledgeGapPages(
    pages: readonly KnowledgeGapPage[],
    query: string,
): readonly KnowledgeGapPage[] {
    const normalized = query.trim().toLocaleLowerCase()
    const items = pages
        .flatMap((page) => page.items)
        .filter((item) =>
            `${item.english} ${item.chinese}`.toLocaleLowerCase().includes(normalized),
        )
    const pageSize = pages[0]?.items.length ?? 10
    if (!pageSize) return []
    return Array.from({ length: Math.ceil(items.length / pageSize) }, (_, index) => ({
        id: `page-${index + 1}`,
        items: items.slice(index * pageSize, (index + 1) * pageSize),
    }))
}
