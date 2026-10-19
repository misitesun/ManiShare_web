const assert = require('node:assert/strict')
const { app, BrowserWindow, webContents } = require('electron')
const { writeFileSync, mkdirSync } = require('node:fs')
const { resolve, dirname } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { loginFlow } = require('./login-runtime-smoke.cjs')
const { runPracticeChecks } = require('./practice-runtime-smoke.cjs')
const { runWordModeChecks } = require('./word-mode-runtime-smoke.cjs')
const { runWordToolbarChecks } = require('./word-toolbar-runtime-smoke.cjs')
const { runSentenceToolbarChecks } = require('./sentence-toolbar-runtime-smoke.cjs')
const { runAudioToolbarChecks } = require('./audio-toolbar-runtime-smoke.cjs')
const { runAdditionalToolbarChecks } = require('./additional-toolbar-runtime-smoke.cjs')
const { runPracticeNavigationChecks } = require('./practice-navigation-runtime-smoke.cjs')
const { runPracticeModesChecks } = require('./practice-modes-runtime-smoke.cjs')
const { runPracticeShortcutChecks } = require('./practice-shortcuts-runtime-smoke.cjs')
const { runPracticeTimerChecks } = require('./practice-timer-runtime-smoke.cjs')

const root = resolve(__dirname, '..')
app.setAppPath(root)
if (!process.env.DESKTOP_SMOKE_USER_DATA)
    throw new Error('Runtime smoke requires an isolated profile')
app.setPath('userData', process.env.DESKTOP_SMOKE_USER_DATA)
const report = {
    environment: 'production',
    electron: process.versions.electron,
    routes: [],
    networkFailures: [],
    consoleErrors: [],
    documentNavigations: [],
    interactions: [],
    rscResponses: [],
    login: [],
    progress: [],
}
let currentLabel = 'Electron'
let currentStage = 'startup'
let requestFailures = []
let consoleErrors = []
const requestsInFlight = new Map()
let timedOut = false

function checkpoint(label, stage) {
    currentLabel = label
    currentStage = stage
    const uptimeSeconds = Math.round(process.uptime() * 10) / 10
    report.progress.push({ label, stage, uptimeSeconds })
    console.log(`[runtime-smoke] ${uptimeSeconds}s ${label} ${stage}`)
}

function writeFailureDiagnostics(error) {
    report.status = 'failed'
    report.error = String(error)
    report.label = currentLabel
    report.stage = currentStage
    report.networkFailures = requestFailures
    report.consoleErrors = consoleErrors
    report.pendingRequests = [...requestsInFlight.values()]
    report.windows = BrowserWindow.getAllWindows().map((window) => {
        try {
            return {
                id: window.id,
                webContentsId: window.webContents.id,
                url: window.webContents.getURL(),
                loading: window.webContents.isLoading(),
            }
        } catch (windowError) {
            return { id: window.id, error: String(windowError) }
        }
    })
    const output = resolve(root, 'dist/runtime-smoke.json')
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, JSON.stringify(report, null, 4))
}

async function tracedFlow(label, name, operation) {
    checkpoint(label, name + ':start')
    const result = await operation()
    checkpoint(label, name + ':complete')
    return result
}

// 全部练习工具栏、40组合导航、缓存恢复、两主题与真实缩放检查；保持720秒总时限并保存超时进度。
const timeout = setTimeout(() => {
    timedOut = true
    console.error('Runtime smoke timed out')
    try {
        writeFailureDiagnostics('Runtime smoke timed out after 720000ms')
    } catch (diagnosticError) {
        console.error('Cannot save runtime timeout diagnostics:', diagnosticError)
    } finally {
        app.exit(1)
    }
}, 720000)

