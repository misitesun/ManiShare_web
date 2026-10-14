import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldInput } from './TldInput'

test('玻璃输入外观保留表单名称、错误关联和密码操作的原生语义', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldInput, {
            label: '登录密码',
            id: 'password',
            name: 'password',
            type: 'password',
            appearance: 'glass',
            size: 'large',
            value: 'example',
            readOnly: true,
            'aria-invalid': true,
            'aria-describedby': 'password-error',
            trailingAction: createElement(
                'button',
                { type: 'button', 'aria-label': '显示密码' },
                '显示',
            ),
        }),
    )
    assert.match(html, /for="password"/)
    assert.match(html, /name="password"/)
    assert.match(html, /type="password"/)
    assert.match(html, /aria-invalid="true"/)
    assert.match(html, /aria-describedby="password-error"/)
    assert.match(html, /<button[^>]*type="button"[^>]*aria-label="显示密码"/)
})

test('TldInput associates its label and renders a trailing submit action', () => {
    const html = renderToStaticMarkup(
        createElement(TldInput, {
            label: '课程搜索',
            id: 'course-query',
            size: 'large',
            type: 'search',
            trailingAction: createElement('button', { type: 'submit' }, '搜索'),
        }),
    )
    assert.match(html, /for="course-query"/)
    assert.match(html, /id="course-query"/)
    assert.match(html, /<button type="submit">搜索<\/button>/)
    assert.doesNotMatch(html, /<label[^>]*>[^<]*<button/)
})

test('TldInput exposes label and disabled controlled state', () => {
    const html = renderToStaticMarkup(
        createElement(TldInput, { label: '搜索', value: 'hello', disabled: true, readOnly: true }),
    )
    assert.match(html, /disabled=""/)
    assert.match(html, /hello/)
})

test('pill search preserves its accessible label, controlled query and disabled semantics', (): void => {
    for (const value of ['', '1290']) {
        const html = renderToStaticMarkup(
            createElement(TldInput, {
                id: 'room-query',
                label: '搜索房间号',
                appearance: 'pill',
                type: 'search',
                name: 'roomNumber',
                value,
                disabled: true,
                readOnly: true,
            }),
        )
        assert.match(html, /for="room-query"/)
        assert.match(html, /type="search"/)
        assert.match(html, /name="roomNumber"/)
        assert.match(html, /disabled=""/)
        assert.match(html, new RegExp(`value="${value}"`))
    }
})
