import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getPracticeFooter } from '../model/practice-footer'
import type { PracticeFooterContext } from '../model/practice-footer'
import { PracticeFooter } from './PracticeFooter'

const context: PracticeFooterContext = {
    family: 'sentence',
    mode: 'translate',
    phase: 'answering',
    index: 0,
    total: 2,
    values: {
        playShortcut: 'Shift + L',
        masteredShortcut: 'Shift + J',
        unfamiliarShortcut: 'Shift + K',
        previousShortcut: 'Shift + ArrowLeft',
        nextShortcut: 'Shift + ArrowRight',
    },
}

function renderFooter(input: PracticeFooterContext, blocked = false): string {
    return renderToStaticMarkup(
        createElement(PracticeFooter, {
            items: getPracticeFooter(input),
            blocked,
            onAction: (): never => assert.fail('预渲染不得派发练习动作'),
        }),
    )
}

test('底栏预渲染稳定，真实动作使用按钮，组合切题和跳格提示不冒充按钮', (): void => {
    const html = renderFooter(context)
    assert.equal(html, renderFooter(context))
    assert.match(html, /<footer data-practice-footer="true" aria-label="练习底部操作"/)
    assert.match(html, /fixed inset-x-0 bottom-0/)
    assert.match(html, /overflow-x-auto/)
    assert.match(html, /safe-area-inset-bottom/)
    for (const id of ['input', 'navigation']) {
        assert.match(html, new RegExp(`<div data-practice-footer-item="${id}"`))
        assert.doesNotMatch(html, new RegExp(`<button[^>]*data-practice-footer-item="${id}"`))
    }
    assert.match(html, /Shift\+←\/→/)
    assert.match(html, /Shift\+L/)
    assert.doesNotMatch(html, /Ctrl\+/)
    for (const button of html.matchAll(/<button\b([^>]+)>/g)) {
        assert.match(button[1] ?? '', /type="button"/)
        assert.match(button[1] ?? '', /aria-label="[^"]+"/)
        assert.match(button[1] ?? '', /cursor-pointer/)
        assert.match(button[1] ?? '', /focus-visible:outline/)
    }
})

test('原生禁用和答案面板展开状态正确输出，阻断时所有动作不可点击', (): void => {
    const normal = renderFooter({ ...context, panelVisible: true })
    assert.match(normal, /aria-label="上一题"[^>]*disabled=""/)
    assert.match(normal, /aria-label="答案" aria-expanded="true"/)
    const blocked = renderFooter(context, true)
    const buttons = Array.from(blocked.matchAll(/<button\b([^>]+)>/g))
    assert.ok(buttons.length > 0)
    for (const button of buttons) assert.match(button[1] ?? '', /disabled=""/)
})

test('看图听力三项切题键合并同修饰方向键，空格与自定义不同修饰键保持独立', (): void => {
    const picture: PracticeFooterContext = { ...context, family: 'picture', mode: 'listen' }
    const html = renderFooter(picture)
    assert.match(html, /Shift\+←\/→ \/ 空格/)
    assert.doesNotMatch(html, /Shift\+← \/ Shift\+→/)
    const custom = renderFooter({
        ...picture,
        values: { ...picture.values, previousShortcut: 'Alt + ArrowLeft' },
    })
    assert.match(custom, /Alt\+← \/ Shift\+→ \/ 空格/)
    assert.doesNotMatch(custom, /Alt\+←\/→/)
})

test('阅读只有无键帽播放图标与两端，纯媒体和视频听力不生成通用底栏', (): void => {
    const read = renderFooter({ ...context, family: 'audio', mode: 'read' })
    assert.equal((read.match(/<button\b/g) ?? []).length, 3)
    assert.match(read, /aria-label="播放"[^>]*data-practice-footer-action="practice.readAloud"/)
    assert.doesNotMatch(read, /<kbd/)
    assert.match(read, /gap-\[23px\]/)
    assert.match(read, /<circle cx="14" cy="14"/)
    for (const family of ['audio-reader', 'video-reader', 'text-reader'] as const)
        assert.equal(renderFooter({ ...context, family, mode: 'read' }), '')
    assert.equal(renderFooter({ ...context, family: 'video', mode: 'listen' }), '')
})
