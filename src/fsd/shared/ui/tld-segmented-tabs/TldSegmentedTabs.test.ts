import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSegmentedTabs } from './TldSegmentedTabs'

const items = [
    { id: 'first', label: '第一项', panelId: 'first-panel' },
    { id: 'second', label: '第二项', panelId: 'second-panel' },
]

test('segmented indicator aligns its first paint with the controlled selection', (): void => {
    const render = (value: string): string =>
        renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                ariaLabel: '筛选',
                items,
                value,
                onValueChange: (): void => undefined,
            }),
        )
    assert.match(render('first'), /left:0%;width:50%/)
    assert.match(render('first'), /clip-path:inset\(0 50% 0 0% round 8px\)/)
    assert.match(render('second'), /left:50%;width:50%/)
    assert.match(render('second'), /clip-path:inset\(0 0% 0 50% round 8px\)/)
    assert.doesNotMatch(render('missing'), /clip-path/)
    const empty = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '筛选',
            items: [],
            value: '',
            onValueChange: (): void => undefined,
        }),
    )
    assert.doesNotMatch(empty, /NaN|Infinity|clip-path/)
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
    assert.match(markup, /absolute inset-y-0 z-20 rounded-lg bg-linear-to-r/)
    assert.match(markup, /absolute inset-0 z-30 flex text-inverse/)
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

    assert.match(markup, /bottom-0 z-0 h-px bg-strong/)
    assert.match(markup, /data-highlight-key=/)
    assert.match(markup, /text-brand/)
    assert.match(markup, /aria-controls="second-panel"/)
    assert.match(markup, /aria-selected="true"/)
})

test('underline presentation configures text, indicator target and baseline separately', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            activeTextTone: 'gradient',
            ariaLabel: '课程分类',
            indicatorThickness: 'thick',
            indicatorTone: 'brand-start',
            indicatorWidth: 48,
            items: [
                { id: 'all', label: '全部' },
                { id: 'reading', label: '阅读' },
            ],
            layout: 'equal',
            semantics: 'filter',
            showBaseline: false,
            value: 'all',
            variant: 'underline',
            onValueChange: (): void => undefined,
        }),
    )

    assert.match(markup, /role="group"/)
    assert.match(markup, /aria-pressed="true"/)
    assert.match(markup, /background-image:linear-gradient/)
    assert.match(markup, /bottom-\[-1px\] left-1\/2 h-1/)
    assert.match(markup, /width:48px/)
    assert.doesNotMatch(markup, /role="tab"/)
    assert.doesNotMatch(markup, /aria-controls=/)
    assert.doesNotMatch(markup, /bottom-0 z-0 h-px/)
})

test('underline presentation supports item-sized targets and a subtle baseline', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            activeTextTone: 'primary',
            ariaLabel: '筛选',
            baselineTone: 'subtle',
            indicatorWidth: 'item',
            items: [
                { id: 'popular', label: '热门推荐' },
                { id: 'new', label: '最新上架' },
            ],
            semantics: 'filter',
            value: 'popular',
            variant: 'underline',
            onValueChange: (): void => undefined,
        }),
    )

    assert.match(markup, /bottom-0 z-0 h-px bg-subtle/)
    assert.match(markup, /w-max -translate-x-1\/2/)
    assert.match(markup, />热门推荐<\/span><\/button>/)
})
