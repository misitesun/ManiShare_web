import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions } from './practice-demo'
import { getPictureListeningList, pictureListeningQuestions } from './picture-listening-demo'

test('看图听力按原稿提供十个独立访问，重复词条共用对应词音源', (): void => {
    const questions = getDemoQuestions('picture', 'listen')
    assert.equal(questions, pictureListeningQuestions)
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.deepEqual(
        questions.map((question) => question.english),
        [
            'books',
            'tap',
            'wash',
            'dry',
            'brush teeth',
            'books',
            'brush teeth',
            'dry',
            'wash',
            'books',
        ],
    )
    for (const question of questions) {
        assert.ok(question.translation && question.phonetic)
        assert.deepEqual(question.tokens, [])
        assert.equal(
            question.readingSource,
            `/practice-demo/picture-listening/${question.english.replaceAll(' ', '-')}.wav`,
        )
    }
    assert.equal(questions[0]?.readingSource, questions[5]?.readingSource)
    assert.notEqual(questions[0]?.id, questions[5]?.id)
    assert.equal(getDemoQuestions('picture', 'oral')[0]?.english, questions[0]?.english)
})

test('播放列表按题号映射当前题，不为看图条目伪造视频时间戳', (): void => {
    const list = getPictureListeningList(pictureListeningQuestions, 3)
    assert.equal(list.title, '播放列表（4/10）')
    assert.deepEqual(
        list.entries.map((entry) => entry.marker),
        ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    )
    assert.deepEqual(
        list.entries.map((entry) => entry.id),
        pictureListeningQuestions.map((question) => question.id),
    )
    assert.equal(list.entries[3]?.english, 'dry')
    assert.equal(getPictureListeningList([], 0).title, '播放列表（0/0）')
})
