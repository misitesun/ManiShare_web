const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const allActions = [
    'answer',
    'content',
    'mode',
    'reset',
    'report',
    'draft',
    'settings',
    'fullscreen',
]
const families = [
    ['word', 'word-basic', 'typing', allActions],
    ['sentence', 'sentence-basic', 'translate', allActions],
    ['audio', 'audio-basic', 'typing', allActions],
    ['video', 'video-basic', 'typing', allActions],
    ['picture', 'picture-basic', 'typing', allActions],
    ['typing', 'typing-basic', 'typing', ['content', 'reset', 'draft', 'settings', 'fullscreen']],
    [
        'phonetics',
        'phonetics-basic',
        'pronounce',
        ['content', 'reset', 'draft', 'settings', 'fullscreen'],
    ],
    [
        'guess',
        'guess-basic',
        'spell',
        ['answer', 'mode', 'reset', 'draft', 'settings', 'fullscreen'],
    ],
    ...['audio-reader', 'video-reader', 'picture-reader', 'text-reader'].map((family) => [
        family,
        family,
        'read',
        ['draft', 'settings', 'fullscreen'],
    ]),
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error(
        'Timed out: navigation menu ' + description + ' ' + JSON.stringify(await state(window)),
    )
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

function press(window, keyCode, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    if (keyCode === 'Enter')
        window.webContents.sendInputEvent({ type: 'char', keyCode: '\r', modifiers })
    if (keyCode === 'Space')
        window.webContents.sendInputEvent({ type: 'char', keyCode: ' ', modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
}

async function nativeClick(window, selector) {
    const point = await evaluate(
        window,
        (target) => {
            const bounds = document.querySelector(target).getBoundingClientRect()
            return {
                x: Math.round(bounds.x + bounds.width / 2),
                y: Math.round(bounds.y + bounds.height / 2),
            }
        },
        selector,
    )
    // DOM矩形使用CSS px，Electron鼠标队列使用DIP；只转换测试坐标，不改页面缩放。
    const factor = window.webContents.getZoomFactor()
    const hostPoint = { x: Math.round(point.x * factor), y: Math.round(point.y * factor) }
    window.webContents.sendInputEvent({ type: 'mouseMove', ...hostPoint })
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        button: 'left',
        clickCount: 1,
        ...hostPoint,
    })
    window.webContents.sendInputEvent({
        type: 'mouseUp',
        button: 'left',
        clickCount: 1,
        ...hostPoint,
    })
}

async function visit(window, origin, demo = 'sentence-basic', mode = 'translate') {
    await window.loadURL(
        origin + '/practice/?demo=' + demo + '&mode=' + mode + '&keep=navigation-menu',
    )
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'entry loading and settings complete',
    )
    await settle(window)
}

async function state(window) {
    return evaluate(window, () => {
        const trigger = document.querySelector('[data-dropdown-menu-trigger]')
        const menu = document.querySelector('[data-dropdown-menu]')
        const nav = document.querySelector('[data-practice-navigation]')
        const session = document.querySelector('[data-practice-phase]')
        const bounds = (element) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
            }
        }
        return {
            viewport: { width: innerWidth, height: innerHeight },
            header: bounds(document.querySelector('[data-practice-header]')),
            trigger: bounds(trigger),
            triggerOpen: trigger?.ariaExpanded,
            triggerFocused: document.activeElement === trigger,
            triggerCursor: trigger ? getComputedStyle(trigger).cursor : null,
            wide: bounds(nav?.querySelector('[data-practice-navigation-wide]')),
            wideActions: Array.from(
                nav?.querySelectorAll('[data-practice-navigation-action]') ?? [],
                (button) => ({
                    id: button.dataset.practiceNavigationAction,
                    rect: bounds(button),
                    cursor: getComputedStyle(button).cursor,
                }),
            ),
            menu: bounds(menu),
            highlight: bounds(menu?.querySelector('[data-moving-highlight]')),
            menuOpen: menu?.dataset.dropdownMenuOpen,
            menuInert: menu?.inert,
            menuHidden: menu?.ariaHidden,
            portalInBody: menu?.parentElement === document.body,
            menuOpacity: menu ? Number(getComputedStyle(menu).opacity) : null,
            menuTransition: menu ? getComputedStyle(menu).transitionDuration : null,
            menuTransitionProperty: menu ? getComputedStyle(menu).transitionProperty : null,
            menuScrollHeight: menu?.scrollHeight,
            menuClientHeight: menu?.clientHeight,
            menuScrollTop: menu?.scrollTop,
            activeAction: document.activeElement?.dataset.dropdownMenuAction,
            activeMarkup: document.activeElement?.outerHTML.slice(0, 180),
            activeInert: Boolean(document.activeElement?.closest('[inert]')),
            menuActions: Array.from(
                menu?.querySelectorAll('[role="menuitem"]') ?? [],
                (button) => ({
                    id: button.dataset.dropdownMenuAction,
                    label: button.textContent,
                    expanded: button.ariaExpanded,
                    controls: button.getAttribute('aria-controls'),
                    cursor: getComputedStyle(button).cursor,
                    rect: bounds(button),
                    iconCount: button.querySelectorAll('img').length,
                }),
            ),
            index: session?.dataset.practiceIndex,
            phase: session?.dataset.practicePhase,
            paused: session?.dataset.practicePaused,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            popupCount: document.querySelectorAll('[data-dropdown-menu]').length,
        }
    })
}

