const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')
const {
    toolbarCacheKey,
    readToolbarCache,
    resetToolbarCache,
    restoreToolbarCache,
    reloadToolbarPage,
} = require('./additional-toolbar-runtime-smoke.cjs')

let waitForToolbarResources

const modes = [
    { mode: 'pronounce', label: '单词拼读', rows: [['切读', true]], copy: null },
    {
        mode: 'spell',
        label: '单词拼写',
        rows: [
            ['输入方式', '默写'],
            ['翻译', true],
            ['切读', true],
        ],
        copy: '默写',
    },
    {
        mode: 'dictate',
        label: '单词默写',
        rows: [
            ['输入方式', '抄写'],
            ['切读', false],
            ['翻译', true],
            ['图片', true],
            ['音标', false],
        ],
        copy: '抄写',
    },
    {
        mode: 'meaning',
        label: '句中练义',
        rows: [
            ['切读', true],
            ['图片', true],
            ['音标', true],
        ],
        copy: null,
    },
    {
        mode: 'typing',
        label: '指法练习',
        rows: [
            ['图片', true],
            ['输入方式', '抄写'],
            ['切读', true],
        ],
        copy: '抄写',
    },
    {
        mode: 'oral',
        label: '口语测评',
        rows: [
            ['图片', true],
            ['中文', true],
            ['切读', true],
        ],
        copy: null,
    },
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 80; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(75)
    }
    throw new Error('Timed out: word toolbar ' + description)
}

async function waitForImages(window, scope, description) {
    await waitFor(
        window,
        (selector) => {
            const container = document.querySelector(selector)
            return (
                container !== null &&
                Array.from(container.querySelectorAll('img')).every(
                    (image) =>
                        image.complete && image.naturalWidth > 0 && image.currentSrc === image.src,
                )
            )
        },
        description,
        scope,
    )
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled word toolbar action: ' + target)
            element.focus()
            element.click()
        },
        selector,
    )
}

async function clickText(window, text, scope = 'body') {
    await evaluate(
        window,
        (label, selector) => {
            const root = document.querySelector(selector)
            const button = Array.from(root?.querySelectorAll('button') ?? []).find((element) => {
                const readable = element.cloneNode(true)
                readable
                    .querySelectorAll('[aria-hidden="true"],kbd')
                    .forEach((node) => node.remove())
                return (
                    [element.getAttribute('aria-label'), readable.textContent].some(
                        (value) =>
                            value !== null &&
                            value.replace(/\s+/g, '') === label.replace(/\s+/g, ''),
                    ) &&
                    !element.disabled &&
                    !element.closest('[inert]') &&
                    element.getClientRects().length > 0
                )
            })
            if (!button) throw new Error('Missing word toolbar action text: ' + label)
            button.focus()
            button.click()
        },
        text,
        scope,
    )
}

async function selectMenu(window, label) {
    return evaluate(
        window,
        (name) => {
            const trigger = document.querySelector(
                '[data-word-toolbar] button[aria-label^="' + name + '："]',
            )
            const id = trigger?.getAttribute('aria-controls')
            const menu = id ? document.getElementById(id) : null
            return {
                expanded: trigger?.getAttribute('aria-expanded') === 'true',
                selector: menu ? '[id="' + menu.id + '"]' : null,
                shown: menu?.getAttribute('aria-hidden') === 'false',
                items: Array.from(menu?.querySelectorAll('[role="menuitemradio"]') ?? []).map(
                    (element) => element.textContent.trim(),
                ),
            }
        },
        label,
    )
}

async function waitForSelect(window, label, expanded) {
    await waitFor(
        window,
        (name, expected) => {
            const trigger = document.querySelector(
                '[data-word-toolbar] button[aria-label^="' + name + '："]',
            )
            const id = trigger?.getAttribute('aria-controls')
            const menu = id ? document.getElementById(id) : null
            return (
                trigger?.getAttribute('aria-expanded') === String(expected) &&
                (expected
                    ? menu?.getAttribute('aria-hidden') === 'false' &&
                      Number(getComputedStyle(menu).opacity) >= 0.99999
                    : !menu)
            )
        },
        label + (expanded ? ' opens linked menu' : ' closes linked menu'),
        label,
        expanded,
    )
    return selectMenu(window, label)
}

async function openOptions(window) {
    await waitFor(
        window,
        () => {
            if (document.querySelector('[data-word-options]')) return true
            document.querySelector('[data-word-toolbar] button[aria-label="本模式设置"]')?.click()
            return false
        },
        'local options open and hydrated',
    )
    await waitFor(
        window,
        () => {
            const panel = document.querySelector('[data-word-options]')
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
        'local options enter animation reaches final opacity and translation',
    )
}

async function closeOptions(window) {
    await click(window, '[data-word-toolbar] button[aria-label="本模式设置"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-word-options]'),
        'local options close',
    )
}

async function visitMode(window, origin, mode) {
    await resetToolbarCache(window, origin, waitForToolbarResources)
    await window.loadURL(
        origin + '/practice/?demo=word-basic&mode=' + mode + '&keep=word-toolbar-smoke',
    )
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            Boolean(document.querySelector('[data-word-toolbar]')),
        'route ' + mode,
        mode,
    )
    assert.equal(
        await evaluate(window, () =>
            document
                .querySelector('[data-word-toolbar] button[aria-label="本模式设置"]')
                ?.getAttribute('aria-expanded'),
        ),
        'false',
    )
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-word-options]'))),
        false,
    )
}

async function readRows(window) {
    return evaluate(window, () => {
        const panel = document.querySelector('[data-word-options]')
        const rows = panel?.querySelector('[data-practice-options-rows]') ?? panel
        return Array.from(rows?.children ?? [])
            .filter((element) => element.tagName === 'DIV')
            .map((element) => {
                const toggle = element.querySelector('[role="switch"]')
                if (toggle)
                    return [
                        toggle.getAttribute('aria-label'),
                        toggle.getAttribute('aria-checked') === 'true',
                    ]
                return [
                    '输入方式',
                    element.querySelector('button[aria-pressed="true"]')?.textContent.trim(),
                ]
            })
    })
}

async function measure(window) {
    return evaluate(window, () => {
        const box = (element) => {
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
                letterSpacing: style.letterSpacing,
                color: style.color,
                background: style.backgroundColor,
                cursor: style.cursor,
            }
        }
        const toolbar = document.querySelector('[data-word-toolbar]')
        const options = document.querySelector('[data-word-options]')
        const optionRows = options?.querySelector('[data-practice-options-rows]') ?? options
        const rows = Array.from(optionRows?.children ?? []).filter(
            (element) => element.tagName === 'DIV',
        )
        const toggle = options?.querySelector('[role="switch"]')
        const track = toggle?.querySelector('[aria-hidden="true"]')
        const copy = options?.querySelector('[aria-label="输入方式"] button')
        const select = (label) => toolbar?.querySelector('button[aria-label^="' + label + '："]')
        const contentWidth = (element) => {
            if (!element) return null
            const style = getComputedStyle(element)
            const label =
                element.querySelector('.truncate') ?? element.querySelector(':scope > span')
            const range = document.createRange()
            if (label) range.selectNodeContents(label)
            return {
                text: label?.textContent.trim() ?? '',
                textWidth: label ? range.getBoundingClientRect().width : 0,
                padding: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
                border: parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
                arrowWidth:
                    element.querySelector(':scope > img')?.getBoundingClientRect().width ?? 0,
                inlineWidth: element.style.width,
            }
        }
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            timer: box(toolbar?.querySelector('[data-word-timer]')),
            timerText: box(toolbar?.querySelector('[data-word-timer] > span')),
            settings: box(toolbar?.querySelector('button[aria-label="本模式设置"]')),
            popover: box(options),
            popoverArrow: box(options?.querySelector(':scope > [aria-hidden="true"]')),
            rows: rows.map(box),
            switchLabel: box(toggle?.querySelector('span')),
            switchTrack: box(track),
            switchThumb: box(track?.firstElementChild),
            copy: box(copy),
            order: box(select('单词排序')),
            language: box(select('中英显示')),
            orderContent: contentWidth(select('单词排序')),
            languageContent: contentWidth(select('中英显示')),
            selectTextFits: Array.from(
                toolbar?.querySelectorAll('button[aria-haspopup="menu"] .truncate') ?? [],
            )
                .filter((element) => element.getClientRects().length > 0)
                .every((element) => element.scrollWidth <= element.clientWidth),
            phonetics: box(toolbar?.querySelector('[role="group"][aria-label="音标方案"]')),
            phoneticOptions: Array.from(
                toolbar?.querySelectorAll('[role="group"][aria-label="音标方案"] button') ?? [],
            ).map((element) => ({
                label: element.textContent.trim(),
                selected: element.getAttribute('aria-pressed') === 'true',
                box: box(element),
                content: contentWidth(element),
                textLines: (() => {
                    const text =
                        element.querySelector(':scope > span')?.firstChild ?? element.firstChild
                    if (!text || text.nodeType !== Node.TEXT_NODE) return 0
                    const range = document.createRange()
                    // 只测标签叶文本，避免Range同时返回inline包装盒和文字盒。
                    range.selectNodeContents(text)
                    return range.getClientRects().length
                })(),
            })),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            toolbarOverflow: toolbar
                ? toolbar.getBoundingClientRect().right > innerWidth + 1
                : true,
            brokenImages: Array.from(document.images)
                .filter((image) => image.complete && image.naturalWidth === 0)
                .map((image) => image.src),
        }
    })
}