async function waitFor(window, expression, description) {
    for (let attempt = 0; attempt < 80; attempt++) {
        if (await window.webContents.executeJavaScript(expression)) return
        await delay(100)
    }
    throw new Error(`Timed out: ${description}`)
}
function observe(window, label) {
    const observedWindowId = window.webContents.id
    window.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (!details.webContentsId || details.webContentsId === observedWindowId)
            requestsInFlight.set(details.id, {
                windowId: observedWindowId,
                url: details.url,
                startStage: currentStage,
            })
        callback({})
    })
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
        const startedRequest = requestsInFlight.get(details.id)
        requestsInFlight.delete(details.id)
        const requester =
            typeof details.webContentsId === 'number' && details.webContentsId > 0
                ? webContents.fromId(details.webContentsId)
                : undefined
        if (details.error !== 'net::ERR_ABORTED')
            requestFailures.push({
                label,
                url: details.url,
                error: details.error,
                webContentsId: details.webContentsId,
                documentUrl: requester && !requester.isDestroyed() ? requester.getURL() : undefined,
                referrer: details.referrer,
                startStage: startedRequest?.startStage,
                errorStage: currentStage,
            })
    })
    window.webContents.session.webRequest.onCompleted((details) => {
        requestsInFlight.delete(details.id)
        if (details.statusCode >= 400)
            requestFailures.push({
                label,
                url: details.url,
                status: details.statusCode,
                resourceType: details.resourceType,
            })
    })
}
async function waitForResourcesBeforeRefresh(window) {
    let quietPasses = 0
    for (let attempt = 0; attempt < 100; attempt++) {
        const pending = [...requestsInFlight.values()].filter(
            (request) => request.windowId === window.webContents.id,
        )
        quietPasses = pending.length === 0 ? quietPasses + 1 : 0
        if (quietPasses >= 5) return
        await delay(100)
    }
    throw new Error(
        'Settings refresh resources did not settle: ' +
            JSON.stringify([...requestsInFlight.values()]),
    )
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
    await waitForResourcesBeforeRefresh(window)
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
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/ai-tutor/?mentor=sarah-british&scene=daily')
    await waitFor(
        window,
        `[...document.querySelectorAll('button')].some(button => button.textContent.includes('开启对话') && !button.disabled)`,
        'AI restored selection',
    )
    await click(
        window,
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('开启对话')).click()`,
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
        `[...document.querySelectorAll('button')].some(button => button.textContent.includes('开启对话') && !button.disabled)`,
        'AI selection restored after leaving chat',
    )
    await click(
        window,
        `[...document.querySelectorAll('button')].find(button => button.textContent.includes('开启对话')).click()`,
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
    await waitForResourcesBeforeRefresh(window)
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
    // Theme now belongs to the settings page; navigate through the actual shell link.
    await click(window, `document.querySelector('a[aria-label="设置"]').click()`, '/settings/')
    await waitFor(
        window,
        `!!document.querySelector('[role="tab"][aria-controls="settings-appearance"]')`,
        'settings navigation hydrated',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('[role="tab"][aria-controls="settings-appearance"]').click()`,
    )
    await waitFor(
        window,
        `!!document.querySelector('input[aria-label="白天模式"]') && !document.querySelector('fieldset').disabled`,
        'settings theme ready',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('input[aria-label="白天模式"]').click()`,
    )
    await waitFor(window, `document.documentElement.dataset.theme === 'light'`, 'theme event')
    await waitForResourcesBeforeRefresh(window)
    await new Promise((resolveReload) => {
        window.webContents.once('did-finish-load', resolveReload)
        window.reload()
    })
    await waitFor(
        window,
        `document.documentElement.dataset.theme === 'light' && !!document.querySelector('input[aria-label="夜间模式"]') && !document.querySelector('fieldset').disabled`,
        'theme persisted reload',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('input[aria-label="夜间模式"]').click()`,
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
const settingsControlsSnapshot = `(() => {
    const panel = document.querySelector('[role="tabpanel"]');
    return {
        selects: Array.from(panel.querySelectorAll('button[aria-haspopup="menu"]')).map(element => [element.getAttribute('aria-label').split('：')[0], element.querySelector('.truncate').textContent]),
        ranges: Array.from(panel.querySelectorAll('input[type="range"]')).map(element => [element.getAttribute('aria-label'), element.value]),
        switches: Array.from(panel.querySelectorAll('[role="switch"]')).map(element => [element.getAttribute('aria-label'), element.getAttribute('aria-checked')]),
        radios: Array.from(panel.querySelectorAll('[role="radiogroup"]')).map(element => [element.getAttribute('aria-label'), element.querySelector('input:checked').value])
    };
})()`

async function settingsPersistenceFlow(window, origin, label) {
    const tabs = [
        ['pronunciation', [1, 4, 0, 0]],
        ['specialized', [3, 0, 4, 0]],
        ['answer', [1, 0, 4, 0]],
        ['effects', [4, 4, 8, 1]],
        ['appearance', [5, 2, 5, 2]],
    ]
    const expected = new Map()
    for (const [tab, counts] of tabs) {
        await waitForResourcesBeforeRefresh(window)
        await window.loadURL(origin + '/settings/?tab=' + tab)
        await waitFor(window, `document.body.innerText.includes('本机设置已就绪')`, tab + ' ready')
        const before = await window.webContents.executeJavaScript(settingsControlsSnapshot)
        assert.deepEqual(
            Object.values(before).map((values) => values.length),
            counts,
            tab + ' controls',
        )
        for (const [name] of before.selects) {
            await window.webContents.executeJavaScript(
                `Array.from(document.querySelectorAll('[role="tabpanel"] button[aria-haspopup="menu"]')).find(element => element.getAttribute('aria-label').startsWith(${JSON.stringify(name + '：')})).click()`,
            )
            await waitFor(
                window,
                `document.querySelector('[role="tabpanel"] [role="menu"][aria-hidden="false"]')`,
                name + ' options open',
            )
            const selectedValue = await window.webContents.executeJavaScript(
                `(() => {
                    const option = Array.from(document.querySelectorAll('[role="tabpanel"] [role="menu"][aria-hidden="false"] [role="menuitemradio"]')).at(-1);
                    const value = option.textContent;
                    option.click();
                    return value;
                })()`,
            )
            await waitFor(
                window,
                `!document.querySelector('[role="tabpanel"] [role="menu"][aria-hidden="false"]')`,
                name + ' selected',
            )
            assert.ok(
                await window.webContents.executeJavaScript(
                    `Array.from(document.querySelectorAll('[role="tabpanel"] button[aria-haspopup="menu"]')).some(element => element.getAttribute('aria-label') === ${JSON.stringify(name + '：' + selectedValue)})`,
                ),
                name + ' chosen value displayed',
            )
        }
        const desired = await window.webContents.executeJavaScript(`(() => {
            const panel = document.querySelector('[role="tabpanel"]');
            const selects = Array.from(panel.querySelectorAll('button[aria-haspopup="menu"]')).map(element => [element.getAttribute('aria-label').split('：')[0], element.querySelector('.truncate').textContent]);
            const ranges = Array.from(panel.querySelectorAll('input[type="range"]')).map(element => {
                const value = element.value === element.max ? element.min : element.max;
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return [element.getAttribute('aria-label'), value];
            });
            const switches = Array.from(panel.querySelectorAll('[role="switch"]')).map(element => {
                const value = element.getAttribute('aria-checked') === 'true' ? 'false' : 'true';
                element.click();
                return [element.getAttribute('aria-label'), value];
            });
            const radios = Array.from(panel.querySelectorAll('[role="radiogroup"]')).map(element => {
                const choices = Array.from(element.querySelectorAll('input[type="radio"]'));
                const choice = element.getAttribute('aria-label') === '主题切换' ? choices[0] : choices[choices.length - 1];
                choice.click();
                return [element.getAttribute('aria-label'), choice.value];
            });
            return { selects, ranges, switches, radios };
        })()`)
        await waitFor(
            window,
            `JSON.stringify(${settingsControlsSnapshot}) === ${JSON.stringify(JSON.stringify(desired))}`,
            tab + ' all changes',
        )
        expected.set(tab, desired)
    }
    // 答题/外观的音标入口共用同一字段，以最后一次修改的可见值验证两处恢复。
    const appearancePhonetics = expected
        .get('appearance')
        .switches.find(([name]) => name === '答题音标显示')[1]
    expected.get('answer').switches = expected
        .get('answer')
        .switches.map(([name, value]) => [name, name === '显示音标' ? appearancePhonetics : value])
    // 在其他 Tab 继续修改后再逐页刷新，确认不会覆盖前面保存的字段。
    for (const [tab] of tabs) {
        await waitForResourcesBeforeRefresh(window)
        await window.loadURL(origin + '/settings/?tab=' + tab)
        await waitFor(
            window,
            `document.body.innerText.includes('本机设置已就绪')`,
            tab + ' restored',
        )
        assert.deepEqual(
            await window.webContents.executeJavaScript(settingsControlsSnapshot),
            expected.get(tab),
            tab + ' full refresh restoration',
        )
    }
    for (const [legacy, current] of [
        ['sound', 'effects'],
        ['listening', 'specialized'],
    ]) {
        await waitForResourcesBeforeRefresh(window)
        await window.loadURL(origin + '/settings/?tab=' + legacy + '&keep=legacy-settings')
        await waitFor(
            window,
            `document.querySelector('#settings-${current}') && document.body.innerText.includes('本机设置已就绪')`,
            'legacy settings tab ' + legacy,
        )
        assert.ok(
            await window.webContents.executeJavaScript(
                `location.search.includes('keep=legacy-settings')`,
            ),
        )
    }
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=shortcuts')
    await waitFor(window, `document.body.innerText.includes('本机设置已就绪')`, 'shortcuts ready')
    const shortcutSnapshot = `Array.from(document.querySelectorAll('[role="tabpanel"] kbd')).map(element => element.textContent)`
    const expectedShortcuts = [
        'Shift + L',
        'Shift + J',
        'Shift + K',
        'Shift + ArrowLeft',
        'Shift + ArrowRight',
    ]
    assert.deepEqual(
        await window.webContents.executeJavaScript(shortcutSnapshot),
        expectedShortcuts,
        label + ' restores five defaults from legacy preferences without shortcut fields',
    )
    for (const [index, [name, key]] of [
        ['朗读', 'p'],
        ['掌握', 'o'],
        ['不熟', 'i'],
    ].entries()) {
        await window.webContents.executeJavaScript(
            `Array.from(document.querySelectorAll('button')).find(element => element.textContent === ${JSON.stringify('编辑' + name)}).click()`,
        )
        await waitFor(window, `document.querySelector('[role="dialog"]')`, name + ' editor')
        await window.webContents.executeJavaScript(
            `window.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, shiftKey: true, bubbles: true }))`,
        )
        await waitFor(
            window,
            `document.querySelector('[role="textbox"]').textContent === ${JSON.stringify('Shift + ' + key.toUpperCase())}`,
            name + ' captured',
        )
        await window.webContents.executeJavaScript(
            `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '确认').click()`,
        )
        await waitFor(window, `!document.querySelector('[role="dialog"]')`, name + ' saved')
        expectedShortcuts[index] = 'Shift + ' + key.toUpperCase()
        assert.deepEqual(
            await window.webContents.executeJavaScript(shortcutSnapshot),
            expectedShortcuts,
            label + ' saves ' + name + ' without resetting other bindings or cut defaults',
        )
    }
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=shortcuts')
    await waitFor(
        window,
        `document.body.innerText.includes('本机设置已就绪')`,
        'shortcuts restored',
    )
    assert.deepEqual(
        await window.webContents.executeJavaScript(shortcutSnapshot),
        expectedShortcuts,
        label + ' refresh restores three custom bindings and both cut defaults',
    )
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=system')
    await waitFor(
        window,
        `document.querySelectorAll('[role="tabpanel"] dt').length === 7`,
        'seven system information entries',
    )
    report.interactions.push({
        label,
        action: 'settings-all-controls-save-refresh',
        shortcutBindings: expectedShortcuts,
        result: 'passed',
    })
}

async function settingsFlow(window, origin, label) {
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=answer')
    await waitFor(window, `document.body.innerText.includes('本机设置已就绪')`, 'answer ready')
    const preferencesKey = 'english-learning-preferences-v1'
    const legacyAnswer = {
        showTranslation: false,
        handwriting: true,
        inputCompatibility: true,
        autoShowAnswer: true,
        autoReadOnChange: false,
        chapterEnd: '循环播放',
        autoNextOnRead: true,
    }
    await window.webContents.executeJavaScript(
        `localStorage.setItem(${JSON.stringify(preferencesKey)}, JSON.stringify({version:1,values:${JSON.stringify({ ...legacyAnswer, answerAfterErrors: '错误3次后' })}}))`,
    )
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=answer')
    await waitFor(
        window,
        `document.querySelector('button[aria-label="错误几次时显示答案：错误3次后"]') && document.body.innerText.includes('本机设置已就绪')`,
        'legacy answer choice restored',
    )
    await settingsPersistenceFlow(window, origin, label)
    const persistedAnswer = await window.webContents.executeJavaScript(
        `JSON.parse(localStorage.getItem(${JSON.stringify(preferencesKey)})).values`,
    )
    for (const [key, value] of Object.entries(legacyAnswer))
        assert.equal(persistedAnswer[key], value, label + ' retains hidden ' + key)
    for (const [key, value] of Object.entries({
        playShortcut: 'Shift + P',
        masteredShortcut: 'Shift + O',
        unfamiliarShortcut: 'Shift + I',
        previousShortcut: 'Shift + ArrowLeft',
        nextShortcut: 'Shift + ArrowRight',
    }))
        assert.equal(persistedAnswer[key], value, label + ' persists shortcut field ' + key)

    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=pronunciation&keep=settings-smoke')
    await waitFor(window, `document.body.innerText.includes('本机设置已就绪')`, 'settings ready')
    await window.webContents.executeJavaScript(`(() => {
        const input = document.querySelector('input[aria-label="倍速调节"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '1.4');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)
    await waitFor(
        window,
        `document.querySelector('input[aria-label="倍速调节"]').value === '1.4' && document.querySelector('output').textContent.includes('1.4')`,
        'settings range change',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('[role="tab"][aria-controls="settings-appearance"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('#settings-appearance') && location.search.includes('keep=settings-smoke')`,
        'settings tab keeps query',
    )
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="tabpanel"] button[aria-haspopup="menu"]')).find(element => element.getAttribute('aria-label').startsWith('答题字体：')).click()`,
    )
    await waitFor(
        window,
        `document.querySelector('[role="menu"][aria-hidden="false"]')`,
        'font menu',
    )
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="menu"][aria-hidden="false"] [role="menuitemradio"]')).find(element => element.textContent === '现代体').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('button[aria-label="答题字体：现代体"]')`,
        'settings font choice',
    )
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=appearance&keep=settings-smoke')
    await waitFor(
        window,
        `document.querySelector('button[aria-label="答题字体：现代体"]') && document.body.innerText.includes('本机设置已就绪')`,
        'settings refresh restore',
    )
    assert.ok(
        await window.webContents.executeJavaScript(
            `getComputedStyle(document.querySelector('.bg-practice-background')).fontFamily.includes('Georgia')`,
        ),
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="编辑答题颜色"]').click()`,
    )
    await waitFor(window, `document.querySelector('[role="dialog"]')`, 'settings color dialog')
    await window.webContents.executeJavaScript(`(() => {
        const input = document.querySelector('[role="dialog"] input:not([type="color"])');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '#52a3ff');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '确认').click()`,
    )
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]') && getComputedStyle(document.querySelector('.border-practice-answer')).borderBottomColor === 'rgb(82, 163, 255)'`,
        'settings color preview',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="编辑答题颜色"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('[role="dialog"]')`,
        'settings color cancel dialog',
    )
    await window.webContents.executeJavaScript(`(() => {
        const input = document.querySelector('[role="dialog"] input:not([type="color"])');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '#abcdef');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '取消').click()`,
    )
    await waitFor(window, `!document.querySelector('[role="dialog"]')`, 'settings color canceled')
    assert.equal(
        await window.webContents.executeJavaScript(
            `getComputedStyle(document.querySelector('.border-practice-answer')).borderBottomColor`,
        ),
        'rgb(82, 163, 255)',
    )
    for (const [name, color] of [['练习页面字体颜色', '#abcdef']]) {
        await window.webContents.executeJavaScript(
            `document.querySelector('button[aria-label=${JSON.stringify('编辑' + name)}]').click()`,
        )
        await waitFor(window, `document.querySelector('[role="dialog"]')`, name + ' dialog')
        await window.webContents.executeJavaScript(`(() => {
            const input = document.querySelector('[role="dialog"] input:not([type="color"])');
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(color)});
            input.dispatchEvent(new Event('input', { bubbles: true }));
        })()`)
        await window.webContents.executeJavaScript(
            `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '确认').click()`,
        )
        await waitFor(window, `!document.querySelector('[role="dialog"]')`, name + ' saved')
    }
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=appearance')
    await waitFor(
        window,
        `document.body.innerText.includes('本机设置已就绪')`,
        'two colors restored',
    )
    const colorValues = `Array.from(document.querySelectorAll('[role="tabpanel"] button[aria-label^="编辑"]')).map(element => element.getAttribute('aria-description'))`
    assert.deepEqual(await window.webContents.executeJavaScript(colorValues), [
        '#52a3ff',
        '#abcdef',
    ])
    assert.deepEqual(
        await window.webContents.executeJavaScript(`(() => {
        const preview = document.querySelector('.bg-practice-background');
        return ['--app-color-practice-answer', '--app-color-practice-text'].map(name => getComputedStyle(preview).getPropertyValue(name).trim());
    })()`),
        ['#52a3ff', '#abcdef'],
    )
    const beforeColorReset = await window.webContents.executeJavaScript(settingsControlsSnapshot)
    await window.webContents.executeJavaScript(
        `(() => { for (const name of ['恢复答题默认主题色', '恢复文字默认主题色']) Array.from(document.querySelectorAll('button')).find(element => element.textContent === name).click() })()`,
    )
    await waitFor(
        window,
        `${colorValues}.every(value => value === '默认主题色')`,
        'two colors reset',
    )
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=appearance')
    await waitFor(
        window,
        `document.body.innerText.includes('本机设置已就绪')`,
        'color reset restored',
    )
    assert.deepEqual(await window.webContents.executeJavaScript(colorValues), [
        '默认主题色',
        '默认主题色',
    ])
    assert.deepEqual(
        await window.webContents.executeJavaScript(`(() => {
        const preview = document.querySelector('.bg-practice-background');
        const style = getComputedStyle(preview);
        const root = getComputedStyle(document.documentElement);
        return [style.getPropertyValue('--app-color-practice-answer').trim() === root.getPropertyValue('--app-color-brand').trim(), style.getPropertyValue('--app-color-practice-text').trim() === root.getPropertyValue('--app-color-text-primary').trim(), style.backgroundColor === getComputedStyle(document.querySelector('button[aria-label="默认练习背景"] span')).backgroundColor];
    })()`),
        [true, true, true],
    )
    assert.deepEqual(
        await window.webContents.executeJavaScript(settingsControlsSnapshot),
        beforeColorReset,
        'color reset preserves all other appearance settings and theme',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `!!document.querySelector('button[aria-label="答题字体：现代体"]')`,
        ),
        true,
    )

    await window.webContents.executeJavaScript(
        `document.querySelector('[role="tab"][aria-controls="settings-pronunciation"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('input[aria-label="倍速调节"]')?.value === '1.4'`,
        'settings range survives navigation',
    )
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/settings/?tab=pronunciation')
    await waitFor(
        window,
        `document.querySelector('input[aria-label="倍速调节"]')?.value === '1.4'`,
        'settings range survives refresh',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('[role="tab"][aria-controls="settings-appearance"]').click()`,
    )
    await waitFor(window, `document.querySelector('#settings-appearance')`, 'settings capture view')
    assert.equal(
        await window.webContents.executeJavaScript(
            `document.documentElement.scrollHeight <= innerHeight`,
        ),
        true,
        'hidden switch labels must not create outer document scrolling',
    )
    await waitFor(
        window,
        `document.querySelector('#global-course-search')?.placeholder === '搜索你想要的课程'`,
        'settings Chinese screenshot',
    )
    await delay(700)
    const image = await window.webContents.capturePage()
    writeFileSync(
        resolve(root, 'dist', 'settings-' + label.toLowerCase() + '-pc.png'),
        image.toPNG(),
    )
    report.interactions.push({
        label,
        settingsPersistence: true,
        settingsQueryPreserved: true,
        settingsColorConfirmCancelReset: true,
        settingsPreview: true,
    })
}

async function pkArenaFlow(window, origin, label) {
    await click(window, `document.querySelector('a[href="/pk/"]').click()`, '/pk/')
    await waitFor(window, `document.querySelector('#pk-room-search')`, 'PK lobby mounted')
    const roomCount = `document.querySelector('[aria-label="PK房间列表"]')?.children.length ?? 0`
    assert.equal(await window.webContents.executeJavaScript(roomCount), 8)
    for (const [query, count] of [
        ['1290', 1],
        ['999999', 0],
        ['', 8],
    ]) {
        await window.webContents.executeJavaScript(`(() => {
            const input = document.querySelector('#pk-room-search');
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(query)});
            input.dispatchEvent(new Event('input', { bubbles: true }));
        })()`)
        await waitFor(window, `(${roomCount}) === ${count}`, 'PK search ' + query)
    }
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="显示第3张活动"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('button[aria-label="显示第3张活动"]').getAttribute('aria-pressed') === 'true'`,
        'PK banner selection',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="下一张活动"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('button[aria-label="显示第1张活动"]').getAttribute('aria-pressed') === 'true'`,
        'PK banner next wraps',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="上一张活动"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('button[aria-label="显示第3张活动"]').getAttribute('aria-pressed') === 'true'`,
        'PK banner previous wraps',
    )
    for (const [name, unit] of [
        ['场数榜', '50场'],
        ['胜率榜', '96%'],
    ]) {
        await window.webContents.executeJavaScript(
            `Array.from(document.querySelectorAll('[aria-label="PK排行指标"] button')).find(element => element.textContent === ${JSON.stringify(name)}).click()`,
        )
        await waitFor(
            window,
            `document.querySelector('[aria-label=${JSON.stringify(name + '前三名')}]')?.textContent.includes(${JSON.stringify(unit)})`,
            'PK ranking ' + name,
        )
    }
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('button')).find(element => element.textContent === '取消房间').click()`,
    )
    await waitFor(window, `document.querySelector('[role="dialog"]')`, 'PK cancellation dialog')
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '取消').click()`,
    )
    await waitFor(window, `!document.querySelector('[role="dialog"]')`, 'PK cancellation dismissed')
    assert.equal(await window.webContents.executeJavaScript(roomCount), 8)
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('button')).find(element => element.textContent === '取消房间').click()`,
    )
    await waitFor(window, `document.querySelector('[role="dialog"]')`, 'PK cancellation reopened')
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent === '确认取消').click()`,
    )
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]') && document.body.innerText.includes('您未创建任何房间') && (${roomCount}) === 7`,
        'PK owned/list cancellation consistency',
    )
    assert.equal(
        await window.webContents.executeJavaScript(`document.activeElement.textContent`),
        '我的创建',
        'PK cancellation restores focus to a connected heading',
    )
    const button = (text) =>
        `Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent.trim() === ${JSON.stringify(text)}).click()`
    const radio = (label) =>
        `document.querySelector('[role="dialog"] input[aria-label=${JSON.stringify(label)}]').click()`
    const openCreator = async () => {
        await window.webContents.executeJavaScript(
            `document.querySelector('button[aria-label="创建房间"]').click()`,
        )
        await waitFor(
            window,
            `document.querySelector('[role="dialog"] input[aria-label="真人对战"]')`,
            'PK creation mounted',
        )
        await waitFor(
            window,
            `document.activeElement.getAttribute('role') === 'dialog'`,
            'PK initial frame focus',
        )
        await window.webContents.executeJavaScript(
            `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))`,
        )
        await waitFor(
            window,
            `document.activeElement.textContent.trim() === '立即创建'`,
            'PK initial Shift Tab contained',
        )
        await window.webContents.executeJavaScript(
            `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))`,
        )
        await waitFor(
            window,
            `document.activeElement.getAttribute('aria-label') === '关闭创建房间'`,
            'PK footer Tab wraps to close',
        )
    }
    const chapter = (position) =>
        `Array.from(document.querySelectorAll('[role="dialog"] input[type="checkbox"]'))[${position}].click()`
    await window.webContents.executeJavaScript(`(() => {
        const input = document.querySelector('#pk-room-search');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '999999');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)
    await waitFor(window, `(${roomCount}) === 0`, 'PK filtered before creating')
    await openCreator()
    await waitFor(
        window,
        `document.querySelector('[role="dialog"]').textContent.includes('已选2')`,
        'PK defaults select two',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="更多课程"]').click()`,
    )
    await waitFor(
        window,
        `Array.from(document.querySelectorAll('[role="dialog"] input[type="radio"]')).filter(element => element.getAttribute('aria-label').startsWith('选择课程')).length === 8`,
        'PK more courses',
    )
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="更多章节"]').click()`,
    )
    await waitFor(
        window,
        `document.querySelectorAll('[role="dialog"] input[type="checkbox"]').length === 6`,
        'PK more chapters',
    )
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('[role="dialog"] input[type="radio"]')).find(element => element.getAttribute('aria-label').startsWith('选择课程 2：')).click()`,
    )
    await waitFor(
        window,
        `document.querySelector('[role="dialog"]').textContent.includes('已选0') && Array.from(document.querySelectorAll('[role="dialog"] button')).find(element => element.textContent.trim() === '立即创建').disabled`,
        'PK course clears chapters and disables submit',
    )
    await window.webContents.executeJavaScript(chapter(0))
    await waitFor(
        window,
        `document.querySelector('[role="dialog"]').textContent.includes('已选1')`,
        'PK select one chapter',
    )
    await window.webContents.executeJavaScript(radio('选词拼块'))
    await window.webContents.executeJavaScript(radio('单词游戏'))
    await waitFor(
        window,
        `document.querySelector('[role="dialog"] input[aria-label="选词拼块"]').disabled && document.querySelector('[role="dialog"] input[aria-label="中译英模式"]').checked && document.querySelector('[role="dialog"]').textContent.includes('已选0')`,
        'PK word puzzle restriction and chapter reset',
    )
    await window.webContents.executeJavaScript(chapter(0))
    for (const label of ['人机对战', '容易', '听写模式', '闪电'])
        await window.webContents.executeJavaScript(radio(label))
    await window.webContents.executeJavaScript(
        `document.querySelector('[role="dialog"] [aria-label="听写书写方式"] input[aria-label="抄写"]').click()`,
    )
    await window.webContents.executeJavaScript(button('立即创建'))
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]') && (${roomCount}) === 8 && document.querySelector('#pk-room-search').value === '' && document.querySelector('[aria-label="我的创建"]').textContent.includes('1297') && document.querySelector('[aria-label="我的创建"]').textContent.includes('人机对战 · 容易') && document.querySelector('[aria-label="我的创建"]').textContent.includes('闪电主题')`,
        'PK create configured room and clears filter',
    )
    assert.ok(
        await window.webContents.executeJavaScript(
            `document.querySelector('[aria-label="我的创建"]').textContent.includes('抄写') && document.querySelector('[aria-label="我的创建"]').textContent.includes('单词游戏')`,
        ),
    )
    await openCreator()
    await waitFor(
        window,
        `document.querySelector('[role="dialog"] input[aria-label="默认"]').checked && document.querySelector('[role="dialog"]').textContent.includes('已选2')`,
        'PK reopen defaults',
    )
    await window.webContents.executeJavaScript(radio('闪电'))
    await window.webContents.executeJavaScript(
        `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`,
    )
    await waitFor(window, `!document.querySelector('[role="dialog"]')`, 'PK escape discards draft')
    await openCreator()
    await waitFor(
        window,
        `document.querySelector('[role="dialog"] input[aria-label="默认"]').checked`,
        'PK discarded draft does not leak',
    )
    await window.webContents.executeJavaScript(radio('选词拼块'))
    await window.webContents.executeJavaScript(button('立即创建'))
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]') && (${roomCount}) === 8 && document.querySelector('[aria-label="我的创建"]').textContent.includes('1298') && !document.querySelector('[aria-label="PK房间列表"]').textContent.includes('1297')`,
        'PK replaces owned room without adding duplicates',
    )
    await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('button')).find(element => element.textContent.trim() === 'PK数据').click()`,
    )
    await waitFor(
        window,
        `document.querySelector('[role="dialog"]')?.textContent.includes('PK记录暂未开放。')`,
        'PK remaining unavailable action',
    )
    await window.webContents.executeJavaScript(button('知道了'))
    await waitFor(window, `!document.querySelector('[role="dialog"]')`, 'PK unavailable dismissed')
    await window.loadURL(origin + '/pk/')
    await waitFor(
        window,
        `(${roomCount}) === 8 && document.querySelector('#global-course-search').placeholder === '搜索你想要的课程'`,
        'PK demonstration restored with Chinese chrome',
    )
    await waitFor(
        window,
        `document.querySelector('#global-course-search').placeholder === '搜索你想要的课程'`,
        'PK Chinese screenshot',
    )
    await delay(700)
    writeFileSync(
        resolve(root, 'dist', 'pk-' + label.toLowerCase() + '-pc.png'),
        (await window.webContents.capturePage()).toPNG(),
    )
    await openCreator()
    await delay(300)
    writeFileSync(
        resolve(root, 'dist', 'pk-create-' + label.toLowerCase() + '-pc.png'),
        (await window.webContents.capturePage()).toPNG(),
    )
    window.setSize(1920, 1080)
    await waitFor(window, `innerWidth === 1920`, 'PK wide desktop viewport')
    await delay(300)
    writeFileSync(
        resolve(root, 'dist', 'pk-create-' + label.toLowerCase() + '-wide-pc.png'),
        (await window.webContents.capturePage()).toPNG(),
    )
    window.setSize(1440, 900)
    await window.webContents.executeJavaScript(
        `document.querySelector('button[aria-label="关闭创建房间"]').click()`,
    )
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]')`,
        'PK creator screenshot closed',
    )
    report.interactions.push({
        label,
        pkSearchBannerRankingCancellationAndReentry: true,
        pkCreateReplaceConfigurationAndDraftReset: true,
    })
}

