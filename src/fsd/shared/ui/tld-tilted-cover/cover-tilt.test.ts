import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    createCoverTiltController,
    getCoverTilt,
    restingCoverTilt,
    type CoverBounds,
    type CoverTilt,
} from './cover-tilt'

const bounds: CoverBounds = { left: 20, top: 40, width: 300, height: 200 }

test('cover center lifts without rotation and keeps glare centered', (): void => {
    assert.deepEqual(getCoverTilt(bounds, { x: 170, y: 140 }), {
        active: true,
        rotateX: 0,
        rotateY: 0,
        glareX: 50,
        glareY: 50,
        scale: 1.035,
    })
})

test('opposite cover corners tilt in opposite directions with bounded glare', (): void => {
    const topLeft = getCoverTilt(bounds, { x: 20, y: 40 })
    const bottomRight = getCoverTilt(bounds, { x: 320, y: 240 })
    assert.equal(topLeft.rotateX, 8)
    assert.equal(topLeft.rotateY, -8)
    assert.equal(topLeft.glareX, 0)
    assert.equal(topLeft.glareY, 0)
    assert.equal(bottomRight.rotateX, -8)
    assert.equal(bottomRight.rotateY, 8)
    assert.equal(bottomRight.glareX, 100)
    assert.equal(bottomRight.glareY, 100)
    const topRight = getCoverTilt(bounds, { x: 320, y: 40 })
    const bottomLeft = getCoverTilt(bounds, { x: 20, y: 240 })
    assert.equal(topRight.rotateX, 8)
    assert.equal(topRight.rotateY, 8)
    assert.equal(bottomLeft.rotateX, -8)
    assert.equal(bottomLeft.rotateY, -8)
    assert.deepEqual(getCoverTilt(bounds, { x: 2000, y: 2000 }), bottomRight)
    assert.deepEqual(getCoverTilt(bounds, { x: -2000, y: -2000 }), topLeft)
})

test('zero, negative or non-finite measurements leave the cover still', (): void => {
    for (const next of [
        { ...bounds, width: 0 },
        { ...bounds, height: -1 },
        { ...bounds, left: Number.NaN },
        { ...bounds, width: Number.POSITIVE_INFINITY },
    ]) {
        assert.deepEqual(getCoverTilt(next, { x: 80, y: 90 }), restingCoverTilt)
    }
    assert.deepEqual(getCoverTilt(bounds, { x: Number.NaN, y: 90 }), restingCoverTilt)
})

function createDriver(): {
    readonly controller: ReturnType<typeof createCoverTiltController>
    readonly frames: Map<number, () => void>
    readonly applied: CoverTilt[]
    readonly cancelled: number[]
    readonly setBounds: (next: CoverBounds) => void
} {
    let sequence = 0
    let currentBounds = bounds
    const frames = new Map<number, () => void>()
    const applied: CoverTilt[] = []
    const cancelled: number[] = []
    const controller = createCoverTiltController({
        measure: () => currentBounds,
        apply: (tilt): void => {
            applied.push(tilt)
        },
        requestFrame: (callback): number => {
            sequence += 1
            frames.set(sequence, callback)
            return sequence
        },
        cancelFrame: (id): void => {
            cancelled.push(id)
        },
    })
    return {
        controller,
        frames,
        applied,
        cancelled,
        setBounds(next): void {
            currentBounds = next
        },
    }
}

test('pointer bursts submit only their last position on the next frame', (): void => {
    const driver = createDriver()
    driver.controller.move({ x: 20, y: 40 })
    driver.controller.move({ x: 320, y: 240 })
    assert.equal(driver.frames.size, 1)
    assert.equal(driver.applied.length, 0)
    driver.frames.get(1)?.()
    assert.deepEqual(driver.applied, [getCoverTilt(bounds, { x: 320, y: 240 })])
})

test('each frame measures the stable cover slot after layout changes', (): void => {
    const driver = createDriver()
    driver.controller.move({ x: 170, y: 140 })
    const nextBounds = { ...bounds, left: 170, top: 140 }
    driver.setBounds(nextBounds)
    driver.frames.get(1)?.()
    assert.deepEqual(driver.applied, [getCoverTilt(nextBounds, { x: 170, y: 140 })])
})

test('leave cancels queued motion and ignores a late callback before reentry', (): void => {
    const driver = createDriver()
    driver.controller.move({ x: 20, y: 40 })
    driver.controller.reset()
    assert.deepEqual(driver.cancelled, [1])
    driver.controller.move({ x: 320, y: 240 })
    driver.frames.get(1)?.()
    assert.deepEqual(driver.applied, [restingCoverTilt])
    driver.frames.get(2)?.()
    assert.deepEqual(driver.applied.at(-1), getCoverTilt(bounds, { x: 320, y: 240 }))
})

test('destroy restores the surface and rejects queued frames and later input', (): void => {
    const driver = createDriver()
    driver.controller.move({ x: 320, y: 240 })
    driver.controller.destroy()
    driver.frames.get(1)?.()
    driver.controller.move({ x: 20, y: 40 })
    driver.controller.reset()
    driver.controller.destroy()
    assert.deepEqual(driver.cancelled, [1])
    assert.deepEqual(driver.applied, [restingCoverTilt])
    assert.equal(driver.frames.size, 1)
})
