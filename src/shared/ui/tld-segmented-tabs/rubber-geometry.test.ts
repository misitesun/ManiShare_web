import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getEqualSegmentClipPath,
    getEqualSegmentEdges,
    getRubberSquashEdges,
    getRubberStretchEdges,
    getSegmentBox,
    getSegmentClipPath,
    getSegmentDirection,
} from './rubber-geometry'

test('equal segment geometry rejects invalid selections and divides the track evenly', (): void => {
    assert.equal(getEqualSegmentEdges(-1, 3), null)
    assert.equal(getEqualSegmentEdges(3, 3), null)
    assert.equal(getEqualSegmentEdges(0, 0), null)
    assert.deepEqual(getEqualSegmentEdges(1, 4), { left: 25, right: 50 })
})

test('rubber stretch covers the travel range and respects the configured intensity', (): void => {
    const current = { left: 0, right: 100 }
    const target = { left: 200, right: 300 }

    assert.deepEqual(getRubberStretchEdges(current, target), { left: 0, right: 300 })
    assert.deepEqual(getRubberStretchEdges(current, target, 0.5), { left: 100, right: 300 })
    assert.deepEqual(getRubberStretchEdges(current, target, 0), target)
})

test('rubber landing squashes only the trailing edge before relaxing', (): void => {
    const target = { left: 100, right: 200 }

    assert.equal(getSegmentDirection({ left: 0, right: 100 }, target), 1)
    assert.deepEqual(getRubberSquashEdges(target, 1, 3), { left: 103, right: 200 })
    assert.equal(getSegmentDirection({ left: 200, right: 300 }, target), -1)
    assert.deepEqual(getRubberSquashEdges(target, -1, 3), { left: 100, right: 197 })
    assert.deepEqual(getRubberSquashEdges(target, 0, 3), target)
})

test('clip paths preserve the first paint and clamp measured edges to the track', (): void => {
    assert.equal(getEqualSegmentClipPath(1, 4, 8), 'inset(0 50% 0 25% round 8px)')
    assert.equal(
        getSegmentClipPath({ left: -10, right: 120 }, 100, 8),
        'inset(0 0px 0 0px round 8px)',
    )
    assert.deepEqual(getSegmentBox({ left: 25, right: 75 }, 100), {
        left: 25,
        width: 50,
    })
    assert.deepEqual(getSegmentBox({ left: -10, right: 120 }, 100), {
        left: 0,
        width: 100,
    })
})
