import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PromotionRevenuePage } from './PromotionRevenuePage'

test('免费体验只显示资格提示，不挂载推广信息、操作、页签和记录', (): void => {
    const html = renderToStaticMarkup(createElement(PromotionRevenuePage, { isFreeTrial: true }))
    assert.match(html, /温馨提示/)
    assert.match(html, /亲爱的小伙伴，未开通畅学卡，暂时无法获得推广奖励/)
    assert.match(html, /<img/)
    assert.doesNotMatch(html, /我的邀请链接|邀请码|可提现|立即提现|VIP会员/)
    assert.doesNotMatch(html, /role="tablist"|role="tabpanel"|<table|<button/)
    assert.doesNotMatch(html, /1409238906|150567834560|12345678/)
})

test('明确非免费体验及默认演示入口展示概览，初始选择佣金明细', (): void => {
    for (const props of [{ isFreeTrial: false }, {}]) {
        const html = renderToStaticMarkup(createElement(PromotionRevenuePage, props))
        assert.match(html, /我的邀请链接/)
        assert.match(html, /复制邀请链接/)
        assert.match(html, /立即提现/)
        assert.match(html, /aria-label="推广收益明细类型"/)
        assert.match(
            html,
            /aria-controls="promotion-revenue-commission-panel"[^>]*aria-selected="true"/,
        )
        assert.match(html, /aria-label="佣金明细" role="tabpanel"/)
        assert.match(html, /1409238906/)
        assert.doesNotMatch(html, /我的推广链接|复制推广链接|未开通畅学卡/)
    }
})
