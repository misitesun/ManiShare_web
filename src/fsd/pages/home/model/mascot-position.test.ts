import assert from 'node:assert/strict'
import test from 'node:test'
import { constrainMascot, isMascotDrag, mascotGreetingPosition } from './mascot-position'

const bounds = { left: 12, top: 12, width: 1416, height: 876 }

test('云朵可放到页面任何可见位置，四边及缩小窗口后均限制在边界内', (): void => {
    assert.deepEqual(constrainMascot({ x: 500, y: 300 }, bounds), { x: 500, y: 300 })
    assert.deepEqual(constrainMascot({ x: -200, y: -100 }, bounds), { x: 12, y: 12 })
    assert.deepEqual(constrainMascot({ x: 2000, y: 1000 }, bounds), { x: 1358, y: 818 })
    assert.deepEqual(
        constrainMascot({ x: 1358, y: 818 }, { left: 12, top: 12, width: 366, height: 820 }),
        { x: 308, y: 762 },
    )
    assert.deepEqual(
        constrainMascot({ x: 100, y: 100 }, { left: 12, top: 12, width: 40, height: 40 }),
        { x: 12, y: 12 },
    )
})

test('两行提示居中放在云朵上方，靠近顶边改到下方，左右和窄屏不越界', (): void => {
    assert.deepEqual(mascotGreetingPosition({ x: 500, y: 300 }, bounds), {
        x: 359,
        y: 226,
        width: 352,
    })
    assert.deepEqual(mascotGreetingPosition({ x: 12, y: 12 }, bounds), {
        x: 12,
        y: 92,
        width: 352,
    })
    assert.equal(mascotGreetingPosition({ x: 1358, y: 818 }, bounds).x, 1076)
    assert.deepEqual(
        mascotGreetingPosition({ x: 12, y: 12 }, { left: 12, top: 12, width: 296, height: 500 }),
        { x: 12, y: 92, width: 296 },
    )
})

test('轻点的微小位移不被当成拖动，真正移动后抑制点击提示', (): void => {
    assert.equal(isMascotDrag({ x: 10, y: 10 }, { x: 12, y: 12 }), false)
    assert.equal(isMascotDrag({ x: 10, y: 10 }, { x: 14, y: 10 }), true)
    assert.equal(isMascotDrag({ x: 10, y: 10 }, { x: 7, y: 7 }), true)
})
