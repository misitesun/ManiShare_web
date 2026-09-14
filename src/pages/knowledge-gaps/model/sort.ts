import type { KnowledgeGapPage } from './knowledge-gap-items'

export type KnowledgeGapSort = 'createdAt' | 'mistakeCount'

export function sortKnowledgeGapPages(
    pages: readonly KnowledgeGapPage[],
    sort: KnowledgeGapSort,
): readonly KnowledgeGapPage[] {
    const items = pages
        .flatMap((page) => page.items)
        .sort((a, b) =>
            sort === 'mistakeCount'
                ? b.mistakeCount - a.mistakeCount
                : b.createdAt.localeCompare(a.createdAt),
        )
    let offset = 0
    return pages.map((page) => {
        const sortedPage = { ...page, items: items.slice(offset, offset + page.items.length) }
        offset += page.items.length
        return sortedPage
    })
}
