const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const activeDocumentFixture = false
const outputDirectory = resolve('dist/sentence-listening')

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(75)
    }
    throw new Error('Sentence listening timeout: ' + description)
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'all current images load',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        await Promise.allSettled(
            document
                .getAnimations()
                .filter((animation) =>
                    Number.isFinite(animation.effect?.getComputedTiming().endTime),
                )
                .map((animation) => animation.finished),
        )
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function click(window, selector) {
    const point = await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element) throw new Error('Missing click target: ' + target)
            const rect = element.getBoundingClientRect()
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        },
        selector,
    )
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        button: 'left',
        clickCount: 1,
        x: Math.round(point.x),
        y: Math.round(point.y),
    })
    window.webContents.sendInputEvent({
        type: 'mouseUp',
        button: 'left',
        clickCount: 1,
        x: Math.round(point.x),
        y: Math.round(point.y),
    })
}

async function press(window, keyCode) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    if (keyCode.length === 1) window.webContents.sendInputEvent({ type: 'char', keyCode })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
}

async function visit(window, origin, demo = 'sentence-basic', mode = 'listen') {
    await settle(window)
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () =>
            document.querySelector('[data-practice-phase]') &&
            document.querySelector('[data-toolbar-ready="true"]'),
        'ready session and mounted preferences',
    )
    await settle(window)
}

async function snapshot(window) {
    return evaluate(window, () => {
        const measure = (element) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom,
                right: rect.right,
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                fontWeight: style.fontWeight,
                color: style.color,
                background: style.backgroundColor,
                opacity: style.opacity,
                cursor: style.cursor,
            }
        }
        const root = document.querySelector('[data-sentence-listening]')
        return {
            viewport: [innerWidth, innerHeight],
            clientWidth: document.documentElement.clientWidth,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            root: measure(root),
            image: measure(root?.querySelector('[data-practice-media]')),
            annotation: measure(root?.querySelector('[data-annotation-variant]')),
            layers: Array.from(root?.querySelectorAll('[data-listening-token]') ?? [], (token) =>
                Object.fromEntries(
                    Array.from(token.querySelectorAll('[data-listening-layer]'), (layer) => [
                        layer.dataset.listeningLayer,
                        measure(layer),
                    ]),
                ),
            ),
            translation: measure(root?.querySelector('[data-practice-translation]')),
            note: measure(root?.querySelector('[data-sentence-listening-note]')),
            oral: measure(root?.querySelector('[data-practice-quick-oral]')),
            icons: Array.from(root?.querySelectorAll('button img') ?? [], (icon) => ({
                ...measure(icon),
                natural: [icon.naturalWidth, icon.naturalHeight],
                loaded: icon.complete,
                source: icon.getAttribute('src'),
            })),
            oralCount: document.querySelectorAll('[data-practice-quick-oral]').length,
            labelInk: Array.from(
                root?.querySelectorAll('[data-listening-layer="pos"] > span') ?? [],
                (label) => ({
                    color: getComputedStyle(label).color,
                    fontSize: getComputedStyle(label).fontSize,
                }),
            ),
        }
    })
}

async function reloadSession(window) {
    await settle(window)
    await window.loadURL(window.webContents.getURL())
    await waitFor(
        window,
        () =>
            document.querySelector('[data-sentence-listening]') &&
            document.querySelector('[data-toolbar-ready="true"]'),
        'isolated preference fixture restored',
    )
    await settle(window)
}

