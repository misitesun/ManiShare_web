export type FavoriteCategory =
    'all' | 'awakening' | 'bootcamp' | 'stories' | 'vocabulary' | 'wisdom'

export interface CategorizedFavoriteItem {
    readonly category: Exclude<FavoriteCategory, 'all'>
}

export function isFavoriteCategory(value: string): value is FavoriteCategory {
    return (
        value === 'all' ||
        value === 'awakening' ||
        value === 'wisdom' ||
        value === 'stories' ||
        value === 'vocabulary' ||
        value === 'bootcamp'
    )
}

export function filterFavoriteItems<T extends CategorizedFavoriteItem>(
    favoriteItems: readonly T[],
    category: FavoriteCategory,
): readonly T[] {
    if (category === 'all') return favoriteItems
    return favoriteItems.filter((favoriteItem) => favoriteItem.category === category)
}
