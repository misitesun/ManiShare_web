import assert from 'node:assert/strict'
import test from 'node:test'
import { getGoldVipPlan, lifetimeVipPlan } from './vip-plan-content'

const cases = [
    {
        cycle: 'week',
        label: '周卡',
        frequency: '发放',
        crystals: '1000',
        practice: '100',
        reward: '10%分享',
    },
    {
        cycle: 'month',
        label: '月卡',
        frequency: '月发',
        crystals: '6000',
        practice: '300',
        reward: '20%分享',
    },
    {
        cycle: 'quarter',
        label: '季卡',
        frequency: '月发',
        crystals: '8000',
        practice: '800',
        reward: '25%分享',
    },
    {
        cycle: 'year',
        label: '年卡',
        frequency: '月发',
        crystals: '10000',
        practice: '3000',
        reward: '30%分享',
    },
] as const

for (const expected of cases) {
    test(`${expected.label}同步对应权益，价格保留设计稿原值`, () => {
        const plan = getGoldVipPlan(expected.cycle)
        assert.deepEqual(plan.benefitItems[2], {
            prefix: `创课魔晶：${expected.frequency}`,
            highlight: expected.crystals,
            suffix: '魔晶，创作个人AI课程（敬请期待）',
        })
        assert.equal(plan.benefitItems[3]?.highlight, expected.practice)
        assert.equal(plan.bonusItems[0]?.prefix, `伴学服务：${expected.label}期内`)
        assert.equal(plan.bonusItems[1]?.highlight, expected.reward)
        assert.equal(plan.currentPrice, '199')
        assert.equal(plan.originalPrice, '原价¥399')
        assert.equal(plan.priceSuffix, '/年')
        assert.equal(plan.dealText, '相当于每天仅¥0.54')
    })
}

test('任意顺序读取周期后，切回周卡不会残留其他周期权益', () => {
    const original = getGoldVipPlan('week')
    getGoldVipPlan('year')
    getGoldVipPlan('month')
    getGoldVipPlan('quarter')
    assert.deepEqual(getGoldVipPlan('week'), original)
})

test('终身卡独立保留价格、无限次评测和附赠权益', () => {
    assert.equal(lifetimeVipPlan.currentPrice, '699')
    assert.equal(lifetimeVipPlan.priceSuffix, '/终身')
    assert.equal(lifetimeVipPlan.benefitItems[2]?.highlight, '12000')
    assert.equal(lifetimeVipPlan.benefitItems[3]?.highlight, '无限次')
    assert.equal(lifetimeVipPlan.bonusItems[0]?.prefix, '伴学服务：赠送')
    assert.equal(lifetimeVipPlan.bonusItems[1]?.highlight, '40%分享')
})
