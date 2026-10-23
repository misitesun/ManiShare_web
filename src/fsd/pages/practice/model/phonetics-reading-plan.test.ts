import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createPhoneticsAudioPlan,
    createPhoneticsReadingPlan,
    describePhoneticsReadingPlan,
} from './phonetics-reading-plan'
import { getDemoQuestions } from './practice-demo'

test('音标自然拼读开启为四阶段，整词分别位于音段前后', () => {
    assert.deepEqual(createPhoneticsReadingPlan(true), [
        'target-phonetic',
        'word',
        'phonics',
        'word',
    ])
    assert.equal(describePhoneticsReadingPlan(true), '目标音标 → 单词 → 自然拼读音段 → 单词')
})

test('关闭自然拼读只保留目标音标与整词，不保留末尾重复整词', () => {
    assert.deepEqual(createPhoneticsReadingPlan(false), ['target-phonetic', 'word'])
    assert.equal(describePhoneticsReadingPlan(false), '目标音标 → 单词')
})

test('十词使用本课目标和显式音素；j为/dʒ/，不拆成IPA字符或字母名', (): void => {
    for (const question of getDemoQuestions('phonetics')) {
        const plan = createPhoneticsAudioPlan(question, true)
        assert.equal(plan.kind, 'ready')
        if (plan.kind !== 'ready') return
        assert.deepEqual(
            plan.steps.map((step) => step.label),
            [
                '/æ/',
                question.english,
                ...(question.phonetics?.segments.map((segment) => `/${segment.ipa}/`) ?? []),
                question.english,
            ],
        )
        assert.equal(new Set(plan.steps.map((step) => step.id)).size, 6)
        assert.equal(createPhoneticsAudioPlan(question, false).kind, 'ready')
    }
})

test('缺音素源时不跳过阶段；关闭自然拼读仍可读目标和整词', (): void => {
    const original = getDemoQuestions('phonetics')[0]
    assert.ok(original?.phonetics)
    const question = {
        ...original,
        phonetics: {
            ...original.phonetics,
            segments: [{ id: 'missing', spelling: 'c', ipa: 'k' }],
        },
    }
    assert.equal(createPhoneticsAudioPlan(question, true).kind, 'unavailable')
    const basic = createPhoneticsAudioPlan(question, false)
    assert.equal(basic.kind, 'ready')
    if (basic.kind === 'ready') assert.equal(basic.steps.length, 2)
    const target = createPhoneticsAudioPlan(question, true, { kind: 'target' })
    assert.equal(target.kind, 'ready')
    if (target.kind === 'ready') assert.equal(target.steps.length, 1)
})

test('手动整词只读一次完整发音，不受自然拼读开关影响，也不依赖目标和音素音源', (): void => {
    const original = getDemoQuestions('phonetics')[0]
    assert.ok(original?.phonetics)
    const question = {
        ...original,
        phonetics: { lesson: { ...original.phonetics.lesson, readingSource: '' }, segments: [] },
    }
    for (const naturalPhonics of [false, true]) {
        const plan = createPhoneticsAudioPlan(question, naturalPhonics, { kind: 'word' })
        assert.equal(plan.kind, 'ready')
        if (plan.kind !== 'ready') throw new Error(plan.message)
        assert.deepEqual(
            plan.steps.map((step) => [step.kind, step.source, step.label]),
            [['word', question.readingSource, question.english]],
        )
    }
})

test('手动音素只使用当前词例选中ID的显式音源，/dʒ/仍为一个完整音素', (): void => {
    const original = getDemoQuestions('phonetics').find((entry) => entry.english === 'jam')
    assert.ok(original?.phonetics)
    const question = {
        ...original,
        readingSource: '',
        phonetics: {
            ...original.phonetics,
            lesson: { ...original.phonetics.lesson, readingSource: '' },
        },
    }
    for (const segment of question.phonetics.segments) {
        const plan = createPhoneticsAudioPlan(question, false, {
            kind: 'segment',
            segmentId: segment.id,
        })
        assert.equal(plan.kind, 'ready')
        if (plan.kind !== 'ready') throw new Error(plan.message)
        assert.deepEqual(plan.steps, [
            {
                id: segment.id,
                kind: 'phonics',
                label: `/${segment.ipa}/`,
                source: segment.readingSource,
                segmentId: segment.id,
            },
        ])
    }
})

test('手动播放缺源或音素ID不属于当前题时明确拒绝，不回退到其他发音', (): void => {
    const original = getDemoQuestions('phonetics')[0]
    assert.ok(original?.phonetics)
    assert.equal(
        createPhoneticsAudioPlan({ ...original, readingSource: '' }, true, { kind: 'word' }).kind,
        'unavailable',
    )
    assert.equal(
        createPhoneticsAudioPlan(original, true, { kind: 'segment', segmentId: 'another-word' })
            .kind,
        'unavailable',
    )
    const missing = {
        ...original,
        phonetics: {
            ...original.phonetics,
            segments: [{ id: 'missing', spelling: 'c', ipa: 'k' }],
        },
    }
    assert.equal(
        createPhoneticsAudioPlan(missing, true, { kind: 'segment', segmentId: 'missing' }).kind,
        'unavailable',
    )
})