async function checkPreferenceLayers(window) {
    const prior = await evaluate(window, () =>
        window.localStorage.getItem('english-learning-preferences-v1'),
    )
    const results = []
    try {
        let fixedColors
        for (const brightness of [1, 4, 10]) {
            await evaluate(
                window,
                (value) =>
                    window.localStorage.setItem(
                        'english-learning-preferences-v1',
                        JSON.stringify({
                            version: 1,
                            values: { showGrammarFill: true, grammarBrightness: value },
                        }),
                    ),
                brightness,
            )
            await reloadSession(window)
            const state = await snapshot(window)
            assert.deepEqual(
                state.layers.map((token) => token.fill.opacity),
                Array(4).fill(String(brightness / 10)),
            )
            const colors = state.layers.map((token) => ({
                pos: token.pos.background,
                english: token.english.color,
                line: token.underline.color,
                meaning: token.meaning.color,
                syntax: token.syntax.color,
            }))
            if (fixedColors) assert.deepEqual(colors, fixedColors)
            else fixedColors = colors
            assert.ok(
                state.layers.every((token) =>
                    ['pos', 'english', 'underline', 'meaning', 'syntax'].every(
                        (name) => token[name].opacity === '1',
                    ),
                ),
            )
            results.push({
                brightness,
                colors,
                fillOpacity: state.layers.map((token) => token.fill.opacity),
            })
        }
        await evaluate(window, () =>
            window.localStorage.setItem(
                'english-learning-preferences-v1',
                JSON.stringify({
                    version: 1,
                    values: {
                        showPartOfSpeech: false,
                        showAnswerPhonetics: false,
                        showGrammarText: false,
                        showGrammarFill: true,
                        showTranslation: false,
                        showEvaluation: false,
                    },
                }),
            ),
        )
        await reloadSession(window)
        const hidden = await snapshot(window)
        assert.ok(
            hidden.layers.every(
                (token) =>
                    !token.pos && !token.phonetic && !token.syntax && token.underline && token.fill,
            ),
        )
        assert.equal(hidden.translation, null)
        assert.equal(hidden.oralCount, 0)
        results.push({ independentVisibility: true, noteRemains: Boolean(hidden.note) })
        return results
    } finally {
        await evaluate(
            window,
            (value) => {
                if (value === null)
                    window.localStorage.removeItem('english-learning-preferences-v1')
                else window.localStorage.setItem('english-learning-preferences-v1', value)
            },
            prior,
        )
        await reloadSession(window)
    }
}

async function checkLongWordLayout(window) {
    window.setContentSize(390, 844)
    const result = await evaluate(window, async () => {
        const token = document.querySelector('[data-listening-token]')
        const word = token.querySelector('[data-practice-english] > span')
        const original = word.textContent
        try {
            // 只临时改变隔离生产DOM中的布局样例，不是题库或输入能力验收。
            word.textContent = 'W'.repeat(160)
            await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
            token.scrollLeft = 0
            const startVisible =
                word.getBoundingClientRect().left >= token.getBoundingClientRect().left - 0.1
            token.scrollLeft = token.scrollWidth
            const endVisible =
                word.getBoundingClientRect().right <= token.getBoundingClientRect().right + 0.1
            return {
                startVisible,
                endVisible,
                localOverflow: token.scrollWidth > token.clientWidth,
                documentOverflow:
                    document.documentElement.scrollWidth > document.documentElement.clientWidth,
                fixture: 'temporary long-word DOM layout only',
            }
        } finally {
            word.textContent = original
            token.scrollLeft = 0
        }
    })
    assert.equal(result.startVisible, true)
    assert.equal(result.endVisible, true)
    assert.equal(result.localOverflow, true)
    assert.equal(result.documentOverflow, false)
    window.setContentSize(1920, 1080)
    await settle(window)
    return result
}

function near(actual, expected, message) {
    assert.ok(Math.abs(actual - expected) < 0.15, message + ': ' + actual + ' vs ' + expected)
}

function assertReference(result) {
    assert.deepEqual(result.viewport, [1920, 1080])
    for (const [key, expected] of Object.entries({ x: 745, y: 183, width: 430, height: 242 }))
        near(result.image[key], expected, 'image ' + key)
    for (const token of result.layers) {
        for (const [key, y, fontSize] of [
            ['phonetic', 484, '14px'],
            ['pos', 510, null],
            ['english', 534, '40px'],
            ['underline', 600, null],
            ['meaning', 617, '18px'],
            ['syntax', 652, '16px'],
        ]) {
            near(token[key].y, y, key + ' top')
            if (fontSize) assert.equal(token[key].fontSize, fontSize)
        }
        near(token.pos.width, 38, 'part of speech width')
        near(token.pos.height, 22, 'part of speech height')
        near(token.underline.height, 3, 'underline height')
        assert.equal(token.english.fontWeight, '500')
    }
    near(result.translation.y, 727, 'translation top')
    assert.equal(result.translation.fontSize, '30px')
    assert.equal(result.translation.fontWeight, '500')
    for (const [name, expected] of [
        ['note', { x: 922, y: 797, width: 76, height: 30 }],
        ['oral', { x: 843, y: 886, width: 234, height: 46 }],
    ])
        for (const [key, value] of Object.entries(expected))
            near(result[name][key], value, name + ' ' + key)
    assert.equal(result.note.cursor, 'pointer')
    assert.equal(result.oral.cursor, 'pointer')
    assert.deepEqual(
        result.icons.map((icon) => [icon.width, icon.height]),
        [
            [20, 20],
            [28, 28],
        ],
    )
    assert.deepEqual(
        result.icons.map((icon) => icon.natural),
        [
            [20, 20],
            [28, 28],
        ],
    )
    assert.ok(result.icons.every((icon) => icon.loaded && icon.source.startsWith('/_next/static/')))
    assert.equal(result.oralCount, 1)
    assert.equal(result.overflow, false)
    assert.deepEqual(result.labelInk, Array(4).fill({ color: 'rgb(0, 0, 0)', fontSize: '14px' }))
    assert.deepEqual(
        result.layers.map((token) => token.pos.background),
        ['rgb(255, 214, 153)', 'rgb(1, 247, 153)', 'rgb(255, 153, 216)', 'rgb(255, 235, 153)'],
    )
    assert.deepEqual(
        result.layers.slice(0, 3).map((token) => token.underline.color),
        ['rgb(255, 80, 80)', 'rgb(177, 116, 231)', 'rgb(92, 163, 255)'],
    )
}

