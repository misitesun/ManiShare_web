import assert from 'node:assert/strict'
import test from 'node:test'
import { filterFavoriteItems, isFavoriteCategory } from './favorite-categories'
import type { CategorizedFavoriteItem } from './favorite-categories'

interface TestFavoriteItem extends CategorizedFavoriteItem {
    readonly id: string
}

const favoriteItems: readonly TestFavoriteItem[] = [
    {
        category: 'awakening',
        id: 'course-1',
    },
    {
        category: 'wisdom',
        id: 'course-2',
    },
]

test('favorite category validation accepts only registered tabs', (): void => {
    assert.equal(isFavoriteCategory('all'), true)
    assert.equal(isFavoriteCategory('bootcamp'), true)
    assert.equal(isFavoriteCategory('unknown'), false)
})

test('favorite filtering keeps all items or the selected category', (): void => {
    assert.equal(filterFavoriteItems(favoriteItems, 'all'), favoriteItems)
    assert.deepEqual(filterFavoriteItems(favoriteItems, 'wisdom'), [favoriteItems[1]])
    assert.deepEqual(filterFavoriteItems(favoriteItems, 'stories'), [])
})
