import assert from 'node:assert/strict'
import test from 'node:test'
import { deleteNotebookTarget, initialNotebookDeletionState } from './notebook-deletion'

test('notebook group deletion records only the selected group', (): void => {
    const nextState = deleteNotebookTarget(initialNotebookDeletionState, {
        groupId: 'group-1',
        kind: 'group',
    })

    assert.deepEqual(nextState.deletedGroupIds, ['group-1'])
    assert.deepEqual(nextState.deletedRecordIds, [])
})

test('notebook record deletion is idempotent', (): void => {
    const firstState = deleteNotebookTarget(initialNotebookDeletionState, {
        kind: 'record',
        recordId: 'record-1',
    })
    const secondState = deleteNotebookTarget(firstState, {
        kind: 'record',
        recordId: 'record-1',
    })

    assert.deepEqual(secondState.deletedGroupIds, [])
    assert.deepEqual(secondState.deletedRecordIds, ['record-1'])
})
