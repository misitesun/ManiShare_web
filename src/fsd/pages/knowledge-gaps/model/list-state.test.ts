import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    filterKnowledgeGapPages,
    initialKnowledgeGapListState,
    knowledgeGapListReducer,
} from './list-state'
import { knowledgeGapPages } from './knowledge-gap-items'

test('batch selection supports independent items and clears on exit', () => {
    let state = knowledgeGapListReducer(initialKnowledgeGapListState, {
        type: 'batch',
        checked: true,
    })
    state = knowledgeGapListReducer(state, { type: 'select', id: 'a', checked: true })
    state = knowledgeGapListReducer(state, { type: 'select', id: 'b', checked: true })
    state = knowledgeGapListReducer(state, { type: 'select', id: 'a', checked: true })
    assert.deepEqual(state.selectedIds, ['a', 'b'])
    state = knowledgeGapListReducer(state, { type: 'select', id: 'a', checked: false })
    assert.deepEqual(state.selectedIds, ['b'])
    assert.deepEqual(
        knowledgeGapListReducer(state, { type: 'batch', checked: false }).selectedIds,
        [],
    )
})

test('clear resets selection and blocks stale selection events', () => {
    const state = knowledgeGapListReducer(
        { ...initialKnowledgeGapListState, batch: true, selectedIds: ['a'] },
        { type: 'clear', categoryId: 'sentence-mistakes' },
    )
    assert.deepEqual(state, {
        ...initialKnowledgeGapListState,
        clearedCategoryIds: ['sentence-mistakes'],
    })
    assert.equal(knowledgeGapListReducer(state, { type: 'select', id: 'b', checked: true }), state)
    assert.equal(knowledgeGapListReducer(state, { type: 'batch', checked: true }), state)
})

test('switching categories exits batch mode and clears selection without restoring deleted data', () => {
    const cleared = knowledgeGapListReducer(initialKnowledgeGapListState, {
        type: 'clear',
        categoryId: 'sentence-mistakes',
    })
    const switched = knowledgeGapListReducer(
        { ...cleared, batch: true, selectedIds: ['a'] },
        { type: 'category', categoryId: 'word-mistakes' },
    )
    assert.equal(switched.categoryId, 'word-mistakes')
    assert.equal(switched.batch, false)
    assert.deepEqual(switched.selectedIds, [])
    const restoredCategory = knowledgeGapListReducer(switched, {
        type: 'category',
        categoryId: 'sentence-mistakes',
    })
    assert.deepEqual(restoredCategory.clearedCategoryIds, ['sentence-mistakes'])
    assert.equal(
        knowledgeGapListReducer(restoredCategory, {
            type: 'category',
            categoryId: 'sentence-mistakes',
        }),
        restoredCategory,
    )
})

test('deletion is scoped to its captured category and leaves another category selection intact', () => {
    const selected = { ...initialKnowledgeGapListState, batch: true, selectedIds: ['a'] }
    const cleared = knowledgeGapListReducer(selected, {
        type: 'clear',
        categoryId: 'word-mistakes',
    })
    assert.equal(cleared.categoryId, 'sentence-mistakes')
    assert.deepEqual(cleared.clearedCategoryIds, ['word-mistakes'])
    assert.deepEqual(cleared.selectedIds, ['a'])
    assert.equal(cleared.batch, true)
    assert.deepEqual(
        knowledgeGapListReducer(cleared, { type: 'clear', categoryId: 'word-mistakes' })
            .clearedCategoryIds,
        ['word-mistakes'],
    )
})

test('search filters all pages, ignores case and whitespace, and handles empty results', () => {
    const results = filterKnowledgeGapPages(knowledgeGapPages, '  TWO PENS ')
    assert.ok(results.flatMap((page) => page.items).length >= 2)
    assert.ok(
        results.flatMap((page) => page.items).every((item) => item.english.startsWith('Two pens')),
    )
    assert.deepEqual(filterKnowledgeGapPages(knowledgeGapPages, '不存在的内容'), [])
    assert.deepEqual(filterKnowledgeGapPages([], ''), [])
    assert.equal(
        filterKnowledgeGapPages(knowledgeGapPages, '').flatMap((page) => page.items).length,
        20,
    )
})
