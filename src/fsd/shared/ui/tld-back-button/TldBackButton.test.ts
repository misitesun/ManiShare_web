import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldBackButton } from './TldBackButton'
process.env.__NEXT_TRAILING_SLASH = 'true'

test('back control preserves the supplied parent and query on a direct visit', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldBackButton, { to: '/notes/?view=course-packages' }),
    )
    assert.match(markup, /href="\/notes\/\?view=course-packages"/)
    assert.match(markup, /<span>返回<\/span>/)
})
test('back control preserves an explicit destination and accessible label', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldBackButton, { to: '/notes/?page=2', label: '返回笔记本' }),
    )
    assert.match(markup, /href="\/notes\/\?page=2"/)
    assert.match(markup, /<span>返回笔记本<\/span>/)
})
