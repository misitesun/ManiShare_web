const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

// Independent screenshot requirements; do not import production navigation output as expected data.
const completeActions = [
    'answer',
    'content',
    'mode',
    'reset',
    'report',
    'draft',
    'settings',
    'fullscreen',
]
const focusedActions = ['content', 'reset', 'draft', 'settings', 'fullscreen']
const guessActions = ['answer', 'mode', 'reset', 'draft', 'settings', 'fullscreen']
const readerActions = ['draft', 'settings', 'fullscreen']
const sentenceModes = ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral']
const families = [
    {
        family: 'word',
        demo: 'word-basic',
        modes: ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral'],
        actions: completeActions,
    },
    { family: 'sentence', demo: 'sentence-basic', modes: sentenceModes, actions: completeActions },
    { family: 'audio', demo: 'audio-basic', modes: sentenceModes, actions: completeActions },
    {
        family: 'video',
        demo: 'video-basic',
        modes: ['listen', 'check', 'translate', 'blocks', 'typing', 'oral'],
        actions: completeActions,
    },
    {
        family: 'picture',
        demo: 'picture-basic',
        modes: ['listen', 'translate', 'typing', 'oral'],
        actions: completeActions,
    },
    { family: 'typing', demo: 'typing-basic', modes: ['typing'], actions: focusedActions },
    {
        family: 'phonetics',
        demo: 'phonetics-basic',
        modes: ['pronounce', 'oral'],
        actions: focusedActions,
    },
    {
        family: 'guess',
        demo: 'guess-basic',
        modes: ['guess', 'read', 'spell'],
        actions: guessActions,
    },
    ...['video-reader', 'audio-reader', 'picture-reader', 'text-reader'].map((family) => ({
        family,
        demo: family,
        modes: ['read'],
        actions: readerActions,
    })),
]
const actionLabels = {
    answer: '答案',
    content: '内容',
    mode: '模式',
    pause: '暂停',
    reset: '重置',
    report: '报错',
    draft: '草稿',
    settings: '设置',
    fullscreen: '切换全屏',
}

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
    throw new Error('Timed out: practice navigation ' + description)
}

async function imagesReady(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every(
                (image) =>
                    image.complete && image.naturalWidth > 0 && image.currentSrc === image.src,
            ),
        'current images ready',
    )
}

async function beforeNavigation(window, waitForResources) {
    await imagesReady(window)
    if (typeof waitForResources === 'function') await waitForResources(window)
}

async function visit(window, origin, configuration, mode, waitForResources) {
    await beforeNavigation(window, waitForResources)
    await window.loadURL(
        origin +
            '/practice/?demo=' +
            configuration.demo +
            '&mode=' +
            mode +
            '&keep=navigation-smoke',
    )
    await waitFor(
        window,
        (family, expectedMode) =>
            document.querySelector('main[data-toolbar-ready="true"]') !== null &&
            document.querySelector('[data-practice-navigation="' + family + '"]') !== null &&
            new URLSearchParams(location.search).get('mode') === expectedMode,
        'mode hydrated ' + configuration.family + ':' + mode,
        configuration.family,
        mode,
    )
    await imagesReady(window)
}

