const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const activeDocumentFixture = process.env.SMOKE_CONTENT_ACTIVE_FIXTURE === '1'

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
        dialog: document.querySelector('[data-practice-content-dialog]')?.outerHTML.slice(0, 4500),
        active: document.activeElement?.outerHTML.slice(0, 350),
        index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
    }))
    throw new Error('Timed out: practice content ' + description + ' ' + JSON.stringify(state))
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
    await waitFor(
        window,
        () => {
            const tabs = document.querySelector('[data-practice-content-dialog] [role="group"]')
            if (!tabs) return true
            const indicator = tabs.querySelector('div[aria-hidden="true"]:empty')
            const active = tabs.querySelector('[aria-pressed="true"]')
            if (!indicator || !active) return false
            const target = active.getBoundingClientRect()
            const actual = indicator.getBoundingClientRect()
            return (
                Math.abs(target.x - actual.x) < 0.05 && Math.abs(target.width - actual.width) < 0.05
            )
        },
        'segmented highlight finishes on the active slot',
    )
    await evaluate(
        window,
        () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
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

async function sendKey(window, keyCode, character) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    if (character) window.webContents.sendInputEvent({ type: 'char', keyCode: character })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(60)
}

async function capture(window, path) {
    // 隐藏宿主连续开关后可能只复制脏区；通过原生resize促成完整重绘，再回到基准视口。
    const [width, height] = window.getContentSize()
    try {
        window.setContentSize(width + 1, height)
        await settle(window)
    } finally {
        window.setContentSize(width, height)
    }
    await settle(window)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    const frame = await evaluate(window, () => {
        const dialog = document
            .querySelector('[data-practice-content-dialog]')
            ?.closest('[role="dialog"]')
        if (!dialog) return null
        const rect = dialog.parentElement.getBoundingClientRect()
        return {
            x: Math.floor(rect.x),
            y: Math.floor(rect.y),
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height),
        }
    })
    if (frame) {
        await settle(window)
        writeFileSync(
            resolve(path.replace(/\.png$/, '-dialog.png')),
            (await window.webContents.capturePage(frame, { stayHidden: true })).toPNG(),
        )
    }
    return path
}

async function visitPractice(window, origin, demo = 'sentence-basic', mode = 'translate') {
    await settle(window)
    await window.loadURL(
        origin + '/practice/?demo=' + demo + '&mode=' + mode + '&keep=content-smoke',
    )
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice hydrates',
    )
    await settle(window)
}

async function openContent(window) {
    await click(window, '[data-practice-navigation-action="content"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-content-dialog]')),
        'content opens',
    )
    await settle(window)
}

async function closeContent(window, method = 'close') {
    if (method === 'close') await click(window, '[aria-label="关闭练习内容"]')
    else if (method === 'escape') await sendKey(window, 'Escape')
    else {
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
        () => !document.querySelector('[data-practice-content-dialog]'),
        method + ' unmounts',
    )
    assert.equal(
        await evaluate(
            window,
            () =>
                document.activeElement ===
                document.querySelector('[data-practice-navigation-action="content"]'),
        ),
        true,
        method + ' restores trigger focus',
    )
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[role="dialog"]'))),
        false,
        'underlying exercise command did not open another dialog',
    )
}

async function chooseDisplay(window, index, expected) {
    await evaluate(
        window,
        (target) =>
            document
                .querySelectorAll('[data-practice-content-dialog] [aria-pressed]')
                [target].click(),
        index,
    )
    await waitFor(
        window,
        (display) =>
            document.querySelector('[data-practice-content-dialog]')?.dataset.display === display,
        'display changes',
        expected,
    )
    const languages = await evaluate(window, () =>
        Array.from(document.querySelectorAll('[data-practice-content-question]'), (button) =>
            Array.from(button.querySelectorAll('[lang]'), (line) => line.lang),
        ),
    )
    const expectedLanguages =
        expected === 'chinese' ? ['zh-CN'] : expected === 'english' ? ['en'] : ['en', 'zh-CN']
    assert.ok(languages.length > 0)
    languages.forEach((actual) => assert.deepEqual(actual, expectedLanguages))
    await settle(window)
    const alignment = await evaluate(window, () =>
        Array.from(document.querySelectorAll('[data-practice-content-question]'), (button) => {
            const card = button.getBoundingClientRect()
            const lines = Array.from(button.querySelectorAll('[lang]'), (line) =>
                line.getBoundingClientRect(),
            )
            return {
                centered: Math.abs(lines[0].y + lines[0].height / 2 - (card.y + card.height / 2)),
                bilingualOrder: lines.length === 2 && lines[0].bottom < lines[1].y,
                leftAligned: lines.length < 2 || Math.abs(lines[0].x - lines[1].x) < 0.1,
            }
        }),
    )
    alignment.forEach((item) => {
        if (expected === 'bilingual') assert.equal(item.bilingualOrder, true)
        else assert.ok(item.centered < 0.1, expected + ' text is vertically centered')
        assert.equal(item.leftAligned, true)
    })
}

