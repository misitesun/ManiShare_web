import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { phoneticsDemoLesson } from '../model/phonetics-demo'
import { getDemoQuestions } from '../model/practice-demo'
import type { PracticeQuestion } from '../model/practice-demo'
import { createPhoneticsAudioPlan } from '../model/phonetics-reading-plan'
import type { PhoneticsReadingSnapshot } from '../model/phonetics-reading-runtime'
import type { OralAssessmentDemoController } from '../../../features/oral-assessment'
import { PhoneticsDemo, PhoneticsExplanation } from './PhoneticsDemo'

function ignoreAction(): void {}

const idleOral: OralAssessmentDemoController = {
    stage: 'idle',
    elapsed: 0,
    playing: false,
    blocked: false,
    result: null,
    start: ignoreAction,
    stopAndEvaluate: ignoreAction,
    rerecord: ignoreAction,
    reset: ignoreAction,
    pause: ignoreAction,
    replay: ignoreAction,
}

function renderDeck(
    index: number,
    blocked = false,
    naturalPhonics = true,
    questions: readonly PracticeQuestion[] = getDemoQuestions('phonetics', 'pronounce'),
    options: {
        readonly reading?: PhoneticsReadingSnapshot
        readonly waveStyle?: string
        readonly oralController?: OralAssessmentDemoController
        readonly oralEnabled?: boolean
    } = {},
): string {
    return renderToStaticMarkup(
        createElement(PhoneticsDemo, {
            questions,
            index,
            blocked,
            isBlocked: (): boolean => blocked,
            onController: ignoreAction,
            onBusyChange: ignoreAction,
            onNavigate: ignoreAction,
            onDragStart: ignoreAction,
            onNotice: ignoreAction,
            naturalPhonics,
            oralController: idleOral,
            ...options,
        }),
    )
}

function getCards(html: string): string[] {
    return html.match(/<article\b[^>]*data-phonetics-card[^>]*>[\s\S]*?<\/article>/g) ?? []
}

test('十题音标卡堆最多展示前卡与三张后卡，只有当前卡可交互', (): void => {
    const questions = getDemoQuestions('phonetics', 'pronounce')
    assert.equal(questions.length, 10)
    for (const index of questions.keys()) {
        const html = renderDeck(index)
        assert.match(html, /role="group" aria-label="音标词卡堆"/)
        const cards = getCards(html)
        const slots = html.match(/<div\b[^>]*data-swap-index="\d+"[^>]*>/g) ?? []
        assert.equal(cards.length, questions.length)
        assert.equal(slots.length, questions.length)
        assert.equal(
            slots.filter((slot) => slot.includes('visibility:visible')).length,
            Math.min(4, questions.length - index),
        )
        cards.forEach((card, at): void => {
            const question = questions[at]
            assert.ok(question)
            assert.ok(card.includes(`data-phonetics-question-id="${question.id}"`))
            const buttonCount = 2 + (question.phonetics?.segments.length ?? 0)
            assert.equal(card.match(/<button\b/g)?.length, buttonCount)
            assert.equal(card.match(/disabled=""/g)?.length ?? 0, at === index ? 0 : buttonCount)
            for (const segment of question.phonetics?.segments ?? []) {
                assert.ok(
                    card.includes(`aria-label="播放 ${segment.spelling} 的音素 /${segment.ipa}/"`),
                )
            }
            assert.ok(card.includes(`aria-label="播放 ${question.english} 的完整发音"`))
            assert.ok(slots[at]?.includes(`aria-hidden="${at !== index}"`))
            assert.equal(slots[at]?.includes('inert=""'), at !== index)
        })
        assert.doesNotMatch(html, /<audio\b|<video\b/)
        assert.doesNotMatch(html, /再来|记住了/)
    }
})

test('只有当前词卡承载卡内结果，总分唯一，不打开旧评测弹窗或笔记入口', (): void => {
    const html = renderDeck(2, false, true, getDemoQuestions('phonetics'), {
        oralController: {
            ...idleOral,
            stage: 'result',
            result: {
                score: 96,
                accuracy: 80,
                fluency: 88,
                completeness: 90,
                words: [],
                rating: 'PERFECT',
                description: '样例',
            },
        },
    })
    const cards = getCards(html)
    cards.forEach((card, index): void => {
        assert.equal(card.includes('data-phonetics-oral-stage="result"'), index === 2)
        assert.equal(card.includes('aria-valuenow="96"'), index === 2)
    })
    assert.equal(html.match(/role="meter"/g)?.length, 1)
    assert.doesNotMatch(html, /role="dialog"|准确度|流畅度|完整度|编辑.*笔记/)
    const hidden = renderDeck(0, false, true, getDemoQuestions('phonetics'), { oralEnabled: false })
    assert.doesNotMatch(hidden, /data-phonetics-oral-stage|开始口语评测/)
})

test('阻断状态禁用全部卡内入口，单题数据不补造背卡', (): void => {
    const blocked = renderDeck(0, true)
    for (const card of getCards(blocked)) {
        assert.equal(card.match(/disabled=""/g)?.length, card.match(/<button\b/g)?.length)
    }
    const single = renderDeck(0, false, true, getDemoQuestions('phonetics').slice(0, 1))
    assert.equal(getCards(single).length, 1)
    assert.equal(single.match(/data-swap-index=/g)?.length, 1)
})