async function navigationSnapshot(window) {
    return evaluate(window, () => {
        const navigation = document.querySelector('[data-practice-navigation]')
        const wide = navigation?.querySelector('[data-practice-navigation-wide]')
        const more = navigation?.querySelector('[data-dropdown-menu-trigger]')
        const compact = (more?.getClientRects().length ?? 0) > 0
        const header = document.querySelector('[data-practice-header]')
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
                gap: style.gap,
                marginLeft: style.marginLeft,
                borderRadius: style.borderRadius,
            }
        }
        return {
            family: navigation?.getAttribute('data-practice-navigation'),
            theme: document.documentElement.dataset.theme,
            viewport: {
                width: innerWidth,
                height: innerHeight,
                clientWidth: document.documentElement.clientWidth,
                scrollbarWidth: innerWidth - document.documentElement.clientWidth,
            },
            header: box(header),
            presentation: compact ? 'compact' : 'wide',
            navigation: box(compact ? navigation : wide),
            more: more
                ? {
                      visible: more.getClientRects().length > 0,
                      label: more.ariaLabel,
                      popup: more.getAttribute('aria-haspopup'),
                      box: box(more),
                      cursor: getComputedStyle(more).cursor,
                  }
                : null,
            menuActions: Array.from(
                document.querySelectorAll('[data-dropdown-menu-action]'),
                (button) => ({
                    action: button.getAttribute('data-dropdown-menu-action'),
                    label: button.textContent.trim(),
                }),
            ),
            buttons: Array.from(
                navigation?.querySelectorAll('[data-practice-navigation-action]') ?? [],
            ).map((button) => ({
                action: button.getAttribute('data-practice-navigation-action'),
                label: button.getAttribute('aria-label'),
                text: button.textContent.trim(),
                visible: button.getClientRects().length > 0,
                disabled: button.disabled,
                tabIndex: button.tabIndex,
                cursor: getComputedStyle(button).cursor,
                box: box(button),
                icon: box(button.querySelector('img')),
            })),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            headerOverflow: header ? header.scrollWidth > header.clientWidth + 1 : true,
            navigationOverflow: navigation
                ? navigation.getBoundingClientRect().right > innerWidth + 1
                : true,
            brokenImages: Array.from(document.images)
                .filter((image) => !image.complete || image.naturalWidth === 0)
                .map((image) => image.src),
        }
    })
}

async function assertActions(window, configuration) {
    await waitFor(
        window,
        () => {
            const trigger = document.querySelector(
                '[data-practice-navigation] [data-dropdown-menu-trigger]',
            )
            return (
                (trigger?.getClientRects().length ?? 0) === 0 ||
                Boolean(document.querySelector('[data-dropdown-menu]'))
            )
        },
        'responsive menu Portal mounts after hydration',
    )
    const snapshot = await navigationSnapshot(window)
    assert.equal(snapshot.family, configuration.family)
    assert.deepEqual(
        snapshot.buttons.map((button) => button.action),
        configuration.actions,
        configuration.family + ' exact action order and omitted actions',
    )
    assert.deepEqual(
        snapshot.buttons.map((button) => button.label),
        configuration.actions.map((action) => actionLabels[action]),
    )
    for (const button of snapshot.buttons) {
        assert.equal(button.visible, snapshot.presentation === 'wide')
        assert.equal(button.disabled, false)
        assert.ok(button.tabIndex >= 0)
        assert.equal(button.cursor, 'pointer')
        assert.equal(button.text, button.action === 'fullscreen' ? '' : actionLabels[button.action])
    }
    if (snapshot.presentation === 'compact') {
        assert.equal(snapshot.more.visible, true)
        assert.equal(snapshot.more.label, '更多练习操作')
        assert.equal(snapshot.more.popup, 'menu')
        assert.equal(snapshot.more.cursor, 'pointer')
        assert.equal(snapshot.more.box.width, 44)
        assert.equal(snapshot.more.box.height, 44)
        assert.deepEqual(
            snapshot.menuActions.map((item) => item.action),
            configuration.actions,
        )
        assert.deepEqual(
            snapshot.menuActions.map((item) => item.label),
            configuration.actions.map((action) => actionLabels[action]),
        )
    } else assert.equal(snapshot.more.visible, false)
    assert.deepEqual(snapshot.brokenImages, [])
    assert.equal(snapshot.horizontalOverflow, false)
    assert.equal(snapshot.headerOverflow, false)
    assert.equal(snapshot.navigationOverflow, false)
    return snapshot
}

function near(value, expected, message) {
    assert.ok(
        Math.abs(value - expected) <= 1,
        message + ': expected ' + expected + ', received ' + value,
    )
}

