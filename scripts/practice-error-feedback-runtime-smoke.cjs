const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const dialogSelector = '[data-practice-error-feedback]'
const reportSelector = '[data-practice-navigation-action="report"]'
const descriptionSelector = dialogSelector + ' textarea[aria-label="错误描述"]'
const screenshotBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWOQqNjyH4QZYAwAS5wJDeF85DkAAAAASUVORK5CYII='

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
    const state = await evaluate(window, () => ({
        href: location.href,
        dialog: document.querySelector('[data-practice-error-feedback]')?.outerHTML.slice(0, 4500),
        active: document.activeElement?.outerHTML.slice(0, 350),
        index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
    }))
    throw new Error(
        'Timed out: practice error feedback ' + description + ' ' + JSON.stringify(state),
    )
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'current images finish',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
        await Promise.allSettled(
            document
                .getAnimations()
                .filter((animation) => {
                    const timing = animation.effect?.getComputedTiming()
                    return (
                        timing &&
                        Number.isFinite(timing.endTime) &&
                        animation.playState !== 'finished'
                    )
                })
                .map((animation) => animation.finished),
        )
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    await waitFor(
        window,
        () =>
            Array.from(
                document.querySelectorAll('[data-tld-dialog-layer][data-dialog-open="true"]'),
            ).every((layer) => {
                const frame = layer.querySelector('[data-tld-dialog-motion]')
                if (!frame) return true
                const matrix = new DOMMatrixReadOnly(getComputedStyle(frame).transform)
                return (
                    Number(getComputedStyle(layer).opacity) >= 0.999 &&
                    Math.abs(matrix.m11 - 1) < 0.001 &&
                    Math.abs(matrix.m22 - 1) < 0.001 &&
                    Math.abs(matrix.m41) < 0.01 &&
                    Math.abs(matrix.m42) < 0.01
                )
            }),
        'finite shared modal motion finishes before geometry and capture',
    )
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled feedback control: ' + target)
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
            const control = Array.from(
                document
                    .querySelector('[data-practice-error-feedback]')
                    ?.querySelectorAll('button') ?? [],
            ).find((button) => button.textContent.replace(/\s+/g, '') === label.replace(/\s+/g, ''))
            if (!control || control.matches(':disabled'))
                throw new Error('Missing feedback action: ' + label)
            control.focus()
            control.click()
        },
        text,
    )
}

async function openFeedback(window) {
    await click(window, reportSelector)
    await waitFor(
        window,
        () =>
            document
                .querySelector('[data-practice-error-feedback]')
                ?.closest('[role="dialog"]')
                ?.getAttribute('aria-modal') === 'true',
        'real report navigation opens the modal',
    )
    await settle(window)
}

async function installNotificationProbe(window) {
    await evaluate(window, () => {
        if (window.feedbackNotificationProbe) return
        const probe = { originalAlert: window.alert, messages: [] }
        window.alert = (message) => probe.messages.push(String(message))
        window.feedbackNotificationProbe = probe
    })
}

async function restoreNotificationProbe(window) {
    await evaluate(window, () => {
        const probe = window.feedbackNotificationProbe
        if (!probe) return
        window.alert = probe.originalAlert
        delete window.feedbackNotificationProbe
    })
}

async function visitPractice(window, origin, demo = 'sentence-basic', mode = 'translate') {
    await settle(window)
    await window.loadURL(
        origin + '/practice/?demo=' + demo + '&mode=' + mode + '&keep=feedback-smoke',
    )
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice hydrates',
    )
    await settle(window)
    // 只隔离本测试文档的原生通知回退，防止隐藏窗口弹出阻塞式系统对话框。
    await installNotificationProbe(window)
}

