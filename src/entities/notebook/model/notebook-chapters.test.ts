import assert from 'node:assert/strict'
import test from 'node:test'
import { findNotebookChapter, getNotebookChapters } from './notebook-chapters'

test('course list contains eight ordered chapters with two note groups each', (): void => {
    const chapters = getNotebookChapters('ocean-vocabulary')
    assert.deepEqual(
        chapters.map((chapter) => chapter.title),
        ['第一章', '第二章', '第三章', '第四章', '第五章', '第六章', '第七章', '第八章'],
    )
    for (const chapter of chapters) {
        assert.equal(chapter.groups.length, 2)
        assert.deepEqual(
            chapter.groups.map((group) => group.records.length),
            [2, 3],
        )
        assert.deepEqual(findNotebookChapter('ocean-vocabulary', chapter.id), chapter)
    }
})

test('chapter lookup rejects unknown course and chapter URL parameters', (): void => {
    assert.deepEqual(getNotebookChapters(undefined), [])
    assert.deepEqual(getNotebookChapters('unknown'), [])
    assert.equal(findNotebookChapter('unknown', 'chapter-1'), undefined)
    for (const id of [undefined, 'chapter-0', 'chapter-9', '__proto__', 'chapter-1/extra']) {
        assert.equal(findNotebookChapter('ocean-vocabulary', id), undefined)
    }
})

test('chapter records have stable identities isolated between chapters and course pages', (): void => {
    const chapters = [
        'ocean-vocabulary',
        'writing-practice',
        'ocean-vocabulary-continuation',
    ].flatMap(getNotebookChapters)
    const recordIds = chapters.flatMap((chapter) =>
        chapter.groups.flatMap((group) => group.records.map((record) => record.id)),
    )
    const groupIds = chapters.flatMap((chapter) => chapter.groups.map((group) => group.id))
    assert.equal(new Set(recordIds).size, recordIds.length)
    assert.equal(new Set(groupIds).size, groupIds.length)
    assert.deepEqual(
        getNotebookChapters('ocean-vocabulary'),
        getNotebookChapters('ocean-vocabulary'),
    )
})
