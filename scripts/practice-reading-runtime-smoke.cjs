const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const sharp = require('sharp')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')
const {
    readToolbarCache,
    resetToolbarCache,
    restoreToolbarCache,
} = require('./additional-toolbar-runtime-smoke.cjs')

const preferencesKey = 'english-learning-preferences-v1'
const themeKey = 'english-learning-theme'
const fallbackCases = [
    ['word-basic', 'spell'],
    ['sentence-basic', 'translate'],
    ['audio-basic', 'translate'],
    ['video-basic', 'translate'],
    ['picture-basic', 'translate'],
    ['guess-basic', 'guess'],
]
const excludedCases = [
    ['sentence-basic', 'read'],
    ['audio-basic', 'read'],
    ['guess-basic', 'read'],
    ['video-basic', 'listen'],
    ['picture-basic', 'listen'],
    ['audio-reader', 'read'],
    ['video-reader', 'read'],
    ['picture-reader', 'read'],
    ['text-reader', 'read'],
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function inspect(window) {
    return evaluate(window, () => {
        const box = (element) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                cssWidth: style.width,
                cssHeight: style.height,
                zIndex: style.zIndex,
                position: style.position,
                pointerEvents: style.pointerEvents,
                borderRadius: style.borderRadius,
                borderTopLeftRadius: style.borderTopLeftRadius,
                borderTopRightRadius: style.borderTopRightRadius,
                borderBottomLeftRadius: style.borderBottomLeftRadius,
                borderBottomRightRadius: style.borderBottomRightRadius,
                backgroundImage: style.backgroundImage,
                overflow: style.overflow,
            }
        }
        const frontCard = document.querySelector('[data-word-deck-front] [data-word-card-face]')
        return {
            url: location.href,
            viewport: [innerWidth, innerHeight],
            index: Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex),
            deckState: document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState,
            frontCard: {
                card: box(frontCard),
                image: box(frontCard?.querySelector('[data-practice-media]')),
                border: box(frontCard?.querySelector('[data-word-card-border]')),
            },
            overlays: Array.from(document.querySelectorAll('[data-practice-reading-overlay]')).map(
                (element) => {
                    const surface = element.closest('[data-practice-reading-surface]')
                    const image = surface?.querySelector('img,video')
                    const wave = element.querySelector('[data-audio-wave]')
                    return {
                        status: element.dataset.practiceReadingOverlay,
                        waveStyle: wave?.dataset.audioWave,
                        waveActive: wave?.dataset.waveActive,
                        message: element.querySelector('[role="status"]')?.textContent.trim(),
                        currentCard: Boolean(element.closest('[data-word-deck-front]')),
                        geometry: box(element),
                        waveGeometry: box(wave),
                        surface: box(surface),
                        image: box(image),
                        card: box(element.closest('[data-word-card-face]')),
                        cardSurface: box(element.closest('[data-word-card-surface]')),
                        border: box(
                            element
                                .closest('[data-word-card-surface]')
                                ?.querySelector('[data-word-card-border]'),
                        ),
                    }
                },
            ),
            audioElements: Array.from(document.querySelectorAll('audio')).map((audio) => ({
                source: audio.getAttribute('src'),
                currentSource: audio.currentSrc,
                paused: audio.paused,
            })),
            dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).map((dialog) =>
                dialog.textContent.slice(0, 120),
            ),
        }
    })
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 160; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error(
        'Timed out: practice reading ' + description + ' ' + JSON.stringify(await inspect(window)),
    )
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'images ready',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function visit(window, origin, demo, mode) {
    await settle(window)
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        demo + '/' + mode + ' ready',
    )
    await settle(window)
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (
                !element ||
                element.matches(':disabled') ||
                element.closest('[inert]') ||
                element.getBoundingClientRect().width === 0
            )
                throw new Error('Unavailable reading check control: ' + target)
            element.focus()
            element.click()
        },
        selector,
    )
}

async function clickText(window, label, scope) {
    await evaluate(
        window,
        (text, selector) => {
            const root = document.querySelector(selector)
            function readableText(element) {
                const copy = element.cloneNode(true)
                copy.querySelectorAll('[aria-hidden="true"]').forEach((decoration) =>
                    decoration.remove(),
                )
                return copy.textContent.trim()
            }
            const button = Array.from(root?.querySelectorAll('button') ?? []).find(
                (element) =>
                    readableText(element) === text &&
                    !element.closest('[inert]') &&
                    !element.disabled &&
                    element.getBoundingClientRect().width > 0,
            )
            if (!button) throw new Error('Unavailable reading check text: ' + text)
            button.focus()
            button.click()
        },
        label,
        scope,
    )
}

