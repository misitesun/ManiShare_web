import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldDialog } from './TldDialog'

test('包括宽弹窗和自定义底部在内，预渲染不访问浏览器也不提前输出 Portal', (): void => {
    for (const size of [
        'small',
        'medium',
        'large',
        'extra-large',
        'fit-medium',
        'fit-wide',
    ] as const) {
        const html = renderToStaticMarkup(
            createElement(TldDialog, {
                open: true,
                size,
                title: '创建房间',
                showCloseButton: false,
                closeOnBackdrop: false,
                closeOnEscape: false,
                density: 'compact',
                titleAlignment: 'center',
                footer: createElement('button', { type: 'button' }, '立即创建'),
                onOpenChange: (): void => undefined,
            }),
        )
        assert.equal(html, '')
    }
    assert.equal(
        renderToStaticMarkup(
            createElement(TldDialog, {
                open: false,
                title: '关闭的弹窗',
                footer: null,
                onOpenChange: (): void => undefined,
            }),
        ),
        '',
    )
})
