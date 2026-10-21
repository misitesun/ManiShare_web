import assert from 'node:assert/strict'
import test from 'node:test'
import { createPracticeAnswerFocusRequest } from './practice-answer-focus'

function createFixture(): {
    readonly frames: Map<number, () => void>
    readonly focused: string[]
    readonly request: ReturnType<typeof createPracticeAnswerFocusRequest>
    readonly setAllowed: (value: boolean) => void
    readonly setTarget: (value: string) => void
} {
    const frames = new Map<number, () => void>()
    const focused: string[] = []
    let sequence = 0
    let allowed = true
    let target = '原输入框'
    const request = createPracticeAnswerFocusRequest({
        canFocus: (): boolean => allowed,
        focus: (): void => {
            focused.push(target)
        },
        schedule: (callback): number => {
            const frame = ++sequence
            frames.set(frame, callback)
            return frame
        },
        cancelFrame: (frame): void => {
            frames.delete(frame)
        },
    })
    return {
        frames,
        focused,
        request,
        setAllowed: (value): void => {
            allowed = value
        },
        setTarget: (value): void => {
            target = value
        },
    }
}

test('设置修改不立即抢焦点，等控件提交／还焦后使用当前输入器', (): void => {
    const fixture = createFixture()
    fixture.request.request()
    assert.deepEqual(fixture.focused, [])
    fixture.setTarget('设置提交后的输入框')
    const callback = fixture.frames.get(1)
    assert.ok(callback)
    callback()
    assert.deepEqual(fixture.focused, ['设置提交后的输入框'])
})

test('连续改设置合并归焦请求，已经取消的回调也不能恢复旧焦点', (): void => {
    const fixture = createFixture()
    fixture.request.request()
    const stale = fixture.frames.get(1)
    assert.ok(stale)
    fixture.request.request()
    assert.equal(fixture.frames.has(1), false)
    stale()
    assert.deepEqual(fixture.focused, [])
    const latest = fixture.frames.get(2)
    assert.ok(latest)
    latest()
    assert.deepEqual(fixture.focused, ['原输入框'])
})

test('执行时重新检查弹窗／暂停／只读门控，解锁后只执行新请求', (): void => {
    const fixture = createFixture()
    fixture.request.request()
    fixture.setAllowed(false)
    const blocked = fixture.frames.get(1)
    assert.ok(blocked)
    blocked()
    assert.deepEqual(fixture.focused, [])
    fixture.setAllowed(true)
    fixture.request.request()
    const resumed = fixture.frames.get(2)
    assert.ok(resumed)
    resumed()
    assert.deepEqual(fixture.focused, ['原输入框'])
})

test('卸载取消计划帧，晚到的回调不能再获取焦点', (): void => {
    const fixture = createFixture()
    fixture.request.request()
    const stale = fixture.frames.get(1)
    assert.ok(stale)
    fixture.request.cancel()
    assert.equal(fixture.frames.size, 0)
    stale()
    assert.deepEqual(fixture.focused, [])
})
