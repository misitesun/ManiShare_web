import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getTooltipCoordinates, getTooltipLeanAngle } from './position'
import type { TooltipAnchorRect } from './position'

const anchor: TooltipAnchorRect = {
    bottom: 70,
    height: 40,
    left: 20,
    right: 80,
    top: 30,
    width: 60,
}

describe('tooltip position', () => {
    it('places the tooltip on each requested side using the supplied offset', () => {
        assert.deepEqual(getTooltipCoordinates(anchor, 'top', 8), { left: 50, top: 22 })
        assert.deepEqual(getTooltipCoordinates(anchor, 'right', 8), { left: 88, top: 50 })
        assert.deepEqual(getTooltipCoordinates(anchor, 'bottom', 8), { left: 50, top: 78 })
        assert.deepEqual(getTooltipCoordinates(anchor, 'left', 8), { left: 12, top: 50 })
    })

    it('maps travel velocity to a clamped placement-aware tilt', () => {
        assert.equal(getTooltipLeanAngle(12, 10, 'right', 3), -3)
        assert.equal(getTooltipLeanAngle(-12, 10, 'right', 3), 3)
        assert.equal(getTooltipLeanAngle(12, 10, 'left', 3), 3)
        assert.equal(getTooltipLeanAngle(0, 10, 'right', 3), 0)
    })

    it('disables tilt for invalid timing or a zero motion preference', () => {
        assert.equal(getTooltipLeanAngle(12, 0, 'right', 3), 0)
        assert.equal(getTooltipLeanAngle(12, 10, 'right', 0), 0)
    })
})
