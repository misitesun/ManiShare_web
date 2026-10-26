import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import { getGuessAnswerGeometry, getGuessReadingScrollTop } from './guess-word'
import { getDraftPanelGeometry } from './practice-draft'
import type { DraftViewport } from './practice-draft'
import { resolvePracticePrimary } from './practice-primary'
import { canShowQuickOral, hasPracticeAnswerInput } from './practice-visibility'
import { getDemoWordPhonetics } from './word-phonetics-demo'
import { getPracticeReference } from './reference-layout'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    editSentenceAnswerSlot,
    spaceSentenceAnswer,
} from './sentence-answer-input'
import { createAdditionalToolbarOptions } from './additional-toolbar-options'
import { supportsPracticeGameCrystals } from './practice-game-crystals'

test('猜词十题拥有独立身份、中文语境、显式音标及对应整词音源', (): void => {
    const questions = getDemoQuestions('guess', 'guess')
    assert.equal(questions.length, 10)
    assert.equal(getDemoQuestions('guess').length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.equal(new Set(questions.map((question) => question.english)).size, 10)
    assert.equal(questions[0]?.english, 'hand')
    assert.equal(questions[0]?.guess?.before, '他有一双肥嘟嘟的')
    for (const question of questions) {
        assert.ok(question.guess?.before)
        assert.ok(question.guess?.scene)
        assert.ok(question.guess?.image)
        assert.ok(question.readingSource && existsSync(`public${question.readingSource}`))
        assert.deepEqual(
            question.wordPhonetics,
            getDemoWordPhonetics(question.english, question.phonetic),
        )
    }
    assert.equal(getDemoQuestions('guess', 'read'), questions)
    assert.equal(getDemoQuestions('guess', 'spell'), questions)
    assert.equal(getDemoQuestions('word', 'pronounce').length, 10)
})

test('阅读切词仅滚动不可见行，已可见行与空列表不跳动，首尾目标保持边界', (): void => {
    const bounds = {
        scrollTop: 300,
        scrollHeight: 1000,
        viewportTop: 100,
        viewportHeight: 200,
        rowTop: 130,
        rowBottom: 204,
    }
    assert.equal(getGuessReadingScrollTop(bounds), 300)
    assert.equal(getGuessReadingScrollTop({ ...bounds, rowTop: 80, rowBottom: 154 }), 280)
    assert.equal(getGuessReadingScrollTop({ ...bounds, rowTop: 280, rowBottom: 354 }), 354)
    assert.equal(getGuessReadingScrollTop({ ...bounds, rowTop: -900, rowBottom: -826 }), 0)
    assert.equal(getGuessReadingScrollTop({ ...bounds, rowTop: 2000, rowBottom: 2074 }), 800)
    assert.equal(getGuessReadingScrollTop({ ...bounds, scrollHeight: 0 }), 0)
})

test('答案固定复用草稿默认位置，窄屏和短屏保持边界及底栏留白', (): void => {
    assert.deepEqual(getGuessAnswerGeometry({ width: 1920, height: 1080 }), {
        x: 1515.19,
        y: 198,
        width: 360,
        height: 394,
    })
    const viewports: readonly DraftViewport[] = [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1280, height: 600 },
        { width: 390, height: 600, offsetX: 20, offsetY: 50 },
        { width: 320, height: 240 },
    ]
    for (const viewport of viewports) {
        const box = getGuessAnswerGeometry(viewport)
        const draft = getDraftPanelGeometry(viewport)
        const left = viewport.offsetX ?? 0
        const top = viewport.offsetY ?? 0
        assert.equal(box.x, draft.x)
        assert.equal(box.y, draft.y)
        assert.ok(box.x >= left + 12 && box.x + box.width <= left + viewport.width - 12)
        assert.ok(box.y >= top + 12 && box.y + box.height <= top + viewport.height - 116)
    }
})

test('猜词揭晓只由答案入口控制，主动作始终切题，不进入输入或快捷口语', (): void => {
    assert.equal(hasPracticeAnswerInput('guess'), false)
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        assert.equal(
            resolvePracticePrimary({
                family: 'guess',
                mode: 'guess',
                phase,
                oralStage: 'idle',
                quickOral: false,
            }),
            'next',
        )
        assert.equal(canShowQuickOral('guess', 'guess', phase, true, true), false)
        assert.equal(canShowQuickOral('guess', 'read', phase, true, true), false)
        assert.equal(canShowQuickOral('guess', 'spell', phase, true, true), false)
    }
    assert.equal(hasPracticeAnswerInput('spell'), true)
})

test('打词只提交目标单词，中文前后文不进入判题，错误可改且不新增黄晶奖励', (): void => {
    for (const question of getDemoQuestions('guess', 'spell')) {
        const layout = createSentenceAnswerLayout(question.english)
        assert.equal(layout.slots.length, 1)
        assert.ok(question.guess?.before)
        const empty = createSentenceAnswerState(layout)
        assert.equal(spaceSentenceAnswer(empty, layout, true).submission, null)
        const wrong = spaceSentenceAnswer(
            editSentenceAnswerSlot(empty, layout, 'wrong'),
            layout,
            true,
        )
        assert.equal(wrong.state.completed, false)
        assert.equal(wrong.state.feedback[0], 'incorrect')
        const corrected = spaceSentenceAnswer(
            editSentenceAnswerSlot(wrong.state, layout, question.english),
            layout,
            true,
        )
        assert.deepEqual(corrected.submission?.values, [question.english])
        const answer = reducePracticeSession(initialPracticeSession, {
            type: 'submit-sentence-answer',
            values: corrected.submission?.values ?? [],
            target: question.english,
            ignoreCase: true,
        })
        assert.equal(answer.phase, 'correct')
        assert.equal(answer.input, question.english)
        assert.deepEqual(answer.spellingStatistics, initialPracticeSession.spellingStatistics)
        assert.equal(spaceSentenceAnswer(corrected.state, layout, true).submission, null)
        const next = reducePracticeSession(answer, { type: 'move', delta: 1, total: 10 })
        assert.equal(next.phase, 'answering')
        assert.equal(next.input, '')
    }
    assert.equal(supportsPracticeGameCrystals('guess', 'spell'), false)
    assert.equal(createAdditionalToolbarOptions('guess', 'spell').copy, true)
    const middle = getDemoQuestions('guess', 'spell').find(
        (question) => question.english === 'green',
    )
    assert.equal(middle?.guess?.after, '的书包')
})

test('打词图保留1734原稿基准，键盘前留白同步句子指法，其他布局不改变', (): void => {
    const reference = getPracticeReference('guess', 'spell', 'answering')
    const typing = getPracticeReference('word', 'typing', 'answering')
    assert.equal(reference.node, '1734:10225')
    assert.equal(reference.top + 75, 205)
    assert.equal(reference.mediaWidth, 430)
    assert.equal(reference.mediaHeight, 240)
    assert.equal(reference.keyboardGap, typing.translationGap + 34 + typing.keyboardGap)
    assert.equal(reference.keyboardGap, 70)
    assert.equal(
        reference.top + 75 + reference.mediaHeight + reference.textGap + 48 + reference.keyboardGap,
        608,
    )
    assert.equal(reference.keyboardWidth, 848)
    assert.equal(reference.keyboardHeight, 315)
    assert.equal(getPracticeReference('word', 'typing', 'answering').top, 81)
})
