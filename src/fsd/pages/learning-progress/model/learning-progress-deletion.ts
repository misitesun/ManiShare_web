export function appendDeletedLearningProgressId(
    deletedIds: readonly string[],
    itemId: string,
): readonly string[] {
    return deletedIds.includes(itemId) ? deletedIds : [...deletedIds, itemId]
}