async function pkSessionFlow(window, origin, label) {
    await window.loadURL(origin + '/pk/')
    const button = (name) =>
        `Array.from(document.querySelectorAll('button')).find(e => e.textContent.trim() === ${JSON.stringify(name)}).click()`
    const close = async () => {
        await window.webContents.executeJavaScript(button('知道了'))
        await waitFor(window, `!document.querySelector('[role="dialog"]')`, 'PK notice closed')
    }
    await waitFor(
        window,
        `document.querySelector('[aria-label="我的创建"]')`,
        'PK session entrance',
    )
    await click(window, button('进入等待'), '/pk/matching/')
    await waitFor(
        window,
        `document.querySelector('main[aria-label="PK匹配中"]')`,
        'PK matching mounted',
    )
    assert.equal((await snapshot(window)).shell, false, 'matching is outside App Shell')
    for (const [name, message] of [
        ['邀请用户参与对战', '邀请用户功能暂未接入。'],
        ['添加机器人', '机器人功能暂未接入。'],
    ]) {
        await window.webContents.executeJavaScript(button(name))
        await waitFor(
            window,
            `document.querySelector('[role="dialog"]')?.textContent.includes(${JSON.stringify(message)})`,
            'PK unavailable invitation/robot',
        )
        await close()
    }
    await window.webContents.executeJavaScript(button('取消PK对战'))
    await waitFor(window, `document.querySelector('[role="dialog"]')`, 'PK cancel confirmation')
    await window.webContents.executeJavaScript(button('取消'))
    await waitFor(
        window,
        `!document.querySelector('[role="dialog"]') && location.pathname === '/pk/matching/'`,
        'PK dismiss cancellation stays',
    )
    await window.webContents.executeJavaScript(button('取消PK对战'))
    await waitFor(window, `document.querySelector('[role="dialog"]')`, 'PK reopens cancellation')
    await click(window, button('确认取消'), '/pk/')
    await waitFor(
        window,
        `document.querySelector('[aria-label="PK房间列表"]')?.querySelectorAll(':scope > li').length === 8`,
        'PK cancel does not delete room',
    )
    await click(
        window,
        `document.querySelector('button[aria-label="快速开始房间1290"]').click()`,
        '/pk/matching/',
    )
    await waitFor(
        window,
        `document.querySelector('main[aria-label="PK匹配中"]')`,
        'PK room quick-start entrance',
    )
    await click(window, button('开启对战'), '/pk/loading/')
    await waitFor(
        window,
        `document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') === '72'`,
        'PK fixed demo loading',
    )
    const loading = await snapshot(window)
    assert.equal(loading.shell, false, 'loading is outside App Shell')
    assert.deepEqual(loading.brokenImages, [])
    const ratio = await window.webContents.executeJavaScript(
        `(() => { const track = document.querySelector('[role="progressbar"]'); return track.firstElementChild.getBoundingClientRect().width / track.getBoundingClientRect().width })()`,
    )
    assert.ok(Math.abs(ratio - 0.72) < 0.001, '72% label, ARIA and visible fill agree')
    await delay(900)
    assert.equal((await snapshot(window)).path, '/pk/loading/', 'demo does not launch practice')
    await window.webContents.executeJavaScript('history.back()')
    await waitFor(
        window,
        `location.pathname === '/pk/matching/' && document.querySelector('main[aria-label="PK匹配中"]')`,
        'PK loading back to matching',
    )
    await window.loadURL(origin + '/pk/')
    await waitFor(
        window,
        `document.querySelector('button[aria-label="随机进入 / 快速开始"]')`,
        'PK random entrance',
    )
    await click(
        window,
        `document.querySelector('button[aria-label="随机进入 / 快速开始"]').click()`,
        '/pk/matching/',
    )
    await window.webContents.reload()
    await waitFor(
        window,
        `document.querySelector('main[aria-label="PK匹配中"]')`,
        'PK direct matching refresh',
    )
    assert.deepEqual((await snapshot(window)).brokenImages, [])
    await window.loadURL(origin + '/pk/loading/')
    await waitFor(
        window,
        `document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') === '72'`,
        'PK direct loading refresh',
    )
    report.interactions.push({
        label,
        pkSessionEntrancesCancellationUnavailableAndFixedLoading: true,
    })
}

