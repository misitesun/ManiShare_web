import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createOralAssessmentSample } from '../model/oral-assessment'
import type { OralAssessmentStage, OralAssessmentTarget } from '../model/oral-assessment'
import type { OralAssessmentDemoController } from '../model/useOralAssessmentDemo'
import { OralAssessmentContent } from './OralAssessmentContent'

const target: OralAssessmentTarget = {
    id: 'woman',
    text: 'woman',
    translation: '女人',
    kind: 'word',
}
function rejectAction(): never {
    throw new Error('预渲染不得触发评测任务')
}
function controller(stage: OralAssessmentStage, score = 40): OralAssessmentDemoController {
    return {
        stage,
        blocked: false,
        elapsed: 6,
        playing: false,
        result: stage === 'result' ? createOralAssessmentSample(target, score) : null,
        start: rejectAction,
        stopAndEvaluate: rejectAction,
        rerecord: rejectAction,
        reset: rejectAction,
        pause: rejectAction,
        replay: rejectAction,
    }
}

test('页面与弹窗结果均在按钮下方渲染播放声纹，停止／暂停／不可见时保留空槽', (): void => {
    for (const presentation of ['dialog', 'page'] as const) {
        for (const [playing, blocked, active, visible] of [
            [true, false, true, true],
            [false, false, true, false],
            [true, true, true, false],
            [true, false, false, false],
        ] as const) {
            const html = renderToStaticMarkup(
                createElement(OralAssessmentContent, {
                    target,
                    presentation,
                    active,
                    controller: { ...controller('result'), playing, blocked },
                    wave: createElement('span', { 'data-playback-wave-fixture': true }),
                }),
            )
            assert.match(html, new RegExp(`data-oral-assessment-playback-wave="${presentation}"`))
            assert.equal(html.includes('data-playback-wave-fixture="true"'), visible)
            assert.ok(
                html.indexOf('data-oral-assessment-playback-wave') > html.indexOf('data-playing='),
            )
        }
    }
})

test('两种容器消费同一四态正文，评分中禁止重复动作且不改变当前词条', (): void => {
    for (const presentation of ['dialog', 'page'] as const) {
        for (const stage of ['idle', 'recording', 'evaluating', 'result'] as const) {
            const html = renderToStaticMarkup(
                createElement(OralAssessmentContent, {
                    target,
                    controller: controller(stage),
                    presentation,
                }),
            )
            assert.match(html, new RegExp(`data-oral-assessment-content="${presentation}"`))
            assert.match(html, new RegExp(`data-oral-assessment-stage="${stage}"`))
            assert.match(html, /woman/)
            assert.doesNotMatch(html, /ESC退出|role="dialog"|teacher|<audio|<input/)
            if (stage === 'evaluating') {
                assert.match(html, /aria-busy="true"/)
                assert.match(html, /<button[^>]*disabled=""/)
                assert.match(html, /评测中/)
            }
            if (stage === 'recording') assert.match(html, /00:06/)
        }
    }
})

test('两种容器按总分共用四档结果，逐词可独立上色，隐藏翻译不隐藏评测', (): void => {
    for (const presentation of ['dialog', 'page'] as const) {
        for (const [score, tone, label] of [
            [40, 'low', 'KEEP TRYING'],
            [70, 'good', 'GOOD EFFORT'],
            [85, 'excellent', 'GREAT WORK'],
            [96, 'perfect', 'PERFECT'],
        ] as const) {
            const state = controller('result', score)
            const html = renderToStaticMarkup(
                createElement(OralAssessmentContent, {
                    target,
                    controller: state,
                    presentation,
                    translationVisible: false,
                }),
            )
            assert.match(html, new RegExp(`data-oral-assessment-score="true" data-tone="${tone}"`))
            assert.match(html, new RegExp(label))
            assert.doesNotMatch(html, /女人/)
            assert.equal((html.match(/role="meter"/g) ?? []).length, 3)
        }
        const state = controller('result')
        const result = createOralAssessmentSample(target)
        const html = renderToStaticMarkup(
            createElement(OralAssessmentContent, {
                target,
                presentation,
                controller: { ...state, blocked: true, result: { ...result, score: 96 } },
            }),
        )
        assert.match(html, /data-tone="low"/)
        assert.match(html, /data-oral-assessment-score="true" data-tone="perfect"/)
        assert.equal((html.match(/<button[^>]*disabled=""/g) ?? []).length, 2)
        assert.doesNotMatch(html, /data-oral-action-active="true"/)
    }
})

test('句子口语页面沿同一四态正文，结果逐词展示当前句子及注入的真实回放入口', (): void => {
    const sentence: OralAssessmentTarget = {
        id: 'sentence:oral:reading',
        text: 'we read books together',
        translation: '我们一起读书',
        kind: 'sentence',
    }
    for (const stage of ['idle', 'recording', 'evaluating', 'result'] as const) {
        const html = renderToStaticMarkup(
            createElement(OralAssessmentContent, {
                target: sentence,
                presentation: 'page',
                controller: {
                    ...controller(stage),
                    replayAudio: true,
                    result: stage === 'result' ? createOralAssessmentSample(sentence, 85) : null,
                },
            }),
        )
        assert.match(html, new RegExp(`data-oral-assessment-stage="${stage}"`))
        assert.match(html, /我们一起读书/)
        assert.doesNotMatch(html, /woman|ESC退出|role="dialog"/)
        if (stage === 'result') {
            assert.match(html, /逐词模拟分数/)
            for (const word of ['we', 'read', 'books', 'together'])
                assert.match(html, new RegExp(`>${word}<`))
            assert.match(html, /data-oral-assessment-score="true" data-tone="excellent"/)
            assert.match(html, /播放当前题目示例朗读/)
        } else assert.match(html, /we read books together/)
    }
})

test('注入示例音频时保留回放入口，说明播放来源，不再声称只有模拟播放', (): void => {
    const html = renderToStaticMarkup(
        createElement(OralAssessmentContent, {
            target,
            controller: { ...controller('result'), replayAudio: true },
        }),
    )
    assert.match(html, /aria-label="播放当前题目示例朗读"/)
    assert.match(html, /不是用户录音/)
    assert.doesNotMatch(html, /播放按钮仅演示播放状态/)
    for (const [state, label] of [
        [{ replayPending: true }, '取消等待播放'],
        [{ replayError: true }, '朗读播放失败，点击重试'],
    ] as const) {
        const stateHtml = renderToStaticMarkup(
            createElement(OralAssessmentContent, {
                target,
                controller: { ...controller('result'), replayAudio: true, ...state },
            }),
        )
        assert.match(stateHtml, new RegExp(`aria-label="${label}"`))
        assert.doesNotMatch(stateHtml, /data-oral-action-active="true"/)
    }
})
