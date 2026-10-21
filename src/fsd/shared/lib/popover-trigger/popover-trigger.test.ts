import assert from 'node:assert/strict'
import test from 'node:test'
import { createPopoverTrigger, POPOVER_LEAVE_DELAY } from './popover-trigger'

function fixture(hover = true): {
    readonly trigger: ReturnType<typeof createPopoverTrigger>
    readonly values: boolean[]
    readonly frames: Map<number, () => void>
    readonly setFocused: (focused: boolean) => void
    readonly inside: EventTarget
} {
    let open = false
    let focused = false
    let sequence = 0
    const inside = new EventTarget()
    const values: boolean[] = []
    const frames = new Map<number, () => void>()
    const trigger = createPopoverTrigger({
        canHover: (): boolean => hover,
        isOpen: (): boolean => open,
        setOpen: (value): void => {
            open = value
            values.push(value)
        },
        contains: (target): boolean => target === inside,
        hasFocusWithin: (): boolean => focused,
        schedule: (callback, delay): number => {
            assert.equal(delay, POPOVER_LEAVE_DELAY)
            const frame = ++sequence
            frames.set(frame, callback)
            return frame
        },
        cancelFrame: (frame): void => {
            frames.delete(frame)
        },
    })
    return {
        trigger,
        values,
        frames,
        inside,
        setFocused: (value): void => {
            focused = value
        },
    }
}

test('仅桌面能力加鼠标可hover展开且不抢焦点；触控和窄视口保留点击与键盘', (): void => {
    const pc = fixture()
    pc.trigger.enter('mouse')
    assert.deepEqual(pc.values, [true])
    assert.equal(pc.trigger.shouldFocusOnOpen(), false)
    for (const [hover, pointer] of [
        [false, 'mouse'],
        [false, 'touch'],
        [true, 'touch'],
        [true, 'pen'],
    ] as const) {
        const view = fixture(hover)
        view.trigger.enter(pointer)
        assert.deepEqual(view.values, [])
        view.trigger.toggle()
        assert.deepEqual(view.values, [true])
        assert.equal(view.trigger.shouldFocusOnOpen(), true)
        view.trigger.toggle()
        view.trigger.openByKeyboard()
        assert.deepEqual(view.values, [true, false, true])
    }
})

test('跨入Root或Portal不关闭，跨越间隙后进入菜单取消旧回调', (): void => {
    const view = fixture()
    view.trigger.enter('mouse')
    view.trigger.leave('mouse', view.inside)
    assert.equal(view.frames.size, 0)
    view.trigger.leave('mouse', null)
    const stale = view.frames.get(1)
    assert.ok(stale)
    view.trigger.enter('mouse')
    stale()
    assert.deepEqual(view.values, [true])
    view.trigger.leave('mouse', null)
    const close = view.frames.get(2)
    assert.ok(close)
    close()
    assert.deepEqual(view.values, [true, false])
})

test('菜单内键盘焦点不因鼠标移开被打断；取消后晚到回调不关闭菜单', (): void => {
    const view = fixture()
    view.trigger.openByKeyboard()
    view.setFocused(true)
    view.trigger.leave('mouse', null)
    const focusProtected = view.frames.get(1)
    assert.ok(focusProtected)
    focusProtected()
    assert.deepEqual(view.values, [true])
    view.setFocused(false)
    view.trigger.leave('mouse', null)
    const unmounted = view.frames.get(2)
    assert.ok(unmounted)
    view.trigger.cancel()
    unmounted()
    assert.deepEqual(view.values, [true])
})

test('混合设备转用触摸进入菜单时取消鼠标离开计划，但不触发hover展开', (): void => {
    const view = fixture()
    view.trigger.enter('mouse')
    view.trigger.leave('mouse', null)
    const stale = view.frames.get(1)
    assert.ok(stale)
    view.trigger.enter('touch')
    stale()
    assert.deepEqual(view.values, [true])
    assert.equal(view.frames.size, 0)
})
