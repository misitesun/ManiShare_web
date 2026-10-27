import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, practiceDemos } from './practice-demo'
import type { PracticeFamily, PracticeMode, PracticeQuestion } from './practice-demo'
import { createSentenceAnswerLayout } from './sentence-answer-input'
import {
    getPracticeGameCrystals,
    initialPracticeCrystalSession,
    reducePracticeCrystalSession,
    supportsPracticeGameCrystals,
} from './practice-game-crystals'
import type { PracticeCrystalContext, PracticeCrystalSession } from './practice-game-crystals'

const rewardModes = ['translate', 'blocks', 'typing'] as const

function context(mode: PracticeMode, family: PracticeFamily = 'video'): PracticeCrystalContext {
    return { family, mode, questions: getDemoQuestions(family, mode) }
}

function questionAt(
    state: PracticeCrystalSession,
    scope: PracticeCrystalContext,
): PracticeQuestion {
    const question = scope.questions[state.index]
    if (!question) throw new Error('Missing video crystal question fixture')
    return question
}

function answerCorrectly(
    state: PracticeCrystalSession,
    scope: PracticeCrystalContext,
): PracticeCrystalSession {
    const question = questionAt(state, scope)
    if (scope.mode === 'blocks') {
        let next = state
        for (const token of question.tokens)
            next = reducePracticeCrystalSession(
                next,
                {
                    type: 'edit-sentence-blocks',
                    edit: { type: 'toggle', id: token.id },
                    tokens: question.tokens,
                },
                scope,
            )
        return next
    }
    return reducePracticeCrystalSession(
        state,
        {
            type: scope.mode === 'typing' ? 'submit-sentence-typing' : 'submit-sentence-answer',
            values: createSentenceAnswerLayout(question.english).slots.map((slot) => slot.target),
            target: question.english,
            ignoreCase: true,
        },
        scope,
    )
}

test('视频三个作答模式、看图中译英／指法与纯指法提供本轮黄晶，初始从0开始', (): void => {
    for (const demo of practiceDemos)
        for (const mode of demo.modes)
            assert.equal(
                supportsPracticeGameCrystals(demo.family, mode),
                (demo.family === 'video' && rewardModes.some((candidate) => candidate === mode)) ||
                    (demo.family === 'typing' && mode === 'typing') ||
                    (demo.family === 'picture' && (mode === 'translate' || mode === 'typing')),
            )
    assert.equal(getPracticeGameCrystals(initialPracticeCrystalSession), 0)
})

test('三种视频模式每题首次答对加10，切题和返回已答题保留分值且不重复奖励', (): void => {
    for (const mode of rewardModes) {
        const scope = context(mode)
        const correct = answerCorrectly(initialPracticeCrystalSession, scope)
        assert.equal(correct.phase, 'correct')
        assert.equal(getPracticeGameCrystals(correct), 10)
        assert.deepEqual(correct.rewardedQuestionIds, [scope.questions[0]?.id])
        assert.equal(answerCorrectly(correct, scope), correct)
        const next = reducePracticeCrystalSession(
            correct,
            { type: 'move', delta: 1, total: scope.questions.length },
            scope,
        )
        assert.equal(getPracticeGameCrystals(next), 10)
        const second = answerCorrectly(next, scope)
        assert.equal(getPracticeGameCrystals(second), 20)
        const previous = reducePracticeCrystalSession(
            second,
            { type: 'move', delta: -1, total: scope.questions.length },
            scope,
        )
        const repeated = answerCorrectly(previous, scope)
        assert.equal(repeated.phase, 'correct')
        assert.equal(getPracticeGameCrystals(repeated), 20)
        const restarted = reducePracticeCrystalSession(repeated, { type: 'restart-answer' }, scope)
        assert.equal(getPracticeGameCrystals(answerCorrectly(restarted, scope)), 20)
    }
})

