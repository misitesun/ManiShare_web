import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldImageUpload } from './TldImageUpload'

test('描边上传保留原生文件选择、禁用和多选契约', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldImageUpload, {
            appearance: 'outlined',
            previewSource: 'data-url',
            disabled: true,
            files: [],
            label: '添加截图',
            accept: 'image/png,image/jpeg',
            maxFiles: 2,
            onFilesChange: (): void => undefined,
        }),
    )
    assert.match(html, /type="file"/)
    assert.match(html, /accept="image\/png,image\/jpeg"/)
    assert.match(html, /multiple=""/)
    assert.match(html, /disabled=""/)
    assert.match(html, />添加截图</)
    assert.match(html, /add-outlined\.svg/)
})

test('已有文件达到上限时不再渲染添加入口', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldImageUpload, {
            files: [new File(['image'], 'example.png', { type: 'image/png' })],
            label: '添加截图',
            onFilesChange: (): void => undefined,
        }),
    )
    assert.doesNotMatch(html, /type="file"/)
})
