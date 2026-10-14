import assert from 'node:assert/strict'
import test from 'node:test'
import {
    availableChapters,
    initialRoomDraft,
    resolveRoomCreation,
    updateRoomDraft,
} from './room-configuration'
import type { RoomCourseOption } from './room-configuration'

const courses: readonly RoomCourseOption[] = ['one', 'two'].map((id) => ({
    id,
    title: id,
    imageSource: '/cover.png',
    access: 'free',
    chapters: ['s1', 's2', 's3', 'w1'].map((suffix) => ({
        id: `${id}-${suffix}`,
        title: suffix,
        translation: suffix,
        access: 'gold',
        game: suffix === 'w1' ? 'word' : 'sentence',
        cornerSource: '/corner.svg',
        iconSource: '/icon.svg',
    })),
}))

test('默认稿选前两句子章；空课程与无句子章节不能提交', (): void => {
    const draft = initialRoomDraft(courses)
    const creation = resolveRoomCreation(courses, draft)
    assert.ok(creation)
    assert.deepEqual(
        creation.chapters.map(({ id }) => id),
        ['one-s1', 'one-s2'],
    )
    assert.equal(creation.battle, 'human')
    assert.equal(creation.mode, 'translation')
    assert.equal(creation.writing, 'recall')
    assert.equal(creation.difficulty, 'hard')
    assert.equal(creation.background, 'default')
    assert.equal(resolveRoomCreation([], initialRoomDraft([])), null)
    assert.equal(resolveRoomCreation(courses, { ...draft, courseId: 'missing' }), null)
    assert.equal(resolveRoomCreation(courses, { ...draft, chapterIds: [] }), null)
})

test('切换课程和题型清空章节；同项重选保留，非法课程或跨题型章节不写入', (): void => {
    const draft = initialRoomDraft(courses)
    assert.equal(updateRoomDraft(draft, { type: 'course', value: 'one' }, courses), draft)
    assert.equal(updateRoomDraft(draft, { type: 'game', value: 'sentence' }, courses), draft)
    assert.equal(updateRoomDraft(draft, { type: 'course', value: 'missing' }, courses), draft)
    assert.equal(
        updateRoomDraft(draft, { type: 'chapter', value: 'one-w1', checked: true }, courses),
        draft,
    )
    const changed = updateRoomDraft(draft, { type: 'course', value: 'two' }, courses)
    assert.deepEqual(changed.chapterIds, [])
    assert.deepEqual(
        updateRoomDraft(draft, { type: 'game', value: 'word' }, courses).chapterIds,
        [],
    )
    assert.equal(resolveRoomCreation(courses, { ...draft, chapterIds: ['one-s1', 'one-w1'] }), null)
})

test('章节多选幂等，可全部取消；折叠列表之外的选项仍可提交', (): void => {
    const draft = initialRoomDraft(courses)
    const extended = updateRoomDraft(
        draft,
        { type: 'chapter', value: 'one-s3', checked: true },
        courses,
    )
    const twice = updateRoomDraft(
        extended,
        { type: 'chapter', value: 'one-s3', checked: true },
        courses,
    )
    assert.equal(resolveRoomCreation(courses, twice)?.chapters.length, 3)
    let empty = twice
    for (const value of twice.chapterIds)
        empty = updateRoomDraft(empty, { type: 'chapter', value, checked: false }, courses)
    assert.equal(resolveRoomCreation(courses, empty), null)
    assert.equal(availableChapters(courses, empty).length, 3)
})

test('拼块只接受句子；切为单词自动回中译英，拼块不带默写或抄写', (): void => {
    const puzzle = updateRoomDraft(
        initialRoomDraft(courses),
        { type: 'mode', value: 'puzzle' },
        courses,
    )
    assert.equal(resolveRoomCreation(courses, puzzle)?.writing, null)
    const word = updateRoomDraft(puzzle, { type: 'game', value: 'word' }, courses)
    assert.equal(word.mode, 'translation')
    assert.equal(updateRoomDraft(word, { type: 'mode', value: 'puzzle' }, courses), word)
    const selected = updateRoomDraft(
        word,
        { type: 'chapter', value: 'one-w1', checked: true },
        courses,
    )
    assert.equal(resolveRoomCreation(courses, selected)?.game, 'word')
    assert.equal(resolveRoomCreation(courses, { ...selected, mode: 'puzzle' }), null)
})

test('两种书写状态独立；对战、难度、背景切换不清除合法课程章节', (): void => {
    let draft = initialRoomDraft(courses)
    draft = updateRoomDraft(draft, { type: 'writing', mode: 'dictation', value: 'copy' }, courses)
    assert.equal(resolveRoomCreation(courses, draft)?.writing, 'recall')
    draft = updateRoomDraft(draft, { type: 'mode', value: 'dictation' }, courses)
    draft = updateRoomDraft(draft, { type: 'battle', value: 'bot' }, courses)
    draft = updateRoomDraft(draft, { type: 'difficulty', value: 'easy' }, courses)
    draft = updateRoomDraft(draft, { type: 'background', value: 'lightning' }, courses)
    const creation = resolveRoomCreation(courses, draft)
    assert.equal(creation?.writing, 'copy')
    assert.equal(creation?.battle, 'bot')
    assert.equal(creation?.difficulty, 'easy')
    assert.equal(creation?.background, 'lightning')
    assert.equal(creation?.chapters.length, 2)
    assert.equal(initialRoomDraft(courses).dictationWriting, 'recall')
})
