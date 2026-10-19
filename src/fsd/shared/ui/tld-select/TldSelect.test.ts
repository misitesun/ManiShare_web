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

test('practice select renders a caller-controlled open menu and selected radio item', (): void => {
    let openChanges = 0
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '排序',
            value: 'random',
            size: 'practice',
            open: true,
            options: [
                { value: 'normal', label: '正序' },
                { value: 'random', label: '乱序' },
                { value: 'alphabetical', label: 'A-Z' },
            ],
            onValueChange: (): void => undefined,
            onOpenChange: (): void => {
                openChanges += 1
            },
        }),
    )
    assert.match(html, /aria-label="排序：乱序"/)
    assert.match(html, /aria-expanded="true"/)
    assert.match(html, /aria-hidden="false"/)
    assert.doesNotMatch(html, /inert=""/)
    assert.match(html, /role="menuitemradio" aria-checked="true"/)
    assert.equal(openChanges, 0, '服务端渲染不应通知展开变化')
})

test('externally closed practice select keeps menu inert and exposes no controlled side effect', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '中英显示',
            value: 'both',
            size: 'practice',
            open: false,
            options: [{ value: 'both', label: '中英显示' }],
            onValueChange: (): void => undefined,
            onOpenChange: (): void => assert.fail('服务端渲染不应回写展开状态'),
        }),
    )
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /inert=""/)
    assert.match(html, /aria-hidden="true"/)
})

test('content layout provides intrinsic practice trigger width with symmetric padding', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '显示方式',
            value: 'both',
            size: 'practice',
            layout: 'content',
            options: [{ value: 'both', label: '中英显示' }],
            onValueChange: (): void => assert.fail('预渲染不得提交选择'),
        }),
    )
    assert.match(html, /class="relative inline-flex w-max shrink-0"/)
    const trigger = /<button\b[^>]*aria-label="显示方式：中英显示"[^>]*>/.exec(html)?.[0]
    assert.ok(trigger)
    assert.match(trigger, /\bw-max\b/)
    assert.match(trigger, /\bpx-1\b/)
    assert.match(trigger, /\bmin-h-10\b/)
    assert.match(trigger, /text-\[14px\] leading-5/)
})

test('portal menu prerenders deterministically without touching document or notifying callbacks', (): void => {
    function renderPortal(): string {
        return renderToStaticMarkup(
            createElement(TldSelect, {
                label: '音标方案',
                value: 'original',
                size: 'practice',
                layout: 'content',
                menuPosition: 'portal',
                open: true,
                options: [{ value: 'original', label: '原始音标' }],
                onValueChange: (): void => assert.fail('预渲染不得提交选择'),
                onOpenChange: (): void => assert.fail('预渲染不得通知展开状态'),
            }),
        )
    }
    const html = renderPortal()
    assert.equal(renderPortal(), html)
    assert.match(html, /aria-label="音标方案：原始音标"/)
    assert.match(html, /aria-expanded="true"/)
    assert.doesNotMatch(html, /role="menu"/)
    assert.doesNotMatch(html, /aria-controls=/)
})

test('default layout and inline menu retain the existing full width contract', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldSelect, {
            label: '排序',
            value: 'normal',
            size: 'practice',
            options: [{ value: 'normal', label: '正序' }],
            onValueChange: (): void => undefined,
        }),
    )
    assert.match(html, /class="relative w-full"/)
    assert.match(html, /data-select-menu-position="inline"/)
    assert.match(html, /min-h-10 w-full/)
    assert.match(html, /\bpl-1\b/)
    assert.doesNotMatch(html, /data-select-menu-position="portal"/)
})