async function waitPending(window, expectedStyle = '默认竖条') {
    await waitFor(
        window,
        (style) => {
            const overlays = document.querySelectorAll('[data-practice-reading-overlay]')
            if (overlays.length !== 1) return false
            const overlay = overlays[0]
            const wave = overlay.querySelector('[data-audio-wave]')
            return (
                overlay.dataset.practiceReadingOverlay === 'pending-source' &&
                wave?.dataset.waveActive === 'false' &&
                wave?.dataset.audioWave === style &&
                overlay.textContent.includes('音源待接入')
            )
        },
        'one static pending-source overlay',
        expectedStyle,
    )
    return inspect(window)
}

async function waitNoOverlay(window) {
    await waitFor(
        window,
        () => document.querySelectorAll('[data-practice-reading-overlay]').length === 0,
        'reading overlay removed',
    )
}

async function openOptions(window, family) {
    const toolbar = '[data-practice-toolbar="' + family + '"]'
    await click(window, toolbar + ' button[aria-label="本模式设置"]')
    await waitFor(
        window,
        (name) => {
            const panel = document.querySelector('[data-practice-options="' + name + '"]')
            return panel && !panel.inert && panel.getAttribute('aria-hidden') !== 'true'
        },
        family + ' options open',
        family,
    )
}

async function closeOptions(window, family) {
    await click(window, '[data-practice-toolbar="' + family + '"] button[aria-label="本模式设置"]')
    await waitFor(
        window,
        (name) => !document.querySelector('[data-practice-options="' + name + '"]'),
        family + ' options closed',
        family,
    )
}

function assertImageGeometry(snapshot) {
    assert.deepEqual(snapshot.viewport, [1920, 1080])
    assert.equal(snapshot.overlays.length, 1)
    const overlay = snapshot.overlays[0]
    assert.ok(overlay.surface && overlay.image && overlay.card)
    assert.equal(overlay.currentCard, true, 'only the front card owns a reading overlay')
    assert.equal(overlay.geometry.position, 'absolute')
    assert.equal(overlay.geometry.pointerEvents, 'none')
    assert.ok(overlay.border && overlay.cardSurface, 'current card retains its SVG outline')
    assert.equal(overlay.border.pointerEvents, 'none')
    assert.ok(
        Number(overlay.border.zIndex) > Number(overlay.geometry.zIndex),
        'the card outline stays above the image reading overlay',
    )
    for (const dimension of ['x', 'y', 'width', 'height'])
        assert.ok(
            Math.abs(overlay.border[dimension] - overlay.cardSurface[dimension]) <= 0.1,
            'SVG border preserves the card surface ' + dimension,
        )
    assert.equal(overlay.waveGeometry.cssHeight, '70px')
    assert.equal(overlay.image.cssWidth, '500px')
    assert.equal(overlay.image.cssHeight, '281px')
    assert.equal(overlay.card.cssWidth, '500px')
    assert.equal(overlay.card.cssHeight, '500px')
    for (const [box, dimension, expected] of [
        [overlay.waveGeometry, 'height', 70],
        [overlay.image, 'width', 500],
        [overlay.image, 'height', 281],
        [overlay.card, 'width', 500],
        [overlay.card, 'height', 500],
    ])
        assert.ok(
            Math.abs(box[dimension] - expected) <= 0.1,
            dimension +
                ' transformed rect remains within 0.1px of the CSS design size: ' +
                box[dimension],
        )
    for (const dimension of ['x', 'y', 'width', 'height'])
        assert.ok(
            Math.abs(overlay.surface[dimension] - overlay.image[dimension]) < 0.5,
            'reading wrapper preserves image ' + dimension,
        )
    assert.equal(overlay.surface.borderTopLeftRadius, overlay.image.borderTopLeftRadius)
    assert.equal(overlay.surface.borderTopRightRadius, overlay.image.borderTopRightRadius)
    assert.ok(
        Math.abs(
            overlay.geometry.y + overlay.geometry.height - overlay.image.y - overlay.image.height,
        ) < 0.5,
        'reading overlay is anchored to the image bottom',
    )
    assert.ok(overlay.geometry.height <= overlay.image.height, 'overlay fits within the picture')
}

