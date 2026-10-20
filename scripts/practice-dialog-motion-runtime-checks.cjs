const assert = require('node:assert/strict')
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')

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
    throw new Error('Timed out: practice dialog motion ' + description)
}

async function frames(window) {
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (!button || button.closest('[inert]') || button.matches(':disabled'))
                throw new Error('Missing usable dialog trigger: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
}

async function clickText(window, text, scope = 'body') {
    await evaluate(
        window,
        (label, root) => {
            const button = Array.from(
                document.querySelector(root).querySelectorAll('button,a'),
            ).find((item) => {
                const content = item.cloneNode(true)
                content.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
                return content.textContent.trim() === label
            })
            if (!button || button.closest('[inert]'))
                throw new Error('Missing dialog action: ' + label)
            button.focus()
            button.click()
        },
        text,
        scope,
    )
}

async function markTop(window, tag) {
    await evaluate(
        window,
        (name) => {
            const layer = Array.from(
                document.querySelectorAll('[data-tld-dialog-layer][data-dialog-open="true"]'),
            ).at(-1)
            if (!layer) throw new Error('No open modal to mark: ' + name)
            layer.dataset.motionCheck = name
        },
        tag,
    )
    return '[data-motion-check="' + tag + '"]'
}

async function state(window, selector) {
    return evaluate(
        window,
        (target) => {
            const layer = document.querySelector(target)
            if (!layer) return { mounted: false }
            const frame = layer.querySelector('[data-tld-dialog-motion]')
            const matrix = new DOMMatrixReadOnly(getComputedStyle(frame).transform)
            const dialog = layer.querySelector('[role="dialog"]')
            const rect = dialog.getBoundingClientRect()
            return {
                mounted: true,
                open: layer.dataset.dialogOpen,
                opacity: Number(getComputedStyle(layer).opacity),
                scale: matrix.m11,
                x: matrix.m41,
                y: matrix.m42,
                placement: layer.dataset.dialogPlacement,
                inert: frame.inert,
                ariaHidden: layer.getAttribute('aria-hidden'),
                title: dialog.querySelector('h2')?.textContent,
                text: dialog.textContent,
                width: rect.width,
                height: rect.height,
            }
        },
        selector,
    )
}

async function waitOpen(window, selector) {
    await waitFor(
        window,
        (target) => {
            const layer = document.querySelector(target)
            const frame = layer?.querySelector('[data-tld-dialog-motion]')
            if (!frame || frame.inert || layer.dataset.dialogOpen !== 'true') return false
            const matrix = new DOMMatrixReadOnly(getComputedStyle(frame).transform)
            return (
                Number(getComputedStyle(layer).opacity) >= 0.999 &&
                Math.abs(matrix.m41) < 0.01 &&
                Math.abs(matrix.m42) < 0.01 &&
                Math.abs(matrix.m11 - 1) < 0.001
            )
        },
        'open settles ' + selector,
        selector,
    )
}

async function waitClosed(window, selector) {
    await waitFor(
        window,
        (target) => !document.querySelector(target),
        'closed unmounts ' + selector,
        selector,
    )
}

async function openModal(window, trigger, tag) {
    await click(window, trigger)
    await frames(window)
    const selector = await markTop(window, tag)
    const entering = await state(window, selector)
    assert.ok(entering.opacity > 0 && entering.opacity < 1, tag + ' has an entering fade')
    assert.ok(
        entering.placement === 'right'
            ? entering.x > 0 && Math.abs(entering.scale - 1) < 0.001 && Math.abs(entering.y) < 0.01
            : entering.scale < 1 && entering.y > 0,
        tag + ' has its declared entrance direction',
    )
    await waitOpen(window, selector)
    return { selector, entering, opened: await state(window, selector) }
}

async function closeModal(window, selector, close) {
    const before = await state(window, selector)
    if (close === 'escape') {
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
    } else if (close === 'backdrop') {
        window.webContents.sendInputEvent({ type: 'mouseMove', x: 4, y: 4 })
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
    } else {
        const action =
            close ??
            (await evaluate(
                window,
                (target) =>
                    document.querySelector(target + ' [data-pause-action="close"]')
                        ? '[data-pause-action="close"]'
                        : 'button[aria-label="关闭对话框"]',
                selector,
            ))
        await click(window, selector + ' ' + action)
    }
    await frames(window)
    const closing = await state(window, selector)
    assert.equal(closing.mounted, true, before.title + ' remains rendered for exit')
    assert.equal(closing.open, 'false')
    assert.equal(closing.inert, true)
    assert.equal(closing.ariaHidden, 'true')
    assert.ok(closing.opacity > 0 && closing.opacity < 1, before.title + ' fades out')
    assert.ok(
        closing.placement === 'right'
            ? closing.x > 0 && Math.abs(closing.scale - 1) < 0.001 && Math.abs(closing.y) < 0.01
            : closing.scale < 1 && closing.y > 0,
        before.title + ' reverses its declared entrance direction',
    )
    assert.equal(closing.title, before.title, 'exit retains its own title')
    assert.equal(
        closing.text,
        before.text,
        'exit retains its content instead of an empty/oral frame',
    )
    await waitClosed(window, selector)
    return { before, closing }
}

async function loadPractice(window, origin, demo = 'sentence-basic', mode = 'translate') {
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'hydration',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
    })
}

