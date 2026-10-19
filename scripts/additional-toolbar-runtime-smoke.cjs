const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const toolbarCacheKey = 'english-learning-practice-toolbar-options-v1'
const families = [
    {
        family: 'video',
        demo: 'video-basic',
        modes: [
            ['listen', []],
            [
                'translate',
                [
                    ['输入方式', '抄写'],
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
            [
                'check',
                [
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
            [
                'typing',
                [
                    ['输入方式', '抄写'],
                    ['切读', true],
                ],
            ],
            [
                'oral',
                [
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
            [
                'blocks',
                [
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
        ],
    },
    {
        family: 'guess',
        demo: 'guess-basic',
        modes: [
            [
                'guess',
                [
                    ['图片', true],
                    ['切读', true],
                ],
            ],
            ['read', []],
            [
                'spell',
                [
                    ['输入方式', '抄写'],
                    ['图片', true],
                    ['键盘', true],
                    ['切读', true],
                ],
            ],
        ],
    },
    {
        family: 'picture',
        demo: 'picture-basic',
        modes: [
            ['listen', []],
            [
                'translate',
                [
                    ['输入方式', '抄写'],
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
            [
                'typing',
                [
                    ['输入方式', '抄写'],
                    ['切读', true],
                ],
            ],
            [
                'oral',
                [
                    ['翻译', true],
                    ['切读', true],
                ],
            ],
        ],
    },
    { family: 'typing', demo: 'typing-basic', modes: [['typing', []]] },
    { family: 'phonetics', demo: 'phonetics-basic', modes: [['pronounce', [['自然拼读', true]]]] },
    ...['video-reader', 'audio-reader', 'picture-reader', 'text-reader'].map((family) => ({
        family,
        demo: family,
        modes: [['read', []]],
    })),
]
const definitions = families.flatMap(({ family, demo, modes }) =>
    modes.map(([mode, rows]) => ({ family, demo, mode, rows, inline: family === 'phonetics' })),
)
const rowFields = {
    输入方式: 'copy',
    图片: 'imageVisible',
    翻译: 'translationVisible',
    切读: 'cutReading',
    键盘: 'keyboardVisible',
    自然拼读: 'naturalPhonics',
    拆句: 'sentenceAnalysisVisible',
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
    throw new Error('Timed out: additional toolbar ' + description)
}

async function waitForImages(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every(
                (image) =>
                    image.complete && image.naturalWidth > 0 && image.currentSrc === image.src,
            ),
        'current document images',
    )
}

async function prepareNavigation(window, waitForResources) {
    await waitForImages(window)
    if (typeof waitForResources === 'function') await waitForResources(window)
}

async function readToolbarCache(window, origin) {
    await waitFor(window, () => document.readyState === 'complete', 'cache document ready')
    return evaluate(
        window,
        (key, expectedOrigin) => {
            const expected = new URL(expectedOrigin)
            if (location.protocol !== expected.protocol || location.host !== expected.host)
                throw new Error('Toolbar cache must be read in the intended application context')
            return window.localStorage.getItem(key)
        },
        toolbarCacheKey,
        origin,
    )
}

async function restoreToolbarCache(window, raw) {
    if (raw === undefined) return
    await evaluate(
        window,
        (key, previous) => {
            if (previous === null) window.localStorage.removeItem(key)
            else window.localStorage.setItem(key, previous)
        },
        toolbarCacheKey,
        raw,
    )
}

/** Baselines remove only this task's new key, after the correct document is ready. */
async function resetToolbarCache(window, origin, waitForResources) {
    await prepareNavigation(window, waitForResources)
    await readToolbarCache(window, origin)
    await restoreToolbarCache(window, null)
}

async function reloadToolbarPage(window, waitForResources) {
    await prepareNavigation(window, waitForResources)
    await new Promise((resolveLoad, rejectLoad) => {
        const contents = window.webContents
        const timeout = setTimeout(() => finish(new Error('Toolbar refresh did not finish')), 15000)
        function finish(error) {
            clearTimeout(timeout)
            contents.removeListener('did-finish-load', loaded)
            contents.removeListener('did-fail-load', failed)
            if (error) rejectLoad(error)
            else resolveLoad()
        }
        function loaded() {
            finish()
        }
        function failed(_event, code, description, url, mainFrame) {
            if (mainFrame)
                finish(new Error('Toolbar refresh failed: ' + code + ' ' + description + ' ' + url))
        }
        contents.once('did-finish-load', loaded)
        contents.on('did-fail-load', failed)
        contents.reload()
    })
    await waitFor(
        window,
        () => document.querySelector('main[data-toolbar-ready="true"]') !== null,
        'settings restored after refresh',
    )
    await waitForImages(window)
}

function toolbarSelector(definition) {
    return '[data-practice-toolbar="' + definition.family + '"]'
}

function optionSelector(definition) {
    return definition.inline
        ? toolbarSelector(definition)
        : '[data-practice-options="' + definition.family + '"]'
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled additional toolbar action: ' + target)
            element.focus()
            element.click()
        },
        selector,
    )
}

async function clickText(window, label, scope = 'body') {
    await evaluate(
        window,
        (text, selector) => {
            const button = Array.from(
                document.querySelector(selector)?.querySelectorAll('button') ?? [],
            ).find((element) => {
                const readable = element.cloneNode(true)
                readable
                    .querySelectorAll('[aria-hidden="true"],kbd')
                    .forEach((node) => node.remove())
                return (
                    [element.getAttribute('aria-label'), readable.textContent].some(
                        (value) =>
                            value !== null &&
                            value.replace(/\s+/g, '') === text.replace(/\s+/g, ''),
                    ) &&
                    !element.disabled &&
                    !element.closest('[inert]') &&
                    element.getClientRects().length > 0
                )
            })
            if (!button) throw new Error('Missing additional toolbar text action: ' + text)
            button.focus()
            button.click()
        },
        label,
        scope,
    )
}

async function visit(window, origin, definition, waitForResources, reset = true) {
    if (reset) await resetToolbarCache(window, origin, waitForResources)
    else await prepareNavigation(window, waitForResources)
    await window.loadURL(
        origin +
            '/practice/?demo=' +
            definition.demo +
            '&mode=' +
            definition.mode +
            '&keep=additional-toolbar-smoke',
    )
    await waitFor(
        window,
        (family) =>
            document.querySelector('main[data-toolbar-ready="true"]') !== null &&
            document.querySelector('[data-practice-toolbar="' + family + '"]') !== null,
        definition.family + ':' + definition.mode + ' hydrated',
        definition.family,
    )
    await waitForImages(window)
    assert.equal(
        await evaluate(
            window,
            (selector) => Boolean(document.querySelector(selector)),
            '[data-practice-options="' + definition.family + '"]',
        ),
        false,
        'local menu starts closed',
    )
}

async function openOptions(window, definition) {
    if (definition.inline || definition.rows.length === 0) return
    await click(window, toolbarSelector(definition) + ' button[aria-label="本模式设置"]')
    await waitFor(
        window,
        (selector) => {
            const panel = document.querySelector(selector)
            if (!panel || panel.getAttribute('aria-hidden') !== 'false') return false
            const style = getComputedStyle(panel)
            const matrix = new DOMMatrixReadOnly(style.transform)
            return (
                style.visibility === 'visible' &&
                Number(style.opacity) >= 0.99999 &&
                Math.abs(matrix.m41) <= 0.001 &&
                Math.abs(matrix.m42) <= 0.001
            )
        },
        'local options enter animation reaches its final geometry',
        optionSelector(definition),
    )
}

async function closeOptions(window, definition) {
    if (definition.inline || definition.rows.length === 0) return
    await click(window, toolbarSelector(definition) + ' button[aria-label="本模式设置"]')
    await waitFor(
        window,
        (selector) => !document.querySelector(selector),
        'local options closed',
        optionSelector(definition),
    )
}

async function readRows(window, definition) {
    return evaluate(
        window,
        (selector, inline) => {
            const panel = document.querySelector(selector)
            if (!panel) return []
            if (inline)
                return Array.from(panel.querySelectorAll('[role="switch"]')).map((toggle) => [
                    toggle.getAttribute('aria-label'),
                    toggle.getAttribute('aria-checked') === 'true',
                ])
            return Array.from(panel.children)
                .filter((element) => element.tagName === 'DIV')
                .map((row) => {
                    const toggle = row.querySelector('[role="switch"]')
                    if (toggle)
                        return [
                            toggle.getAttribute('aria-label'),
                            toggle.getAttribute('aria-checked') === 'true',
                        ]
                    const group = row.matches('[role="group"]')
                        ? row
                        : row.querySelector('[role="group"]')
                    return [
                        group?.getAttribute('aria-label'),
                        group?.querySelector('[aria-pressed="true"]')?.textContent.trim(),
                    ]
                })
        },
        optionSelector(definition),
        definition.inline,
    )
}

async function changeRow(window, definition, name, value) {
    const scope = optionSelector(definition)
    if (typeof value === 'boolean')
        await click(window, scope + ' [role="switch"][aria-label="' + name + '"]')
    else await clickText(window, value, scope + ' [aria-label="' + name + '"]')
    await waitFor(
        window,
        (selector, label, expected) => {
            const root = document.querySelector(selector)
            return typeof expected === 'boolean'
                ? root
                      ?.querySelector('[role="switch"][aria-label="' + label + '"]')
                      ?.getAttribute('aria-checked') === String(expected)
                : root
                      ?.querySelector('[aria-label="' + label + '"] [aria-pressed="true"]')
                      ?.textContent.trim() === expected
        },
        name + ' changes',
        scope,
        name,
        value,
    )
}

async function scopeCache(window, definition, rows) {
    const expected = Object.fromEntries(
        rows.map(([name, value]) => [
            rowFields[name],
            typeof value === 'boolean' ? value : value === '抄写',
        ]),
    )
    const scope = definition.family + ':' + definition.mode
    await waitFor(
        window,
        (key, identity, values) => {
            const raw = window.localStorage.getItem(key)
            if (!raw) return false
            const parsed = JSON.parse(raw)
            return (
                parsed.version === 1 &&
                Object.entries(values).every(
                    ([name, value]) => parsed.scopes?.[identity]?.[name] === value,
                )
            )
        },
        'scope cache commits ' + scope,
        toolbarCacheKey,
        scope,
        expected,
    )
    const raw = await evaluate(
        window,
        (key) => JSON.parse(window.localStorage.getItem(key)),
        toolbarCacheKey,
    )
    assert.equal(raw.version, 1)
    assert.deepEqual(Object.keys(raw).sort(), ['scopes', 'version'])
    const allowed = new Set([
        'order',
        'language',
        'phonetics',
        'copy',
        'split',
        'imageVisible',
        'translationVisible',
        'phoneticsVisible',
        'cutReading',
        'keyboardVisible',
        'naturalPhonics',
        'sentenceAnalysisVisible',
    ])
    for (const [identity, values] of Object.entries(raw.scopes)) {
        assert.match(identity, /^[a-z-]+:[a-z-]+$/)
        for (const field of Object.keys(values))
            assert.equal(allowed.has(field), true, 'only setting fields may be cached: ' + field)
    }
    return { scope, values: raw.scopes[scope] }
}

async function measure(window, definition) {
    return evaluate(
        window,
        (family) => {
            const root = document.querySelector('[data-practice-toolbar="' + family + '"]')
            const panel = document.querySelector('[data-practice-options="' + family + '"]')
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
                    weight: style.fontWeight,
                    cursor: style.cursor,
                }
            }
            return {
                theme: document.documentElement.dataset.theme,
                timer: box(root?.querySelector('[data-practice-timer]')),
                settings: box(root?.querySelector('button[aria-label="本模式设置"]')),
                naturalPhonics: box(
                    root?.querySelector('[data-practice-inline="natural-phonics"]'),
                ),
                panel: box(panel),
                rows: Array.from(panel?.children ?? [])
                    .filter((element) => element.tagName === 'DIV')
                    .map(box),
                horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
                toolbarOverflow: root ? root.getBoundingClientRect().right > innerWidth + 1 : true,
                cursors: Array.from(root?.querySelectorAll('button') ?? []).map(
                    (element) => getComputedStyle(element).cursor,
                ),
                brokenImages: Array.from(document.images)
                    .filter((image) => !image.complete || image.naturalWidth === 0)
                    .map((image) => image.src),
            }
        },
        definition.family,
    )
}

function near(value, expected, label) {
    assert.ok(
        Math.abs(value - expected) <= 1,
        label + ': expected ' + expected + ', received ' + value,
    )
}

function assertReference(measured, definition) {
    const listenOffset =
        definition.mode === 'listen' && ['video', 'picture'].includes(definition.family)
    for (const [field, value] of Object.entries({
        x: listenOffset ? 29 : 16,
        y: listenOffset ? 92 : 95,
        width: 84,
        height: 26,
    }))
        near(measured.timer[field], value, 'timer ' + field)
    assert.equal(measured.timer.fontSize, '14px')
    assert.equal(measured.timer.weight, '400')
    if (definition.inline) {
        assert.equal(measured.settings, null)
        for (const [field, value] of Object.entries({ x: 110, y: 95, width: 88, height: 26 }))
            near(measured.naturalPhonics[field], value, 'natural phonics ' + field)
    } else if (definition.rows.length === 0) {
        assert.equal(measured.settings, null)
        assert.equal(measured.panel, null)
    } else {
        for (const [field, value] of Object.entries({ x: 112, y: 95, width: 26, height: 26 }))
            near(measured.settings[field], value, 'settings ' + field)
        for (const [field, value] of Object.entries({
            x: 93,
            y: 131,
            width: 64,
            height: definition.rows.length * 24,
        }))
            near(measured.panel[field], value, 'panel ' + field)
        assert.equal(measured.rows.length, definition.rows.length)
        for (const row of measured.rows) near(row.height, 24, 'row height')
    }
    assert.equal(measured.horizontalOverflow, false)
    assert.equal(measured.toolbarOverflow, false)
    assert.deepEqual(measured.brokenImages, [])
    assert.ok(measured.cursors.every((cursor) => cursor === 'pointer'))
}

async function capture(window, path) {
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        const painted = () =>
            new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
        await painted()
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
        await painted()
    })
    await delay(100)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    writeFileSync(
        resolve(path.replace(/-pc\.png$/, '-toolbar.png')),
        (await window.webContents.capturePage({ x: 0, y: 80, width: 250, height: 210 })).toPNG(),
    )
    return path
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
    await prepareNavigation(window, waitForResources)
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'light' ? '白天模式' : '夜间模式'
    await waitFor(
        window,
        (name) => document.querySelector('input[aria-label="' + name + '"]')?.disabled === false,
        'theme controls ready',
        label,
    )
    await click(window, 'input[aria-label="' + label + '"]')
    await waitFor(
        window,
        (expected) => document.documentElement.dataset.theme === expected,
        'theme changes',
        theme,
    )
    await waitForImages(window)
}

async function assertModeScope(window, definition) {
    if (definition.family !== 'video') return
    const forbidden = await evaluate(
        window,
        (selector) => ({
            toolbar: Array.from(document.querySelector(selector)?.querySelectorAll('button') ?? [])
                .map((button) => button.getAttribute('aria-label') ?? button.textContent.trim())
                .filter((text) => ['图片', '完整', '拆分', '句子显示方式'].includes(text)),
            footer: Array.from(document.querySelectorAll('[data-practice-footer] button'))
                .map((button) => button.getAttribute('aria-label') ?? button.textContent.trim())
                .filter((text) => ['掌握', '不熟'].includes(text)),
        }),
        toolbarSelector(definition),
    )
    assert.deepEqual(forbidden, { toolbar: [], footer: [] })
}

async function mediaPreservation(window, definition) {
    if (definition.family !== 'video' || definition.rows.length === 0) return null
    const baseline = await evaluate(window, () => {
        const element = document.querySelector('main video')
        if (!element) throw new Error('Video toolbar must keep its existing video')
        const saved = {
            element,
            loop: element.loop,
            muted: element.muted,
            events: { loadstart: 0, emptied: 0, pause: 0 },
            listeners: [],
        }
        window.additionalToolbarVideo = saved
        element.loop = true
        element.muted = true
        return {
            src: element.getAttribute('src'),
            volume: element.volume,
            rate: element.playbackRate,
        }
    })
    try {
        await closeOptions(window, definition)
        await clickText(window, '播放', 'section[aria-label$="视频播放器"]')
        await waitFor(
            window,
            () => {
                const element = document.querySelector('main video')
                return element !== null && !element.paused && element.currentTime > 0
            },
            'controller starts real video before local changes',
        )
        await evaluate(window, () => {
            const saved = window.additionalToolbarVideo
            for (const name of Object.keys(saved.events)) {
                const handler = () => saved.events[name]++
                saved.element.addEventListener(name, handler)
                saved.listeners.push([name, handler])
            }
        })
        await openOptions(window, definition)
        for (const [name, initial] of definition.rows) {
            for (const value of [typeof initial === 'boolean' ? !initial : '默写', initial]) {
                await changeRow(window, definition, name, value)
                const current = await evaluate(window, () => {
                    const element = document.querySelector('main video')
                    const saved = window.additionalToolbarVideo
                    return {
                        sameElement: element === saved.element,
                        src: element?.getAttribute('src'),
                        volume: element?.volume,
                        rate: element?.playbackRate,
                        playing: element !== null && !element.paused,
                        events: saved.events,
                    }
                })
                assert.deepEqual(
                    current,
                    {
                        sameElement: true,
                        ...baseline,
                        playing: true,
                        events: { loadstart: 0, emptied: 0, pause: 0 },
                    },
                    name + ' keeps existing video playing',
                )
            }
        }
        return { sameElementAndSource: true, noReloadOrPause: true }
    } finally {
        await evaluate(window, () => {
            const saved = window.additionalToolbarVideo
            if (!saved) return
            for (const [name, handler] of saved.listeners)
                saved.element.removeEventListener(name, handler)
            saved.element.pause()
            saved.element.loop = saved.loop
            saved.element.muted = saved.muted
            delete window.additionalToolbarVideo
        })
    }
}

async function checkPhonicsPlan(window, enabled) {
    const plan = await evaluate(window, () => {
        const element = document.querySelector('[data-phonetics-reading-plan]')
        return {
            kind: element?.getAttribute('data-phonetics-reading-plan'),
            text: element?.textContent.trim(),
        }
    })
    assert.equal(plan.kind, enabled ? 'phonics' : 'basic')
    assert.equal(
        plan.text,
        enabled ? '朗读顺序：目标音标 → 单词 → 自然拼读音段 → 单词' : '朗读顺序：目标音标 → 单词',
    )
    await clickText(window, '朗读', '[data-practice-footer]')
    const status = await evaluate(window, () =>
        Array.from(document.querySelectorAll('[role="status"]'))
            .map((element) => element.textContent)
            .join(' '),
    )
    assert.match(status, /未接入/)
    return plan
}

async function checkLifetime(window, origin, definition, waitForResources) {
    const before = await evaluate(window, () => ({
        input: document.querySelector('input[aria-label="练习答案"]')?.value ?? null,
        progress: document.querySelector('[data-practice-progress]')?.getAttribute('aria-valuenow'),
    }))
    const expected = []
    for (const [name, initial] of definition.rows) {
        const value = typeof initial === 'boolean' ? !initial : '默写'
        await changeRow(window, definition, name, value)
        expected.push([name, value])
        if (name === '图片')
            assert.equal(
                await evaluate(window, () =>
                    Boolean(document.querySelector('main [data-practice-media]')),
                ),
                false,
                'image setting hides question illustration',
            )
        if (name === '翻译')
            assert.equal(
                await evaluate(window, () =>
                    Boolean(document.querySelector('main [data-practice-translation]')),
                ),
                false,
                'translation setting hides actual translation',
            )
        if (name === '键盘') {
            const keyboard = await evaluate(window, () => {
                const wrapper = document.querySelector('[data-guess-keyboard]')
                return {
                    present: Boolean(wrapper?.querySelector('[aria-label="指法键盘演示"]')),
                    hidden: wrapper?.hidden,
                    visible: Boolean(wrapper?.getClientRects().length),
                }
            })
            assert.deepEqual(keyboard, { present: true, hidden: true, visible: false })
        }
        if (name === '自然拼读') await checkPhonicsPlan(window, value)
    }
    assert.deepEqual(await readRows(window, definition), expected)
    assert.deepEqual(
        await evaluate(window, () => ({
            input: document.querySelector('input[aria-label="练习答案"]')?.value ?? null,
            progress: document
                .querySelector('[data-practice-progress]')
                ?.getAttribute('aria-valuenow'),
        })),
        before,
        'local choices preserve answer state',
    )
    const cache = await scopeCache(window, definition, expected)
    await closeOptions(window, definition)
    const alternate =
        definitions.find(
            (entry) => entry.family === definition.family && entry.mode !== definition.mode,
        ) ?? definitions.find((entry) => entry.family !== definition.family)
    await visit(window, origin, alternate, waitForResources, false)
    await openOptions(window, alternate)
    assert.deepEqual(
        await readRows(window, alternate),
        alternate.rows,
        'other mode retains own defaults',
    )
    await closeOptions(window, alternate)
    await visit(window, origin, definition, waitForResources, false)
    await openOptions(window, definition)
    assert.deepEqual(
        await readRows(window, definition),
        expected,
        'return restores this mode cached choices',
    )
    await closeOptions(window, definition)
    const otherFamily = definitions.find(
        (entry) => entry.mode === definition.mode && entry.family !== definition.family,
    )
    if (otherFamily) {
        await visit(window, origin, otherFamily, waitForResources, false)
        await openOptions(window, otherFamily)
        assert.deepEqual(
            await readRows(window, otherFamily),
            otherFamily.rows,
            'same mode in another family remains isolated',
        )
        await closeOptions(window, otherFamily)
        await visit(window, origin, definition, waitForResources, false)
    }
    await reloadToolbarPage(window, waitForResources)
    await openOptions(window, definition)
    assert.deepEqual(
        await readRows(window, definition),
        expected,
        'actual refresh restores mode cache',
    )
    await closeOptions(window, definition)
    return {
        cache,
        modeReentry: true,
        refresh: true,
        sameModeFamilyIsolation: Boolean(otherFamily),
    }
}

async function checkVideoAnalysis(window, origin, waitForResources, label) {
    const definition = definitions.find(
        (entry) => entry.family === 'video' && entry.mode === 'blocks',
    )
    await visit(window, origin, definition, waitForResources)
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-practice-demo-tools]'))),
        false,
    )
    await openOptions(window, definition)
    assert.deepEqual(await readRows(window, definition), definition.rows)
    assertReference(await measure(window, definition), definition)
    await closeOptions(window, definition)
    assert.equal(
        await evaluate(window, () =>
            Boolean(document.querySelector('main [aria-label="逐词解析"]')),
        ),
        false,
    )
    await reloadToolbarPage(window, waitForResources)
    await openOptions(window, definition)
    assert.deepEqual(
        await readRows(window, definition),
        definition.rows,
        'ungraded state never exposes answer-only analysis controls',
    )
    const screenshot = await capture(
        window,
        'dist/additional-toolbar-' + label.toLowerCase() + '-video-blocks-answering-dark-pc.png',
    )
    await closeOptions(window, definition)
    return {
        answeringHidesAnalysisSwitch: true,
        refreshKeepsAnsweringGate: true,
        answerPhaseCoverage: 'PracticeContent SSR fixtures and additional-toolbar model unit tests',
        screenshot,
    }
}

async function switchGuessMode(window, mode) {
    await clickText(window, '模式', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-mode-selector="guess"]')),
        'guess mode selector opens',
    )
    await waitForImages(window)
    await click(window, '[data-practice-mode-option="' + mode + '"]')
    await waitFor(
        window,
        (expected) => {
            const selector = document.querySelector('[data-practice-mode-selector="guess"]')
            const preview = selector?.querySelector('[data-practice-mode-preview]')
            return (
                selector?.getAttribute('data-practice-mode-selected') === expected &&
                preview?.complete &&
                preview.naturalWidth > 0 &&
                preview.currentSrc === preview.src
            )
        },
        'guess preview ready',
        mode,
    )
    await waitForImages(window)
    await click(window, '[data-practice-mode-start]')
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            !document.querySelector('[role="dialog"]') &&
            document.querySelector('main[data-toolbar-ready="true"]') !== null,
        'guess mode changes without replacing page owner',
        mode,
    )
    await waitForImages(window)
}

