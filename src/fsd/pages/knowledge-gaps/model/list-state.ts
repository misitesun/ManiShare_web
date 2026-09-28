import type { KnowledgeGapPage } from './knowledge-gap-items'

export interface KnowledgeGapListState {
    readonly batch: boolean
    readonly selectedIds: readonly string[]
    readonly cleared: boolean
}

export type KnowledgeGapListAction =
    | { readonly type: 'batch'; readonly checked: boolean }
    | { readonly type: 'select'; readonly id: string; readonly checked: boolean }
    | { readonly type: 'clear' }

export const initialKnowledgeGapListState: KnowledgeGapListState = {
    batch: false,
    selectedIds: [],
    cleared: false,
}

export function knowledgeGapListReducer(
    state: KnowledgeGapListState,
    action: KnowledgeGapListAction,
): KnowledgeGapListState {
    if (action.type === 'clear') return { batch: false, selectedIds: [], cleared: true }
    if (action.type === 'batch') return { ...state, batch: action.checked, selectedIds: [] }
    if (!state.batch || state.cleared) return state
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