async function openMenu(window) {
    await nativeClick(window, '[data-dropdown-menu-trigger]')
    await waitFor(
        window,
        () => {
            const menu = document.querySelector('[data-dropdown-menu]')
            return (
                menu?.dataset.dropdownMenuOpen === 'true' &&
                !menu.inert &&
                Number(getComputedStyle(menu).opacity) === 1 &&
                getComputedStyle(menu).scale === '1'
            )
        },
        'menu opens and fades in',
    )
    const value = await state(window)
    assert.equal(value.triggerOpen, 'true')
    assert.equal(value.portalInBody, true)
    assert.equal(value.triggerCursor, 'pointer')
    assert.ok(value.menu.x >= 11 && value.menu.right <= value.viewport.width - 11)
    assert.ok(value.menu.y >= 11 && value.menu.bottom <= value.viewport.height - 11)
    assert.equal(value.horizontalOverflow, false)
    for (const action of value.menuActions) {
        assert.equal(action.rect.height, 44)
        assert.equal(action.cursor, 'pointer')
        assert.equal(action.iconCount, 1)
    }
    return value
}

async function closed(window, focus = true) {
    await waitFor(
        window,
        () => document.querySelector('[data-dropdown-menu]')?.dataset.dropdownMenuOpen === 'false',
        'menu closes immediately',
    )
    const value = await state(window)
    assert.equal(value.menuInert, true)
    assert.equal(value.menuHidden, 'true')
    if (focus) assert.equal(value.triggerFocused, true)
    return value
}

async function choose(window, action) {
    await nativeClick(window, '[data-dropdown-menu-action="' + action + '"]')
    await closed(window, false)
}

async function capture(window, name) {
    const path = 'dist/practice-navigation-menu-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function modalClose(window) {
    press(window, 'Escape')
    await waitFor(
        window,
        () => !document.querySelector('[data-tld-dialog-layer]'),
        'modal exit completes',
    )
    assert.equal((await state(window)).triggerFocused, true)
}

