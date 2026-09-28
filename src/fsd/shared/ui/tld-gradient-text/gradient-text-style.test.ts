import assert from 'node:assert/strict'
import test from 'node:test'
import { getGradientTextColors, getGradientTextStyle } from './gradient-text-style'

test('gradient text falls back to the semantic brand colors when fewer than two colors are supplied', (): void => {
    assert.deepEqual(getGradientTextColors(['']), [
        'var(--app-color-brand-start)',
        'var(--app-color-brand-end)',
    ])
})

test('gradient text duplicates its first custom color and applies vertical yoyo animation settings', (): void => {
    const style = getGradientTextStyle({
        animationSpeed: 3,
        colors: ['first-color', 'second-color'],
        direction: 'vertical',
        yoyo: true,
    })

    assert.equal(
        style.backgroundImage,
        'linear-gradient(to bottom, first-color, second-color, first-color)',
    )
    assert.equal(style.backgroundSize, '100% 300%')
    assert.equal(style['--tld-gradient-text-duration'], '3s')
    assert.equal(style['--tld-gradient-text-direction'], 'alternate')
    assert.equal(style['--tld-gradient-text-start'], '50% 0%')
    assert.equal(style['--tld-gradient-text-end'], '50% 100%')
})

test('gradient text normalizes invalid animation speed and preserves one-way looping', (): void => {
    const style = getGradientTextStyle({
        animationSpeed: 0,
        colors: ['first-color', 'second-color'],
        direction: 'horizontal',
        yoyo: false,
    })

    assert.equal(style['--tld-gradient-text-duration'], '8s')
    assert.equal(style['--tld-gradient-text-direction'], 'normal')
})
