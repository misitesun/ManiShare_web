import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSelection } from './TldSelection'

test('radio selection exposes native grouping and bottom card indicator', () => {
    const html = renderToStaticMarkup(
        createElement(TldSelection, {
            label: 'Sarah',
            type: 'radio',
            name: 'mentor',
            value: 'sarah',
            checked: true,
            layout: 'card',
            indicatorPlacement: 'bottom',
            onCheckedChange: (): void => undefined,
        }),
    )
    assert.match(html, /type="radio"/)
    assert.match(html, /name="mentor"/)
    assert.match(html, /value="sarah"/)
    assert.match(html, /data-placement="bottom"/)
    assert.match(html, /checked=""/)
})

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

test('inline radio renders visible option copy without changing its accessible name', () => {
    const html = renderToStaticMarkup(
        createElement(
            TldSelection,
            {
                label: '增加功能',
                type: 'radio',
                name: 'feedback-category',
                value: 'feature',
                checked: false,
                layout: 'inline',
                onCheckedChange: (): void => undefined,
            },
            '增加功能',
        ),
    )
    assert.match(html, /data-layout="inline"/)
    assert.match(html, /aria-label="增加功能"/)
    assert.match(html, />增加功能</)
})