function assertNear(actual, expected, label) {
    assert.ok(
        Math.abs(actual - expected) <= 0.1,
        label + ': expected ' + expected + ', got ' + actual,
    )
}

function assertReference(measured, definition) {
    const pronounce = definition.mode === 'pronounce'
    assert.deepEqual(measured.viewport, [1920, 1080])
    for (const [key, width, height] of [
        ['timer', 84, 26],
        ['settings', 26, 26],
    ]) {
        assertNear(measured[key].width, width, key + ' width')
        assertNear(measured[key].height, height, key + ' height')
    }
    assertNear(measured.timer.x, pronounce ? 12 : 16, 'timer x')
    assertNear(measured.timer.y, pronounce ? 96 : 95, 'timer y')
    assertNear(measured.settings.x, pronounce ? 108 : 112, 'settings x')
    assertNear(measured.settings.y, measured.timer.y, 'settings y')
    assertNear(
        measured.settings.x - measured.timer.x - measured.timer.width,
        12,
        'timer settings gap',
    )
    assertNear(measured.popover.x, pronounce ? 89 : 93, 'popover x')
    assertNear(measured.popover.y, pronounce ? 132 : 131, 'popover y')
    assertNear(measured.popover.width, 64, 'popover width')
    assertNear(measured.popover.height, definition.rows.length * 24, 'popover height')
    assertNear(measured.popoverArrow.width, 11, 'popover arrow wrapper width')
    assertNear(measured.popoverArrow.height, 6, 'popover arrow wrapper height')
    assert.equal(measured.rows.length, definition.rows.length)
    for (const row of measured.rows) assertNear(row.height, 24, 'option row height')
    assert.equal(measured.timerText.fontSize, '14px')
    assert.equal(measured.timerText.lineHeight, '20px')
    assert.equal(measured.timerText.fontWeight, '400')
    assert.equal(measured.switchLabel.fontSize, '12px')
    assert.equal(measured.switchLabel.lineHeight, '18px')
    assert.equal(measured.switchLabel.fontWeight, '400')
    assertNear(measured.switchTrack.width, 26, 'switch track width')
    assertNear(measured.switchTrack.height, 14, 'switch track height')
    assertNear(measured.switchThumb.width, 12, 'switch thumb width')
    assertNear(measured.switchThumb.height, 12, 'switch thumb height')
    if (definition.copy) {
        assertNear(measured.copy.width, 27, 'copy option width')
        assertNear(measured.copy.height, 16, 'copy option height')
        assertNear(measured.copy.x, measured.popover.x + 5, 'copy option x')
        assertNear(
            measured.copy.y,
            measured.popover.y + (definition.mode === 'typing' ? 29 : 5),
            'copy option y',
        )
        assert.equal(measured.copy.fontSize, '10px')
        assert.equal(measured.copy.lineHeight, '14px')
        assert.equal(measured.copy.fontWeight, '400')
    }
    if (pronounce) {
        assertNaturalWidth(measured.order, measured.orderContent, 'order')
        assertNear(measured.order.height, 26, 'order height')
        assertNaturalWidth(measured.language, measured.languageContent, 'language')
        assertNear(measured.language.height, 26, 'language height')
        assertNear(
            measured.order.x - measured.settings.x - measured.settings.width,
            12,
            'order gap',
        )
        assertNear(
            measured.language.x - measured.order.x - measured.order.width,
            12,
            'language gap',
        )
        assert.equal(measured.order.fontSize, '14px')
        assert.equal(measured.order.lineHeight, '20px')
        assert.equal(measured.order.fontWeight, '400')
    } else assert.equal(measured.order, null)
    if (pronounce || definition.mode === 'spell') {
        assertNear(measured.phonetics.height, 26, 'phonetics height')
        for (const option of measured.phoneticOptions)
            assertNaturalWidth(option.box, option.content, option.label)
        assert.deepEqual(
            measured.phoneticOptions.map((option) => option.label),
            definition.mode === 'spell'
                ? ['音节拆分', '原始音标', '自然拼读', '无音标']
                : ['原始音标', '音节拆分', '自然拼读', '无音标'],
        )
        assert.deepEqual(
            measured.phoneticOptions
                .filter((option) => option.selected)
                .map((option) => option.label),
            [definition.mode === 'spell' ? '音节拆分' : '原始音标'],
        )
    } else assert.equal(measured.phonetics, null)
    assert.equal(measured.horizontalOverflow, false)
    assert.equal(measured.brokenImages.length, 0)
    assert.equal(measured.settings.cursor, 'pointer')
    assert.equal(measured.selectTextFits, true, 'select labels remain complete')
    for (const option of measured.phoneticOptions)
        assert.equal(option.textLines, 1, option.label + ' stays on one line')
}

function assertNaturalWidth(box, content, label) {
    assert.equal(content.inlineWidth, '', label + ' has no inline fixed width')
    assert.ok(content.padding > 0, label + ' has horizontal padding')
    assertNear(
        box.width,
        content.textWidth + content.padding + content.border + content.arrowWidth,
        label + ' width follows text, arrow and horizontal padding',
    )
}

async function capture(window, path, toolbarOnly = false) {
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        const painted = () =>
            new Promise((resolveFrame) =>
                requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
            )
        await painted()
        const transitions = document
            .getAnimations()
            .filter(
                (animation) =>
                    animation.effect?.pseudoElement?.startsWith('::view-transition') ||
                    animation.animationName?.includes('view-transition'),
            )
        await Promise.allSettled(transitions.map((animation) => animation.finished))
        await painted()
    })
    await delay(100)
    const toolbarRegion = { x: 0, y: 80, width: 760, height: 210 }
    const captured = toolbarOnly
        ? await window.webContents.capturePage(toolbarRegion)
        : await window.webContents.capturePage()
    writeFileSync(resolve(path), captured.toPNG())
    if (!toolbarOnly && path.endsWith('-pc.png'))
        writeFileSync(
            resolve(path.replace(/-pc\.png$/, '-toolbar.png')),
            (await window.webContents.capturePage(toolbarRegion)).toPNG(),
        )
    return path
}

async function mouseClick(window, getPoint, ...args) {
    // 坐标来自CSS几何；不调用DOM.focus，以覆盖浏览器原生聚焦及summary默认展开。
    const point = await evaluate(window, getPoint, ...args)
    assert.ok(
        Number.isFinite(point.x) && Number.isFinite(point.y),
        'mouse target has real geometry',
    )
    window.webContents.focus()
    window.webContents.sendInputEvent({
        type: 'mouseMove',
        x: Math.round(point.x),
        y: Math.round(point.y),
    })
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        x: Math.round(point.x),
        y: Math.round(point.y),
        button: 'left',
        clickCount: 1,
    })
    window.webContents.sendInputEvent({
        type: 'mouseUp',
        x: Math.round(point.x),
        y: Math.round(point.y),
        button: 'left',
        clickCount: 1,
    })
    await delay(75)
}

