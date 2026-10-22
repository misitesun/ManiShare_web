import assert from 'node:assert/strict'
import test from 'node:test'
import type { TestContext } from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useSentenceListeningAdvance } from './useSentenceListeningAdvance'

type AdvanceInput = Parameters<typeof useSentenceListeningAdvance>[0]
type AdvanceController = ReturnType<typeof useSentenceListeningAdvance>

/** 仅取得真实 Hook 的事件回调；挂载后的 Effect 清理由运行时检查覆盖。 */
function renderController(input: AdvanceInput): AdvanceController {
    const result: { current: AdvanceController | null } = { current: null }
    function Probe(): ReactElement {
        result.current = useSentenceListeningAdvance(input)
        return createElement('span')
    }
    renderToStaticMarkup(createElement(Probe))
    assert.ok(result.current)
    return result.current
}

function fixture(
    context: TestContext,
    enabled = true,
): {
    readonly controller: AdvanceController
    readonly advances: string[]
    readonly visibility: { hidden: boolean }
} {
    context.mock.timers.enable({ apis: ['setTimeout'] })
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const visibility = { hidden: false }
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout },
    })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: visibility })
    context.after((): void => {
        controller.cancel()
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
        else Reflect.deleteProperty(globalThis, 'window')
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
        else Reflect.deleteProperty(globalThis, 'document')
    })
    const advances: string[] = []
    const controller = renderController({
        visitKey: 'current-visit',
        enabled,
        onAdvance(visitKey): void {
            advances.push(visitKey)
        },
    })
    return { controller, advances, visibility }
}

test('自动切题只从朗读真实结束开始等待，999ms不切题，1000ms切一次', (context): void => {
    const { controller, advances } = fixture(context)
    context.mock.timers.tick(2000)
    assert.deepEqual(advances, [], '没有收到 ended 时不得用估算时长自动切题')
    controller.schedule('current-visit')
    controller.schedule('current-visit')
    context.mock.timers.tick(999)
    assert.deepEqual(advances, [])
    context.mock.timers.tick(1)
    assert.deepEqual(advances, ['current-visit'])
    context.mock.timers.tick(1000)
    assert.deepEqual(advances, ['current-visit'], '重复 ended 不能创建并行切题任务')
})

test('手动切题不开启等待，朗读结束也不继续自动切题', (context): void => {
    const { controller, advances } = fixture(context, false)
    controller.schedule('current-visit')
    context.mock.timers.tick(2000)
    assert.deepEqual(advances, [])
})

test('等待期间手动接管同步取消，到原截止时间不能再多切一题', (context): void => {
    const { controller, advances } = fixture(context)
    controller.schedule('current-visit')
    context.mock.timers.tick(400)
    controller.cancel()
    context.mock.timers.tick(1000)
    assert.deepEqual(advances, [])
})

test('旧访问与隐藏的结束事件不推进，等待到期时隐藏也不推进', (context): void => {
    const { controller, advances, visibility } = fixture(context)
    controller.schedule('retired-visit')
    context.mock.timers.tick(1000)
    assert.deepEqual(advances, [])
    visibility.hidden = true
    controller.schedule('current-visit')
    context.mock.timers.tick(1000)
    assert.deepEqual(advances, [])
    visibility.hidden = false
    controller.schedule('current-visit')
    visibility.hidden = true
    context.mock.timers.tick(1000)
    assert.deepEqual(advances, [])
})
