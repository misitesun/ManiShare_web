import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { TldBackButton } from './TldBackButton'

test('back control always links to the supplied parent, including on a direct detail visit', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            MemoryRouter,
            { initialEntries: ['/detail'] },
            createElement(TldBackButton, { to: '/notes?view=course-packages' }),
        ),
    )
    assert.match(markup, /href="\/notes\?view=course-packages"/)
    assert.match(markup, /<span>返回<\/span>/)
})

test('back control supports an explicit destination and accessible label', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            MemoryRouter,
            null,
            createElement(TldBackButton, {
                to: { pathname: '/notes', search: '?page=2' },
                label: '返回笔记本',
            }),
        ),
    )
    assert.match(markup, /href="\/notes\?page=2"/)
    assert.match(markup, /<span>返回笔记本<\/span>/)
})
