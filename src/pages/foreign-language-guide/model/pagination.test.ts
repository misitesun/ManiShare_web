import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getForeignLanguageCoursePaginationStatus,
    getNextForeignLanguageCoursePageCount,
} from './pagination'

test('foreign-language course pagination advances without exceeding the total', (): void => {
    assert.equal(getNextForeignLanguageCoursePageCount(0, 2), 1)
    assert.equal(getNextForeignLanguageCoursePageCount(1, 2), 2)
    assert.equal(getNextForeignLanguageCoursePageCount(2, 2), 2)
})

test('foreign-language course pagination is exhausted after the final page', (): void => {
    assert.equal(getForeignLanguageCoursePaginationStatus(1, 2), 'idle')
    assert.equal(getForeignLanguageCoursePaginationStatus(2, 2), 'exhausted')
})