async function setTheme(window, origin, theme) {
    if ((await evaluate(window, () => document.documentElement.dataset.theme)) === theme) return
    await settle(window)
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'dark' ? '夜间模式' : '白天模式'
    await waitFor(
        window,
        (name) => {
            const input = document.querySelector('input[aria-label="' + name + '"]')
            return (
                input &&
                !input.matches(':disabled') &&
                document.body.textContent.includes('本机设置已就绪')
            )
        },
        'theme controls hydrate',
        label,
    )
    await click(window, 'input[aria-label="' + label + '"]')
    await waitFor(
        window,
        (expected) => document.documentElement.dataset.theme === expected,
        'theme applies',
        theme,
    )
    await settle(window)
}

async function fillDescription(window, value) {
    await evaluate(
        window,
        (text) => {
            const textarea = document.querySelector(
                '[data-practice-error-feedback] textarea[aria-label="错误描述"]',
            )
            if (!textarea) throw new Error('Feedback textarea missing')
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(
                textarea,
                text,
            )
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        },
        value,
    )
    await waitFor(
        window,
        (text) => document.querySelector('[data-practice-error-feedback] textarea')?.value === text,
        'description updates',
        value,
    )
}

async function chooseScreenshot(window, name = 'feedback-example.png') {
    await evaluate(
        window,
        (encoded, filename) => {
            const input = document.querySelector(
                '[data-practice-error-feedback] input[type="file"]',
            )
            if (!input) throw new Error('Feedback file input missing')
            const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
            const transfer = new DataTransfer()
            transfer.items.add(new File([bytes], filename, { type: 'image/png' }))
            input.files = transfer.files
            input.dispatchEvent(new Event('change', { bubbles: true }))
        },
        screenshotBase64,
        name,
    )
    await waitFor(
        window,
        () => {
            const image = document.querySelector(
                '[data-practice-error-feedback] img[src^="data:image/"]',
            )
            return image && image.complete && image.naturalWidth > 0
        },
        'selected local screenshot previews',
    )
    await settle(window)
    return evaluate(
        window,
        () => document.querySelector('[data-practice-error-feedback] img[src^="data:image/"]').src,
    )
}

async function readForm(window) {
    return evaluate(window, () => {
        const dialog = document.querySelector('[data-practice-error-feedback]')
        return {
            description: dialog?.querySelector('textarea')?.value,
            checked: Array.from(dialog?.querySelectorAll('input[type="checkbox"]') ?? []).map(
                (input) => input.checked,
            ),
            screenshot: dialog?.querySelector('img[src^="data:image/"]')?.src ?? null,
        }
    })
}

async function questionState(window) {
    return evaluate(window, () => {
        const session = document.querySelector('[data-practice-phase]')
        return {
            href: location.href,
            phase: session?.getAttribute('data-practice-phase'),
            index: session?.getAttribute('data-practice-index'),
            oralStage: session?.getAttribute('data-practice-oral-stage'),
            progress: document
                .querySelector('[data-practice-progress]')
                ?.getAttribute('aria-valuenow'),
        }
    })
}

async function sendKey(window, keyCode, character) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    if (character) window.webContents.sendInputEvent({ type: 'char', keyCode: character })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(60)
}