async function runSentenceListeningChecks(window, origin, label) {
    mkdirSync(outputDirectory, { recursive: true })
    const result = {
        label,
        status: 'running',
        reference: [],
        reflow: [],
        interactions: [],
        consumers: [],
        businessRequests: [],
        permissionRequests: [],
    }
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const pages = new Set(manifest.routes)
    const files = new Set(manifest.files.map((path) => '/' + path))
    const application = new URL(origin)
    const session = window.webContents.session
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.webContentsId > 0 && details.webContentsId !== window.webContents.id) {
            callback({ requestHeaders: details.requestHeaders })
            return
        }
        const url = new URL(details.url)
        const same = url.protocol === application.protocol && url.host === application.host
        const page = isExportedPageRequest(details, origin, pages)
        const asset = same && ['GET', 'HEAD'].includes(details.method) && files.has(url.pathname)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!same && ['http:', 'https:'].includes(url.protocol)) ||
            (['xhr', 'fetch'].includes(details.resourceType) && !page && !asset)
        )
            result.businessRequests.push({ url: details.url, method: details.method })
        callback({ requestHeaders: details.requestHeaders })
    })
    session.setPermissionRequestHandler((_contents, permission, callback) => {
        result.permissionRequests.push(permission)
        callback(false)
    })
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await visit(window, origin)
        for (const theme of ['dark', 'light']) {
            // 独立 profile 的明确存储夹具经真实挂载恢复；不修改用户日常配置。
            await evaluate(
                window,
                (value) =>
                    window.localStorage.setItem('english-learning-theme', JSON.stringify(value)),
                theme,
            )
            await window.loadURL(window.webContents.getURL())
            await waitFor(
                window,
                () =>
                    document.querySelector('[data-sentence-listening]') &&
                    document.querySelector('[data-toolbar-ready="true"]'),
                'reload ready',
            )
            await settle(window)
            assert.equal(
                await evaluate(window, () => document.documentElement.dataset.theme),
                theme,
            )
            const reference = await snapshot(window)
            result.reference.push({ theme, ...reference })
            assertReference(reference)
            writeFileSync(
                resolve(outputDirectory, label.toLowerCase() + '-' + theme + '-1920.png'),
                (await window.webContents.capturePage()).toPNG(),
            )
            for (const [width, height, zoom] of [
                [1440, 900, 1],
                [1280, 900, 1],
                [1920, 1080, 1.25],
                [1920, 1080, 1.5],
                [1920, 1080, 2],
                [768, 1024, 1],
                [390, 844, 1],
            ]) {
                window.setContentSize(width, height)
                window.webContents.setZoomFactor(zoom)
                await settle(window)
                const reflow = await snapshot(window)
                assert.equal(
                    reflow.overflow,
                    false,
                    'no page horizontal overflow ' + [theme, width, zoom],
                )
                assert.equal(reflow.oralCount, 1)
                assert.ok(reflow.note.width >= 40)
                // clientWidth是整数，真实缩放下DOMRect保留小数；独立scrollWidth断言仍严格检查溢出。
                assert.ok(reflow.root.width <= reflow.clientWidth + 1)
                result.reflow.push({
                    theme,
                    width,
                    height,
                    zoom,
                    ...reflow,
                    acceptance:
                        width < 1280
                            ? 'automated geometry only; tablet/H5 visual and device pending'
                            : 'PC',
                })
                if (width === 1920 && zoom === 2)
                    writeFileSync(
                        resolve(
                            outputDirectory,
                            label.toLowerCase() + '-' + theme + '-zoom200.png',
                        ),
                        (await window.webContents.capturePage()).toPNG(),
                    )
            }
            window.setContentSize(1920, 1080)
            window.webContents.setZoomFactor(1)
            await settle(window)
        }
        result.preferenceLayers = await checkPreferenceLayers(window)
        result.longWordLayout = await checkLongWordLayout(window)
        await click(window, '[data-sentence-listening-note]')
        await waitFor(
            window,
            () => !!document.querySelector('textarea'),
            'existing note editor opens',
        )
        await evaluate(window, () => document.querySelector('textarea').focus())
        await window.webContents.insertText('听力笔记保留检查')
        await press(window, 'Escape')
        await waitFor(
            window,
            () => !document.querySelector('[data-tld-dialog-layer]'),
            'note closes',
        )
        await settle(window)
        await click(window, '[data-sentence-listening-note]')
        await waitFor(
            window,
            () => document.querySelector('textarea')?.value === '听力笔记保留检查',
            'same question note persists',
        )
        await press(window, 'Escape')
        await waitFor(
            window,
            () => !document.querySelector('[data-tld-dialog-layer]'),
            'note exit finishes',
        )
        await settle(window)
        await click(window, '[data-practice-quick-oral]')
        await waitFor(
            window,
            () => !!document.querySelector('[role="dialog"]'),
            'oral click command opens',
        )
        await press(window, 'Escape')
        await waitFor(
            window,
            () => !document.querySelector('[data-tld-dialog-layer]'),
            'oral exit finishes',
        )
        await settle(window)
        await evaluate(window, () => document.querySelector('[data-practice-phase]').focus())
        await press(window, 'V')
        await waitFor(
            window,
            () => !!document.querySelector('[data-tld-dialog-layer][data-dialog-open="true"]'),
            'existing V command opens oral',
        )
        await press(window, 'Escape')
        await waitFor(
            window,
            () => !document.querySelector('[data-tld-dialog-layer]'),
            'V oral exit finishes',
        )
        await settle(window)
        result.interactions.push('原生鼠标笔记打开/编辑/关闭重开保留；口语点击与V复用既有命令')
        for (const [demo, mode, dedicatedListeningVariant] of [
            ['sentence-basic', 'translate', false],
            ['sentence-basic', 'check', false],
            ['sentence-basic', 'blocks', false],
            ['sentence-basic', 'read', false],
            ['audio-basic', 'listen', true],
            ['audio-basic', 'translate', false],
        ]) {
            await visit(window, origin, demo, mode)
            assert.equal(
                await evaluate(
                    window,
                    () =>
                        !!document.querySelector('[data-annotation-variant="sentence-listening"]'),
                ),
                dedicatedListeningVariant,
            )
            result.consumers.push({ demo, mode, dedicatedListeningVariant })
        }
        assert.deepEqual(result.businessRequests, [])
        assert.deepEqual(result.permissionRequests, [])
        result.status = 'passed'
        return result
    } finally {
        window.webContents.setZoomFactor(1)
        writeFileSync(
            resolve('dist/practice-sentence-listening-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 2),
        )
        session.webRequest.onBeforeSendHeaders(null)
    }
}

