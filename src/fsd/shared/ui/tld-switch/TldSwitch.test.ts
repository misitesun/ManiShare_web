import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSwitch } from './TldSwitch'

test('隐藏重复的可见标签时仍提供名称和关联说明', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSwitch, {
            label: '切题后自动朗读',
            checked: false,
            showLabel: false,
            descriptionId: 'read-help',
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.match(html, /aria-label="切题后自动朗读"/)
    assert.match(html, /aria-describedby="read-help"/)
    assert.match(html, /aria-checked="false"/)
})

test('TldSwitch exposes label and disabled controlled state', () => {
    const html = renderToStaticMarkup(
        createElement(TldSwitch, {
            label: '选择',
            checked: true,
            disabled: true,
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.match(html, /disabled=""/)
    assert.match(html, /aria-checked="true"/)
})

test('compact switches keep accessible controlled state when disabled', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSwitch, {
            label: '批量选择',
            checked: false,
            disabled: true,
            size: 'compact',
            descriptionId: 'batch-help',
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.match(html, /role="switch"/)
    assert.match(html, /aria-label="批量选择"/)
    assert.match(html, /aria-describedby="batch-help"/)
    assert.match(html, /aria-checked="false"/)
    assert.match(html, /disabled=""/)
})
