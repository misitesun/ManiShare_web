import assert from 'node:assert/strict'
import test from 'node:test'
import {
    captureShortcut,
    defaultPreferences,
    isShortcut,
    parsePreferences,
    preferenceGroups,
    resolveSettingsTab,
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
        playShortcut: 'Shift + P',
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
    assert.equal(result.voice, '美式男音')
    assert.equal(result.showTranslation, false)
    assert.equal(result.answerBlur, 10)
    assert.equal(result.backgroundPreset, 'default')
    assert.equal(result.readCount, 2)
    assert.equal(result.typingTone, '暗扣')
})

test('可见字段与保留历史字段覆盖存储模型，选择项和滑块边界可以保存恢复', (): void => {
    const fields = Object.values(preferenceGroups).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
    )
    const keys = [...fields.map((field) => field.key), ...shortcutFields.map((field) => field.key)]
    const retainedKeys = [
        'showTranslation',
        'handwriting',
        'inputCompatibility',
        'autoShowAnswer',
        'autoReadOnChange',
        'chapterEnd',
        'autoNextOnRead',
        'backgroundPreset',
        'backgroundSource',
    ]
    assert.deepEqual(
        Object.keys(defaultPreferences)
            .filter((key) => !keys.some((visibleKey) => visibleKey === key))
            .sort(),
        [...retainedKeys].sort(),
    )
    assert.equal(new Set([...keys, ...retainedKeys]).size, Object.keys(defaultPreferences).length)
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
    const expectedToneCounts = { typingTone: 13, correctTone: 2, errorTone: 6, completionTone: 9 }
    for (const [key, count] of Object.entries(expectedToneCounts)) {
        const field = fields.find((candidate) => candidate.key === key)
        assert.ok(field && (field.kind === 'select' || field.kind === 'radio'))
        assert.equal(field.options.length, count)
    }
})

test('旧外观数据保留合法通用设置，新开关使用设计默认值；新背景/颜色方式可恢复', (): void => {
    const restored = parsePreferences({
        version: 1,
        values: {
            speechRate: 1.4,
            font: '现代体',
            backgroundColor: '#111b16',
            grammarColor: true,
            border: '点线',
            correctEffect: false,
        },
    })
    assert.equal(restored.speechRate, 1.4)
    assert.equal(restored.font, '现代体')
    assert.equal(restored.backgroundPreset, 'green')
    assert.equal(restored.showGrammarFill, false)
    assert.equal(restored.grammarBrightness, 4)
    assert.equal(restored.border, '实线')
    assert.equal(restored.correctEffect, false)
    assert.equal('grammarColor' in restored, false)
    for (const answerColor of ['dark-default', 'light-default', '#abcdef', 'theme']) {
        const values = parsePreferences({
            version: 1,
            values: {
                answerColor,
                backgroundPreset: 'blue',
                backgroundSource: 'image',
                backgroundDim: 50,
                backgroundBlur: 30,
            },
        })
        assert.equal(values.answerColor, answerColor)
        assert.equal(values.backgroundPreset, 'blue')
        assert.equal(values.backgroundSource, 'image')
        assert.equal(values.backgroundDim, 50)
        assert.equal(values.backgroundBlur, 30)
    }
    const invalid = parsePreferences({
        version: 1,
        values: {
            backgroundPreset: 'url(invalid)',
            backgroundSource: 'external',
            backgroundDim: 101,
            backgroundBlur: -1,
            textColor: 'light-default',
        },
    })
    assert.equal(invalid.backgroundPreset, 'default')
    assert.equal(invalid.backgroundSource, 'preset')
    assert.equal(invalid.backgroundDim, 25)
    assert.equal(invalid.backgroundBlur, 10)
    assert.equal(invalid.textColor, 'theme')
})

