import assert from 'node:assert/strict'
import test from 'node:test'
import { createdRoomSummary } from './created-room'
import { demoRoomCourses } from './demo-room-options'

test('模拟目录标识唯一、每种题型有更多章节；创建摘要完整映射且拼块不展示书写', (): void => {
    assert.equal(new Set(demoRoomCourses.map(({ id }) => id)).size, demoRoomCourses.length)
    const course = demoRoomCourses[0]
    assert.ok(course)
    for (const candidate of demoRoomCourses) {
        assert.equal(
            new Set(candidate.chapters.map(({ id }) => id)).size,
            candidate.chapters.length,
        )
        for (const game of ['sentence', 'word'])
            assert.ok(candidate.chapters.filter((chapter) => chapter.game === game).length > 3)
    }
    const chapters = course.chapters.filter(({ game }) => game === 'sentence').slice(0, 2)
    const configuration = {
        course,
        chapters,
        battle: 'bot' as const,
        difficulty: 'easy' as const,
        game: 'sentence' as const,
        mode: 'dictation' as const,
        writing: 'copy' as const,
        background: 'lightning' as const,
    }
    const room = createdRoomSummary(configuration)
    assert.equal(room.configuration, configuration)
    assert.equal(room.imageSource, course.imageSource)
    assert.match(room.chapter, /^已选2章/)
    assert.equal(room.mode, '听写模式')
    assert.equal(room.writing, '抄写')
    assert.equal(
        createdRoomSummary({ ...configuration, mode: 'puzzle', writing: null }).writing,
        '',
    )
})
