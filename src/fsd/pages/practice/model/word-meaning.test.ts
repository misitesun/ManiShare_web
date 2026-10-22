import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import {
    getWordMeaningSentence,
    getWordMeaningTranslation,
    initialWordMeaningState,
    reduceWordMeaningState,
    resolveWordMeaningAction,
} from './word-meaning'
import { judgeWordSpelling } from './word-spelling'
import { resolvePracticePrimary } from './practice-primary'
import { canShowQuickOral, hasPracticeAnswerInput } from './practice-visibility'
import { getPracticeFooter } from './practice-footer'
import { resolvePracticeShortcut } from './practice-shortcuts'
import type { PracticeShortcutContext } from './practice-shortcuts'
import {
    createWordSpellingInputState,
    createWordSpellingLayout,
    getPracticeAnswerKeyAction,
    spaceWordSpellingInput,
    submitWordSpellingInput,
    typeWordSpellingInput,
} from './word-spelling-input'

test('句中练义有十个独立目标及显式双语片段，保留原三个模式题库', (): void => {
    const questions = getDemoQuestions('word', 'meaning')
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map((question) => question.id)).size, 10)
    assert.equal(new Set(questions.map((question) => question.english)).size, 10)
    for (const question of questions) {
        const content = question.wordMeaning
        assert.ok(content)
        assert.ok(question.phonetic)
        assert.ok(question.translation)
        assert.ok(content.imageAlt)
        assert.equal(content.illustration, 'park-woman')
        assert.ok(getWordMeaningSentence(question.english, content).includes(question.english))
        assert.ok(getWordMeaningTranslation(content).includes(content.translationTarget))
        assert.equal(judgeWordSpelling(question.english, question.english, true), 'correct')
    }
    const first = questions[0]
    assert.ok(first?.wordMeaning)
    assert.equal(
        getWordMeaningSentence(first.english, first.wordMeaning),
        'The woman walks in the park',
    )
    assert.equal(getWordMeaningTranslation(first.wordMeaning), '这位女人在公园散步')
    assert.equal(getDemoQuestions('word', 'pronounce').length, 10)
    assert.equal(getDemoQuestions('word', 'spell').length, 12)
    assert.equal(getDemoQuestions('word', 'dictate').length, 12)
})

test('辨义首次操作显示中文，后续推进；揭示中文不改变原作答题态', (): void => {
    const session = Object.freeze({ ...initialPracticeSession })
    const context = reduceWordMeaningState(initialWordMeaningState, {
        type: 'variant',
        value: 'context',
    })
    assert.equal(resolveWordMeaningAction(context, session.phase), 'reveal-translation')
    const revealed = reduceWordMeaningState(context, { type: 'reveal-translation' })
    assert.equal(revealed.translationVisible, true)
    assert.equal(resolveWordMeaningAction(revealed, session.phase), 'next')
    assert.equal(reduceWordMeaningState(revealed, { type: 'reveal-translation' }), revealed)
    assert.equal(session.phase, 'answering')
    assert.deepEqual(session.spellingStatistics, { submissions: 0, correct: 0 })
})

test('切题和重置隐藏译文并保留玩法，切换玩法清除译文且同项不重复清理', (): void => {
    const revealed = reduceWordMeaningState(
        { variant: 'context', translationVisible: false },
        { type: 'reveal-translation' },
    )
    assert.deepEqual(reduceWordMeaningState(revealed, { type: 'question' }), {
        variant: 'context',
        translationVisible: false,
    })
    const fill = reduceWordMeaningState(revealed, { type: 'variant', value: 'fill' })
    assert.deepEqual(fill, initialWordMeaningState)
    assert.equal(reduceWordMeaningState(fill, { type: 'variant', value: 'fill' }), fill)
    assert.equal(reduceWordMeaningState(fill, { type: 'reveal-translation' }), fill)
    for (const phase of ['answering', 'incorrect'] as const)
        assert.equal(resolveWordMeaningAction(fill, phase), 'answer')
    for (const phase of ['revealed', 'correct'] as const)
        assert.equal(resolveWordMeaningAction(fill, phase), 'next')
})

