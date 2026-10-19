import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldSegmentedTabs } from './TldSegmentedTabs'

const items = [
    { id: 'first', label: '第一项', panelId: 'first-panel' },
    { id: 'second', label: '第二项', panelId: 'second-panel' },
]

test('玻璃分段显式保留受控筛选、分隔边界和常规文字，其他消费者保持默认', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '内容显示方式',
            appearance: 'glass',
            semantics: 'filter',
            items,
            value: 'second',
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(html, /role="group"/)
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
    assert.match(html, /border-segment-outline/)
    assert.match(html, /bg-foreground\/10/)
    assert.match(html, /var\(--app-leading-tab-label-regular\)/)
    assert.doesNotMatch(html, /role="tab"|aria-controls|bg-surface data-/)
})

test('舒展文字页签保持受控选择与独立面板关联', (): void => {
    for (const value of ['first', 'second']) {
        const html = renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                ariaLabel: '明细类型',
                items,
                value,
                variant: 'underline',
                typography: 'comfortable',
                gap: 'generous',
                layout: 'content',
                indicatorWidth: 'item',
                size: 'compact',
                onValueChange: (): void => undefined,
            }),
        )
        assert.match(html, /role="tablist"/)
        assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1)
        assert.equal((html.match(/aria-selected="false"/g) ?? []).length, 1)
        assert.match(html, /aria-controls="first-panel"/)
        assert.match(html, /aria-controls="second-panel"/)
    }
})

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

test('compact reference typography preserves controlled filter semantics and accessible names', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            ariaLabel: '查漏补缺分类',
            gap: 'compact',
            typography: 'compact',
            items: [
                { id: 'sentences', label: '句子错题本' },
                { id: 'words', label: '单词错题本' },
            ],
            semantics: 'filter',
            size: 'compact',
            value: 'words',
            variant: 'underline',
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(markup, /role="group"/)
    assert.match(markup, /aria-label="查漏补缺分类"/)
    assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1)
    assert.equal((markup.match(/aria-pressed="false"/g) ?? []).length, 1)
    assert.doesNotMatch(markup, /role="tab"/)
})

test('display filter keeps one controlled selection and omits panel relationships', (): void => {
    const render = (value: string): string =>
        renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                activeTextTone: 'accent-green',
                ariaLabel: '课程分类',
                gap: 'spacious',
                indicatorTone: 'accent-green',
                indicatorWidth: 48,
                items: [
                    { id: 'all', label: '全部' },
                    { id: 'first', label: '分类1' },
                ],
                semantics: 'filter',
                size: 'compact',
                typography: 'display',
                value,
                variant: 'underline',
                onValueChange: (): void => undefined,
            }),
        )
    for (const value of ['all', 'first']) {
        const markup = render(value)
        assert.match(
            markup,
            /role="group" aria-label="课程分类"|aria-label="课程分类"[^>]*role="group"/,
        )
        assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1)
        assert.equal((markup.match(/aria-pressed="false"/g) ?? []).length, 1)
        assert.match(markup, /全部/)
        assert.match(markup, /分类1/)
        assert.doesNotMatch(markup, /aria-controls=|role="tab"/)
    }
})

test('中性分段外观保留受控选中与面板关联', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldSegmentedTabs, {
            appearance: 'neutral',
            ariaLabel: '购买周期',
            items,
            value: 'second',
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(markup, /role="tablist"/)
    assert.match(markup, /aria-label="购买周期"/)
    assert.match(markup, /aria-controls="first-panel"[^>]*aria-selected="false"/)
    assert.match(markup, /aria-controls="second-panel"[^>]*aria-selected="true"/)
})

test('regular underline tabs retain accessible names and controlled panel relationships', (): void => {
    const regularItems = [
        { id: 'other', label: '其他兑换', panelId: 'other-panel' },
        { id: 'benefits', label: '权益兑换', panelId: 'benefits-panel' },
        { id: 'records', label: '兑换记录', panelId: 'records-panel' },
    ]
    for (const selected of regularItems) {
        const markup = renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                ariaLabel: '兑换类型',
                gap: 'spread',
                indicatorWidth: 35,
                items: regularItems,
                layout: 'content',
                showBaseline: false,
                size: 'compact',
                typography: 'regular',
                value: selected.id,
                variant: 'underline',
                onValueChange: (): void => undefined,
            }),
        )
        assert.match(markup, /aria-label="兑换类型"/)
        assert.equal((markup.match(/role="tab"/g) ?? []).length, 3)
        assert.equal((markup.match(/aria-selected="true"/g) ?? []).length, 1)
        assert.match(
            markup,
            new RegExp(`aria-controls="${selected.panelId}"[^>]*aria-selected="true"`),
        )
        for (const item of regularItems) assert.match(markup, new RegExp(`>${item.label}</span>`))
    }
})

test('outlined segmented filter keeps exactly one controlled metric and accessible labels', (): void => {
    for (const value of ['wins', 'games', 'rate']) {
        const html = renderToStaticMarkup(
            createElement(TldSegmentedTabs, {
                appearance: 'outlined',
                ariaLabel: 'PK排行指标',
                semantics: 'filter',
                value,
                items: [
                    { id: 'wins', label: '胜利榜' },
                    { id: 'games', label: '场数榜' },
                    { id: 'rate', label: '胜率榜' },
                ],
                onValueChange: (): void => undefined,
            }),
        )
        assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
        assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 2)
        assert.match(html, /aria-label="PK排行指标"/)
        assert.doesNotMatch(html, /aria-controls=|role="tab"/)
    }
})
