const assert = require('node:assert/strict')
const { app, BrowserWindow } = require('electron')
const { writeFileSync, mkdirSync } = require('node:fs')
const { resolve, dirname } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')

const root = resolve(__dirname, '..')
app.setAppPath(root)
const report = {
    environment: 'production',
    electron: process.versions.electron,
    routes: [],
    networkFailures: [],
    consoleErrors: [],
    documentNavigations: [],
    interactions: [],
    rscResponses: [],
}
let currentLabel = 'Electron'
let requestFailures = []
let consoleErrors = []
let timedOut = false
const timeout = setTimeout(() => {
    timedOut = true
    console.error('Runtime smoke timed out')
    app.exit(1)
}, 120000)

async function waitFor(window, expression, description) {
    for (let attempt = 0; attempt < 80; attempt++) {
        if (await window.webContents.executeJavaScript(expression)) return
        await delay(100)
    }
    throw new Error(`Timed out: ${description}`)
}
function observe(window, label) {
    window.webContents.on('console-message', (event) => {
        if (event.level === 'error' || event.level === 'warning')
            consoleErrors.push({ label, message: event.message })
    })
    window.webContents.on('did-start-navigation', (_event, url, inPlace, mainFrame) => {
        if (mainFrame && !inPlace) report.documentNavigations.push({ label, url })
    })
    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        if (new URL(details.url).pathname.endsWith('.txt')) {
            const mime =
                Object.entries(details.responseHeaders ?? {}).find(
                    ([key]) => key.toLowerCase() === 'content-type',
                )?.[1]?.[0] ?? ''
            report.rscResponses.push({ label, url: details.url, status: details.statusCode, mime })
        }
        callback({})
    })
    window.webContents.session.webRequest.onErrorOccurred((details) => {
        if (details.error !== 'net::ERR_ABORTED')
            requestFailures.push({ label, url: details.url, error: details.error })
    })
    window.webContents.session.webRequest.onCompleted((details) => {
        if (details.statusCode >= 400)
            requestFailures.push({
                label,
                url: details.url,
                status: details.statusCode,
                resourceType: details.resourceType,
            })
    })
}
async function snapshot(window) {
    return window.webContents.executeJavaScript(
        `({ path: location.pathname, text: document.body.innerText, theme: document.documentElement.dataset.theme, brokenImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src), horizontalOverflow: document.documentElement.scrollWidth > innerWidth, shell: !!document.querySelector('nav'), buttonCount: document.querySelectorAll('button').length })`,
    )
}
async function click(window, expression, expectedPath) {
    const navigationCount = report.documentNavigations.length
    await window.webContents.executeJavaScript(expression)
    await waitFor(
        window,
        `location.pathname === ${JSON.stringify(expectedPath)}`,
        `navigation ${expectedPath}`,
    )
    await delay(150)
    assert.equal(
        report.documentNavigations.length,
        navigationCount,
        'Client navigation must not become a document load',
    )
}
async function interactiveFlow(window, origin, label) {
    currentLabel = label
    await window.loadURL(origin + '/profile/notes/?view=course-packages&keep=1')
    await waitFor(
        window,
        `!!document.querySelector('a[href*="/profile/notes/courses/english-learning-map/"]')`,
        'notebook query restoration',
    )
    assert.match((await snapshot(window)).text, /英语学习地图/)
    const shellScroll = `document.querySelector('div.h-dvh.overflow-y-auto')`
    const scrollBefore = await window.webContents.executeJavaScript(
        `(() => { const container = ${shellScroll}; container.scrollTop = 120; return container.scrollTop })()`,
    )
    assert.equal(scrollBefore, 120, 'baseline notebook shell is scrollable')
    await click(
        window,
        `document.querySelector('a[href*="/profile/notes/courses/english-learning-map/"]').click()`,
        '/profile/notes/courses/english-learning-map/',
    )
    assert.equal(
        await window.webContents.executeJavaScript(`${shellScroll}.scrollTop`),
        scrollBefore,
        'cross-page navigation preserves the baseline shell scroll',
    )
    await click(window, 'window.history.back(); true', '/profile/notes/')
    assert.equal(
        await window.webContents.executeJavaScript(`${shellScroll}.scrollTop`),
        scrollBefore,
        'history back preserves shell scroll',
    )
    await click(
        window,
        'window.history.forward(); true',
        '/profile/notes/courses/english-learning-map/',
    )
    assert.equal(
        await window.webContents.executeJavaScript(`${shellScroll}.scrollTop`),
        scrollBefore,
        'history forward preserves shell scroll',
    )
    await waitFor(
        window,
        `[...document.querySelectorAll('[role="tab"]')].some(tab => tab.textContent === '课程列表')`,
        'course tabs',
    )
    await window.webContents.executeJavaScript(
        `[...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent === '课程列表').click()`,
    )
    await waitFor(
        window,
        `new URLSearchParams(location.search).get('view') === 'courses' && !!document.querySelector('a[href*="/chapters/chapter-1/"]')`,
        'query replace',
    )
    await click(
        window,
        `document.querySelector('a[href*="/chapters/chapter-1/"]').click()`,
        '/profile/notes/courses/english-learning-map/chapters/chapter-1/',
    )
    await click(
        window,
        `[...document.querySelectorAll('a')].find(link => link.textContent === '返回').click()`,
        '/profile/notes/courses/english-learning-map/',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `new URLSearchParams(location.search).get('view')`,
        ),
        'courses',
    )
    await click(
        window,
        `[...document.querySelectorAll('a')].find(link => link.textContent === '返回').click()`,
        '/profile/notes/',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `new URLSearchParams(location.search).get('view')`,
        ),
        'course-packages',
    )
    await window.loadURL(origin + '/ai-tutor/?mentor=sarah-british&scene=daily')
    await waitFor(
        window,
        `[...document.querySelectorAll('button')].some(button => button.textContent.includes('开始对话') && !button.disabled)`,
        'AI restored selection',
    )
    await click(
        window,
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('开始对话')).click()`,
        '/ai-tutor/mentors/sarah-british/scenes/daily/',
    )
    await waitFor(
        window,
        `!!document.querySelector('textarea') || !!document.querySelector('input[placeholder]')`,
        'AI chat hydration',
    )
    await waitFor(
        window,
        `!!document.querySelector('input[aria-label="对话内容"]')`,
        'chat text input',
    )
    await window.webContents.executeJavaScript(
        `(() => { const input = document.querySelector('input[aria-label="对话内容"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'migration draft'); input.dispatchEvent(new Event('input', { bubbles: true })) })()`,
    )
    window.setSize(1440, 640)
    await delay(100)
    const messageScrollBefore = await window.webContents.executeJavaScript(
        `(() => { const messages = document.querySelector('[aria-label="对话记录（静态示例）"]'); messages.scrollTop = 40; return messages.scrollTop })()`,
    )
    assert.ok(
        messageScrollBefore > 0,
        'chat records must be internally scrollable at the minimum desktop height',
    )
    const formBefore = await snapshot(window)
    assert.match(formBefore.text, /日常闲聊/)
    await window.webContents.executeJavaScript(
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('餐厅点餐')).click()`,
    )
    await waitFor(window, `location.pathname.endsWith('/scenes/restaurant/')`, 'AI scene replace')
    await delay(200)
    assert.equal(
        await window.webContents.executeJavaScript(
            `document.querySelector('input[aria-label="对话内容"]')?.value`,
        ),
        'migration draft',
        'scene change preserves the baseline chat draft',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `document.querySelector('[aria-label="对话记录（静态示例）"]').scrollTop`,
        ),
        messageScrollBefore,
        'scene change preserves chat record scrolling',
    )
    window.setSize(1440, 900)
    await click(
        window,
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('切换AI导师')).click()`,
        '/ai-tutor/',
    )
    await waitFor(
        window,
        `[...document.querySelectorAll('button')].some(button => button.textContent.includes('开始对话') && !button.disabled)`,
        'AI selection restored after leaving chat',
    )
    await click(
        window,
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('开始对话')).click()`,
        '/ai-tutor/mentors/sarah-british/scenes/restaurant/',
    )
    await waitFor(
        window,
        `!!document.querySelector('input[aria-label="对话内容"]')`,
        'chat reentry',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `document.querySelector('input[aria-label="对话内容"]').value`,
        ),
        '',
        'leaving chat destroys the temporary session',
    )
    await window.loadURL(origin + '/profile/notes/?view=course-packages&keep=1')
    await waitFor(
        window,
        `[...document.querySelectorAll('[role="tab"]')].some(tab => tab.textContent === '全部笔记')`,
        'notebook mounted',
    )
    await window.webContents.executeJavaScript(
        `[...document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent === '全部笔记').click()`,
    )
    await waitFor(window, `!new URLSearchParams(location.search).has('view')`, 'query removal')
    assert.equal(
        await window.webContents.executeJavaScript(
            `new URLSearchParams(location.search).get('keep')`,
        ),
        '1',
    )
    // Change through the real select event, then reload to verify persisted preferences and bootstrap hydration.
    await window.webContents.executeJavaScript(
        `(() => { const select = [...document.querySelectorAll('select')].find(select => [...select.options].some(option => option.value === 'light')); select.value = 'light'; select.dispatchEvent(new Event('change', { bubbles: true })) })()`,
    )
    await waitFor(window, `document.documentElement.dataset.theme === 'light'`, 'theme event')
    await new Promise((resolveReload) => {
        window.webContents.once('did-finish-load', resolveReload)
        window.reload()
    })
    await waitFor(
        window,
        `document.documentElement.dataset.theme === 'light' && !!document.querySelector('[role="tab"]')`,
        'theme persisted reload',
    )
    await window.webContents.executeJavaScript(
        `(() => { const select = [...document.querySelectorAll('select')].find(select => [...select.options].some(option => option.value === 'dark')); select.value = 'dark'; select.dispatchEvent(new Event('change', { bubbles: true })) })()`,
    )
    await waitFor(window, `document.documentElement.dataset.theme === 'dark'`, 'theme restore')
    report.interactions.push({
        label,
        notebookParentQuery: true,
        chapterParentQuery: true,
        unrelatedQueryPreserved: true,
        aiSelectionRestored: true,
        aiSceneReplace: true,
        aiDraftPreserved: true,
        chatInternalScrollPreserved: true,
        persistedTheme: true,
        shellScrollPreserved: true,
        historyScrollPreserved: true,
        chatReentryReset: true,
        clientNavigation: true,
    })
}
async function routeSweep(window, origin, label) {
    const paths = [
        '/',
        '/login/',
        '/ai-tutor/',
        '/ai-tutor/mentors/jason/scenes/directions/',
        '/awakening/',
        '/awakening/courses/phonetics-continuation/',
        '/profile/',
        '/profile/knowledge-gaps/',
        '/profile/notes/?view=course-packages',
        '/profile/notes/courses/ocean-vocabulary/?view=courses',
        '/profile/notes/courses/ocean-vocabulary/chapters/chapter-8/',
        '/profile/learning-progress/',
        '/profile/favorites/',
        '/profile/works/',
        '/foreign-language-guide/',
        '/foreign-language-guide/courses/winter-speaking/',
        '/collaboration/',
        '/vip/',
        '/leaderboard/',
        '/prize-center/',
        '/promotion/revenue/',
        '/branch-company/',
        '/courses/search/?q=hello%20world',
    ]
    for (const path of paths) {
        await window.loadURL(origin + path)
        await waitFor(
            window,
            `document.readyState === 'complete' && document.body.innerText.length > 0`,
            path,
        )
        await delay(150)
        const value = await snapshot(window)
        assert.equal(value.horizontalOverflow, false, `${label} PC horizontal overflow ${path}`)
        assert.deepEqual(value.brokenImages, [], `${label} broken images ${path}`)
        report.routes.push({ label, path, brokenImages: 0, horizontalOverflow: false })
    }
}
async function missingResourceChecks(window, origin, label) {
    const result = await window.webContents.executeJavaScript(
        `Promise.all(['/missing.js','/profile/notes/__next.missing.txt?_rsc=test','/missing.webp','/api/example'].map(async path => { const response = await fetch(${JSON.stringify(origin)} + path); return { status: response.status, mime: response.headers.get('content-type'), body: await response.text() } }))`,
    )
    for (const response of result) {
        assert.equal(response.status, 404)
        assert.ok(!response.mime?.includes('text/html'))
        assert.ok(!response.body.includes('<html'))
    }
    // These deliberate probes produce expected console/network errors; only suppress their exact URLs.
    const expected = ['/missing.js', '/__next.missing.txt', '/missing.webp', '/api/example']
    requestFailures = requestFailures.filter(
        (item) => !expected.some((path) => item.url.includes(path)),
    )
    consoleErrors = consoleErrors.filter(
        (item) =>
            !expected.some((path) => item.message.includes(path)) &&
            !/^Failed to load resource:/.test(item.message),
    )
    report.interactions.push({ label, strictResource404: true })
}
async function unknownPageChecks(window, origin, label) {
    const paths = ['/__migration_unknown__/', '/awakening/courses/__migration_unknown__/']
    for (const path of paths) {
        await window.loadURL(origin + path)
        await waitFor(window, `location.pathname === '/'`, 'unknown page returns home')
        await waitFor(window, `!!document.querySelector('main')`, 'home after unknown page')
    }
    requestFailures = requestFailures.filter(
        (item) => !paths.some((path) => new URL(item.url).pathname === path && item.status === 404),
    )
    report.interactions.push({ label, unknownPageReturnsHome: true })
}
async function localDesktopChecks(window) {
    const session = window.webContents.session
    await session.clearCache()
    session.webRequest.onBeforeRequest((details, callback) => {
        const protocol = new URL(details.url).protocol
        callback({ cancel: protocol === 'http:' || protocol === 'https:' })
    })
    try {
        await window.loadURL('englishlearning://app/profile/notes/?view=course-packages')
        await waitFor(
            window,
            `!!document.querySelector('a[href*="/profile/notes/courses/english-learning-map/"]')`,
            'desktop cold load with HTTP networking blocked',
        )
        await click(
            window,
            `document.querySelector('a[href*="/profile/notes/courses/english-learning-map/"]').click()`,
            '/profile/notes/courses/english-learning-map/',
        )
        await waitFor(window, `!!document.querySelector('[role="tab"]')`, 'desktop local RSC')
        await delay(150)
        assert.deepEqual((await snapshot(window)).brokenImages, [])
        report.interactions.push({ label: 'Electron', httpBlockedColdLoadAndNavigation: true })
    } finally {
        session.webRequest.onBeforeRequest(null)
    }
}
;(async () => {
    app.on('browser-window-created', (_event, window) => {
        if (BrowserWindow.getAllWindows().length === 1) observe(window, 'Electron')
    })
    // Load the actual application host, protocol and preload rather than a parallel imitation.
    await import(pathToFileURL(resolve(root, 'dist/electron/main.js')).href)
    await app.whenReady()
    let production
    for (let attempt = 0; attempt < 80; attempt++) {
        production = BrowserWindow.getAllWindows()[0]
        if (production && production.webContents.getURL().startsWith('englishlearning://app')) break
        await delay(100)
    }
    assert.ok(production, 'application window created')
    await waitFor(
        production,
        `document.readyState === 'complete' && document.body.innerText.length > 0`,
        'initial host load',
    )
    while (production.webContents.isLoading()) await delay(100)
    await delay(200)
    await production.loadURL('englishlearning://app/profile/notes/?view=course-packages')
    assert.equal(
        await production.webContents.executeJavaScript('window.learningDesktop.getAppVersion()'),
        app.getVersion(),
    )
    await interactiveFlow(production, 'englishlearning://app', 'Electron')
    await routeSweep(production, 'englishlearning://app', 'Electron')
    await unknownPageChecks(production, 'englishlearning://app', 'Electron')
    await missingResourceChecks(production, 'englishlearning://app', 'Electron')
    await localDesktopChecks(production)
    const browser = new BrowserWindow({
        show: false,
        width: 1440,
        height: 900,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    })
    observe(browser, 'Web')
    const origin = process.env.SMOKE_WEB_ORIGIN
    assert.ok(origin)
    await interactiveFlow(browser, origin, 'Web')
    await routeSweep(browser, origin, 'Web')
    await unknownPageChecks(browser, origin, 'Web')
    await missingResourceChecks(browser, origin, 'Web')
    const successfulRsc = report.rscResponses.filter((response) => response.status === 200)
    for (const label of ['Web', 'Electron'])
        assert.ok(
            successfulRsc.some((response) => response.label === label),
            'real RSC responses were observed',
        )
    for (const response of successfulRsc)
        assert.ok(
            response.mime.startsWith('text/x-component'),
            'RSC response has the correct runtime MIME',
        )
    report.networkFailures = requestFailures
    report.consoleErrors = consoleErrors
    assert.deepEqual(requestFailures, [], 'unexpected runtime resource failures')
    assert.deepEqual(consoleErrors, [], 'hydration/CSP/runtime console must be clean')
    assert.equal(timedOut, false)
    report.status = 'passed'
    const output = resolve(root, 'dist/runtime-smoke.json')
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, JSON.stringify(report, null, 4))
    console.log(
        `Production runtime smoke passed: ${report.routes.length} Web/Electron route visits, hydration/query/theme/IPC/RSC and strict resource404`,
    )
    clearTimeout(timeout)
    app.exit(0)
})().catch((error) => {
    report.status = 'failed'
    report.error = String(error)
    report.label = currentLabel
    report.networkFailures = requestFailures
    report.consoleErrors = consoleErrors
    writeFileSync(resolve(root, 'dist/runtime-smoke.json'), JSON.stringify(report, null, 4))
    console.error(error)
    clearTimeout(timeout)
    app.exit(1)
})
