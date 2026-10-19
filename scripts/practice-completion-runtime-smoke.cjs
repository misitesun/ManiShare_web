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
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(40)
    }
    throw new Error('Timed out: completion ' + description)
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const control = document.querySelector(target)
            if (!control || control.disabled || control.closest('[inert]'))
                throw new Error('Unavailable completion control: ' + target)
            control.focus()
            control.click()
        },
        selector,
    )
}

async function key(window, keyCode, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function focusContent(window) {
    await evaluate(window, () => {
        const element = document.querySelector('[data-practice-index]')
        element.tabIndex = -1
        element.focus()
    })
}

async function load(window, origin, demo = 'sentence-basic', mode = 'listen') {
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice hydration',
    )
}

async function finishSession(window) {
    await focusContent(window)
    await key(window, 'Right', ['shift'])
    await waitFor(
        window,
        () => document.querySelector('[data-practice-index="1"]'),
        'last local question',
    )
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-practice-completion]'))),
        false,
        'last question does not complete until next is requested',
    )
    await key(window, 'Right', ['shift'])
    await waitFor(
        window,
        () => document.querySelector('[data-practice-completion]'),
        'completion mounts',
    )
    await settle(window)
}

async function settle(window) {
    await waitFor(
        window,
        () => {
            const panel = document.querySelector('[data-practice-completion]')
            const layer = panel?.closest('[data-tld-dialog-layer]')
            const frame = layer?.querySelector('[data-tld-dialog-motion]')
            if (!frame || frame.inert) return false
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
            Array.from(document.querySelectorAll('[data-practice-completion] img'), (image) =>
                image.decode(),
            ),
        )
    })
}

async function state(window) {
    return evaluate(window, () => {
        const panel = document.querySelector('[data-practice-completion]')
        if (!panel) return { mounted: false }
        const layer = panel.closest('[data-tld-dialog-layer]')
        const frame = layer.querySelector('[data-tld-dialog-motion]')
        const matrix = new DOMMatrixReadOnly(getComputedStyle(frame).transform)
        const dialog = panel.closest('[role="dialog"]')
        function geometry(element) {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                font: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                color: style.color,
                cursor: style.cursor,
                borderRadius: style.borderRadius,
            }
        }
        return {
            mounted: true,
            open: layer.dataset.dialogOpen,
            inert: frame.inert,
            ariaHidden: layer.getAttribute('aria-hidden'),
            opacity: Number(getComputedStyle(layer).opacity),
            scale: matrix.m11,
            y: matrix.m42,
            text: panel.textContent,
            frame: geometry(dialog.parentElement),
            title: geometry(panel.querySelector('[data-completion-title]')),
            praise: geometry(panel.querySelector('[data-completion-praise]')),
            encouragement: geometry(panel.querySelector('[data-completion-encouragement]')),
            statistics: Array.from(panel.querySelectorAll('[data-completion-stat]'), geometry),
            labels: Array.from(panel.querySelectorAll('dt'), geometry),
            values: Array.from(panel.querySelectorAll('dd'), geometry),
            actions: Array.from(panel.querySelectorAll('[data-completion-action]'), (element) => ({
                name: element.dataset.completionAction,
                disabled: element.disabled,
                ...geometry(element),
            })),
            assets: Array.from(panel.querySelectorAll('img'), (element) => ({
                source: element.currentSrc,
                loaded: element.complete && element.naturalWidth > 0,
                naturalWidth: element.naturalWidth,
                naturalHeight: element.naturalHeight,
                ...geometry(element),
            })),
            count: Number(panel.querySelector('[data-completion-count]').textContent),
            duration: panel.querySelector('[data-completion-stat="duration"] dd').childNodes[0]
                .textContent,
            background: getComputedStyle(dialog).backgroundImage,
            horizontalOverflow:
                panel.scrollWidth > panel.clientWidth || dialog.scrollWidth > dialog.clientWidth,
        }
    })
}

function near(actual, expected, message, epsilon = 1) {
    assert.ok(Math.abs(actual - expected) <= epsilon, message + ': ' + actual + ' != ' + expected)
}

