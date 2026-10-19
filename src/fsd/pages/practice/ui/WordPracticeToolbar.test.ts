import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storage } from '../../../shared/lib/storage'
import { createWordToolbarOptions } from '../model/word-toolbar-options'
import type { WordToolbarMode, WordToolbarOptions } from '../model/word-toolbar-options'
import { WordPracticeToolbar } from './WordPracticeToolbar'

const modes: readonly WordToolbarMode[] = [
    'pronounce',
    'spell',
    'dictate',
    'meaning',
    'typing',
    'oral',
]

function renderToolbar(
    mode: WordToolbarMode,
    values: WordToolbarOptions = createWordToolbarOptions(mode),
): string {
    return renderToStaticMarkup(
        createElement(WordPracticeToolbar, {
            mode,
            values,
            onChange: (): void => assert.fail('预渲染不得更改本轮设置'),
            onNotice: (): void => assert.fail('预渲染不得触发用户通知'),
        }),
    )
}

function getButtonMarkup(markup: string, name: string): string {
    const button = Array.from(markup.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)).find(
        ([element]) => {
            const label = /aria-label="([^"]*)"/.exec(element)?.[1]
            return (label ?? element.replace(/<[^>]*>/g, '').trim()) === name
        },
    )?.[0]
    assert.ok(button, `缺少可访问按钮：${name}`)
    return button
}

test('六种单词工具栏预渲染时有计时说明和收起的设置入口，浮层控件尚未出现', (): void => {
    for (const mode of modes) {
        const html = renderToolbar(mode)
        assert.match(html, /aria-label="单词练习局部设置"/)
        assert.match(html, /aria-label="练习用时：00时00分00秒"/)
        assert.match(getButtonMarkup(html, '本模式设置'), /aria-expanded="false"/)
        assert.doesNotMatch(html, /aria-label="本模式显示选项"/)
        assert.doesNotMatch(html, /role="switch"/)
        assert.doesNotMatch(html, /aria-label="输入方式"/)
    }
})

test('拼读提供排序和中英显示菜单及四档音标方案，截图初值可被辅助技术识别', (): void => {
    const html = renderToolbar('pronounce')
    assert.match(getButtonMarkup(html, '单词排序：乱序'), /aria-haspopup="menu"/)
    assert.match(getButtonMarkup(html, '中英显示：中英显示'), /aria-haspopup="menu"/)
    assert.match(html, /aria-label="音标方案"/)
    assert.match(getButtonMarkup(html, '音标方案：原始音标'), /aria-haspopup="menu"/)
    // Portal在挂载后创建，预渲染只输出确定的触发器与桌面选项。
    assert.doesNotMatch(html, /role="menuitemradio"/)
    for (const label of ['原始音标', '音节拆分', '自然拼读', '无音标'])
        assert.match(
            getButtonMarkup(html, label),
            label === '原始音标' ? /aria-pressed="true"/ : /aria-pressed="false"/,
        )
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
})

test('拼写以音节拆分作为首项和初始选中方案，并且没有拼读专属菜单', (): void => {
    const html = renderToolbar('spell')
    assert.doesNotMatch(html, /aria-label="单词排序：/)
    assert.doesNotMatch(html, /aria-label="中英显示：/)
    assert.doesNotMatch(html, /role="menuitemradio"/)
    const choices = ['音节拆分', '原始音标', '自然拼读', '无音标']
    let previousIndex = -1
    for (const label of choices) {
        const button = getButtonMarkup(html, label)
        assert.match(button, label === '音节拆分' ? /aria-pressed="true"/ : /aria-pressed="false"/)
        const index = html.indexOf(button)
        assert.ok(index > previousIndex)
        previousIndex = index
    }
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
})

test('默写、句中练义、指法和口语不提供外置音标方案或拼读菜单', (): void => {
    for (const mode of ['dictate', 'meaning', 'typing', 'oral'] as const) {
        const html = renderToolbar(mode)
        assert.doesNotMatch(html, /aria-label="音标方案"/)
        assert.doesNotMatch(html, /aria-label="单词排序：/)
        assert.doesNotMatch(html, /aria-label="中英显示：/)
        assert.doesNotMatch(html, /aria-pressed=/)
    }
})

test('受控音标选择在预渲染时准确反映当前值，不擅自重置为初值', (): void => {
    for (const mode of ['pronounce', 'spell'] as const) {
        const html = renderToolbar(mode, {
            ...createWordToolbarOptions(mode),
            phonetics: 'none',
        })
        assert.match(getButtonMarkup(html, '无音标'), /aria-pressed="true"/)
        assert.match(getButtonMarkup(html, '音标方案：无音标'), /aria-expanded="false"/)
        assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
    }
})

test('工具栏预渲染结果确定且不读取或写入学习偏好存储', (context): void => {
    const get = context.mock.method(storage, 'get', (): never =>
        assert.fail('工具栏预渲染不得读取存储'),
    )
    const set = context.mock.method(storage, 'set', (): never =>
        assert.fail('工具栏预渲染不得写入存储'),
    )
    for (const mode of modes) assert.equal(renderToolbar(mode), renderToolbar(mode))
    assert.equal(get.mock.callCount(), 0)
    assert.equal(set.mock.callCount(), 0)
})
