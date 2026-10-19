import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldMovingHighlight } from './TldMovingHighlight'
import type { TldMovingHighlightTone } from './TldMovingHighlight'

test('moving highlights defer browser measurement without producing an origin indicator during SSR', (): void => {
    const tones: readonly TldMovingHighlightTone[] = ['outline', 'surface', 'practice-outline']
    for (const tone of tones) {
        const html = renderToStaticMarkup(
            createElement(TldMovingHighlight, {
                containerRef: { current: null },
                activeKey: 'selected-option',
                tone,
            }),
        )
        assert.equal(html, '', `${tone} must wait for the real selected item geometry`)
    }
})
