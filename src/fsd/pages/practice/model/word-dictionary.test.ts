import assert from 'node:assert/strict'
import test from 'node:test'
import { getWordDictionaryUrl } from './word-dictionary'

test('查词按当前词构造欧路词条链接，清理首尾空白并把短语作为一个路径段编码', (): void => {
    assert.equal(getWordDictionaryUrl('apple'), 'https://dict.eudic.net/dicts/en/apple')
    assert.equal(getWordDictionaryUrl(' woman '), 'https://dict.eudic.net/dicts/en/woman')
    assert.equal(getWordDictionaryUrl('ice cream'), 'https://dict.eudic.net/dicts/en/ice%20cream')
    const value = getWordDictionaryUrl('word/part?next=evil#fragment')
    assert.ok(value)
    const url = new URL(value)
    assert.equal(url.origin, 'https://dict.eudic.net')
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    assert.equal(
        decodeURIComponent(url.pathname.slice('/dicts/en/'.length)),
        'word/part?next=evil#fragment',
    )
})

test('空白、点路径、控制字符及不完整Unicode词条不生成可操作外链', (): void => {
    for (const word of ['', '  ', '.', '..', 'a\nb', 'a\u0000b', String.fromCharCode(0xd800)])
        assert.equal(getWordDictionaryUrl(word), null)
})