async function mouseClickSummary(window) {
    // Test-owned native details preserves click-away/focus coverage after product demo tools removal.
    await evaluate(window, () => {
        if (document.querySelector('[data-toolbar-native-details]')) return
        const fixture = document.createElement('details')
        fixture.dataset.toolbarNativeDetails = ''
        Object.assign(fixture.style, {
            position: 'fixed',
            bottom: '110px',
            right: '12px',
            zIndex: '10',
        })
        const summary = document.createElement('summary')
        summary.textContent = '原生展开控件'
        fixture.append(summary)
        document.body.append(fixture)
    })
    await mouseClick(window, () => {
        const summary = document.querySelector('[data-toolbar-native-details] summary')
        if (!summary || summary.textContent.trim() !== '原生展开控件')
            throw new Error('Missing demonstration summary')
        const rect = summary.getBoundingClientRect()
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })
}

async function press(window, keyCode, modifiers = []) {
    const electronKey = { ArrowDown: 'Down', ArrowUp: 'Up', Enter: 'Return' }[keyCode] ?? keyCode
    window.webContents.focus()
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: electronKey, modifiers })
    // Electron的keydown/up只合成按键事件；原生按钮Enter激活还需要字符事件。
    if (keyCode === 'Enter')
        window.webContents.sendInputEvent({ type: 'char', keyCode: '\r', modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: electronKey, modifiers })
    await delay(75)
}

async function setTheme(window, origin, theme) {
    if (
        await evaluate(
            window,
            (expected) => document.documentElement.dataset.theme === expected,
            theme,
        )
    ) {
        await waitForImages(window, 'body', 'unchanged theme page images complete before returning')
        return
    }
    if (typeof waitForToolbarResources === 'function') await waitForToolbarResources(window)
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'light' ? '白天模式' : '夜间模式'
    await waitFor(
        window,
        (name) => {
            const input = document.querySelector('input[aria-label="' + name + '"]')
            return input !== null && !input.matches(':disabled')
        },
        'theme editor',
        label,
    )
    await click(window, 'input[aria-label="' + label + '"]')
    await waitFor(
        window,
        (expected) => document.documentElement.dataset.theme === expected,
        'theme ' + theme,
        theme,
    )
    await waitForImages(window, 'body', 'changed theme settings images complete before returning')
}

async function switchMode(window, definition) {
    await clickText(window, '模式', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-word-mode-selector]')),
        'word mode selector',
    )
    // 模式窗首次展开和切换预览都可能加载独立资源；加载完成前不关闭，保留严格资源失败检查。
    await waitForImages(window, '[role="dialog"]', 'initial mode selector images complete')
    await click(window, '[data-word-mode-option="' + definition.mode + '"]')
    await waitFor(
        window,
        (expected) => {
            const selector = document.querySelector('[data-word-mode-selector]')
            const preview = selector?.querySelector('[data-word-mode-preview]')
            return (
                selector?.getAttribute('data-word-mode-selected') === expected &&
                selector
                    .querySelector('[data-word-mode-option="' + expected + '"]')
                    ?.getAttribute('aria-pressed') === 'true' &&
                preview?.complete &&
                preview.naturalWidth > 0 &&
                preview.currentSrc === preview.src
            )
        },
        'selected mode preview complete ' + definition.mode,
        definition.mode,
    )
    await waitForImages(
        window,
        '[role="dialog"]',
        'selected mode selector images complete ' + definition.mode,
    )
    await clickText(window, '开始练习', '[role="dialog"]')
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            !document.querySelector('[role="dialog"]') &&
            Boolean(document.querySelector('[data-word-toolbar]')),
        'changed mode ' + definition.mode,
        definition.mode,
    )
    await waitForImages(window, 'body', 'changed mode page images complete ' + definition.mode)
}

async function checkStateLifetime(window, definition) {
    const hasInput = await evaluate(window, () =>
        Boolean(document.querySelector('input[aria-label="练习答案"]')),
    )
    if (hasInput) {
        await evaluate(window, () => {
            const input = document.querySelector('input[aria-label="练习答案"]')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                'toolbar draft',
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await waitFor(
            window,
            () => document.querySelector('input[aria-label="练习答案"]')?.value === 'toolbar draft',
            'input before local changes',
        )
    }
    for (const [name, value] of definition.rows) {
        if (name === '输入方式') {
            await clickText(
                window,
                value === '默写' ? '抄写' : '默写',
                '[data-word-options] [aria-label="输入方式"]',
            )
        } else {
            await click(window, '[data-word-options] [role="switch"][aria-label="' + name + '"]')
        }
    }
    const expected = definition.rows.map(([name, value]) => [
        name,
        typeof value === 'boolean' ? !value : value === '默写' ? '抄写' : '默写',
    ])
    await waitFor(
        window,
        (rows) => {
            const panel = document.querySelector('[data-word-options]')
            return rows.every(([name, value]) =>
                name === '输入方式'
                    ? panel
                          .querySelector('[aria-label="输入方式"] button[aria-pressed="true"]')
                          ?.textContent.trim() === value
                    : panel
                          .querySelector('[role="switch"][aria-label="' + name + '"]')
                          ?.getAttribute('aria-checked') === String(value),
            )
        },
        'all local choices update',
        expected,
    )
    assert.deepEqual(await readRows(window), expected)
    if (hasInput)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('input[aria-label="练习答案"]')?.value,
            ),
            'toolbar draft',
            'local choices preserve answer input',
        )
    if (definition.rows.some(([name]) => name === '图片'))
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector('main[aria-label="练习内容"] [data-practice-media]'),
                ),
            ),
            false,
            definition.mode + ' image switch hides real media',
        )
    if (definition.rows.some(([name]) => name === '翻译' || name === '中文'))
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        'main[aria-label="练习内容"] [data-practice-translation]',
                    ),
                ),
            ),
            false,
            definition.mode + ' translation switch hides real translation',
        )
    await closeOptions(window)
    const before = await evaluate(window, () => ({
        search: location.search,
        input: document.querySelector('input[aria-label="练习答案"]')?.value ?? null,
        progress: document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow'),
    }))
    await clickText(window, '设置', '[data-practice-header]')
    await waitFor(
        window,
        () =>
            Boolean(
                document.querySelector('[role="dialog"] [role="tablist"][aria-label="设置分类"]'),
            ),
        'full settings opens',
    )
    await waitForImages(window, '[role="dialog"]', 'full settings images complete before closing')
    await click(window, '[role="dialog"] button[aria-label="关闭对话框"]')
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'full settings closes')
    const after = await evaluate(window, () => ({
        search: location.search,
        input: document.querySelector('input[aria-label="练习答案"]')?.value ?? null,
        progress: document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow'),
    }))
    assert.deepEqual(
        after,
        before,
        definition.mode + ' full settings preserves input, URL and question',
    )
    await openOptions(window)
    assert.deepEqual(
        await readRows(window),
        expected,
        definition.mode + ' full settings preserves local options',
    )
    await closeOptions(window)
    await clickText(window, '下一题', '[data-practice-footer]')
    await waitFor(
        window,
        () =>
            document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow') ===
            '2',
        'next question',
    )
    await openOptions(window)
    assert.deepEqual(
        await readRows(window),
        expected,
        definition.mode + ' next question preserves local options',
    )
    await closeOptions(window)
    const alternate = modes.find((entry) => entry.mode !== definition.mode)
    await switchMode(window, alternate)
    await switchMode(window, definition)
    await openOptions(window)
    assert.deepEqual(
        await readRows(window),
        expected,
        definition.mode + ' reentry restores cached local options',
    )
    assert.equal(
        await evaluate(
            window,
            () => document.querySelector('input[aria-label="练习答案"]')?.value ?? '',
        ),
        '',
        'mode change clears round input',
    )
    await closeOptions(window)
    await reloadToolbarPage(window, waitForToolbarResources)
    await openOptions(window)
    assert.deepEqual(await readRows(window), expected, 'refresh restores cached local options')
    await closeOptions(window)
    return {
        fullSettingsPreservesInputUrlQuestion: true,
        questionChangePreservesOptions: true,
        modeChangeRestoresCachedOptions: true,
        refreshRestoresCachedOptions: true,
        inputChecked: hasInput,
    }
}

