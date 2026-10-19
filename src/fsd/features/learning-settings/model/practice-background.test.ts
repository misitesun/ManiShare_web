import assert from 'node:assert/strict'
import test from 'node:test'
import {
    backgroundPresets,
    getBackgroundDimensions,
    getBackgroundFileError,
    getBackgroundPresetColor,
    maxBackgroundFileBytes,
    maxBackgroundSourceLength,
    parseBackgroundImage,
    resolvePreferenceColor,
} from './practice-background'

test('背景配色只有四项；未知方案回默认，实际色值由主题token解析', (): void => {
    assert.deepEqual(
        backgroundPresets.map(({ label }) => label),
        ['默认', '暖色护眼', '绿色护眼', '蓝色护眼'],
    )
    assert.equal(getBackgroundPresetColor('warm'), 'var(--app-color-practice-preset-warm)')
    assert.equal(getBackgroundPresetColor('invalid'), getBackgroundPresetColor('default'))
    assert.equal(resolvePreferenceColor('dark-default', ''), 'var(--app-color-answer-default-dark)')
    assert.equal(
        resolvePreferenceColor('light-default', ''),
        'var(--app-color-answer-default-light)',
    )
})

test('文件按内容识别JPG/PNG/WebP，不信任扩展名，并限制10MB', (): void => {
    const jpeg = new Uint8Array([255, 216, 255])
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const webp = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])
    for (const bytes of [jpeg, png, webp]) assert.equal(getBackgroundFileError(100, bytes), null)
    assert.equal(getBackgroundFileError(maxBackgroundFileBytes, jpeg), null)
    assert.match(getBackgroundFileError(maxBackgroundFileBytes + 1, jpeg) ?? '', /10MB/)
    assert.match(getBackgroundFileError(0, png) ?? '', /为空/)
    assert.match(
        getBackgroundFileError(100, new TextEncoder().encode('<svg>')) ?? '',
        /JPG、PNG或WebP/,
    )
    assert.notEqual(getBackgroundFileError(1, new Uint8Array([255])), null)
})

test('压缩保持横竖比例、不放大小图，并将最长边限制为2560px', (): void => {
    assert.deepEqual(getBackgroundDimensions(6000, 4000), { width: 2560, height: 1707 })
    assert.deepEqual(getBackgroundDimensions(4000, 6000), { width: 1707, height: 2560 })
    assert.deepEqual(getBackgroundDimensions(640, 480), { width: 640, height: 480 })
})

test('本机图片仅接受受限的栅格data URL和有效版本/尺寸，外链和损坏数据回空态', (): void => {
    const image = {
        version: 1,
        source: 'data:image/webp;base64,UklGRg==',
        width: 1280,
        height: 720,
        name: '示例.webp',
    }
    assert.deepEqual(parseBackgroundImage(image), image)
    for (const source of [
        'https://example.com/a.jpg',
        'data:image/svg+xml;base64,PHN2Zz4=',
        'javascript:alert(1)',
        'data:image/jpeg;base64,',
        'data:image/jpeg;base64,@@@',
        'data:image/jpeg;base64,' + 'A'.repeat(maxBackgroundSourceLength),
    ]) {
        assert.equal(parseBackgroundImage({ ...image, source }), null)
    }
    for (const width of [0, -1, 2561, Number.NaN, Infinity, '2560', 1.2])
        assert.equal(parseBackgroundImage({ ...image, width }), null)
    for (const value of [null, {}, { ...image, version: 2 }, { ...image, name: 'a'.repeat(121) }])
        assert.equal(parseBackgroundImage(value), null)
})