test('快捷键限制、重复和规范顺序校验；合法历史冲突值保留供用户修正', (): void => {
    for (const value of ['A', 'Ctrl + Ctrl + K', 'Alt + Ctrl + K'])
        assert.equal(isShortcut(value), false)
    for (const value of [
        'Shift + A',
        'Shift + ;',
        'Ctrl + K',
        'Meta + K',
        'Ctrl + ;',
        'Ctrl + +',
        'F12',
        'Ctrl + ArrowDown',
    ])
        assert.equal(isShortcut(value), true)
    assert.equal(
        captureShortcut({
            key: 'k',
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            metaKey: false,
        }),
        null,
    )
    assert.equal(
        captureShortcut({
            key: 'k',
            ctrlKey: false,
            altKey: false,
            shiftKey: true,
            metaKey: false,
        }),
        'Shift + K',
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
    assert.ok(shortcutError(defaultPreferences, 'playShortcut', 'Shift + J'))
    assert.equal(shortcutError(defaultPreferences, 'playShortcut', 'Shift + P'), null)
    const restored = parsePreferences({
        version: 1,
        values: { ...defaultPreferences, playShortcut: 'Ctrl + J', unfamiliarShortcut: 'Ctrl + P' },
    })
    assert.equal(restored.playShortcut, 'Shift + J')
    assert.equal(restored.unfamiliarShortcut, 'Shift + P')
    assert.ok(shortcutError(restored, 'playShortcut', restored.playShortcut))
})

test('预览由偏好推导，字号、边框、亮度、模糊与自定义颜色实际改变', (): void => {
    const initial = getPreviewAppearance(defaultPreferences)
    const changed = getPreviewAppearance({
        ...defaultPreferences,
        font: '现代体',
        fontSize: '七号',
        grammarFontSize: '七号',
        border: '虚线',
        grammarBrightness: 1,
        answerBlur: 1,
        answerColor: '#123456',
    })
    assert.notEqual(initial.fontFamily, changed.fontFamily)
    assert.ok(changed.fontSize > initial.fontSize)
    assert.ok(changed.grammarFontSize > initial.grammarFontSize)
    assert.equal(changed.borderStyle, 'dashed')
    assert.ok(changed.grammarOpacity < initial.grammarOpacity)
    assert.ok(changed.blur < initial.blur)
    assert.equal(changed.answerColor, '#123456')
    assert.equal(initial.backgroundColor, 'var(--app-color-practice-preset-default)')
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

test('答题新用户默认一次后显示答案，旧有效选择及隐藏偏好不会被新默认覆盖', (): void => {
    assert.equal(parsePreferences(null).answerAfterErrors, '错误1次后')
    for (const value of [true, false]) {
        const legacy = {
            showTranslation: value,
            handwriting: value,
            inputCompatibility: value,
            showEvaluation: value,
            autoShowAnswer: value,
        }
        const restored = parsePreferences({
            version: 1,
            values: { ...legacy, answerAfterErrors: '错误3次后' },
        })
        assert.equal(restored.answerAfterErrors, '错误3次后')
        for (const key of Object.keys(legacy)) assert.equal(Reflect.get(restored, key), value)
        const savedAgain = parsePreferences({
            version: 1,
            values: { ...restored, ignoreCase: false },
        })
        assert.deepEqual(savedAgain, { ...restored, ignoreCase: false })
    }
    assert.deepEqual(
        parsePreferences({
            version: 1,
            values: {
                showTranslation: 'false',
                handwriting: 1,
                inputCompatibility: null,
                showEvaluation: [],
                autoShowAnswer: {},
            },
        }),
        defaultPreferences,
    )
})

test('专项新增字段按确认的选项恢复，非法输入仅回退对应字段', (): void => {
    assert.equal(defaultPreferences.voice, '美式男音')
    assert.equal(defaultPreferences.readCount, 2)
    assert.deepEqual(
        [
            defaultPreferences.imagePosition,
            defaultPreferences.imageSize,
            defaultPreferences.videoPosition,
            defaultPreferences.maskSubtitles,
            defaultPreferences.correctEffect,
            defaultPreferences.completionEffect,
        ],
        ['左', '大', '右侧', true, true, true],
    )
    assert.equal(defaultPreferences.correctEffectType, 'lottie-0')
    assert.equal(defaultPreferences.errorTone, '顿响')
    assert.equal(defaultPreferences.completionTone, '章节完成音效1')
    const restored = parsePreferences({
        version: 1,
        values: {
            voice: '英式女音',
            readCount: 4,
            imagePosition: '右',
            imageSize: '小',
            videoPosition: '左侧',
            maskSubtitles: false,
            correctEffect: false,
            correctEffectType: '🐸',
            completionEffect: false,
            completionTone: '落幕（默认）',
            playShortcut: 'Ctrl + A',
            masteredShortcut: 'Ctrl + M',
            unfamiliarShortcut: 'Ctrl + Q',
            autoReadOnChange: false,
            chapterEnd: '循环播放',
            autoNextOnRead: true,
            showEvaluation: false,
        },
    })
    assert.equal(restored.imagePosition, '右')
    assert.equal(restored.imageSize, '小')
    assert.equal(restored.videoPosition, '左侧')
    assert.equal(restored.maskSubtitles, false)
    assert.equal(restored.correctEffectType, 'lottie-0')
    assert.equal(restored.completionTone, '落幕（默认）')
    assert.equal(restored.voice, '英式女音')
    assert.equal(restored.readCount, 4)
    assert.equal(restored.playShortcut, 'Shift + A')
    assert.equal(restored.masteredShortcut, 'Shift + M')
    assert.equal(restored.unfamiliarShortcut, 'Shift + Q')
    assert.equal(restored.chapterEnd, '循环播放')
    assert.equal(restored.autoReadOnChange, false)
    assert.equal(restored.autoNextOnRead, true)
    assert.equal(restored.showEvaluation, false)
    assert.deepEqual(
        parsePreferences({
            version: 1,
            values: {
                imagePosition: '上',
                imageSize: 0,
                videoPosition: '居中',
                maskSubtitles: 'false',
                correctEffectType: '未知',
                chapterEnd: '未知',
            },
        }),
        defaultPreferences,
    )
})

test('图片和视频位置的默认选项可保存恢复，合法旧位置保持且非法值逐项回退', (): void => {
    const saved = {
        version: 1,
        values: {
            ...defaultPreferences,
            imagePosition: '默认',
            videoPosition: '默认',
            imageSize: '中',
            speechRate: 1.4,
        },
    }
    const restored = parsePreferences(JSON.parse(JSON.stringify(saved)))
    assert.equal(restored.imagePosition, '默认')
    assert.equal(restored.videoPosition, '默认')
    assert.equal(restored.imageSize, '中')
    assert.equal(restored.speechRate, 1.4)

    for (const imagePosition of ['左', '右']) {
        for (const videoPosition of ['左侧', '右侧']) {
            const legacy = parsePreferences({
                version: 1,
                values: { imagePosition, videoPosition },
            })
            assert.equal(legacy.imagePosition, imagePosition)
            assert.equal(legacy.videoPosition, videoPosition)
        }
    }

    for (const key of ['imagePosition', 'videoPosition'] as const) {
        const otherKey = key === 'imagePosition' ? 'videoPosition' : 'imagePosition'
        const invalid = parsePreferences({
            version: 1,
            values: { ...saved.values, [key]: '未知布局' },
        })
        assert.equal(invalid[key], defaultPreferences[key])
        assert.equal(invalid[otherKey], '默认')
        assert.equal(invalid.imageSize, '中')
        assert.equal(invalid.speechRate, 1.4)
    }
})

test('新Tab与旧链接解析归属一致，未知Tab回发音', (): void => {
    for (const value of [
        'pronunciation',
        'specialized',
        'answer',
        'effects',
        'appearance',
        'shortcuts',
        'system',
    ] as const)
        assert.equal(resolveSettingsTab(value), value)
    assert.equal(resolveSettingsTab('sound'), 'effects')
    assert.equal(resolveSettingsTab('listening'), 'specialized')
    assert.equal(resolveSettingsTab('missing'), 'pronunciation')
    assert.equal(resolveSettingsTab(null), 'pronunciation')
})
