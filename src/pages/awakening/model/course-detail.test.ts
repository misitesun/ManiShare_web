import assert from 'node:assert/strict'
import { test } from 'node:test'
import { awakeningChapters, hasAwakeningCourseDetail } from './course-detail'

test('only the provided course exposes the static detail preview', () => {
    assert.equal(hasAwakeningCourseDetail('phonetics'), true)
    assert.equal(hasAwakeningCourseDetail('phonetics-continuation'), true)
    assert.equal(hasAwakeningCourseDetail(undefined), false)
    assert.equal(hasAwakeningCourseDetail('unknown'), false)
})

test('chapter preview has stable unique identities and design lock indicators', () => {
    assert.equal(awakeningChapters.length, 12)
    assert.equal(new Set(awakeningChapters.map((chapter) => chapter.id)).size, 12)
    assert.deepEqual(
        awakeningChapters.map((chapter) => chapter.number),
        Array.from({ length: 12 }, (_, index) => index + 1),
    )
    assert.equal(awakeningChapters.filter((chapter) => chapter.locked).length, 10)
})
