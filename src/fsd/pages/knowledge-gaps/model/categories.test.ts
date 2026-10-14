import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getKnowledgeGapCategoryPages, isKnowledgeGapCategoryId } from './categories'
import { knowledgeGapPages } from './knowledge-gap-items'

test('only the sentence mistake category owns the existing examples, including completed progress', (): void => {
    assert.equal(getKnowledgeGapCategoryPages('sentence-mistakes', []), knowledgeGapPages)
    assert.equal(
        getKnowledgeGapCategoryPages('sentence-mistakes', []).flatMap((page) => page.items).length,
        20,
    )
    assert.deepEqual(getKnowledgeGapCategoryPages('unfamiliar-sentences', []), [])
    assert.deepEqual(getKnowledgeGapCategoryPages('mastered-sentences', []), [])
    assert.deepEqual(getKnowledgeGapCategoryPages('word-mistakes', []), [])
    assert.deepEqual(getKnowledgeGapCategoryPages('unfamiliar-words', []), [])
    assert.deepEqual(getKnowledgeGapCategoryPages('mastered-words', []), [])
})

test('clearing another category leaves all sentence pages intact; clearing sentences persists across categories', (): void => {
    assert.equal(
        getKnowledgeGapCategoryPages('sentence-mistakes', ['word-mistakes']),
        knowledgeGapPages,
    )
    assert.deepEqual(getKnowledgeGapCategoryPages('sentence-mistakes', ['sentence-mistakes']), [])
    assert.equal(knowledgeGapPages.flatMap((page) => page.items).length, 20)
})

test('category identifiers reject labels and unknown values', (): void => {
    assert.equal(isKnowledgeGapCategoryId('sentence-mistakes'), true)
    assert.equal(isKnowledgeGapCategoryId('mastered-words'), true)
    assert.equal(isKnowledgeGapCategoryId('句子错题本'), false)
    assert.equal(isKnowledgeGapCategoryId('unknown'), false)
    assert.equal(isKnowledgeGapCategoryId(''), false)
})
