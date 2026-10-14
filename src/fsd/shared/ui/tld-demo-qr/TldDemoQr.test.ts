import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldDemoQr } from './TldDemoQr'

test('示例二维码支持两个真实槽位并明确描述示例状态', (): void => {
    for (const [size, dimension] of [
        ['small', 80],
        ['medium', 130],
    ] as const) {
        const html = renderToStaticMarkup(createElement(TldDemoQr, { label: '玩家俱乐部', size }))
        assert.match(html, new RegExp('width="' + dimension + '"'))
        assert.match(html, new RegExp('height="' + dimension + '"'))
        assert.match(html, /玩家俱乐部设计示例二维码，暂未接入真实服务/)
    }
})
