const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { runPracticeDialogMotionChecks } = require('./practice-dialog-motion-runtime-checks.cjs')

const panels = [
    {
        name: 'answer',
        selector: '[data-practice-answer-panel="answer"]',
        navigation: '[data-practice-navigation-action="answer"]',
        close: '[data-practice-navigation-action="answer"]',
        axis: 'y',
        direction: -1,
    },
    {
        name: 'draft',
        selector: '[data-practice-draft-panel]',
        navigation: '[data-practice-navigation-action="draft"]',
        close: '[data-practice-draft-panel] button[aria-label="关闭草稿纸"]',
        axis: 'x',
        direction: 1,
    },
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error('Timed out: panel motion ' + description)
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (!button || button.matches(':disabled') || button.closest('[inert]'))
                throw new Error('Missing enabled panel action: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
}

async function snapshot(window, selector) {
    return evaluate(
        window,
        (target) => {
            const panel = document.querySelector(target)
            if (!panel) return { mounted: false, displayed: false }
            const rect = panel.getBoundingClientRect()
            const style = getComputedStyle(panel)
            const matrix = new DOMMatrixReadOnly(style.transform)
            return {
                mounted: true,
                displayed: !panel.hidden && style.display !== 'none' && rect.height > 0,
                inert: panel.inert,
                ariaHidden: panel.getAttribute('aria-hidden'),
                opacity: Number(style.opacity),
                x: matrix.m41,
                y: matrix.m42,
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                activeInside: panel.contains(document.activeElement),
            }
        },
        selector,
    )
}

async function waitOpen(window, panel) {
    await waitFor(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.hidden || element.inert) return false
            const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
            return Math.abs(matrix.m41) < 0.1 && Math.abs(matrix.m42) < 0.1
        },
        panel.name + ' finishes opening',
        panel.selector,
    )
}

async function waitClosed(window, panel) {
    await waitFor(
        window,
        (target) => {
            const element = document.querySelector(target)
            return !element || element.hidden || getComputedStyle(element).display === 'none'
        },
        panel.name + ' finishes closing',
        panel.selector,
    )
}

async function open(window, panel) {
    await click(window, panel.navigation)
    await waitOpen(window, panel)
    const state = await snapshot(window, panel.selector)
    assert.equal(state.displayed, true, panel.name + ' opens visibly')
    assert.equal(state.inert, false, panel.name + ' is interactive after opening')
    assert.notEqual(state.ariaHidden, 'true', panel.name + ' is exposed while open')
    return state
}

async function closeIntermediate(window, panel) {
    await click(window, panel.close)
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(done))
        await new Promise((done) => requestAnimationFrame(done))
    })
    const state = await snapshot(window, panel.selector)
    assert.equal(state.displayed, true, panel.name + ' stays rendered during exit')
    assert.equal(state.inert, true, panel.name + ' exit is not interactive')
    assert.equal(state.ariaHidden, 'true', panel.name + ' exit is hidden to assistive tools')
    assert.ok(
        state[panel.axis] * panel.direction > 0.1,
        panel.name + ' exits in its matching slide direction: ' + JSON.stringify(state),
    )
    if (panel.name === 'draft')
        assert.equal(
            await evaluate(
                window,
                (target) => document.querySelector(target).ariaExpanded,
                panel.navigation,
            ),
            'false',
            'draft navigation becomes collapsed before the animation ends',
        )
    return state
}

async function capture(window, name) {
    const path = 'dist/practice-panel-motion-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function rapidReverse(window, panel) {
    await open(window, panel)
    const cycles = []
    for (let index = 0; index < 3; index++) {
        const closing = await closeIntermediate(window, panel)
        // 同一页面帧前后比较，避免把IPC往返和截图时间误认为重新打开的跳跃。
        const reopened = await evaluate(
            window,
            async (navigation, selector) => {
                const before = document.querySelector(selector)
                const beforeMatrix = new DOMMatrixReadOnly(getComputedStyle(before).transform)
                document.querySelector(navigation).click()
                await new Promise((done) => requestAnimationFrame(done))
                const after = document.querySelector(selector)
                if (!after) return { mounted: false }
                const afterMatrix = new DOMMatrixReadOnly(getComputedStyle(after).transform)
                return {
                    mounted: true,
                    displayed: !after.hidden && getComputedStyle(after).display !== 'none',
                    inert: after.inert,
                    beforeX: beforeMatrix.m41,
                    beforeY: beforeMatrix.m42,
                    afterX: afterMatrix.m41,
                    afterY: afterMatrix.m42,
                }
            },
            panel.navigation,
            panel.selector,
        )
        assert.equal(reopened.mounted, true, panel.name + ' remains mounted on reversal')
        assert.equal(reopened.displayed, true, panel.name + ' remains visible on reversal')
        assert.equal(reopened.inert, false, panel.name + ' reversal restores interaction')
        const before = panel.axis === 'x' ? reopened.beforeX : reopened.beforeY
        const after = panel.axis === 'x' ? reopened.afterX : reopened.afterY
        assert.ok(
            Math.abs(after) <= Math.abs(before) + 5,
            panel.name +
                ' reverses from its current position without restarting offscreen: ' +
                JSON.stringify(reopened),
        )
        await waitOpen(window, panel)
        await delay(300)
        assert.equal(
            (await snapshot(window, panel.selector)).displayed,
            true,
            panel.name + ' stale completion cannot hide a reopened panel',
        )
        cycles.push({ closing, reopened })
    }
    await click(window, panel.close)
    await waitClosed(window, panel)
    return cycles
}