async function measure(window) {
    await settle(window)
    return evaluate(window, () => {
        function rgba(color) {
            const canvas = document.createElement('canvas')
            canvas.width = 1
            canvas.height = 1
            const context = canvas.getContext('2d')
            if (!context) throw new Error('Cannot normalize the computed border color')
            context.fillStyle = color
            context.fillRect(0, 0, 1, 1)
            return Array.from(context.getImageData(0, 0, 1, 1).data)
        }
        function box(element) {
            if (!element) return null
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
                cursor: style.cursor,
                color: style.color,
                background: style.backgroundColor,
                backgroundImage: style.backgroundImage,
                borderColor: style.borderTopColor,
                borderColorRgba: rgba(style.borderTopColor),
                borderStyle: style.borderTopStyle,
                borderWidth: style.borderTopWidth,
            }
        }
        const form = document.querySelector('[data-practice-error-feedback]')
        const dialog = form?.closest('[role="dialog"]')
        const actions = Array.from(form?.querySelectorAll('button') ?? [])
        return {
            viewport: [innerWidth, innerHeight],
            location: { protocol: location.protocol, host: location.host },
            theme: document.documentElement.dataset.theme,
            panel: box(dialog?.parentElement),
            surface: box(dialog),
            title: box(document.querySelector('[data-practice-error-title]')),
            content: box(form?.querySelector('[data-practice-error-content]')),
            labels: Array.from(form?.querySelectorAll('[data-practice-error-label]') ?? []).map(
                box,
            ),
            categories: Array.from(form?.querySelectorAll('input[type="checkbox"]') ?? []).map(
                (input) => ({
                    label:
                        input.labels?.[0]?.textContent.trim() ?? input.getAttribute('aria-label'),
                    checked: input.checked,
                    input: box(input),
                    control: box(input.labels?.[0]),
                    text: box(
                        input.labels?.[0]?.querySelector('span:not([aria-hidden])') ??
                            input.labels?.[0],
                    ),
                }),
            ),
            description: box(dialog?.querySelector('textarea')),
            screenshot: box(dialog?.querySelector('[data-practice-error-screenshot] label')),
            submit: box(
                actions.find((button) => button.textContent.replace(/\s+/g, '') === '提交'),
            ),
            cancel: box(
                actions.find((button) => button.textContent.replace(/\s+/g, '') === '取消'),
            ),
            close: box(
                dialog?.querySelector(
                    'button[aria-label="关闭错误反馈"],button[aria-label="关闭对话框"]',
                ),
            ),
            closeIcon: box(dialog?.querySelector('button[aria-label="关闭错误反馈"] img')),
            staticImages: Array.from(form?.querySelectorAll('img') ?? []).map((image) => ({
                kind: image.closest('button[aria-label="关闭错误反馈"]')
                    ? 'close'
                    : image.closest('[data-appearance="ring-compact"]')
                      ? 'ring'
                      : image.closest('[data-practice-error-screenshot]')
                        ? 'add'
                        : 'unknown',
                src: image.src,
                currentSrc: image.currentSrc,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                rendered: box(image),
            })),
            operable: Array.from(
                dialog?.querySelectorAll('button,input[type="checkbox"],label[for]') ?? [],
            )
                .filter(
                    (element) =>
                        !element.matches(':disabled') && element.getClientRects().length > 0,
                )
                .map((element) => ({
                    tag: element.tagName,
                    text: element.textContent.trim(),
                    cursor: getComputedStyle(element).cursor,
                })),
            role: dialog?.getAttribute('role'),
            modal: dialog?.getAttribute('aria-modal'),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            dialogHorizontalOverflow: dialog ? dialog.scrollWidth > dialog.clientWidth + 1 : true,
            screenshotCount: form?.querySelectorAll('img[src^="data:image/"]').length,
        }
    })
}

function near(actual, expected, description, tolerance = 0.05) {
    assert.ok(
        Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
        description + ': expected ' + expected + ', received ' + actual,
    )
}