async function checkDismissal(window) {
    await openOptions(window)
    await press(window, 'Escape')
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-word-options]') &&
            document.activeElement?.getAttribute('aria-label') === '本模式设置',
        'options Escape focus return',
    )
    await openOptions(window)
    await evaluate(window, () =>
        document
            .querySelector('[data-practice-progress]')
            .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
    )
    await waitFor(
        window,
        () => !document.querySelector('[data-word-options]'),
        'outside closes options',
    )
    await openOptions(window)
    await press(window, 'Tab')
    await waitFor(
        window,
        () => !document.querySelector('[data-word-options]'),
        'Tab leaves single-row options',
    )
    await openOptions(window)
    await mouseClick(window, () => {
        const main = document.querySelector('main[aria-label="练习内容"]')
        if (!main) throw new Error('Missing practice content for real whitespace click')
        const rect = main.getBoundingClientRect()
        const left = Math.max(0, rect.left)
        const right = Math.min(innerWidth, rect.right)
        const top = Math.max(0, rect.top)
        const bottom = Math.min(innerHeight, rect.bottom)
        const excluded =
            'button,a,input,textarea,select,summary,[tabindex]:not([tabindex="-1"]),[contenteditable]:not([contenteditable="false"]),[role="button"],[data-word-options],[data-practice-toolbar],[data-word-deck]'
        for (const y of [top + 8, top + 24, top + 48, top + 80, (top + bottom) / 2, bottom - 8]) {
            for (const x of [right - 8, left + 8, right - 32, left + 32, (left + right) / 2]) {
                if (x <= left || x >= right || y <= top || y >= bottom) continue
                const target = document.elementFromPoint(x, y)
                if (target && main.contains(target) && !target.closest(excluded)) return { x, y }
            }
        }
        throw new Error('No visible noninteractive practice whitespace found for real mouse click')
    })
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-word-options]') &&
            document.activeElement?.getAttribute('aria-label') === '本模式设置',
        'real whitespace click returns options focus',
    )
    assert.equal(
        await evaluate(
            window,
            () => document.querySelector('[data-toolbar-native-details]')?.open ?? false,
        ),
        false,
    )
    await openOptions(window)
    await mouseClickSummary(window)
    await waitFor(
        window,
        () => {
            const summary = document.querySelector('[data-toolbar-native-details] summary')
            return (
                !document.querySelector('[data-word-options]') &&
                document.activeElement === summary &&
                summary.parentElement.open
            )
        },
        'real summary click closes options and preserves native focus and expansion',
    )
    await mouseClickSummary(window)
    await waitFor(
        window,
        () => !document.querySelector('[data-toolbar-native-details]').open,
        'summary closes demonstration details',
    )
    await openOptions(window)
    await mouseClick(window, () => {
        const previous = Array.from(
            document.querySelectorAll('[data-practice-footer] button'),
        ).find((button) => button.getAttribute('aria-label') === '上一题')
        if (!previous?.disabled)
            throw new Error('Previous question must be disabled at the first question')
        const rect = previous.getBoundingClientRect()
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-word-options]') &&
            document.activeElement?.getAttribute('aria-label') === '本模式设置',
        'disabled previous button returns options focus',
    )
    return {
        escapeRestoresFocus: true,
        pointerOutsideCloses: true,
        tabLeavesOptions: true,
        realWhitespaceClickRestoresFocus: true,
        summaryKeepsNativeFocusAndExpansion: true,
        disabledPreviousClickRestoresFocus: true,
    }
}

async function checkSelectors(window) {
    const order = '[data-word-toolbar] button[aria-label^="单词排序："]'
    const language = '[data-word-toolbar] button[aria-label^="中英显示："]'
    await openOptions(window)
    await click(window, order)
    let menu = await waitForSelect(window, '单词排序', true)
    await waitFor(
        window,
        () => !document.querySelector('[data-word-options]'),
        'order waits for replaced options exit animation',
    )
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-word-options]'))),
        false,
        'order replaces options',
    )
    assert.deepEqual(menu.items, ['正序', '乱序', 'A-Z'])
    await press(window, 'End')
    assert.equal(await evaluate(window, () => document.activeElement?.textContent.trim()), 'A-Z')
    await press(window, 'Home')
    assert.equal(await evaluate(window, () => document.activeElement?.textContent.trim()), '正序')
    await press(window, 'ArrowDown')
    assert.equal(await evaluate(window, () => document.activeElement?.textContent.trim()), '乱序')
    await press(window, 'ArrowUp')
    assert.equal(
        await evaluate(window, () => document.activeElement?.textContent.trim()),
        '正序',
        'ArrowUp focuses sequential before Enter selection',
    )
    await press(window, 'Enter')
    await waitForSelect(window, '单词排序', false)
    assert.equal(
        await evaluate(window, () => document.activeElement?.getAttribute('aria-label')),
        '单词排序：正序',
    )
    await click(window, order)
    await waitForSelect(window, '单词排序', true)
    await click(window, language)
    await waitForSelect(window, '单词排序', false)
    menu = await waitForSelect(window, '中英显示', true)
    assert.deepEqual(menu.items, ['中译英', '英译中', '中英显示'])
    const bilingualWidth = await evaluate(
        window,
        (selector) => document.querySelector(selector).getBoundingClientRect().width,
        language,
    )
    await clickText(window, '英译中', menu.selector)
    await waitForSelect(window, '中英显示', false)
    const interpretWidth = await evaluate(
        window,
        (selector) => document.querySelector(selector).getBoundingClientRect().width,
        language,
    )
    assert.ok(interpretWidth < bilingualWidth, 'shorter language label reduces the trigger width')
    await click(window, language)
    await waitForSelect(window, '中英显示', true)
    await press(window, 'Escape')
    await waitForSelect(window, '中英显示', false)
    assert.equal(
        await evaluate(window, () => document.activeElement?.getAttribute('aria-label')),
        '中英显示：英译中',
        'select Escape returns trigger focus',
    )
    await click(window, order)
    await waitForSelect(window, '单词排序', true)
    await press(window, 'Tab')
    await waitForSelect(window, '单词排序', false)
    await click(window, order)
    await waitForSelect(window, '单词排序', true)
    await evaluate(window, () =>
        document
            .querySelector('[data-practice-progress]')
            .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
    )
    await waitForSelect(window, '单词排序', false)
    await click(window, order)
    await waitForSelect(window, '单词排序', true)
    await mouseClickSummary(window)
    await waitForSelect(window, '单词排序', false)
    await waitFor(
        window,
        () => {
            const summary = document.querySelector('[data-toolbar-native-details] summary')
            return document.activeElement === summary && summary.parentElement.open
        },
        'real summary keeps native focus and expansion',
    )
    await mouseClickSummary(window)
    await waitFor(
        window,
        () => !document.querySelector('[data-toolbar-native-details]').open,
        'select test closes demonstration details',
    )
    await click(window, language)
    await waitForSelect(window, '中英显示', true)
    await openOptions(window)
    await waitForSelect(window, '中英显示', false)
    await closeOptions(window)
    await reloadToolbarPage(window, waitForToolbarResources)
    const persistedSelectors = await evaluate(
        window,
        (key) => ({
            order:
                document.querySelector(
                    '[data-word-toolbar] button[aria-label="单词排序：正序"]',
                ) !== null,
            language:
                document.querySelector(
                    '[data-word-toolbar] button[aria-label="中英显示：英译中"]',
                ) !== null,
            scope: JSON.parse(window.localStorage.getItem(key)).scopes['word:pronounce'],
        }),
        toolbarCacheKey,
    )
    assert.equal(persistedSelectors.order, true, 'refresh restores order selector')
    assert.equal(persistedSelectors.language, true, 'refresh restores language selector')
    assert.equal(persistedSelectors.scope.order, 'sequential')
    assert.equal(persistedSelectors.scope.language, 'interpret')
    return {
        menusMutuallyExclusive: true,
        orderedOptions: true,
        directionHomeEndEnter: true,
        escapeFocusReturn: true,
        tabAndOutsideClose: true,
        summaryKeepsNativeFocusAndExpansion: true,
        orderAndLanguagePersistAfterRefresh: true,
        triggerWidthFollowsSelectedText: { bilingualWidth, interpretWidth },
    }
}

