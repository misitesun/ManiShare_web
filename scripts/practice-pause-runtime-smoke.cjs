const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')
const emulatedWindows = new WeakSet()
const focusRecoveries = new WeakMap()

const modes = [
    ['word-basic', ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral']],
    ['sentence-basic', ['listen', 'read', 'translate', 'check', 'typing', 'oral', 'blocks']],
    ['audio-basic', ['listen', 'read', 'translate', 'check', 'typing', 'oral', 'blocks']],
    ['video-basic', ['listen', 'translate', 'check', 'typing', 'oral', 'blocks']],
    ['picture-basic', ['listen', 'translate', 'typing', 'oral']],
    ['typing-basic', ['typing']],
    ['phonetics-basic', ['pronounce', 'oral']],
    ['guess-basic', ['guess', 'read', 'spell']],
    ['audio-reader', ['read']],
    ['video-reader', ['read']],
    ['picture-reader', ['read']],
    ['text-reader', ['read']],
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 160; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error('Timed out: pause ' + description)
}

async function focus(window) {
    if (!emulatedWindows.has(window)) {
        require('electron').app.focus({ steal: true })
        window.show()
        window.focus()
        window.webContents.focus()
    }
    await waitFor(window, () => document.hasFocus(), 'native window focus')
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (!button || button.closest('[inert]') || button.disabled)
                throw new Error('Unavailable pause action: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
}

async function key(window, keyCode, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await delay(50)
}

async function resume(window, action = 'continue') {
    for (let attempt = 0; attempt < 3; attempt++) {
        await focus(window)
        if ((await snapshot(window)).paused === 'false') return
        await imagesReady(window)
        await click(window, '[data-pause-action="' + action + '"]')
        for (let frame = 0; frame < 40; frame++) {
            if ((await snapshot(window)).paused === 'false') return
            await delay(50)
        }
        // 其他桌面工作切走了原生测试窗时，产品应再次暂停；重新聚焦并再次显式点击。
        // 前台仿真或原生窗口仍有焦点时未能恢复，直接视为功能失败。
        if (emulatedWindows.has(window) || window.isFocused()) break
        focusRecoveries.set(window, (focusRecoveries.get(window) ?? 0) + 1)
    }
    throw new Error('Timed out: pause manual resume')
}

async function paused(window) {
    await waitFor(
        window,
        () => {
            const pause = document.querySelector('[data-practice-pause]')
            return (
                pause &&
                !pause.closest('[inert]') &&
                document.querySelector('[data-practice-paused="true"]')
            )
        },
        'pause dialog',
    )
    await delay(280)
}

async function snapshot(window) {
    return evaluate(window, () => ({
        seconds: Number(
            document.querySelector('[data-practice-timer]')?.dataset.practiceElapsedSeconds,
        ),
        index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
        phase: document.querySelector('[data-practice-phase]')?.dataset.practicePhase,
        paused: document.querySelector('[data-practice-index]')?.dataset.practicePaused,
        dialogs: document.querySelectorAll('[data-practice-pause]').length,
        focused: document.hasFocus(),
        visibilityState: document.visibilityState,
        tasks: window.__practicePauseSmoke?.tasks.size,
        blur: window.__practicePauseSmoke?.blur.size,
        visibility: window.__practicePauseSmoke?.visibility.size,
    }))
}

async function tick(window, after) {
    await waitFor(
        window,
        (value) =>
            Number(
                document.querySelector('[data-practice-timer]')?.dataset.practiceElapsedSeconds,
            ) > value,
        'elapsed time advances',
        after,
    )
}

async function visit(window, origin, demo = 'word-basic', mode = 'pronounce') {
    await focus(window)
    await imagesReady(window)
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => document.querySelector('main[data-toolbar-ready="true"] [data-practice-timer]'),
        'hydration',
    )
    if ((await snapshot(window)).paused === 'true') await resume(window)
    await imagesReady(window)
}

async function imagesReady(window) {
    await waitFor(
        window,
        () =>
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'all current images loaded before leaving',
    )
}

async function blur(window) {
    await evaluate(window, () => window.dispatchEvent(new Event('blur')))
    await paused(window)
}

async function geometry(window) {
    return evaluate(window, () => {
        const section = document.querySelector('[data-practice-pause]')
        const panel = section.closest('[role="dialog"]').parentElement
        function measure(element) {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                color: style.color,
                borderRadius: style.borderRadius,
            }
        }
        return {
            viewport: {
                width: innerWidth,
                height: innerHeight,
                clientWidth: document.documentElement.clientWidth,
            },
            panel: measure(panel),
            title: measure(section.querySelector('[data-pause-title]')),
            message: measure(section.querySelector('[data-pause-message]')),
            mascot: measure(section.querySelector('[data-pause-mascot]')),
            continue: measure(section.querySelector('[data-pause-action="continue"]')),
            close: measure(section.querySelector('[data-pause-action="close"] img')),
            overlay: {
                background: getComputedStyle(panel.closest('[data-tld-dialog-layer]'))
                    .backgroundColor,
                blur: getComputedStyle(panel.closest('[data-tld-dialog-layer]')).backdropFilter,
            },
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }
    })
}

