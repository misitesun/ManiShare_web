import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSelect } from './TldSelect'

test('select exposes its controlled selection and starts closed', () => {
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '排序',
            value: 'count',
            options: [
                { value: 'date', label: '创建日期' },
                { value: 'count', label: '错误次数' },
            ],
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(html, /aria-label="排序：错误次数"/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /aria-haspopup="menu"/)
    assert.match(html, /inert=""/)
    assert.match(html, /aria-hidden="true"/)
    assert.match(html, /data-highlight-key="date"/)
    assert.match(html, /data-highlight-key="count"/)
})

test('select handles empty options without inventing a selected value', () => {
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '排序',
            value: '',
            options: [],
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(html, /排序：请选择/)
})
