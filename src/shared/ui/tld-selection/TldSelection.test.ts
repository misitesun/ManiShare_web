import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSelection } from './TldSelection'

test('card selection preserves a single native checked checkbox and accessible name', () => {
    const html = renderToStaticMarkup(
        createElement(TldSelection, {
            label: '选择课程',
            checked: true,
            layout: 'card',
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.equal((html.match(/type="checkbox"/g) ?? []).length, 1)
    assert.match(html, /checked=""/)
    assert.match(html, /aria-label="选择课程"/)
    assert.doesNotMatch(html, /<button/)
})

test('TldSelection exposes label and disabled controlled state', () => {
    const html = renderToStaticMarkup(
        createElement(TldSelection, {
            label: '选择',
            checked: true,
            disabled: true,
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.match(html, /disabled=""/)
    assert.match(html, /type="checkbox"/)
})
