import assert from 'node:assert/strict'
import test from 'node:test'
import { appendCardSwapSample, getCardSwapRelease, getCardSwapVelocity } from './card-swap-gesture'
import type { CardSwapPointerSample } from './card-swap-gesture'

test('CardSwap八个方向使用原版二维距离和投射方向，均只表达前进', (): void => {
    for (const [x, y] of [
        [200, 0],
        [-200, 0],
        [0, 200],
        [0, -200],
        [120, 120],
        [-120, 120],
        [120, -120],
        [-120, -120],
    ] as const) {
        const result = getCardSwapRelease({ x, y }, { x: 0, y: 0 }, 500, 500, false)
        assert.equal(result.advance, true)
        assert.equal(Math.sign(result.direction.x), Math.sign(x))
        assert.equal(Math.sign(result.direction.y), Math.sign(y))
        assert.ok(Math.abs(Math.hypot(result.direction.x, result.direction.y) - 1) < 0.000001)
    }
})

test('八方向80px轻甩即使只有一次move也能从down/up采样识别', (): void => {
    for (let angle = 0; angle < 360; angle += 45) {
        const point = {
            x: 80 * Math.cos((angle * Math.PI) / 180),
            y: 80 * Math.sin((angle * Math.PI) / 180),
        }
        let samples: CardSwapPointerSample[] = [{ x: 0, y: 0, t: 0 }]
        samples = appendCardSwapSample(samples, { ...point, t: 20 })
        samples = appendCardSwapSample(samples, { ...point, t: 40 })
        const velocity = getCardSwapVelocity(samples)
        assert.ok(Math.hypot(velocity.x, velocity.y) > 700)
        assert.equal(getCardSwapRelease(point, velocity, 500, 500, false).advance, true)
    }
})

test('松手坐标计入最终位移，短拖停顿不会沿用陈旧高速', (): void => {
    let samples: CardSwapPointerSample[] = [{ x: 0, y: 0, t: 0 }]
    samples = appendCardSwapSample(samples, { x: 30, y: 0, t: 20 })
    samples = appendCardSwapSample(samples, { x: 180, y: 0, t: 40 })
    const final = samples.at(-1)
    assert.ok(final)
    assert.equal(
        getCardSwapRelease(final, getCardSwapVelocity(samples), 500, 500, false).advance,
        true,
    )
    samples = appendCardSwapSample([{ x: 0, y: 0, t: 0 }], { x: 80, y: 0, t: 20 })
    samples = appendCardSwapSample(samples, { x: 80, y: 0, t: 320 })
    assert.deepEqual(getCardSwapVelocity(samples), { x: 0, y: 0 })
    assert.equal(
        getCardSwapRelease({ x: 80, y: 0 }, getCardSwapVelocity(samples), 500, 500, false).advance,
        false,
    )
})

test('稀疏轻甩刚跨90ms窗口仍保留位移锚点，长时间慢移不误切', (): void => {
    let samples = appendCardSwapSample([{ x: 0, y: 0, t: 0 }], { x: 80, y: 0, t: 80 })
    samples = appendCardSwapSample(samples, { x: 80, y: 0, t: 100 })
    const velocity = getCardSwapVelocity(samples)
    assert.ok(velocity.x > 700)
    assert.equal(getCardSwapRelease({ x: 80, y: 0 }, velocity, 500, 500, false).advance, true)
    const slow = appendCardSwapSample([{ x: 0, y: 0, t: 0 }], { x: 80, y: 0, t: 1000 })
    assert.ok(Math.abs(getCardSwapVelocity(slow).x - 80) < 0.000001)
})

test('合并和逐个送达的同轨迹样本一致，重复及迟到时间不污染速度', (): void => {
    const points = [
        { x: 0, y: 0, t: 0 },
        { x: 25, y: 15, t: 10 },
        { x: 50, y: 30, t: 20 },
        { x: 80, y: 50, t: 30 },
    ]
    let individual: CardSwapPointerSample[] = []
    for (const point of points) individual = appendCardSwapSample(individual, point)
    let merged = appendCardSwapSample([], points[0] ?? { x: 0, y: 0, t: 0 })
    for (const point of points.slice(1)) merged = appendCardSwapSample(merged, point)
    merged = appendCardSwapSample(merged, { x: 80, y: 50, t: 30 })
    merged = appendCardSwapSample(merged, { x: 999, y: 999, t: 5 })
    assert.deepEqual(getCardSwapVelocity(merged), getCardSwapVelocity(individual))
    assert.deepEqual(getCardSwapVelocity([]), { x: 0, y: 0 })
})

test('小距离全方向轻甩看二维速度，慢速短拖和取消保留回弹', (): void => {
    assert.equal(
        getCardSwapRelease({ x: 0, y: 20 }, { x: 0, y: 701 }, 500, 500, false).advance,
        true,
    )
    assert.equal(
        getCardSwapRelease({ x: 10, y: -10 }, { x: 500, y: -500 }, 500, 500, false).advance,
        true,
    )
    assert.equal(
        getCardSwapRelease({ x: 7, y: 12 }, { x: 40, y: 80 }, 500, 500, false).advance,
        false,
    )
    assert.equal(
        getCardSwapRelease({ x: 0, y: 150 }, { x: 0, y: 700 }, 500, 500, false).advance,
        false,
    )
    assert.equal(
        getCardSwapRelease({ x: 0, y: 151 }, { x: 0, y: 0 }, 600, 500, false).advance,
        true,
    )
    assert.equal(
        getCardSwapRelease({ x: 250, y: 0 }, { x: 900, y: 0 }, 500, 500, true).advance,
        false,
    )
})
