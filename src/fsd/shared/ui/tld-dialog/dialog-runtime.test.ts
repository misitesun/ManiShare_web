import assert from 'node:assert/strict'
import test from 'node:test'
import { createDialogLayerRuntime } from './dialog-runtime'

interface TestLayer {
    readonly id: string
    inert: boolean
    readonly style: { zIndex: string }
}

function element(id: string, inert = false): TestLayer {
    return { id, inert, style: { zIndex: '' } }
}

test('嵌套子窗关闭前保持页面锁定，最后一层清理恢复原滚动和已有 inert', (): void => {
    const app = element('app')
    const preserved = element('preserved', true)
    const settings = element('settings')
    const color = element('color')
    const elements = [app, preserved, settings]
    let overflow = 'clip'
    const runtime = createDialogLayerRuntime<TestLayer>({
        elements: (): readonly TestLayer[] => elements,
        getOverflow: (): string => overflow,
        setOverflow: (value): void => {
            overflow = value
        },
        contains: (container, target): boolean => container.id === target.id,
    })

    const closeSettings = runtime.register(settings)
    assert.equal(overflow, 'hidden')
    assert.equal(app.inert, true)
    assert.equal(settings.inert, false)
    assert.equal(runtime.canRestoreFocus(app), false)
    elements.push(color)
    const closeColor = runtime.register(color)
    assert.equal(settings.inert, true)
    assert.equal(color.inert, false)
    assert.equal(runtime.isTop(settings), false)
    assert.equal(runtime.isTop(color), true)
    assert.equal(Number(color.style.zIndex) > Number(settings.style.zIndex), true)

    assert.equal(closeColor(), true)
    assert.equal(overflow, 'hidden')
    assert.equal(settings.inert, false)
    assert.equal(runtime.canRestoreFocus(settings), true)
    assert.equal(runtime.canRestoreFocus(app), false)
    assert.equal(closeSettings(), true)
    assert.equal(overflow, 'clip')
    assert.equal(app.inert, false)
    assert.equal(preserved.inert, true)
    assert.equal(runtime.canRestoreFocus(app), true)
})

test('父窗提前卸载不解锁页面或抢占子窗焦点，重复清理不覆盖恢复结果', (): void => {
    const parent = element('parent')
    const child = element('child')
    let overflow = 'auto'
    const runtime = createDialogLayerRuntime<TestLayer>({
        elements: (): readonly TestLayer[] => [parent, child],
        getOverflow: (): string => overflow,
        setOverflow: (value): void => {
            overflow = value
        },
        contains: (container, target): boolean => container.id === target.id,
    })
    const closeParent = runtime.register(parent)
    const closeChild = runtime.register(child)
    assert.equal(closeParent(), false)
    assert.equal(overflow, 'hidden')
    assert.equal(runtime.canRestoreFocus(parent), false)
    assert.equal(runtime.isTop(child), true)
    assert.equal(closeChild(), true)
    assert.equal(overflow, 'auto')
    assert.equal(closeChild(), false)
    assert.equal(overflow, 'auto')
})
