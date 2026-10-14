import assert from 'node:assert/strict'
import test from 'node:test'
import {
    captureShortcut,
    defaultPreferences,
    isShortcut,
    parsePreferences,
    preferenceGroups,
    resetPreferenceColors,
    shortcutError,
    shortcutFields,
} from './preferences'
import { getPreviewAppearance } from './appearance-preview'
import { describeBrowser } from './system-info'

test('已保存设置完整恢复，未知字段不进入领域模型', (): void => {
    const saved = {
        ...defaultPreferences,
        speechRate: 1.4,
        showTranslation: false,
        font: '现代体',
        answerColor: '#abcdef',
        playShortcut: 'Ctrl + K',
    }
    assert.deepEqual(parsePreferences({ version: 1, values: { ...saved, injected: true } }), saved)
})

test('损坏或未知版本回到初始参数；单字段非法值不抹掉其他合法设置', (): void => {
    for (const value of [null, 'bad JSON', [], { version: 2, values: defaultPreferences }])
        assert.deepEqual(parsePreferences(value), defaultPreferences)
    const result = parsePreferences({
        version: 1,
        values: {
            speechRate: 3,
            speechVolume: Number.NaN,
            voice: '未知声音',
            showTranslation: false,
            answerBlur: 0,
            backgroundColor: 'url(example)',
            readCount: 1.5,
            typingTone: '暗扣',
        },
    })
    assert.equal(result.speechRate, 1)
    assert.equal(result.speechVolume, 100)
    assert.equal(result.voice, '美式女音')
    assert.equal(result.showTranslation, false)
    assert.equal(result.answerBlur, 10)
    assert.equal(result.backgroundColor, 'theme')
    assert.equal(result.readCount, 1)
    assert.equal(result.typingTone, '暗扣')
})

test('所有存储字段均有设置入口，每个选择项和滑块边界可以保存恢复', (): void => {
    const fields = Object.values(preferenceGroups).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
    )
    const keys = [...fields.map((field) => field.key), ...shortcutFields.map((field) => field.key)]
    assert.equal(new Set(keys).size, Object.keys(defaultPreferences).length)
    for (const field of fields) {
        if (field.kind === 'select' || field.kind === 'radio') {
            for (const value of field.options)
                assert.equal(
                    parsePreferences({ version: 1, values: { [field.key]: value } })[field.key],
                    value,
                )
        }
        if (field.kind === 'range') {
            for (const value of [field.min, field.max])
                assert.equal(
                    parsePreferences({ version: 1, values: { [field.key]: value } })[field.key],
                    value,
                )
            assert.equal(
                parsePreferences({ version: 1, values: { [field.key]: field.min - field.step } })[
                    field.key
                ],
                defaultPreferences[field.key],
            )
        }
    }
    const expectedToneCounts = { typingTone: 13, correctTone: 2, errorTone: 6, completionTone: 8 }
    for (const [key, count] of Object.entries(expectedToneCounts)) {
        const field = fields.find((candidate) => candidate.key === key)
        assert.ok(field && (field.kind === 'select' || field.kind === 'radio'))
        assert.equal(field.options.length, count)
    }
})

test('颜色重置只恢复三类颜色，不重置字体、音效和快捷键', (): void => {
    const saved = {
        ...defaultPreferences,
        font: '圆体',
        typingVolume: 12,
        answerColor: '#010203',
        textColor: '#abcdef',
        backgroundColor: '#101010',
    }
    assert.deepEqual(resetPreferenceColors(saved), {
        ...saved,
        answerColor: 'theme',
        textColor: 'theme',
        backgroundColor: 'theme',
    })
})

test('快捷键限制、重复和规范顺序校验；损坏映射一起恢复以避免冲突', (): void => {
    for (const value of ['A', 'Shift + A', 'Shift + ;', 'Ctrl + Ctrl + K', 'Alt + Ctrl + K'])
        assert.equal(isShortcut(value), false)
    for (const value of ['Ctrl + K', 'Meta + K', 'Ctrl + ;', 'Ctrl + +', 'F12', 'Ctrl + ArrowDown'])
        assert.equal(isShortcut(value), true)
    assert.equal(
        captureShortcut({
            key: 'k',
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            metaKey: false,
        }),
        'Ctrl + K',
    )
    assert.equal(
        captureShortcut({
            key: 'k',
            ctrlKey: false,
            altKey: false,
            shiftKey: true,
            metaKey: false,
        }),
        null,
    )
    assert.equal(
        captureShortcut({
            key: 'Control',
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            metaKey: false,
        }),
        null,
    )
    assert.ok(shortcutError(defaultPreferences, 'playShortcut', 'Ctrl + M'))
    assert.equal(shortcutError(defaultPreferences, 'playShortcut', 'Ctrl + K'), null)
    const restored = parsePreferences({
        version: 1,
        values: { ...defaultPreferences, playShortcut: 'Ctrl + M', unfamiliarShortcut: 'Ctrl + K' },
    })
    assert.equal(restored.playShortcut, 'Ctrl + A')
    assert.equal(restored.unfamiliarShortcut, 'Ctrl + Q')
})

test('预览由偏好推导，字号、边框、亮度、模糊与自定义颜色实际改变', (): void => {
    const initial = getPreviewAppearance(defaultPreferences)
    const changed = getPreviewAppearance({
        ...defaultPreferences,
        font: '现代体',
        fontSize: '七号',
        grammarFontSize: '七号',
        border: '点线',
        grammarBrightness: 1,
        answerBlur: 1,
        answerColor: '#123456',
    })
    assert.notEqual(initial.fontFamily, changed.fontFamily)
    assert.ok(changed.fontSize > initial.fontSize)
    assert.ok(changed.grammarFontSize > initial.grammarFontSize)
    assert.equal(changed.borderStyle, 'dotted')
    assert.ok(changed.grammarOpacity < initial.grammarOpacity)
    assert.ok(changed.blur < initial.blur)
    assert.equal(changed.answerColor, '#123456')
    assert.equal(initial.backgroundColor, 'var(--app-color-canvas)')
})

test('系统信息按输入快照展示，iPad 桌面 UA 不误判为 PC，Edge 不误判为 Chrome', (): void => {
    const snapshot = {
        userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
        maxTouchPoints: 5,
        screenWidth: 1024,
        screenHeight: 768,
        pixelRatio: 2,
        width: 768,
        height: 700,
        scale: 1,
    }
    const ipad = Object.fromEntries(describeBrowser(snapshot))
    assert.equal(ipad.设备类型, '平板')
    assert.equal(ipad.屏幕, '1024×768，像素比 2，横屏')
    assert.match(ipad.浏览器 ?? '', /Safari 18/)
    const edge = Object.fromEntries(
        describeBrowser({
            ...snapshot,
            userAgent: 'Windows Chrome/130.0 Edg/130.2',
            maxTouchPoints: 0,
        }),
    )
    assert.equal(edge.设备类型, 'PC')
    assert.match(edge.浏览器 ?? '', /Edge 130.2/)
})
