import assert from 'node:assert/strict'
import test from 'node:test'
import {
    cancelCourseCollectionEditing,
    createCourseCollectionEditingState,
    deleteSelectedCourseCollectionItems,
    enterCourseCollectionEditing,
    toggleCourseCollectionItem,
} from './course-collection-editing'

test('course collection starts in browsing mode without selected items', (): void => {
    assert.deepEqual(createCourseCollectionEditingState(), {
        deletedItemIds: [],
        isEditing: false,
        selectedItemIds: [],
    })
})

test('editing mode supports selecting and deselecting multiple items', (): void => {
    const editingState = enterCourseCollectionEditing(createCourseCollectionEditingState())
    const firstSelection = toggleCourseCollectionItem(editingState, 'course-1')
    const secondSelection = toggleCourseCollectionItem(firstSelection, 'course-2')

    assert.deepEqual(secondSelection.selectedItemIds, ['course-1', 'course-2'])
    assert.deepEqual(toggleCourseCollectionItem(secondSelection, 'course-1').selectedItemIds, [
        'course-2',
    ])
})

test('items cannot be selected outside editing mode or after deletion', (): void => {
    const browsingState = createCourseCollectionEditingState()
    const deletedState = {
        deletedItemIds: ['course-1'],
        isEditing: true,
        selectedItemIds: [],
    }

    assert.equal(toggleCourseCollectionItem(browsingState, 'course-1'), browsingState)
    assert.equal(toggleCourseCollectionItem(deletedState, 'course-1'), deletedState)
})

test('canceling editing clears selection while preserving deleted items', (): void => {
    const state = {
        deletedItemIds: ['course-0'],
        isEditing: true,
        selectedItemIds: ['course-1'],
    }

    assert.deepEqual(cancelCourseCollectionEditing(state), {
        deletedItemIds: ['course-0'],
        isEditing: false,
        selectedItemIds: [],
    })
})

test('deleting selected items is idempotent and returns to browsing mode', (): void => {
    const state = {
        deletedItemIds: ['course-1'],
        isEditing: true,
        selectedItemIds: ['course-1', 'course-2'],
    }

    assert.deepEqual(deleteSelectedCourseCollectionItems(state), {
        deletedItemIds: ['course-1', 'course-2'],
        isEditing: false,
        selectedItemIds: [],
    })
})
