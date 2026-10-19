const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function state(window) {
    return evaluate(window, () => ({
        url: location.href,
        dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).map((element) =>
            element.textContent.slice(0, 140),
        ),
        checked: document.querySelector('input[name][type="radio"]:checked')?.value,
        ready: Array.from(document.querySelectorAll('[data-lottie-status]')).map(
            (element) => element.dataset.lottieStatus,
        ),
        effects: Array.from(document.querySelectorAll('[data-practice-feedback-effect]')).map(
            (element) => element.dataset.practiceFeedbackEffect,
        ),
        waves: Array.from(document.querySelectorAll('[data-audio-wave]')).map((element) => [
            element.dataset.audioWave,
            element.dataset.waveActive,
        ]),
        text: document.body.innerText.slice(-1800),
    }))
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 160; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error('Timed out: ' + description + ' ' + JSON.stringify(await state(window)))
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'assets complete',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (
                !element ||
                element.closest('[inert]') ||
                element.matches(':disabled') ||
                element.getBoundingClientRect().width === 0
            )
                throw new Error('Unavailable control ' + target)
            element.focus()
            element.click()
        },
        selector,
    )
}

async function clickText(window, text) {
    await evaluate(
        window,
        (label) => {
            function accessibleText(element) {
                const copy = element.cloneNode(true)
                copy.querySelectorAll('[aria-hidden="true"]').forEach((decoration) =>
                    decoration.remove(),
                )
                return copy.textContent.trim()
            }
            const element = Array.from(
                document.querySelectorAll('button,summary,[role="menuitemradio"]'),
            ).find(
                (item) =>
                    accessibleText(item) === label &&
                    item.getBoundingClientRect().width > 0 &&
                    !item.closest('[inert]'),
            )
            if (!element) throw new Error('Unavailable text control ' + label)
            element.focus()
            element.click()
        },
        text,
    )
}

function press(window, keyCode) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    if (keyCode === 'Enter' || keyCode === 'Space')
        window.webContents.sendInputEvent({
            type: 'char',
            keyCode: keyCode === 'Enter' ? '\r' : ' ',
        })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
}

async function capture(window, name) {
    await settle(window)
    const file = resolve('dist/settings-effects-' + name + '.png')
    writeFileSync(file, (await window.webContents.capturePage()).toPNG())
    return file
}

async function chooseWave(window, label, style) {
    await waitFor(
        window,
        (value) => Boolean(document.querySelector('button[aria-label^="' + value + '："]')),
        'wave field mounted',
        label,
    )
    await click(window, 'button[aria-label^="' + label + '："]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="menuitemradio"]')),
        'wave choices open',
    )
    await clickText(window, style)
    await waitFor(
        window,
        (value) =>
            document.querySelector('[role="img"][aria-label^="录音样式"]')?.dataset.audioWave ===
            value,
        'recording wave chosen',
        style,
    )
}

async function settingsReady(window) {
    await waitFor(
        window,
        () => Boolean(document.querySelector('fieldset:not(:disabled)')),
        'settings hydration and recovery',
    )
    await settle(window)
}

async function enterPractice(window, origin, demo, mode) {
    await settle(window)
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice entry',
    )
    await settle(window)
}