async function dragDraft(window) {
    const draft = panels[1]
    await open(window, draft)
    const before = await snapshot(window, draft.selector)
    const point = await evaluate(window, () => {
        const rect = document.querySelector('[data-practice-draft-handle]').getBoundingClientRect()
        return { x: Math.round(rect.x + 60), y: Math.round(rect.y + 20) }
    })
    window.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y })
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
    })
    window.webContents.sendInputEvent({
        type: 'mouseMove',
        x: point.x - 300,
        y: point.y + 30,
        button: 'left',
    })
    window.webContents.sendInputEvent({
        type: 'mouseUp',
        x: point.x - 300,
        y: point.y + 30,
        button: 'left',
        clickCount: 1,
    })
    await delay(75)
    const moved = await snapshot(window, draft.selector)
    assert.ok(Math.abs(moved.left - (before.left - 300)) < 1, 'draft actually moves before exit')
    const closing = await closeIntermediate(window, draft)
    assert.ok(closing.left > moved.left, 'dragged draft exits toward the viewport right')
    assert.ok(Math.abs(closing.top - moved.top) < 1, 'dragged draft does not snap vertically')
    await waitClosed(window, draft)
    const reopened = await open(window, draft)
    assert.ok(Math.abs(reopened.left - moved.left) < 1, 'reopened draft keeps its dragged location')
    await click(window, draft.close)
    await waitClosed(window, draft)
    return { before, moved, closing, reopened }
}

async function setReducedMotion(window, reduced) {
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }],
    })
    await waitFor(
        window,
        (expected) => matchMedia('(prefers-reduced-motion: reduce)').matches === expected,
        'motion preference is applied',
        reduced,
    )
}