async function routeSweep(window, origin, label) {
    const paths = [
        '/',
        '/settings/?tab=appearance',
        '/pk/',
        '/pk/matching/',
        '/pk/loading/',
        '/practice/?demo=sentence-basic&mode=translate',
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
        '/competition/',
        '/prize-center/',
        '/promotion/revenue/',
        '/branch-company/',
        '/courses/search/?q=hello%20world',
    ]
    for (const path of paths) {
        checkpoint(label, 'routeSweep drain:start ' + path)
        await waitForResourcesBeforeRefresh(window)
        checkpoint(label, 'routeSweep load:start ' + path)
        await window.loadURL(origin + path)
        checkpoint(label, 'routeSweep load:complete ' + path)
        await waitFor(
            window,
            `document.readyState === 'complete' && document.body.innerText.length > 0`,
            path,
        )
        await delay(150)
        await waitFor(
            window,
            `Array.from(document.images).every(image => image.complete)`,
            `${label} route images settled ${path}`,
        )
        const value = await snapshot(window)
        assert.equal(value.horizontalOverflow, false, `${label} PC horizontal overflow ${path}`)
        assert.deepEqual(value.brokenImages, [], `${label} broken images ${path}`)
        report.routes.push({ label, path, brokenImages: 0, horizontalOverflow: false })
        checkpoint(label, 'routeSweep verified ' + path)
    }
}

