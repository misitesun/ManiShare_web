import assert from 'node:assert/strict'
import test from 'node:test'
import { getNotebookChapterParams, getNotebookCourseParams } from './route-params'
import { findNotebookChapter, getNotebookChapters } from './notebook-chapters'
import { findNotebookCourse } from './notebook-items'
test('every exported notebook route resolves to its owning model', (): void => {
    const courses = getNotebookCourseParams()
    const chapters = getNotebookChapterParams()
    assert.equal(courses.length, 24)
    assert.equal(new Set(courses.map((item) => item.coursePackageId)).size, 24)
    assert.equal(chapters.length, 192)
    for (const { coursePackageId } of courses) {
        assert.ok(findNotebookCourse(coursePackageId))
        assert.equal(getNotebookChapters(coursePackageId).length, 8)
    }
    for (const { coursePackageId, chapterId } of chapters)
        assert.ok(findNotebookChapter(coursePackageId, chapterId))
    assert.equal(findNotebookChapter(courses[0]?.coursePackageId, 'unknown'), undefined)
})
