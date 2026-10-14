import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { VipStewardQr } from './VipStewardQr'

test('VIP小管家触发入口具备可访问名称，预渲染默认不展示二维码浮层', (): void => {
    const html = renderToStaticMarkup(createElement(VipStewardQr))
    assert.match(html, /<button[^>]*type="button"[^>]*aria-label="VIP小管家二维码"/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /<img[^>]*aria-hidden="true"/)
    assert.doesNotMatch(html, /role="region"|aria-controls=|微信扫码添加|设计示例二维码/)
})
