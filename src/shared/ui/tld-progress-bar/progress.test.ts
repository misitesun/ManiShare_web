import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldProgressBar } from './TldProgressBar'
import { normalizeProgress } from './progress'

test('progress normalizes a valid value into a percentage', (): void => {
    const progress = normalizeProgress(2, 3)

    assert.equal(progress.value, 2)
    assert.equal(progress.max, 3)
    assert.ok(Math.abs(progress.percentage - 200 / 3) < Number.EPSILON * 100)
})

test('progress clamps values outside the supported range', (): void => {
    assert.deepEqual(normalizeProgress(-1, 3), {
        value: 0,
        max: 3,
        percentage: 0,
    })
    assert.deepEqual(normalizeProgress(5, 3), {
        value: 3,
        max: 3,
        percentage: 100,
    })
})

test('progress treats non-finite and non-positive maximums as empty', (): void => {
    assert.deepEqual(normalizeProgress(Number.NaN, 0), {
        value: 0,
        max: 0,
        percentage: 0,
    })
    assert.deepEqual(normalizeProgress(1, Number.POSITIVE_INFINITY), {
        value: 0,
        max: 0,
        percentage: 0,
    })
})

test('linear progress can hide its visual value without losing accessible values', (): void => {
    const markup = renderToStaticMarkup(
        createElement(TldProgressBar, {
            ariaLabel: '课程章节练习进度',
            max: 15,
            showValue: false,
            size: 'large',
            value: 3,
        }),
    )

    assert.doesNotMatch(markup, />3<\/span>/)
    assert.match(markup, /aria-valuemax="15"/)
    assert.match(markup, /aria-valuenow="3"/)
})