async function homeMascotChecks(window) {
    const mascot = 'document.querySelector(\'button[aria-label^="Mani漫奇云朵"]\')'
    const tooltip = `document.getElementById((${mascot}).getAttribute('aria-describedby'))`
    const rect = `(${mascot}).getBoundingClientRect()`
    await waitFor(window, mascot, 'home mascot mounted after hydration')
    const initial = await window.webContents.executeJavaScript(
        `({x: (${rect}).x, y: (${rect}).y, width: (${rect}).width, height: (${rect}).height})`,
    )
    assert.equal(initial.width, 70)
    assert.equal(initial.height, 70)
    await window.webContents.executeJavaScript(
        `(${mascot}).dispatchEvent(new PointerEvent('pointerover', {bubbles: true, pointerType: 'mouse'}))`,
    )
    await waitFor(window, `${tooltip}?.children.length === 2`, 'home mascot hover greeting')
    assert.deepEqual(
        await window.webContents.executeJavaScript(
            `Array.from((${tooltip}).children).map(e => e.textContent)`,
        ),
        ['你好，我是Mani漫奇，', '在这里见证每一位小伙伴的成长之路！'],
    )
    await window.webContents.executeJavaScript(
        `(${mascot}).dispatchEvent(new PointerEvent('pointerout', {bubbles: true, pointerType: 'mouse', relatedTarget: document.body}))`,
    )
    await waitFor(window, `!(${tooltip})`, 'home mascot hover exit')
    // Hidden sandbox windows do not receive native focus events. Set the DOM focus
    // and deliver focusin to exercise the handler without activating a user's window.
    await window.webContents.executeJavaScript(
        `(() => { const cloud = ${mascot}; cloud.blur(); cloud.focus(); if (!document.hasFocus()) cloud.dispatchEvent(new FocusEvent('focusin', {bubbles: true})); })()`,
    )
    assert.equal(
        await window.webContents.executeJavaScript(`document.activeElement === (${mascot})`),
        true,
    )
    await waitFor(window, `${tooltip}?.children.length === 2`, 'home mascot keyboard focus')
    await window.webContents.executeJavaScript(
        `(${mascot}).dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true, cancelable: true}))`,
    )
    await waitFor(
        window,
        `Math.abs((${rect}).x - ${initial.x - 10}) < 1`,
        'home mascot keyboard move',
    )
    const beforeScroll = await window.webContents.executeJavaScript(`(${rect}).y`)
    const shell = "document.querySelector('div.h-dvh.overflow-y-auto')"
    const scrolled = await window.webContents.executeJavaScript(
        `(() => { const shell = ${shell}; shell.scrollTop = 100; return shell.scrollTop })()`,
    )
    assert.ok(scrolled > 0, 'home scroll fixture actually scrolls')
    await delay(100)
    assert.equal(await window.webContents.executeJavaScript(`(${rect}).y`), beforeScroll)
    await window.webContents.executeJavaScript(`${shell}.scrollTop = 0`)
    await window.webContents.executeJavaScript(
        `(() => { for (let i = 0; i < 200; i++) for (const key of ['ArrowLeft', 'ArrowUp']) (${mascot}).dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true})); })()`,
    )
    await waitFor(window, `(${rect}).x === 12 && (${rect}).y === 12`, 'home mascot top left bound')
    assert.ok(
        await window.webContents.executeJavaScript(
            `(${tooltip}).getBoundingClientRect().top > (${rect}).bottom`,
        ),
        'home mascot greeting flips below at top edge',
    )
    await window.webContents.executeJavaScript(
        `(() => { for (let i = 0; i < 200; i++) for (const key of ['ArrowRight', 'ArrowDown']) (${mascot}).dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true})); })()`,
    )
    await waitFor(
        window,
        `(${rect}).right === innerWidth - 12 && (${rect}).bottom === innerHeight - 12`,
        'home mascot bottom right bound',
    )
    window.setSize(1280, 800)
    await waitFor(
        window,
        `innerWidth === 1280 && (${rect}).right <= innerWidth - 12 && (${rect}).bottom <= innerHeight - 12`,
        'home mascot stays visible after resize',
    )
    window.setSize(1440, 900)
    await waitFor(window, 'innerWidth === 1440', 'home mascot desktop width restored')
    await window.webContents.executeJavaScript(
        `(${mascot}).dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))`,
    )
    await waitFor(window, `!(${tooltip})`, 'home mascot Escape hides greeting')
    report.interactions.push({
        label: currentLabel,
        homeMascotHoverFocusKeyboardBoundsScrollResize: true,
    })
}

async function chineseHeaderFlow(window, origin, label) {
    currentLabel = label
    const throttling = window.webContents.getBackgroundThrottling()
    window.webContents.setBackgroundThrottling(false)
    try {
        await verifyChineseHeader(window, origin, label)
    } finally {
        window.webContents.setBackgroundThrottling(throttling)
    }
}

async function verifyChineseHeader(window, origin, label) {
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/')
    await waitFor(
        window,
        'document.querySelector(\'button[aria-label="玩家俱乐部"]\')?.hasAttribute("aria-expanded") && !!document.querySelector("[aria-label^=Mani漫奇云朵]")',
        'header QR controls mounted',
    )
    const originalTheme = await window.webContents.executeJavaScript(
        'document.documentElement.dataset.theme',
    )
    const legacyLocale = await window.webContents.executeJavaScript(`(() => {
        const previous = localStorage.getItem('english-learning-language');
        localStorage.setItem('english-learning-language', JSON.stringify('en-US'));
        return previous;
    })()`)
    await waitForResourcesBeforeRefresh(window)
    await window.loadURL(origin + '/')
    await waitFor(
        window,
        'document.querySelector(\'button[aria-label="玩家俱乐部"]\')?.hasAttribute("aria-expanded") && !!document.querySelector("[aria-label^=Mani漫奇云朵]")',
        'Chinese page restored',
    )
    assert.equal(
        await window.webContents.executeJavaScript(`document.documentElement.lang`),
        'zh-CN',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `document.querySelector('#global-course-search').placeholder`,
        ),
        '搜索你想要的课程',
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            `!!document.querySelector('summary[aria-label="界面语言"]') || Array.from(document.querySelectorAll('select option')).some(e => e.value === 'zh-CN' || e.value === 'en-US')`,
        ),
        false,
    )
    const trigger = (title) =>
        `document.querySelector('button[aria-label=${JSON.stringify(title)}]')`
    const panel = (title) =>
        `document.querySelector('[role="region"][aria-label=${JSON.stringify(title + '二维码')}]')`
    const regions = `Array.from(document.querySelectorAll('[role="region"]')).filter(e => e.getAttribute('aria-label')?.endsWith('二维码'))`
    await window.webContents.executeJavaScript(
        `${trigger('玩家俱乐部')}.dispatchEvent(new PointerEvent('pointerover', {bubbles:true, pointerType:'mouse'}))`,
    )
    await waitFor(window, panel('玩家俱乐部'), 'club hover opens QR')
    await window.webContents.executeJavaScript(
        `(() => { const button = ${trigger('玩家俱乐部')}; const card = ${panel('玩家俱乐部')}; button.dispatchEvent(new PointerEvent('pointerout', {bubbles:true, pointerType:'mouse', relatedTarget:card})); card.dispatchEvent(new PointerEvent('pointerover', {bubbles:true, pointerType:'mouse', relatedTarget:button})); })()`,
    )
    await delay(180)
    assert.ok(
        await window.webContents.executeJavaScript(panel('玩家俱乐部')),
        'moving into QR keeps it visible',
    )
    await window.webContents.executeJavaScript(
        `${trigger('客服咨询')}.dispatchEvent(new PointerEvent('pointerover', {bubbles:true, pointerType:'mouse'}))`,
    )
    await waitFor(
        window,
        `${panel('客服咨询')} && (${regions}).length === 1`,
        'QR switch is exclusive',
    )
    await window.webContents.executeJavaScript(
        `${panel('客服咨询')}.dispatchEvent(new PointerEvent('pointerout', {bubbles:true, pointerType:'mouse', relatedTarget:document.body}))`,
    )
    await waitFor(window, `(${regions}).length === 0`, 'leaving QR closes it')
    await window.webContents.executeJavaScript(
        `(() => { const button = ${trigger('客服咨询')}; button.focus(); if (!document.hasFocus()) button.dispatchEvent(new FocusEvent('focusin', {bubbles:true})); })()`,
    )
    await waitFor(window, panel('客服咨询'), 'QR opens on keyboard focus')
    await window.webContents.executeJavaScript(
        `document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}))`,
    )
    await waitFor(window, `(${regions}).length === 0`, 'Escape closes QR')
    const messages = await window.webContents.executeJavaScript(
        `(() => { const messages=[]; const original = window.alert; window.alert = message => messages.push(message); try { ${trigger('玩法介绍')}.click(); } finally { window.alert = original; } return messages; })()`,
    )
    assert.deepEqual(messages, ['链接暂未配置'])
    await waitFor(window, panel('玩法介绍'), 'gameplay click keeps example QR')
    await window.webContents.executeJavaScript(
        `document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}))`,
    )
    await waitFor(window, `(${regions}).length === 0`, 'outside pointer closes QR')
    for (const [theme, themeLabel] of [
        ['dark', '夜间模式'],
        ['light', '白天模式'],
    ]) {
        await waitForResourcesBeforeRefresh(window)
        await window.loadURL(origin + '/settings/?tab=appearance')
        await waitFor(
            window,
            `!!document.querySelector('input[aria-label="夜间模式"]') && !document.querySelector('fieldset').disabled`,
            'header theme settings ready',
        )
        await window.webContents.executeJavaScript(
            `document.querySelector('input[aria-label=${JSON.stringify(themeLabel)}]').click()`,
        )
        await waitFor(
            window,
            `document.documentElement.dataset.theme === ${JSON.stringify(theme)}`,
            'header theme applied',
        )
        await waitForResourcesBeforeRefresh(window)
        await window.loadURL(origin + '/')
        await waitFor(
            window,
            'document.querySelector(\'button[aria-label="玩家俱乐部"]\')?.hasAttribute("aria-expanded") && !!document.querySelector("[aria-label^=Mani漫奇云朵]")',
            'header screenshot page',
        )
        window.setSize(1920, 1112)
        await waitFor(window, 'innerWidth === 1920', 'header design viewport')
        for (const [title, name] of [
            ['玩家俱乐部', 'club'],
            ['客服咨询', 'service'],
            ['玩法介绍', 'play'],
        ]) {
            await window.webContents.executeJavaScript(
                `${trigger(title)}.dispatchEvent(new PointerEvent('pointerover', {bubbles:true,pointerType:'mouse'}))`,
            )
            await waitFor(
                window,
                `${panel(title)} && (${regions}).length === 1 && (${panel(title)}).querySelector('img').complete`,
                'header design QR ' + title,
            )
            const geometry = await window.webContents.executeJavaScript(
                `(() => { const card = ${panel(title)}; const qr = card.querySelector('img'); const title = card.querySelector('p'); const description = card.querySelectorAll('p')[1]; const r=card.getBoundingClientRect(); const logo = card.querySelectorAll('img')[1]; return { width:r.width,height:r.height,qrWidth:qr.getBoundingClientRect().width,qrHeight:qr.getBoundingClientRect().height,titleSize:getComputedStyle(title).fontSize,titleLine:getComputedStyle(title).lineHeight,descriptionSize:getComputedStyle(description).fontSize,descriptionLine:getComputedStyle(description).lineHeight,logoWidth:logo?.getBoundingClientRect().width ?? null,inside:r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight }; })()`,
            )
            assert.deepEqual(geometry, {
                width: 118,
                height: 147,
                qrWidth: 80,
                qrHeight: 80,
                titleSize: '12px',
                titleLine: '17px',
                descriptionSize: '10px',
                descriptionLine: '14px',
                logoWidth: name === 'service' ? 14 : null,
                inside: true,
            })
            await delay(200)
            const buttonGeometry = await window.webContents.executeJavaScript(
                `(() => { const button=${trigger(title)}; const caption=button.querySelector('span:not([aria-hidden])'); const style=getComputedStyle(button); const text=getComputedStyle(caption); return {width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height,fontSize:text.fontSize,lineHeight:text.lineHeight,weight:text.fontWeight,gap:style.columnGap,color:style.color}; })()`,
            )
            assert.deepEqual(buttonGeometry, {
                width: name === 'club' ? 134 : 115,
                height: 32,
                fontSize: '16px',
                lineHeight: '22px',
                weight: '500',
                gap: '5px',
                color: theme === 'dark' ? 'rgb(0, 224, 136)' : 'rgb(7, 143, 100)',
            })
            assert.deepEqual((await snapshot(window)).brokenImages, [])
            assert.equal((await snapshot(window)).horizontalOverflow, false)
            writeFileSync(
                resolve(
                    root,
                    'dist',
                    'header-qr-' + label.toLowerCase() + '-' + name + '-' + theme + '-pc.png',
                ),
                (await window.webContents.capturePage()).toPNG(),
            )
        }
    }
    checkpoint(label, 'verifyChineseHeader final-screenshots:complete')
    checkpoint(label, 'verifyChineseHeader resize1440:start')
    window.setSize(1440, 900)
    checkpoint(label, 'verifyChineseHeader resize1440:called')
    await waitFor(window, 'innerWidth === 1440', 'header narrow PC')
    checkpoint(label, 'verifyChineseHeader resize1440:complete')
    await waitFor(
        window,
        `(() => { const r = ${panel('玩法介绍')}.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight; })()`,
        'header QR repositions within narrow viewport',
    )
    checkpoint(label, 'verifyChineseHeader QR-reposition:complete')
    await waitForResourcesBeforeRefresh(window)
    checkpoint(label, 'verifyChineseHeader restore-theme load:start')
    await window.loadURL(origin + '/settings/?tab=appearance')
    checkpoint(label, 'verifyChineseHeader restore-theme load:complete')
    await waitFor(
        window,
        `!!document.querySelector('input[aria-label="夜间模式"]') && !document.querySelector('fieldset').disabled`,
        'restore header test theme',
    )
    checkpoint(label, 'verifyChineseHeader restore-theme controls:ready')
    await window.webContents.executeJavaScript(
        `document.querySelector('input[aria-label=${JSON.stringify(originalTheme === 'dark' ? '夜间模式' : '白天模式')} ]').click()`,
    )
    await waitFor(
        window,
        `document.documentElement.dataset.theme === ${JSON.stringify(originalTheme)}`,
        'header test theme restored',
    )
    checkpoint(label, 'verifyChineseHeader restore-theme:complete')
    await window.webContents.executeJavaScript(
        `(() => { const previous = ${JSON.stringify(legacyLocale)}; if (previous === null) localStorage.removeItem('english-learning-language'); else localStorage.setItem('english-learning-language', previous); })()`,
    )
    await waitForResourcesBeforeRefresh(window)
    checkpoint(label, 'verifyChineseHeader cleanup:complete')
    report.interactions.push({
        label,
        chineseOnlyIgnoresLegacyLocale: true,
        headerQrHoverFocusExclusiveDismiss: true,
        headerQrDesignGeometryAndThemes: true,
        gameplayLinkUnconfigured: true,
    })
}

