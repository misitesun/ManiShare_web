import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    awakeningChapters,
    hasAwakeningCourseDetail,
    getAwakeningPracticeEntry,
    isAwakeningPracticeSource,
} from './course-detail'

test('only the provided course exposes the static detail preview', () => {
    assert.equal(hasAwakeningCourseDetail('phonetics'), true)
    assert.equal(hasAwakeningCourseDetail('phonetics-continuation'), true)
    assert.equal(hasAwakeningCourseDetail(undefined), false)
    assert.equal(hasAwakeningCourseDetail('unknown'), false)
})

test('chapter preview has stable unique identities and design lock indicators', () => {
    assert.equal(awakeningChapters.length, 13)
    assert.equal(new Set(awakeningChapters.map((chapter) => chapter.id)).size, 13)
    assert.deepEqual(
        awakeningChapters.map((chapter) => chapter.number),
        Array.from({ length: 13 }, (_, index) => index + 1),
    )
    assert.equal(awakeningChapters.filter((chapter) => chapter.locked).length, 11)
    assert.equal(awakeningChapters.find((chapter) => chapter.id === 'chapter-8')?.kind, 7)
    assert.deepEqual(
        awakeningChapters.find((chapter) => chapter.kind === 'picture-word'),
        {
            id: 'chapter-13',
            number: 13,
            kind: 'picture-word',
            locked: true,
        },
    )
})

test('六类游戏先选择模式，其余六类直接进入；两张句子卡共用本地演示', (): void => {
    assert.deepEqual(
        awakeningChapters.map((chapter) => {
            const entry = getAwakeningPracticeEntry(chapter)
            return [chapter.id, entry.demoId, entry.defaultMode, entry.selectorFamily]
        }),
        [
            ['chapter-1', 'sentence-basic', 'listen', 'sentence'],
            ['chapter-2', 'word-basic', 'pronounce', 'word'],
            ['chapter-3', 'audio-basic', 'listen', 'audio'],
            ['chapter-4', 'sentence-basic', 'listen', 'sentence'],
            ['chapter-5', 'video-basic', 'listen', 'video'],
            ['chapter-6', 'typing-basic', 'typing', null],
            ['chapter-7', 'phonetics-basic', 'pronounce', null],
            ['chapter-8', 'picture-reader', 'read', null],
            ['chapter-9', 'guess-basic', 'guess', 'guess'],
            ['chapter-10', 'video-reader', 'read', null],
            ['chapter-11', 'audio-reader', 'read', null],
            ['chapter-12', 'text-reader', 'read', null],
            ['chapter-13', 'picture-basic', 'listen', 'picture'],
        ],
    )
    assert.equal(
        new Set(awakeningChapters.map((chapter) => getAwakeningPracticeEntry(chapter).demoId)).size,
        12,
    )
})

test('VIP锁标只展示，本地示例映射与锁定无关，纯图片与看图学词独立', (): void => {
    for (const chapter of awakeningChapters) {
        assert.deepEqual(
            getAwakeningPracticeEntry({ ...chapter, locked: true }),
            getAwakeningPracticeEntry({ ...chapter, locked: false }),
        )
    }
    const pictureReader = awakeningChapters.find((chapter) => chapter.kind === 7)
    const pictureGame = awakeningChapters.find((chapter) => chapter.kind === 'picture-word')
    assert.ok(pictureReader)
    assert.ok(pictureGame)
    assert.equal(getAwakeningPracticeEntry(pictureReader).selectorFamily, null)
    assert.equal(getAwakeningPracticeEntry(pictureGame).selectorFamily, 'picture')
    assert.notEqual(
        getAwakeningPracticeEntry(pictureReader).demoId,
        getAwakeningPracticeEntry(pictureGame).demoId,
    )
})

test('章节来源必须匹配课程白名单与该章节的本地演示类型', (): void => {
    for (const courseId of ['phonetics', 'phonetics-continuation']) {
        for (const chapter of awakeningChapters) {
            const entry = getAwakeningPracticeEntry(chapter)
            assert.equal(isAwakeningPracticeSource(courseId, chapter.id, entry.demoId), true)
            assert.equal(isAwakeningPracticeSource(courseId, chapter.id, 'unknown'), false)
        }
    }
    assert.equal(isAwakeningPracticeSource('phonetics', 'chapter-1', 'sentence-basic'), true)
    assert.equal(isAwakeningPracticeSource('phonetics', 'chapter-4', 'sentence-basic'), true)
    for (const [courseId, chapterId, demoId] of [
        ['unknown', 'chapter-1', 'sentence-basic'],
        ['phonetics', 'chapter-1', 'word-basic'],
        ['phonetics', 'chapter-2', 'sentence-basic'],
        ['phonetics', 'chapter-0', 'sentence-basic'],
        ['phonetics', 'chapter-14', 'sentence-basic'],
        ['phonetics', 'chapter-01', 'sentence-basic'],
        ['phonetics', '../chapter-1', 'sentence-basic'],
    ]) {
        assert.equal(isAwakeningPracticeSource(courseId, chapterId, demoId), false)
    }
})
