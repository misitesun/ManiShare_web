import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WordDictionaryLink } from './WordDictionaryLink'

test('正面搜索与背面查词共用当前单词外链，均在新标签打开且隔离opener和referrer', (): void => {
    for (const appearance of ['front', 'spelling', 'analysis'] as const)
        for (const word of ['apple', 'woman']) {
            const html = renderToStaticMarkup(
                createElement(WordDictionaryLink, {
                    word,
                    appearance,
                    disabled: false,
                    children: '查词图标',
                }),
            )
            assert.ok(html.includes(`href="https://dict.eudic.net/dicts/en/${word}"`))
            assert.match(html, /target="_blank"/)
            assert.match(html, /rel="noopener noreferrer"/)
            assert.doesNotMatch(html, /aria-disabled="true"/)
        }
})

test('卡牌禁用或没有有效单词时不可导航，也不进入Tab序列', (): void => {
    for (const [word, disabled] of [
        ['apple', true],
        ['', false],
    ] as const) {
        const html = renderToStaticMarkup(
            createElement(WordDictionaryLink, {
                word,
                disabled,
                appearance: 'front',
                children: '查词图标',
            }),
        )
        assert.doesNotMatch(html, /\shref=/)
        assert.match(html, /aria-disabled="true"/)
        assert.match(html, /tabindex="-1"/)
    }
})
