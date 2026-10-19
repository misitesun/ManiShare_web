import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storage } from '../../../shared/lib/storage'
import { createSentenceToolbarOptions } from '../model/sentence-toolbar-options'
import type { SentenceToolbarMode } from '../model/sentence-toolbar-options'
import { SentencePracticeToolbar } from './SentencePracticeToolbar'

const modes: readonly SentenceToolbarMode[] = [
    'listen',
    'read',
    'translate',
    'check',
    'typing',
    'oral',
    'blocks',
]

function renderToolbar(mode: SentenceToolbarMode): string {
    return renderToStaticMarkup(
        createElement(SentencePracticeToolbar, {
            mode,
            values: createSentenceToolbarOptions(mode),
            onChange: (): void => assert.fail('预渲染不得更改句子局部设置'),
            onNotice: (): void => assert.fail('预渲染不得触发用户通知'),
        }),
    )
}

test('七种句子工具栏都提供确定的计时示例说明', (): void => {
    for (const mode of modes) {
        const html = renderToolbar(mode)
        assert.match(html, /role="group" aria-label="句子练习局部设置"/)
        assert.match(html, /aria-label="练习用时：00时00分00秒"/)
        assert.match(html, />00:00:00<\/span>/)
        assert.equal(html, renderToolbar(mode))
    }
})

test('阅读全览只有计时，没有本模式设置按钮或浮层入口', (): void => {
    const html = renderToolbar('read')
    assert.doesNotMatch(html, /<button\b/)
    assert.doesNotMatch(html, /aria-label="本模式设置"/)
    assert.doesNotMatch(html, /aria-expanded=/)
    assert.doesNotMatch(html, /aria-controls=/)
    assert.doesNotMatch(html, /aria-label="本模式显示选项"/)
})

test('其余六模式预渲染时只有收起的设置入口，内部设置行尚未出现', (): void => {
    for (const mode of ['listen', 'translate', 'check', 'typing', 'oral', 'blocks'] as const) {
        const html = renderToolbar(mode)
        assert.match(html, /aria-label="本模式设置" aria-expanded="false"/)
        assert.equal((html.match(/<button\b/g) ?? []).length, 1)
        assert.doesNotMatch(html, /aria-controls=/)
        assert.doesNotMatch(html, /aria-label="本模式显示选项"/)
        assert.doesNotMatch(html, /aria-label="句子显示方式"/)
        assert.doesNotMatch(html, /aria-label="输入方式"/)
        assert.doesNotMatch(html, /role="switch"/)
        assert.doesNotMatch(html, /aria-pressed=/)
    }
})

test('句子工具栏预渲染不读取或写入学习偏好存储', (context): void => {
    const get = context.mock.method(storage, 'get', (): never =>
        assert.fail('句子工具栏预渲染不得读取存储'),
    )
    const set = context.mock.method(storage, 'set', (): never =>
        assert.fail('句子工具栏预渲染不得写入存储'),
    )
    for (const mode of modes) renderToolbar(mode)
    assert.equal(get.mock.callCount(), 0)
    assert.equal(set.mock.callCount(), 0)
})
