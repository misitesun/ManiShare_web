const assert = require('node:assert/strict')
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 160; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(40)
    }
    throw new Error('Timed out: exit ' + description)
}

async function frames(window) {
    await evaluate(window, async () => {
        await Promise.race([
            new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
            new Promise((_done, reject) =>
                setTimeout(() => reject(new Error('Exit animation frames stalled')), 5000),
            ),
        ])
    })
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const node = document.querySelector(target)
            if (!node || node.disabled || node.closest('[inert]'))
                throw new Error('Unavailable exit action ' + target)
            node.focus()
            node.click()
        },
        selector,
    )
}

async function key(window, keyCode, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await frames(window)
}

async function load(window, origin, demo = 'word-basic', mode = 'spell', source = 'phonetics') {
    await window.loadURL(
        origin +
            '/practice/?demo=' +
            demo +
            '&mode=' +
            mode +
            (source === null ? '' : '&sourceCourse=' + encodeURIComponent(source)),
    )
    await waitFor(
        window,
        () => document.querySelector('main[data-toolbar-ready="true"]'),
        'practice ready',
    )
    if (await evaluate(window, () => document.querySelector('[data-practice-paused="true"]'))) {
        await click(window, '[data-pause-action="continue"]')
    }
    await waitFor(
        window,
        () => document.querySelector('[data-practice-paused="false"]'),
        'foreground practice',
    )
}

async function state(window) {
    return evaluate(window, () => {
        function geometry(node) {
            if (!node) return null
            const rect = node.getBoundingClientRect()
            const style = getComputedStyle(node)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                color: style.color,
                background: style.backgroundColor,
                border: style.borderColor,
                cursor: style.cursor,
                borderRadius: style.borderRadius,
            }
        }
        const root = document.querySelector('[data-practice-index]')
        const panel = document.querySelector('[data-practice-exit]')
        const layer = panel?.closest('[data-tld-dialog-layer]')
        const frame = layer?.querySelector('[data-tld-dialog-motion]')
        const matrix = frame ? new DOMMatrixReadOnly(getComputedStyle(frame).transform) : null
        const dialog = panel?.closest('[role="dialog"]')
        return {
            pathname: location.pathname,
            index: root?.dataset.practiceIndex,
            phase: root?.dataset.practicePhase,
            paused: root?.dataset.practicePaused,
            input: document.querySelector('[data-practice-answer-input]')?.value,
            focusedLabel: document.activeElement?.getAttribute('aria-label'),
            seconds: Number(
                document.querySelector('[data-practice-timer]')?.dataset.practiceElapsedSeconds,
            ),
            mounted: Boolean(panel),
            open: layer?.dataset.dialogOpen,
            inert: frame?.inert,
            ariaHidden: layer?.getAttribute('aria-hidden'),
            opacity: layer ? Number(getComputedStyle(layer).opacity) : null,
            scale: matrix?.m11,
            y: matrix?.m42,
            text: panel?.textContent,
            frame: geometry(dialog?.parentElement),
            title: geometry(panel?.querySelector('[data-exit-title]')),
            actions: panel
                ? Array.from(panel.querySelectorAll('[data-exit-action]'), (node) => ({
                      name: node.dataset.exitAction,
                      ...geometry(node),
                  }))
                : [],
            labels: panel ? Array.from(panel.querySelectorAll('[data-exit-label]'), geometry) : [],
            arrows: panel ? Array.from(panel.querySelectorAll('[data-exit-arrow]'), geometry) : [],
            assets: panel
                ? Array.from(panel.querySelectorAll('img'), (node) => ({
                      source: node.currentSrc,
                      loaded: node.complete && node.naturalWidth > 0,
                      ...geometry(node),
                  }))
                : [],
            horizontalOverflow: panel
                ? panel.scrollWidth > panel.clientWidth || dialog.scrollWidth > dialog.clientWidth
                : false,
        }
    })
}

async function settled(window) {
    await waitFor(
        window,
        () => {
            const layer = document
                .querySelector('[data-practice-exit]')
                ?.closest('[data-tld-dialog-layer]')
            const frame = layer?.querySelector('[data-tld-dialog-motion]')
            if (!layer || !frame || frame.inert || layer.dataset.dialogOpen !== 'true') return false
            const matrix = new DOMMatrixReadOnly(getComputedStyle(frame).transform)
            return (
                Number(getComputedStyle(layer).opacity) > 0.999 &&
                Math.abs(matrix.m11 - 1) < 0.001 &&
                Math.abs(matrix.m42) < 0.01
            )
        },
        'modal settles',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(
            Array.from(document.querySelectorAll('[data-practice-exit] img'), (node) =>
                node.decode(),
            ),
        )
    })
}