function assertReference(snapshot) {
    assert.deepEqual(snapshot.viewport, [1920, 1080])
    for (const [key, expected] of Object.entries({ x: 617, y: 129, width: 686, height: 822 }))
        near(snapshot.panel[key], expected, 'feedback panel ' + key)
    for (const [key, expected] of Object.entries({ x: 649, y: 203, width: 630, height: 98 }))
        near(snapshot.content[key], expected, 'current question content ' + key)
    assert.equal(snapshot.title.fontSize, '24px')
    assert.equal(snapshot.title.lineHeight, '34px')
    assert.equal(snapshot.title.fontWeight, '500')
    assert.equal(
        snapshot.labels.length,
        3,
        'all three editable feedback field labels are measurable',
    )
    for (const [index, label] of snapshot.labels.entries()) {
        near(label.x, 649, 'field label ' + index + ' left')
        near(label.y, [321, 458, 650][index], 'field label ' + index + ' top')
        assert.equal(label.fontSize, '22px')
        assert.equal(label.lineHeight, '31px')
        assert.equal(label.fontWeight, '500')
    }
    assert.equal(snapshot.categories.length, 7)
    assert.deepEqual(
        snapshot.categories.map((category) => category.label),
        [
            '音标错误',
            '词性错误',
            '翻译不准',
            '拼写有误',
            '句子成分划分错误',
            '发音不准或听不清',
            '其他',
        ],
        'the design exposes exactly seven Chinese error categories',
    )
    for (const [index, category] of snapshot.categories.entries()) {
        const expectedX = [649, 764, 879, 994, 649, 836, 1023][index]
        const expectedY = index < 4 ? 370 : 415
        near(category.input.x, expectedX, 'category ' + index + ' input left')
        near(category.input.y, expectedY, 'category ' + index + ' input top')
        near(category.control.x, expectedX, 'category ' + index + ' label left')
        near(category.control.y, expectedY, 'category ' + index + ' label top')
        assert.equal(category.text.fontSize, '18px')
        assert.equal(category.text.lineHeight, '25px')
        assert.equal(category.text.fontWeight, '400')
        assert.equal(category.input.cursor, 'pointer')
    }
    near(snapshot.description.x, 649, 'feedback description left')
    near(snapshot.description.y, 499, 'feedback description top')
    near(snapshot.description.width, 625, 'feedback description width')
    near(snapshot.description.height, 133, 'feedback description height')
    near(snapshot.screenshot.x, 649, 'feedback screenshot left')
    near(snapshot.screenshot.y, 693, 'feedback screenshot top')
    near(snapshot.screenshot.width, 130, 'feedback screenshot width')
    near(snapshot.screenshot.height, 130, 'feedback screenshot height')
    for (const key of ['submit', 'cancel']) {
        near(snapshot[key].x, key === 'submit' ? 1079 : 869, key + ' left')
        near(snapshot[key].y, 861, key + ' top')
        near(snapshot[key].width, 180, key + ' width')
        near(snapshot[key].height, 50, key + ' height')
    }
    for (const [key, expected] of Object.entries({ x: 1255, y: 158, width: 24, height: 24 }))
        near(snapshot.closeIcon[key], expected, 'close icon ' + key)
    assert.equal(
        snapshot.staticImages.length,
        9,
        'initial feedback contains only local close, seven ring, and add images',
    )
    assert.deepEqual(
        snapshot.staticImages.map((image) => image.kind),
        ['close', 'ring', 'ring', 'ring', 'ring', 'ring', 'ring', 'ring', 'add'],
        'all static image roles match the supplied design assets',
    )
    for (const [index, image] of snapshot.staticImages.entries()) {
        assert.ok(
            image.src.length > 0 && image.currentSrc.length > 0,
            'static image ' + index + ' has a source',
        )
        const source = new URL(image.src)
        assert.equal(
            source.protocol,
            snapshot.location.protocol,
            'static image ' + index + ' uses the application protocol',
        )
        assert.equal(
            source.host,
            snapshot.location.host,
            'static image ' + index + ' stays in the application host',
        )
        assert.ok(
            source.pathname.startsWith('/_next/static/media/'),
            'static image ' + index + ' is an exported local asset',
        )
        assert.equal(source.search, '', 'static image ' + index + ' has no temporary query token')
        const expectedSize = image.kind === 'close' ? 24 : image.kind === 'ring' ? 14 : 18
        near(image.naturalWidth, expectedSize, 'static image ' + index + ' natural width')
        near(image.naturalHeight, expectedSize, 'static image ' + index + ' natural height')
        near(image.rendered.width, expectedSize, 'static image ' + index + ' rendered width')
        near(image.rendered.height, expectedSize, 'static image ' + index + ' rendered height')
    }
    if (snapshot.theme === 'dark') {
        for (const [index, label] of snapshot.labels.entries())
            assert.equal(
                label.color,
                'rgb(255, 255, 255)',
                'dark field label ' + index + ' is foreground white',
            )
        for (const [index, category] of snapshot.categories.entries())
            assert.equal(
                category.text.color,
                'rgb(255, 255, 255)',
                'dark category ' + index + ' is foreground white',
            )
        for (const [name, region] of [
            ['content', snapshot.content],
            ['description', snapshot.description],
            ['screenshot', snapshot.screenshot],
        ]) {
            assert.deepEqual(
                region.borderColorRgba.slice(0, 3),
                [255, 255, 255],
                'dark ' + name + ' border uses foreground white',
            )
            // Canvas 颜色归一化只有8位 alpha 精度；原始计算样式仍完整保存在报告中。
            near(region.borderColorRgba[3] / 255, 0.3, 'dark ' + name + ' border alpha', 0.002)
        }
    }
    assert.equal(snapshot.role, 'dialog')
    assert.equal(snapshot.modal, 'true')
    assert.equal(snapshot.horizontalOverflow, false)
    assert.equal(snapshot.dialogHorizontalOverflow, false)
    for (const action of snapshot.operable)
        assert.equal(
            action.cursor,
            'pointer',
            'feedback interactive cursor: ' + action.tag + ' ' + action.text,
        )
}