async function runPracticeNavigationMenuChecks(window, origin, label) {
    const size = window.getContentSize()
    const minimum = window.getMinimumSize()
    const zoom = window.webContents.getZoomFactor()
    const result = {
        label,
        status: 'running',
        families: [],
        responsive: [],
        pageZoom: [],
        businessRequests: [],
        permissionRequests: [],
        limitations: [
            'PC人工视觉；平板/H5仅自动化视口几何和交互，触摸/软键盘/横竖屏与真机视觉待用户验收。',
            '全屏项核对可信点击下的同步用户激活调用，未在隐藏验收窗口切换真实宿主全屏。',
        ],
    }
    const session = window.webContents.session
    const appOrigin = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const pages = new Set(manifest.routes)
    const files = new Set(manifest.files.map((path) => '/' + path))
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
        await visit(window, origin)
        result.wide = await state(window)
        assert.equal(result.wide.trigger.width, 0)
        assert.equal(result.wide.header.height, 72)
        assert.equal(result.wide.wide.right, 1908)
        assert.deepEqual(
            result.wide.wideActions.map((action) => action.id),
            allActions,
        )
        assert.ok(
            result.wide.wideActions.every(
                (action) => action.rect.width > 0 && action.cursor === 'pointer',
            ),
        )
        assert.ok(
            result.wide.wideActions
                .filter((action) => action.id !== 'fullscreen')
                .every((action) => action.rect.height === 28 && action.rect.width === 74),
        )
        result.wideScreenshot = await capture(window, label.toLowerCase() + '-wide-pc')

        for (const width of [1440, 1280, 1279, 1024, 768, 390, 320]) {
            window.setContentSize(width, 900)
            await settle(window)
            const value = await state(window)
            assert.equal(value.viewport.width, width)
            assert.equal(value.horizontalOverflow, false)
            if (width >= 1280) {
                assert.equal(value.trigger.width, 0)
                assert.ok(value.wide.width > 0)
            } else {
                assert.equal(value.trigger.width, 44)
                assert.equal(value.wide.width, 0)
                const open = await openMenu(window)
                assert.deepEqual(
                    open.menuActions.map((action) => action.id),
                    allActions,
                )
                press(window, 'Escape')
                await closed(window)
            }
            result.responsive.push(value)
        }

        window.setContentSize(1024, 768)
        await settle(window)
        await openMenu(window)
        const before = await state(window)
        press(window, 'Down')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'content',
            'down focuses next',
        )
        press(window, 'End')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'fullscreen',
            'End focuses last',
        )
        press(window, 'Down')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'answer',
            'down wraps',
        )
        press(window, 'Up')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'fullscreen',
            'up wraps',
        )
        press(window, 'Home')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'answer',
            'Home focuses first',
        )
        press(window, 'Right', ['shift'])
        const after = await state(window)
        assert.deepEqual(
            [after.index, after.phase, after.paused],
            [before.index, before.phase, before.paused],
            'menu keys do not operate the practice session',
        )
        press(window, 'Escape')
        await closed(window)
        assert.equal((await state(window)).paused, 'false', 'Escape closes only the menu')
        press(window, 'Up')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'fullscreen',
            'ArrowUp from trigger opens last',
        )
        press(window, 'Tab')
        const tab = await closed(window, false)
        assert.equal(tab.activeInert, false)
        assert.equal(tab.triggerFocused, false, 'Tab advances beyond trigger')
        await openMenu(window)
        await nativeClick(window, 'h1')
        await closed(window)
        await openMenu(window)
        await nativeClick(window, '[data-word-slot="0"]')
        await closed(window, false)
        assert.equal(
            await evaluate(window, () =>
                document.activeElement?.matches('[data-practice-answer-input]'),
            ),
            true,
            'outside editor receives focus normally',
        )
        result.keyboard = { before, after, tab }

        await evaluate(window, () => {
            window.navigationMenuClicks = []
            document.addEventListener('click', (event) => {
                const item = event.target.closest?.('[data-dropdown-menu-action]')
                if (item)
                    window.navigationMenuClicks.push({
                        id: item.dataset.dropdownMenuAction,
                        trusted: event.isTrusted,
                    })
            })
        })
        await openMenu(window)
        press(window, 'Enter')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-answer-panel="answer"]')?.ariaHidden ===
                'false',
            'native Enter opens the answer once',
        )
        await closed(window)
        await openMenu(window)
        press(window, 'Space')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-answer-panel="answer"]')?.ariaHidden ===
                'true',
            'native Space hides the answer once',
        )
        await closed(window)
        result.nativeSelection = await evaluate(window, () => window.navigationMenuClicks)
        assert.deepEqual(result.nativeSelection, [
            { id: 'answer', trusted: true },
            { id: 'answer', trusted: true },
        ])

        result.modals = []
        for (const [action, selector] of [
            ['content', '[data-practice-content-dialog]'],
            ['mode', '[data-practice-mode-selector="sentence"]'],
            ['reset', '[role="dialog"]'],
            ['report', '[data-practice-error-feedback]'],
            ['settings', '[role="dialog"] [role="tablist"]'],
        ]) {
            await openMenu(window)
            await choose(window, action)
            await waitFor(
                window,
                (target) => Boolean(document.querySelector(target)),
                action + ' uses its existing dialog',
                selector,
            )
            if (action === 'reset')
                assert.equal(
                    await evaluate(
                        window,
                        () => document.querySelector('[role="dialog"] h2')?.textContent,
                    ),
                    '重置演示',
                )
            result.modals.push({ action, selector, menu: await state(window) })
            await modalClose(window)
        }
        assert.equal((await state(window)).paused, 'false', 'pause stays disabled')

        await openMenu(window)
        await choose(window, 'draft')
        await waitFor(
            window,
            () => {
                const panel = document.querySelector('[data-practice-draft-panel]')
                return (
                    panel &&
                    !panel.inert &&
                    Math.abs(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41) < 0.1
                )
            },
            'draft opens',
        )
        await openMenu(window)
        result.draftLayer = await evaluate(window, () => {
            const row = document.querySelector('[data-dropdown-menu-action="settings"]')
            const rect = row.getBoundingClientRect()
            const draft = document.querySelector('[data-dropdown-menu-action="draft"]')
            return {
                menuOnTop: Boolean(
                    document
                        .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
                        ?.closest('[data-dropdown-menu]'),
                ),
                draftExpanded: draft.ariaExpanded,
                controls: draft.getAttribute('aria-controls'),
            }
        })
        assert.equal(result.draftLayer.menuOnTop, true, 'body Portal stays above the draft surface')
        assert.equal(result.draftLayer.draftExpanded, 'true')
        assert.equal(result.draftLayer.controls, 'practice-chapter-draft')
        await choose(window, 'draft')
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-draft-panel]'),
            'draft toggles closed',
        )

        await evaluate(window, () => {
            window.navigationOriginalFullscreen = document.documentElement.requestFullscreen
            document.documentElement.requestFullscreen = function () {
                window.navigationFullscreenProbe = {
                    calls: (window.navigationFullscreenProbe?.calls ?? 0) + 1,
                    active: navigator.userActivation.isActive,
                }
                return Promise.resolve()
            }
        })
        await openMenu(window)
        await choose(window, 'fullscreen')
        result.fullscreenGesture = await evaluate(window, () => {
            document.documentElement.requestFullscreen = window.navigationOriginalFullscreen
            return window.navigationFullscreenProbe
        })
        assert.deepEqual(result.fullscreenGesture, { calls: 1, active: true })
        assert.match(await evaluate(window, () => location.search), /keep=navigation-menu/)

        result.themes = []
        for (const theme of ['dark', 'light']) {
            await evaluate(
                window,
                (value) => {
                    document.documentElement.dataset.theme = value
                    document.documentElement.style.colorScheme = value
                },
                theme,
            )
            await openMenu(window)
            const point = await evaluate(window, () => {
                const rect = document
                    .querySelector('[data-dropdown-menu-action="settings"]')
                    .getBoundingClientRect()
                return {
                    x: Math.round(rect.x + rect.width / 2),
                    y: Math.round(rect.y + rect.height / 2),
                }
            })
            window.webContents.sendInputEvent({ type: 'mouseMove', ...point })
            await waitFor(
                window,
                () => {
                    const menu = document.querySelector('[data-dropdown-menu]')
                    const target = menu
                        ?.querySelector('[data-dropdown-menu-action="settings"]')
                        ?.getBoundingClientRect()
                    const highlight = menu
                        ?.querySelector('[data-moving-highlight]')
                        ?.getBoundingClientRect()
                    return Boolean(
                        target &&
                        highlight &&
                        Math.abs(target.y - highlight.y) < 0.2 &&
                        Math.abs(target.height - highlight.height) < 0.2,
                    )
                },
                'moving highlight settles on hovered settings item',
            )
            const style = await evaluate(window, () => {
                const menu = document.querySelector('[data-dropdown-menu]')
                const row = menu.querySelector('[data-dropdown-menu-action="settings"]')
                const highlight = menu.querySelector('[data-moving-highlight]')
                const target = row.getBoundingClientRect()
                const actual = highlight?.getBoundingClientRect()
                return {
                    background: getComputedStyle(menu).backgroundColor,
                    textColor: getComputedStyle(row).color,
                    textSize: getComputedStyle(row).fontSize,
                    highlightZ: highlight ? getComputedStyle(highlight).zIndex : null,
                    contentZ: getComputedStyle(row.firstElementChild).zIndex,
                    aligned:
                        actual &&
                        Math.abs(target.y - actual.y) < 0.2 &&
                        Math.abs(target.height - actual.height) < 0.2,
                }
            })
            assert.equal(style.aligned, true)
            assert.ok(Number(style.contentZ) > Number(style.highlightZ))
            result.themes.push({
                theme,
                state: await state(window),
                style,
                screenshot: await capture(
                    window,
                    label.toLowerCase() + '-' + theme + '-compact-pc',
                ),
            })
            press(window, 'Escape')
            await closed(window)
        }
        assert.notEqual(result.themes[0].style.background, result.themes[1].style.background)

        window.setContentSize(390, 360)
        await settle(window)
        await openMenu(window)
        press(window, 'End')
        await waitFor(
            window,
            () => document.activeElement?.dataset.dropdownMenuAction === 'fullscreen',
            'short viewport last action',
        )
        result.shortViewport = await state(window)
        assert.ok(result.shortViewport.menuScrollHeight > result.shortViewport.menuClientHeight)
        assert.ok(result.shortViewport.menuScrollTop > 0)
        assert.ok(
            result.shortViewport.menuActions.at(-1).rect.bottom <= result.shortViewport.menu.bottom,
        )
        press(window, 'Escape')
        await closed(window)

        for (const factor of [1.25, 1.5, 2]) {
            window.setContentSize(1440, 900)
            window.webContents.setZoomFactor(factor)
            await settle(window)
            const value = await openMenu(window)
            assert.equal(window.webContents.getZoomFactor(), factor)
            result.pageZoom.push({ factor, value })
            press(window, 'Escape')
            await closed(window)
        }
        window.webContents.setZoomFactor(1)
        window.setContentSize(1024, 768)
        await settle(window)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        const reduced = await openMenu(window)
        assert.equal(reduced.menuTransitionProperty, 'none')
        assert.ok(
            reduced.menuTransition
                .split(',')
                .every((duration) => Number.parseFloat(duration) <= 0.00001),
            'reduced motion follows the global 0.01ms ceiling',
        )
        result.reduced = reduced
        window.setContentSize(1280, 900)
        await waitFor(
            window,
            () =>
                document.querySelector('[data-dropdown-menu]')?.dataset.dropdownMenuOpen ===
                'false',
            'growing past xl closes hidden menu',
        )
        result.resizeClose = await state(window)
        assert.equal(result.resizeClose.activeInert, false)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [],
        })

        window.setContentSize(1024, 768)
        for (const [family, demo, mode, expected] of families) {
            await visit(window, origin, demo, mode)
            const value = await openMenu(window)
            assert.deepEqual(
                value.menuActions.map((action) => action.id),
                expected,
                family + ' action whitelist',
            )
            assert.equal(value.popupCount, 1, 'old portal is cleaned up after mode/family changes')
            result.families.push({
                family,
                mode,
                actions: value.menuActions.map((action) => action.id),
            })
            press(window, 'Escape')
            await closed(window)
        }
        await openMenu(window)
        await window.loadURL(origin + '/practice/')
        await waitFor(
            window,
            () => document.querySelector('section h2')?.textContent === '单词游戏',
            'catalog ready',
        )
        assert.equal(
            await evaluate(window, () => document.querySelectorAll('[data-dropdown-menu]').length),
            0,
            'leaving removes portal and obsolete menu',
        )
        assert.deepEqual(result.businessRequests, [], 'menu adds zero business requests')
        assert.deepEqual(result.permissionRequests, [], 'menu adds zero permissions')
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
        window.webContents.setZoomFactor(zoom)
        window.setMinimumSize(...minimum)
        window.setContentSize(...size)
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        writeFileSync(
            resolve('dist/practice-navigation-menu-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticeNavigationMenuChecks }

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
async function runStandalonePracticeNavigationMenuSmoke() {
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
            resolve(projectRoot, 'dist/practice-navigation-menu-runtime-validation.json'),
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
        if (error === undefined) console.log('Practice navigation menu passed: Electron and Web')
        else console.error('Practice navigation menu failed:', error)
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
        console.log('Practice navigation menu ' + label + ' start')
        try {
            report.environments[index] = await runPracticeNavigationMenuChecks(
                window,
                origin,
                label,
            )
            console.log('Practice navigation menu ' + label + ' complete')
        } catch (error) {
            report.environments[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport:
                    'dist/practice-navigation-menu-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Practice navigation menu smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (
            !profile ||
            !isAbsolute(profile) ||
            resolve(profile) === resolve(app.getPath('userData'))
        )
            throw new Error(
                'Practice navigation menu smoke requires an isolated absolute userData profile',
            )
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Practice navigation menu smoke must use the production protocol')
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
            () => finish(new Error('Practice navigation menu smoke exceeded 240 seconds')),
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
if (isStandaloneEntry) void runStandalonePracticeNavigationMenuSmoke()
