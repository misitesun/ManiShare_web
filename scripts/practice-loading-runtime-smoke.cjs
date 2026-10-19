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

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(35)
    }
    throw new Error('Timed out: practice loading ' + description)
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete),
        'document assets complete',
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
            const control = document.querySelector(target)
            if (!control || control.closest('[inert]') || control.matches(':disabled'))
                throw new Error('Missing enabled loading smoke action: ' + target)
            control.focus()
            control.click()
        },
        selector,
    )
}

async function clickText(window, label, scope = 'body') {
    await evaluate(
        window,
        (text, root) => {
            const button = Array.from(
                document.querySelector(root)?.querySelectorAll('button') ?? [],
            ).find((item) => item.textContent.trim() === text)
            if (!button || button.closest('[inert]')) throw new Error('Missing action: ' + text)
            button.focus()
            button.click()
        },
        label,
        scope,
    )
}

async function arm(window) {
    await evaluate(window, () => {
        window.practiceLoadingObserver?.disconnect()
        window.practiceLoadingProbe = []
        let current
        const update = () => {
            const screen = document.querySelector('[data-practice-loading]')
            if (screen && !current) {
                current = { start: performance.now(), samples: [] }
                window.practiceLoadingProbe.push(current)
            }
            if (screen && current) {
                const value = Number(screen.querySelector('[role="progressbar"]').ariaValueNow)
                if (current.samples.at(-1)?.value !== value)
                    current.samples.push({ elapsed: performance.now() - current.start, value })
            } else if (current) {
                current.duration = performance.now() - current.start
                current.sessionMounted = Boolean(document.querySelector('main[data-toolbar-ready]'))
                current = undefined
            }
        }
        window.practiceLoadingObserver = new MutationObserver(update)
        window.practiceLoadingObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-valuenow'],
        })
    })
}

async function query(window, params) {
    await arm(window)
    await evaluate(window, (value) => history.pushState(null, '', '/practice/?' + value), params)
}

async function snapshot(window) {
    return evaluate(window, () => {
        const screen = document.querySelector('[data-practice-loading]')
        if (!screen) return { mounted: false }
        const track = screen.querySelector('[role="progressbar"]')
        const inner = track.firstElementChild.firstElementChild
        const fill = inner.firstElementChild
        const caption = screen.querySelector('[role="status"]')
        const percentage = track.nextElementSibling
        const rect = (element) => {
            const value = element.getBoundingClientRect()
            return { x: value.x, y: value.y, width: value.width, height: value.height }
        }
        const type = (element) => {
            const value = getComputedStyle(element)
            return {
                size: value.fontSize,
                lineHeight: value.lineHeight,
                weight: value.fontWeight,
                color: value.color,
            }
        }
        return {
            mounted: true,
            viewport: { width: innerWidth, height: innerHeight },
            screen: rect(screen),
            mascot: rect(screen.querySelector('img')),
            assetLoaded: screen.querySelector('img').naturalWidth > 0,
            track: rect(track),
            inner: rect(inner),
            fill: rect(fill),
            value: Number(track.ariaValueNow),
            min: track.ariaValueMin,
            max: track.ariaValueMax,
            percentage: percentage.textContent,
            percentageRect: rect(percentage),
            percentageType: type(percentage),
            caption: caption.textContent,
            captionRect: rect(caption),
            captionType: type(caption),
            background: getComputedStyle(screen).backgroundColor,
            gradient: getComputedStyle(track).backgroundImage,
            shadow: getComputedStyle(inner).boxShadow,
            busy: screen.ariaBusy,
            focused: document.activeElement === screen,
            practiceMounted: Boolean(document.querySelector('main[data-toolbar-ready]')),
            answerMounted: Boolean(document.querySelector('[data-practice-answer-input]')),
            footerMounted: Boolean(document.querySelector('[data-practice-footer]')),
            mediaPlaying: Array.from(document.querySelectorAll('audio,video')).some(
                (media) => !media.paused,
            ),
            horizontalOverflow:
                screen.scrollWidth > screen.clientWidth ||
                document.documentElement.scrollWidth > innerWidth,
            scrollHeight: screen.scrollHeight,
        }
    })
}