test('揭晓、面板切换、直接题态变化和完成不发奖励，结束后提交不发奖励', (): void => {
    for (const mode of rewardModes) {
        const scope = context(mode)
        for (const phase of ['revealed', 'correct', 'incorrect'] as const) {
            const next = reducePracticeCrystalSession(
                initialPracticeCrystalSession,
                { type: 'phase', phase },
                scope,
            )
            assert.equal(getPracticeGameCrystals(next), 0)
            if (phase === 'revealed')
                assert.equal(getPracticeGameCrystals(answerCorrectly(next, scope)), 0)
        }
        const revealed = reducePracticeCrystalSession(
            initialPracticeCrystalSession,
            { type: 'toggle-answer' },
            scope,
        )
        assert.equal(getPracticeGameCrystals(revealed), 0)
        const finished = reducePracticeCrystalSession(
            initialPracticeCrystalSession,
            { type: 'finish' },
            scope,
        )
        assert.equal(getPracticeGameCrystals(answerCorrectly(finished, scope)), 0)
    }
})

test('分段空缺不判题，答错不加分，纠正后加10且中译英不更改指法统计', (): void => {
    for (const mode of ['translate', 'typing'] as const) {
        const scope = context(mode)
        const question = questionAt(initialPracticeCrystalSession, scope)
        const values = createSentenceAnswerLayout(question.english).slots.map((slot) => slot.target)
        const submit = {
            type: mode === 'typing' ? 'submit-sentence-typing' : 'submit-sentence-answer',
            target: question.english,
            ignoreCase: true,
        } as const
        const incomplete = reducePracticeCrystalSession(
            initialPracticeCrystalSession,
            { ...submit, values: values.map((value, index) => (index === 0 ? '' : value)) },
            scope,
        )
        assert.equal(incomplete, initialPracticeCrystalSession)
        const wrong = reducePracticeCrystalSession(
            incomplete,
            { ...submit, values: values.map((value, index) => (index === 0 ? 'wrong' : value)) },
            scope,
        )
        assert.equal(wrong.phase, 'incorrect')
        assert.equal(getPracticeGameCrystals(wrong), 0)
        const corrected = answerCorrectly(wrong, scope)
        assert.equal(getPracticeGameCrystals(corrected), 10)
        assert.deepEqual(
            corrected.spellingStatistics,
            mode === 'typing' ? { submissions: 2, correct: 1 } : { submissions: 0, correct: 0 },
        )
    }
})

test('拼块选满自动判题及显式提交均加10，错序修改正确后才奖励', (): void => {
    const scope = context('blocks')
    const question = questionAt(initialPracticeCrystalSession, scope)
    const blocks = question.tokens.map((token) => token.id)
    const wrong = reducePracticeCrystalSession(
        { ...initialPracticeCrystalSession, blocks: [...blocks].reverse() },
        { type: 'submit-sentence-blocks', tokens: question.tokens },
        scope,
    )
    assert.equal(wrong.phase, 'incorrect')
    assert.equal(getPracticeGameCrystals(wrong), 0)
    const cleared = reducePracticeCrystalSession(
        wrong,
        { type: 'edit-sentence-blocks', edit: { type: 'clear' }, tokens: question.tokens },
        scope,
    )
    assert.equal(getPracticeGameCrystals(answerCorrectly(cleared, scope)), 10)
    const submitted = reducePracticeCrystalSession(
        { ...initialPracticeCrystalSession, blocks },
        { type: 'submit-sentence-blocks', tokens: question.tokens },
        scope,
    )
    assert.equal(getPracticeGameCrystals(submitted), 10)
    assert.equal(
        reducePracticeCrystalSession(
            submitted,
            { type: 'submit-sentence-blocks', tokens: question.tokens },
            scope,
        ),
        submitted,
    )
    assert.equal(submitted.spellingStatistics, initialPracticeCrystalSession.spellingStatistics)
})

test('十道视频题本轮满分100，完成保留，重练清零后可重新计分', (): void => {
    for (const mode of rewardModes) {
        const scope = context(mode)
        let state = initialPracticeCrystalSession
        for (let index = 0; index < scope.questions.length; index += 1) {
            state = answerCorrectly(state, scope)
            state = reducePracticeCrystalSession(
                state,
                { type: 'move', delta: 1, total: scope.questions.length },
                scope,
            )
        }
        assert.equal(getPracticeGameCrystals(state), 100)
        const finished = reducePracticeCrystalSession(state, { type: 'finish' }, scope)
        assert.equal(getPracticeGameCrystals(finished), 100)
        assert.equal(
            reducePracticeCrystalSession(finished, { type: 'reset' }, scope),
            initialPracticeCrystalSession,
        )
        assert.equal(
            getPracticeGameCrystals(answerCorrectly(initialPracticeCrystalSession, scope)),
            10,
        )
    }
})