test('切玩法只清理当前作答，保留当前题号与其他模式统计', (): void => {
    const statistics = { submissions: 3, correct: 1 }
    const current = {
        ...initialPracticeSession,
        index: 6,
        phase: 'incorrect' as const,
        input: 'bad',
        blocks: ['old'],
        spellingStatistics: statistics,
    }
    const next = reducePracticeSession(current, { type: 'restart-answer' })
    assert.equal(next.index, 6)
    assert.equal(next.input, '')
    assert.equal(next.phase, 'answering')
    assert.deepEqual(next.blocks, [])
    assert.equal(next.spellingStatistics, statistics)
    const wrong = reducePracticeSession(next, {
        type: 'submit-answer',
        value: 'zzzzz',
        target: 'woman',
        ignoreCase: true,
    })
    assert.equal(wrong.phase, 'incorrect')
    const correct = reducePracticeSession(wrong, {
        type: 'submit-answer',
        value: 'woman',
        target: 'woman',
        ignoreCase: true,
    })
    assert.equal(correct.phase, 'correct')
    assert.equal(correct.spellingStatistics, statistics)
    assert.equal(
        reducePracticeSession(correct, {
            type: 'submit-answer',
            value: 'woman',
            target: 'woman',
            ignoreCase: true,
        }),
        correct,
    )
})

test('填空复用默写：全部输错后修复两字、拦截左右键，再修完才重新校验', (): void => {
    const layout = createWordSpellingLayout('woman', 'syllables')
    const typed = typeWordSpellingInput(createWordSpellingInputState(layout, ''), 'zzzzz')
    const wrong = submitWordSpellingInput(typed, layout, true).state
    assert.deepEqual(wrong.wrong, [0, 1, 2, 3, 4])
    const firstTwo = typeWordSpellingInput(wrong, 'wo')
    assert.equal(firstTwo.cursor, 2)
    for (const key of ['ArrowLeft', 'ArrowRight'])
        assert.equal(
            getPracticeAnswerKeyAction({
                key,
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                shiftKey: false,
                isComposing: false,
                defaultPrevented: false,
                keyCode: 0,
            }),
            'block-position',
        )
    const repaired = typeWordSpellingInput(firstTwo, 'man')
    assert.deepEqual(repaired.wrong, [])
    assert.equal(repaired.completed, false)
    const submitted = spaceWordSpellingInput(repaired, layout, true)
    assert.equal(submitted.value, 'woman')
    assert.equal(submitted.state.completed, true)
})

test('句中练义主操作与口语门控按真实玩法区分，中文揭示与填词判对独立', (): void => {
    const base = {
        family: 'word' as const,
        mode: 'meaning' as const,
        phase: 'answering' as const,
        oralStage: 'idle' as const,
        quickOral: false,
    }
    assert.equal(
        resolvePracticePrimary({ ...base, wordMeaning: initialWordMeaningState }),
        'submit',
    )
    assert.equal(
        resolvePracticePrimary({
            ...base,
            wordMeaning: { variant: 'context', translationVisible: false },
        }),
        'reveal-translation',
    )
    assert.equal(
        resolvePracticePrimary({
            ...base,
            wordMeaning: { variant: 'context', translationVisible: true },
        }),
        'next',
    )
    assert.equal(
        resolvePracticePrimary({
            ...base,
            wordMeaning: { variant: 'context', translationVisible: false },
            quickOral: true,
        }),
        'oral-start',
    )
    assert.equal(hasPracticeAnswerInput('meaning', 'context'), false)
    assert.equal(hasPracticeAnswerInput('meaning', 'fill'), true)
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        assert.equal(
            canShowQuickOral('word', 'meaning', phase, true, true, 'fill'),
            phase === 'correct',
        )
        assert.equal(canShowQuickOral('word', 'meaning', phase, true, true, 'context'), true)
    }
    assert.equal(canShowQuickOral('word', 'meaning', 'answering', true, false, 'context'), false)
    assert.equal(canShowQuickOral('word', 'meaning', 'answering', false, true, 'context'), false)
})