async function homeEntryFlow(window, origin, label) {
    currentLabel = label
    const previousThrottling = window.webContents.getBackgroundThrottling()
    window.webContents.setBackgroundThrottling(false)
    const dialog = 'document.querySelector("[role=dialog]")'
    const button = (name) =>
        'Array.from(document.querySelectorAll("[role=dialog] button")).find(e => e.textContent.trim() === ' +
        JSON.stringify(name) +
        ')'
    const ready = '!!document.querySelector("[aria-label^=Mani漫奇云朵]")'
    const storageKeys = [
        'english-learning-daily-checkin-v1',
        'english-learning-home-club-prompt-v1',
        'english-learning-location-prompt-confirmed',
    ]
    async function reloadHome() {
        await window.loadURL(origin + '/')
        await waitFor(window, ready, 'home entry hydrated')
    }
    async function expectDialog(text) {
        await waitFor(
            window,
            dialog + '?.textContent.includes(' + JSON.stringify(text) + ')',
            'home entry ' + text,
        )
        assert.equal(
            await window.webContents.executeJavaScript(
                'document.querySelectorAll("[role=dialog]").length',
            ),
            1,
        )
    }
    async function dismiss(trigger) {
        if (trigger === 'escape')
            await window.webContents.executeJavaScript(
                'window.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true}))',
            )
        else if (trigger === 'backdrop')
            await window.webContents.executeJavaScript(
                dialog +
                    '.parentElement.parentElement.dispatchEvent(new PointerEvent("pointerdown", {bubbles:true}))',
            )
        else await window.webContents.executeJavaScript(dialog + '.querySelector("button").click()')
    }
    async function capture(name, width, height) {
        await waitFor(
            window,
            dialog +
                ' && Array.from(' +
                dialog +
                '.querySelectorAll("img")).every(e => e.complete && e.naturalWidth > 0)',
            'entry images ready',
        )
        const geometry = await window.webContents.executeJavaScript(
            '(() => { const d=' +
                dialog +
                '; const r=d.parentElement.getBoundingClientRect(); return {width:r.width,height:r.height,inside:r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight}; })()',
        )
        assert.deepEqual(geometry, { width, height, inside: true })
        assert.deepEqual((await snapshot(window)).brokenImages, [])
        writeFileSync(
            resolve(
                root,
                'dist',
                'home-entry-' +
                    label.toLowerCase() +
                    '-' +
                    name +
                    '-' +
                    (await window.webContents.executeJavaScript(
                        'document.documentElement.dataset.theme',
                    )) +
                    '-pc.png',
            ),
            (await window.webContents.capturePage()).toPNG(),
        )
    }
    try {
        await reloadHome()
        await window.webContents.executeJavaScript(
            '(' +
                JSON.stringify(storageKeys) +
                ').forEach(key => localStorage.removeItem(key)); localStorage.setItem("english-learning-theme",JSON.stringify("dark"))',
        )
        window.setSize(1920, 1112)
        await reloadHome()
        await expectDialog('地理位置')
        await window.webContents.executeJavaScript(button('确定') + '.click()')
        await expectDialog('立即打卡')
        assert.equal(
            await window.webContents.executeJavaScript(
                dialog + '.querySelectorAll("button").length',
            ),
            1,
        )
        for (const trigger of ['escape', 'backdrop']) {
            await dismiss(trigger)
            await expectDialog('立即打卡')
        }
        await capture('checkin', 563, 212)
        const value = await window.webContents.executeJavaScript(
            'document.querySelector("[aria-label=千天签到进度]").getAttribute("aria-valuenow")',
        )
        assert.equal(value, '3')
        await window.webContents.executeJavaScript(
            '(' +
                dialog +
                ').focus(); window.dispatchEvent(new KeyboardEvent("keydown", {key:"Tab",bubbles:true,cancelable:true}))',
        )
        assert.equal(
            await window.webContents.executeJavaScript('document.activeElement.textContent.trim()'),
            '立即打卡',
        )
        await window.webContents.executeJavaScript(
            'window.dispatchEvent(new KeyboardEvent("keydown", {key:"Tab", shiftKey:true,bubbles:true,cancelable:true}))',
        )
        assert.equal(
            await window.webContents.executeJavaScript('document.activeElement.textContent.trim()'),
            '立即打卡',
        )
        await reloadHome()
        await expectDialog('立即打卡')
        await window.webContents.executeJavaScript(button('立即打卡') + '.click()')
        await expectDialog('微信扫一扫加入玩家群')
        await capture('club', 470, 322)
        assert.equal(
            await window.webContents.executeJavaScript(
                'JSON.parse(localStorage.getItem("english-learning-daily-checkin-v1")).totalDays',
            ),
            4,
        )
        await dismiss('close')
        await expectDialog('下次不再提示')
        await capture('dismiss', 470, 195)
        await window.webContents.executeJavaScript(button('否') + '.click()')
        await waitFor(window, '!' + dialog, 'no choice closes today')
        await reloadHome()
        assert.equal(await window.webContents.executeJavaScript('!!' + dialog), false)
        assert.equal(
            await window.webContents.executeJavaScript(
                'JSON.parse(localStorage.getItem("english-learning-daily-checkin-v1")).totalDays',
            ),
            4,
        )
        for (const trigger of ['escape', 'backdrop']) {
            await window.webContents.executeJavaScript(
                '(() => { const key="english-learning-home-club-prompt-v1"; const v=JSON.parse(localStorage.getItem(key)); v.lastShownDay="2000-01-01"; localStorage.setItem(key,JSON.stringify(v)); })()',
            )
            await reloadHome()
            await expectDialog('微信扫一扫加入玩家群')
            await dismiss(trigger)
            await expectDialog('下次不再提示')
            await dismiss('close')
            await waitFor(window, '!' + dialog, 'closing confirmation is not permanent')
            assert.equal(
                await window.webContents.executeJavaScript(
                    'JSON.parse(localStorage.getItem("english-learning-home-club-prompt-v1")).permanentlyClosed',
                ),
                false,
            )
        }
        await window.webContents.executeJavaScript(
            '(() => { const key="english-learning-home-club-prompt-v1"; const v=JSON.parse(localStorage.getItem(key)); v.lastShownDay=null; localStorage.setItem(key,JSON.stringify(v)); })()',
        )
        await reloadHome()
        await expectDialog('微信扫一扫加入玩家群')
        await dismiss('close')
        await expectDialog('下次不再提示')
        await window.webContents.executeJavaScript(button('是') + '.click()')
        await waitFor(window, '!' + dialog, 'permanent confirmation saved')
        await reloadHome()
        assert.equal(await window.webContents.executeJavaScript('!!' + dialog), false)
        await window.webContents.executeJavaScript(
            '(() => { const key="english-learning-daily-checkin-v1"; const v=JSON.parse(localStorage.getItem(key)); v.lastDay="2000-01-01"; localStorage.setItem(key,JSON.stringify(v)); })()',
        )
        await reloadHome()
        await expectDialog('立即打卡')
        await window.webContents.executeJavaScript(button('立即打卡') + '.click()')
        await waitFor(window, '!' + dialog, 'next day checkin still works with permanent club off')
        assert.equal(
            await window.webContents.executeJavaScript(
                'JSON.parse(localStorage.getItem("english-learning-daily-checkin-v1")).totalDays',
            ),
            5,
        )
        assert.equal(
            await window.webContents.executeJavaScript(
                'JSON.parse(localStorage.getItem("english-learning-home-club-prompt-v1")).permanentlyClosed',
            ),
            true,
        )
        await window.webContents.executeJavaScript(
            'localStorage.setItem("english-learning-theme", JSON.stringify("light")); localStorage.setItem("english-learning-daily-checkin-v1", JSON.stringify({version:1,totalDays:3,lastDay:null})); localStorage.setItem("english-learning-home-club-prompt-v1", JSON.stringify({version:1,permanentlyClosed:false,lastShownDay:null}))',
        )
        await reloadHome()
        await expectDialog('立即打卡')
        await waitFor(
            window,
            'document.documentElement.dataset.theme === "light"',
            'entry light theme',
        )
        await capture('checkin', 563, 212)
        await window.webContents.executeJavaScript(button('立即打卡') + '.click()')
        await expectDialog('微信扫一扫加入玩家群')
        await capture('club', 470, 322)
        await dismiss('close')
        await expectDialog('下次不再提示')
        await capture('dismiss', 470, 195)
        await window.webContents.executeJavaScript(button('是') + '.click()')
        await waitFor(window, '!' + dialog, 'light entry complete')
        await window.webContents.executeJavaScript(
            'localStorage.setItem("english-learning-theme", JSON.stringify("dark"))',
        )
        await reloadHome()

        report.interactions.push({
            label,
            homeEntrySequenceDailyPersistencePermanentClose: true,
            homeCheckinMandatoryFocusAndGeometry: true,
        })
    } finally {
        window.setSize(1440, 900)
        window.webContents.setBackgroundThrottling(previousThrottling)
    }
}