async function measureContent(window) {
    return evaluate(window, () => {
        const section = document.querySelector('[data-practice-content-dialog]')
        const dialog = section.closest('[role="dialog"]')
        const tabs = section.querySelector('[role="group"]')
        const list = section.querySelector('[data-practice-content-list]')
        const first = list.querySelector('button')
        const rect = (element) => {
            const r = element.getBoundingClientRect()
            return {
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                right: r.right,
                bottom: r.bottom,
            }
        }
        const text = (element) => {
            const s = getComputedStyle(element)
            return {
                size: s.fontSize,
                lineHeight: s.lineHeight,
                weight: s.fontWeight,
                spacing: s.letterSpacing,
                color: s.color,
            }
        }
        return {
            viewport: [innerWidth, innerHeight],
            zoom: devicePixelRatio,
            frame: rect(dialog.parentElement),
            title: { ...rect(section.querySelector('h3')), ...text(section.querySelector('h3')) },
            tabs: {
                ...rect(tabs),
                ...text(tabs.querySelector('button')),
                background: getComputedStyle(tabs).backgroundColor,
            },
            list: {
                ...rect(list),
                scrollHeight: list.scrollHeight,
                clientHeight: list.clientHeight,
                scrollWidth: list.scrollWidth,
                clientWidth: list.clientWidth,
            },
            card: rect(first),
            mainText: {
                ...text(first.querySelector('[lang]')),
                ...rect(first.querySelector('[lang]')),
            },
            indicator: {
                ...rect(tabs.querySelector('div[aria-hidden="true"]:empty')),
                active: rect(tabs.querySelector('[aria-pressed="true"]')),
            },
            secondaryText: first.querySelectorAll('[lang]')[1]
                ? text(first.querySelectorAll('[lang]')[1])
                : null,
            icons: Array.from(section.querySelectorAll('img'), (img) => ({
                source: img.getAttribute('src'),
                natural: [img.naturalWidth, img.naturalHeight],
                ...rect(img),
            })),
            pointerCursors: Array.from(
                section.querySelectorAll('button'),
                (button) => getComputedStyle(button).cursor,
            ),
            documentOverflow:
                document.documentElement.scrollWidth > document.documentElement.clientWidth,
            scrollAncestors: [section, section.parentElement, dialog].map(
                (element) => element.scrollTop,
            ),
        }
    })
}

function near(value, expected, description, tolerance = 0.1) {
    assert.ok(
        Math.abs(value - expected) <= tolerance,
        description + ': expected ' + expected + ', got ' + value,
    )
}

function assertReference(snapshot) {
    const { frame, tabs, list, card, title } = snapshot
    for (const [key, value] of Object.entries({ x: 617, y: 127, width: 686, height: 827 }))
        near(frame[key], value, 'frame ' + key)
    for (const [key, value] of Object.entries({ x: 789, y: 209, width: 342, height: 46 }))
        near(tabs[key], value, 'tabs ' + key)
    for (const [key, value] of Object.entries({ x: 641, y: 279, width: 638, height: 651 }))
        near(list[key], value, 'list ' + key)
    near(card.width, 638, 'card width')
    near(card.height, 81, 'card height')
    assert.deepEqual(
        [title.size, title.lineHeight, title.weight, title.spacing],
        ['24px', '34px', '500', 'normal'],
    )
    assert.deepEqual([tabs.size, tabs.lineHeight, tabs.weight], ['18px', '25px', '400'])
    assert.deepEqual([snapshot.mainText.size, snapshot.mainText.lineHeight], ['18px', '25px'])
    assert.deepEqual(
        [snapshot.secondaryText.size, snapshot.secondaryText.lineHeight],
        ['16px', '22px'],
    )
    snapshot.icons.forEach((icon) => {
        assert.deepEqual(icon.natural, [24, 24])
        near(icon.width, 24, 'static icon width')
        near(icon.height, 24, 'static icon height')
        assert.ok(icon.source.startsWith('/_next/static/'))
    })
    assert.ok(snapshot.pointerCursors.every((cursor) => cursor === 'pointer'))
}

