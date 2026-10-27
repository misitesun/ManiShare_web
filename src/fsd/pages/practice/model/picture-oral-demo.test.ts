import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, resolvePracticeView } from './practice-demo'
import { getPictureListeningList } from './picture-listening-demo'
import { pictureOralQuestions } from './picture-oral-demo'
import { supportsPracticeGameCrystals } from './practice-game-crystals'

test('看图口语十条目标与听力共用单词／短语和音源，其他模式评测身份隔离', (): void => {
    assert.equal(resolvePracticeView('picture-basic', 'oral').kind, 'demo')
    assert.equal(getDemoQuestions('picture', 'oral'), pictureOralQuestions)
    assert.equal(pictureOralQuestions.length, 10)
    assert.equal(new Set(pictureOralQuestions.map((question) => question.id)).size, 10)
    const listening = getDemoQuestions('picture', 'listen')
    const typing = getDemoQuestions('picture', 'typing')
    const translation = getDemoQuestions('picture', 'translate')
    for (const [index, question] of pictureOralQuestions.entries()) {
        assert.equal(question.english, listening[index]?.english)
        assert.equal(question.translation, listening[index]?.translation)
        assert.equal(question.readingSource, listening[index]?.readingSource)
        assert.ok(question.readingSource)
        assert.notEqual(question.id, listening[index]?.id)
        assert.notEqual(question.id, typing[index]?.id)
        assert.notEqual(question.id, translation[index]?.id)
    }
    assert.ok(pictureOralQuestions.some((question) => question.english.includes(' ')))
    const list = getPictureListeningList(pictureOralQuestions, 4)
    assert.equal(list.title, '播放列表（5/10）')
    assert.equal(list.entries[4]?.id, pictureOralQuestions[4]?.id)
    assert.equal(list.entries[4]?.english, 'brush teeth')
    assert.equal(supportsPracticeGameCrystals('picture', 'oral'), false)
})