async function captureWordBorderFrame(window, label, name) {
    await waitFor(
        window,
        () => document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState === 'idle',
        'card resting for border pixels',
    )
    await settle(window)
    await delay(200)
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    const snapshot = await inspect(window)
    assert.ok(snapshot.frontCard.image && snapshot.frontCard.border)
    const path = 'dist/practice-reading-' + label.toLowerCase() + '-' + name + '.png'
    const png = (await window.webContents.capturePage()).toPNG()
    mkdirSync(resolve('dist'), { recursive: true })
    writeFileSync(resolve(path), png)
    return { path, png, snapshot }
}

function percentile(values, ratio) {
    const sorted = values.slice().sort((left, right) => left - right)
    return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? 0
}

/** 只取SVG描边所在的最外1 CSS像素带，不把遮罩应变暗的图片内容作为失败依据。 */
async function sampleReadingBorderPixels(withReading, withoutReading) {
    assert.equal(
        withReading.snapshot.index,
        withoutReading.snapshot.index,
        'same question for on/off pixels',
    )
    assert.deepEqual(withReading.snapshot.viewport, withoutReading.snapshot.viewport)
    const image = withReading.snapshot.frontCard.image
    const unchangedImage = withoutReading.snapshot.frontCard.image
    for (const key of ['x', 'y', 'width', 'height'])
        assert.ok(
            Math.abs(image[key] - unchangedImage[key]) <= 0.01,
            'image is stationary between the two captures: ' + key,
        )
    const [on, off] = await Promise.all([
        sharp(withReading.png)
            .toColourspace('srgb')
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true }),
        sharp(withoutReading.png)
            .toColourspace('srgb')
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true }),
    ])
    assert.equal(on.info.width, off.info.width)
    assert.equal(on.info.height, off.info.height)
    assert.equal(on.info.channels, 3)
    assert.equal(off.info.channels, 3)
    const dpr = on.info.width / withReading.snapshot.viewport[0]
    assert.ok(dpr > 0)
    assert.ok(Math.abs(on.info.height - withReading.snapshot.viewport[1] * dpr) <= 1)
    const cssTop = image.y + image.height - 18
    const cssBottom = image.y + image.height - 2
    const bands = [
        { side: 'left', cssLeft: image.x, cssRight: image.x + 1 },
        { side: 'right', cssLeft: image.x + image.width - 1, cssRight: image.x + image.width },
    ]
    const sides = bands.map((band) => {
        const differences = []
        const maximumChannelDifferences = []
        const luminanceDarkening = []
        const baselineLuminance = []
        const coordinates = []
        for (let y = Math.floor(cssTop * dpr); y < Math.ceil(cssBottom * dpr); y++) {
            const centerY = (y + 0.5) / dpr
            if (centerY < cssTop || centerY >= cssBottom) continue
            for (let x = Math.floor(band.cssLeft * dpr); x < Math.ceil(band.cssRight * dpr); x++) {
                const centerX = (x + 0.5) / dpr
                if (centerX < band.cssLeft || centerX >= band.cssRight) continue
                assert.ok(x >= 0 && x < on.info.width && y >= 0 && y < on.info.height)
                const offset = (y * on.info.width + x) * 3
                const active = Array.from(on.data.subarray(offset, offset + 3))
                const baseline = Array.from(off.data.subarray(offset, offset + 3))
                const delta = baseline.map((value, channel) => Math.abs(value - active[channel]))
                differences.push(...delta)
                maximumChannelDifferences.push(Math.max(...delta))
                const activeLuminance = active[0] * 0.2126 + active[1] * 0.7152 + active[2] * 0.0722
                const unchangedLuminance =
                    baseline[0] * 0.2126 + baseline[1] * 0.7152 + baseline[2] * 0.0722
                luminanceDarkening.push(unchangedLuminance - activeLuminance)
                baselineLuminance.push(unchangedLuminance)
                coordinates.push([x, y])
            }
        }
        assert.ok(coordinates.length > 0, 'edge has physical sample pixels')
        return {
            side: band.side,
            cssBand: { left: band.cssLeft, right: band.cssRight, top: cssTop, bottom: cssBottom },
            physicalPixelCount: coordinates.length,
            physicalBounds: {
                left: Math.min(...coordinates.map(([x]) => x)),
                right: Math.max(...coordinates.map(([x]) => x)),
                top: Math.min(...coordinates.map(([, y]) => y)),
                bottom: Math.max(...coordinates.map(([, y]) => y)),
            },
            meanAbsoluteChannelDifference:
                differences.reduce((sum, value) => sum + value, 0) / differences.length,
            percentile95MaximumChannelDifference: percentile(maximumChannelDifferences, 0.95),
            maximumChannelDifference: Math.max(...maximumChannelDifferences),
            meanDarkening:
                luminanceDarkening.reduce((sum, value) => sum + value, 0) /
                luminanceDarkening.length,
            percentile95Darkening: percentile(luminanceDarkening, 0.95),
            fractionDarkenedOver16:
                luminanceDarkening.filter((value) => value > 16).length / luminanceDarkening.length,
            meanBaselineLuminance:
                baselineLuminance.reduce((sum, value) => sum + value, 0) / baselineLuminance.length,
        }
    })
    return {
        withReading: withReading.path,
        withoutReading: withoutReading.path,
        index: withReading.snapshot.index,
        cssViewport: withReading.snapshot.viewport,
        pngSize: [on.info.width, on.info.height],
        dpr,
        image,
        tolerance: {
            meanAbsoluteChannelDifference: 4,
            percentile95MaximumChannelDifference: 16,
            meanDarkening: 4,
            fractionDarkenedOver16: 0.05,
            minimumBaselineLuminance: 40,
        },
        sides,
    }
}