test('自然拼读只改变朗读顺序，卡片身份与词例音素格保持', (): void => {
    const phonics = renderDeck(0)
    const basic = renderDeck(0, false, false)
    assert.match(phonics, /data-phonetics-reading-plan="phonics"/)
    assert.match(basic, /data-phonetics-reading-plan="basic"/)
    assert.match(phonics, /目标音标 → 单词 → 自然拼读音段 → 单词/)
    assert.match(basic, /目标音标 → 单词/)
    assert.doesNotMatch(basic, /目标音标 → 单词 → 自然拼读音段/)
    assert.equal(getCards(phonics).length, getCards(basic).length)
    assert.equal(basic.match(/aria-label="音素分块 /g)?.length, 10)
    assert.doesNotMatch(basic, /音源未接入/)
    assert.match(basic, /cat 音标词卡/)
    assert.match(basic, /alt="音标练习共用演示插图：understand词义示例"/)
})

test('顶部音标讲解独立于卡堆，不进入卡片滑动区域', (): void => {
    const explanation = renderToStaticMarkup(
        createElement(PhoneticsExplanation, { lesson: phoneticsDemoLesson, onPlay: ignoreAction }),
    )
    assert.match(explanation, /前元音/)
    assert.match(explanation, /记忆口诀/)
    assert.match(explanation, /发音要点/)
    assert.match(explanation, /播放目标音标 \/æ\//)
    assert.doesNotMatch(explanation, /data-card-swap|data-phonetics-card/)
})

test('完整朗读的目标音、整词和拼读音段都在当前词卡显示声纹', (): void => {
    const questions = getDemoQuestions('phonetics', 'pronounce')
    const question = questions[2]
    assert.ok(question)
    const plan = createPhoneticsAudioPlan(question, true)
    assert.equal(plan.kind, 'ready')
    if (plan.kind !== 'ready') throw new Error(plan.message)
    for (const kind of ['target-phonetic', 'word', 'phonics'] as const) {
        const step = plan.steps.find((entry) => entry.kind === kind)
        assert.ok(step)
        const html = renderDeck(2, false, true, questions, {
            reading: { status: 'playing', playRequested: true, surface: 'word', step, error: null },
            waveStyle: '矩阵方块',
        })
        const cards = getCards(html)
        assert.equal(html.match(/data-practice-reading-overlay="playing"/g)?.length, 1)
        cards.forEach((card, index): void => {
            assert.equal(card.includes('data-wave-active="true"'), index === 2)
        })
        assert.match(html, /data-audio-wave="矩阵方块"/)
        assert.doesNotMatch(html, /<(?:audio|video)\b/)
    }
})

test('点击目标音标时不显示词图声纹，停止及阻断时收起遮罩', (): void => {
    const questions = getDemoQuestions('phonetics', 'pronounce')
    const question = questions[0]
    assert.ok(question)
    const plan = createPhoneticsAudioPlan(question, true)
    assert.equal(plan.kind, 'ready')
    if (plan.kind !== 'ready') throw new Error(plan.message)
    const target = plan.steps.find((entry) => entry.kind === 'target-phonetic')
    const word = plan.steps.find((entry) => entry.kind === 'word')
    assert.ok(target)
    assert.ok(word)
    const statuses: readonly PhoneticsReadingSnapshot['status'][] = [
        'idle',
        'paused',
        'ended',
        'error',
        'unavailable',
    ]
    for (const status of statuses) {
        const html = renderDeck(0, false, true, questions, {
            reading: { status, playRequested: true, surface: 'word', step: word, error: null },
        })
        assert.doesNotMatch(html, /data-practice-reading-overlay|data-wave-active/)
    }
    for (const [blocked, step] of [
        [false, target],
        [true, word],
    ] as const) {
        const html = renderDeck(0, blocked, true, questions, {
            reading: {
                status: 'playing',
                playRequested: true,
                surface: blocked ? 'word' : 'target',
                step,
                error: null,
            },
        })
        assert.doesNotMatch(html, /data-practice-reading-overlay|data-wave-active/)
    }
})

test('自动朗读等待和段间间隔仍保留位置2的遮罩，声纹静止而非假播', (): void => {
    const questions = getDemoQuestions('phonetics', 'pronounce')
    for (const status of ['waiting', 'loading'] as const) {
        const html = renderDeck(0, false, true, questions, {
            reading: { status, playRequested: true, surface: 'word', step: null, error: null },
        })
        assert.equal(html.match(/data-practice-reading-overlay="waiting"/g)?.length, 1)
        assert.match(getCards(html)[0] ?? '', /data-wave-active="false"/)
        assert.doesNotMatch(html, /data-wave-active="true"|音源待接入|点击朗读重试/)
    }
})

test('目标音标讲解复用朗读声纹与设置样式，阻断时不展示动画', (): void => {
    for (const blocked of [false, true]) {
        const html = renderToStaticMarkup(
            createElement(PhoneticsExplanation, {
                lesson: phoneticsDemoLesson,
                blocked,
                onPlay: ignoreAction,
                reading: { status: 'playing', waveStyle: '波形线条' },
            }),
        )
        assert.equal(html.includes('data-practice-reading-overlay="playing"'), !blocked)
        assert.equal(html.includes('data-audio-wave="波形线条"'), !blocked)
        assert.equal(html.includes('data-wave-active="true"'), !blocked)
        assert.doesNotMatch(html, /<(?:audio|video)\b/)
    }
})