async function otherStorageEntries(window) {
    return evaluate(
        window,
        (excludedKey) =>
            Object.fromEntries(
                Object.keys(window.localStorage)
                    .filter((key) => key !== excludedKey)
                    .sort()
                    .map((key) => [key, window.localStorage.getItem(key)]),
            ),
        toolbarCacheKey,
    )
}

function installStorageProbe(window, key, failure) {
    const probe = {
        key,
        failure,
        getCalls: 0,
        setCalls: 0,
        messages: [],
        errors: [],
        originalGet: Storage.prototype.getItem,
        originalSet: Storage.prototype.setItem,
        originalAlert: window.alert,
    }
    window.additionalToolbarStorageProbe = probe
    window.alert = (message) => probe.messages.push(String(message))
    Storage.prototype.getItem = function (name) {
        if (this === window.localStorage && name === key) {
            probe.getCalls++
            if (probe.failure === 'read')
                throw new DOMException('Toolbar read failure probe', 'SecurityError')
        }
        return probe.originalGet.call(this, name)
    }
    Storage.prototype.setItem = function (name, value) {
        if (this === window.localStorage && name === key) {
            probe.setCalls++
            if (probe.failure === 'write')
                throw new DOMException('Toolbar write failure probe', 'QuotaExceededError')
        }
        return probe.originalSet.call(this, name, value)
    }
    probe.onError = (event) => probe.errors.push(String(event.message))
    probe.onRejection = (event) => probe.errors.push(String(event.reason))
    window.addEventListener('error', probe.onError)
    window.addEventListener('unhandledrejection', probe.onRejection)
}

