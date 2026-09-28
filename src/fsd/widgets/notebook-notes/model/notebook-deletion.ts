export interface NotebookDeletionState {
    readonly deletedGroupIds: readonly string[]
    readonly deletedRecordIds: readonly string[]
}

export type NotebookDeleteTarget =
    | { readonly groupId: string; readonly kind: 'group' }
    | { readonly kind: 'record'; readonly recordId: string }

export const initialNotebookDeletionState: NotebookDeletionState = {
    deletedGroupIds: [],
    deletedRecordIds: [],
}

function appendUniqueId(ids: readonly string[], id: string): readonly string[] {
    return ids.includes(id) ? ids : [...ids, id]
}

export function deleteNotebookTarget(
    state: NotebookDeletionState,
    target: NotebookDeleteTarget,
): NotebookDeletionState {
    if (target.kind === 'group') {
        return {
            ...state,
            deletedGroupIds: appendUniqueId(state.deletedGroupIds, target.groupId),
        }
    }

    return {
        ...state,
        deletedRecordIds: appendUniqueId(state.deletedRecordIds, target.recordId),
    }
}