async function checkPhonetics(window, mode) {
    for (const label of ['原始音标', '音节拆分', '自然拼读', '无音标']) {
        await clickText(window, label, '[data-word-toolbar] [role="group"][aria-label="音标方案"]')
        assert.deepEqual(
            await evaluate(window, () =>
                Array.from(
                    document.querySelectorAll(
                        '[data-word-toolbar] [role="group"][aria-label="音标方案"] button[aria-pressed="true"]',
                    ),
                ).map((element) => element.textContent.trim()),
            ),
            [label],
        )
    }
    if (mode === 'pronounce') {
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('main[aria-label="练习内容"] [data-practice-english]')
                    ?.textContent.trim(),
            ),
            'woman',
            'no phonetics retains primary word',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        'main[aria-label="练习内容"] [role="img"][aria-label="/ˈwʊmən/"]',
                    ),
                ),
            ),
            false,
        )
    } else {
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('input[aria-label="练习答案"]')),
            ),
            true,
            'no phonetics retains answer input',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        '[aria-label="单词拼写"] [role="img"][aria-label="/ˈwʊmən/"]',
                    ),
                ),
            ),
            false,
        )
    }
    await reloadToolbarPage(window, waitForToolbarResources)
    const restored = await evaluate(
        window,
        (key, currentMode) => ({
            selected: document
                .querySelector(
                    '[data-word-toolbar] [role="group"][aria-label="音标方案"] button[aria-pressed="true"]',
                )
                ?.getAttribute('data-highlight-key'),
            stored: JSON.parse(window.localStorage.getItem(key)).scopes['word:' + currentMode]
                ?.phonetics,
        }),
        toolbarCacheKey,
        mode,
    )
    assert.deepEqual(
        restored,
        { selected: 'none', stored: 'none' },
        'phonetic tab persists across actual refresh',
    )
    return {
        allFourChoicesControlled: true,
        noneKeepsPrimaryContent: true,
        phoneticTabPersistsAfterRefresh: true,
    }
}

async function highlightSnapshot(window, containerSelector, targetSelector, tone) {
    return evaluate(
        window,
        (containerQuery, targetQuery, expectedTone) => {
            const container = document.querySelector(containerQuery)
            const indicators = container?.querySelectorAll('[data-moving-highlight]') ?? []
            const indicator = container?.querySelector(
                '[data-moving-highlight][data-tone="' + expectedTone + '"]',
            )
            const target = container?.querySelector(targetQuery)
            const rect = (element) => {
                if (!element) return null
                const bounds = element.getBoundingClientRect()
                return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
            }
            const style = indicator ? getComputedStyle(indicator) : null
            return {
                count: indicators.length,
                activeCssTransitionCount: indicator
                    ? indicator
                          .getAnimations()
                          .filter(
                              (animation) =>
                                  animation instanceof CSSTransition &&
                                  (animation.playState === 'running' || animation.pending),
                          ).length
                    : 0,
                toneCount:
                    container?.querySelectorAll(
                        '[data-moving-highlight][data-tone="' + expectedTone + '"]',
                    ).length ?? 0,
                indicator: rect(indicator),
                target: rect(target),
                style: style
                    ? {
                          transform: style.transform,
                          transitionProperty: style.transitionProperty,
                          transitionDuration: style.transitionDuration,
                          pointerEvents: style.pointerEvents,
                          zIndex: style.zIndex,
                          borderWidth: style.borderTopWidth,
                          borderRadius: style.borderTopLeftRadius,
                          backgroundColor: style.backgroundColor,
                          childCount: indicator.childElementCount,
                      }
                    : null,
                textZIndex: target?.querySelector('span')
                    ? getComputedStyle(target.querySelector('span')).zIndex
                    : null,
                selected: Array.from(
                    container?.querySelectorAll('[aria-checked="true"], [aria-pressed="true"]') ??
                        [],
                ).map((element) => element.getAttribute('data-highlight-key')),
                viewport: [innerWidth, innerHeight],
                reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
            }
        },
        containerSelector,
        targetSelector,
        tone,
    )
}

function highlightMatches(snapshot) {
    return (
        snapshot.count === 1 &&
        snapshot.toneCount === 1 &&
        snapshot.indicator &&
        snapshot.target &&
        ['x', 'y', 'width', 'height'].every(
            (key) => Math.abs(snapshot.indicator[key] - snapshot.target[key]) < 0.3,
        )
    )
}

async function waitForHighlight(window, container, target, tone, description) {
    let snapshot
    for (let attempt = 0; attempt < 80; attempt++) {
        snapshot = await highlightSnapshot(window, container, target, tone)
        if (highlightMatches(snapshot)) return snapshot
        await delay(25)
    }
    assert.fail(description + ': ' + JSON.stringify(snapshot))
}

