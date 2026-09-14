import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sortKnowledgeGapPages } from './sort'
import type { KnowledgeGapItem, KnowledgeGapPage } from './knowledge-gap-items'

function item(id: string, createdAt: string, mistakeCount: number): KnowledgeGapItem {
    return {
        id,
        createdAt,
        mistakeCount,
        english: '',
        chinese: '',
        progress: 0,
        progressMax: 3,
        audioIcon: 'default',
    }
}
const pages: readonly KnowledgeGapPage[] = [
    {
        id: 'first',
        items: [item('old', '2026-08-01 12:00:00', 1), item('new', '2026-09-01 12:00:00', 2)],
    },
    {
        id: 'second',
        items: [item('most', '2026-08-02 12:00:00', 5), item('tie', '2026-09-01 12:00:00', 2)],
    },
]

test('sorts all items before paginating and preserves source data and page sizes', () => {
    const sorted = sortKnowledgeGapPages(pages, 'mistakeCount')
    assert.deepEqual(
        sorted.map((page) => page.items.map((entry) => entry.id)),
        [
            ['most', 'new'],
            ['tie', 'old'],
        ],
    )
    assert.equal(pages[0]?.items[0]?.id, 'old')
})
test('creation date sorts newest first with stable ties', () => {
    assert.deepEqual(
        sortKnowledgeGapPages(pages, 'createdAt').flatMap((page) =>
            page.items.map((entry) => entry.id),
        ),
        ['new', 'tie', 'most', 'old'],
    )
    assert.deepEqual(sortKnowledgeGapPages([], 'createdAt'), [])
})
