import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type {
    OralAssessmentDemoController,
    OralAssessmentStage,
} from '../../../features/oral-assessment'
import { PhoneticsOralControls } from './PhoneticsOralControls'

function rejectAction(): never {
    throw new Error('预渲染不得开始录制或媒体播放')
}
function controller(stage: OralAssessmentStage): OralAssessmentDemoController {
    return {
        stage,
        elapsed: 6,
        blocked: false,
        playing: false,
        result:
            stage === 'result'
                ? {
                      score: 96,
                      accuracy: 80,
                      fluency: 88,
                      completeness: 90,
                      words: [{ text: 'hat', score: 96 }],
                      rating: 'PERFECT',
                      description: '近乎完美，保持水准！',
                  }
                : null,
        start: rejectAction,
        stopAndEvaluate: rejectAction,
        rerecord: rejectAction,
        reset: rejectAction,
        pause: rejectAction,
        replay: rejectAction,
        replayAudio: true,
    }
}
function render(state: OralAssessmentDemoController | undefined, disabled = false): string {
    return renderToStaticMarkup(
        createElement(PhoneticsOralControls, {
            controller: state,
            disabled,
            recordingWave: '雨滴点阵',
            readingWave: '矩阵方块',
        }),
    )
}

test('卡内四态直接复用控制器：准备、录制计时声纹、评测中及单一总分', (): void => {
    for (const stage of ['idle', 'recording', 'evaluating', 'result'] as const) {
        const html = render(controller(stage))
        assert.match(html, new RegExp(`data-phonetics-oral-stage="${stage}"`))
        assert.doesNotMatch(
            html,
            /role="dialog"|准确度|流畅度|完整度|PERFECT|近乎完美|<audio|<video/,
        )
        if (stage === 'idle') {
            assert.match(html, /开始口语评测/)
            assert.doesNotMatch(html, /role="meter"|data-audio-wave/)
        } else if (stage === 'recording') {
            assert.match(html, /结束录制/)
            assert.match(html, /录制中/)
            assert.match(html, /00:06/)
            assert.match(html, /data-audio-wave="雨滴点阵"/)
            assert.match(html, /data-wave-active="true"/)
        } else if (stage === 'evaluating') {
            assert.match(html, /aria-busy="true"/)
            assert.match(html, /<button[^>]*disabled=""/)
            assert.match(html, /评测中/)
            assert.doesNotMatch(html, /role="meter"|data-wave-active="true"/)
        } else {
            assert.match(html, /重新录制/)
            assert.match(html, /播放当前单词示例（非用户录音）/)
            assert.equal(html.match(/role="meter"/g)?.length, 1)
            assert.match(html, /aria-valuenow="96"/)
        }
    }
})

test('阻断或后卡不执行评测入口，回放声纹仅跟随真实playing', (): void => {
    for (const stage of ['idle', 'recording', 'evaluating', 'result'] as const) {
        const html = render({ ...controller(stage), playing: true }, true)
        assert.equal(html.match(/disabled=""/g)?.length, html.match(/<button\b/g)?.length)
        assert.doesNotMatch(html, /data-wave-active="true"/)
    }
    assert.match(render(undefined), /<button[^>]*disabled=""/)
    for (const playing of [true, false]) {
        const html = render({ ...controller('result'), playing })
        assert.equal(html.includes('data-audio-wave="矩阵方块"'), playing)
    }
})
