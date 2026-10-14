import { knowledgeGapPages } from './knowledge-gap-items'
import type { KnowledgeGapPage } from './knowledge-gap-items'

export const knowledgeGapCategories = [
    { id: 'sentence-mistakes', label: '句子错题本', emptyLabel: '暂无句子错题' },
    { id: 'unfamiliar-sentences', label: '不熟悉句子', emptyLabel: '暂无不熟悉句子' },
    { id: 'mastered-sentences', label: '已掌握句子', emptyLabel: '暂无已掌握句子' },
    { id: 'word-mistakes', label: '单词错题本', emptyLabel: '暂无单词错题' },
    { id: 'unfamiliar-words', label: '不熟悉单词', emptyLabel: '暂无不熟悉单词' },
    { id: 'mastered-words', label: '已掌握单词', emptyLabel: '暂无已掌握单词' },
] as const

export type KnowledgeGapCategoryId = (typeof knowledgeGapCategories)[number]['id']

export function isKnowledgeGapCategoryId(value: string): value is KnowledgeGapCategoryId {
    return knowledgeGapCategories.some((category) => category.id === value)
}

export function getKnowledgeGapCategoryPages(
    categoryId: KnowledgeGapCategoryId,
    clearedCategoryIds: readonly KnowledgeGapCategoryId[],
): readonly KnowledgeGapPage[] {
    if (clearedCategoryIds.includes(categoryId)) return []
    return categoryId === 'sentence-mistakes' ? knowledgeGapPages : []
}
