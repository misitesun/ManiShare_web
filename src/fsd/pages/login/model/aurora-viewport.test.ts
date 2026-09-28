import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuroraVerticalScale } from './aurora-viewport'

test('login aurora keeps the reference geometry at the 16:9 design size', (): void => {
    assert.equal(getAuroraVerticalScale(1920, 1080), 1)
})

test('login aurora crops instead of stretching when the viewport becomes taller', (): void => {
    assert.equal(getAuroraVerticalScale(1080, 1920), 256 / 81)
})

test('login aurora keeps the same scale after returning to a previous viewport size', (): void => {
    const initialScale = getAuroraVerticalScale(1440, 900)

    getAuroraVerticalScale(619, 1209)

    assert.equal(getAuroraVerticalScale(1440, 900), initialScale)
})
