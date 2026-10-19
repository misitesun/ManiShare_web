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

test('音标会话与音标主卡使用同一词例，复习题保留独立身份', (): void => {
    const questions = getDemoQuestions('phonetics')
    assert.equal(questions[0]?.english, 'understand')
    assert.equal(questions[0]?.phonetic, '/ʌndəstænd/')
    assert.equal(questions[1]?.english, questions[0]?.english)
    assert.notEqual(questions[1]?.id, questions[0]?.id)
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
