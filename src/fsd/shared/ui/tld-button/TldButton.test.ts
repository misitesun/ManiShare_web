import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldButton } from './TldButton'

test('TldButton defaults to a non-submitting native button', (): void => {
    const markup = renderToStaticMarkup(createElement(TldButton, null, '确认'))

    assert.match(markup, /<button[^>]*type="button"/)
    assert.match(markup, />确认<\/span>/)
})

test('TldButton forwards native accessibility and disabled attributes', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                'aria-label': '提交练习',
                disabled: true,
                type: 'submit',
                variant: 'secondary',
            },
            '提交',
        ),
    )

    assert.match(markup, /<button[^>]*aria-label="提交练习"/)
    assert.match(markup, /<button[^>]*disabled=""/)
    assert.match(markup, /<button[^>]*type="submit"/)
})