function near(actual, expected, label) {
    assert.ok(Math.abs(actual - expected) <= 0.6, label + ': ' + actual + ' vs ' + expected)
}

async function installSpy(window) {
    await evaluate(window, () => {
        const interval = window.setInterval.bind(window)
        const clear = window.clearInterval.bind(window)
        const addWindow = window.addEventListener.bind(window)
        const removeWindow = window.removeEventListener.bind(window)
        const addDocument = document.addEventListener.bind(document)
        const removeDocument = document.removeEventListener.bind(document)
        const spy = { tasks: new Map(), blur: new Set(), visibility: new Set(), retired: [] }
        window.__practicePauseSmoke = spy
        window.setInterval = (callback, milliseconds, ...args) => {
            const id = interval(callback, milliseconds, ...args)
            if (milliseconds === 250 || milliseconds === 1000) spy.tasks.set(id, callback)
            return id
        }
        window.clearInterval = (id) => {
            spy.tasks.delete(id)
            clear(id)
        }
        window.addEventListener = (type, listener, options) => {
            if (type === 'blur') spy.blur.add(listener)
            addWindow(type, listener, options)
        }
        window.removeEventListener = (type, listener, options) => {
            if (type === 'blur' && spy.blur.delete(listener)) spy.retired.push(listener)
            removeWindow(type, listener, options)
        }
        document.addEventListener = (type, listener, options) => {
            if (type === 'visibilitychange') spy.visibility.add(listener)
            addDocument(type, listener, options)
        }
        document.removeEventListener = (type, listener, options) => {
            if (type === 'visibilitychange' && spy.visibility.delete(listener))
                spy.retired.push(listener)
            removeDocument(type, listener, options)
        }
        spy.restore = () => {
            window.setInterval = interval
            window.clearInterval = clear
            window.addEventListener = addWindow
            window.removeEventListener = removeWindow
            document.addEventListener = addDocument
            document.removeEventListener = removeDocument
        }
    })
}

