import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { OralDemoStage } from '../model/oral-demo'
import type { OralDemoController } from '../model/useOralDemo'
import { OralDemoPanel } from './OralDemoPanel'

function unexpectedAction(): never {
    return assert.fail('受控口语面板预渲染不得派发动作')
}

function renderPanel(stage: OralDemoStage, blocked = false): string {
    const controller: OralDemoController = {
        stage,
        elapsed: 3,
        blocked,
        start: unexpectedAction,
        stopAndEvaluate: unexpectedAction,
        rerecord: unexpectedAction,
        reset: unexpectedAction,
        pause: unexpectedAction,
        showResult: unexpectedAction,
        showError: unexpectedAction,
        replay: unexpectedAction,
    }
    return renderToStaticMarkup(createElement(OralDemoPanel, { controller }))
}

test('口语面板仅反映传入阶段及计时，结果和失败仍需显式演示操作', (): void => {
    const idle = renderPanel('idle')
    assert.match(idle, /待录音（演示）/)
    assert.match(idle, /开始录音演示/)
    assert.doesNotMatch(idle, /展示示例结果|分（样例）/)
    assert.match(renderPanel('recording'), /结束录音演示/)
    const evaluating = renderPanel('evaluating')
    assert.match(evaluating, /展示示例结果/)
    assert.match(evaluating, /展示失败状态/)
    assert.doesNotMatch(evaluating, /分（样例）/)
    assert.match(renderPanel('result'), /固定演示数据，不代表你的发音评分/)
    assert.match(renderPanel('error'), /演示评测失败/)
    for (const stage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const) {
        const html = renderPanel(stage)
        assert.match(html, /演示计时 00:03/)
        assert.match(html, /不使用麦克风、不生成录音、不上传或评分/)
        assert.doesNotMatch(html, /<audio\b|<video\b/)
    }
})

test('受控阻断状态禁用阶段操作，不给底栏以外另开一份可编辑阶段', (): void => {
    for (const stage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const) {
        const html = renderPanel(stage, true)
        const buttons = Array.from(html.matchAll(/<button\b([^>]+)>/g))
        assert.ok(buttons.length > 0)
        for (const button of buttons) assert.match(button[1] ?? '', /disabled=""/)
    }
})
