import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldProgressBar } from './TldProgressBar'

test('wider value spacing preserves normalized progress and its accessible range', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldProgressBar, { ariaLabel: '复习进度', max: 3, value: 8, spacing: 'wide' }),
    )
    assert.match(html, /role="progressbar"/)
    assert.match(html, /aria-label="复习进度"/)
    assert.match(html, /aria-valuemin="0"/)
    assert.match(html, /aria-valuemax="3"/)
    assert.match(html, /aria-valuenow="3"/)
})

test('percentage display and accessible value share normalized progress, including invalid input', (): void => {
    for (const [value, expected] of [
        [72, 72],
        [160, 100],
        [-10, 0],
        [Number.NaN, 0],
    ]) {
        const html = renderToStaticMarkup(
            createElement(TldProgressBar, {
                ariaLabel: 'PK演示加载进度',
                max: 100,
                value,
                size: 'challenge',
                valueFormat: 'percentage',
            }),
        )
        assert.match(html, new RegExp(`aria-valuenow="${expected}"`))
        assert.match(html, new RegExp(`>${expected}%</span>`))
    }
})