async function open(window) {
    await click(window, 'button[aria-label="退出练习"]')
    await settled(window)
    return state(window)
}

async function capture(window, label, suffix) {
    await delay(100)
    await frames(window)
    const path = 'dist/practice-exit-' + label.toLowerCase() + '-' + suffix + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

function near(actual, expected, message, tolerance = 0.1) {
    assert.ok(Math.abs(actual - expected) <= tolerance, message + ': ' + actual + ' != ' + expected)
}

async function close(window, method) {
    const before = await state(window)
    if (method === 'escape') await key(window, 'Escape')
    else if (method === 'backdrop') {
        window.webContents.sendInputEvent({
            type: 'mouseDown',
            x: 4,
            y: 4,
            button: 'left',
            clickCount: 1,
        })
        window.webContents.sendInputEvent({
            type: 'mouseUp',
            x: 4,
            y: 4,
            button: 'left',
            clickCount: 1,
        })
    } else await click(window, '[data-exit-action="' + method + '"]')
    await frames(window)
    const exit = await state(window)
    assert.equal(exit.mounted, true)
    assert.equal(exit.inert, true)
    assert.equal(exit.open, 'false')
    assert.equal(exit.ariaHidden, 'true')
    assert.ok(exit.opacity > 0 && exit.opacity < 1)
    assert.ok(exit.scale < 1 && exit.y > 0)
    assert.equal(exit.text, before.text)
    assert.equal(exit.pathname, '/practice/', 'navigation waits for exit motion')
    return exit
}

async function closed(window) {
    await waitFor(window, () => !document.querySelector('[data-practice-exit]'), 'modal unmounts')
}

async function runChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const report = {
        label,
        status: 'running',
        cancellations: [],
        navigation: [],
        families: [],
        responsive: [],
    }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.debugger.attach('1.3')
        // 批量交互固定CDP前台状态，原生失焦兼容检查前关闭，禁止改写DOM焦点属性。
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        window.webContents.setBackgroundThrottling(false)
        report.batchFocusEmulation = true
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        })
        await load(window, origin)
        console.log('Exit ' + label + ': reference')
        await evaluate(window, () => {
            const input = document.querySelector('[data-practice-answer-input]')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                'exit-demo-answer',
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await waitFor(
            window,
            () =>
                Number(
                    document.querySelector('[data-practice-timer]').dataset.practiceElapsedSeconds,
                ) >= 1,
            'timer starts',
        )
        report.reference = await open(window)
        report.darkScreenshot = await capture(window, label, 'dark-1920')
        writeFileSync(
            resolve('dist/practice-exit-' + label.toLowerCase() + '-reference.json'),
            JSON.stringify(report.reference, null, 4),
        )
        const reference = report.reference
        near(reference.frame.width, 580, 'frame width')
        near(reference.frame.height, 414, 'frame height')
        near(reference.frame.x, 670, 'frame x')
        near(reference.frame.y, 333, 'frame y')
        assert.equal(reference.title.fontSize, '24px')
        assert.equal(reference.title.fontWeight, '500')
        near(reference.title.x - reference.frame.x, 242, 'title x')
        near(reference.title.y - reference.frame.y, 20, 'title y')
        for (const [name, x] of [
            ['home', 24],
            ['course', 306],
        ]) {
            const action = reference.actions.find((item) => item.name === name)
            near(action.x - reference.frame.x, x, name + ' x')
            near(action.y - reference.frame.y, 89, name + ' y')
            near(action.width, 250, name + ' width')
            near(action.height, 220, name + ' height')
            assert.equal(action.cursor, 'pointer')
        }
        const continuation = reference.actions.find((item) => item.name === 'continue')
        near(continuation.x - reference.frame.x, 150, 'continue x')
        near(continuation.y - reference.frame.y, 337, 'continue y')
        near(continuation.width, 280, 'continue width')
        near(continuation.height, 44, 'continue height')
        assert.equal(continuation.fontSize, '18px')
        assert.equal(continuation.fontWeight, '500')
        reference.labels.forEach((item) => {
            assert.equal(item.fontSize, '20px')
            assert.equal(item.fontWeight, '500')
        })
        assert.equal(reference.assets.length, 6)
        for (const [index, x, y, width, height] of [
            [0, 532, 25, 24, 24],
            [1, 57, 89, 165, 165],
            [2, 231, 265, 20, 20],
            [3, 323, 113, 213, 128],
            [4, 513, 265, 20, 20],
        ]) {
            const asset = reference.assets[index]
            assert.equal(asset.loaded, true)
            near(asset.x - reference.frame.x, x, 'asset x ' + index)
            near(asset.y - reference.frame.y, y, 'asset y ' + index)
            near(asset.width, width, 'asset width ' + index)
            near(asset.height, height, 'asset height ' + index)
        }
        assert.equal(reference.assets[5].loaded, true)
        near(reference.assets[5].width, 24, 'continue icon width')
        near(reference.assets[5].height, 24, 'continue icon height')
        await delay(1200)
        assert.equal((await state(window)).seconds, reference.seconds, 'exit freezes timer')
        for (const code of ['Return', 'Space']) await key(window, code)
        assert.equal((await state(window)).open, 'true', 'flow keys do not submit beneath exit')
        report.cancellations.push({ method: 'continue', exit: await close(window, 'continue') })
        await closed(window)
        const continued = await state(window)
        assert.equal(continued.focusedLabel, '退出练习')
        assert.equal(continued.input, 'exit-demo-answer')
        assert.equal(continued.index, reference.index)
        assert.equal(continued.phase, reference.phase)
        await waitFor(
            window,
            (before) =>
                Number(
                    document.querySelector('[data-practice-timer]').dataset.practiceElapsedSeconds,
                ) > before,
            'cancel resumes timer',
            reference.seconds,
        )
        for (const method of ['close', 'escape', 'backdrop']) {
            await open(window)
            report.cancellations.push({ method, exit: await close(window, method) })
            await closed(window)
            assert.equal((await state(window)).input, 'exit-demo-answer')
            assert.equal((await state(window)).focusedLabel, '退出练习')
        }
        console.log('Exit ' + label + ': cancellation and focus')
        // 原生Tab只在当前弹窗四个入口内循环。
        await open(window)
        await evaluate(window, () =>
            document.querySelector('[data-practice-exit]').closest('[role="dialog"]').focus(),
        )
        const focusOrder = []
        for (let index = 0; index < 5; index++) {
            await key(window, 'Tab')
            focusOrder.push(await evaluate(window, () => document.activeElement.dataset.exitAction))
        }
        assert.deepEqual(focusOrder, ['close', 'home', 'course', 'continue', 'close'])
        report.focusOrder = focusOrder
        await click(window, '[data-exit-action="continue"]')
        await closed(window)
        // 开发阶段失焦不叠加暂停窗，原退出窗仍保持阻断并等待显式选择。
        await open(window)
        const { BrowserWindow, app } = require('electron')
        console.log('Exit ' + label + ': native blur with pause disabled')
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: false,
        })
        app.focus({ steal: true })
        window.focus()
        window.webContents.focus()
        await waitFor(window, () => document.hasFocus(), 'native host focus')
        if (await evaluate(window, () => document.querySelector('[data-practice-paused="true"]'))) {
            await click(window, '[data-pause-action="continue"]')
            await waitFor(
                window,
                () => document.querySelector('[data-practice-paused="false"]'),
                'resume before native blur',
            )
        }
        const other = new BrowserWindow({
            show: true,
            width: 300,
            height: 200,
            webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
        })
        try {
            other.focus()
            await waitFor(window, () => !document.hasFocus(), 'native blur')
            assert.equal(
                await evaluate(window, () =>
                    Boolean(document.querySelector('[data-practice-pause]')),
                ),
                false,
            )
            assert.equal(
                await evaluate(window, () =>
                    Boolean(document.querySelector('[data-practice-paused="false"]')),
                ),
                true,
            )
            app.focus({ steal: true })
            window.focus()
            window.webContents.focus()
            await waitFor(window, () => document.hasFocus(), 'return focuses')
            assert.equal((await state(window)).mounted, true)
            await settled(window)
            await click(window, '[data-exit-action="continue"]')
            await closed(window)
            report.pauseDisabledCompatibility = true
        } finally {
            other.destroy()
            await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
                enabled: true,
            })
        }
        for (const [destination, source, expected] of [
            ['home', 'phonetics', '/'],
            ['course', 'phonetics', '/awakening/courses/phonetics/'],
            ['course', null, '/awakening/'],
            ['course', 'https://example.com/', '/awakening/'],
        ]) {
            console.log('Exit ' + label + ': navigation ' + destination + ' ' + source)
            await load(window, origin, 'word-basic', 'spell', source)
            await open(window)
            const exiting = await close(window, destination)
            await waitFor(
                window,
                (path) =>
                    location.pathname === path && !document.querySelector('[data-practice-index]'),
                'target route',
                expected,
            )
            report.navigation.push({ destination, source, expected, exiting })
        }
        for (const [demo, mode] of [
            ['word-basic', 'pronounce'],
            ['sentence-basic', 'listen'],
            ['audio-basic', 'listen'],
            ['video-basic', 'listen'],
            ['picture-basic', 'translate'],
            ['typing-basic', 'typing'],
            ['phonetics-basic', 'pronounce'],
            ['guess-basic', 'guess'],
            ['audio-reader', 'read'],
            ['video-reader', 'read'],
            ['picture-reader', 'read'],
            ['text-reader', 'read'],
        ]) {
            console.log('Exit ' + label + ': family ' + demo)
            await load(window, origin, demo, mode)
            if (demo === 'video-reader' || demo === 'audio-reader')
                assert.equal(
                    await evaluate(window, () => Boolean(document.querySelector('audio, video'))),
                    false,
                    demo + ' has no media in the static stage',
                )
            const modal = await open(window)
            near(modal.frame.width, 580, 'common exit width')
            await click(window, '[data-exit-action="continue"]')
            await closed(window)
            report.families.push({ demo, mode })
        }
        // 纯音视频暂为静态展示；媒体位置保留使用已接入的单音轨视频听力。
        console.log('Exit ' + label + ': media and themes')
        await load(window, origin, 'video-basic', 'listen')
        await waitFor(window, () => document.querySelector('audio')?.readyState >= 2, 'audio ready')
        await evaluate(window, async () => {
            const audio = document.querySelector('audio')
            audio.currentTime = 0.6
            await audio.play()
        })
        await delay(70)
        await open(window)
        const media = await evaluate(window, () => ({
            paused: document.querySelector('audio').paused,
            position: document.querySelector('audio').currentTime,
        }))
        assert.equal(media.paused, true)
        assert.ok(media.position >= 0.6 && media.position < 1.5)
        await click(window, '[data-exit-action="continue"]')
        await closed(window)
        const retained = await evaluate(window, () => ({
            paused: document.querySelector('audio').paused,
            position: document.querySelector('audio').currentTime,
        }))
        assert.equal(retained.paused, true)
        near(retained.position, media.position, 'retained audio position')
        report.media = { media, retained }
        await click(window, '[data-practice-navigation-action="settings"]')
        await waitFor(window, () => document.querySelector('[role="tab"]'), 'settings')
        await evaluate(window, () =>
            Array.from(document.querySelectorAll('[role="tab"]'))
                .find((item) => {
                    const copy = item.cloneNode(true)
                    copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
                    return copy.textContent.trim() === '外观'
                })
                .click(),
        )
        await click(window, 'input[type="radio"][value="light"]')
        await waitFor(
            window,
            () => document.documentElement.dataset.theme === 'light',
            'light theme',
        )
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'settings closed')
        report.light = await open(window)
        report.lightScreenshot = await capture(window, label, 'light-1920')
        for (const [width, height, zoom] of [
            [1440, 900, 1],
            [1280, 800, 1],
            [1920, 1080, 1.25],
            [1920, 1080, 1.5],
            [1920, 1080, 2],
        ]) {
            console.log('Exit ' + label + ': responsive ' + width + ' ' + zoom)
            window.setContentSize(width, height)
            window.webContents.setZoomFactor(zoom)
            await settled(window)
            const measured = await state(window)
            const viewport = await evaluate(window, () => ({
                width: innerWidth,
                height: innerHeight,
            }))
            assert.equal(measured.horizontalOverflow, false)
            assert.ok(
                measured.frame.x >= 0 &&
                    measured.frame.y >= 0 &&
                    measured.frame.x + measured.frame.width <= viewport.width &&
                    measured.frame.y + measured.frame.height <= viewport.height,
            )
            report.responsive.push({
                width,
                height,
                zoom,
                viewport,
                frame: measured.frame,
                screenshot: await capture(window, label, width + '-zoom-' + zoom),
            })
        }
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await key(window, 'Escape')
        await closed(window)
        await open(window)
        await click(window, '[data-exit-action="course"]')
        await waitFor(
            window,
            () => location.pathname === '/awakening/courses/phonetics/',
            'reduced navigation',
        )
        report.reducedMotion = true
        report.status = 'passed'
        return report
    } finally {
        if (window.webContents.debugger.isAttached()) window.webContents.debugger.detach()
        window.webContents.setZoomFactor(priorZoom)
        window.setContentSize(...priorSize)
        writeFileSync(
            resolve('dist/practice-exit-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(report, null, 4),
        )
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'practice-exit-runtime-validation',
    runChecks,
    timeoutMs: 300000,
})