async function assertReflow(window, description) {
    const snapshot = await measure(window)
    const [width, height] = snapshot.viewport
    assert.ok(
        snapshot.panel.x >= -0.1 && snapshot.panel.y >= -0.1,
        description + ' panel begins in viewport',
    )
    assert.ok(
        snapshot.panel.x + snapshot.panel.width <= width + 0.1,
        description + ' panel fits horizontally',
    )
    assert.ok(
        snapshot.panel.y + snapshot.panel.height <= height + 0.1,
        description + ' panel fits vertically',
    )
    assert.equal(
        snapshot.horizontalOverflow,
        false,
        description + ' document has no horizontal overflow',
    )
    assert.equal(
        snapshot.dialogHorizontalOverflow,
        false,
        description + ' dialog has no horizontal overflow',
    )
    for (const name of ['submit', 'cancel', 'close']) {
        const reachable = await evaluate(
            window,
            (key) => {
                const dialog = document
                    .querySelector('[data-practice-error-feedback]')
                    .closest('[role="dialog"]')
                const buttons = Array.from(dialog.querySelectorAll('button'))
                const button =
                    key === 'close'
                        ? dialog.querySelector(
                              'button[aria-label="关闭错误反馈"],button[aria-label="关闭对话框"]',
                          )
                        : buttons.find(
                              (item) =>
                                  item.textContent.replace(/\s+/g, '') ===
                                  (key === 'submit' ? '提交' : '取消'),
                          )
                button.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                const rect = button.getBoundingClientRect()
                const hit = document.elementFromPoint(
                    rect.x + rect.width / 2,
                    rect.y + rect.height / 2,
                )
                return (
                    rect.x >= -0.1 &&
                    rect.y >= -0.1 &&
                    rect.right <= innerWidth + 0.1 &&
                    rect.bottom <= innerHeight + 0.1 &&
                    hit?.closest('button') === button
                )
            },
            name,
        )
        assert.equal(reachable, true, description + ' ' + name + ' reachable by local scroll')
    }
    return snapshot
}