async function checkToolbarAnimations(window, origin, result) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const debuggerWasAttached = window.webContents.debugger.isAttached()
    if (!debuggerWasAttached) window.webContents.debugger.attach('1.3')
    const emulateMotion = async (value) => {
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value }],
        })
        await waitFor(
            window,
            (expected) =>
                matchMedia('(prefers-reduced-motion: reduce)').matches === (expected === 'reduce'),
            'animation media ' + value,
            value,
        )
    }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await emulateMotion('no-preference')
        await visitMode(window, origin, 'pronounce')
        await waitForImages(window, 'body', 'animation page images complete')
        const group = '[data-word-toolbar] [role="group"][aria-label="音标方案"]'
        const original = '[data-highlight-key="original"]'
        const phonics = '[data-highlight-key="phonics"]'
        const none = '[data-highlight-key="none"]'
        const initial = await waitForHighlight(
            window,
            group,
            original,
            'practice-outline',
            'initial outline follows committed choice',
        )
        result.initialOutline = initial
        assert.equal(initial.reducedMotion, false, 'normal-motion sampling is explicitly enabled')
        assert.equal(initial.style.borderWidth, '1px')
        assert.equal(initial.style.borderRadius, '4px')
        assert.equal(initial.style.backgroundColor, 'rgba(0, 0, 0, 0)')
        assert.equal(initial.style.childCount, 0, 'outline has no opaque inner fill')
        assert.equal(initial.style.pointerEvents, 'none')
        assert.equal(initial.style.zIndex, '10')
        assert.equal(initial.textZIndex, '20', 'label paints above the outline')
        assert.deepEqual(initial.selected, ['original'])

        const order = '[data-word-toolbar] button[aria-label^="单词排序："]'
        await click(window, order)
        const menu = (await waitForSelect(window, '单词排序', true)).selector
        const surfaceInitial = await waitForHighlight(
            window,
            menu,
            '[data-highlight-key="random"]',
            'surface',
            'menu initially highlights selected choice',
        )
        result.surface = { initial: surfaceInitial }
        assert.deepEqual(surfaceInitial.selected, ['random'])
        assert.equal(surfaceInitial.style.pointerEvents, 'none')
        assert.equal(surfaceInitial.style.zIndex, '10')
        assert.equal(surfaceInitial.textZIndex, '20')
        const pointer = await evaluate(
            window,
            (selector) => {
                const rect = document
                    .querySelector(selector + ' [data-highlight-key="sequential"]')
                    .getBoundingClientRect()
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
            },
            menu,
        )
        window.webContents.focus()
        window.webContents.sendInputEvent({
            type: 'mouseMove',
            x: Math.round(pointer.x),
            y: Math.round(pointer.y),
        })
        result.surface.hover = await waitForHighlight(
            window,
            menu,
            '[data-highlight-key="sequential"]',
            'surface',
            'pointer moves surface to hovered item',
        )
        assert.deepEqual(
            result.surface.hover.selected,
            ['random'],
            'hover must not commit selection',
        )
        await press(window, 'End')
        result.surface.keyboard = await waitForHighlight(
            window,
            menu,
            '[data-highlight-key="alphabetical"]',
            'surface',
            'keyboard focus moves the same surface',
        )
        assert.deepEqual(
            result.surface.keyboard.selected,
            ['random'],
            'keyboard focus alone must not commit selection',
        )
        await press(window, 'Escape')
        await waitForSelect(window, '单词排序', false)

        const beforeSlide = await waitForHighlight(
            window,
            group,
            original,
            'practice-outline',
            'outline stable before width-changing slide',
        )
        result.widthChangingSlide = { before: beforeSlide, frames: [] }
        await click(window, group + ' ' + none)
        // 从主进程分帧读取计算几何，避免隐藏测试窗口的requestAnimationFrame节流吞掉中间帧。
        for (let sample = 0; sample < 18; sample++) {
            await delay(20)
            result.widthChangingSlide.frames.push(
                await highlightSnapshot(window, group, none, 'practice-outline'),
            )
        }
        const afterSlide = await waitForHighlight(
            window,
            group,
            none,
            'practice-outline',
            'outline reaches narrower target',
        )
        result.widthChangingSlide.after = afterSlide
        assert.deepEqual(afterSlide.selected, ['none'])
        assert.notEqual(
            beforeSlide.target.width,
            afterSlide.target.width,
            'sample targets have different widths',
        )
        assert.ok(
            result.widthChangingSlide.frames.some(
                (frame) =>
                    frame.style &&
                    frame.style.transform !== beforeSlide.style.transform &&
                    frame.style.transform !== afterSlide.style.transform,
            ),
            'outline exposes an intermediate sliding transform',
        )
        const lowWidth = Math.min(beforeSlide.target.width, afterSlide.target.width)
        const highWidth = Math.max(beforeSlide.target.width, afterSlide.target.width)
        assert.ok(
            result.widthChangingSlide.frames.some(
                (frame) =>
                    frame.indicator &&
                    frame.indicator.width > lowWidth + 0.1 &&
                    frame.indicator.width < highWidth - 0.1,
            ),
            'outline width transitions between unequal targets',
        )
        for (const frame of result.widthChangingSlide.frames)
            assert.equal(frame.count, 1, 'slide keeps a single outline')

        result.rapidRetarget = { frames: [] }
        for (const target of [none, original, phonics]) {
            await click(window, group + ' ' + target)
            await delay(25)
            result.rapidRetarget.frames.push(
                await highlightSnapshot(window, group, target, 'practice-outline'),
            )
        }
        result.rapidRetarget.final = await waitForHighlight(
            window,
            group,
            phonics,
            'practice-outline',
            'rapid retarget lands on last choice',
        )
        assert.deepEqual(result.rapidRetarget.final.selected, ['phonics'])
        for (const frame of result.rapidRetarget.frames)
            assert.equal(frame.count, 1, 'retarget does not duplicate the outline')

        await emulateMotion('reduce')
        await click(window, group + ' ' + original)
        result.reducedMotion = await waitForHighlight(
            window,
            group,
            original,
            'practice-outline',
            'reduced-motion outline reaches selected item',
        )
        assert.equal(result.reducedMotion.reducedMotion, true)
        assert.equal(result.reducedMotion.style.transitionProperty, 'none')
        assert.equal(
            result.reducedMotion.activeCssTransitionCount,
            0,
            'reduced motion has no active CSS transitions',
        )
        await emulateMotion('no-preference')

        result.reflow = []
        window.setContentSize(1440, 900)
        await waitFor(
            window,
            () => innerWidth === 1440 && innerHeight === 900,
            'animation resized CSS viewport',
        )
        result.reflow.push({
            width: 1440,
            measured: await waitForHighlight(
                window,
                group,
                original,
                'practice-outline',
                'resized outline matches selected item',
            ),
        })
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(2)
        await waitFor(
            window,
            () => innerWidth === 960 && innerHeight === 540,
            'animation real zoom CSS viewport',
        )
        result.reflow.push({
            zoom: 2,
            measured: await waitForHighlight(
                window,
                group,
                original,
                'practice-outline',
                'real zoom outline matches selected item',
            ),
        })
        window.webContents.setZoomFactor(1)
        await waitFor(
            window,
            () => innerWidth === 1920 && innerHeight === 1080,
            'animation restored CSS viewport',
        )
        result.reflow.push({
            zoom: 1,
            measured: await waitForHighlight(
                window,
                group,
                original,
                'practice-outline',
                'restored zoom outline matches selected item',
            ),
        })
        result.status = 'passed'
    } finally {
        try {
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
        } finally {
            if (!debuggerWasAttached && window.webContents.debugger.isAttached())
                window.webContents.debugger.detach()
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
        }
    }
}

async function responsiveSnapshot(window) {
    return evaluate(window, () => {
        const toolbar = document.querySelector('[data-word-toolbar]')
        const scroll = toolbar?.querySelector('[data-word-toolbar-scroll]')
        const group = toolbar?.querySelector('[role="group"][aria-label="音标方案"]')
        const select = toolbar?.querySelector('button[aria-label^="音标方案："]')
        const visible = (element) => Boolean(element && element.getClientRects().length > 0)
        const box = (element) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                right: rect.right,
            }
        }
        const controls = [
            toolbar?.querySelector('[data-word-timer]'),
            toolbar?.querySelector('button[aria-label="本模式设置"]'),
            toolbar?.querySelector('button[aria-label^="单词排序："]'),
            toolbar?.querySelector('button[aria-label^="中英显示："]'),
            visible(select) ? select : group,
        ].filter(visible)
        return {
            viewport: [innerWidth, innerHeight],
            pageWidth: document.documentElement.scrollWidth,
            scroll: box(scroll),
            scrollWidth: scroll?.scrollWidth ?? null,
            scrollClientWidth: scroll?.clientWidth ?? null,
            scrollLeft: scroll?.scrollLeft ?? null,
            overflowX: scroll ? getComputedStyle(scroll).overflowX : null,
            flexWrap: scroll ? getComputedStyle(scroll).flexWrap : null,
            groupVisible: visible(group),
            selectVisible: visible(select),
            selectLabel: select?.getAttribute('aria-label') ?? null,
            originalCardPhoneticVisible: Boolean(
                document.querySelector(
                    'main[aria-label="练习内容"] [role="img"][aria-label="/ˈwʊmən/"]',
                ),
            ),
            groupSelected: group
                ?.querySelector('[aria-pressed="true"]')
                ?.getAttribute('data-highlight-key'),
            controls: controls.map((element) => ({
                label: element.getAttribute('aria-label') ?? element.textContent.trim(),
                box: box(element),
            })),
            selectTextFits: Array.from(toolbar?.querySelectorAll('.truncate') ?? [])
                .filter(visible)
                .every((element) => element.scrollWidth <= element.clientWidth),
        }
    })
}

async function linkedMenuGeometry(window, label) {
    return evaluate(
        window,
        (name) => {
            const trigger = document.querySelector(
                '[data-word-toolbar] button[aria-label^="' + name + '："]',
            )
            const id = trigger?.getAttribute('aria-controls')
            const menu = id ? document.getElementById(id) : null
            if (!menu) throw new Error('Missing aria-controls linked menu: ' + name)
            const rect = menu.getBoundingClientRect()
            const items = Array.from(menu.querySelectorAll('[role="menuitemradio"]'))
            return {
                portal: menu.parentElement === document.body,
                position: getComputedStyle(menu).position,
                insideViewport:
                    rect.left >= 0 &&
                    rect.right <= innerWidth + 1 &&
                    rect.top >= 0 &&
                    rect.bottom <= innerHeight + 1,
                outsideScrollContainer: !menu.closest('[data-word-toolbar-scroll]'),
                itemsHittable: items.every((item) => {
                    const box = item.getBoundingClientRect()
                    return item.contains(
                        document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
                    )
                }),
                geometry: {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                },
            }
        },
        label,
    )
}