function storageProbeSource(failure) {
    return (
        '(' +
        installStorageProbe.toString() +
        ')(window,' +
        JSON.stringify(toolbarCacheKey) +
        ',' +
        JSON.stringify(failure) +
        ')'
    )
}

async function restoreStorageProbe(window) {
    await evaluate(window, () => {
        const probe = window.additionalToolbarStorageProbe
        if (!probe) return
        Storage.prototype.getItem = probe.originalGet
        Storage.prototype.setItem = probe.originalSet
        window.alert = probe.originalAlert
        window.removeEventListener('error', probe.onError)
        window.removeEventListener('unhandledrejection', probe.onRejection)
        delete window.additionalToolbarStorageProbe
    })
}

async function storageProbeSnapshot(window) {
    return evaluate(window, () => {
        const probe = window.additionalToolbarStorageProbe
        if (!probe) throw new Error('Storage probe was not installed')
        return {
            getCalls: probe.getCalls,
            setCalls: probe.setCalls,
            messages: [...probe.messages],
            errors: [...probe.errors],
            raw: probe.originalGet.call(window.localStorage, probe.key),
            ready: document.querySelector('main[data-toolbar-ready="true"]') !== null,
        }
    })
}

function assertSingleStorageNotice(probe) {
    assert.equal(probe.messages.length, 1, 'one notification per continuous storage failure')
    assert.match(probe.messages[0], /本机存储不可用.*当前页面生效.*刷新后无法恢复/)
    assert.deepEqual(probe.errors, [], 'handled storage failure does not escape into page errors')
    assert.equal(probe.ready, true, 'settings remain ready after storage failure')
}

