import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldInput } from './TldInput'

test('TldInput associates its label and renders a trailing submit action', () => {
    const html = renderToStaticMarkup(
        createElement(TldInput, {
            label: '课程搜索',
            id: 'course-query',
            size: 'large',
            type: 'search',
            trailingAction: createElement('button', { type: 'submit' }, '搜索'),
        }),
    )
    assert.match(html, /for="course-query"/)
    assert.match(html, /id="course-query"/)
    assert.match(html, /<button type="submit">搜索<\/button>/)
    assert.doesNotMatch(html, /<label[^>]*>[^<]*<button/)
})

test('TldInput exposes label and disabled controlled state', () => {
    const html = renderToStaticMarkup(
        createElement(TldInput, { label: '搜索', value: 'hello', disabled: true, readOnly: true }),
    )
    assert.match(html, /disabled=""/)
    assert.match(html, /hello/)
})
