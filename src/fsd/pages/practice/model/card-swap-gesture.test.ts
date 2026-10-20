import assert from 'node:assert/strict'
import test from 'node:test'
import {
    appendCardSwapSample,
    getCardSwapPointerEnd,
    getCardSwapRelease,
    getCardSwapVelocity,
} from './card-swap-gesture'
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

test('按下、首个移动与松手同时间戳时保留起点，轻甩无需等待下一次采样', (): void => {
    let samples = appendCardSwapSample([{ x: 0, y: 0, t: 100 }], { x: 80, y: 0, t: 100 })
    samples = appendCardSwapSample(samples, { x: 80, y: 0, t: 100 })
    assert.deepEqual(samples[0], { x: 0, y: 0, t: 100 })
    const velocity = getCardSwapVelocity(samples)
    assert.ok(velocity.x > 700)
    assert.equal(getCardSwapRelease({ x: 80, y: 0 }, velocity, 500, 500, false).advance, true)
    samples = appendCardSwapSample(samples, { x: 80, y: 0, t: 400 })
    assert.deepEqual(getCardSwapVelocity(samples), { x: 0, y: 0 })
})

test('速度投影恰好抵消位移时仍保留有效退出方向', (): void => {
    const release = getCardSwapRelease({ x: 240, y: 0 }, { x: -2000, y: 0 }, 500, 500, false)
    assert.equal(release.advance, true)
    assert.equal(Math.hypot(release.direction.x, release.direction.y), 1)
})

test('用户失败轨迹在按键已松开的capture-loss路径仍应切题，不能直接当取消', (): void => {
    const samples = [
        { x: 0, y: 0, t: 50419.5 },
        { x: 18.55078125, y: -5.0234375, t: 50434.2 },
        { x: 90.68359375, y: -24.47265625, t: 50471.3 },
        { x: 139.5234375, y: -37.0859375, t: 50486.5 },
        { x: 168.75390625, y: -43.484375, t: 50499 },
        { x: 261.71875, y: -65.10546875, t: 50517.5 },
    ]
    const end = getCardSwapPointerEnd({
        source: 'capture-loss',
        buttons: 0,
        sample: { x: -500, y: -500, t: 50520 },
        samples,
    })
    assert.equal(end.cancelled, false)
    assert.deepEqual(end.sample, { x: 261.71875, y: -65.10546875, t: 50520 })
    const completeSamples = appendCardSwapSample(samples, end.sample)
    const velocity = getCardSwapVelocity(completeSamples)
    assert.ok(Math.hypot(velocity.x, velocity.y) > 700)
    assert.equal(getCardSwapRelease(end.sample, velocity, 500, 500, end.cancelled).advance, true)
})

test('按键仍按住的capture-loss和pointercancel都保留取消，不因大位移误切', (): void => {
    const samples = [
        { x: 0, y: 0, t: 0 },
        { x: 260, y: 0, t: 40 },
    ]
    for (const event of [
        { source: 'capture-loss', buttons: 1 },
        { source: 'cancel', buttons: 0 },
    ] as const) {
        const end = getCardSwapPointerEnd({
            ...event,
            sample: { x: 260, y: 0, t: 45 },
            samples,
        })
        assert.equal(end.cancelled, true)
        assert.equal(
            getCardSwapRelease(end.sample, getCardSwapVelocity(samples), 500, 500, end.cancelled)
                .advance,
            false,
        )
    }
})

test('正常松手使用最终坐标，迟到松手样本不能把已经收到的轨迹倒退', (): void => {
    const samples = [
        { x: 0, y: 0, t: 0 },
        { x: 80, y: 0, t: 20 },
    ]
    assert.deepEqual(
        getCardSwapPointerEnd({
            source: 'release',
            buttons: 0,
            sample: { x: 180, y: 0, t: 40 },
            samples,
        }),
        { sample: { x: 180, y: 0, t: 40 }, cancelled: false },
    )
    assert.deepEqual(
        getCardSwapPointerEnd({
            source: 'release',
            buttons: 0,
            sample: { x: 0, y: 0, t: 10 },
            samples,
        }),
        { sample: { x: 80, y: 0, t: 20 }, cancelled: false },
    )
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
