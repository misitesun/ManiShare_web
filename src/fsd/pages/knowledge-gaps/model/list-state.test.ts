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
        { batch: true, selectedIds: ['a'], cleared: false },
        { type: 'clear' },
    )
    assert.deepEqual(state, { batch: false, selectedIds: [], cleared: true })
    assert.equal(knowledgeGapListReducer(state, { type: 'select', id: 'b', checked: true }), state)
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