function assertReference(snapshot) {
    near(snapshot.header.height, 72, 'header height')
    const closeToRight = snapshot.family === 'guess' || snapshot.family.endsWith('-reader')
    near(
        snapshot.navigation.x + snapshot.navigation.width,
        snapshot.header.x + snapshot.header.width - (closeToRight ? 10 : 12),
        'navigation right edge',
    )
    const expectedWidth =
        (snapshot.buttons.length - 1) * 74 + 30 + (snapshot.buttons.length - 1) * 16 + 2
    near(snapshot.navigation.width, expectedWidth, 'navigation group width')
    near(snapshot.navigation.y, 21, 'navigation top')
    near(snapshot.navigation.height, 30, 'navigation height')
    assert.equal(snapshot.navigation.gap, '16px')
    for (let index = 0; index < snapshot.buttons.length; index++) {
        const button = snapshot.buttons[index]
        if (button.action === 'fullscreen') {
            near(button.box.height, 30, 'fullscreen height')
            near(button.box.y, 21, 'fullscreen top')
            near(button.box.width, 30, 'fullscreen width')
            near(button.icon.width, 30, 'fullscreen icon width')
            near(button.icon.height, 30, 'fullscreen icon height')
            assert.equal(button.box.marginLeft, '2px')
        } else {
            near(button.box.height, 28, button.action + ' current implemented height')
            near(button.box.y, 22, button.action + ' current implemented top')
            near(button.box.width, 74, button.action + ' width')
            near(button.icon.width, 18, button.action + ' icon width')
            near(button.icon.height, 18, button.action + ' icon height')
            assert.equal(button.box.fontSize, '14px')
            assert.equal(button.box.lineHeight, '20px')
            assert.equal(button.box.fontWeight, '400')
            assert.equal(button.box.gap, '5px')
        }
        if (index > 0) {
            const previous = snapshot.buttons[index - 1]
            near(
                button.box.x - previous.box.x - previous.box.width,
                button.action === 'fullscreen' ? 18 : 16,
                'navigation spacing before ' + button.action,
            )
        }
    }
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (!button || button.matches(':disabled') || button.closest('[inert]'))
                throw new Error('Missing enabled navigation action: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
}

async function closeDialog(window) {
    await imagesReady(window)
    const selector = await evaluate(window, () => {
        for (const name of ['关闭对话框', '关闭模式选择', '关闭暂停提示并继续游戏']) {
            const candidate = '[role="dialog"] button[aria-label="' + name + '"]'
            if (document.querySelector(candidate)) return candidate
        }
        throw new Error('Navigation dialog has neither known close action')
    })
    await click(window, selector)
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'dialog closes')
}

async function openAction(window, action) {
    await click(window, '[data-practice-navigation-action="' + action + '"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        action + ' opens its existing dialog',
    )
    await imagesReady(window)
}

