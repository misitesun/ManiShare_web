import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSwitch } from './TldSwitch'

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
