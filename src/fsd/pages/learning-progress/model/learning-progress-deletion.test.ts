import assert from 'node:assert/strict'
import test from 'node:test'
import { appendDeletedLearningProgressId } from './learning-progress-deletion'

test('learning progress deletion records the selected item once', (): void => {
    const deletedIds = appendDeletedLearningProgressId([], 'course-1')
    const repeatedIds = appendDeletedLearningProgressId(deletedIds, 'course-1')

    assert.deepEqual(deletedIds, ['course-1'])
    assert.deepEqual(repeatedIds, ['course-1'])
})