async function capture(window, label, suffix) {
    // 计算样式到达终值后仍需让合成帧提交，避免截到透明的过渡帧。
    await delay(100)
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    const path = 'dist/practice-completion-' + label.toLowerCase() + '-' + suffix + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function close(window, action, expected) {
    const before = await state(window)
    if (action === 'esc') await key(window, 'Escape')
    else if (action === 'space') await key(window, 'Space')
    else await click(window, action)
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    const exiting = await state(window)
    assert.equal(exiting.mounted, true, 'completion stays mounted during exit')
    assert.equal(exiting.inert, true)
    assert.equal(exiting.open, 'false')
    assert.equal(exiting.ariaHidden, 'true')
    assert.ok(exiting.opacity > 0 && exiting.opacity < 1)
    assert.equal(exiting.text, before.text, 'exit freezes presentation')
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-practice-index="1"]'))),
        true,
        'departure and replay wait for animation',
    )
    await waitFor(
        window,
        (destination) =>
            destination === 'replay'
                ? Boolean(document.querySelector('[data-practice-index="0"]'))
                : document.querySelector('h1')?.textContent === '练习页 · 第一版演示',
        'destination after exit',
        expected,
    )
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-completion]'),
        'completion unmount',
    )
    return { action, expected, exiting }
}

