import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultPreferences } from '../model/preferences'
import { EffectsSettings } from './PracticeSettingsPanels'

function rejectEdit(): never {
    throw new Error('预渲染不得保存设置或触发试听')
}

test('声音设置六类入口明确提供试听，默认落幕且不再显示已删除选项', (): void => {
    const html = renderToStaticMarkup(
        createElement(EffectsSettings, { values: defaultPreferences, update: rejectEdit }),
    )
    for (const label of [
        '打字音效',
        '答对音效',
        '答错音效',
        '章节完成音效',
        '切题音效',
        '口语评测结束音效',
    ])
        assert.ok(html.includes(`aria-label="试听${label}"`))
    assert.ok(html.includes('落幕（默认）'))
    assert.doesNotMatch(html, /章节完成音效1|<audio|正在试听/)
})

test('关闭音效时试听禁用，SSR不创建播放器', (): void => {
    const html = renderToStaticMarkup(
        createElement(EffectsSettings, {
            values: { ...defaultPreferences, typingSound: false },
            update: rejectEdit,
        }),
    )
    const button = html.match(/<button\b[^>]*aria-label="试听打字音效"[^>]*>/)?.[0]
    assert.ok(button)
    assert.match(button, /disabled=""/)
})