async function checkCacheWriteFailure(window, origin, waitForResources) {
    const definition = definitions.find(
        (entry) => entry.family === 'guess' && entry.mode === 'spell',
    )
    const guess = definitions.find((entry) => entry.family === 'guess' && entry.mode === 'guess')
    const original = await readToolbarCache(window, origin)
    const seeded = JSON.stringify({
        version: 1,
        scopes: { 'picture:oral': { translationVisible: false, cutReading: false } },
    })
    try {
        await visit(window, origin, definition, waitForResources)
        await restoreToolbarCache(window, seeded)
        const otherKeys = await otherStorageEntries(window)
        await window.webContents.executeJavaScript(storageProbeSource('write'), true)
        await openOptions(window, definition)
        await changeRow(window, definition, '图片', false)
        await changeRow(window, definition, '键盘', false)
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('main [data-practice-media]')),
            ),
            false,
        )
        assert.equal(
            await evaluate(window, () => document.querySelector('[data-guess-keyboard]')?.hidden),
            true,
        )
        const failed = await storageProbeSnapshot(window)
        assertSingleStorageNotice(failed)
        assert.ok(failed.setCalls >= 2, 'two actual user updates attempted writes')
        assert.equal(failed.raw, seeded, 'failed writes keep the previous cache intact')
        await closeOptions(window, definition)
        await switchGuessMode(window, 'guess')
        await switchGuessMode(window, 'spell')
        await openOptions(window, definition)
        assert.deepEqual(
            await readRows(window, definition),
            [
                ['输入方式', '抄写'],
                ['图片', false],
                ['键盘', false],
                ['切读', true],
            ],
            'mounted owner retains pending settings across mode changes',
        )
        assert.equal(
            await evaluate(window, () => document.querySelector('[data-guess-keyboard]')?.hidden),
            true,
        )
        assertSingleStorageNotice(await storageProbeSnapshot(window))
        await closeOptions(window, definition)
        await evaluate(window, () => {
            const probe = window.additionalToolbarStorageProbe
            probe.failure = null
            Storage.prototype.setItem = probe.originalSet
        })
        await switchGuessMode(window, 'guess')
        await openOptions(window, guess)
        await changeRow(window, guess, '切读', false)
        await scopeCache(window, guess, [['切读', false]])
        const recovered = await storageProbeSnapshot(window)
        const saved = JSON.parse(recovered.raw)
        assert.equal(
            saved.scopes['guess:spell'].imageVisible,
            false,
            'later other-scope save commits earlier pending image choice',
        )
        assert.equal(
            saved.scopes['guess:spell'].keyboardVisible,
            false,
            'later other-scope save commits earlier pending keyboard choice',
        )
        assert.equal(saved.scopes['guess:guess'].cutReading, false)
        assert.deepEqual(
            saved.scopes['picture:oral'],
            { translationVisible: false, cutReading: false },
            'recovery preserves preexisting scope',
        )
        assertSingleStorageNotice(recovered)
        assert.deepEqual(
            await otherStorageEntries(window),
            otherKeys,
            'storage failure and retry preserve all unrelated keys',
        )
        await closeOptions(window, guess)
        return {
            actualMountedUpdates: true,
            uiAndPendingSurviveFailure: true,
            modeReturnKeepsPending: true,
            notificationCount: recovered.messages.length,
            laterScopeSaveCommitsAllPending: true,
            existingScopeAndOtherKeysPreserved: true,
        }
    } finally {
        try {
            await restoreStorageProbe(window)
        } finally {
            await restoreToolbarCache(window, original)
        }
    }
}

