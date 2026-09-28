import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createCourseNoteGroups,
    findNotebookCourse,
    notebookCoursePackagePages,
} from './notebook-items'

test('course lookup rejects missing or unknown route parameters', (): void => {
    assert.equal(findNotebookCourse(undefined), undefined)
    assert.equal(findNotebookCourse('unknown'), undefined)
    assert.equal(findNotebookCourse('__proto__'), undefined)
})

test('every course card including continuation pages has a resolvable detail', (): void => {
    for (const course of notebookCoursePackagePages.flat()) {
        assert.equal(findNotebookCourse(course.id), course)
        const groups = createCourseNoteGroups(course)
        assert.equal(groups.length, course.noteCount)
        assert.equal(new Set(groups.map((group) => group.id)).size, groups.length)
    }
})

test('ocean course matches two design groups and keeps different course records isolated', (): void => {
    const ocean = findNotebookCourse('ocean-vocabulary')
    const writing = findNotebookCourse('writing-practice')
    assert.ok(ocean)
    assert.ok(writing)
    const groups = createCourseNoteGroups(ocean)
    assert.deepEqual(
        groups.map((group) => group.records.length),
        [2, 1],
    )
    const otherIds = new Set(
        createCourseNoteGroups(writing).flatMap((group) =>
            group.records.map((record) => record.id),
        ),
    )
    assert.ok(groups.every((group) => group.records.every((record) => !otherIds.has(record.id))))
})