async function checkAvailableActions(window, configuration) {
    const result = { family: configuration.family, actions: [] }
    if (configuration.actions.includes('answer')) {
        await click(window, '[data-practice-navigation-action="answer"]')
        await assertActions(window, configuration)
        await click(window, '[data-practice-navigation-action="answer"]')
        await assertActions(window, configuration)
        result.actions.push('answer')
    }
    for (const action of ['content', 'pause', 'reset', 'report', 'mode']) {
        if (!configuration.actions.includes(action)) continue
        await openAction(window, action)
        if (action === 'content')
            assert.equal(
                await evaluate(window, () =>
                    document.querySelector('[role="dialog"]')?.textContent.includes('示例'),
                ),
                true,
            )
        await closeDialog(window)
        await assertActions(window, configuration)
        result.actions.push(action)
    }
    await click(window, '[data-practice-navigation-action="draft"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-draft-panel]')),
        'draft opens the nonmodal chapter panel',
    )
    assert.equal(
        await evaluate(window, () =>
            document.querySelector('[data-practice-draft-panel]')?.getAttribute('aria-modal'),
        ),
        'false',
    )
    await evaluate(window, () => {
        const textarea = document.querySelector(
            '[data-practice-draft-panel] textarea[aria-label="章节草稿"]',
        )
        if (!textarea) throw new Error('Draft navigation does not open the chapter draft editor')
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(
            textarea,
            '导航检查草稿',
        )
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await waitFor(
        window,
        () =>
            document.querySelector('[data-practice-draft-panel] textarea')?.value ===
            '导航检查草稿',
        'draft accepts local input',
    )
    await click(window, '[data-practice-draft-panel] button[aria-label="关闭草稿纸"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-draft-panel]'),
        'draft panel closes',
    )
    await click(window, '[data-practice-navigation-action="draft"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-draft-panel]')),
        'chapter draft panel reopens',
    )
    assert.equal(
        await evaluate(
            window,
            () => document.querySelector('[data-practice-draft-panel] textarea')?.value,
        ),
        '导航检查草稿',
        'reopening available draft retains chapter input',
    )
    await click(window, '[data-practice-draft-panel] button[aria-label="关闭草稿纸"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-draft-panel]'),
        'chapter draft panel closes before settings',
    )
    await openAction(window, 'settings')
    const tabs = await evaluate(window, () =>
        Array.from(document.querySelectorAll('[role="dialog"] [role="tab"]')).map((tab) => {
            const readable = tab.cloneNode(true)
            readable.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
            return readable.textContent.trim()
        }),
    )
    assert.deepEqual(tabs, ['发音', '专项', '答题', '特效', '外观', '快捷键', '系统'])
    await closeDialog(window)
    await assertActions(window, configuration)
    result.actions.push('draft', 'settings')
    return result
}

async function setTheme(window, origin, theme, waitForResources) {
    if (
        await evaluate(
            window,
            (expected) => document.documentElement.dataset.theme === expected,
            theme,
        )
    )
        return
    await beforeNavigation(window, waitForResources)
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'light' ? '白天模式' : '夜间模式'
    await waitFor(
        window,
        (name) => {
            const input = document.querySelector('input[aria-label="' + name + '"]')
            return input !== null && !input.matches(':disabled')
        },
        'theme selector ready',
        label,
    )
    await click(window, 'input[aria-label="' + label + '"]')
    await waitFor(
        window,
        (expected) => document.documentElement.dataset.theme === expected,
        'theme applied',
        theme,
    )
    await imagesReady(window)
}

async function captureNavigation(window, path) {
    await imagesReady(window)
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
        await Promise.allSettled(
            document
                .getAnimations()
                .filter(
                    (animation) =>
                        animation.effect?.pseudoElement?.startsWith('::view-transition') ||
                        animation.animationName?.includes('view-transition'),
                )
                .map((animation) => animation.finished),
        )
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    const region = await evaluate(window, () => {
        const rect = document.querySelector('[data-practice-navigation]').getBoundingClientRect()
        const x = Math.max(0, Math.floor(rect.x) - 8)
        const y = Math.max(0, Math.floor(rect.y) - 8)
        return {
            x,
            y,
            width: Math.min(innerWidth - x, Math.ceil(rect.width) + 16),
            height: Math.min(innerHeight - y, Math.ceil(rect.height) + 16),
        }
    })
    writeFileSync(resolve(path), (await window.webContents.capturePage(region)).toPNG())
    return path
}

