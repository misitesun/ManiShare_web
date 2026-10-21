import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDemoWordPhonetics } from '../model/word-phonetics-demo'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'

function rejectSelection(): never {
    throw new Error('预渲染不得定位字母或播放音源')
}

test('共用音标默认保留静态展示，只有显式注入定位才显示可访问按钮', (): void => {
    const props = {
        phonetic: '/bʊk/',
        breakdown: getDemoWordPhonetics('book', '/bʊk/'),
        mode: 'phonics' as const,
        density: 'spelling' as const,
    }
    const plain = renderToStaticMarkup(createElement(PracticeWordPhonetics, props))
    assert.match(plain, /role="img"/)
    assert.doesNotMatch(plain, /<button/)
    const interactive = renderToStaticMarkup(
        createElement(PracticeWordPhonetics, { ...props, onSegmentSelect: rejectSelection }),
    )
    assert.match(interactive, /role="group"/)
    assert.match(interactive, /aria-label="定位 book 中的 oo"/)
    assert.equal((interactive.match(/<button\b/g) ?? []).length, 3)
    assert.equal((interactive.match(/data-spelling-pulse-segment=/g) ?? []).length, 3)
    assert.doesNotMatch(
        interactive,
        /aria-hidden="true"[^>]*><span[^>]*><span[^>]*data-word-phonetic-segment/,
    )
    const blocked = renderToStaticMarkup(
        createElement(PracticeWordPhonetics, {
            ...props,
            onSegmentSelect: rejectSelection,
            disabled: true,
        }),
    )
    assert.ok((blocked.match(/<button\b[^>]*>/g) ?? []).every((tag) => tag.includes('disabled=""')))
})