const shortcutContext: PracticeShortcutContext = {
    family: 'word',
    mode: 'meaning',
    phase: 'answering',
    oralStage: 'idle',
    hasTarget: true,
    showEvaluation: true,
    panelVisible: false,
    scope: 'question',
    ready: true,
    answerInputCommands: false,
    wordMeaningVariant: 'context',
    values: {
        playShortcut: 'Shift + L',
        masteredShortcut: 'Shift + J',
        unfamiliarShortcut: 'Shift + K',
        previousShortcut: 'Shift + ArrowLeft',
        nextShortcut: 'Shift + ArrowRight',
    },
}

test('辨义空格、回车和V消费同一状态，原生按钮、长按、IME和阻断不透传', (): void => {
    const event = { key: ' ', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false }
    assert.equal(resolvePracticeShortcut(event, shortcutContext, 'content'), 'practice.contextual')
    assert.equal(
        resolvePracticeShortcut({ ...event, key: 'Enter' }, shortcutContext, 'content'),
        'practice.primary',
    )
    assert.equal(
        resolvePracticeShortcut({ ...event, key: 'v' }, shortcutContext, 'content'),
        'practice.oral',
    )
    for (const changes of [{ repeat: true }, { isComposing: true }, { defaultPrevented: true }])
        assert.equal(
            resolvePracticeShortcut({ ...event, ...changes }, shortcutContext, 'content'),
            null,
        )
    assert.equal(
        resolvePracticeShortcut(event, { ...shortcutContext, scope: 'blocked' }, 'content'),
        null,
    )
    assert.equal(resolvePracticeShortcut(event, shortcutContext, 'native'), null)
    assert.equal(resolvePracticeShortcut(event, shortcutContext, 'editor'), null)
    assert.equal(
        resolvePracticeShortcut(
            { ...event, key: 'V' },
            { ...shortcutContext, showEvaluation: false },
            'content',
        ),
        null,
    )
    const fill = {
        ...shortcutContext,
        wordMeaningVariant: 'fill' as const,
        answerInputCommands: true,
    }
    assert.equal(resolvePracticeShortcut(event, fill, 'answer-input'), null)
    assert.equal(resolvePracticeShortcut(event, fill, 'content'), 'practice.contextual')
    for (const [key, command] of [
        ['ArrowLeft', 'question.previous'],
        ['ArrowRight', 'question.next'],
    ] as const) {
        assert.equal(
            resolvePracticeShortcut({ ...event, key, shiftKey: true }, fill, 'answer-input'),
            command,
        )
        assert.equal(resolvePracticeShortcut({ ...event, key }, fill, 'answer-input'), null)
    }
})

test('底栏不再提示左右键跳格，填空提交和辨义中文显示与继续使用真实动作', (): void => {
    const base = {
        family: 'word' as const,
        mode: 'meaning' as const,
        phase: 'answering' as const,
        index: 0,
        total: 10,
        values: shortcutContext.values,
    }
    const fill = getPracticeFooter({ ...base, wordMeaning: initialWordMeaningState })
    assert.equal(fill.find((item) => item.id === 'primary')?.action, 'practice.primary')
    assert.deepEqual(fill.find((item) => item.id === 'primary')?.shortcuts, ['Enter', 'Space'])
    assert.equal(
        fill.some((item) => item.id === 'input'),
        false,
    )
    const context = getPracticeFooter({
        ...base,
        wordMeaning: { variant: 'context', translationVisible: false },
    })
    assert.equal(context.find((item) => item.id === 'primary')?.label, '显示中文')
    assert.equal(context.find((item) => item.id === 'primary')?.action, 'practice.contextual')
    assert.equal(
        context.some((item) => item.id === 'panel'),
        false,
    )
    assert.deepEqual(
        context.map((item) => item.id),
        ['previous', 'mastered', 'read-aloud', 'primary', 'unfamiliar', 'navigation', 'next'],
    )
    const next = getPracticeFooter({
        ...base,
        wordMeaning: { variant: 'context', translationVisible: true },
    })
    assert.equal(next.find((item) => item.id === 'primary')?.label, '下一题')
})
