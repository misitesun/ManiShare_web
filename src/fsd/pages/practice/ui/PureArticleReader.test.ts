import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PureArticleReader } from './PureArticleReader'

test('无正文显示可访问空态，有已构建正文时保留语义结构而非句子题面', (): void => {
    const empty = renderToStaticMarkup(createElement(PureArticleReader, { content: null }))
    assert.match(empty, /role="status"[^>]*>暂无文章内容/)
    const content = createElement(
        'div',
        null,
        createElement('h2', null, '文章标题'),
        createElement('p', null, '第一段正文'),
        createElement('ul', null, createElement('li', null, '列表内容')),
        createElement('a', { href: '#article-details' }, '查看详情'),
    )
    const html = renderToStaticMarkup(createElement(PureArticleReader, { content }))
    assert.match(html, /data-article-empty="false"/)
    assert.match(html, /<h2>文章标题<\/h2>/)
    assert.match(html, /<p>第一段正文<\/p>/)
    assert.match(html, /<ul><li>列表内容<\/li><\/ul>/)
    assert.match(html, /href="#article-details"/)
    assert.doesNotMatch(html, /暂无文章内容|添加笔记|data-practice-english/)
})

test('字符串作为文本处理，不将未知接口HTML直接注入DOM', (): void => {
    const html = renderToStaticMarkup(
        createElement(PureArticleReader, { content: '<script>bad()</script>' }),
    )
    assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/)
    assert.doesNotMatch(html, /<script\b/)
})