async function checkCacheStartupAndReadFailure(window, origin, waitForResources) {
    const definition = definitions.find(
        (entry) => entry.family === 'guess' && entry.mode === 'spell',
    )
    const original = await readToolbarCache(window, origin)
    const seeded = JSON.stringify({
        version: 1,
        scopes: {
            'guess:spell': {
                copy: false,
                imageVisible: false,
                keyboardVisible: false,
                cutReading: false,
            },
            'picture:oral': { translationVisible: false, cutReading: false },
        },
    })
    const debuggerWasAttached = window.webContents.debugger.isAttached()
    let scriptId
    let debuggerOwned = false
    try {
        await visit(window, origin, definition, waitForResources)
        await restoreToolbarCache(window, seeded)
        const otherKeys = await otherStorageEntries(window)
        if (!debuggerWasAttached) {
            window.webContents.debugger.attach('1.3')
            debuggerOwned = true
        }
        await window.webContents.debugger.sendCommand('Page.enable')
        const startupScript = await window.webContents.debugger.sendCommand(
            'Page.addScriptToEvaluateOnNewDocument',
            { source: storageProbeSource(null) },
        )
        scriptId = startupScript.identifier
        await reloadToolbarPage(window, waitForResources)
        await openOptions(window, definition)
        assert.deepEqual(
            await readRows(window, definition),
            [
                ['输入方式', '默写'],
                ['图片', false],
                ['键盘', false],
                ['切读', false],
            ],
            'startup restores real cached controls',
        )
        const startup = await storageProbeSnapshot(window)
        assert.ok(startup.getCalls > 0, 'startup really reads persisted settings')
        assert.equal(
            startup.setCalls,
            0,
            'restoring an existing cache does not automatically write it back',
        )
        assert.equal(startup.raw, seeded)
        assert.deepEqual(startup.messages, [])
        assert.deepEqual(startup.errors, [])
        assert.equal(startup.ready, true)
        await closeOptions(window, definition)
        await window.webContents.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument', {
            identifier: scriptId,
        })
        scriptId = undefined
        await restoreStorageProbe(window)
        const readFailureScript = await window.webContents.debugger.sendCommand(
            'Page.addScriptToEvaluateOnNewDocument',
            { source: storageProbeSource('read') },
        )
        scriptId = readFailureScript.identifier
        await reloadToolbarPage(window, waitForResources)
        await openOptions(window, definition)
        assert.deepEqual(
            await readRows(window, definition),
            definition.rows,
            'read failure uses deterministic default controls',
        )
        const failed = await storageProbeSnapshot(window)
        assert.ok(failed.getCalls > 0)
        assert.equal(
            failed.setCalls,
            0,
            'failed initial read does not overwrite existing storage with defaults',
        )
        assert.equal(failed.raw, seeded)
        assertSingleStorageNotice(failed)
        await evaluate(window, () => {
            const probe = window.additionalToolbarStorageProbe
            probe.failure = null
            Storage.prototype.getItem = probe.originalGet
        })
        await changeRow(window, definition, '键盘', false)
        await scopeCache(window, definition, [['键盘', false]])
        const recovered = await storageProbeSnapshot(window)
        assert.equal(recovered.setCalls, 1, 'a later real edit can save after read access recovers')
        const saved = JSON.parse(recovered.raw)
        assert.equal(saved.scopes['guess:spell'].keyboardVisible, false)
        assert.deepEqual(
            saved.scopes['picture:oral'],
            { translationVisible: false, cutReading: false },
            'read recovery keeps another existing scope',
        )
        assertSingleStorageNotice(recovered)
        assert.deepEqual(
            await otherStorageEntries(window),
            otherKeys,
            'read recovery preserves unrelated storage keys',
        )
        await closeOptions(window, definition)
        return {
            startupReadsExistingCacheWithoutWriting: true,
            startupSetCalls: startup.setCalls,
            readFailureFallsBackAndHydrates: true,
            notificationCount: recovered.messages.length,
            laterEditSavesAfterRecovery: true,
            existingScopeAndOtherKeysPreserved: true,
        }
    } finally {
        try {
            if (scriptId)
                await window.webContents.debugger.sendCommand(
                    'Page.removeScriptToEvaluateOnNewDocument',
                    { identifier: scriptId },
                )
        } finally {
            try {
                await restoreStorageProbe(window)
            } finally {
                try {
                    await restoreToolbarCache(window, original)
                } finally {
                    if (debuggerOwned && window.webContents.debugger.isAttached())
                        window.webContents.debugger.detach()
                }
            }
        }
    }
}

