import assert from 'node:assert/strict'
import test from 'node:test'
import { getDictionaryNavigationTarget } from './dictionary-navigation'

const source = 'englishlearning://app/practice/?demo=word-basic&mode=pronounce'

test('可信窗口的欧路词条可以交给系统浏览器，包括编码短语及开发窗口', (): void => {
    for (const word of ['apple', 'woman', 'ice%20cream']) {
        const url = `https://dict.eudic.net/dicts/en/${word}`
        assert.equal(getDictionaryNavigationTarget(url, source), url)
        assert.equal(
            getDictionaryNavigationTarget(
                url,
                'http://127.0.0.1:45123/practice/',
                'http://127.0.0.1:45123/',
            ),
            url,
        )
    }
})

test('其余域名、协议、凭据、路径及携带查询／片段／表单内容的请求保持拒绝', (): void => {
    for (const url of [
        'https://example.com/dicts/en/apple',
        'https://dict.eudic.net.example.com/dicts/en/apple',
        'http://dict.eudic.net/dicts/en/apple',
        'javascript:alert(1)',
        'file:///tmp/apple',
        'https://user:pass@dict.eudic.net/dicts/en/apple',
        'https://dict.eudic.net:444/dicts/en/apple',
        'https://dict.eudic.net/',
        'https://dict.eudic.net/dicts/en/',
        'https://dict.eudic.net/dicts/en/apple/extra',
        'https://dict.eudic.net/dicts/en/apple?redirect=https://example.com',
        'https://dict.eudic.net/dicts/en/apple#fragment',
        'https://dict.eudic.net/dicts/en/%20',
        'https://dict.eudic.net/dicts/en/%0Aapple',
        'https://dict.eudic.net/dicts/en/%zz',
    ])
        assert.equal(getDictionaryNavigationTarget(url, source), null, url)
    assert.equal(
        getDictionaryNavigationTarget(
            'https://dict.eudic.net/dicts/en/apple',
            source,
            undefined,
            true,
        ),
        null,
    )
})

test('不可信来源和未分配的开发origin不能触发系统浏览器', (): void => {
    const url = 'https://dict.eudic.net/dicts/en/apple'
    for (const sourceUrl of ['https://example.com/', 'about:blank', 'englishlearning://evil/'])
        assert.equal(getDictionaryNavigationTarget(url, sourceUrl), null)
    assert.equal(
        getDictionaryNavigationTarget(url, 'http://127.0.0.1:45124/', 'http://127.0.0.1:45123/'),
        null,
    )
})