function assertOneRow(snapshot, width, mode) {
    assert.equal(snapshot.viewport[0], width)
    assert.ok(
        snapshot.pageWidth <= width + 1,
        mode + ' page has no horizontal overflow at ' + width,
    )
    assert.equal(snapshot.flexWrap, 'nowrap', mode + ' toolbar does not wrap at ' + width)
    assert.ok(
        ['auto', 'scroll'].includes(snapshot.overflowX),
        'only toolbar allows local horizontal scrolling',
    )
    assert.equal(snapshot.selectTextFits, true, mode + ' dropdown labels remain complete')
    assert.equal(snapshot.groupVisible, width >= 768, 'tablet retains the phonetic button group')
    assert.equal(snapshot.selectVisible, width < 768, 'phone substitutes the phonetic dropdown')
    const top = snapshot.controls[0]?.box.y
    for (const control of snapshot.controls)
        assertNear(
            control.box.y,
            top,
            mode + ' ' + control.label + ' stays on the same row at ' + width,
        )
    if (width === 390) {
        assert.ok(
            snapshot.scrollWidth <= snapshot.scrollClientWidth + 1,
            '390px longest choices fit without local scrolling',
        )
        for (const control of snapshot.controls) {
            assert.ok(
                control.box.x >= snapshot.scroll.x - 1,
                '390px control is fully visible on the left',
            )
            assert.ok(
                control.box.right <= snapshot.scroll.right + 1,
                '390px control is fully visible on the right',
            )
        }
    }
    if (width === 320 && mode === 'pronounce')
        assert.ok(
            snapshot.scrollWidth > snapshot.scrollClientWidth,
            '320px keeps readable controls in a locally scrollable row',
        )
}

async function checkResponsiveToolbar(
    window,
    origin,
    result = { layouts: [], mobileChoices: [], portalMenus: [], breakpoint: null },
) {
    const priorMinimumSize = window.getMinimumSize()
    window.setMinimumSize(0, 0)
    try {
        window.webContents.setZoomFactor(1)
        for (const mode of ['pronounce', 'spell']) {
            let tabletCardPhoneticVisible = false
            for (const width of [768, 390, 320]) {
                window.setContentSize(width, 900)
                await visitMode(window, origin, mode)
                await waitFor(
                    window,
                    (expected) => innerWidth === expected,
                    'responsive CSS viewport',
                    width,
                )
                const snapshot = await responsiveSnapshot(window)
                result.layouts.push({ mode, width, snapshot })
                assertOneRow(snapshot, width, mode)
                if (width >= 768) {
                    tabletCardPhoneticVisible = snapshot.originalCardPhoneticVisible
                    if (mode === 'pronounce')
                        assert.equal(
                            tabletCardPhoneticVisible,
                            true,
                            'pronounce baseline shows card phonetics',
                        )
                    continue
                }

                const phonetic = '[data-word-toolbar] button[aria-label^="音标方案："]'
                await click(window, phonetic)
                let menu = await waitForSelect(window, '音标方案', true)
                assert.deepEqual(
                    menu.items,
                    mode === 'spell'
                        ? ['音节拆分', '原始音标', '自然拼读', '无音标']
                        : ['原始音标', '音节拆分', '自然拼读', '无音标'],
                )
                let geometry = await linkedMenuGeometry(window, '音标方案')
                assert.equal(geometry.portal, true)
                assert.equal(geometry.position, 'fixed')
                assert.equal(geometry.outsideScrollContainer, true)
                assert.equal(geometry.insideViewport, true)
                assert.equal(
                    geometry.itemsHittable,
                    true,
                    'local horizontal scroller does not clip phonetic choices',
                )
                result.portalMenus.push({ mode, width, label: '音标方案', geometry })
                await press(window, 'Escape')
                await waitForSelect(window, '音标方案', false)
                assert.match(
                    await evaluate(
                        window,
                        () => document.activeElement?.getAttribute('aria-label') ?? '',
                    ),
                    /^音标方案：/,
                )
                for (const [value, label] of [
                    ['none', '无音标'],
                    ['original', '原始音标'],
                    ['syllables', '音节拆分'],
                    ['phonics', '自然拼读'],
                    ['none', '无音标'],
                ]) {
                    await click(window, phonetic)
                    menu = await waitForSelect(window, '音标方案', true)
                    await clickText(window, label, menu.selector)
                    await waitForSelect(window, '音标方案', false)
                    const choice = await evaluate(
                        window,
                        (key, currentMode) => ({
                            label: document
                                .querySelector(
                                    '[data-word-toolbar] button[aria-label^="音标方案："]',
                                )
                                ?.getAttribute('aria-label'),
                            desktop: document
                                .querySelector(
                                    '[data-word-toolbar] [role="group"][aria-label="音标方案"] button[aria-pressed="true"]',
                                )
                                ?.getAttribute('data-highlight-key'),
                            stored: JSON.parse(window.localStorage.getItem(key)).scopes[
                                'word:' + currentMode
                            ]?.phonetics,
                            originalPhoneticVisible: Boolean(
                                document.querySelector(
                                    'main[aria-label="练习内容"] [role="img"][aria-label="/ˈwʊmən/"]',
                                ),
                            ),
                        }),
                        toolbarCacheKey,
                        mode,
                    )
                    assert.equal(choice.label, '音标方案：' + label)
                    assert.equal(
                        choice.desktop,
                        value,
                        'mobile and desktop consume the same committed choice',
                    )
                    assert.equal(
                        choice.stored,
                        value,
                        'mobile choice uses the existing preference cache',
                    )
                    if (value === 'none')
                        assert.equal(
                            choice.originalPhoneticVisible,
                            false,
                            'none hides card phonetics without hiding the word',
                        )
                    if (value === 'original')
                        assert.equal(
                            choice.originalPhoneticVisible,
                            mode === 'pronounce' ? true : tabletCardPhoneticVisible,
                            'original preserves the mode existing card phonetic visibility gate on the phone',
                        )
                    result.mobileChoices.push({ mode, width, value, choice })
                }
                await reloadToolbarPage(window, waitForToolbarResources)
                assert.equal(
                    (await responsiveSnapshot(window)).selectLabel,
                    '音标方案：无音标',
                    'refresh preserves the mobile choice',
                )
                await click(window, phonetic)
                await waitForSelect(window, '音标方案', true)
                await openOptions(window)
                await waitForSelect(window, '音标方案', false)
                assert.equal(
                    await evaluate(window, () => {
                        const panel = document.querySelector('[data-word-options]')
                        if (!panel || panel.closest('[data-word-toolbar-scroll]')) return false
                        const switchButton = panel.querySelector('[role="switch"]')
                        const rect = switchButton?.getBoundingClientRect()
                        return Boolean(
                            rect &&
                            switchButton.contains(
                                document.elementFromPoint(
                                    rect.x + rect.width / 2,
                                    rect.y + rect.height / 2,
                                ),
                            ),
                        )
                    }),
                    true,
                    'settings popover remains outside the clipped scroller and can be hit',
                )
                await click(window, phonetic)
                await waitForSelect(window, '音标方案', true)
                await waitFor(
                    window,
                    () => !document.querySelector('[data-word-options]'),
                    'phonetic menu replaces local settings',
                )
                if (mode === 'pronounce') {
                    await click(window, '[data-word-toolbar] button[aria-label^="单词排序："]')
                    await waitForSelect(window, '音标方案', false)
                    await waitForSelect(window, '单词排序', true)
                    geometry = await linkedMenuGeometry(window, '单词排序')
                    assert.equal(geometry.itemsHittable, true)
                    assert.equal(geometry.outsideScrollContainer, true)
                    result.portalMenus.push({ mode, width, label: '单词排序', geometry })
                    await press(window, 'Escape')
                    await waitForSelect(window, '单词排序', false)
                } else {
                    await press(window, 'Escape')
                    await waitForSelect(window, '音标方案', false)
                }
                if (width === 320 && mode === 'pronounce') {
                    const scrolled = await evaluate(window, () => {
                        const scroll = document.querySelector('[data-word-toolbar-scroll]')
                        scroll.scrollLeft = scroll.scrollWidth
                        return scroll.scrollLeft
                    })
                    assert.ok(scrolled > 0, '320px toolbar can scroll independently')
                    await click(window, phonetic)
                    await waitForSelect(window, '音标方案', true)
                    const afterScroll = await linkedMenuGeometry(window, '音标方案')
                    assert.equal(
                        afterScroll.itemsHittable,
                        true,
                        'menu remains usable after local horizontal scrolling',
                    )
                    await press(window, 'Escape')
                    await waitForSelect(window, '音标方案', false)
                }
            }
        }
        window.setContentSize(390, 900)
        await visitMode(window, origin, 'pronounce')
        await click(window, '[data-word-toolbar] button[aria-label^="音标方案："]')
        await waitForSelect(window, '音标方案', true)
        window.setContentSize(768, 900)
        await waitForSelect(window, '音标方案', false)
        result.breakpoint = await responsiveSnapshot(window)
        assert.equal(result.breakpoint.groupVisible, true)
        assert.equal(result.breakpoint.selectVisible, false)
        assert.equal(
            result.breakpoint.groupSelected,
            'original',
            'changing breakpoint retains the chosen phonetic value',
        )
        window.setContentSize(1920, 1080)
        return result
    } finally {
        window.setMinimumSize(...priorMinimumSize)
    }
}