async function homeRedesignFlow(window, origin, label) {
    const backgroundThrottling = window.webContents.getBackgroundThrottling()
    // Keep hidden-window animation clocks equivalent to a foreground page.
    window.webContents.setBackgroundThrottling(false)
    try {
        await verifyHomeRedesign(window, origin, label)
    } finally {
        window.webContents.setBackgroundThrottling(backgroundThrottling)
    }
}

async function verifyHomeRedesign(window, origin, label) {
    currentLabel = label
    await window.loadURL(origin + '/')
    await waitFor(window, 'document.querySelector(\'[aria-label="学习统计范围"]\')', 'home mounted')
    await delay(350)
    if (
        await window.webContents.executeJavaScript(
            "document.querySelector('[role=\"dialog\"]')?.textContent.includes('地理位置') ?? false",
        )
    ) {
        await window.webContents.executeJavaScript(
            "Array.from(document.querySelectorAll('[role=\"dialog\"] button')).find(e => e.textContent.trim() === '确定').click()",
        )
        await waitFor(
            window,
            '!document.querySelector(\'[role="dialog"]\')',
            'home location prompt acknowledged',
        )
    }
    const original = await window.webContents.executeJavaScript(
        "({theme: document.documentElement.dataset.theme, placeholder: document.querySelector('#global-course-search').placeholder, collaborationLabel: document.querySelector('a[href=\"/collaboration/\"]').getAttribute('aria-label')})",
    )
    await homeMascotChecks(window)
    for (const [range, rangeId, sentenceValue] of [
        ['今天', 'today', 24],
        ['昨天', 'yesterday', 36],
        ['本周', 'week', 168],
        ['本月', 'month', 320],
        ['总计', 'total', 400],
    ]) {
        await window.webContents.executeJavaScript(
            "Array.from(document.querySelectorAll('[aria-label=\"学习统计范围\"] button')).find(e => e.id.endsWith('-' + " +
                JSON.stringify(rangeId) +
                ')).click()',
        )
        await waitFor(
            window,
            "document.querySelector('dl[aria-label=" +
                JSON.stringify(range + '学习统计') +
                "]')?.children.length === 6 && document.querySelector('dl[aria-label=" +
                JSON.stringify(range + '学习统计') +
                "]').children[0].textContent.includes(" +
                JSON.stringify(String(sentenceValue)) +
                ')',
            'home stats ' + range,
        )
    }
    const monthText = "document.querySelector('#learning-garden-title').textContent.trim()"
    for (const [control, expected, days] of [
        ['下个月', '2026-09', 30],
        ['下个月', '2026-10', 31],
        ['上个月', '2026-09', 30],
        ['上个月', '2026-08', 31],
    ]) {
        await window.webContents.executeJavaScript(
            "document.querySelector('button[aria-label=" + JSON.stringify(control) + "]').click()",
        )
        await waitFor(
            window,
            '(' +
                monthText +
                ') === ' +
                JSON.stringify(expected) +
                ' && document.querySelector(\'[aria-label="月度学习日期"]\').children.length === ' +
                days,
            'home month ' + expected,
        )
    }
    for (const expected of ['2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02']) {
        await window.webContents.executeJavaScript(
            'document.querySelector(\'button[aria-label="上个月"]\').click()',
        )
        await waitFor(
            window,
            '(' + monthText + ') === ' + JSON.stringify(expected),
            'home previous month',
        )
    }
    assert.equal(
        await window.webContents.executeJavaScript(
            'document.querySelector(\'[aria-label="月度学习日期"]\').children.length',
        ),
        28,
    )
    for (const expected of [
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
        '2026-09',
        '2026-10',
        '2026-11',
        '2026-12',
        '2027-01',
    ]) {
        await window.webContents.executeJavaScript(
            'document.querySelector(\'button[aria-label="下个月"]\').click()',
        )
        await waitFor(
            window,
            '(' + monthText + ') === ' + JSON.stringify(expected),
            'home next month and year',
        )
    }
    await window.webContents.executeJavaScript(
        'document.querySelector(\'button[aria-label="首页第5张活动"]\').click()',
    )
    await waitFor(
        window,
        "document.querySelector('[aria-label=\"首页第5张活动\"]').getAttribute('aria-pressed') === 'true'",
        'home slide direct',
    )
    await window.webContents.executeJavaScript(
        'document.querySelector(\'button[aria-label="下一张活动"]\').click()',
    )
    await waitFor(
        window,
        "document.querySelector('[aria-label=\"首页第1张活动\"]').getAttribute('aria-pressed') === 'true'",
        'home slide next wraps',
    )
    await window.webContents.executeJavaScript(
        'document.querySelector(\'button[aria-label="上一张活动"]\').click()',
    )
    await waitFor(
        window,
        "document.querySelector('[aria-label=\"首页第5张活动\"]').getAttribute('aria-pressed') === 'true'",
        'home slide previous wraps',
    )
    await window.webContents.executeJavaScript(
        'document.querySelector(\'button[aria-label="分享打卡展示"]\').click()',
    )
    await waitFor(
        window,
        "document.querySelector('[role=\"dialog\"]')?.textContent.includes('分享海报功能暂未接入')",
        'home honest share prompt',
    )
    assert.ok(
        await window.webContents.executeJavaScript(
            "(() => { const cloud = document.querySelector('button[aria-label^=\"Mani漫奇云朵\"]').getBoundingClientRect(); const hit = document.elementFromPoint(cloud.x + 35, cloud.y + 35); return document.querySelector('[role=\"dialog\"]').closest('.fixed').contains(hit); })()",
        ),
        'home dialog overlay is above mascot',
    )
    await window.webContents.executeJavaScript(
        "Array.from(document.querySelectorAll('[role=\"dialog\"] button')).find(e => e.textContent.trim() === '知道了').click()",
    )
    await waitFor(window, '!document.querySelector(\'[role="dialog"]\')', 'home share closed')
    assert.equal(
        await window.webContents.executeJavaScript(
            "document.querySelector('a[href=\"/collaboration/\"]').getAttribute('aria-label')",
        ),
        original.collaborationLabel,
    )
    assert.equal(
        await window.webContents.executeJavaScript(
            "document.querySelector('a[href=\"/promotion/revenue/\"]').getAttribute('aria-label')",
        ),
        '我的推广奖励',
    )
    await click(
        window,
        'document.querySelector(\'a[href="/promotion/revenue/"]\').click()',
        '/promotion/revenue/',
    )
    await waitFor(
        window,
        "document.body.innerText.includes('我的推广奖励')",
        'home reward link unchanged path',
    )
    for (const [theme, themeLabel] of [
        ['dark', '夜间模式'],
        ['light', '白天模式'],
    ]) {
        await window.loadURL(origin + '/settings/?tab=appearance')
        await waitFor(
            window,
            "!!document.querySelector('input[aria-label=\"夜间模式\"]') && !document.querySelector('fieldset').disabled",
            'home appearance ready',
        )
        await window.webContents.executeJavaScript(
            "document.querySelector('input[aria-label=" +
                JSON.stringify(themeLabel) +
                "]').click()",
        )
        await waitFor(
            window,
            'document.documentElement.dataset.theme === ' + JSON.stringify(theme),
            'home theme ' + theme,
        )
        await window.loadURL(origin + '/')
        await waitFor(
            window,
            "document.querySelector('dl[aria-label=\"总计学习统计\"]') && document.querySelector('#global-course-search').placeholder === " +
                JSON.stringify(original.placeholder) +
                ' && document.documentElement.dataset.theme === ' +
                JSON.stringify(theme),
            'home reload preferences',
        )
        await waitFor(
            window,
            '(' +
                monthText +
                ") === '2026-08' && document.querySelector('[aria-label=\"首页第3张活动\"]').getAttribute('aria-pressed') === 'true'",
            'home local states reset',
        )
        await waitFor(
            window,
            `(() => { const cloudNode = document.querySelector('button[aria-label^="Mani漫奇云朵"]'); const anchorNode = document.querySelector('section[aria-label="学习留言"] > span[aria-hidden="true"]'); if (!cloudNode || !anchorNode) return false; const cloud = cloudNode.getBoundingClientRect(); const anchor = anchorNode.getBoundingClientRect(); return Math.abs(cloud.x - anchor.x) < 1 && Math.abs(cloud.y - anchor.y) < 1; })()`,
            'home mascot refresh restores initial anchor',
        )
        window.setSize(1920, 1112)
        await waitFor(window, 'innerWidth === 1920', 'home desktop width')
        await delay(300)
        const state = await snapshot(window)
        assert.equal(state.horizontalOverflow, false)
        assert.deepEqual(state.brokenImages, [])
        writeFileSync(
            resolve(root, 'dist', 'home-redesign-' + label.toLowerCase() + '-' + theme + '-pc.png'),
            (await window.webContents.capturePage()).toPNG(),
        )
        await window.webContents.executeJavaScript(
            "(() => { const cloud = document.querySelector('button[aria-label^=\"Mani漫奇云朵\"]'); cloud.focus(); if (!document.hasFocus()) cloud.dispatchEvent(new FocusEvent('focusin', {bubbles: true})); })()",
        )
        await waitFor(
            window,
            "document.querySelector('button[aria-label^=\"Mani漫奇云朵\"]').hasAttribute('aria-describedby')",
            'home mascot themed greeting',
        )
        await delay(220)
        await waitFor(
            window,
            "(() => { const image = document.querySelector('button[aria-label^=\"Mani漫奇云朵\"] img'); const style = getComputedStyle(image); const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; const scales = style.scale === 'none' ? [1] : style.scale.split(' ').map(value => parseFloat(value) / (value.endsWith('%') ? 100 : 1)); return scales.every(scale => Math.abs(scale - (reduced ? 1 : 1.05)) < 0.0001) && (!reduced || style.translate === 'none'); })()",
            'home mascot hover transform respects motion preference',
        )
        writeFileSync(
            resolve(root, 'dist', 'home-mascot-' + label.toLowerCase() + '-' + theme + '-pc.png'),
            (await window.webContents.capturePage()).toPNG(),
        )
        await window.webContents.executeJavaScript(
            'document.querySelector(\'button[aria-label^="Mani漫奇云朵"]\').blur()',
        )
        window.setSize(1440, 900)
    }
    await window.loadURL(origin + '/settings/?tab=appearance')
    await waitFor(
        window,
        "!!document.querySelector('input[aria-label=\"夜间模式\"]') && !document.querySelector('fieldset').disabled",
        'home restore appearance ready',
    )
    const restoreTheme = original.theme === 'dark' ? '夜间模式' : '白天模式'
    await window.webContents.executeJavaScript(
        "document.querySelector('input[aria-label=" + JSON.stringify(restoreTheme) + "]').click()",
    )
    await waitFor(
        window,
        'document.documentElement.dataset.theme === ' + JSON.stringify(original.theme),
        'home restored theme',
    )
    report.interactions.push({
        label,
        homeStatsMonthCarouselShareAndReload: true,
        homeGlobalNavigation: true,
        homeDarkLightAssetsAndOverflow: true,
    })
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

async function isolatedLoginFlow(referenceWindow, origin, label) {
    const preferences = {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
    }
    const preload = referenceWindow.webContents.getLastWebPreferences().preload
    if (typeof preload === 'string') preferences.preload = preload
    const window = new BrowserWindow({
        show: false,
        width: 1440,
        height: 900,
        webPreferences: preferences,
    })
    observe(window, label)
    try {
        return await loginFlow(window, origin, label, waitFor)
    } finally {
        window.destroy()
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
    report.practiceShortcuts ??= []
    app.focus({ steal: true })
    production.show()
    production.focus()
    production.webContents.focus()
    await waitFor(production, 'document.hasFocus()', 'practice foreground host')
    report.practiceShortcuts.push(
        await runPracticeShortcutChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.practiceTimers = [
        await runPracticeTimerChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
            { lifecycleOnly: true },
        ),
    ]
    await runPracticeChecks(production, 'englishlearning://app', 'Electron', report)
    report.wordToolbar ??= []
    report.wordToolbar.push(
        await runWordToolbarChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.sentenceToolbar ??= []
    report.sentenceToolbar.push(
        await runSentenceToolbarChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.audioToolbar ??= []
    report.audioToolbar.push(
        await runAudioToolbarChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.additionalToolbar ??= []
    report.additionalToolbar.push(
        await runAdditionalToolbarChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.practiceNavigation ??= []
    report.practiceNavigation.push(
        await runPracticeNavigationChecks(
            production,
            'englishlearning://app',
            'Electron',
            waitForResourcesBeforeRefresh,
        ),
    )
    report.wordMode ??= []
    report.wordMode.push(await runWordModeChecks(production, 'englishlearning://app', 'Electron'))
    report.practiceModes ??= []
    report.practiceModes.push(
        await runPracticeModesChecks(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'interactiveFlow', () =>
        interactiveFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'settingsFlow', () =>
        settingsFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'pkArenaFlow', () =>
        pkArenaFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'pkSessionFlow', () =>
        pkSessionFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'homeEntryFlow', () =>
        homeEntryFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'homeRedesignFlow', () =>
        homeRedesignFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'chineseHeaderFlow', () =>
        chineseHeaderFlow(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'routeSweep', () =>
        routeSweep(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'unknownPageChecks', () =>
        unknownPageChecks(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'missingResourceChecks', () =>
        missingResourceChecks(production, 'englishlearning://app', 'Electron'),
    )
    await tracedFlow('Electron', 'localDesktopChecks', () => localDesktopChecks(production))
    checkpoint('Web', 'window:create:start')
    const browser = new BrowserWindow({
        show: false,
        width: 1440,
        height: 900,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    })
    checkpoint('Web', 'window:create:complete')
    observe(browser, 'Web')
    const origin = process.env.SMOKE_WEB_ORIGIN
    assert.ok(origin)
    // A new BrowserWindow has no document: executeJavaScript can wait indefinitely
    // until its first navigation. Initialize the real catalog before helper setup.
    checkpoint('Web', 'initial-page load:start /practice/')
    await browser.loadURL(origin + '/practice/')
    checkpoint('Web', 'initial-page load:complete /practice/')
    await waitFor(
        browser,
        `document.readyState === 'complete' && document.querySelector('main h1')?.textContent === '练习页 · 第一版演示'`,
        'Web initial practice catalog mounted',
    )
    checkpoint('Web', 'initial-page mounted /practice/')
    app.focus({ steal: true })
    browser.show()
    browser.focus()
    browser.webContents.focus()
    await waitFor(browser, 'document.hasFocus()', 'Web practice foreground host')
    report.practiceShortcuts.push(
        await runPracticeShortcutChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.practiceTimers.push(
        await runPracticeTimerChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh, {
            lifecycleOnly: true,
        }),
    )
    await runPracticeChecks(browser, origin, 'Web', report)
    report.wordToolbar.push(
        await runWordToolbarChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.sentenceToolbar.push(
        await runSentenceToolbarChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.audioToolbar.push(
        await runAudioToolbarChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.additionalToolbar.push(
        await runAdditionalToolbarChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.practiceNavigation.push(
        await runPracticeNavigationChecks(browser, origin, 'Web', waitForResourcesBeforeRefresh),
    )
    report.wordMode.push(await runWordModeChecks(browser, origin, 'Web'))
    report.practiceModes.push(await runPracticeModesChecks(browser, origin, 'Web'))
    await tracedFlow('Web', 'interactiveFlow', () => interactiveFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'settingsFlow', () => settingsFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'pkArenaFlow', () => pkArenaFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'pkSessionFlow', () => pkSessionFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'homeEntryFlow', () => homeEntryFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'homeRedesignFlow', () => homeRedesignFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'chineseHeaderFlow', () => chineseHeaderFlow(browser, origin, 'Web'))
    await tracedFlow('Web', 'routeSweep', () => routeSweep(browser, origin, 'Web'))
    await tracedFlow('Web', 'unknownPageChecks', () => unknownPageChecks(browser, origin, 'Web'))
    await tracedFlow('Web', 'missingResourceChecks', () =>
        missingResourceChecks(browser, origin, 'Web'),
    )
    report.login.push(await isolatedLoginFlow(production, 'englishlearning://app', 'Electron'))
    report.login.push(await isolatedLoginFlow(browser, origin, 'Web'))
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
    writeFileSync(
        resolve(root, 'dist/login-validation.json'),
        JSON.stringify(report.login, null, 4),
    )
    const output = resolve(root, 'dist/runtime-smoke.json')
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, JSON.stringify(report, null, 4))
    console.log(
        `Production runtime smoke passed: ${report.routes.length} Web/Electron route visits, hydration/query/theme/IPC/RSC and strict resource404`,
    )
    clearTimeout(timeout)
    app.exit(0)
})().catch((error) => {
    writeFailureDiagnostics(error)
    console.error(error)
    clearTimeout(timeout)
    app.exit(1)
})
