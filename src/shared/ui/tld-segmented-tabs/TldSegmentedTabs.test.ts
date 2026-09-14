import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSegmentedTabs } from './TldSegmentedTabs'

const items = [
    { id: 'first', label: '第一项', panelId: 'first-panel' },
    { id: 'second', label: '第二项', panelId: 'second-panel' },
]

test('segmented indicator aligns with the controlled selection and handles missing values', (): void => {
    const render = (value: string): string =>
        renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                ariaLabel: '筛选',
                items,
                value,
                onValueChange: (): void => undefined,
            }),
        )
    assert.match(render('first'), /width:50%;transform:translateX\(0%\)/)
    assert.match(render('second'), /width:50%;transform:translateX\(100%\)/)
    assert.doesNotMatch(render('missing'), /translateX/)
    const empty = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '筛选',
            items: [],
            value: '',
            onValueChange: (): void => undefined,
        }),
    )
    assert.doesNotMatch(empty, /NaN|Infinity|translateX/)
})

test('TldSegmentedTabs keeps the segmented presentation by default', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '内容筛选',
            items,
            value: 'first',
            onValueChange: (): void => undefined,
        }),
    )

    assert.match(markup, /role="tablist"/)
    assert.match(markup, /rounded-lg border border-strong/)
    assert.match(markup, /aria-selected="true"/)
    assert.match(markup, /cursor-pointer/)
})

test('TldSegmentedTabs exposes the underline presentation without changing tab semantics', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '明细类型',
            items,
            value: 'second',
            variant: 'underline',
            onValueChange: (): void => undefined,
        }),
    )

    assert.match(markup, /border-b border-strong/)
    assert.match(markup, /text-brand/)
    assert.match(markup, /aria-controls="second-panel"/)
    assert.match(markup, /aria-selected="true"/)
})