/** 当前开发期开关关闭时，检查真实窗口生命周期，不用前台仿真掩盖失焦。 */
async function runPauseDisabledChecks(window, origin, label, lifecycleOnly = false) {
    const result = { label, status: 'running', modes: [], lifecycle: [], screenshots: [] }
    let competitor
    const previousThrottling = window.webContents.getBackgroundThrottling()
    const { BrowserWindow } = require('electron')
    function assertDisabled(state, context) {
        assert.equal(state.paused, 'false', context + ': session stays active')
        assert.equal(state.dialogs, 0, context + ': no pause dialog')
    }
    try {
        for (const [demo, entries] of lifecycleOnly ? modes.slice(0, 1) : modes) {
            for (const mode of lifecycleOnly ? entries.slice(0, 1) : entries) {
                await visit(window, origin, demo, mode)
                assert.equal(
                    await evaluate(window, () =>
                        Boolean(document.querySelector('[data-practice-pause-enabled="false"]')),
                    ),
                    true,
                )
                assert.equal(
                    await evaluate(window, () =>
                        Boolean(
                            document.querySelector('[data-practice-navigation-action="pause"]'),
                        ),
                    ),
                    false,
                    'disabled pause has no desktop or menu entry',
                )
                await evaluate(window, () =>
                    document.querySelector('[data-practice-index]').focus(),
                )
                await key(window, 'Escape')
                await evaluate(window, () => {
                    window.dispatchEvent(new Event('blur'))
                    document.dispatchEvent(new Event('visibilitychange'))
                })
                const state = await snapshot(window)
                assertDisabled(state, demo + ':' + mode)
                result.modes.push({ demo, mode, state })
                console.log(label + ' pause disabled: ' + demo + ':' + mode)
            }
        }
        if (!lifecycleOnly) assert.equal(result.modes.length, 40)

        // HTTP冒烟宿主默认关闭节流，此时hide不会产生hidden；原生生命周期检查恢复真实可见性。
        window.webContents.setBackgroundThrottling(true)
        await visit(window, origin, 'sentence-basic', 'translate')
        const beforeBlur = await snapshot(window)
        competitor = new BrowserWindow({
            width: 300,
            height: 200,
            show: true,
            webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
        })
        await competitor.loadURL('about:blank')
        competitor.focus()
        await waitFor(window, () => !document.hasFocus(), 'native blur is observed')
        await tick(window, beforeBlur.seconds)
        const afterBlur = await snapshot(window)
        assertDisabled(afterBlur, 'native window blur')
        assert.equal(afterBlur.focused, false)
        assert.equal(afterBlur.index, beforeBlur.index)
        result.lifecycle.push({ kind: 'native-blur-keeps-timer-running', beforeBlur, afterBlur })
        competitor.destroy()
        competitor = undefined
        await focus(window)

        const beforeHide = await snapshot(window)
        window.hide()
        await waitFor(window, () => document.visibilityState === 'hidden', 'native hidden state')
        assertDisabled(await snapshot(window), 'hidden page')
        await delay(1250)
        await focus(window)
        await tick(window, beforeHide.seconds)
        const afterShow = await snapshot(window)
        assertDisabled(afterShow, 'return from hidden page')
        result.lifecycle.push({ kind: 'native-hide-and-return', beforeHide, afterShow })

        window.hide()
        await window.loadURL(origin + '/practice/?demo=sentence-basic&mode=translate')
        await waitFor(
            window,
            () => document.readyState === 'complete',
            'background entry document loads',
        )
        // 原加载画面由动画帧完成，隐藏窗口可能延后挂载会话；保留这一现有行为。
        const backgroundMount = await snapshot(window)
        assert.equal(backgroundMount.visibilityState, 'hidden')
        assert.equal(backgroundMount.dialogs, 0)
        assert.notEqual(backgroundMount.paused, 'true')
        await delay(1250)
        await focus(window)
        await waitFor(
            window,
            () => document.querySelector('main[data-toolbar-ready="true"] [data-practice-timer]'),
            'original entry loading finishes after returning',
        )
        const returned = await snapshot(window)
        assertDisabled(returned, 'background entry returns without continue')
        await tick(window, returned.seconds)
        result.lifecycle.push({ kind: 'background-entry-and-return', backgroundMount, returned })

        await click(window, '[data-practice-navigation-action="settings"]')
        await waitFor(window, () => document.querySelector('[role="dialog"]'), 'settings opens')
        await delay(300)
        const settingsStart = await snapshot(window)
        await delay(1250)
        const settingsEnd = await snapshot(window)
        assertDisabled(settingsEnd, 'settings still owns its normal blocking state')
        assert.equal(settingsEnd.seconds, settingsStart.seconds, 'settings still freezes the timer')
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'settings closes')
        await tick(window, settingsEnd.seconds)
        result.lifecycle.push({
            kind: 'settings-still-blocks-and-resumes',
            settingsStart,
            settingsEnd,
        })

        window.setContentSize(1440, 900)
        await imagesReady(window)
        const screenshot = 'dist/practice-pause-disabled-' + label.toLowerCase() + '-pc.png'
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(resolve(screenshot), (await window.webContents.capturePage()).toPNG())
        result.screenshots.push(screenshot)
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = String(error)
        throw error
    } finally {
        if (competitor && !competitor.isDestroyed()) competitor.destroy()
        if (!window.isDestroyed()) {
            window.webContents.setBackgroundThrottling(previousThrottling)
            window.show()
        }
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(
            resolve('dist/practice-pause-disabled-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

async function runChecks(window, origin, label) {
    const lifecycleOnly = process.env.PAUSE_SMOKE_LIFECYCLE_ONLY === '1'
    const result = {
        label,
        lifecycleOnly,
        status: 'running',
        modes: [],
        interactions: [],
        screenshots: [],
        geometry: [],
        permissionRequests: [],
    }
    const { BrowserWindow } = require('electron')
    const debuggerAttached = window.webContents.debugger.isAttached()
    if (!debuggerAttached) window.webContents.debugger.attach('1.3')
    async function emulateForeground(enabled) {
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled,
        })
        if (enabled) {
            emulatedWindows.add(window)
            window.webContents.setBackgroundThrottling(false)
        } else emulatedWindows.delete(window)
    }
    let competitor
    const testSession = window.webContents.session
    testSession.setPermissionRequestHandler((_contents, permission, callback) => {
        result.permissionRequests.push(permission)
        callback(false)
    })
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await visit(window, origin)
        if (
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-pause-enabled="false"]')),
            )
        ) {
            result.disabled = await runPauseDisabledChecks(window, origin, label, lifecycleOnly)
            assert.deepEqual(result.permissionRequests, [])
            result.status = 'passed'
            return result
        }
        // 批量模式仅注入blur验证统一入口；前台仿真避免操作者切回工作窗口打断批量交互。
        // 原生窗口／可见性验证前显式关闭仿真，不改写DOM hasFocus或visibilityState。
        await emulateForeground(true)
        result.batchFocusEmulation = true
        // 全模式通过同一个真实失焦事件入口；不写入生产React状态或修改hasFocus。
        for (const [demo, entries] of lifecycleOnly ? [] : modes) {
            for (const mode of entries) {
                result.currentMode = { demo, mode }
                await visit(window, origin, demo, mode)
                const before = await snapshot(window)
                await blur(window)
                const frozen = await snapshot(window)
                await key(window, 'Right', ['shift'])
                const after = await snapshot(window)
                assert.equal(after.paused, 'true')
                assert.equal(after.index, before.index)
                assert.equal(after.phase, before.phase)
                assert.equal(after.seconds, frozen.seconds)
                assert.equal(after.dialogs, 1)
                await resume(window)
                result.modes.push({ demo, mode, frozen: frozen.seconds })
            }
            console.log(label + ' pause modes checked: ' + result.modes.length)
        }
        if (!lifecycleOnly) assert.equal(result.modes.length, 40)
        await visit(window, origin)
        await tick(window, 0)
        await click(window, '[data-practice-navigation-action="pause"]')
        await paused(window)
        const beforePause = await snapshot(window)
        // 遮罩不解除，原生Tab焦点仍在暂停窗内。
        window.webContents.sendInputEvent({
            type: 'mouseDown',
            button: 'left',
            x: 20,
            y: 200,
            clickCount: 1,
        })
        window.webContents.sendInputEvent({
            type: 'mouseUp',
            button: 'left',
            x: 20,
            y: 200,
            clickCount: 1,
        })
        await key(window, 'Tab')
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.activeElement.closest('[data-practice-pause]')),
            ),
            true,
        )
        await delay(1200)
        assert.equal((await snapshot(window)).seconds, beforePause.seconds)
        result.interactions.push('manual pause / backdrop / focus trap / frozen timer')
        const baseline = await geometry(window)
        near(baseline.panel.width, 470, 'panel width')
        near(baseline.panel.height, 195, 'panel height')
        near(baseline.panel.x, 725, 'panel x')
        near(baseline.panel.y, 442, 'panel y')
        for (const [name, x, y, width, height] of [
            ['title', 16, 16, null, 28],
            ['mascot', 34, 70, 106, 86],
            ['message', 161, 102, null, 22],
            ['continue', 378, 140, 76, 32],
            ['close', 434, 16, 20, 20],
        ]) {
            near(baseline[name].x - baseline.panel.x, x, name + ' x')
            near(baseline[name].y - baseline.panel.y, y, name + ' y')
            if (height !== null) near(baseline[name].height, height, name + ' height')
            if (width !== null) near(baseline[name].width, width, name + ' width')
        }
        assert.equal(baseline.title.fontSize, '20px')
        assert.equal(baseline.title.fontWeight, '500')
        assert.equal(baseline.message.fontSize, '16px')
        assert.equal(baseline.message.lineHeight, '22px')
        assert.equal(baseline.continue.fontSize, '14px')
        assert.equal(baseline.continue.lineHeight, '20px')
        assert.equal(baseline.overlay.blur, 'blur(2px)')
        result.geometry.push({ theme: 'dark', zoom: 1, ...baseline })
        for (const theme of ['dark', 'light']) {
            await evaluate(
                window,
                (value) => (document.documentElement.dataset.theme = value),
                theme,
            )
            await delay(300)
            await waitFor(
                window,
                () =>
                    [...document.querySelectorAll('[data-practice-pause] img')].every(
                        (img) => img.complete && img.naturalWidth > 0,
                    ),
                'pause assets',
            )
            const file = resolve(
                'dist/practice-pause-' + label.toLowerCase() + '-' + theme + '-pc.png',
            )
            writeFileSync(file, (await window.webContents.capturePage()).toPNG())
            result.screenshots.push(file)
        }
        await evaluate(window, () => (document.documentElement.dataset.theme = 'dark'))
        for (const [width, height] of [
            [1280, 720],
            [1440, 900],
            [2560, 1440],
        ]) {
            window.setContentSize(width, height)
            await delay(100)
            const current = await geometry(window)
            assert.equal(current.overflow, false)
            near(current.panel.width, 470, 'reflow panel width')
            result.geometry.push({ zoom: 1, ...current })
        }
        window.setContentSize(1920, 1080)
        for (const zoom of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(zoom)
            await delay(100)
            const current = await geometry(window)
            assert.equal(current.overflow, false)
            assert.ok(current.panel.x >= 0 && current.panel.y >= 0)
            result.geometry.push({ zoom, ...current })
        }
        window.webContents.setZoomFactor(1)
        await resume(window, 'close')
        await tick(window, beforePause.seconds)
        result.interactions.push(
            'X explicitly resumes after exit motion; PC reference / themes / true zoom',
        )

        // 原生窗口焦点转移；回到原窗仍保持冻结。
        await emulateForeground(false)
        await focus(window)
        if ((await snapshot(window)).paused === 'true') await resume(window)
        competitor = new BrowserWindow({
            show: false,
            width: 400,
            height: 300,
            webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
        })
        await competitor.loadURL('about:blank')
        competitor.show()
        competitor.focus()
        competitor.webContents.focus()
        await waitFor(window, () => !document.hasFocus(), 'actual native blur')
        await paused(window)
        const away = await snapshot(window)
        await focus(window)
        await delay(1200)
        assert.equal((await snapshot(window)).seconds, away.seconds)
        assert.equal((await snapshot(window)).paused, 'true')
        competitor.destroy()
        competitor = undefined
        await resume(window)
        result.interactions.push('native window switch: blur / return / manual resume')

        // 真实Page Visibility状态变化，不替换document.visibilityState。
        window.webContents.setBackgroundThrottling(true)
        window.hide()
        await waitFor(
            window,
            () => document.visibilityState === 'hidden',
            'native hidden visibility',
        )
        await paused(window)
        const hidden = await snapshot(window)
        await focus(window)
        await waitFor(window, () => document.visibilityState === 'visible', 'native visible again')
        await delay(1100)
        assert.equal((await snapshot(window)).seconds, hidden.seconds)
        assert.equal((await snapshot(window)).paused, 'true')
        await resume(window)
        window.webContents.setBackgroundThrottling(false)
        result.interactions.push('native hidden / visible: no automatic resume')
        await emulateForeground(true)
        if ((await snapshot(window)).paused === 'true') await resume(window)

        await click(window, '[data-practice-navigation-action="pause"]')
        await paused(window)
        await click(window, '[data-pause-action="continue"]')
        await evaluate(window, () => window.dispatchEvent(new Event('blur')))
        await paused(window)
        assert.equal((await snapshot(window)).paused, 'true')
        await key(window, 'Escape')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-paused="false"]'),
            'Esc explicitly resumes',
        )
        result.interactions.push(
            'blur interrupts continue exit; Esc resumes without falling through',
        )

        await click(window, '[data-practice-navigation-action="report"]')
        await waitFor(
            window,
            () => document.querySelector('[role="dialog"] textarea'),
            'feedback editor',
        )
        await evaluate(window, () => {
            const field = document.querySelector('[role="dialog"] textarea')
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(
                field,
                '暂停后保留这段反馈',
            )
            field.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await blur(window)
        await resume(window)
        assert.equal(
            await evaluate(window, () => document.querySelector('[role="dialog"] textarea').value),
            '暂停后保留这段反馈',
        )
        const modal = await snapshot(window)
        await delay(1100)
        assert.equal((await snapshot(window)).seconds, modal.seconds)
        result.interactions.push(
            'original feedback draft retained; remaining modal continues to block timer',
        )

        await visit(window, origin, 'audio-reader', 'read')
        await evaluate(window, () => {
            const media = document.querySelector('audio')
            media.muted = true
            media.loop = true
            Array.from(media.closest('section').querySelectorAll('button'))
                .find((button) => button.textContent.trim() === '播放')
                .click()
        })
        await waitFor(
            window,
            () =>
                !document.querySelector('audio').paused &&
                document.querySelector('audio').currentTime > 0.2,
            'actual audio playback',
        )
        await blur(window)
        const position = await evaluate(window, () => document.querySelector('audio').currentTime)
        await delay(1100)
        assert.ok(
            Math.abs(
                (await evaluate(window, () => document.querySelector('audio').currentTime)) -
                    position,
            ) < 0.05,
            'paused media position is retained',
        )
        assert.ok(position > 0)
        await resume(window)
        assert.equal(await evaluate(window, () => document.querySelector('audio').paused), true)
        result.interactions.push(
            'media pauses at current position and does not autoplay after continue',
        )

        await visit(window, origin, 'word-basic', 'oral')
        await evaluate(window, () =>
            [...document.querySelectorAll('button')]
                .find((button) => button.textContent.trim() === '开始录音演示')
                .click(),
        )
        await waitFor(
            window,
            () => document.body.textContent.includes('演示计时 00:01'),
            'oral demo elapsed',
        )
        await blur(window)
        const oral = await evaluate(
            window,
            () => document.body.textContent.match(/演示计时 \d+:\d+/)?.[0],
        )
        await delay(1200)
        assert.equal(
            await evaluate(window, () => document.body.textContent.match(/演示计时 \d+:\d+/)?.[0]),
            oral,
        )
        assert.equal(
            await evaluate(
                window,
                () =>
                    document.querySelector('[data-practice-oral-stage]').dataset.practiceOralStage,
            ),
            'recording',
        )
        await resume(window)
        await waitFor(
            window,
            (prior) => document.body.textContent.match(/演示计时 \d+:\d+/)?.[0] !== prior,
            'oral resumes same stage',
            oral,
        )
        result.interactions.push('oral stage / elapsed freezes and continues')

        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await visit(window, origin)
        await click(window, '[data-practice-navigation-action="pause"]')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-pause]'),
            'reduced motion opens',
        )
        await resume(window)
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-pause]'),
            'reduced motion immediate exit',
        )
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [],
        })
        result.interactions.push('reduced motion: open / manual continue / focus restored')

        // 从目录安装spy，再由真实SPA导航挂载/卸载，验证所有拥有者的清理。
        await emulateForeground(false)
        await imagesReady(window)
        await window.loadURL(origin + '/practice/')
        await waitFor(window, () => document.body.textContent.includes('第一版演示'), 'catalog')
        await focus(window)
        await delay(100)
        await installSpy(window)
        competitor = new BrowserWindow({
            show: false,
            width: 400,
            height: 300,
            webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
        })
        await competitor.loadURL('about:blank')
        competitor.show()
        competitor.focus()
        competitor.webContents.focus()
        await waitFor(window, () => !document.hasFocus(), 'background entry window blur')
        await evaluate(window, () =>
            history.pushState(null, '', '/practice/?demo=word-basic&mode=pronounce'),
        )
        await waitFor(
            window,
            () => document.querySelector('main[data-toolbar-ready="true"] [data-practice-timer]'),
            'SPA enter',
        )
        await paused(window)
        assert.equal((await snapshot(window)).tasks, 0, 'background mount must not start timer')
        await focus(window)
        assert.equal(
            (await snapshot(window)).paused,
            'true',
            'return after loading still requires continue',
        )
        competitor.destroy()
        competitor = undefined
        await resume(window)
        // 原生后台挂载及手动继续已验收；随后的计时／卸载检查固定前台上下文，
        // 避免其他桌面工作重新切走窗口而正确触发自动暂停。
        await emulateForeground(true)
        if ((await snapshot(window)).paused === 'true') await resume(window)
        await tick(window, 0)
        result.interactions.push('background session mount stays paused until explicit continue')
        const active = await snapshot(window)
        assert.equal(active.tasks, 1)
        assert.equal(active.visibility, 1)
        assert.ok(active.blur >= 2)
        await blur(window)
        assert.equal((await snapshot(window)).tasks, 0)
        await resume(window)
        assert.equal((await snapshot(window)).tasks, 1)
        await evaluate(window, () => history.pushState(null, '', '/practice/'))
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-index]'),
            'running session unmount',
        )
        await evaluate(window, () => {
            for (const listener of window.__practicePauseSmoke.retired) {
                if (typeof listener === 'function') listener(new Event('blur'))
            }
            window.dispatchEvent(new Event('blur'))
            document.dispatchEvent(new Event('visibilitychange'))
        })
        const cleaned = await snapshot(window)
        assert.equal(cleaned.tasks, 0)
        assert.equal(cleaned.blur, 0)
        assert.equal(cleaned.visibility, 0)
        assert.equal(cleaned.dialogs, 0)
        result.interactions.push({
            kind: 'SPA exit: timers / listeners / late callbacks',
            active,
            cleaned,
        })
        await evaluate(window, () => {
            window.__practicePauseSmoke.restore()
            delete window.__practicePauseSmoke
        })
        assert.deepEqual(result.permissionRequests, [])
        result.externalFocusRecoveries = focusRecoveries.get(window) ?? 0
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.stack : String(error)
        if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
            result.failureSnapshot = await snapshot(window)
            result.nativeFocus = {
                window: window.isFocused(),
                contents: window.webContents.isFocused(),
            }
            const failure = resolve('dist/practice-pause-' + label.toLowerCase() + '-failure.png')
            writeFileSync(failure, (await window.webContents.capturePage()).toPNG())
        }
        throw error
    } finally {
        if (competitor && !competitor.isDestroyed()) competitor.destroy()
        if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
            await evaluate(window, () => {
                window.__practicePauseSmoke?.restore()
                delete window.__practicePauseSmoke
            })
            window.webContents.setBackgroundThrottling(false)
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
            await emulateForeground(false)
            if (!debuggerAttached) window.webContents.debugger.detach()
            window.webContents.setZoomFactor(1)
            window.setContentSize(1920, 1080)
        }
        emulatedWindows.delete(window)
        testSession.setPermissionRequestHandler(null)
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(
            resolve('dist/practice-pause-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

const isStandalonePauseEntry =
    require.main === module ||
    (process.type === 'browser' &&
        process.argv.slice(1).some((argument) => resolve(argument) === __filename))
if (isStandalonePauseEntry)
    void runStandalonePanelMotionSmoke({
        reportName: 'practice-pause-runtime-validation',
        runChecks,
        activateWindow: false,
        timeoutMs: 480000,
    })

module.exports = { runPauseDisabledChecks }