function assertReadingBorderPixels(samples) {
    for (const side of samples.sides) {
        assert.ok(
            side.meanBaselineLuminance >= samples.tolerance.minimumBaselineLuminance,
            side.side + ' samples cover the visible stroke rather than the black exterior',
        )
        assert.ok(
            side.meanAbsoluteChannelDifference <= samples.tolerance.meanAbsoluteChannelDifference,
            side.side + ' outline RGB remains stable with reading overlay: ' + JSON.stringify(side),
        )
        assert.ok(
            side.percentile95MaximumChannelDifference <=
                samples.tolerance.percentile95MaximumChannelDifference,
            side.side +
                ' outline changes are limited to small antialias differences: ' +
                JSON.stringify(side),
        )
        assert.ok(
            side.meanDarkening <= samples.tolerance.meanDarkening,
            side.side + ' reading overlay does not darken the outline: ' + JSON.stringify(side),
        )
        assert.ok(
            side.fractionDarkenedOver16 <= samples.tolerance.fractionDarkenedOver16,
            side.side + ' no persistent darkened vertical border segment: ' + JSON.stringify(side),
        )
    }
}

async function chooseReadingWave(window, waveStyle) {
    await click(window, '[data-practice-navigation-action="settings"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"] fieldset:not(:disabled)')),
        'practice settings ready',
    )
    await clickText(window, '外观', '[role="dialog"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"] button[aria-label^="朗读样式："]')),
        'reading style control',
    )
    await click(window, '[role="dialog"] button[aria-label^="朗读样式："]')
    await evaluate(
        window,
        (value) => {
            const trigger = document.querySelector(
                '[role="dialog"] button[aria-label^="朗读样式："]',
            )
            const menu = document.getElementById(trigger?.getAttribute('aria-controls') ?? '')
            const option = Array.from(menu?.querySelectorAll('[role="menuitemradio"]') ?? []).find(
                (element) => {
                    const copy = element.cloneNode(true)
                    copy.querySelectorAll('[aria-hidden="true"]').forEach((decoration) =>
                        decoration.remove(),
                    )
                    return copy.textContent.trim() === value
                },
            )
            if (!option || option.closest('[inert]'))
                throw new Error('Missing reading style: ' + value)
            option.focus()
            option.click()
        },
        waveStyle,
    )
    await waitFor(
        window,
        (value) =>
            document.querySelector(
                '[role="dialog"] button[aria-label="朗读样式：' + value + '"]',
            ) !== null,
        'reading style updates immediately',
        waveStyle,
    )
    await click(window, '[role="dialog"] button[aria-label="关闭对话框"]')
    await waitFor(
        window,
        () => !document.querySelector('[role="dialog"]'),
        'practice settings exit',
    )
    return waitPending(window, waveStyle)
}