async function runWordToolbarResponsiveChecks(window, origin, label, waitForNetworkIdle) {
    const priorResourceWaiter = waitForToolbarResources
    waitForToolbarResources = waitForNetworkIdle
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    let originalTheme
    let originalToolbarCache
    const result = {
        label,
        status: 'running',
        checks: { layouts: [], mobileChoices: [], portalMenus: [], breakpoint: null },
        limitations: ['本专项自动验证响应式几何及交互；平板/H5视觉和真机兼容待用户验收'],
    }
    try {
        originalToolbarCache = await readToolbarCache(window, origin)
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        window.webContents.setZoomFactor(1)
        await setTheme(window, origin, 'dark')
        await checkResponsiveToolbar(window, origin, result.checks)
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failure = {
                url: await evaluate(window, () => location.href),
                snapshot: await responsiveSnapshot(window),
                activeElement: await evaluate(window, () => {
                    const element = document.activeElement
                    return element
                        ? {
                              nodeName: element.nodeName,
                              label: element.getAttribute('aria-label'),
                              markup: element.outerHTML.slice(0, 1000),
                          }
                        : null
                }),
            }
            result.failureScreenshot = await capture(
                window,
                'dist/word-toolbar-responsive-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError =
                diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)
        }
        throw error
    } finally {
        try {
            window.webContents.setZoomFactor(1)
            window.setContentSize(1920, 1080)
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            try {
                await restoreToolbarCache(window, originalToolbarCache)
            } finally {
                window.webContents.setZoomFactor(priorZoom)
                window.setContentSize(...priorSize)
                waitForToolbarResources = priorResourceWaiter
                writeFileSync(
                    resolve(
                        'dist/word-toolbar-responsive-' + label.toLowerCase() + '-validation.json',
                    ),
                    JSON.stringify(result, null, 4),
                )
            }
        }
    }
}

async function runWordToolbarChecks(window, origin, label, waitForNetworkIdle) {
    waitForToolbarResources = waitForNetworkIdle
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
    let originalToolbarCache
    const result = {
        label,
        status: 'running',
        modes: [],
        businessRequests,
        permissionRequests,
        limitations: [
            '排序、切读及缺失数据的音标方案仍为本地演示选择；计时仅本轮用时，不上报正式学习记录，无真实题库、判题、音源或录音评分',
            '切题保持局部设置；输入仍遵守既有单题会话重置规则',
            'PC计算样式、几何与重排由本脚本覆盖，平板/H5视觉和真机兼容待用户验收',
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
        originalToolbarCache = await readToolbarCache(window, origin)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        await setTheme(window, origin, 'dark')
        for (const definition of modes) {
            await visitMode(window, origin, definition.mode)
            await openOptions(window)
            assert.deepEqual(
                await readRows(window),
                definition.rows,
                definition.mode + ' row order and defaults',
            )
            const reference = await measure(window)
            assertReference(reference, definition)
            const screenshot = await capture(
                window,
                'dist/word-toolbar-' + label.toLowerCase() + '-' + definition.mode + '-pc.png',
            )
            const lifetime = await checkStateLifetime(window, definition)
            const entry = {
                mode: definition.mode,
                reference,
                screenshot,
                toolbarScreenshot: screenshot.replace(/-pc\.png$/, '-toolbar.png'),
                lifetime,
            }
            if (definition.mode === 'pronounce') {
                entry.dismissal = await checkDismissal(window)
                entry.selectors = await checkSelectors(window)
            }
            if (definition.mode === 'pronounce' || definition.mode === 'spell')
                entry.phonetics = await checkPhonetics(window, definition.mode)
            result.modes.push(entry)
        }
        result.animations = { status: 'running' }
        await checkToolbarAnimations(window, origin, result.animations)
        await setTheme(window, origin, 'light')
        result.lightTheme = []
        for (const definition of modes) {
            await visitMode(window, origin, definition.mode)
            await openOptions(window)
            const reference = await measure(window)
            assertReference(reference, definition)
            assert.equal(reference.theme, 'light')
            const toolbarScreenshot = await capture(
                window,
                'dist/word-toolbar-' +
                    label.toLowerCase() +
                    '-light-' +
                    definition.mode +
                    '-toolbar.png',
                true,
            )
            result.lightTheme.push({ mode: definition.mode, reference, toolbarScreenshot })
            await closeOptions(window)
        }
        await setTheme(window, origin, 'dark')
        result.pcReflow = []
        result.pageZoom = []
        for (const mode of ['pronounce', 'dictate']) {
            await visitMode(window, origin, mode)
            await openOptions(window)
            for (const width of [1280, 1440, 2560]) {
                window.setContentSize(width, 900)
                await delay(75)
                const measured = await measure(window)
                assert.equal(measured.horizontalOverflow, false, mode + ' PC overflow ' + width)
                assert.equal(measured.toolbarOverflow, false, mode + ' toolbar overflow ' + width)
                result.pcReflow.push({ mode, width, measured })
            }
            window.setContentSize(1920, 1080)
            for (const factor of [1.25, 1.5, 2]) {
                window.webContents.setZoomFactor(factor)
                await delay(75)
                const measured = await measure(window)
                assert.equal(
                    measured.horizontalOverflow,
                    false,
                    mode + ' real zoom overflow ' + factor,
                )
                assert.equal(
                    measured.toolbarOverflow,
                    false,
                    mode + ' zoom toolbar overflow ' + factor,
                )
                result.pageZoom.push({ mode, factor, measured })
            }
            window.webContents.setZoomFactor(1)
            await closeOptions(window)
        }
        result.responsive = await checkResponsiveToolbar(window, origin)
        assert.deepEqual(businessRequests, [], 'word toolbar sends no business requests')
        assert.deepEqual(permissionRequests, [], 'word toolbar requests no microphone permission')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failure = await evaluate(window, () => ({
                url: location.href,
                activeElement: document.activeElement
                    ? {
                          nodeName: document.activeElement.nodeName,
                          label: document.activeElement.getAttribute('aria-label'),
                          markup: document.activeElement.outerHTML.slice(0, 1000),
                      }
                    : null,
                selects: Array.from(
                    document.querySelectorAll('[data-word-toolbar] button[aria-haspopup="menu"]'),
                ).map((element) => ({
                    label: element.getAttribute('aria-label'),
                    expanded: element.getAttribute('aria-expanded'),
                    text: element.textContent.trim(),
                })),
                visibleMenus: Array.from(
                    document.querySelectorAll('[data-word-toolbar] button[aria-controls]'),
                )
                    .map((trigger) =>
                        document.getElementById(trigger.getAttribute('aria-controls')),
                    )
                    .filter((menu) => menu?.getAttribute('aria-hidden') === 'false')
                    .map((menu) => ({
                        id: menu.id,
                        items: Array.from(menu.querySelectorAll('[role="menuitemradio"]')).map(
                            (element) => ({
                                text: element.textContent.trim(),
                                checked: element.getAttribute('aria-checked'),
                                focused: element === document.activeElement,
                            }),
                        ),
                    })),
                keyEvents: window.wordToolbarKeyTrace ?? [],
            }))
            result.failure.responsive = await responsiveSnapshot(window)
            result.failureScreenshot = await capture(
                window,
                'dist/word-toolbar-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError =
                diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            await restoreToolbarCache(window, originalToolbarCache)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/word-toolbar-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runWordToolbarChecks, runWordToolbarResponsiveChecks }
