import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { VipTrialPanel } from './VipTrialPanel'

function renderTrial(claimed: boolean): string {
    return renderToStaticMarkup(
        createElement(VipTrialPanel, { claimed, onClaim: (): void => undefined }),
    )
}

function findButton(html: string, label: string): string {
    const button = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].find((match) =>
        match[0].includes(label),
    )
    assert.ok(button, `缺少按钮：${label}`)
    return button[0]
}

test('未领取体验卡展示可用领取按钮，人数和时长保持设计静态值', (): void => {
    const html = renderTrial(false)
    assert.doesNotMatch(findButton(html, '领取体验卡'), /disabled=/)
    assert.doesNotMatch(findButton(html, '获得分享链接'), /disabled=/)
    assert.match(html, /0人/)
    assert.match(html, /体验时长：0天00:00:00/)
    assert.doesNotMatch(html, /已领取|立即续费/)
})

test('已领取只禁用体验领取，分享卡和其余权益保持展示', (): void => {
    const html = renderTrial(true)
    assert.match(findButton(html, '已领取'), /disabled=""/)
    assert.doesNotMatch(findButton(html, '获得分享链接'), /disabled=/)
    assert.match(html, /时长不限：告别免费版每天时长限制/)
    assert.match(html, /分享获时长：分享1人注册/)
    assert.equal([...html.matchAll(/微信扫码加入/g)].length, 2)
})
