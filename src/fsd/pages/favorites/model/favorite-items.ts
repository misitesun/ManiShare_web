import { coursePackages } from '../../../entities/course-package'
import type { CategorizedFavoriteItem } from './favorite-categories'

export type FavoriteCategoryTone = 'awakening' | 'blue' | 'cyan' | 'magenta' | 'stories' | 'wisdom'

export interface FavoriteItem extends CategorizedFavoriteItem {
    readonly categoryLabel: string
    readonly categoryTone: FavoriteCategoryTone
    readonly id: string
    readonly imageSource: string
    readonly noteCount: number
    readonly title: string
}

const designFavoriteItems: readonly FavoriteItem[] = [
    {
        ...coursePackages['english-learning-map'],
        category: 'awakening',
        categoryLabel: '言灵觉醒-18章节',
        categoryTone: 'awakening',
        noteCount: 4,
    },
    {
        ...coursePackages['ocean-vocabulary'],
        category: 'wisdom',
        categoryLabel: '智慧殿堂-12章节',
        categoryTone: 'wisdom',
        noteCount: 2,
    },
    {
        ...coursePackages['writing-practice'],
        category: 'wisdom',
        categoryLabel: '智慧殿堂-12章节',
        categoryTone: 'wisdom',
        noteCount: 6,
    },
    {
        ...coursePackages['listening-practice'],
        category: 'stories',
        categoryLabel: '漫说故事-20章节',
        categoryTone: 'stories',
        noteCount: 4,
    },
    {
        ...coursePackages['daily-english'],
        category: 'stories',
        categoryLabel: '漫说故事-20章节',
        categoryTone: 'cyan',
        noteCount: 9,
    },
    {
        ...coursePackages['time-expression'],
        category: 'vocabulary',
        categoryLabel: '秒记万词-16章节',
        categoryTone: 'blue',
        noteCount: 6,
    },
    {
        ...coursePackages['vocabulary-association'],
        category: 'bootcamp',
        categoryLabel: '入门特训-22章节',
        categoryTone: 'magenta',
        noteCount: 2,
    },
    {
        ...coursePackages['speaking-practice'],
        category: 'awakening',
        categoryLabel: '言灵觉醒-18章节',
        categoryTone: 'awakening',
        noteCount: 5,
    },
]

function createContinuationFavorite(favoriteItem: FavoriteItem): FavoriteItem {
    return { ...favoriteItem, id: `${favoriteItem.id}-favorite-continuation` }
}

export const favoriteItemPages: readonly (readonly FavoriteItem[])[] = [
    designFavoriteItems,
    designFavoriteItems.map(createContinuationFavorite),
]