async function runSettingsEffectsChecks(window, origin, label) {
    const result = {
        label,
        status: 'running',
        effects: [],
        waves: [],
        responsive: [],
        pageZoom: [],
        businessRequests: [],
        permissionRequests: [],
        screenshots: [],
        limitations: [
            '录音使用现有演示状态；未申请麦克风或接入评分。',
            'PC人工视觉；平板/H5只做自动几何检查，视觉与真机待用户验收。',
        ],
    }
    const session = window.webContents.session
    const initialSize = window.getContentSize()
    const initialMinimum = window.getMinimumSize()
    const initialZoom = window.webContents.getZoomFactor()
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const pages = new Set(manifest.routes)
    const files = new Set(manifest.files.map((file) => '/' + file))
    const appOrigin = new URL(origin)
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        const url = new URL(details.url)
        const same = url.protocol === appOrigin.protocol && url.host === appOrigin.host
        const page = isExportedPageRequest(details, origin, pages)
        const asset = same && ['GET', 'HEAD'].includes(details.method) && files.has(url.pathname)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!same && ['http:', 'https:'].includes(url.protocol)) ||
            (['xhr', 'fetch'].includes(details.resourceType) && !page && !asset)
        )
            result.businessRequests.push({ url: details.url, type: details.resourceType })
        callback({ requestHeaders: details.requestHeaders })
    })
    session.setPermissionRequestHandler((_contents, permission, callback) => {
        result.permissionRequests.push(permission)
        callback(false)
    })
    let ownsDebugger = false
    try {
        window.setMinimumSize(0, 0)
        window.setContentSize(1440, 900)
        window.webContents.setZoomFactor(1)
        window.webContents.setBackgroundThrottling(false)
        if (!window.webContents.debugger.isAttached()) {
            window.webContents.debugger.attach('1.3')
            ownsDebugger = true
        }
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        await window.loadURL(origin + '/settings/?tab=effects')
        await settingsReady(window)
        // Isolated profile only: exercise a real persisted v1 upgrade, then hydrate normally.
        await evaluate(window, () => {
            window.localStorage.setItem(
                'english-learning-preferences-v1',
                JSON.stringify({
                    version: 1,
                    values: {
                        correctEffectType: '🐸',
                        recordingWave: '默认竖条',
                        readingWave: '默认竖条',
                        correctEffect: true,
                        completionEffect: true,
                    },
                }),
            )
        })
        await settle(window)
        await window.loadURL(window.webContents.getURL())
        await settingsReady(window)
        await waitFor(
            window,
            () => document.querySelectorAll('[data-lottie-status="ready"]').length === 8,
            'eight original animations decoded',
        )
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('input[type="radio"]:checked')?.value,
            ),
            'lottie-0',
            'legacy particles use the explicit new first default',
        )
        const firstFrame = await evaluate(
            window,
            () => document.querySelector('[data-animation-option="lottie-0"] svg')?.innerHTML,
        )
        await delay(150)
        assert.notEqual(
            await evaluate(
                window,
                () => document.querySelector('[data-animation-option="lottie-0"] svg')?.innerHTML,
            ),
            firstFrame,
            'preview actually advances vector frames',
        )
        await evaluate(window, () => document.querySelector('input[value="lottie-0"]').focus())
        press(window, 'Right')
        await waitFor(
            window,
            () => document.querySelector('input[value="lottie-1"]').checked,
            'native radio arrow selection',
        )
        result.keyboardRadio = true
        result.reference = await evaluate(window, () => {
            const cards = Array.from(document.querySelectorAll('[data-animation-option]')).map(
                (element) => {
                    const rect = element.getBoundingClientRect()
                    return {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        cursor: getComputedStyle(element).cursor,
                    }
                },
            )
            const heading = document.querySelector('section h2')
            const font = heading ? getComputedStyle(heading) : null
            return {
                cards,
                gap: cards[1].x - cards[0].x - cards[0].width,
                heading: font
                    ? {
                          size: font.fontSize,
                          height: font.lineHeight,
                          weight: font.fontWeight,
                          spacing: font.letterSpacing,
                      }
                    : null,
            }
        })
        assert.ok(
            result.reference.cards.every(
                (card) => card.width === 150 && card.height === 150 && card.cursor === 'pointer',
            ),
        )
        assert.equal(result.reference.gap, 20)
        for (const id of [
            'lottie-0',
            'lottie-1',
            'lottie-2',
            'lottie-4',
            'lottie-5',
            'lottie-6',
            'lottie-7',
        ]) {
            await click(window, 'input[value="' + id + '"]')
            await waitFor(
                window,
                (value) =>
                    JSON.parse(window.localStorage.getItem('english-learning-preferences-v1'))
                        .values.correctEffectType === value,
                'selected animation saved',
                id,
            )
            await evaluate(
                window,
                (value) =>
                    document
                        .querySelector('[data-animation-option="' + value + '"]')
                        .scrollIntoView({ block: 'center' }),
                id,
            )
            await waitFor(
                window,
                (value) =>
                    Boolean(
                        document.querySelector(
                            '[data-animation-option="' +
                                value +
                                '"] [data-lottie-status="ready"] svg',
                        ),
                    ),
                'selected preview ready',
                id,
            )
            const frame = await evaluate(
                window,
                (value) =>
                    document.querySelector('[data-animation-option="' + value + '"] svg')
                        ?.innerHTML,
                id,
            )
            await delay(150)
            assert.notEqual(
                await evaluate(
                    window,
                    (value) =>
                        document.querySelector('[data-animation-option="' + value + '"] svg')
                            ?.innerHTML,
                    id,
                ),
                frame,
                id + ' preview advances frames',
            )
            result.effects.push({ id, previewPlayback: true })
        }
        await settle(window)
        await window.loadURL(window.webContents.getURL())
        await settingsReady(window)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('input[type="radio"]:checked')?.value,
            ),
            'lottie-7',
        )
        result.selectionRestores = true
        result.screenshots.push(await capture(window, label.toLowerCase() + '-dark-pc'))
        await click(window, 'button[role="switch"][aria-label="答对动画特效"]')
        await waitFor(
            window,
            () => document.querySelectorAll('[data-animation-option]').length === 0,
            'correct switch removes preview players',
        )
        await click(window, 'button[role="switch"][aria-label="答对动画特效"]')
        await waitFor(
            window,
            () => document.querySelectorAll('[data-animation-option]').length === 7,
            'correct switch restores choices',
        )
        await clickText(window, '外观')
        await waitFor(
            window,
            () => Boolean(document.querySelector('button[aria-label^="录音样式："]')),
            'appearance controls',
        )
        for (const style of ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条']) {
            await chooseWave(window, '录音样式', style)
            await evaluate(window, () =>
                document
                    .querySelector('[role="img"][aria-label^="录音样式"]')
                    .scrollIntoView({ block: 'center' }),
            )
            await waitFor(
                window,
                (value) => {
                    const wave = document.querySelector('[role="img"][aria-label^="录音样式"]')
                    return value === '曲线频谱'
                        ? wave.querySelector('canvas')?.width > 0
                        : value === '波形线条'
                          ? Boolean(wave.querySelector('path[style]'))
                          : wave.querySelector('[data-wave-column]')?.style.height !== ''
                },
                'active wave renderer',
                style,
            )
            const sample = await evaluate(window, () => {
                const wave = document.querySelector('[role="img"][aria-label^="录音样式"]')
                const rect = wave.getBoundingClientRect()
                const canvas = wave.querySelector('canvas')
                const bar = wave.querySelector('[data-wave-column]')
                const path = wave.querySelector('path')
                return {
                    style: wave.dataset.audioWave,
                    width: rect.width,
                    height: rect.height,
                    signature: canvas
                        ? canvas.toDataURL()
                        : (bar?.getAttribute('style') ?? path?.outerHTML),
                    columns: wave.querySelectorAll('[data-wave-column]').length,
                }
            })
            await delay(150)
            const after = await evaluate(window, () => {
                const wave = document.querySelector('[role="img"][aria-label^="录音样式"]')
                return (
                    wave.querySelector('canvas')?.toDataURL() ??
                    wave.querySelector('[data-wave-column]')?.getAttribute('style') ??
                    wave.querySelector('path')?.outerHTML
                )
            })
            assert.notEqual(after, sample.signature, style + ' moves')
            assert.equal(sample.height, 70)
            result.waves.push({
                style,
                height: sample.height,
                columns: sample.columns,
                moving: true,
            })
            if (style === '曲线频谱')
                result.screenshots.push(await capture(window, label.toLowerCase() + '-spectrum-pc'))
        }
        await click(window, 'button[aria-label^="朗读样式："]')
        await clickText(window, '雨滴点阵')
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await delay(150)
        const staticFrame = await evaluate(
            window,
            () => document.querySelector('[role="img"][aria-label^="录音样式"] path').outerHTML,
        )
        await delay(150)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[role="img"][aria-label^="录音样式"] path').outerHTML,
            ),
            staticFrame,
            'reduced wave remains static',
        )
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [],
        })
        for (const width of [1440, 1024, 768, 390, 320]) {
            window.setContentSize(width, 900)
            await settle(window)
            const geometry = await evaluate(window, () => ({
                width: innerWidth,
                overflow: document.documentElement.scrollWidth > innerWidth,
                waves: Array.from(document.querySelectorAll('[data-audio-wave]')).map((wave) => ({
                    height: wave.getBoundingClientRect().height,
                    width: wave.getBoundingClientRect().width,
                })),
            }))
            assert.equal(geometry.overflow, false)
            assert.ok(
                geometry.waves.every(
                    (wave) => wave.height === 70 && wave.width > 0 && wave.width <= geometry.width,
                ),
            )
            result.responsive.push(geometry)
        }
        window.setContentSize(1440, 900)
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            await settle(window)
            const geometry = await evaluate(window, () => ({
                width: innerWidth,
                overflow: document.documentElement.scrollWidth > innerWidth,
            }))
            assert.equal(geometry.overflow, false)
            result.pageZoom.push({ factor, ...geometry })
        }
        window.webContents.setZoomFactor(1)
        await clickText(window, '特效')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-animation-option]')),
            'effects panel mounted for light screenshot',
        )
        await evaluate(window, () =>
            document.querySelector('[data-animation-option]').scrollIntoView({ block: 'center' }),
        )
        await evaluate(window, () => {
            document.documentElement.dataset.theme = 'light'
        })
        await delay(250)
        result.screenshots.push(await capture(window, label.toLowerCase() + '-light-pc'))
        await clickText(window, '外观')
        await chooseWave(window, '录音样式', '曲线频谱')
        await evaluate(window, () =>
            document
                .querySelector('[role="img"][aria-label^="录音样式"]')
                .scrollIntoView({ block: 'center' }),
        )
        await waitFor(
            window,
            () => document.querySelector('[role="img"][aria-label^="录音样式"] canvas')?.width > 0,
            'light spectrum initialized',
        )
        result.screenshots.push(await capture(window, label.toLowerCase() + '-light-spectrum-pc'))
        await chooseWave(window, '录音样式', '波形线条')
        await evaluate(window, () => {
            document.documentElement.dataset.theme = 'dark'
        })

        await enterPractice(window, origin, 'word-basic', 'typing')
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-demo-tools]')),
            ),
            false,
            'demo tools removed',
        )
        result.practiceCorrectFeedback =
            'Awaiting real judging events; preview playback and feedback-controller unit tests remain covered.'
        for (let index = 0; index < 12; index++) {
            await click(window, '[data-practice-footer-item="next"]')
            await delay(80)
            if (
                await evaluate(window, () =>
                    Boolean(
                        document
                            .querySelector('[role="dialog"][aria-labelledby]')
                            ?.textContent.includes('完成练习'),
                    ),
                )
            )
                break
        }
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-feedback-effect="chapter-complete"]')
                    ?.dataset.lottieStatus === 'ready',
            'chapter complete original fireworks',
        )
        await delay(1200)
        result.screenshots.push(await capture(window, label.toLowerCase() + '-completion-pc'))
        const complete = await evaluate(window, () => ({
            pointer: getComputedStyle(document.querySelector('[data-practice-feedback-effect]'))
                .pointerEvents,
            z: getComputedStyle(document.querySelector('[data-practice-feedback-effect]')).zIndex,
        }))
        assert.equal(complete.pointer, 'none')
        assert.equal(complete.z, '70')
        await click(window, '[aria-label="关闭完成练习"]')
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-feedback-effect]'),
            'completion close cleans fireworks',
        )
        result.chapterCompletion = true

        await enterPractice(window, origin, 'word-basic', 'oral')
        await clickText(window, '开始录音演示')
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector('[data-audio-wave="波形线条"][data-wave-active="true"]'),
                ),
            'recording selection used by oral demo',
        )
        await clickText(window, '结束录音演示')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-audio-wave="波形线条"]')?.dataset.waveActive ===
                'false',
            'ending recording stops wave',
        )
        result.recordingDemo = true
        await enterPractice(window, origin, 'audio-basic', 'typing')
        await clickText(window, '播放')
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector(
                        '[data-practice-playback-wave] [data-audio-wave="雨滴点阵"]',
                    ),
                ),
            'real playing event starts selected reading wave',
        )
        await evaluate(window, () => {
            const player = document.querySelector('section[aria-label$="音频播放器"]')
            const button = Array.from(player.querySelectorAll('button')).find(
                (element) => element.textContent.trim() === '暂停',
            )
            if (!button) throw new Error('Playing media pause control missing')
            button.click()
        })
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-playback-wave]'),
            'media pause stops reading wave',
        )
        result.actualMediaWave = true
        await clickText(window, '播放')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-playback-wave]')),
            'media resumes before route departure',
        )
        await settle(window)
        await window.loadURL(origin + '/settings/?tab=effects')
        await settingsReady(window)
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-playback-wave]')),
            ),
            false,
            'route departure removes active media wave',
        )
        result.mediaRouteCleanup = true
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await waitFor(
            window,
            () => document.querySelectorAll('[data-lottie-status="ready"]').length === 8,
            'reduced previews load',
        )
        await delay(150)
        const stopped = await evaluate(
            window,
            () => document.querySelector('[data-animation-option="lottie-0"] svg').innerHTML,
        )
        await delay(150)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-animation-option="lottie-0"] svg').innerHTML,
            ),
            stopped,
            'Lottie reduced previews are static',
        )
        result.reducedMotion = true
        assert.deepEqual(result.businessRequests, [])
        assert.deepEqual(result.permissionRequests, [])
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = describeError(error)
        result.failureState = await state(window)
        result.failureScreenshot = await capture(window, label.toLowerCase() + '-failure')
        throw error
    } finally {
        if (window.webContents.debugger.isAttached()) {
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
            await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
                enabled: false,
            })
            if (ownsDebugger) window.webContents.debugger.detach()
        }
        window.webContents.setZoomFactor(initialZoom)
        window.setMinimumSize(...initialMinimum)
        window.setContentSize(...initialSize)
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        writeFileSync(
            resolve('dist/settings-effects-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runSettingsEffectsChecks }

function describeError(error) {
    return error instanceof Error
        ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              actual: error.actual,
              expected: error.expected,
          }
        : { name: 'UnknownError', message: String(error) }
}

/** 独立profile加载真实production协议与HTTP静态预览；不构建、不占开发锁。 */
async function runStandaloneSettingsEffectsSmoke() {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        environments: [],
        consoleErrors: [],
        networkFailures: [],
        host: {},
    }
    const observedSessions = new Set()
    const observedWindows = new Map()
    const consoleListeners = new Map()
    let deadline
    let finished = false
    function finish(error) {
        if (finished) return
        finished = true
        clearTimeout(deadline)
        report.status = error === undefined ? 'passed' : 'failed'
        if (error !== undefined) report.error = describeError(error)
        mkdirSync(resolve(projectRoot, 'dist'), { recursive: true })
        writeFileSync(
            resolve(projectRoot, 'dist/settings-effects-runtime-validation.json'),
            JSON.stringify(report, null, 4),
        )
        for (const [contents, listener] of consoleListeners)
            if (!contents.isDestroyed()) contents.removeListener('console-message', listener)
        for (const observed of observedSessions) {
            observed.webRequest.onCompleted(null)
            observed.webRequest.onErrorOccurred(null)
        }
        process.removeListener('uncaughtException', finish)
        process.removeListener('unhandledRejection', finish)
        if (error === undefined) console.log('Settings effects passed: Electron and Web')
        else console.error('Settings effects failed:', error)
        app.exit(error === undefined ? 0 : 1)
    }
    function observe(window, label) {
        observedWindows.set(window.webContents.id, label)
        const listener = (event) => {
            if (event.level === 'warning' || event.level === 'error')
                report.consoleErrors.push({ label, message: event.message })
        }
        consoleListeners.set(window.webContents, listener)
        window.webContents.on('console-message', listener)
        const observed = window.webContents.session
        if (observedSessions.has(observed)) return
        observedSessions.add(observed)
        observed.webRequest.onCompleted((details) => {
            if (details.statusCode >= 400)
                report.networkFailures.push({
                    label: observedWindows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    status: details.statusCode,
                })
        })
        observed.webRequest.onErrorOccurred((details) => {
            if (details.error !== 'net::ERR_ABORTED')
                report.networkFailures.push({
                    label: observedWindows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    error: details.error,
                })
        })
    }
    async function runEnvironment(window, origin, label) {
        const index = report.environments.length
        report.environments.push({ label, status: 'running' })
        console.log('Settings effects ' + label + ' start')
        try {
            report.environments[index] = await runSettingsEffectsChecks(window, origin, label)
            console.log('Settings effects ' + label + ' complete')
        } catch (error) {
            report.environments[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport: 'dist/settings-effects-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Settings effects smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (
            !profile ||
            !isAbsolute(profile) ||
            resolve(profile) === resolve(app.getPath('userData'))
        )
            throw new Error('Settings effects smoke requires an isolated absolute userData profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Settings effects smoke must use the production protocol')
        const preview = new URL(process.env.SMOKE_WEB_ORIGIN ?? '')
        if (
            !['http:', 'https:'].includes(preview.protocol) ||
            preview.pathname !== '/' ||
            preview.search ||
            preview.hash
        )
            throw new Error('SMOKE_WEB_ORIGIN must be an HTTP(S) origin without a path/query')
        process.chdir(projectRoot)
        app.setAppPath(projectRoot)
        app.setPath('userData', profile)
        process.on('uncaughtException', finish)
        process.on('unhandledRejection', finish)
        deadline = setTimeout(
            () => finish(new Error('Settings effects smoke exceeded 240 seconds')),
            240000,
        )
        app.on('browser-window-created', (_event, window) => {
            if (observedWindows.size === 0) observe(window, 'Electron')
        })
        await import(pathToFileURL(resolve(projectRoot, 'dist/electron/main.js')).href)
        await app.whenReady()
        let production
        for (let attempt = 0; attempt < 100; attempt++) {
            production = BrowserWindow.getAllWindows().find((window) =>
                window.webContents.getURL().startsWith('englishlearning://app'),
            )
            if (production && !production.webContents.isLoading()) break
            await delay(75)
        }
        assert.ok(production, 'real production host creates its window')
        await settle(production)
        const preferences = production.webContents.getLastWebPreferences()
        assert.equal(preferences.sandbox, true)
        assert.equal(preferences.contextIsolation, true)
        assert.equal(preferences.nodeIntegration, false)
        assert.equal(
            await evaluate(production, () => window.learningDesktop.getAppVersion()),
            app.getVersion(),
            'real preload and validated IPC respond',
        )
        report.host = {
            protocol: 'englishlearning://app',
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
            preloadAndIpc: true,
        }
        await runEnvironment(production, 'englishlearning://app', 'Electron')
        const browser = new BrowserWindow({
            show: false,
            width: 1440,
            height: 900,
            webPreferences: {
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                backgroundThrottling: false,
            },
        })
        observe(browser, 'Web')
        await browser.loadURL(preview.origin + '/practice/')
        await settle(browser)
        await runEnvironment(browser, preview.origin, 'Web')
        assert.deepEqual(report.networkFailures, [], 'zero unexpected production resource failures')
        assert.deepEqual(report.consoleErrors, [], 'zero hydration/CSP/runtime warnings or errors')
        finish()
    } catch (error) {
        finish(error)
    }
}

const isStandaloneEntry =
    require.main === module ||
    (process.type === 'browser' &&
        process.argv.slice(1).some((argument) => resolve(argument) === __filename))
if (isStandaloneEntry) void runStandaloneSettingsEffectsSmoke()