async function waitLoading(window) {
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-loading]')),
        'screen mounts',
    )
    const value = await snapshot(window)
    assert.equal(value.practiceMounted, false)
    assert.equal(value.answerMounted, false)
    assert.equal(value.footerMounted, false)
    assert.equal(value.mediaPlaying, false)
    assert.equal(value.busy, 'true')
    assert.equal(value.min, '0')
    assert.equal(value.max, '100')
    assert.equal(value.percentage, value.value + '%')
    assert.ok(Math.abs((value.fill.width / value.inner.width) * 100 - value.value) < 0.15)
    assert.equal(value.horizontalOverflow, false)
    return value
}

async function waitReady(window) {
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-practice-loading]') &&
            Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'two seconds complete',
    )
}

async function timing(window) {
    const probes = await evaluate(window, () => window.practiceLoadingProbe)
    assert.equal(probes.length, 1, 'entry creates exactly one loading interval')
    const value = probes[0]
    assert.ok(
        value.duration >= 1900 && value.duration <= 2350,
        'loading runs two real seconds: ' + value.duration,
    )
    assert.equal(value.sessionMounted, true)
    assert.ok(value.samples[0].value <= 2, 'entry starts at zero')
    assert.ok(value.samples.at(-1).value >= 97, 'progress reaches the completion boundary')
    for (let index = 1; index < value.samples.length; index++) {
        assert.ok(value.samples[index].value >= value.samples[index - 1].value)
        assert.ok(
            Math.abs(value.samples[index].value - value.samples[index].elapsed / 20) < 5,
            'progress is linear',
        )
    }
    return value
}

async function capture(window, name) {
    const path = 'dist/practice-loading-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function selectMode(window, mode) {
    await click(window, '[data-practice-navigation-action="mode"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-mode-selector]')),
        'mode dialog opens',
    )
    await click(window, '[data-practice-mode-option="' + mode + '"]')
}

async function draft(window) {
    return evaluate(window, () => {
        const panel = document.querySelector('[data-practice-draft-panel]')
        const rect = panel?.getBoundingClientRect()
        return {
            text: panel?.querySelector('textarea')?.value,
            x: rect?.x,
            y: rect?.y,
            open: Boolean(panel && !panel.inert && panel.getAttribute('aria-hidden') !== 'true'),
        }
    })
}