async function setReduced(window, reduced) {
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }],
    })
    await waitFor(
        window,
        (expected) => matchMedia('(prefers-reduced-motion: reduce)').matches === expected,
        'motion preference',
        reduced,
    )
}

async function capture(window, name) {
    const path = 'dist/practice-dialog-motion-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function runPracticeDialogMotionChecks(window, origin, label) {
    const result = { label, status: 'running', dialogs: [], modes: [], nested: [], popovers: [] }
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.debugger.attach('1.3')
        await setReduced(window, false)
        await loadPractice(window, origin)

        for (const action of ['content', 'reset', 'report']) {
            const modal = await openModal(
                window,
                '[data-practice-navigation-action="' + action + '"]',
                label + '-' + action,
            )
            if (action === 'report') {
                result.reportScreenshot = await capture(
                    window,
                    label.toLowerCase() + '-report-open-pc',
                )
                await evaluate(
                    window,
                    (target) => {
                        const textarea = document.querySelector(target + ' textarea')
                        const setter = Object.getOwnPropertyDescriptor(
                            HTMLTextAreaElement.prototype,
                            'value',
                        ).set
                        setter.call(textarea, '关闭动画保留这段已填写内容')
                        textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    },
                    modal.selector,
                )
            }
            result.dialogs.push({
                action,
                ...modal,
                exit: await closeModal(
                    window,
                    modal.selector,
                    action === 'report' ? 'button[aria-label="关闭错误反馈"]' : undefined,
                ),
            })
        }
        const settings = await openModal(
            window,
            '[data-practice-navigation-action="settings"]',
            label + '-settings',
        )
        await clickText(window, '外观', settings.selector)
        await clickText(window, '随意选择颜色', settings.selector)
        await frames(window)
        const colorSelector = await markTop(window, label + '-color')
        const colorEntering = await state(window, colorSelector)
        assert.ok(colorEntering.opacity > 0 && colorEntering.opacity < 1)
        await waitOpen(window, colorSelector)
        const color = {
            selector: colorSelector,
            entering: colorEntering,
            opened: await state(window, colorSelector),
        }
        assert.equal(
            await evaluate(
                window,
                (target) => document.querySelector(target).inert,
                settings.selector,
            ),
            true,
            'nested dialog isolates its parent',
        )
        result.nested.push({
            name: 'color',
            ...color,
            exit: await closeModal(window, color.selector),
        })
        assert.equal(
            await evaluate(window, () => document.body.style.overflow),
            'hidden',
            'nested close keeps parent scroll lock',
        )
        assert.equal(
            await evaluate(
                window,
                (target) => document.querySelector(target).inert,
                settings.selector,
            ),
            false,
            'parent is active after nested exit',
        )

        await clickText(window, '快捷键', settings.selector)
        await clickText(window, '编辑朗读', settings.selector)
        await frames(window)
        const shortcutSelector = await markTop(window, label + '-shortcut')
        const shortcutEntering = await state(window, shortcutSelector)
        assert.ok(shortcutEntering.opacity > 0 && shortcutEntering.opacity < 1)
        await waitOpen(window, shortcutSelector)
        const shortcutExit = await closeModal(window, shortcutSelector)
        assert.ok(
            await evaluate(window, () => document.activeElement?.textContent.includes('编辑朗读')),
            'nested close restores exact settings trigger',
        )
        result.nested.push({ name: 'shortcut', entering: shortcutEntering, exit: shortcutExit })
        result.dialogs.push({
            action: 'settings',
            ...settings,
            exit: await closeModal(window, settings.selector),
        })

        const exit = await openModal(window, 'button[aria-label="退出练习"]', label + '-exit')
        result.dialogs.push({
            action: 'exit',
            ...exit,
            exit: await closeModal(
                window,
                exit.selector,
                'button[aria-label="关闭退出提示并继续游戏"]',
            ),
        })
        await loadPractice(window, origin, 'sentence-basic', 'listen')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-quick-oral]:not(:disabled)')),
            'quick oral available',
        )
        const oral = await openModal(window, '[data-practice-quick-oral]', label + '-oral')
        result.dialogs.push({
            action: 'oral',
            ...oral,
            exit: await closeModal(window, oral.selector),
        })

        // 拼读首图标已纠正为卡内解析翻面；笔记组件保留但暂未分配新入口。
        // 翻面回归归 word-pronunciation-runtime-smoke，不将其当作模态弹窗。

        for (const [family, mode] of [
            ['word', 'pronounce'],
            ['sentence', 'listen'],
            ['audio', 'listen'],
            ['video', 'listen'],
            ['picture', 'listen'],
            ['guess', 'guess'],
        ]) {
            await loadPractice(window, origin, family + '-basic', mode)
            const modal = await openModal(
                window,
                '[data-practice-navigation-action="mode"]',
                label + '-mode-' + family,
            )
            const initial = await evaluate(
                window,
                () =>
                    document.querySelector('[data-practice-mode-selector]').dataset
                        .practiceModeSelected,
            )
            await evaluate(window, () =>
                document.querySelectorAll('[data-practice-mode-option]').item(1).click(),
            )
            const selected = await evaluate(
                window,
                () =>
                    document.querySelector('[data-practice-mode-selector]').dataset
                        .practiceModeSelected,
            )
            assert.notEqual(selected, initial)
            const exit = await closeModal(
                window,
                modal.selector,
                'button[aria-label="关闭模式选择"]',
            )
            const again = await openModal(
                window,
                '[data-practice-navigation-action="mode"]',
                label + '-mode-again-' + family,
            )
            assert.equal(
                await evaluate(
                    window,
                    () =>
                        document.querySelector('[data-practice-mode-selector]').dataset
                            .practiceModeSelected,
                ),
                initial,
                'cancel resets pending mode when reopened',
            )
            await closeModal(window, again.selector, 'button[aria-label="关闭模式选择"]')
            result.modes.push({ family, ...modal, exit })
        }

        await loadPractice(window, origin)
        const modal = await openModal(
            window,
            '[data-practice-navigation-action="reset"]',
            label + '-reverse',
        )
        await click(window, modal.selector + ' button[aria-label="关闭对话框"]')
        await frames(window)
        const before = await state(window, modal.selector)
        await click(window, '[data-practice-navigation-action="reset"]')
        await frames(window)
        const after = await state(window, modal.selector)
        assert.ok(
            after.opacity >= before.opacity && after.y <= before.y + 0.1,
            'reopen reverses current transition without an offscreen restart',
        )
        await waitOpen(window, modal.selector)
        await delay(260)
        assert.equal(
            (await state(window, modal.selector)).mounted,
            true,
            'stale close callback cannot hide a reopened modal',
        )
        result.rapidReverse = { before, after, exit: await closeModal(window, modal.selector) }
        result.dismissal = []
        for (const method of ['escape', 'backdrop']) {
            const action = 'reset'
            const dialog = await openModal(
                window,
                '[data-practice-navigation-action="' + action + '"]',
                label + '-' + method,
            )
            result.dismissal.push({
                method,
                exit: await closeModal(window, dialog.selector, method),
            })
            assert.equal(
                await evaluate(window, () =>
                    document.activeElement?.getAttribute('data-practice-navigation-action'),
                ),
                action,
                method + ' restores focus after animated close',
            )
        }

        await loadPractice(window, origin, 'word-basic', 'pronounce')
        const starting = await openModal(
            window,
            '[data-practice-navigation-action="mode"]',
            label + '-start',
        )
        await click(window, '[data-practice-mode-option="spell"]')
        await click(window, '[data-practice-mode-start]')
        await frames(window)
        const startingExit = await state(window, starting.selector)
        assert.equal(startingExit.open, 'false', 'start first closes the selector')
        assert.equal(
            await evaluate(window, () => new URL(location.href).searchParams.get('mode')),
            'pronounce',
            'navigation waits for the exit animation',
        )
        await waitClosed(window, starting.selector)
        await waitFor(
            window,
            () => new URL(location.href).searchParams.get('mode') === 'spell',
            'start applies its selected mode after closing',
        )
        result.startAfterExit = startingExit

        await loadPractice(window, origin)
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
            'last sample reached',
        )
        await click(window, '[data-practice-footer-action="question.next"]')
        await frames(window)
        const finishSelector = await markTop(window, label + '-finish')
        const finishEntering = await state(window, finishSelector)
        assert.ok(finishEntering.opacity > 0 && finishEntering.opacity < 1)
        await waitOpen(window, finishSelector)
        result.dialogs.push({
            action: 'finish',
            entering: finishEntering,
            exit: await closeModal(window, finishSelector, 'button[aria-label="关闭完成练习"]'),
        })
        await waitFor(
            window,
            () => !new URL(location.href).searchParams.has('demo'),
            'finish returns to catalog after its exit',
        )

        for (const [family, mode] of [
            ['sentence', 'translate'],
            ['audio', 'translate'],
            ['word', 'pronounce'],
        ]) {
            await loadPractice(window, origin, family + '-basic', mode)
            await click(window, 'button[aria-label="本模式设置"]')
            await frames(window)
            const entering = await evaluate(window, () => {
                const panel = document.querySelector('[data-practice-options]')
                return {
                    opacity: Number(getComputedStyle(panel).opacity),
                    y: new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42,
                }
            })
            assert.ok(entering.opacity > 0 && entering.opacity < 1 && entering.y < 0)
            await waitFor(
                window,
                () =>
                    Number(
                        getComputedStyle(document.querySelector('[data-practice-options]')).opacity,
                    ) >= 0.999,
                'popover opening',
            )
            await click(window, 'button[aria-label="本模式设置"]')
            await frames(window)
            const closing = await evaluate(window, () => {
                const panel = document.querySelector('[data-practice-options]')
                return (
                    panel && {
                        opacity: Number(getComputedStyle(panel).opacity),
                        inert: panel.inert,
                        ariaHidden: panel.getAttribute('aria-hidden'),
                    }
                )
            })
            assert.ok(closing && closing.opacity > 0 && closing.opacity < 1)
            assert.equal(closing.inert, true)
            assert.equal(closing.ariaHidden, 'true')
            await waitFor(
                window,
                () => !document.querySelector('[data-practice-options]'),
                'popover exit removes panel',
            )
            result.popovers.push({ family, entering, closing })
        }

        await loadPractice(window, origin)
        await setReduced(window, true)
        await click(window, '[data-practice-navigation-action="reset"]')
        await frames(window)
        const reducedSelector = await markTop(window, label + '-reduced')
        const reducedOpen = await state(window, reducedSelector)
        assert.equal(reducedOpen.opacity, 1)
        assert.equal(reducedOpen.scale, 1)
        await click(window, reducedSelector + ' button[aria-label="关闭对话框"]')
        await frames(window)
        assert.equal((await state(window, reducedSelector)).mounted, false)
        result.reducedMotion = true
        await setReduced(window, false)
        const liveReduce = await openModal(
            window,
            '[data-practice-navigation-action="reset"]',
            label + '-live-reduce',
        )
        await click(window, liveReduce.selector + ' button[aria-label="关闭对话框"]')
        await setReduced(window, true)
        await frames(window)
        assert.equal(
            (await state(window, liveReduce.selector)).mounted,
            false,
            'changing reduced-motion completes pending exit',
        )
        result.liveReducedMotion = true
        await setReduced(window, false)
        await loadPractice(window, origin)
        const themeSettings = await openModal(
            window,
            '[data-practice-navigation-action="settings"]',
            label + '-theme-settings',
        )
        await clickText(window, '外观', themeSettings.selector)
        await click(window, themeSettings.selector + ' input[type="radio"][value="light"]')
        await waitFor(
            window,
            () => document.documentElement.dataset.theme === 'light',
            'light theme is applied',
        )
        await evaluate(window, async () => {
            await Promise.allSettled(
                document
                    .getAnimations()
                    .filter((animation) =>
                        Number.isFinite(animation.effect?.getComputedTiming().endTime),
                    )
                    .map((animation) => animation.finished),
            )
        })
        await closeModal(window, themeSettings.selector)
        const light = await openModal(
            window,
            '[data-practice-navigation-action="report"]',
            label + '-light-report',
        )
        const darkGeometry = result.dialogs.find((item) => item.action === 'report').opened
        assert.equal(light.opened.width, darkGeometry.width)
        assert.equal(light.opened.height, darkGeometry.height)
        result.lightScreenshot = await capture(
            window,
            label.toLowerCase() + '-report-light-open-pc',
        )
        result.lightTheme = {
            ...light,
            exit: await closeModal(window, light.selector, 'button[aria-label="关闭错误反馈"]'),
        }

        await window.loadURL(origin + '/awakening/courses/phonetics/')
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector(
                        '[data-chapter-number="2"] button[data-practice-chapter-entry]',
                    ),
                ),
            'course chapter is ready',
        )
        await click(window, '[data-chapter-number="2"] button[data-practice-chapter-entry]')
        await frames(window)
        const courseSelector = await markTop(window, label + '-course-default')
        const course = await state(window, courseSelector)
        assert.equal(course.opacity, 1, 'non-practice consumer keeps immediate display')
        assert.equal(course.scale, 1)
        await click(window, '[data-practice-mode-option="spell"]')
        await click(window, '[data-practice-mode-start]')
        await waitFor(
            window,
            () =>
                location.pathname === '/practice/' &&
                new URL(location.href).searchParams.get('mode') === 'spell',
            'course default starts without requiring a retained closing owner',
        )
        result.defaultConsumer = course
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = String(error.stack ?? error)
        result.failureScreenshot = await capture(window, label.toLowerCase() + '-failure-pc')
        throw error
    } finally {
        if (window.webContents.debugger.isAttached()) {
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
            window.webContents.debugger.detach()
        }
        window.setContentSize(...priorSize)
        window.webContents.setZoomFactor(priorZoom)
        writeFileSync(
            resolve('dist/practice-dialog-motion-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticeDialogMotionChecks }
