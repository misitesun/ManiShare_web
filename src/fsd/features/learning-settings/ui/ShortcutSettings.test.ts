import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultPreferences, parsePreferences } from '../model/preferences'
import type { LearningPreferences } from '../model/preferences'
import { ShortcutSettings } from './ShortcutSettings'

function renderSettings(values: LearningPreferences): string {
    return renderToStaticMarkup(
        createElement(ShortcutSettings, {
            values,
            update: (): never => {
                throw new Error('预渲染不能修改偏好')
            },
        }),
    )
}

test('预渲染提供五项编辑入口与切题默认键，不显示冲突或打开录入弹窗', (): void => {
    const html = renderSettings(defaultPreferences)
    for (const label of ['朗读', '掌握', '不熟', '上一题', '下一题'])
        assert.ok(html.includes(`编辑${label}`))
    for (const shortcut of ['Shift + L', 'Shift + J', 'Shift + K'])
        assert.ok(html.includes(shortcut))
    assert.ok(html.includes('Shift + ArrowLeft'))
    assert.ok(html.includes('Shift + ArrowRight'))
    assert.doesNotMatch(html, /role="alert"|role="dialog"/)
    assert.ok(html.includes('不支持 Ctrl 组合'))
    assert.ok(html.includes('支持 Shift + 字母'))
    assert.ok(!html.includes('不能使用 Shift + 字母'))
    assert.ok(
        html.includes(
            'Shift + 字符（包括大写字母）在作答输入区保留原生输入，在输入区外执行练习动作。',
        ),
    )
    assert.equal(renderSettings(defaultPreferences), html)
})

test('旧主流程冲突缓存原值可见，并明确提示暂不生效而非显示默认值', (): void => {
    const restored = parsePreferences({ version: 1, values: { playShortcut: 'Space' } })
    const html = renderSettings(restored)
    assert.ok(html.includes('Space'))
    assert.ok(html.includes('此按键用于练习主流程或面板显隐'))
    assert.ok(html.includes('此快捷键暂不生效，请重新设置'))
    assert.equal((html.match(/role="alert"/g) ?? []).length, 1)
    assert.doesNotMatch(html, /Shift \+ L/)
})

test('历史自定义与新增切题重复时，两项都显示可修复冲突', (): void => {
    const restored = parsePreferences({ version: 1, values: { playShortcut: 'Shift + ArrowLeft' } })
    const html = renderSettings(restored)
    assert.equal((html.match(/role="alert"/g) ?? []).length, 2)
    assert.equal((html.match(/Shift \+ ArrowLeft/g) ?? []).length, 2)
    assert.ok(html.includes('编辑朗读'))
    assert.ok(html.includes('编辑上一题'))
})

test('迁移后的Ctrl冲突显示Shift原字母，双方明确暂不生效', (): void => {
    const values = parsePreferences({
        version: 1,
        values: { playShortcut: 'Ctrl + A', masteredShortcut: 'Ctrl + Shift + A' },
    })
    const html = renderSettings(values)
    assert.equal((html.match(/role="alert"/g) ?? []).length, 2)
    assert.equal((html.match(/>Shift \+ A<\/kbd>/g) ?? []).length, 2)
    assert.equal((html.match(/此快捷键暂不生效，请重新设置/g) ?? []).length, 2)
    assert.ok(!html.includes('Ctrl + A'))
})

test('历史Shift符号与基础键按相同身份显示冲突，不能绕过重复校验', (): void => {
    const html = renderSettings({
        ...defaultPreferences,
        playShortcut: 'Shift + 1',
        masteredShortcut: 'Shift + !',
    })
    assert.equal((html.match(/role="alert"/g) ?? []).length, 2)
    assert.equal((html.match(/此快捷键暂不生效，请重新设置/g) ?? []).length, 2)
})