async function runPracticeNavigationChecks(window, origin, label, waitForResources) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const session = window.webContents.session
    const application = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const exportedPages = new Set(manifest.routes)
    const exportedFiles = new Set(manifest.files.map((path) => '/' + path))
    const businessRequests = []
    const permissionRequests = []
    const consoleErrors = []
    let originalTheme
    const result = {
        label,
        status: 'running',
        modes: [],
        themes: [],
        interactions: [],
        pcReflow: [],
        pageZoom: [],
        businessRequests,
        permissionRequests,
        consoleErrors,
        limitations: [
            '仅验证按内容族裁剪的右上导航与已有动作，没有新增学习规则或业务接口',
            '全屏按钮检查语义和几何，未据隐藏窗口宣称真实全屏兼容通过',
            'PC视觉不代表平板/H5或真机验收；控制台和全局资源失败监控保持严格',
        ],
    }
    const onConsole = (event) => {
        if (event.level === 'error' || event.level === 'warning') consoleErrors.push(event.message)
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
        const exportedPage = isExportedPageRequest(details, origin, exportedPages)
        const exportedAsset =
            sameApplication &&
            ['GET', 'HEAD'].includes(details.method) &&
            exportedFiles.has(url.pathname)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!sameApplication && ['http:', 'https:'].includes(url.protocol)) ||
            (['xhr', 'fetch'].includes(details.resourceType) && !exportedPage && !exportedAsset)
        )
            businessRequests.push({
                url: details.url,
                method: details.method,
                type: details.resourceType,
            })
        callback({ requestHeaders: details.requestHeaders })
    })
    session.setPermissionRequestHandler((_contents, permission, callback) => {
        permissionRequests.push(permission)
        callback(false)
    })
    try {
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await setTheme(window, origin, 'dark', waitForResources)
        for (const configuration of families) {
            let sameFamilyActions
            for (const mode of configuration.modes) {
                await visit(window, origin, configuration, mode, waitForResources)
                const measured = await assertActions(window, configuration)
                assertReference(measured)
                const actions = measured.buttons.map((button) => button.action)
                if (sameFamilyActions)
                    assert.deepEqual(
                        actions,
                        sameFamilyActions,
                        'all submodes in one family share navigation',
                    )
                else sameFamilyActions = actions
                result.modes.push({ family: configuration.family, mode, measured })
            }
        }
        assert.equal(
            result.modes.length,
            40,
            'all 12 families and 40 legal demo-mode pairs were traversed',
        )
        for (const theme of ['dark', 'light']) {
            await setTheme(window, origin, theme, waitForResources)
            for (const configuration of families) {
                await visit(window, origin, configuration, configuration.modes[0], waitForResources)
                const measured = await assertActions(window, configuration)
                assertReference(measured)
                assert.equal(measured.theme, theme)
                const screenshot = await captureNavigation(
                    window,
                    'dist/practice-navigation-' +
                        label.toLowerCase() +
                        '-' +
                        configuration.family +
                        '-' +
                        theme +
                        '.png',
                )
                result.themes.push({ family: configuration.family, theme, measured, screenshot })
                if (
                    theme === 'dark' &&
                    ['word', 'typing', 'guess', 'video-reader'].includes(configuration.family)
                )
                    result.interactions.push(await checkAvailableActions(window, configuration))
            }
        }
        for (const family of ['word', 'typing', 'guess', 'video-reader']) {
            const configuration = families.find((entry) => entry.family === family)
            await visit(window, origin, configuration, configuration.modes[0], waitForResources)
            for (const width of [1280, 1440, 2560]) {
                window.setContentSize(width, 900)
                await delay(75)
                const measured = await assertActions(window, configuration)
                result.pcReflow.push({ family, width, measured })
            }
            window.setContentSize(1920, 1080)
            for (const factor of [1.25, 1.5, 2]) {
                window.webContents.setZoomFactor(factor)
                await delay(75)
                const measured = await assertActions(window, configuration)
                result.pageZoom.push({ family, factor, measured })
            }
            window.webContents.setZoomFactor(1)
        }
        assert.deepEqual(businessRequests, [], 'navigation sends no business request')
        assert.deepEqual(permissionRequests, [], 'navigation requests no microphone permission')
        assert.deepEqual(
            consoleErrors,
            [],
            'navigation produces no hydration or runtime console errors',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failureScreenshot = await captureNavigation(
                window,
                'dist/practice-navigation-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme, waitForResources)
        } finally {
            window.webContents.removeListener('console-message', onConsole)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/practice-navigation-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runPracticeNavigationChecks }