async function runChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const report = { label, status: 'running', modes: [], actions: [], responsive: [] }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.debugger.attach('1.3')
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        })
        await load(window, origin)
        await finishSession(window)
        report.reference = await state(window)
        report.darkScreenshot = await capture(window, label, 'dark-1920')
        writeFileSync(
            resolve('dist/practice-completion-' + label.toLowerCase() + '-reference.json'),
            JSON.stringify(report.reference, null, 4),
        )
        const reference = report.reference
        near(reference.frame.width, 580, 'reference width', 0.1)
        near(reference.frame.height, 368, 'reference height', 0.1)
        near(reference.frame.x, 670, 'reference left', 0.1)
        near(reference.frame.y, 356, 'reference top', 0.1)
        assert.equal(reference.title.fontSize, '20px')
        assert.equal(reference.title.fontWeight, '500')
        assert.equal(reference.praise.fontSize, '18px')
        assert.equal(reference.praise.fontWeight, '500')
        reference.labels.forEach((item) => assert.equal(item.fontSize, '16px'))
        reference.values.forEach((item) => assert.equal(item.fontSize, '18px'))
        near(reference.title.x - reference.frame.x, 16, 'title x')
        near(reference.title.y - reference.frame.y, 16, 'title y')
        near(reference.encouragement.y - reference.frame.y, 79, 'encouragement y')
        reference.statistics.forEach((item, index) => {
            near(item.width, 207, 'stat width')
            near(item.x - reference.frame.x, 77 + index * 220, 'stat x')
            near(item.y - reference.frame.y, 154, 'stat y')
        })
        reference.actions.slice(0, 2).forEach((item, index) => {
            near(item.width, 207, 'action width')
            near(item.height, 44, 'action height')
            near(item.x - reference.frame.x, 77 + index * 220, 'action x')
            near(item.y - reference.frame.y, 252, 'action y')
            assert.equal(item.fontSize, '16px')
        })
        assert.equal(reference.actions[1].disabled, true)
        assert.notEqual(reference.actions[1].cursor, 'pointer')
        assert.equal(reference.assets.length, 7)
        assert.ok(reference.assets.every((item) => item.loaded))
        for (const [index, width, height] of [
            [0, 20, 20],
            [1, 50, 50],
            [2, 42, 42],
            [3, 35, 36],
            [4, 20, 20],
            [5, 20, 20],
            [6, 20, 20],
        ]) {
            near(reference.assets[index].width, width, 'asset width ' + index, 0.1)
            near(reference.assets[index].height, height, 'asset height ' + index, 0.1)
        }
        assert.equal(reference.duration, '—')
        assert.equal(reference.count, 2)
        await key(window, 'Return')
        assert.equal((await state(window)).open, 'true', 'unavailable next chapter cannot navigate')
        assert.equal(
            await evaluate(
                window,
                () =>
                    document.querySelector('[data-practice-completion] [role="status"]')
                        .textContent,
            ),
            '当前为本地演示，下一章未接入。可再练一次或返回。',
        )
        // 长按、IME和其他题目快捷键不能透传。
        await evaluate(window, () => {
            const frame = document.querySelector('[role="dialog"]')
            frame.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    repeat: true,
                    bubbles: true,
                }),
            )
            frame.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    isComposing: true,
                    bubbles: true,
                }),
            )
        })
        assert.equal((await state(window)).open, 'true')
        report.actions.push(await close(window, 'space', 'replay'))
        await finishSession(window)
        report.actions.push(await close(window, '[data-completion-action="replay"]', 'replay'))
        await finishSession(window)
        report.actions.push(await close(window, '[data-completion-action="return"]', 'catalog'))
        await load(window, origin)
        await finishSession(window)
        report.actions.push(await close(window, 'esc', 'catalog'))
        await load(window, origin)
        await finishSession(window)
        report.actions.push(await close(window, 'button[aria-label="关闭完成练习"]', 'catalog'))
        // 从真实演示目录逐个进入全部40模式，避免维护另一份演示ID/题库。
        await waitFor(
            window,
            () => document.querySelectorAll('main section').length === 12,
            'catalog hydration',
        )
        const catalog = await evaluate(window, () =>
            Array.from(document.querySelectorAll('main section'), (section, sectionIndex) => ({
                sectionIndex,
                title: section.querySelector('h2').textContent,
                buttons: Array.from(section.querySelectorAll('button'), (button, buttonIndex) => ({
                    buttonIndex,
                    label: button.textContent,
                })),
            })),
        )
        for (const family of catalog)
            for (const mode of family.buttons) {
                await evaluate(
                    window,
                    (sectionIndex, buttonIndex) =>
                        document
                            .querySelectorAll('main section')
                            [sectionIndex].querySelectorAll('button')
                            [buttonIndex].click(),
                    family.sectionIndex,
                    mode.buttonIndex,
                )
                await waitFor(
                    window,
                    () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
                    'mode hydration',
                )
                await finishSession(window)
                const modal = await state(window)
                assert.equal(modal.count, 2)
                assert.equal(modal.duration, '—')
                assert.equal(modal.actions[1].disabled, true)
                report.modes.push({ family: family.title, mode: mode.label, count: modal.count })
                await click(window, '[data-completion-action="return"]')
                await waitFor(
                    window,
                    () => document.querySelectorAll('main section').length === 12,
                    'mode returns to catalog',
                )
            }
        assert.equal(report.modes.length, 40)
        await load(window, origin)
        await click(window, '[data-practice-navigation-action="settings"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[role="tab"]')),
            'settings opens',
        )
        await evaluate(window, () =>
            Array.from(document.querySelectorAll('[role="tab"]'))
                .find((item) => {
                    const content = item.cloneNode(true)
                    content
                        .querySelectorAll('[aria-hidden="true"]')
                        .forEach((node) => node.remove())
                    return content.textContent.trim() === '外观'
                })
                .click(),
        )
        await waitFor(
            window,
            () => Boolean(document.querySelector('input[type="radio"][value="light"]')),
            'theme control',
        )
        await click(window, 'input[type="radio"][value="light"]')
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'settings closes')
        await finishSession(window)
        report.light = await state(window)
        report.lightScreenshot = await capture(window, label, 'light-1920')
        for (const [width, height, zoom] of [
            [1440, 900, 1],
            [1280, 800, 1],
            [1920, 1080, 1.25],
            [1920, 1080, 1.5],
            [1920, 1080, 2],
        ]) {
            window.setContentSize(width, height)
            window.webContents.setZoomFactor(zoom)
            await settle(window)
            const measured = await state(window)
            assert.equal(measured.horizontalOverflow, false)
            const viewport = await evaluate(window, () => ({
                width: innerWidth,
                height: innerHeight,
            }))
            assert.ok(measured.frame.x >= 0 && measured.frame.y >= 0)
            assert.ok(measured.frame.x + measured.frame.width <= viewport.width)
            assert.ok(measured.frame.y + measured.frame.height <= viewport.height)
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
        await key(window, 'Space')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-index="0"]')),
            'reduced replays synchronously',
        )
        await finishSession(window)
        await key(window, 'Escape')
        await waitFor(
            window,
            () => document.querySelectorAll('main section').length === 12,
            'reduced closes',
        )
        report.reducedMotion = true
        report.status = 'passed'
        return report
    } finally {
        if (window.webContents.debugger.isAttached()) window.webContents.debugger.detach()
        window.webContents.setZoomFactor(priorZoom)
        window.setContentSize(...priorSize)
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'practice-completion-runtime-validation',
    runChecks,
    timeoutMs: 480000,
})
