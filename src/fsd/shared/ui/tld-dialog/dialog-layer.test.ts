import assert from 'node:assert/strict'
import test from 'node:test'
import { createDialogLayerStack } from './dialog-layer'

test('嵌套弹窗只有最上层接收关闭和焦点事件，关闭后恢复父层', (): void => {
    const stack = createDialogLayerStack<string>()
    stack.add('settings')
    stack.add('color')
    assert.equal(stack.isTop('settings'), false)
    assert.equal(stack.isTop('color'), true)
    assert.equal(stack.remove('color'), true)
    assert.equal(stack.isTop('settings'), true)
    assert.equal(stack.remove('settings'), true)
    assert.equal(stack.top(), undefined)
})

test('父层先卸载不改变子层优先级，重复注册和清理不制造遗留层', (): void => {
    const stack = createDialogLayerStack<string>()
    stack.add('settings')
    stack.add('shortcut')
    stack.add('shortcut')
    assert.deepEqual(stack.layers(), ['settings', 'shortcut'])
    assert.equal(stack.remove('settings'), false)
    assert.equal(stack.top(), 'shortcut')
    assert.equal(stack.remove('settings'), false)
    assert.equal(stack.remove('shortcut'), true)
    assert.deepEqual(stack.layers(), [])
})