async function stressListLayout(window) {
    // 正式演示仅两题；临时扩容只验证生产CSS滚动，不伪装为真实课程数据或条目交互测试。
    const result = await evaluate(window, async () => {
        const section = document.querySelector('[data-practice-content-dialog]')
        const list = section.querySelector('[data-practice-content-list]')
        const title = section.querySelector('h3')
        const tabs = section.querySelector('[role="group"]')
        const initialTitleY = title.getBoundingClientRect().y
        const initialTabsY = tabs.getBoundingClientRect().y
        const originalText = list.querySelector('[lang]').textContent
        list.querySelector('[lang]').textContent = 'LongUnbrokenStudyContent'.repeat(40)
        const wrapped = list.scrollWidth <= list.clientWidth
        list.querySelector('[lang]').textContent = originalText
        const clones = []
        for (let index = list.children.length; index < 60; index++) {
            const clone = list.children[0].cloneNode(true)
            clone.dataset.contentLayoutFixture = String(index)
            clone.querySelector('button').removeAttribute('aria-current')
            list.appendChild(clone)
            clones.push(clone)
        }
        list.scrollTop = list.scrollHeight
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
        const last = list.lastElementChild.getBoundingClientRect()
        const boundary = list.getBoundingClientRect()
        const output = {
            fixtureKind: 'temporary production DOM expansion to 60 rows',
            scrollTop: list.scrollTop,
            scrollHeight: list.scrollHeight,
            clientHeight: list.clientHeight,
            titleY: title.getBoundingClientRect().y,
            initialTitleY,
            tabsY: tabs.getBoundingClientRect().y,
            initialTabsY,
            lastVisible: last.bottom <= boundary.bottom + 0.1 && last.top >= boundary.top,
            ancestorsAtTop: [
                section,
                section.parentElement,
                section.closest('[role="dialog"]'),
                document.scrollingElement,
            ].every((element) => element.scrollTop === 0),
            longUnbrokenTextWraps: wrapped,
        }
        clones.forEach((clone) => clone.remove())
        list.scrollTop = 0
        return output
    })
    assert.ok(result.scrollHeight > result.clientHeight && result.scrollTop > 0)
    near(result.titleY, result.initialTitleY, 'header remains fixed')
    near(result.tabsY, result.initialTabsY, 'display controls remain fixed')
    assert.equal(result.lastVisible, true)
    assert.equal(result.ancestorsAtTop, true)
    assert.equal(result.longUnbrokenTextWraps, true)
    return result
}

async function assertReflow(window, description) {
    await settle(window)
    const snapshot = await measureContent(window)
    assert.equal(
        snapshot.documentOverflow,
        false,
        description + ' document has no horizontal overflow',
    )
    assert.ok(
        snapshot.frame.x >= 11 && snapshot.frame.right <= snapshot.viewport[0] - 11,
        description + ' horizontal safe area',
    )
    assert.ok(
        snapshot.frame.y >= 11 && snapshot.frame.bottom <= snapshot.viewport[1] - 11,
        description + ' vertical safe area',
    )
    assert.ok(snapshot.list.clientHeight > 24, description + ' list remains usable')
    assert.ok(
        snapshot.list.scrollWidth <= snapshot.list.clientWidth,
        description + ' no list horizontal overflow',
    )
    assert.deepEqual(snapshot.scrollAncestors, [0, 0, 0])
    return { snapshot, scrolling: await stressListLayout(window) }
}

