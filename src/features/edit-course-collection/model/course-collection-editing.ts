export interface CourseCollectionEditingState {
    readonly deletedItemIds: readonly string[]
    readonly isEditing: boolean
    readonly selectedItemIds: readonly string[]
}

export function createCourseCollectionEditingState(): CourseCollectionEditingState {
    return {
        deletedItemIds: [],
        isEditing: false,
        selectedItemIds: [],
    }
}

export function enterCourseCollectionEditing(
    state: CourseCollectionEditingState,
): CourseCollectionEditingState {
    return {
        ...state,
        isEditing: true,
        selectedItemIds: [],
    }
}

export function cancelCourseCollectionEditing(
    state: CourseCollectionEditingState,
): CourseCollectionEditingState {
    if (!state.isEditing && state.selectedItemIds.length === 0) return state

    return {
        ...state,
        isEditing: false,
        selectedItemIds: [],
    }
}

export function toggleCourseCollectionItem(
    state: CourseCollectionEditingState,
    itemId: string,
): CourseCollectionEditingState {
    if (!state.isEditing || state.deletedItemIds.includes(itemId)) return state

    const isSelected = state.selectedItemIds.includes(itemId)
    return {
        ...state,
        selectedItemIds: isSelected
            ? state.selectedItemIds.filter((selectedItemId) => selectedItemId !== itemId)
            : [...state.selectedItemIds, itemId],
    }
}

export function deleteSelectedCourseCollectionItems(
    state: CourseCollectionEditingState,
): CourseCollectionEditingState {
    return {
        deletedItemIds: [...new Set([...state.deletedItemIds, ...state.selectedItemIds])],
        isEditing: false,
        selectedItemIds: [],
    }
}