async function runPracticeLoadingChecks(window, origin, label) {
    const result = {
        label,
        status: 'running',
        businessRequests: [],
        permissionRequests: [],
        geometry: [],
        limitations: [
            '平板/H5视觉、触摸、系统输入法和真机待用户验收；当前为2秒本地演示，不验证真实题库API。',
        ],
    }
    const session = window.webContents.session
    const application = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const pages = new Set(manifest.routes)
    const files = new Set(manifest.files.map((path) => '/' + path))
    session.webRequest.onBeforeSendHeaders((details, callback) => {
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
            result.businessRequests.push({
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
    let ownsDebugger = false
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.setBackgroundThrottling(false)
        if (!window.webContents.debugger.isAttached()) {
            window.webContents.debugger.attach('1.3')
            ownsDebugger = true
        }
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        await window.loadURL(origin + '/practice/?keep=loading-smoke')
        await settle(window)
        await waitFor(
            window,
            () => document.querySelector('section h2')?.textContent === '单词游戏',
            'catalog mounts after the foundation and route Suspense',
        )
        await arm(window)
        await clickText(window, '指法练习', 'section')
        result.catalog = await waitLoading(window)
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' })
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' })
        await delay(850)
        result.intermediate = await waitLoading(window)
        assert.ok(result.intermediate.value >= 35 && result.intermediate.value <= 65)
        await waitReady(window)
        result.realTiming = await timing(window)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-practice-answer-input]').value,
            ),
            '',
            'loading keys do not become answers',
        )

        await click(window, '[data-word-slot="0"]')
        window.webContents.insertText('z')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-answer-input]')?.value === 'z',
            'answer edits',
        )
        await arm(window)
        await selectMode(window, 'spell')
        await click(window, '[data-practice-mode-cancel-label]')
        await delay(300)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-practice-answer-input]')?.value,
            ),
            'z',
        )
        assert.equal(
            (await evaluate(window, () => window.practiceLoadingProbe)).length,
            0,
            'cancel does not load',
        )
        await selectMode(window, 'typing')
        await click(window, '[data-practice-mode-start]')
        await delay(350)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-practice-answer-input]')?.value,
            ),
            'z',
        )
        assert.equal(
            (await evaluate(window, () => window.practiceLoadingProbe)).length,
            0,
            'same-mode start does not load',
        )
        result.cancelAndSameMode = true

        await click(window, '[data-practice-toolbar="word"] button[aria-label="本模式设置"]')
        const imageSwitch = '[data-practice-options="word"] [role="switch"][aria-label="图片"]'
        await waitFor(
            window,
            (target) => Boolean(document.querySelector(target)),
            'local options open',
            imageSwitch,
        )
        await click(window, imageSwitch)
        const imagePreference = await evaluate(
            window,
            (target) => document.querySelector(target).ariaChecked,
            imageSwitch,
        )
        await click(window, '[data-practice-navigation-action="draft"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-draft-panel] textarea')),
            'draft opens',
        )
        await click(window, '[data-practice-draft-panel] textarea')
        window.webContents.insertText('加载前章节草稿')
        await click(window, '[data-practice-draft-handle]')
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Left' })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Left' })
        await delay(400)
        const before = await draft(window)
        await selectMode(window, 'spell')
        await arm(window)
        await click(window, '[data-practice-mode-start]')
        await waitLoading(window)
        await waitReady(window)
        result.differentModeTiming = await timing(window)
        await delay(400)
        const after = await draft(window)
        assert.deepEqual(
            after,
            before,
            'mode loading preserves draft text, position and open intent',
        )
        await selectMode(window, 'typing')
        await arm(window)
        await click(window, '[data-practice-mode-start]')
        await waitLoading(window)
        await waitReady(window)
        await click(window, '[data-practice-toolbar="word"] button[aria-label="本模式设置"]')
        assert.equal(
            await evaluate(
                window,
                (target) => document.querySelector(target).ariaChecked,
                imageSwitch,
            ),
            imagePreference,
        )
        result.preserved = {
            draft: after,
            imagePreference,
            query: await evaluate(window, () => location.search),
        }
        assert.match(result.preserved.query, /keep=loading-smoke/)
        await click(window, '[data-practice-draft-panel] button[aria-label="关闭草稿纸"]')
        await arm(window)
        await click(window, '[data-practice-footer-action="question.next"]')
        await delay(150)
        assert.equal(
            (await evaluate(window, () => window.practiceLoadingProbe)).length,
            0,
            'ordinary next question does not load',
        )

        await window.loadURL(origin + '/awakening/courses/phonetics/')
        await settle(window)
        await waitFor(
            window,
            () => {
                const button = Array.from(document.querySelectorAll('button')).find((item) =>
                    ['收藏', '已收藏'].includes(item.textContent.trim()),
                )
                if (button?.ariaPressed === 'true') return true
                button?.click()
                return false
            },
            'course event hydration',
        )
        await clickText(window, '已收藏')
        await click(window, '[data-chapter-number="2"] button[data-practice-chapter-entry]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-mode-option="spell"]')),
            'course selection',
        )
        await click(window, '[data-practice-mode-option="spell"]')
        await arm(window)
        await click(window, '[data-practice-mode-start]')
        await waitLoading(window)
        await waitReady(window)
        result.courseTiming = await timing(window)
        result.courseQuery = await evaluate(window, () => location.search)
        assert.match(result.courseQuery, /sourceCourse=phonetics/)
        assert.match(result.courseQuery, /sourceChapter=chapter-2/)

        for (const theme of ['dark', 'light']) {
            await evaluate(
                window,
                (value) => {
                    document.documentElement.dataset.theme = value
                    document.documentElement.style.colorScheme = value
                },
                theme,
            )
            await query(window, 'demo=sentence-basic&mode=typing&keep=geometry-' + theme)
            const value = await waitLoading(window)
            assert.deepEqual(value.mascot, { x: 810, y: 329, width: 300, height: 300 })
            assert.deepEqual(value.track, { x: 540, y: 875, width: 840, height: 36 })
            assert.deepEqual(value.inner, { x: 544, y: 879, width: 832, height: 28 })
            assert.equal(value.percentageRect.x, 1390)
            assert.equal(value.percentageType.size, '18px')
            assert.equal(value.percentageType.lineHeight, '25px')
            assert.equal(value.captionRect.y, 832)
            assert.equal(value.captionType.size, '18px')
            assert.equal(value.captionType.lineHeight, '23px')
            assert.equal(value.captionType.weight, '400')
            await waitFor(
                window,
                () => document.querySelector('[data-practice-loading] img')?.naturalWidth > 0,
                'original mascot loads',
            )
            result.geometry.push({
                theme,
                value,
                screenshot: await capture(window, label.toLowerCase() + '-' + theme + '-pc'),
            })
            await waitReady(window)
            // 新键使已就绪的同demo/mode重新加载；无关query本身不应触发。
            await query(window, 'demo=word-basic&mode=typing')
            await waitLoading(window)
            await waitReady(window)
        }
        assert.notEqual(result.geometry[0].value.background, result.geometry[1].value.background)
        result.reflow = []
        for (const [width, height, zoom] of [
            [1440, 900, 1],
            [1280, 800, 1],
            [1920, 1080, 1.25],
            [1920, 1080, 1.5],
            [1920, 1080, 2],
            [1440, 600, 1],
        ]) {
            window.setContentSize(width, height)
            window.webContents.setZoomFactor(zoom)
            const mode = await evaluate(window, () =>
                new URLSearchParams(location.search).get('mode') === 'typing' ? 'spell' : 'typing',
            )
            await query(window, 'demo=word-basic&mode=' + mode)
            const value = await waitLoading(window)
            assert.ok(
                value.track.width > 0 &&
                    value.percentageRect.x + value.percentageRect.width <= value.viewport.width,
            )
            assert.equal(window.webContents.getZoomFactor(), zoom)
            result.reflow.push({ width, height, zoom, value })
            await waitReady(window)
        }

        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await query(window, 'demo=sentence-basic&mode=typing')
        await waitLoading(window)
        await delay(750)
        result.reduced = await waitLoading(window)
        assert.equal(result.reduced.value, 0, 'reduced motion keeps a static progress display')
        await waitReady(window)
        const reducedProbe = await evaluate(window, () => window.practiceLoadingProbe[0])
        assert.ok(reducedProbe.duration >= 1900 && reducedProbe.duration <= 2350)
        result.reduced.duration = reducedProbe.duration
        await query(window, 'demo=word-basic&mode=typing')
        await waitLoading(window)
        await delay(650)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        })
        await delay(100)
        const resumed = await waitLoading(window)
        assert.ok(
            resumed.value >= 30,
            'preference change resumes elapsed progress without restarting',
        )
        await waitReady(window)

        await query(window, 'demo=sentence-basic&mode=typing')
        await waitLoading(window)
        await query(window, '')
        await delay(2100)
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-loading],main[data-toolbar-ready]')),
            ),
            false,
            'old callback cannot mount a session after leaving',
        )
        await query(window, 'demo=sentence-basic&mode=typing')
        await waitLoading(window)
        await waitReady(window)
        result.cleanupAndReentry = await timing(window)
        await window.loadURL(origin + '/practice/?demo=word-basic&mode=typing&keep=direct-entry')
        result.directEntry = await waitLoading(window)
        await waitReady(window)
        await query(window, 'demo=word-basic&mode=typing&keep=unrelated-query')
        await delay(150)
        assert.equal(
            (await evaluate(window, () => window.practiceLoadingProbe)).length,
            0,
            'unrelated query preserves a ready session',
        )
        result.directEntryAndUnrelatedQuery = true
        assert.deepEqual(result.businessRequests, [], 'zero business/completion/preload requests')
        assert.deepEqual(result.permissionRequests, [], 'zero permission requests')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = describeError(error)
        result.failureScreenshot = await capture(window, label.toLowerCase() + '-failure')
        throw error
    } finally {
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [],
        })
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: false,
        })
        if (ownsDebugger) window.webContents.debugger.detach()
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        writeFileSync(
            resolve('dist/practice-loading-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticeLoadingChecks }

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
async function runStandalonePracticeLoadingSmoke() {
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
            resolve(projectRoot, 'dist/practice-loading-runtime-validation.json'),
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
        if (error === undefined) console.log('Practice loading passed: Electron and Web')
        else console.error('Practice loading failed:', error)
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
        console.log('Practice loading ' + label + ' start')
        try {
            report.environments[index] = await runPracticeLoadingChecks(window, origin, label)
            console.log('Practice loading ' + label + ' complete')
        } catch (error) {
            report.environments[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport: 'dist/practice-loading-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Practice loading smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (
            !profile ||
            !isAbsolute(profile) ||
            resolve(profile) === resolve(app.getPath('userData'))
        )
            throw new Error('Practice loading smoke requires an isolated absolute userData profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Practice loading smoke must use the production protocol')
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
            () => finish(new Error('Practice loading smoke exceeded 240 seconds')),
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
if (isStandaloneEntry) void runStandalonePracticeLoadingSmoke()
