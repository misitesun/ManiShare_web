import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldTiltedCover } from './TldTiltedCover'

test('cover prerenders a static image inside the existing link without adding an action', (): void => {
    const html = renderToStaticMarkup(
        createElement(
            'a',
            { href: '/courses/phonetics/' },
            createElement(TldTiltedCover, {
                src: '/phonetics.webp',
                alt: '音标课程',
                loading: 'lazy',
            }),
        ),
    )
    assert.match(html, /href="\/courses\/phonetics\/"/)
    assert.match(html, /alt="音标课程"/)
    assert.match(html, /loading="lazy"/)
    assert.doesNotMatch(html, /<button|tabindex|role="button"|data-tilted="true"/)
})

test('decorative and disabled covers keep images available without browser initialization', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldTiltedCover, { src: '/cover.webp', alt: '', disabled: true }),
    )
    assert.match(html, /<img[^>]+alt=""[^>]+aria-hidden="true"/)
    assert.doesNotMatch(html, /data-tilted="true"|tabindex|disabled=/)
})