function describeError(error) {
    return error instanceof Error
        ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              actual: error.actual,
              expected: error.expected,
          }
        : { message: String(error) }
}

/** 外部 runner 提供生产静态预览和独立 profile；本脚本不构建、不启动服务器。 */
async function runStandaloneListeningSmoke() {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        listening: [],
        consoleErrors: [],
        networkFailures: [],
        host: {},
    }
    const sessions = new Set()
    const windows = new Map()
    let finished = false
    let deadline
    function finish(error) {
        if (finished) return
        finished = true
        clearTimeout(deadline)
        report.status = error === undefined ? 'passed' : 'failed'
        if (error !== undefined) report.error = describeError(error)
        mkdirSync(resolve(projectRoot, 'dist'), { recursive: true })
        writeFileSync(
            resolve(projectRoot, 'dist/practice-sentence-listening-runtime-validation.json'),
            JSON.stringify(report, null, 4),
        )
        if (error !== undefined) console.error('Sentence listening standalone failed:', error)
        else console.log('Sentence listening standalone passed: Electron and Web')
        app.exit(error === undefined ? 0 : 1)
    }
    function observe(window, label) {
        windows.set(window.webContents.id, label)
        window.webContents.on('console-message', (event) => {
            if (event.level === 'warning' || event.level === 'error')
                report.consoleErrors.push({ label, message: event.message })
        })
        const session = window.webContents.session
        if (sessions.has(session)) return
        sessions.add(session)
        session.webRequest.onCompleted((details) => {
            if (details.statusCode >= 400)
                report.networkFailures.push({
                    label: windows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    status: details.statusCode,
                })
        })
        session.webRequest.onErrorOccurred((details) => {
            if (details.error !== 'net::ERR_ABORTED')
                report.networkFailures.push({
                    label: windows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    error: details.error,
                })
        })
    }
    async function runEnvironment(window, origin, label) {
        const index = report.listening.length
        report.listening.push({ label, status: 'running' })
        console.log('Sentence listening ' + label + ' start')
        let fixtureId
        try {
            if (activeDocumentFixture) {
                // 仅此隔离测试文档模拟active条件；不改生产代码或暂停状态，不验证原生焦点。
                window.webContents.debugger.attach('1.3')
                await window.webContents.debugger.sendCommand('Page.enable')
                const fixture = await window.webContents.debugger.sendCommand(
                    'Page.addScriptToEvaluateOnNewDocument',
                    {
                        source: "Object.defineProperties(document, { visibilityState: { configurable: true, get: () => 'visible' }, hidden: { configurable: true, get: () => false }, hasFocus: { configurable: true, value: () => true } });",
                    },
                )
                fixtureId = fixture.identifier
            } else {
                window.show()
                window.focus()
                window.webContents.focus()
                await waitFor(
                    window,
                    () => document.hasFocus() && document.visibilityState === 'visible',
                    'native validation window has focus',
                )
            }
            report.listening[index] = await runSentenceListeningChecks(window, origin, label)
        } catch (error) {
            report.listening[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport:
                    'dist/practice-sentence-listening-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        } finally {
            if (fixtureId) {
                await window.webContents.debugger.sendCommand(
                    'Page.removeScriptToEvaluateOnNewDocument',
                    { identifier: fixtureId },
                )
                window.webContents.debugger.detach()
            }
            window.hide()
        }
        console.log('Sentence listening ' + label + ' complete')
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Standalone content smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (!profile || !isAbsolute(profile))
            throw new Error('Standalone content smoke requires absolute DESKTOP_SMOKE_USER_DATA')
        if (resolve(profile) === resolve(app.getPath('userData')))
            throw new Error('Content smoke requires an isolated userData profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Content smoke must load production englishlearning protocol')
        const preview = new URL(process.env.SMOKE_WEB_ORIGIN ?? '')
        if (
            !['http:', 'https:'].includes(preview.protocol) ||
            preview.pathname !== '/' ||
            preview.search ||
            preview.hash
        )
            throw new Error('SMOKE_WEB_ORIGIN must be an HTTP(S) origin')
        process.chdir(projectRoot)
        app.setAppPath(projectRoot)
        app.setPath('userData', profile)
        process.on('uncaughtException', finish)
        process.on('unhandledRejection', finish)
        deadline = setTimeout(
            () => finish(new Error('Standalone content smoke exceeded its 240 second deadline')),
            240000,
        )
        app.on('browser-window-created', (_event, window) => {
            if (windows.size === 0) observe(window, 'Electron')
        })
        await import(pathToFileURL(resolve(projectRoot, 'dist/electron/main.js')).href)
        await app.whenReady()
        let production
        for (let attempt = 0; attempt < 100; attempt++) {
            production = BrowserWindow.getAllWindows().find((window) =>
                window.webContents.getURL().startsWith('englishlearning://app'),
            )
            if (production) break
            await delay(75)
        }
        assert.ok(production, 'real production host creates its window')
        await waitFor(
            production,
            () => document.readyState === 'complete' && document.body.textContent.trim().length > 0,
            'production host ready',
        )
        await settle(production)
        production.webContents.setBackgroundThrottling(false)
        const preferences = production.webContents.getLastWebPreferences()
        assert.equal(preferences.sandbox, true)
        assert.equal(preferences.contextIsolation, true)
        assert.equal(preferences.nodeIntegration, false)
        assert.equal(
            await evaluate(production, () => window.learningDesktop.getAppVersion()),
            app.getVersion(),
            'real preload and IPC respond',
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
        await waitFor(
            browser,
            () =>
                document.readyState === 'complete' && document.body.textContent.includes('练习页'),
            'Web practice ready',
        )
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
if (isStandaloneEntry) void runStandaloneListeningSmoke()
