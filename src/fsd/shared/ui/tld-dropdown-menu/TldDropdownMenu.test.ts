import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldDropdownMenu } from './TldDropdownMenu'

test('action dropdown has a named native trigger and deterministic closed SSR without DOM portals', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldDropdownMenu, {
            label: '更多操作',
            trigger: '⋯',
            items: [{ id: 'settings', label: '设置' }],
            onAction: (): void => undefined,
        }),
    )
    assert.match(html, /aria-label="更多操作"/)
    assert.match(html, /aria-haspopup="menu"/)
    assert.match(html, /aria-expanded="false"/)
    assert.doesNotMatch(html, /role="menuitemradio"|aria-checked|role="menu"/)
})

test('an empty action list disables its trigger and emits no action or open side effects during SSR', (): void => {
    let calls = 0
    const html = renderToStaticMarkup(
        createElement(TldDropdownMenu, {
            label: '更多操作',
            trigger: '⋯',
            items: [],
            open: true,
            onAction: (): void => {
                calls += 1
            },
            onOpenChange: (): void => {
                calls += 1
            },
        }),
    )
    assert.match(html, /disabled=""/)
    assert.match(html, /aria-expanded="false"/)
    assert.equal(calls, 0)
})

test('controlled open state is serialized without creating a server Portal or executing callbacks', (): void => {
    let calls = 0
    const html = renderToStaticMarkup(
        createElement(TldDropdownMenu, {
            label: '更多操作',
            trigger: '⋯',
            items: [{ id: 'draft', label: '草稿' }],
            open: true,
            onAction: (): void => {
                calls += 1
            },
            onOpenChange: (): void => {
                calls += 1
            },
        }),
    )
    assert.match(html, /aria-expanded="true"/)
    assert.doesNotMatch(html, /role="menu"/)
    assert.equal(calls, 0)
})
