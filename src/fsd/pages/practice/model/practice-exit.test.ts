import assert from 'node:assert/strict'
import test from 'node:test'
import { createPracticeExitFlow } from './practice-exit'

test('关闭前不执行导航；退场期间首个动作生效，重复关闭或选择不改变去向', (): void => {
    const flow = createPracticeExitFlow()
    assert.equal(flow.complete(), null)
    assert.equal(flow.request('course'), true)
    assert.equal(flow.request('home'), false)
    assert.equal(flow.request('continue'), false)
    assert.equal(flow.complete(), 'course')
    assert.equal(flow.complete(), null)
})

test('取消并关闭后可再次选择目的地；同步退场也只消费一次意图', (): void => {
    const flow = createPracticeExitFlow()
    for (const action of ['continue', 'home', 'course', 'continue'] as const) {
        assert.equal(flow.request(action), true)
        assert.equal(flow.complete(), action)
        assert.equal(flow.complete(), null)
    }
})