async function runToolbarStorageFailureChecks(window, origin, waitForResources) {
    return {
        write: await checkCacheWriteFailure(window, origin, waitForResources),
        startupAndRead: await checkCacheStartupAndReadFailure(window, origin, waitForResources),
    }
}

async function runAdditionalToolbarChecks(window, origin, label, waitForResources) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const session = window.webContents.session
    const application = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const exportedFiles = new Set(manifest.files.map((path) => '/' + path))
    const exportedPages = new Set(manifest.routes)
    const businessRequests = []
    const permissionRequests = []
    let originalTheme
    let originalCache
    const result = {
        label,
        status: 'running',
        modes: [],
        businessRequests,
        permissionRequests,
        limitations: [
            '固定计时、抄写和切读仍为示例；自然拼读缺课程音源时仅显示计划和未接入说明',
            'PC运行时与几何不代表完整题面精修，平板/H5视觉与真机待用户验收',
        ],
    }
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
        originalCache = await readToolbarCache(window, origin)
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        for (const theme of ['dark', 'light']) {
            await setTheme(window, origin, theme, waitForResources)
            for (const definition of definitions) {
                await visit(window, origin, definition, waitForResources)
                await openOptions(window, definition)
                assert.deepEqual(
                    await readRows(window, definition),
                    definition.rows,
                    definition.family + ':' + definition.mode + ' row order/defaults',
                )
                await assertModeScope(window, definition)
                const reference = await measure(window, definition)
                assertReference(reference, definition)
                assert.equal(reference.theme, theme)
                if (definition.inline) await checkPhonicsPlan(window, true)
                const screenshot = await capture(
                    window,
                    'dist/additional-toolbar-' +
                        label.toLowerCase() +
                        '-' +
                        definition.family +
                        '-' +
                        definition.mode +
                        '-' +
                        theme +
                        '-pc.png',
                )
                const entry = {
                    family: definition.family,
                    mode: definition.mode,
                    theme,
                    reference,
                    screenshot,
                }
                if (theme === 'dark' && definition.rows.length > 0) {
                    entry.media = await mediaPreservation(window, definition)
                    entry.persistence = await checkLifetime(
                        window,
                        origin,
                        definition,
                        waitForResources,
                    )
                } else await closeOptions(window, definition)
                result.modes.push(entry)
            }
        }
        await setTheme(window, origin, 'dark', waitForResources)
        result.videoAnalysis = await checkVideoAnalysis(window, origin, waitForResources, label)
        result.storageFailureRecovery = await runToolbarStorageFailureChecks(
            window,
            origin,
            waitForResources,
        )
        result.pcReflow = []
        result.pageZoom = []
        for (const [family, mode] of [
            ['video', 'translate'],
            ['guess', 'spell'],
            ['picture', 'translate'],
            ['phonetics', 'pronounce'],
            ['video-reader', 'read'],
        ]) {
            const definition = definitions.find(
                (entry) => entry.family === family && entry.mode === mode,
            )
            await visit(window, origin, definition, waitForResources)
            await openOptions(window, definition)
            for (const width of [1280, 1440, 2560]) {
                window.setContentSize(width, 900)
                await delay(75)
                const measured = await measure(window, definition)
                assert.equal(measured.horizontalOverflow, false, family + ' PC overflow ' + width)
                assert.equal(measured.toolbarOverflow, false, family + ' toolbar overflow ' + width)
                result.pcReflow.push({ family, mode, width, measured })
            }
            window.setContentSize(1920, 1080)
            for (const factor of [1.25, 1.5, 2]) {
                window.webContents.setZoomFactor(factor)
                await delay(75)
                const measured = await measure(window, definition)
                assert.equal(
                    measured.horizontalOverflow,
                    false,
                    family + ' real zoom overflow ' + factor,
                )
                assert.equal(
                    measured.toolbarOverflow,
                    false,
                    family + ' zoom toolbar overflow ' + factor,
                )
                assert.equal(
                    await evaluate(
                        window,
                        () => getComputedStyle(document.documentElement).fontSize,
                    ),
                    '16px',
                )
                result.pageZoom.push({ family, mode, factor, measured })
            }
            window.webContents.setZoomFactor(1)
            await closeOptions(window, definition)
        }
        assert.deepEqual(businessRequests, [], 'additional toolbars send zero business requests')
        assert.deepEqual(
            permissionRequests,
            [],
            'additional toolbars request no microphone permission',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failureScreenshot = await capture(
                window,
                'dist/additional-toolbar-' + label.toLowerCase() + '-failure-pc.png',
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
            await restoreToolbarCache(window, originalCache)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/additional-toolbar-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = {
    runVideoAnalysisGateChecks: checkVideoAnalysis,
    toolbarCacheKey,
    runAdditionalToolbarChecks,
    runToolbarStorageFailureChecks,
    readToolbarCache,
    resetToolbarCache,
    restoreToolbarCache,
    reloadToolbarPage,
}
