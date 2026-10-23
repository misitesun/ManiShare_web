import assert from 'node:assert/strict'
import test from 'node:test'
import {
    resolvePracticeView,
    practiceViewQuery,
    reducePracticeSession,
    initialPracticeSession,
    practiceDemos,
    getDemoQuestions,
} from './practice-demo'
test('演示查询不把未知章节或不支持的模式静默转成首题', (): void => {
    assert.equal(resolvePracticeView(null, null).kind, 'catalog')
    assert.equal(resolvePracticeView('missing', 'listen').kind, 'invalid')
    assert.equal(resolvePracticeView('picture-basic', 'spell').kind, 'invalid')
    assert.equal(resolvePracticeView('word-basic', null).kind, 'demo')
    assert.equal(
        practiceViewQuery('keep=1', 'word-basic', 'spell'),
        '?keep=1&demo=word-basic&mode=spell',
    )
    assert.throws(() => practiceViewQuery('', '../secret', 'spell'))
    for (const demo of practiceDemos) {
        assert.ok(getDemoQuestions(demo.family).length > 0)
        for (const mode of demo.modes) assert.equal(resolvePracticeView(demo.id, mode).kind, 'demo')
    }
})
test('本地输入不自行判题，揭晓独立于正确；移动清理题内状态并保持边界', (): void => {
    const typed = reducePracticeSession(initialPracticeSession, {
        type: 'input',
        value: 'anything',
    })
    assert.equal(typed.phase, 'answering')
    const revealed = reducePracticeSession(typed, { type: 'phase', phase: 'revealed' })
    assert.equal(revealed.phase, 'revealed')
    for (const phase of ['revealed', 'correct'] as const)
        assert.equal(
            reducePracticeSession({ ...typed, phase }, { type: 'toggle-answer' }).phase,
            'answering',
        )
    assert.equal(reducePracticeSession(typed, { type: 'toggle-answer' }).phase, 'revealed')
    assert.equal(
        reducePracticeSession({ ...typed, phase: 'incorrect' }, { type: 'toggle-answer' }).phase,
        'revealed',
    )
    assert.equal(reducePracticeSession(revealed, { type: 'move', delta: -1, total: 2 }), revealed)
    const next = reducePracticeSession(revealed, { type: 'move', delta: 1, total: 2 })
    assert.equal(next.input, '')
    assert.equal(next.phase, 'answering')
    assert.equal(next.index, 1)
    assert.equal(reducePracticeSession(next, { type: 'move', delta: 1, total: 2 }).index, 1)
    const selected = reducePracticeSession(next, { type: 'block', id: 'same-word-1' })
    assert.deepEqual(reducePracticeSession(selected, { type: 'block', id: 'same-word-2' }).blocks, [
        'same-word-1',
        'same-word-2',
    ])
    assert.deepEqual(
        reducePracticeSession(selected, { type: 'block', id: 'same-word-1' }).blocks,
        [],
    )
})

test('音标默认一课十个不同词例，课程目标与显式字母音一致', (): void => {
    const questions = getDemoQuestions('phonetics')
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.deepEqual(
        questions.map((question) => question.english),
        ['cat', 'bat', 'hat', 'man', 'map', 'cap', 'bag', 'fan', 'ham', 'jam'],
    )
    for (const question of questions) {
        assert.equal(question.phonetics?.lesson.targetPhonetic, 'æ')
        assert.equal(
            question.phonetics?.segments.map((segment) => segment.spelling).join(''),
            question.english,
        )
        assert.equal(
            question.phonetics?.segments.map((segment) => segment.ipa).join(''),
            question.phonetic.slice(1, -1),
        )
        assert.ok(question.readingSource)
        assert.ok(question.phonetics?.segments.every((segment) => segment.readingSource))
    }
    assert.deepEqual(questions, getDemoQuestions('phonetics', 'pronounce'))
    const oral = getDemoQuestions('phonetics', 'oral')
    assert.equal(oral.length, 2)
    assert.equal(oral[0]?.english, 'understand')
})

test('完成只标记本轮结束，重练恢复首题输入和题态而不冒充判题结果', (): void => {
    const pending = {
        ...initialPracticeSession,
        index: 1,
        input: 'unfinished answer',
        blocks: ['local-block'],
    }
    const finished = reducePracticeSession(pending, { type: 'finish' })
    assert.equal(finished.finished, true)
    assert.equal(finished.phase, 'answering')
    assert.equal(finished.index, 1)
    assert.deepEqual(reducePracticeSession(finished, { type: 'reset' }), initialPracticeSession)
})

test('句子中译英、自查、指法、口语与拼块复用十条既有句子与音源', (): void => {
    const questions = getDemoQuestions('sentence', 'translate')
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.deepEqual(questions, getDemoQuestions('sentence', 'listen'))
    assert.deepEqual(questions, getDemoQuestions('sentence', 'read'))
    assert.deepEqual(questions, getDemoQuestions('sentence', 'check'))
    assert.deepEqual(questions, getDemoQuestions('sentence', 'typing'))
    assert.deepEqual(questions, getDemoQuestions('sentence', 'oral'))
    for (const question of getDemoQuestions('sentence', 'check'))
        assert.match(question.readingSource ?? '', /^\/practice-demo\/sentence-listening\/.+\.wav$/)
    assert.deepEqual(getDemoQuestions('sentence', 'blocks'), questions)
})

test('音频七模式使用独立十题，正文与只读WAV复用句子，题目和词块身份隔离', (): void => {
    const audio = getDemoQuestions('audio', 'listen')
    const sentence = getDemoQuestions('sentence', 'listen')
    assert.equal(audio.length, 10)
    assert.notEqual(audio, sentence)
    assert.equal(new Set(audio.map((question) => question.id)).size, 10)
    for (const [index, question] of audio.entries()) {
        const original = sentence[index]
        if (!original) throw new Error('Missing sentence fixture')
        assert.notEqual(question, original)
        assert.notEqual(question.id, original.id)
        assert.notEqual(question.tokens, original.tokens)
        assert.equal(question.english, original.english)
        assert.equal(question.readingSource, original.readingSource)
        for (const [tokenIndex, token] of question.tokens.entries()) {
            assert.notEqual(token, original.tokens[tokenIndex])
            assert.notEqual(token.id, original.tokens[tokenIndex]?.id)
            assert.equal(token.text, original.tokens[tokenIndex]?.text)
        }
    }
    for (const mode of ['read', 'check', 'translate', 'blocks', 'typing', 'oral'] as const)
        assert.equal(getDemoQuestions('audio', mode), audio)
})