test('非目标来源和模式仍委托原判题，不记录视频奖励', (): void => {
    for (const family of ['word', 'sentence', 'audio'] as const) {
        const scope = context('typing', family)
        const correct = answerCorrectly(initialPracticeCrystalSession, scope)
        assert.equal(correct.phase, 'correct')
        assert.equal(getPracticeGameCrystals(correct), 0)
        assert.deepEqual(correct.spellingStatistics, { submissions: 1, correct: 1 })
    }
    for (const family of ['sentence', 'audio'] as const)
        for (const mode of ['translate', 'blocks'] as const) {
            const scope = context(mode, family)
            const correct = answerCorrectly(initialPracticeCrystalSession, scope)
            assert.equal(correct.phase, 'correct')
            assert.equal(getPracticeGameCrystals(correct), 0)
            assert.equal(
                correct.spellingStatistics,
                initialPracticeCrystalSession.spellingStatistics,
            )
        }
    for (const mode of ['listen', 'check', 'oral'] as const) {
        const scope = context(mode)
        const correct = answerCorrectly(initialPracticeCrystalSession, scope)
        assert.equal(correct.phase, 'correct')
        assert.equal(getPracticeGameCrystals(correct), 0)
    }
})

test('纯指法混合单词和句子按独立题目奖励，返回重答去重、重练清零', (): void => {
    const scope = context('typing', 'typing')
    let state = answerCorrectly(initialPracticeCrystalSession, scope)
    assert.equal(getPracticeGameCrystals(state), 10)
    state = reducePracticeCrystalSession(state, { type: 'move', delta: 1, total: 10 }, scope)
    state = answerCorrectly(state, scope)
    assert.equal(getPracticeGameCrystals(state), 20)
    state = reducePracticeCrystalSession(state, { type: 'move', delta: -1, total: 10 }, scope)
    state = answerCorrectly(state, scope)
    assert.equal(getPracticeGameCrystals(state), 20)
    assert.equal(
        reducePracticeCrystalSession(state, { type: 'reset' }, scope),
        initialPracticeCrystalSession,
    )
})

for (const mode of ['translate', 'typing'] as const) {
    test(`看图${mode}单词和短语均首次答对加10，返题不重复加分，整轮重置清空`, (): void => {
        const scope = context(mode, 'picture')
        const first = answerCorrectly(initialPracticeCrystalSession, scope)
        assert.equal(first.phase, 'correct')
        assert.equal(getPracticeGameCrystals(first), 10)
        const phrase = reducePracticeCrystalSession(
            first,
            { type: 'move', delta: 4, total: scope.questions.length },
            scope,
        )
        assert.equal(questionAt(phrase, scope).english, 'brush teeth')
        const second = answerCorrectly(phrase, scope)
        assert.equal(getPracticeGameCrystals(second), 20)
        const previous = reducePracticeCrystalSession(
            second,
            { type: 'move', delta: -4, total: scope.questions.length },
            scope,
        )
        assert.equal(getPracticeGameCrystals(answerCorrectly(previous, scope)), 20)
        assert.deepEqual(
            second.spellingStatistics,
            mode === 'typing' ? { submissions: 2, correct: 2 } : { submissions: 0, correct: 0 },
        )
        assert.equal(
            getPracticeGameCrystals(reducePracticeCrystalSession(second, { type: 'reset' }, scope)),
            0,
        )
        const revealed = reducePracticeCrystalSession(
            initialPracticeCrystalSession,
            { type: 'phase', phase: 'revealed' },
            scope,
        )
        assert.equal(getPracticeGameCrystals(answerCorrectly(revealed, scope)), 0)
    })
}
