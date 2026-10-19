import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldDialog } from './TldDialog'
import { TldDialogMotionProvider } from './TldDialogMotionProvider'

test('包括宽弹窗和自定义底部在内，预渲染不访问浏览器也不提前输出 Portal', (): void => {
    for (const size of [
        'small',
        'medium',
        'large',
        'extra-large',
        'fit-medium',
        'fit-wide',
        'fit-extra-wide',
        'full',
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
                referenceFrame: { width: 820, offsetX: 1, offsetY: -42 },
                surface: 'solid',
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

test('动画作用域含嵌套弹窗时预渲染仍不输出Portal，也不提前调用关闭完成', (): void => {
    let closed = 0
    for (const open of [false, true]) {
        const html = renderToStaticMarkup(
            createElement(TldDialogMotionProvider, {
                children: createElement(TldDialog, {
                    open,
                    title: '练习设置',
                    onOpenChange: (): void => undefined,
                    onAfterClose: (): void => {
                        closed += 1
                    },
                    children: createElement(TldDialog, {
                        open: true,
                        title: '嵌套颜色',
                        onOpenChange: (): void => undefined,
                    }),
                }),
            }),
        )
        assert.equal(html, '')
    }
    assert.equal(closed, 0)
})