async function runPracticeReadingChecks(window, origin, label) {
    if (process.env.SMOKE_READING_FIXTURE === '1')
        throw new Error(
            'This smoke validates the source-free production build; run the separate reading fixture checks for real sources.',
        )
    const result = {
        label,
        status: 'running',
        fixture: false,
        families: [],
        excluded: [],
        mediaRequests: [],
        permissionRequests: [],
        screenshots: [],
        limitations: [
            '当前正式演示题没有课程readingSource；验证静态声纹及无伪播放，不代替真实音源专项。',
            '音频/视频既有技术媒体metadata请求可以存在，不将技术纯音当成课程朗读。',
            '只执行1920×1080 PC自动专项；平板/H5视觉、触屏及自动播放限制仍待真机验收。',
        ],
    }
    const session = window.webContents.session
    const priorSize = window.getContentSize()
    const priorMinimum = window.getMinimumSize()
    const priorZoom = window.webContents.getZoomFactor()
    let originalToolbarCache
    let originalPreferences
    let originalTheme
    let storageRead = false
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (
            details.resourceType === 'media' ||
            /\.(?:wav|mp3|m4a|aac|ogg|flac|mp4|webm)(?:[?#]|$)/i.test(details.url)
        )
            result.mediaRequests.push({
                url: details.url,
                method: details.method,
                type: details.resourceType,
            })
        callback({ requestHeaders: details.requestHeaders })
    })
    session.setPermissionRequestHandler((_contents, permission, callback) => {
        result.permissionRequests.push(permission)
        callback(false)
    })
    try {
        window.setMinimumSize(0, 0)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await window.loadURL(origin + '/practice/')
        await settle(window)
        originalToolbarCache = await readToolbarCache(window, origin)
        const originals = await evaluate(
            window,
            (preferenceName, themeName) => ({
                preferences: window.localStorage.getItem(preferenceName),
                theme: window.localStorage.getItem(themeName),
            }),
            preferencesKey,
            themeKey,
        )
        originalPreferences = originals.preferences
        originalTheme = originals.theme
        storageRead = true
        await evaluate(
            window,
            (preferenceName, themeName) => {
                let saved = {}
                try {
                    const stored = JSON.parse(window.localStorage.getItem(preferenceName) ?? '{}')
                    if (stored && typeof stored.values === 'object' && stored.values !== null)
                        saved = stored.values
                } catch {
                    // 独立验收profile允许临时替换不可解析的偏好，finally会原样恢复。
                }
                window.localStorage.setItem(
                    preferenceName,
                    JSON.stringify({
                        version: 1,
                        values: {
                            ...saved,
                            readingWave: '默认竖条',
                            fontSize: '默认',
                            grammarFontSize: '默认',
                            transitionSound: false,
                            evaluationSound: false,
                            typingSound: false,
                            correctSound: false,
                            errorSound: false,
                            completionSound: false,
                            correctEffect: false,
                            completionEffect: false,
                        },
                    }),
                )
                window.localStorage.setItem(themeName, 'dark')
            },
            preferencesKey,
            themeKey,
        )
        await resetToolbarCache(window, origin)
        result.mediaRequests.length = 0
        await visit(window, origin, 'word-basic', 'pronounce')
        result.initial = await waitPending(window)
        assertImageGeometry(result.initial)
        assert.equal(
            result.initial.audioElements.some((audio) => audio.source),
            false,
        )
        await delay(250)
        assert.deepEqual(
            result.mediaRequests,
            [],
            'source-free word entry creates no media request, including detached Audio',
        )
        await click(window, '[data-practice-footer-item="next"]')
        await waitFor(
            window,
            () =>
                Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex) ===
                    1 &&
                document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState === 'idle',
            'next word committed and card settled',
        )
        result.next = await waitPending(window)
        assertImageGeometry(result.next)
        result.styleChange = await chooseReadingWave(window, '雨滴点阵')
        assertImageGeometry(result.styleChange)
        await openOptions(window, 'word')
        const borderWithReading = await captureWordBorderFrame(window, label, 'border-reading-on')
        result.screenshots.push(borderWithReading.path)
        await click(window, '[data-practice-options="word"] [role="switch"][aria-label="切读"]')
        await waitNoOverlay(window)
        result.cutReadingOff = await inspect(window)
        const borderWithoutReading = await captureWordBorderFrame(
            window,
            label,
            'border-reading-off',
        )
        result.screenshots.push(borderWithoutReading.path)
        result.borderPixels = await sampleReadingBorderPixels(
            borderWithReading,
            borderWithoutReading,
        )
        assertReadingBorderPixels(result.borderPixels)
        await click(window, '[data-practice-options="word"] [role="switch"][aria-label="切读"]')
        result.cutReadingOn = await waitPending(window, '雨滴点阵')
        await closeOptions(window, 'word')
        assert.deepEqual(
            result.mediaRequests,
            [],
            'word navigation, settings and toggle never fake reading media',
        )
        mkdirSync(resolve('dist'), { recursive: true })
        const screenshot = 'dist/practice-reading-' + label.toLowerCase() + '-1920.png'
        writeFileSync(resolve(screenshot), (await window.webContents.capturePage()).toPNG())
        result.screenshots.push(screenshot)
        for (const [demo, mode] of fallbackCases) {
            await visit(window, origin, demo, mode)
            const snapshot = await waitPending(window, '雨滴点阵')
            result.families.push({ demo, mode, snapshot })
            if (demo === 'word-basic') {
                const layers = await evaluate(window, () => {
                    const border = document.querySelector('[data-word-card-border]')
                    const overlay = document.querySelector('[data-practice-reading-overlay]')
                    return border && overlay
                        ? {
                              border: Number(getComputedStyle(border).zIndex),
                              overlay: Number(getComputedStyle(overlay).zIndex),
                              pointerEvents: getComputedStyle(border).pointerEvents,
                          }
                        : null
                })
                assert.ok(layers && layers.border > layers.overlay)
                assert.equal(layers.pointerEvents, 'none')
                result.spellingBorderLayers = layers
            }
            if (demo === 'sentence-basic') {
                await openOptions(window, 'sentence')
                await click(
                    window,
                    '[data-practice-options="sentence"] [role="switch"][aria-label="图片"]',
                )
                await waitNoOverlay(window)
                result.imageHidden = await inspect(window)
                await click(
                    window,
                    '[data-practice-options="sentence"] [role="switch"][aria-label="图片"]',
                )
                result.imageRestored = await waitPending(window, '雨滴点阵')
                await closeOptions(window, 'sentence')
            }
        }
        for (const [demo, mode] of excludedCases) {
            await visit(window, origin, demo, mode)
            await waitNoOverlay(window)
            result.excluded.push({ demo, mode, snapshot: await inspect(window) })
        }
        assert.deepEqual(result.permissionRequests, [], 'no microphone or other permission request')
        assert.deepEqual(
            result.mediaRequests.filter((request) => {
                const path = new URL(request.url).pathname
                return (
                    path !== '/practice-demo/technical-tone.wav' &&
                    path !== '/practice-demo/technical-video.mp4'
                )
            }),
            [],
            'source-free production never loads a made-up course reading file',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.stack : String(error)
        try {
            result.failure = await inspect(window)
            const path = 'dist/practice-reading-' + label.toLowerCase() + '-failure.png'
            mkdirSync(resolve('dist'), { recursive: true })
            writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
            result.screenshots.push(path)
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        try {
            if (originalToolbarCache !== undefined)
                await restoreToolbarCache(window, originalToolbarCache)
            if (storageRead)
                await evaluate(
                    window,
                    (preferenceName, previousPreferences, themeName, previousTheme) => {
                        if (previousPreferences === null)
                            window.localStorage.removeItem(preferenceName)
                        else window.localStorage.setItem(preferenceName, previousPreferences)
                        if (previousTheme === null) window.localStorage.removeItem(themeName)
                        else window.localStorage.setItem(themeName, previousTheme)
                    },
                    preferencesKey,
                    originalPreferences,
                    themeKey,
                    originalTheme,
                )
        } finally {
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setMinimumSize(...priorMinimum)
            window.setContentSize(...priorSize)
            mkdirSync(resolve('dist'), { recursive: true })
            writeFileSync(
                resolve('dist/practice-reading-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runPracticeReadingChecks }

const standalone =
    require.main === module ||
    (process.type === 'browser' &&
        process.argv.slice(1).some((argument) => resolve(argument) === __filename))
if (standalone)
    void runStandalonePanelMotionSmoke({
        reportName: 'practice-reading-runtime-validation',
        runChecks: runPracticeReadingChecks,
        timeoutMs: 240000,
    })