async function capture(window, path) {
    await settle(window)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function closeAndAssertReset(window, method) {
    await fillDescription(window, '关闭方式 ' + method + ' 应清空本次反馈')
    await click(window, dialogSelector + ' input[type="checkbox"]')
    await chooseScreenshot(window, method + '.png')
    if (method === 'close') {
        await click(window, '[role="dialog"] button[aria-label="关闭错误反馈"]')
    } else if (method === 'cancel') {
        await clickText(window, '取消')
    } else if (method === 'escape') {
        await click(window, descriptionSelector)
        await sendKey(window, 'Escape')
    } else {
        // 使用真实鼠标事件命中弹窗外的遮罩，避免仅直接调用 React 回调。
        window.webContents.sendInputEvent({
            type: 'mouseDown',
            x: 8,
            y: 8,
            button: 'left',
            clickCount: 1,
        })
        window.webContents.sendInputEvent({
            type: 'mouseUp',
            x: 8,
            y: 8,
            button: 'left',
            clickCount: 1,
        })
    }
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-error-feedback]'),
        method + ' closes modal',
    )
    await waitFor(
        window,
        () =>
            document.activeElement ===
            document.querySelector('[data-practice-navigation-action="report"]'),
        method + ' restores navigation focus',
    )
    assert.equal(
        await evaluate(window, () =>
            Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
        ),
        false,
        method + ' does not trigger the underlying pause dialog',
    )
    await openFeedback(window)
    assert.deepEqual(
        await readForm(window),
        {
            description: '',
            checked: [false, false, false, false, false, false, false],
            screenshot: null,
        },
        method + ' reopens a clean form',
    )
}

async function runPracticeErrorFeedbackChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const session = window.webContents.session
    const application = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const exportedPages = new Set(manifest.routes)
    const exportedFiles = new Set(manifest.files.map((path) => '/' + path))
    const result = {
        label,
        status: 'running',
        businessRequests: [],
        permissionRequests: [],
        consoleErrors: [],
        notificationMessages: [],
        themes: [],
        pcReflow: [],
        pageZoom: [],
        limitations: [
            '错误反馈没有后台接口；提交仅显示未发送并保留表单，没有提交或图片上传成功承诺',
            '图片使用本机 File/DataTransfer 技术夹具，未代替系统文件选择器及真实图片兼容验收',
            'PC设计基准、双主题与真实页面缩放不代表平板/H5视觉、软键盘或真机验收',
        ],
    }
    let originalTheme
    const onConsole = (event) => {
        if (event.level === 'warning' || event.level === 'error')
            result.consoleErrors.push(event.message)
    }
    window.webContents.on('console-message', onConsole)
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (
            typeof details.webContentsId === 'number' &&
            details.webContentsId > 0 &&
            details.webContentsId !== window.webContents.id
        ) {
            callback({ requestHeaders: details.requestHeaders })
            return
        }
        const url = new URL(details.url)
        const sameApplication =
            url.protocol === application.protocol && url.host === application.host
        const page = isExportedPageRequest(details, origin, exportedPages)
        const asset =
            sameApplication &&
            ['GET', 'HEAD'].includes(details.method) &&
            exportedFiles.has(url.pathname)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!sameApplication && ['http:', 'https:'].includes(url.protocol)) ||
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
    try {
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await setTheme(window, origin, 'dark')
        await visitPractice(window, origin)
        const initialQuestion = await questionState(window)
        await openFeedback(window)
        const content = await evaluate(window, () => ({
            title: document.querySelector('[data-practice-error-title]')?.textContent.trim(),
            text: document.querySelector('[data-practice-error-feedback]')?.textContent,
        }))
        assert.equal(content.title, '错误反馈')
        assert.ok(content.text.includes('we read books together'))
        assert.ok(content.text.includes('我们一起读书'))
        const dark = await measure(window)
        assertReference(dark)
        result.themes.push({
            theme: 'dark',
            measured: dark,
            screenshot: await capture(
                window,
                'dist/practice-error-feedback-' + label.toLowerCase() + '-dark-pc.png',
            ),
        })
        await clickText(window, '提交')
        await waitFor(
            window,
            () =>
                /请选择至少一种错误类型/.test(
                    document.querySelector('[data-practice-error-feedback] [role="alert"]')
                        ?.textContent ?? '',
                ),
            'at least one error category is required',
        )
        result.categoryIsRequired = true
        await waitFor(
            window,
            () => {
                const textarea = document.querySelector('[data-practice-error-feedback] textarea')
                return (
                    textarea?.getAttribute('aria-invalid') === 'true' ||
                    Boolean(textarea?.validationMessage) ||
                    /请输入.*描述|描述.*必填/.test(
                        document.querySelector('[data-practice-error-feedback]')?.textContent ?? '',
                    )
                )
            },
            'empty description is rejected',
        )
        await fillDescription(window, '   ')
        await clickText(window, '提交')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[data-practice-error-feedback] textarea')
                    ?.getAttribute('aria-invalid') === 'true' ||
                /请输入.*描述|描述.*必填/.test(
                    document.querySelector('[data-practice-error-feedback]')?.textContent ?? '',
                ),
            'whitespace-only description is rejected',
        )
        result.descriptionIsRequiredAndTrimmed = true
        assert.deepEqual(
            await evaluate(window, () => window.feedbackNotificationProbe.messages),
            [],
            'invalid feedback does not emit a submission notification',
        )
        await click(window, dialogSelector + ' input[type="checkbox"]')
        // 不依赖 DOM 兄弟结构：明确点击最后一个分类控件。
        await evaluate(window, () => {
            const options = document.querySelectorAll(
                '[data-practice-error-feedback] input[type="checkbox"]',
            )
            if (!options[options.length - 1].checked) options[options.length - 1].click()
        })
        await fillDescription(window, '示例句子的翻译和发音需要核对。')
        await chooseScreenshot(window)
        const beforeSubmit = await readForm(window)
        assert.ok(
            beforeSubmit.checked.filter(Boolean).length >= 2,
            'feedback supports multiple categories',
        )
        await clickText(window, '提交')
        await waitFor(
            window,
            () =>
                /未发送/.test(
                    document.querySelector('[data-practice-error-feedback] [role="status"]')
                        ?.textContent ??
                        document.querySelector('[data-practice-error-feedback]')?.textContent ??
                        '',
                ),
            'submit reports not sent',
        )
        await waitFor(
            window,
            () =>
                window.feedbackNotificationProbe.messages.some((message) =>
                    message.includes('未发送'),
                ),
            'shared notification reports that feedback was not sent',
        )
        result.notificationMessages = await evaluate(
            window,
            () => window.feedbackNotificationProbe.messages,
        )
        assert.deepEqual(
            await readForm(window),
            beforeSubmit,
            'unavailable submission preserves all feedback input',
        )
        result.submitIsHonestAndPreservesInput = true
        const beforeKeys = await questionState(window)
        await click(window, descriptionSelector)
        await evaluate(window, () => {
            const textarea = document.querySelector('[data-practice-error-feedback] textarea')
            textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        })
        await sendKey(window, 'Return', '\r')
        await sendKey(window, 'Space', ' ')
        await sendKey(window, 'V', 'v')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[data-practice-error-feedback] textarea')
                    ?.value.endsWith('\n v'),
            'editing keys remain text',
        )
        assert.deepEqual(
            await questionState(window),
            beforeKeys,
            'feedback Enter Space V do not alter question or oral state',
        )
        await evaluate(window, () => {
            const controls = Array.from(
                document
                    .querySelector('[data-practice-error-feedback]')
                    .querySelectorAll('button,input,textarea,select,a[href],[tabindex]'),
            ).filter(
                (control) =>
                    !control.matches(':disabled') &&
                    control.tabIndex >= 0 &&
                    control.getClientRects().length > 0,
            )
            controls[controls.length - 1].focus()
        })
        await sendKey(window, 'Tab')
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-practice-error-feedback]')
                    .contains(document.activeElement),
            ),
            true,
            'Tab stays inside the modal',
        )
        result.modalKeyboardIsIsolatedAndFocusIsContained = true
        await click(
            window,
            dialogSelector + ' [data-practice-error-screenshot] button[aria-label^="移除图片 "]',
        )
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-error-feedback] img[src^="data:image/"]'),
            'remove clears local data URL preview',
        )
        result.screenshotUsesCspCompatibleDataUrlAndRemovalClearsPreview = true
        await fillDescription(window, '')
        await evaluate(window, () =>
            document
                .querySelectorAll('[data-practice-error-feedback] input[type="checkbox"]')
                .forEach((input) => {
                    if (input.checked) input.click()
                }),
        )
        for (const method of ['close', 'cancel', 'escape', 'backdrop'])
            await closeAndAssertReset(window, method)
        result.closeCancelEscapeBackdropResetAndRestoreFocus = true
        assert.deepEqual(
            await questionState(window),
            initialQuestion,
            'feedback lifecycle leaves the exercise unchanged',
        )
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            result.pcReflow.push({
                width,
                measured: await assertReflow(window, 'PC width ' + width),
            })
        }
        window.setContentSize(1920, 1080)
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            result.pageZoom.push({
                factor,
                measured: await assertReflow(window, 'real browser zoom ' + factor),
            })
        }
        window.webContents.setZoomFactor(1)
        await clickText(window, '取消')
        await setTheme(window, origin, 'light')
        await visitPractice(window, origin)
        await openFeedback(window)
        const light = await measure(window)
        assertReference(light)
        assert.equal(light.theme, 'light')
        assert.notEqual(
            light.surface.backgroundImage,
            dark.surface.backgroundImage,
            'light and dark use distinct semantic panel colors',
        )
        result.themes.push({
            theme: 'light',
            measured: light,
            screenshot: await capture(
                window,
                'dist/practice-error-feedback-' + label.toLowerCase() + '-light-pc.png',
            ),
        })
        await clickText(window, '取消')
        await visitPractice(window, origin, 'word-basic', 'pronounce')
        await openFeedback(window)
        assert.equal(
            await evaluate(window, () => {
                const dialog = document.querySelector('[data-practice-error-feedback]')
                return (
                    dialog.textContent.includes('woman') &&
                    dialog.textContent.includes('n.妇女；女性；成年女子') &&
                    !dialog.textContent.includes('we read books together')
                )
            }),
            true,
            'feedback context follows the actual word question instead of a design placeholder',
        )
        result.currentQuestionContext = {
            sentence: ['we read books together', '我们一起读书'],
            word: ['woman', 'n.妇女；女性；成年女子'],
        }
        await clickText(window, '取消')
        assert.deepEqual(
            result.businessRequests,
            [],
            'feedback sends no business or upload request',
        )
        assert.deepEqual(
            result.permissionRequests,
            [],
            'feedback requests no microphone or system permission',
        )
        assert.deepEqual(
            result.consoleErrors,
            [],
            'feedback has no hydration/CSP/runtime warning or error',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failureScreenshot = await capture(
                window,
                'dist/practice-error-feedback-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            await restoreNotificationProbe(window)
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            window.webContents.removeListener('console-message', onConsole)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/practice-error-feedback-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runPracticeErrorFeedbackChecks }

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
async function runStandaloneFeedbackSmoke() {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        errorFeedback: [],
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
            resolve(projectRoot, 'dist/practice-error-feedback-runtime-validation.json'),
            JSON.stringify(report, null, 4),
        )
        if (error !== undefined) console.error('Practice error feedback standalone failed:', error)
        else console.log('Practice error feedback standalone passed: Electron and Web')
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
        const index = report.errorFeedback.length
        report.errorFeedback.push({ label, status: 'running' })
        console.log('Practice error feedback ' + label + ' start')
        try {
            report.errorFeedback[index] = await runPracticeErrorFeedbackChecks(
                window,
                origin,
                label,
            )
        } catch (error) {
            report.errorFeedback[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport:
                    'dist/practice-error-feedback-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
        console.log('Practice error feedback ' + label + ' complete')
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Standalone feedback smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (!profile || !isAbsolute(profile))
            throw new Error('Standalone feedback smoke requires absolute DESKTOP_SMOKE_USER_DATA')
        if (resolve(profile) === resolve(app.getPath('userData')))
            throw new Error('Feedback smoke requires an isolated userData profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Feedback smoke must load production englishlearning protocol')
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
            () => finish(new Error('Standalone feedback smoke exceeded its 240 second deadline')),
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
if (isStandaloneEntry) void runStandaloneFeedbackSmoke()
