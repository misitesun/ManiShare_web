import assert from 'node:assert/strict'
import test from 'node:test'
import { getVipActionLabel, isVipBillingCycle } from './vip-membership'

test('周期守卫只接受页面支持的周期', () => {
    assert.equal(isVipBillingCycle('week'), true)
    assert.equal(isVipBillingCycle('month'), true)
    assert.equal(isVipBillingCycle('day'), false)
})

test('无有效会员时默认展示购买文案', () => {
    assert.equal(getVipActionLabel('gold', { activeProductIds: [] }), '立即购买')
})

test('已有对应会员时展示续费文案', () => {
    assert.equal(getVipActionLabel('gold', { activeProductIds: ['gold'] }), '立即续费')
    assert.equal(getVipActionLabel('lifetime', { activeProductIds: ['gold'] }), '立即购买')
})