async function runPracticeContentChecks(window, origin, label) {
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
        focusEnvironment: activeDocumentFixture
            ? 'isolated active-document fixture'
            : 'native foreground window',
        status: 'running',
        supportedModes: [],
        unaffectedFamilies: [],
        themes: [],
        pcReflow: [],
        pageZoom: [],
        businessRequests: [],
        permissionRequests: [],
        consoleErrors: [],
        limitations: [
            '长列表结合60题真实组件SSR与生产DOM临时扩容布局检查；正式演示数据仍只有两题，不代表真实课程接口或大量数据性能验收',
            'PC验收不替代平板/H5视觉与真机验收',
            ...(activeDocumentFixture
                ? [
                      '本次以active文档夹具隔离并行自动暂停功能；不作为真实窗口焦点或后台暂停验收，实际可见浏览器另行复核居中',
                  ]
                : []),
        ],
    }
    const onConsole = (event) => {
        if (event.level === 'warning' || event.level === 'error')
            result.consoleErrors.push(event.message)
    }
    window.webContents.on('console-message', onConsole)
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.webContentsId > 0 && details.webContentsId !== window.webContents.id) {
            callback({ requestHeaders: details.requestHeaders })
            return
        }
        const url = new URL(details.url)
        const same = url.protocol === application.protocol && url.host === application.host
        const page = isExportedPageRequest(details, origin, exportedPages)
        const asset =
            same && ['GET', 'HEAD'].includes(details.method) && exportedFiles.has(url.pathname)
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
    let originalTheme
    try {
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await setTheme(window, origin, 'dark')
        for (const [demo, modes] of [
            ['word-basic', ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral']],
            [
                'sentence-basic',
                ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral'],
            ],
        ]) {
            for (const mode of modes) {
                await visitPractice(window, origin, demo, mode)
                await openContent(window)
                assert.equal(
                    await evaluate(
                        window,
                        () =>
                            document.querySelector('[data-practice-content-dialog]').dataset
                                .display,
                    ),
                    'chinese',
                )
                await chooseDisplay(window, 0, 'chinese')
                await chooseDisplay(window, 1, 'english')
                await chooseDisplay(window, 2, 'bilingual')
                await closeContent(window)
                result.supportedModes.push({
                    demo,
                    mode,
                    defaultChinese: true,
                    threeDisplays: true,
                    singleLanguageVerticallyCentered: true,
                })
            }
        }
        await visitPractice(window, origin)
        await openContent(window)
        result.screenshots = [
            await capture(
                window,
                'dist/practice-content-' + label.toLowerCase() + '-chinese-pc.png',
            ),
        ]
        await chooseDisplay(window, 2, 'bilingual')
        result.reference = await measureContent(window)
        assertReference(result.reference)
        result.screenshots.push(
            await capture(
                window,
                'dist/practice-content-' + label.toLowerCase() + '-bilingual-dark-pc.png',
            ),
        )
        result.longList = await stressListLayout(window)
        // Tab焦点循环和练习快捷键隔离使用真实原生按键。
        await evaluate(window, () =>
            document.querySelector('[data-practice-content-question="1"]').focus(),
        )
        await sendKey(window, 'Tab')
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document
                        .querySelector('[data-practice-content-dialog]')
                        .contains(document.activeElement),
                ),
            ),
            true,
        )
        const originalIndex = await evaluate(
            window,
            () => document.querySelector('[data-practice-index]').dataset.practiceIndex,
        )
        await evaluate(window, () => document.querySelector('[role="dialog"]').focus())
        await sendKey(window, 'Space', ' ')
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-practice-index]').dataset.practiceIndex,
            ),
            originalIndex,
        )
        for (const method of ['close', 'escape', 'backdrop']) {
            await closeContent(window, method)
            await openContent(window)
            assert.equal(
                await evaluate(
                    window,
                    () => document.querySelector('[data-practice-content-dialog]').dataset.display,
                ),
                'chinese',
                method + ' reopens Chinese',
            )
            await chooseDisplay(window, 2, 'bilingual')
        }
        result.closeResetAndFocus = true
        // 原生Enter操作筛选，并验证条目动作走现有切题链。
        await evaluate(window, () =>
            document.querySelectorAll('[data-practice-content-dialog] [aria-pressed]')[1].focus(),
        )
        await sendKey(window, 'Return', '\r')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-content-dialog]').dataset.display ===
                'english',
            'native Enter changes display',
        )
        await click(window, '[data-practice-content-question="1"]')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1' &&
                !document.querySelector('[data-practice-content-dialog]'),
            'row selects actual second question',
        )
        assert.equal(
            await evaluate(window, () => new URL(location.href).searchParams.get('keep')),
            'content-smoke',
        )
        await openContent(window)
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-practice-content-question="1"]')
                    .getAttribute('aria-current'),
            ),
            'true',
        )
        await click(window, '[data-practice-content-question="1"]')
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-content-dialog]'),
            'current question click closes',
        )
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-practice-index]').dataset.practiceIndex,
            ),
            '1',
        )
        result.rowSelectionAndCurrentQuestion = true
        for (const theme of ['light', 'dark']) {
            await setTheme(window, origin, theme)
            await visitPractice(window, origin)
            await openContent(window)
            await chooseDisplay(window, 2, 'bilingual')
            result.themes.push({ theme, measured: await measureContent(window) })
            result.screenshots.push(
                await capture(
                    window,
                    'dist/practice-content-' +
                        label.toLowerCase() +
                        '-bilingual-' +
                        theme +
                        '-pc.png',
                ),
            )
            await closeContent(window)
        }
        await openContent(window)
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            result.pcReflow.push({ width, measured: await assertReflow(window, 'PC ' + width) })
        }
        window.setContentSize(1920, 1080)
        for (const zoom of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(zoom)
            result.pageZoom.push({ zoom, measured: await assertReflow(window, 'zoom ' + zoom) })
        }
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        await closeContent(window)
        for (const [demo, mode] of [
            ['audio-basic', 'read'],
            ['video-basic', 'check'],
            ['picture-basic', 'translate'],
            ['typing-basic', 'typing'],
            ['phonetics-basic', 'pronounce'],
        ]) {
            await visitPractice(window, origin, demo, mode)
            await click(window, '[data-practice-navigation-action="content"]')
            await waitFor(
                window,
                () => Boolean(document.querySelector('[role="dialog"]')),
                'old content opens',
            )
            await settle(window)
            assert.equal(
                await evaluate(
                    window,
                    () =>
                        document.querySelector('[data-practice-content-dialog]') === null &&
                        document.querySelector('[role="dialog"]').textContent.includes('学习内容'),
                ),
                true,
                demo + ' retains original dialog',
            )
            await sendKey(window, 'Escape')
            await waitFor(
                window,
                () => !document.querySelector('[role="dialog"]'),
                'old dialog closes',
            )
            result.unaffectedFamilies.push(demo)
        }
        assert.deepEqual(result.businessRequests, [], 'zero business requests')
        assert.deepEqual(result.permissionRequests, [], 'zero permission requests')
        assert.deepEqual(result.consoleErrors, [], 'zero hydration/CSP/runtime warnings or errors')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failureScreenshot = await capture(
                window,
                'dist/practice-content-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        window.webContents.removeListener('console-message', onConsole)
        if (originalTheme === 'dark' || originalTheme === 'light')
            await setTheme(window, origin, originalTheme)
        window.webContents.setZoomFactor(priorZoom)
        window.setContentSize(...priorSize)
        writeFileSync(
            resolve('dist/practice-content-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticeContentChecks }

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
async function runStandaloneContentSmoke() {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        contentDialog: [],
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
            resolve(projectRoot, 'dist/practice-content-runtime-validation.json'),
            JSON.stringify(report, null, 4),
        )
        if (error !== undefined) console.error('Practice content standalone failed:', error)
        else console.log('Practice content standalone passed: Electron and Web')
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
        const index = report.contentDialog.length
        report.contentDialog.push({ label, status: 'running' })
        console.log('Practice content ' + label + ' start')
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
            report.contentDialog[index] = await runPracticeContentChecks(window, origin, label)
        } catch (error) {
            report.contentDialog[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport: 'dist/practice-content-' + label.toLowerCase() + '-validation.json',
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
        console.log('Practice content ' + label + ' complete')
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
if (isStandaloneEntry) void runStandaloneContentSmoke()