async function runPracticePanelMotionChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const result = {
        label,
        status: 'running',
        normalMotion: [],
        rapidReversals: [],
        reducedMotion: [],
        limitations: ['1920×1080 PC真实运行时；平板/H5视觉、触摸和系统软键盘待用户验收'],
    }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.setBackgroundThrottling(false)
        window.webContents.debugger.attach('1.3')
        await setReducedMotion(window, false)
        await window.loadURL(origin + '/practice/?demo=sentence-basic&mode=listen')
        await waitFor(
            window,
            () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
            'practice hydration',
        )
        await evaluate(window, async () => {
            await document.fonts.ready
            await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        })
        for (const panel of panels) await open(window, panel)
        result.openScreenshot = await capture(window, label.toLowerCase() + '-open-pc')
        for (const panel of panels) {
            const before = await snapshot(window, panel.selector)
            const closing = await closeIntermediate(window, panel)
            const screenshot = await capture(
                window,
                label.toLowerCase() + '-' + panel.name + '-closing-pc',
            )
            await waitClosed(window, panel)
            const closed = await snapshot(window, panel.selector)
            result.normalMotion.push({ panel: panel.name, before, closing, closed, screenshot })
        }
        for (const panel of panels)
            result.rapidReversals.push({
                panel: panel.name,
                cycles: await rapidReverse(window, panel),
            })
        result.drag = await dragDraft(window)
        await setReducedMotion(window, true)
        for (const panel of panels) {
            await open(window, panel)
            const closed = await evaluate(
                window,
                async (close, selector) => {
                    document.querySelector(close).click()
                    await new Promise((done) => requestAnimationFrame(done))
                    const element = document.querySelector(selector)
                    return {
                        displayed: Boolean(
                            element &&
                            !element.hidden &&
                            getComputedStyle(element).display !== 'none',
                        ),
                        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
                    }
                },
                panel.close,
                panel.selector,
            )
            assert.equal(closed.reduced, true)
            assert.equal(
                closed.displayed,
                false,
                panel.name + ' closes immediately with reduced motion',
            )
            result.reducedMotion.push({ panel: panel.name, closed })
        }
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = describeError(error)
        try {
            result.failureScreenshot = await capture(window, label.toLowerCase() + '-failure-pc')
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        if (window.webContents.debugger.isAttached()) {
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
            window.webContents.debugger.detach()
        }
        window.webContents.setZoomFactor(priorZoom)
        window.setContentSize(...priorSize)
        writeFileSync(
            resolve('dist/practice-panel-motion-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticePanelMotionChecks }

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

/** 独立profile运行真实production协议和HTTP静态预览；不占用开发服务。 */
async function runStandalonePanelMotionSmoke({
    reportName = 'practice-panel-motion-runtime-validation',
    runChecks,
    activateWindow = true,
    timeoutMs = 240000,
} = {}) {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        environments: [],
        consoleErrors: [],
        networkFailures: [],
        businessRequests: [],
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
            resolve(projectRoot, 'dist/' + reportName + '.json'),
            JSON.stringify(report, null, 4),
        )
        for (const [contents, listener] of consoleListeners)
            if (!contents.isDestroyed()) contents.removeListener('console-message', listener)
        for (const session of observedSessions) {
            session.webRequest.onCompleted(null)
            session.webRequest.onErrorOccurred(null)
        }
        process.removeListener('uncaughtException', finish)
        process.removeListener('unhandledRejection', finish)
        if (error === undefined) console.log('Practice panel motion passed: Electron and Web')
        else console.error('Practice panel motion failed:', error)
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
        const session = window.webContents.session
        if (observedSessions.has(session)) return
        observedSessions.add(session)
        session.webRequest.onCompleted((details) => {
            const url = new URL(details.url)
            if (url.pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(details.method))
                report.businessRequests.push({ url: details.url, method: details.method })
            if (details.statusCode >= 400)
                report.networkFailures.push({
                    label: observedWindows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    status: details.statusCode,
                })
        })
        session.webRequest.onErrorOccurred((details) => {
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
        console.log('Practice panel motion ' + label + ' start')
        try {
            // 练习离开窗口会自动暂停；交互验收必须在真实前台窗口进行。
            if (activateWindow) {
                app.focus({ steal: true })
                window.show()
                window.focus()
                window.webContents.focus()
                await waitFor(window, () => document.hasFocus(), 'foreground validation host')
            }
            if (runChecks) report.environments[index] = await runChecks(window, origin, label)
            else {
                report.environments[index] = await runPracticePanelMotionChecks(
                    window,
                    origin,
                    label,
                )
                report.environments[index].dialogs = await runPracticeDialogMotionChecks(
                    window,
                    origin,
                    label,
                )
            }
            console.log('Practice panel motion ' + label + ' complete')
        } catch (error) {
            report.environments[index] = { label, status: 'failed', error: describeError(error) }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Standalone panel motion requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (
            !profile ||
            !isAbsolute(profile) ||
            resolve(profile) === resolve(app.getPath('userData'))
        )
            throw new Error('Standalone panel motion requires an isolated absolute smoke profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Standalone panel motion must load the production protocol')
        if (!process.env.SMOKE_WEB_ORIGIN)
            throw new Error('Standalone panel motion requires SMOKE_WEB_ORIGIN')
        const preview = new URL(process.env.SMOKE_WEB_ORIGIN)
        if (
            !['http:', 'https:'].includes(preview.protocol) ||
            preview.pathname !== '/' ||
            preview.search ||
            preview.hash
        )
            throw new Error('SMOKE_WEB_ORIGIN must be an HTTP(S) origin without path or query')
        process.chdir(projectRoot)
        app.setAppPath(projectRoot)
        app.setPath('userData', profile)
        process.on('uncaughtException', finish)
        process.on('unhandledRejection', finish)
        deadline = setTimeout(
            () => finish(new Error('Practice smoke exceeded its deadline')),
            timeoutMs,
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
        assert.ok(production, 'real application host opens the production window')
        await waitFor(production, () => document.readyState === 'complete', 'real host document')
        const preferences = production.webContents.getLastWebPreferences()
        assert.equal(preferences.sandbox, true)
        assert.equal(preferences.contextIsolation, true)
        assert.equal(preferences.nodeIntegration, false)
        assert.equal(
            await evaluate(production, () => window.learningDesktop.getAppVersion()),
            app.getVersion(),
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
            width: 1920,
            height: 1080,
            webPreferences: {
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                backgroundThrottling: false,
            },
        })
        observe(browser, 'Web')
        await browser.loadURL(preview.origin + '/practice/')
        await waitFor(browser, () => document.readyState === 'complete', 'Web initial document')
        await runEnvironment(browser, preview.origin, 'Web')
        assert.deepEqual(report.consoleErrors, [], 'zero hydration/CSP/runtime warnings or errors')
        assert.deepEqual(report.networkFailures, [], 'zero unexpected resource failures')
        assert.deepEqual(report.businessRequests, [], 'no business API or mutation requests')
        finish()
    } catch (error) {
        finish(error)
    }
}

const isStandalonePanelMotionEntry =
    require.main === module ||
    (process.type === 'browser' &&
        process.argv.slice(1).some((argument) => resolve(argument) === __filename))
if (isStandalonePanelMotionEntry) void runStandalonePanelMotionSmoke()

module.exports = { runStandalonePanelMotionSmoke, runPracticePanelMotionChecks }
