import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions } from './practice-demo'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    editSentenceAnswerSlot,
    getSentenceAnswerEditingSnapshot,
    judgeSentenceAnswerValues,
    selectSentenceAnswerSlot,
    spaceSentenceAnswer,
} from './sentence-answer-input'
import {
    getPracticeGameCrystals,
    initialPracticeCrystalSession,
    reducePracticeCrystalSession,
} from './practice-game-crystals'
import type { PracticeCrystalContext } from './practice-game-crystals'
import { typingGameQuestions } from './typing-game-demo'

test('纯指法十条数据混合单词、短语和句子，分段取自目标文本而非tokens', (): void => {
    assert.equal(getDemoQuestions('typing', 'typing'), typingGameQuestions)
    assert.equal(typingGameQuestions.length, 10)
    assert.equal(new Set(typingGameQuestions.map((question) => question.id)).size, 10)
    assert.deepEqual(
        typingGameQuestions.map(
            (question) => createSentenceAnswerLayout(question.english).slots.length,
        ),
        [1, 4, 1, 4, 2, 4, 1, 5, 1, 5],
    )
    for (const question of typingGameQuestions) {
        assert.ok(question.id.startsWith('pure-typing:'))
        assert.equal(question.readingSource, undefined)
        assert.equal(question.translation, '')
        assert.equal(question.phonetic, '')
        assert.deepEqual(question.tokens, [])
    }
    assert.equal(getDemoQuestions('sentence', 'typing').length, 10)
    assert.equal(getDemoQuestions('video', 'typing').length, 10)
    assert.equal(getDemoQuestions('word', 'typing').length, 10)
})

test('单段和多段轮换时重新初始化词段、纠错和键盘快照，填齐后空格统一提交', (): void => {
    const scope: PracticeCrystalContext = {
        family: 'typing',
        mode: 'typing',
        questions: typingGameQuestions,
    }
    let session = initialPracticeCrystalSession
    for (const [index, question] of typingGameQuestions.entries()) {
        assert.equal(session.index, index)
        assert.equal(session.input, '')
        assert.equal(session.phase, 'answering')
        const layout = createSentenceAnswerLayout(question.english)
        let input = createSentenceAnswerState(layout, session.input)
        assert.equal(input.activeIndex, 0)
        assert.equal(input.attempts, 0)
        assert.equal(input.completed, false)
        assert.ok(input.values.every((value) => value === ''))
        assert.ok(input.feedback.every((feedback) => feedback === 'pending'))
        assert.deepEqual(getSentenceAnswerEditingSnapshot(layout, input), {
            slotId: 'word-slot-0',
            target: layout.slots[0]?.target,
            value: '',
            cursor: 0,
        })
        for (const [slotIndex, slot] of layout.slots.entries()) {
            input = selectSentenceAnswerSlot(input, slotIndex)
            input = editSentenceAnswerSlot(input, layout, slot.target)
            assert.equal(getSentenceAnswerEditingSnapshot(layout, input).target, slot.target)
        }
        const result = spaceSentenceAnswer(input, layout, true)
        assert.ok(result.submission)
        assert.equal(result.state.completed, true)
        assert.equal(result.submission.value, question.english)
        session = reducePracticeCrystalSession(
            session,
            {
                type: 'submit-sentence-typing',
                target: question.english,
                values: result.submission.values,
                ignoreCase: true,
            },
            scope,
        )
        assert.equal(session.phase, 'correct')
        assert.equal(getPracticeGameCrystals(session), (index + 1) * 10)
        assert.deepEqual(session.spellingStatistics, { submissions: index + 1, correct: index + 1 })
        if (index < typingGameQuestions.length - 1)
            session = reducePracticeCrystalSession(
                session,
                { type: 'move', delta: 1, total: 10 },
                scope,
            )
    }
    assert.equal(getPracticeGameCrystals(session), 100)
    const finished = reducePracticeCrystalSession(session, { type: 'finish' }, scope)
    assert.equal(finished.finished, true)
    assert.equal(getPracticeGameCrystals(finished), 100)
    assert.equal(
        reducePracticeCrystalSession(finished, { type: 'reset' }, scope),
        initialPracticeCrystalSession,
    )
})

test('混合样例中的撇号和连字符保持可编辑，句末标点不占额外输入段', (): void => {
    const hyphen = createSentenceAnswerLayout('well-known')
    assert.deepEqual(
        hyphen.slots.map((slot) => slot.target),
        ['well-known'],
    )
    const apostrophe = createSentenceAnswerLayout("I don't like cold water.")
    assert.deepEqual(
        apostrophe.slots.map((slot) => slot.target),
        ['I', "don't", 'like', 'cold', 'water'],
    )
    assert.equal(apostrophe.slots.at(-1)?.suffix, '.')
    const capital = createSentenceAnswerLayout('English')
    assert.equal(judgeSentenceAnswerValues(capital, ['english'], false), 'incorrect')
    assert.equal(judgeSentenceAnswerValues(capital, ['english'], true), 'correct')
})
