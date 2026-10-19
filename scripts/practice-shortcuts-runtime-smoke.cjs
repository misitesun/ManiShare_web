const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

// Independent Figma inventory and confirmed keyboard contract; never derive expectations
// from the production footer/shortcut models.
const previous = 'previous'
const next = 'next'
const navigation = 'navigation'
const read = 'read-aloud'
const mastered = 'mastered'
const unfamiliar = 'unfamiliar'
const panel = 'panel'
const primary = 'primary'
const input = 'input'
const contextual = 'contextual'
const reading = [previous, 'playback', next]
const typing = [previous, read, navigation, next]
const ordinaryOral = [previous, mastered, read, primary, unfamiliar, navigation, next]
const ordinaryTranslate = [
    previous,
    input,
    mastered,
    read,
    primary,
    panel,
    unfamiliar,
    navigation,
    next,
]
const ordinaryCheck = [previous, mastered, read, primary, unfamiliar, navigation, next]
const ordinaryBlocks = [previous, mastered, read, panel, unfamiliar, navigation, next]
const ordinaryListen = [previous, mastered, read, contextual, panel, unfamiliar, navigation, next]
const mediaOral = [previous, read, primary, navigation, next]
const mediaTranslate = [previous, input, read, primary, panel, navigation, next]
const mediaCheck = [previous, read, primary, navigation, next]
const mediaBlocks = [previous, read, panel, navigation, next]
const families = [
    {
        family: 'word',
        demo: 'word-basic',
        modes: {
            pronounce: [previous, mastered, read, contextual, unfamiliar, navigation, next],
            spell: [previous, mastered, read, primary, panel, unfamiliar, navigation, next],
            dictate: [previous, mastered, read, primary, panel, unfamiliar, navigation, next],
            meaning: [previous, input, mastered, read, panel, unfamiliar, navigation, next],
            typing,
            oral: ordinaryOral,
        },
    },
    {
        family: 'sentence',
        demo: 'sentence-basic',
        modes: {
            listen: ordinaryListen,
            read: reading,
            translate: ordinaryTranslate,
            check: ordinaryCheck,
            typing,
            oral: ordinaryOral,
            blocks: ordinaryBlocks,
        },
    },
    {
        family: 'audio',
        demo: 'audio-basic',
        modes: {
            listen: [previous, read, contextual, panel, navigation, next],
            read: reading,
            translate: mediaTranslate,
            check: mediaCheck,
            typing,
            oral: mediaOral,
            blocks: mediaBlocks,
        },
    },
    {
        family: 'video',
        demo: 'video-basic',
        modes: {
            listen: [],
            translate: mediaTranslate,
            check: mediaCheck,
            typing,
            oral: mediaOral,
            blocks: mediaBlocks,
        },
    },
    {
        family: 'picture',
        demo: 'picture-basic',
        modes: {
            listen: [previous, mastered, read, panel, unfamiliar, navigation, next],
            translate: ordinaryTranslate,
            typing,
            oral: ordinaryOral,
        },
    },
    { family: 'typing', demo: 'typing-basic', modes: { typing: [previous, navigation, next] } },
    {
        family: 'phonetics',
        demo: 'phonetics-basic',
        modes: {
            pronounce: [previous, read, panel, navigation, next],
            oral: mediaOral,
        },
    },
    {
        family: 'guess',
        demo: 'guess-basic',
        modes: {
            guess: [previous, read, navigation, next],
            read: reading,
            spell: [previous, read, primary, panel, navigation, next],
        },
    },
    { family: 'audio-reader', demo: 'audio-reader', modes: { read: [] } },
    { family: 'video-reader', demo: 'video-reader', modes: { read: [] } },
    {
        family: 'picture-reader',
        demo: 'picture-reader',
        modes: { read: [previous, contextual, next] },
    },
    { family: 'text-reader', demo: 'text-reader', modes: { read: [] } },
]
const defaults = {
    朗读: 'Shift + L',
    掌握: 'Shift + J',
    不熟: 'Shift + K',
    上一题: 'Shift + ArrowLeft',
    下一题: 'Shift + ArrowRight',
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
        await delay(60)
    }
    throw new Error('Timed out: practice shortcuts ' + description)
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'images ready',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function beforeNavigation(window, waitForResources) {
    await settle(window)
    if (typeof waitForResources === 'function') await waitForResources(window)
}

function configuration(family) {
    const found = families.find((item) => item.family === family)
    assert.ok(found, 'known smoke family ' + family)
    return found
}

async function visit(window, origin, family, mode, waitForResources) {
    await beforeNavigation(window, waitForResources)
    await window.loadURL(
        origin +
            '/practice/?demo=' +
            configuration(family).demo +
            '&mode=' +
            mode +
            '&keep=shortcut-smoke',
    )
    await waitFor(
        window,
        (expected) =>
            document.querySelector('main[data-toolbar-ready="true"]') &&
            document.querySelector('[data-practice-phase]') &&
            new URLSearchParams(location.search).get('mode') === expected,
        'hydrated ' + family + ':' + mode,
        mode,
    )
    await settle(window)
}

async function focusContent(window) {
    await evaluate(window, () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    window.webContents.focus()
}

function electronKeyCode(key) {
    return { ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down' }[key] ?? key
}

async function lastKeySnapshot(window) {
    return evaluate(window, () => {
        const event = window.__practiceShortcutSmokeLastKey
        if (!event) return null
        return {
            sequence: window.__practiceShortcutSmokeKeySequence,
            key: event.key,
            code: event.code,
            keyCode: event.keyCode,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            repeat: event.repeat,
            isComposing: event.isComposing,
            defaultPrevented: event.defaultPrevented,
            target:
                event.target instanceof HTMLElement
                    ? {
                          tag: event.target.tagName,
                          label: event.target.getAttribute('aria-label'),
                          action: event.target.getAttribute('data-practice-footer-action'),
                      }
                    : null,
        }
    })
}

async function keyDown(window, key, modifiers = []) {
    const priorSequence = await evaluate(window, () => {
        if (!window.__practiceShortcutSmokeKeyAudit) {
            window.__practiceShortcutSmokeKeyAudit = true
            window.__practiceShortcutSmokeKeySequence = 0
            window.addEventListener(
                'keydown',
                (event) => {
                    window.__practiceShortcutSmokeKeySequence += 1
                    window.__practiceShortcutSmokeLastKey = event
                },
                true,
            )
        }
        window.__practiceShortcutSmokeLastKey = null
        return window.__practiceShortcutSmokeKeySequence
    })
    window.webContents.focus()
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: electronKeyCode(key), modifiers })
    await waitFor(
        window,
        (sequence) =>
            Boolean(window.__practiceShortcutSmokeLastKey) &&
            window.__practiceShortcutSmokeKeySequence > sequence,
        'this native keydown arrives ' + key,
        priorSequence,
    )
    const received = await lastKeySnapshot(window)
    assert.ok(received.sequence > priorSequence, 'received this sendInputEvent, not a stale key')
    const expectedKey = key === 'Space' ? ' ' : key
    assert.equal(
        received?.key?.toLowerCase(),
        expectedKey.toLowerCase(),
        'native key must reach DOM as requested: ' + JSON.stringify(received),
    )
    const prevented = received.defaultPrevented
    // Electron keyDown/keyUp alone omit native keypress/button activation and text insertion.
    // A consumed keydown must not be followed by an artificial char event.
    if (
        !prevented &&
        !modifiers.some((modifier) => ['control', 'alt', 'meta'].includes(modifier))
    ) {
        const character =
            key === 'Enter'
                ? '\r'
                : key === 'Space'
                  ? ' '
                  : key.length === 1
                    ? modifiers.includes('shift')
                        ? key.toUpperCase()
                        : key.toLowerCase()
                    : null
        if (character)
            window.webContents.sendInputEvent({ type: 'char', keyCode: character, modifiers })
    }
    await delay(20)
    return prevented
}

async function keyUp(window, key, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: electronKeyCode(key), modifiers })
    await delay(35)
}

async function press(window, key, modifiers = []) {
    const prevented = await keyDown(window, key, modifiers)
    await keyUp(window, key, modifiers)
    return prevented
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (
                !(button instanceof HTMLElement) ||
                button.matches(':disabled') ||
                button.closest('[inert]')
            )
                throw new Error('Missing enabled shortcut control: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
    await delay(25)
}

async function clickText(window, text, scope = 'body') {
    await evaluate(
        window,
        (expected, target) => {
            const nodes = Array.from(document.querySelectorAll(target + ' button'))
            const button = nodes.find(
                (node) =>
                    node.textContent.trim() === expected &&
                    !node.disabled &&
                    !node.closest('[inert]'),
            )
            if (!button) throw new Error('Missing enabled text control: ' + expected)
            button.focus()
            button.click()
        },
        text,
        scope,
    )
    await delay(25)
}

async function state(window) {
    return evaluate(window, () => {
        const root = document.querySelector('[data-practice-phase]')
        const answer = document.querySelector('[data-practice-answer-panel]')
        return {
            index: Number(root?.getAttribute('data-practice-index')),
            phase: root?.getAttribute('data-practice-phase'),
            oralStage: root?.getAttribute('data-practice-oral-stage'),
            input: document.querySelector('[data-practice-answer-input]')?.value ?? null,
            panel: Boolean(answer && !answer.hidden),
            panelKind: answer?.getAttribute('data-practice-answer-panel') ?? null,
            dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter(
                (node) => node.getClientRects().length > 0,
            ).length,
            notices: Array.from(document.querySelectorAll('[role="status"]')).map((node) =>
                node.textContent.trim(),
            ),
        }
    })
}

async function expectState(window, expected, description) {
    await waitFor(
        window,
        (values) => {
            const root = document.querySelector('[data-practice-phase]')
            const answer = document.querySelector('[data-practice-answer-panel]')
            const actual = {
                index: Number(root?.getAttribute('data-practice-index')),
                phase: root?.getAttribute('data-practice-phase'),
                oralStage: root?.getAttribute('data-practice-oral-stage'),
                input: document.querySelector('[data-practice-answer-input]')?.value ?? null,
                panel: Boolean(answer && !answer.hidden),
                dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter(
                    (node) => node.getClientRects().length > 0,
                ).length,
            }
            return Object.entries(values).every(([key, value]) => actual[key] === value)
        },
        description,
        expected,
    )
    return state(window)
}

async function footerSnapshot(window) {
    return evaluate(window, () => {
        const footer = document.querySelector('[data-practice-footer]')
        const rect = footer?.getBoundingClientRect()
        return {
            viewport: { width: innerWidth, height: innerHeight },
            theme: document.documentElement.dataset.theme,
            footer: footer
                ? {
                      top: rect.top,
                      bottom: rect.bottom,
                      width: rect.width,
                      height: rect.height,
                      position: getComputedStyle(footer).position,
                      cssBottom: getComputedStyle(footer).bottom,
                  }
                : null,
            items: Array.from(footer?.querySelectorAll('[data-practice-footer-item]') ?? []).map(
                (item) => ({
                    id: item.getAttribute('data-practice-footer-item'),
                    action: item.getAttribute('data-practice-footer-action'),
                    tag: item.tagName,
                    label:
                        item.getAttribute('aria-label') ??
                        item.querySelector('span')?.textContent.trim(),
                    caps: Array.from(item.querySelectorAll('kbd')).map((key) =>
                        key.textContent.trim(),
                    ),
                    disabled: item.matches(':disabled'),
                    visible: item.getClientRects().length > 0,
                    height: item.getBoundingClientRect().height,
                    fontSize: getComputedStyle(item).fontSize,
                }),
            ),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }
    })
}

function near(actual, expected, description) {
    assert.ok(
        Math.abs(actual - expected) <= 1,
        description + ': expected ' + expected + ', received ' + actual,
    )
}

function expectedCaps(id, mode) {
    if (id === 'mastered') return ['Shift+J']
    if (id === 'unfamiliar') return ['Shift+K']
    if (id === 'read-aloud') return ['Shift+L']
    if (id === 'navigation') return ['Shift+←/→']
    if (id === 'input') return ['← / →']
    if (id === 'panel') return ['↓ / ↑']
    if (id === 'contextual') return ['空格']
    if (id === 'primary')
        return [mode === 'oral' ? 'Enter / 空格 / V' : mode === 'check' ? 'Enter / 空格' : 'Enter']
    return []
}

async function assertFooter(window, family, mode) {
    const expected = configuration(family).modes[mode]
    const snapshot = await footerSnapshot(window)
    assert.deepEqual(
        snapshot.items.map((item) => item.id),
        expected,
        family + ':' + mode + ' footer order',
    )
    if (expected.length === 0) {
        assert.equal(snapshot.footer, null, family + ':' + mode + ' has no invented footer')
        return snapshot
    }
    assert.equal(snapshot.footer.position, 'fixed')
    assert.equal(snapshot.footer.cssBottom, '0px')
    near(snapshot.footer.height, 100, 'footer reference height')
    near(snapshot.footer.bottom, snapshot.viewport.height, 'footer viewport bottom')
    for (const item of snapshot.items) {
        assert.equal(item.visible, true)
        assert.deepEqual(
            item.caps,
            expectedCaps(item.id, mode),
            family + ':' + mode + ' ' + item.id + ' effective caps',
        )
        assert.equal(item.tag, ['input', 'navigation'].includes(item.id) ? 'DIV' : 'BUTTON')
        if (item.id !== 'playback') {
            near(item.height, 32, 'PC control height ' + item.id)
            assert.equal(item.fontSize, '14px')
        } else near(item.height, 28, 'reading playback icon height')
    }
    assert.equal(snapshot.items[0].disabled, true, 'first item previous disabled')
    assert.equal(snapshot.overflow, false)
    return snapshot
}

async function setInput(window, text) {
    await evaluate(
        window,
        (value) => {
            const element = document.querySelector('[data-practice-answer-input]')
            if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement))
                throw new Error('Expected existing answer input')
            const prototype =
                element instanceof HTMLTextAreaElement
                    ? HTMLTextAreaElement.prototype
                    : HTMLInputElement.prototype
            Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
            element.dispatchEvent(new Event('input', { bubbles: true }))
            element.focus()
            element.setSelectionRange(value.length, value.length)
        },
        text,
    )
    await expectState(window, { input: text }, 'input updates through native React channel')
}

async function closeDialog(window) {
    await settle(window)
    await evaluate(window, () => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(
            (node) => !node.closest('[inert]'),
        )
        const dialog = dialogs.at(-1)
        const close = dialog?.querySelector('button[aria-label="关闭对话框"]')
        if (!close) throw new Error('No active dialog close button')
        window.__practiceShortcutSmokeClosingDialog = dialog
        close.click()
    })
    await waitFor(
        window,
        () => window.__practiceShortcutSmokeClosingDialog?.isConnected === false,
        'the closed top dialog finishes its exit animation and unmounts',
    )
    await evaluate(window, () => {
        delete window.__practiceShortcutSmokeClosingDialog
    })
}

async function openShortcutSettings(window) {
    await click(window, '[data-practice-navigation-action="settings"]')
    await waitFor(
        window,
        () => document.querySelector('[role="dialog"] [role="tab"]'),
        'settings dialog opens',
    )
    await evaluate(window, () => {
        const tab = Array.from(document.querySelectorAll('[role="tab"]')).find((node) =>
            node.textContent.trim().includes('快捷键'),
        )
        if (!tab) throw new Error('Missing existing shortcut settings tab')
        tab.click()
    })
    await waitFor(
        window,
        () =>
            Array.from(document.querySelectorAll('[role="dialog"] button')).some(
                (button) => button.textContent.trim() === '编辑上一题',
            ),
        'five shortcut settings loaded',
    )
}

async function settingsValues(window) {
    return evaluate(window, () =>
        Object.fromEntries(
            ['朗读', '掌握', '不熟', '上一题', '下一题'].map((label) => {
                const button = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
                    (node) => node.textContent.trim() === '编辑' + label,
                )
                // TldButton wraps its native button in a span; the kbd is a sibling
                // of that wrapper in the nearest controls div, not inside the span.
                const value = button?.closest('div')?.querySelector('kbd')?.textContent.trim()
                if (!value) throw new Error('Cannot read shortcut setting ' + label)
                return [label, value]
            }),
        ),
    )
}

async function editShortcut(window, label, value) {
    await clickText(window, '编辑' + label, '[role="dialog"]')
    await waitFor(
        window,
        () => document.querySelector('[role="dialog"] [aria-label="录入快捷键"]'),
        'shortcut capture opens',
    )
    await click(window, '[role="dialog"] [aria-label="录入快捷键"]')
    const parts = value.split(' + ')
    const key = parts.pop()
    const modifiers = parts.map(
        (part) => ({ Ctrl: 'control', Alt: 'alt', Shift: 'shift', Meta: 'meta' })[part],
    )
    await press(window, key, modifiers)
    await waitFor(
        window,
        (expected) =>
            document
                .querySelector('[role="dialog"] [aria-label="录入快捷键"]')
                ?.textContent.trim() === expected,
        'shortcut captured ' + value,
        value,
    )
    await press(window, 'Enter')
    await waitFor(
        window,
        () => !document.querySelector('[aria-label="录入快捷键"]'),
        'shortcut capture saves',
    )
    const values = await settingsValues(window)
    assert.equal(values[label], value)
}

async function updateSettings(window, values) {
    await openShortcutSettings(window)
    const current = await settingsValues(window)
    for (const [label, value] of Object.entries(values))
        if (current[label] !== value) await editShortcut(window, label, value)
    await closeDialog(window)
    await expectState(window, { dialogs: 0 }, 'settings closes without changing question')
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
        (name) => document.querySelector('input[aria-label="' + name + '"]:not(:disabled)'),
        'theme editor ready',
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

async function capture(window, label, name) {
    await settle(window)
    await delay(280)
    const path = 'dist/practice-shortcuts-' + label.toLowerCase() + '-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function checkScroll(window) {
    const before = await footerSnapshot(window)
    const fixture = await evaluate(window, () => {
        if (document.documentElement.scrollHeight > innerHeight + 50) return false
        const spacer = document.createElement('div')
        spacer.dataset.shortcutSmokeScrollFixture = 'true'
        spacer.style.height = '150vh'
        spacer.setAttribute('aria-hidden', 'true')
        document.body.append(spacer)
        return true
    })
    try {
        await evaluate(window, () => window.scrollTo(0, document.documentElement.scrollHeight))
        await waitFor(window, () => scrollY > 10, 'document actually scrolls')
        const after = await footerSnapshot(window)
        near(after.footer.bottom, before.footer.bottom, 'scroll preserves viewport footer bottom')
        return { before, after, fixture, scrollY: await evaluate(window, () => scrollY) }
    } finally {
        await evaluate(window, () => {
            document.querySelector('[data-shortcut-smoke-scroll-fixture]')?.remove()
            window.scrollTo(0, 0)
        })
    }
}

async function checkPanelAndInput(window, origin, waitForResources) {
    await visit(window, origin, 'word', 'dictate', waitForResources)
    await setInput(window, 'a')
    await press(window, 'Space')
    await press(window, 'V')
    await expectState(
        window,
        { input: 'a v', phase: 'answering', index: 0, dialogs: 0 },
        'Space and v stay native text',
    )
    await press(window, 'ArrowDown')
    await expectState(window, { panel: false, input: 'a v' }, 'input arrows do not open panel')
    await evaluate(window, () => {
        const element = document.querySelector('[data-practice-answer-input]')
        element.dispatchEvent(
            new CompositionEvent('compositionstart', { bubbles: true, data: '测' }),
        )
        element.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 229,
                isComposing: true,
                bubbles: true,
            }),
        )
        element.dispatchEvent(
            new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }),
        )
        element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '测' }))
    })
    await expectState(
        window,
        { input: 'a v', index: 0, phase: 'answering' },
        'synthetic IME confirmation does not submit',
    )
    await focusContent(window)
    const before = await state(window)
    await press(window, 'ArrowDown')
    await expectState(
        window,
        { panel: true, input: 'a v', phase: 'answering', index: 0 },
        'down opens independent panel',
    )
    await press(window, 'ArrowUp')
    await expectState(
        window,
        { panel: false, input: 'a v', phase: 'answering', index: 0 },
        'up closes panel preserving answer',
    )
    await evaluate(window, () =>
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                shiftKey: true,
                repeat: true,
                bubbles: true,
            }),
        ),
    )
    await expectState(window, { index: 0, input: 'a v' }, 'synthetic repeat does not navigate')
    await setInput(window, 'a v')
    await press(window, 'Enter')
    const submitted = await expectState(
        window,
        { index: 0, phase: 'answering', input: 'a v' },
        'input Enter stays current unjudged local question',
    )
    assert.ok(submitted.notices.some((notice) => notice.includes('本地作答已提交')))
    return { before, submitted, after: await state(window) }
}

async function checkNavigationReset(window, origin, waitForResources) {
    await visit(window, origin, 'word', 'dictate', waitForResources)
    await setInput(window, 'unfinished')
    await focusContent(window)
    await press(window, 'ArrowDown')
    await press(window, 'ArrowRight', ['shift'])
    const skipped = await expectState(
        window,
        { index: 1, phase: 'answering', input: '', panel: false, oralStage: 'idle' },
        'Shift right skips unfinished and resets',
    )
    await click(window, '[data-practice-footer-item="previous"]')
    await expectState(
        window,
        { index: 0, phase: 'answering', input: '', panel: false },
        'click previous resets returned question',
    )
    await setInput(window, 'completed')
    await focusContent(window)
    await press(window, 'ArrowDown')
    await expectState(
        window,
        { panel: true, phase: 'answering', input: 'completed' },
        'answer panel preserves ungraded input',
    )
    await click(window, '[data-practice-footer-item="next"]')
    const completed = await expectState(
        window,
        { index: 1, phase: 'answering', input: '', panel: false, oralStage: 'idle' },
        'click next resets edited question',
    )
    await focusContent(window)
    await press(window, 'ArrowLeft', ['shift'])
    await expectState(
        window,
        { index: 0, phase: 'answering', input: '' },
        'Shift left shares previous reset',
    )
    await visit(window, origin, 'word', 'oral', waitForResources)
    await focusContent(window)
    await press(window, 'V')
    await expectState(window, { oralStage: 'recording' }, 'standalone oral starts')
    await press(window, 'ArrowRight', ['shift'])
    const oral = await expectState(
        window,
        { index: 1, oralStage: 'idle', phase: 'answering' },
        'cut resets oral stage',
    )
    return { skipped, completed, oral }
}

async function checkNativeButtons(window, origin, waitForResources) {
    await visit(window, origin, 'sentence', 'check', waitForResources)
    await evaluate(window, () =>
        document.querySelector('[data-practice-footer-item="primary"]').focus(),
    )
    await keyDown(window, 'Enter')
    await expectState(
        window,
        { index: 0, phase: 'revealed', dialogs: 0 },
        'native Enter reveals exactly once',
    )
    const enterRepeated = await keyDown(window, 'Enter', ['isAutoRepeat'])
    await expectState(
        window,
        { index: 0, phase: 'revealed', dialogs: 0 },
        'held native Enter cannot advance revealed question',
    )
    assert.equal(enterRepeated, true, 'held native Enter keydown is consumed')
    await keyUp(window, 'Enter')
    await evaluate(window, () =>
        document.querySelector('[data-practice-footer-item="primary"]').focus(),
    )
    await press(window, 'Enter')
    const enterReleased = await expectState(
        window,
        { index: 1, phase: 'answering', dialogs: 0 },
        'released native Enter can activate again exactly once',
    )
    await visit(window, origin, 'sentence', 'check', waitForResources)
    await evaluate(window, () =>
        document.querySelector('[data-practice-footer-item="primary"]').focus(),
    )
    await keyDown(window, 'Space')
    const spaceRepeated = await keyDown(window, 'Space', ['isAutoRepeat'])
    assert.equal(spaceRepeated, true, 'held native Space keydown is consumed')
    await expectState(
        window,
        { index: 0, phase: 'answering', dialogs: 0 },
        'native Space does not activate before keyup',
    )
    await keyUp(window, 'Space')
    await expectState(
        window,
        { index: 0, phase: 'revealed', dialogs: 0 },
        'native Space keyup reveals once',
    )
    await evaluate(window, () =>
        document.querySelector('[data-practice-footer-item="primary"]').focus(),
    )
    await press(window, 'Space')
    const spaceReleased = await expectState(
        window,
        { index: 1, phase: 'answering', dialogs: 0 },
        'released native Space advances once without finishing',
    )
    return { enterRepeated, enterReleased, spaceRepeated, spaceReleased }
}

async function checkKnowledge(window, family, mode) {
    await focusContent(window)
    await press(window, 'J', ['control'])
    let snapshot = await state(window)
    assert.equal(
        snapshot.notices.some((notice) => notice.includes('掌握状态已演示')),
        false,
        family + ':' + mode + ' retired Ctrl J does not mark mastered',
    )
    await press(window, 'K', ['control'])
    snapshot = await state(window)
    assert.equal(
        snapshot.notices.some((notice) => notice.includes('不熟状态已演示')),
        false,
        family + ':' + mode + ' retired Ctrl K does not mark unfamiliar',
    )
    await press(window, 'J', ['shift'])
    snapshot = await state(window)
    const allowed = family === 'picture' && ['listen', 'translate', 'oral'].includes(mode)
    assert.equal(
        snapshot.notices.some((notice) => notice.includes('掌握状态已演示')),
        allowed,
        family + ':' + mode + ' Shift J capability',
    )
    await press(window, 'K', ['shift'])
    snapshot = await state(window)
    assert.equal(
        snapshot.notices.some((notice) => notice.includes('不熟状态已演示')),
        allowed,
        family + ':' + mode + ' Shift K capability',
    )
    return snapshot
}

async function checkQuickOral(window, origin, label, waitForResources) {
    await visit(window, origin, 'word', 'pronounce', waitForResources)
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-practice-quick-oral]'))),
        false,
    )
    await focusContent(window)
    await press(window, 'V')
    await expectState(
        window,
        { dialogs: 0, oralStage: 'idle', index: 0 },
        'word pronunciation does not offer quick oral',
    )
    await visit(window, origin, 'phonetics', 'pronounce', waitForResources)
    assert.equal(
        await evaluate(window, () =>
            Boolean(document.querySelector('[data-practice-quick-oral]:not(:disabled)')),
        ),
        true,
        'visible quick oral entry accompanies V capability',
    )
    await focusContent(window)
    await press(window, 'V')
    const opened = await expectState(
        window,
        { dialogs: 1, oralStage: 'idle', index: 0 },
        'first V only opens quick oral',
    )
    const screenshots = [await capture(window, label, 'oral-idle')]
    await focusContent(window)
    await press(window, 'V')
    await expectState(
        window,
        { oralStage: 'recording', dialogs: 1, index: 0 },
        'second V starts recording',
    )
    screenshots.push(await capture(window, label, 'oral-recording'))
    await focusContent(window)
    await press(window, 'V')
    await expectState(
        window,
        { oralStage: 'evaluating', dialogs: 1 },
        'third V stops and evaluates',
    )
    await press(window, 'V')
    await press(window, 'Enter')
    await press(window, 'Space')
    await expectState(
        window,
        { oralStage: 'evaluating', index: 0, dialogs: 1 },
        'evaluating does not reenter',
    )
    screenshots.push(await capture(window, label, 'oral-evaluating'))
    await clickText(window, '展示示例结果', '[role="dialog"]')
    await expectState(window, { oralStage: 'result', dialogs: 1 }, 'explicit demo result')
    screenshots.push(await capture(window, label, 'oral-result'))
    await focusContent(window)
    await press(window, 'Space')
    const replay = await expectState(
        window,
        { oralStage: 'result', index: 0, dialogs: 1 },
        'result Space is replay only',
    )
    assert.ok(replay.notices.some((notice) => notice.includes('未生成真实录音')))
    await press(window, 'Enter')
    const returned = await expectState(
        window,
        { index: 0, oralStage: 'idle', dialogs: 0 },
        'quick oral Enter returns without next question',
    )
    return { opened, returned, screenshots }
}

async function checkShiftCapturePolicy(window) {
    await openShortcutSettings(window)
    await clickText(window, '编辑朗读', '[role="dialog"]')
    await waitFor(
        window,
        () => document.querySelector('[role="dialog"] [aria-label="录入快捷键"]'),
        'shift policy capture opens',
    )
    await click(window, '[role="dialog"] [aria-label="录入快捷键"]')
    const previous = await evaluate(window, () =>
        document.querySelector('[aria-label="录入快捷键"]').textContent.trim(),
    )
    await press(window, 'P', ['control'])
    await waitFor(
        window,
        (expected) => {
            const capture = document.querySelector('[aria-label="录入快捷键"]')
            const dialog = capture?.closest('[role="dialog"]')
            const confirm = Array.from(dialog?.querySelectorAll('button') ?? []).find(
                (button) => button.textContent.trim() === '确认',
            )
            return capture?.textContent.trim() === expected && confirm?.disabled === true
        },
        'new Ctrl binding rejected without changing captured draft',
        previous,
    )
    const rejected = await evaluate(window, () => {
        const capture = document.querySelector('[aria-label="录入快捷键"]')
        return {
            draft: capture.textContent.trim(),
            message: capture
                .closest('[role="dialog"]')
                ?.querySelector('[role="status"]')
                ?.textContent.trim(),
        }
    })
    assert.ok(rejected.message, 'rejected Ctrl capture has visible feedback')
    await press(window, 'P', ['shift'])
    await waitFor(
        window,
        () =>
            document.querySelector('[aria-label="录入快捷键"]')?.textContent.trim() === 'Shift + P',
        'Shift letter accepted by real shortcut capture',
    )
    await press(window, 'Enter')
    await waitFor(
        window,
        () => !document.querySelector('[aria-label="录入快捷键"]'),
        'accepted Shift binding saves',
    )
    const accepted = await settingsValues(window)
    assert.equal(accepted.朗读, 'Shift + P')
    await closeDialog(window)
    return { rejected, accepted }
}

async function checkLegacyControlMigration(window, origin, waitForResources) {
    const preferencesKey = 'english-learning-preferences-v1'
    const original = await evaluate(
        window,
        (key) => window.localStorage.getItem(key),
        preferencesKey,
    )
    try {
        await beforeNavigation(window, waitForResources)
        await evaluate(
            window,
            (key) => {
                const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null')
                const current =
                    saved?.version === 1 && saved.values && typeof saved.values === 'object'
                        ? saved.values
                        : {}
                window.localStorage.setItem(
                    key,
                    JSON.stringify({
                        version: 1,
                        values: {
                            ...current,
                            playShortcut: 'Ctrl + A',
                            masteredShortcut: 'Ctrl + M',
                            unfamiliarShortcut: 'Ctrl + Q',
                            previousShortcut: 'Shift + ArrowLeft',
                            nextShortcut: 'Shift + ArrowRight',
                        },
                    }),
                )
            },
            preferencesKey,
        )
        await visit(window, origin, 'word', 'pronounce', waitForResources)
        await waitFor(
            window,
            (key) => {
                const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null')
                return (
                    saved?.version === 1 &&
                    saved.values?.playShortcut === 'Shift + A' &&
                    saved.values?.masteredShortcut === 'Shift + M' &&
                    saved.values?.unfamiliarShortcut === 'Shift + Q'
                )
            },
            'legacy Ctrl migration persists Shift values in original v1 key',
            preferencesKey,
        )
        const persisted = await evaluate(
            window,
            (key) => JSON.parse(window.localStorage.getItem(key)),
            preferencesKey,
        )
        await openShortcutSettings(window)
        const restored = await settingsValues(window)
        assert.deepEqual(restored, {
            朗读: 'Shift + A',
            掌握: 'Shift + M',
            不熟: 'Shift + Q',
            上一题: defaults.上一题,
            下一题: defaults.下一题,
        })
        await closeDialog(window)
        const footer = await footerSnapshot(window)
        for (const [id, cap] of [
            [read, 'Shift+A'],
            [mastered, 'Shift+M'],
            [unfamiliar, 'Shift+Q'],
        ])
            assert.deepEqual(footer.items.find((item) => item.id === id)?.caps, [cap])
        await focusContent(window)
        const before = await state(window)
        const ignoredControl = []
        for (const key of ['A', 'M', 'Q']) {
            const consumed = await press(window, key, ['control'])
            assert.equal(consumed, false, 'legacy Ctrl ' + key + ' is no longer a practice binding')
            const unchanged = await state(window)
            assert.deepEqual(unchanged, before, 'legacy Ctrl ' + key + ' does not execute practice')
            ignoredControl.push({ key, consumed, state: unchanged })
        }
        const shiftStates = []
        for (const [key, notice] of [
            ['A', '发音素材未接入'],
            ['M', '掌握状态已演示'],
            ['Q', '不熟状态已演示'],
        ]) {
            const consumed = await press(window, key, ['shift'])
            assert.equal(consumed, true, 'migrated Shift ' + key + ' is consumed once')
            await waitFor(
                window,
                (expected) =>
                    Array.from(document.querySelectorAll('[role="status"]')).some((node) =>
                        node.textContent.includes(expected),
                    ),
                'migrated Shift ' + key + ' executes its original action',
                notice,
            )
            shiftStates.push({ key, state: await state(window) })
        }
        await visit(window, origin, 'word', 'dictate', waitForResources)
        await setInput(window, 'migrated')
        const beforeTyping = await state(window)
        for (const key of ['A', 'M', 'Q'])
            assert.equal(
                await press(window, key, ['shift']),
                false,
                'migrated Shift ' + key + ' is native uppercase while answer input owns focus',
            )
        const uppercase = await expectState(
            window,
            { input: 'migratedAMQ', index: 0, phase: 'answering', dialogs: 0 },
            'migrated Shift bindings do not steal uppercase answer text',
        )
        assert.deepEqual(uppercase.notices, beforeTyping.notices)
        return {
            restored,
            persisted,
            footer,
            ignoredControl,
            shiftStates,
            uppercase,
            capturePolicy: await checkShiftCapturePolicy(window),
        }
    } finally {
        await beforeNavigation(window, waitForResources)
        await evaluate(
            window,
            (key, saved) => {
                if (saved === null) window.localStorage.removeItem(key)
                else window.localStorage.setItem(key, saved)
            },
            preferencesKey,
            original,
        )
        await visit(window, origin, 'word', 'pronounce', waitForResources)
    }
}

async function checkLegacyShiftSymbols(window, origin, waitForResources) {
    const preferencesKey = 'english-learning-preferences-v1'
    const original = await evaluate(
        window,
        (key) => window.localStorage.getItem(key),
        preferencesKey,
    )
    try {
        await beforeNavigation(window, waitForResources)
        await evaluate(
            window,
            (key) => {
                const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null')
                window.localStorage.setItem(
                    key,
                    JSON.stringify({
                        version: 1,
                        values: {
                            ...(saved?.version === 1 ? saved.values : {}),
                            playShortcut: 'Ctrl + 1',
                            masteredShortcut: 'Ctrl + ;',
                            unfamiliarShortcut: 'Shift + K',
                            previousShortcut: 'Shift + ArrowLeft',
                            nextShortcut: 'Shift + ArrowRight',
                        },
                    }),
                )
            },
            preferencesKey,
        )
        await visit(window, origin, 'word', 'pronounce', waitForResources)
        await waitFor(
            window,
            (key) => {
                const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null')
                return (
                    saved?.version === 1 &&
                    saved.values?.playShortcut === 'Shift + 1' &&
                    saved.values?.masteredShortcut === 'Shift + ;'
                )
            },
            'legacy numeric and punctuation keys persist their original base keys',
            preferencesKey,
        )
        const persisted = await evaluate(
            window,
            (key) => JSON.parse(window.localStorage.getItem(key)),
            preferencesKey,
        )
        await openShortcutSettings(window)
        const restored = await settingsValues(window)
        assert.deepEqual(restored, { ...defaults, 朗读: 'Shift + 1', 掌握: 'Shift + ;' })
        await closeDialog(window)
        const footer = await footerSnapshot(window)
        assert.deepEqual(footer.items.find((item) => item.id === read)?.caps, ['Shift+1'])
        assert.deepEqual(footer.items.find((item) => item.id === mastered)?.caps, ['Shift+;'])
        await focusContent(window)
        const before = await state(window)
        const ignoredControl = []
        for (const key of ['1', ';']) {
            const consumed = await press(window, key, ['control'])
            assert.equal(consumed, false, 'retired Ctrl ' + key + ' does not consume its base key')
            assert.deepEqual(await state(window), before, 'retired Ctrl ' + key + ' does not act')
            ignoredControl.push(await lastKeySnapshot(window))
        }
        const shiftedSymbols = []
        // sendInputEvent receives the shifted character. Chromium supplies its physical code;
        // passing the unshifted key here would not exercise real !/: DOM key values.
        for (const [key, code, notice] of [
            ['!', 'Digit1', '发音素材未接入'],
            [':', 'Semicolon', '掌握状态已演示'],
        ]) {
            assert.equal(await press(window, key, ['shift']), true, 'Shift ' + key + ' executes')
            const received = await lastKeySnapshot(window)
            assert.equal(received.key, key)
            assert.equal(received.code, code)
            assert.equal(received.shiftKey, true)
            await waitFor(
                window,
                (expected) =>
                    Array.from(document.querySelectorAll('[role="status"]')).some((node) =>
                        node.textContent.includes(expected),
                    ),
                'shifted symbol matches the migrated original base key ' + key,
                notice,
            )
            shiftedSymbols.push({ received, state: await state(window) })
        }
        await openShortcutSettings(window)
        await clickText(window, '编辑掌握', '[role="dialog"]')
        await waitFor(
            window,
            () => document.querySelector('[aria-label="录入快捷键"]'),
            'shift symbol collision capture opens',
        )
        await click(window, '[aria-label="录入快捷键"]')
        await press(window, '!', ['shift'])
        await waitFor(
            window,
            () => {
                const capture = document.querySelector('[aria-label="录入快捷键"]')
                const dialog = capture?.closest('[role="dialog"]')
                const confirm = Array.from(dialog?.querySelectorAll('button') ?? []).find(
                    (button) => button.textContent.trim() === '确认',
                )
                return (
                    capture?.textContent.trim() === 'Shift + 1' &&
                    confirm?.disabled === true &&
                    dialog?.querySelector('[role="status"]')?.textContent.includes('已用于其他操作')
                )
            },
            'Shift exclamation and Shift digit one cannot register duplicate actions',
        )
        const collision = await evaluate(window, () => {
            const capture = document.querySelector('[aria-label="录入快捷键"]')
            return {
                draft: capture.textContent.trim(),
                error: capture.closest('[role="dialog"]').querySelector('[role="status"]')
                    .textContent,
            }
        })
        await closeDialog(window)
        assert.deepEqual(await settingsValues(window), restored, 'collision leaves bindings intact')
        await closeDialog(window)
        return { restored, persisted, footer, ignoredControl, shiftedSymbols, collision }
    } finally {
        await beforeNavigation(window, waitForResources)
        await evaluate(
            window,
            (key, saved) => {
                if (saved === null) window.localStorage.removeItem(key)
                else window.localStorage.setItem(key, saved)
            },
            preferencesKey,
            original,
        )
        await visit(window, origin, 'word', 'pronounce', waitForResources)
    }
}

async function checkNativeShiftEditing(window, origin, waitForResources) {
    await visit(window, origin, 'word', 'dictate', waitForResources)
    await setInput(window, 'caps')
    const before = await state(window)
    for (const key of ['L', 'J', 'K']) {
        const consumed = await press(window, key, ['shift'])
        assert.equal(consumed, false, 'Shift ' + key + ' remains uppercase input while editing')
    }
    const uppercase = await expectState(
        window,
        { input: 'capsLJK', index: 0, phase: 'answering', panel: false, dialogs: 0 },
        'Shift default practice letters insert uppercase without running practice actions',
    )
    assert.deepEqual(uppercase.notices, before.notices)
    const nativeEditing = []
    for (const modifier of ['control', 'meta']) {
        const consumed = await press(window, 'A', [modifier])
        assert.equal(consumed, false, modifier + ' A remains a native editing combination')
        await expectState(
            window,
            { input: 'capsLJK', index: 0, phase: 'answering' },
            'native edit keeps answer',
        )
        nativeEditing.push({
            modifier,
            consumed,
            selection: await evaluate(window, () => {
                const element = document.querySelector('[data-practice-answer-input]')
                return { start: element.selectionStart, end: element.selectionEnd }
            }),
        })
    }
    await focusContent(window)
    const beforeRead = await state(window)
    assert.equal(await press(window, 'L', ['control']), false, 'retired Ctrl L is not consumed')
    assert.deepEqual(await state(window), beforeRead, 'retired Ctrl L does not read outside input')
    assert.equal(await press(window, 'L', ['shift']), true, 'default Shift L reads outside input')
    await waitFor(
        window,
        () =>
            Array.from(document.querySelectorAll('[role="status"]')).some((node) =>
                node.textContent.includes('发音素材未接入'),
            ),
        'Shift L outside input executes default reading action',
    )
    return { uppercase, nativeEditing, defaultReading: await state(window) }
}

async function checkCustomSettings(window, origin, waitForResources) {
    await visit(window, origin, 'word', 'dictate', waitForResources)
    await setInput(window, 'keep while editing')
    await updateSettings(window, { 上一题: 'Alt + ArrowLeft', 下一题: 'Alt + ArrowRight' })
    const before = await footerSnapshot(window)
    assert.deepEqual(before.items.find((item) => item.id === 'navigation').caps, ['Alt+←/→'])
    await expectState(
        window,
        { index: 0, input: 'keep while editing', phase: 'answering' },
        'settings preserve current question',
    )
    await focusContent(window)
    await press(window, 'ArrowRight', ['shift'])
    await expectState(
        window,
        { index: 0, input: 'keep while editing' },
        'replaced default stops dispatching',
    )
    await press(window, 'ArrowRight', ['alt'])
    await expectState(
        window,
        { index: 1, input: '', phase: 'answering' },
        'custom cut uses same reset action',
    )
    await beforeNavigation(window, waitForResources)
    await new Promise((done) => {
        window.webContents.once('did-finish-load', done)
        window.webContents.reload()
    })
    await waitFor(
        window,
        () => document.querySelector('main[data-toolbar-ready="true"]'),
        'refresh restores settings',
    )
    await settle(window)
    const restored = await footerSnapshot(window)
    assert.deepEqual(restored.items.find((item) => item.id === 'navigation').caps, ['Alt+←/→'])
    await focusContent(window)
    await press(window, 'ArrowRight', ['alt'])
    await expectState(window, { index: 1, phase: 'answering' }, 'custom cut works after refresh')
    await updateSettings(window, { 上一题: defaults.上一题, 下一题: defaults.下一题 })
    return { before, restored, after: await state(window) }
}

async function runPracticeShortcutChecks(window, origin, label, waitForResources) {
    const initialUrl = window.webContents.getURL()
    assert.ok(
        initialUrl && !initialUrl.startsWith('about:'),
        'practice shortcut checks require an initially loaded application page',
    )
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
        modes: [],
        geometry: [],
        interactions: [],
        screenshots: [],
        businessRequests: [],
        permissionRequests: [],
        consoleErrors: [],
        limitations: [
            'IME与repeat防护使用DOM合成事件；不代表真实系统输入法、H5软键盘或外接键盘验收',
            '无自然滚动范围时临时增加只读滚动夹具并移除，报告fixture标记；不冒充题面自然溢出',
            '口语是显式本地演示，不申请麦克风、不生成真实录音、不判题或评分',
            'PC运行与截图不代表平板/H5视觉及真机验收；截图仍需人工查看',
        ],
    }
    let originalTheme
    let originalSettings
    let failure
    const onConsole = (event) => {
        if (event.level === 'error' || event.level === 'warning')
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
        await setTheme(window, origin, 'dark', waitForResources)
        await visit(window, origin, 'word', 'pronounce', waitForResources)
        await openShortcutSettings(window)
        originalSettings = await settingsValues(window)
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[role="dialog"] [role="alert"]') !== null,
            ),
            false,
            'runtime fixture begins with repairable valid preferences',
        )
        await closeDialog(window)
        result.interactions.push({
            kind: 'legacy-control-to-shift',
            ...(await checkLegacyControlMigration(window, origin, waitForResources)),
        })
        result.interactions.push({
            kind: 'legacy-shifted-symbols',
            ...(await checkLegacyShiftSymbols(window, origin, waitForResources)),
        })
        await updateSettings(window, defaults)
        for (const item of families) {
            for (const mode of Object.keys(item.modes)) {
                await visit(window, origin, item.family, mode, waitForResources)
                const measured = await assertFooter(window, item.family, mode)
                result.modes.push({ family: item.family, mode, measured })
                if (['audio', 'video', 'picture'].includes(item.family))
                    result.interactions.push({
                        kind: 'knowledge',
                        family: item.family,
                        mode,
                        state: await checkKnowledge(window, item.family, mode),
                    })
            }
        }
        assert.equal(result.modes.length, 40)
        assert.equal(new Set(result.modes.map((item) => item.family)).size, 12)
        for (const [family, mode] of [
            ['word', 'pronounce'],
            ['sentence', 'listen'],
            ['audio', 'listen'],
            ['phonetics', 'pronounce'],
        ]) {
            await visit(window, origin, family, mode, waitForResources)
            result.screenshots.push(await capture(window, label, family + '-' + mode + '-dark'))
        }
        await focusContent(window)
        await press(window, 'ArrowUp')
        await expectState(
            window,
            { panel: false, phase: 'answering', index: 0 },
            'phonetics up hides details only',
        )
        await press(window, 'ArrowDown')
        const phonetics = await expectState(
            window,
            { panel: true, phase: 'answering', index: 0 },
            'phonetics down opens details only',
        )
        assert.equal(phonetics.panelKind, 'phonetics')
        result.interactions.push({ kind: 'phonetics-panel', state: phonetics })
        for (const [width, height] of [
            [1920, 1080],
            [1440, 900],
        ]) {
            window.setContentSize(width, height)
            await visit(window, origin, 'word', 'typing', waitForResources)
            const measured = await assertFooter(window, 'word', 'typing')
            result.geometry.push({ width, height, measured, scroll: await checkScroll(window) })
        }
        window.setContentSize(1920, 1080)
        result.interactions.push({
            kind: 'panel-input',
            ...(await checkPanelAndInput(window, origin, waitForResources)),
        })
        result.interactions.push({
            kind: 'native-shift-editing',
            ...(await checkNativeShiftEditing(window, origin, waitForResources)),
        })
        result.interactions.push({
            kind: 'cut-reset',
            ...(await checkNavigationReset(window, origin, waitForResources)),
        })
        result.interactions.push({
            kind: 'native-button',
            state: await checkNativeButtons(window, origin, waitForResources),
        })
        result.interactions.push({
            kind: 'quick-oral',
            ...(await checkQuickOral(window, origin, label, waitForResources)),
        })
        result.interactions.push({
            kind: 'custom-settings',
            ...(await checkCustomSettings(window, origin, waitForResources)),
        })
        await setTheme(window, origin, 'light', waitForResources)
        for (const [family, mode] of [
            ['word', 'dictate'],
            ['sentence', 'translate'],
            ['phonetics', 'pronounce'],
        ]) {
            await visit(window, origin, family, mode, waitForResources)
            await assertFooter(window, family, mode)
            result.screenshots.push(await capture(window, label, family + '-' + mode + '-light'))
        }
        result.compactFooter = await runCompactPracticeFooterChecks(
            window,
            origin,
            waitForResources,
        )
        assert.deepEqual(result.businessRequests, [], 'shortcuts send no business requests')
        assert.deepEqual(
            result.permissionRequests,
            [],
            'demo oral requests no microphone permission',
        )
        assert.deepEqual(
            result.consoleErrors,
            [],
            'shortcuts produce no console/hydration warnings or errors',
        )
        result.status = 'passed'
    } catch (error) {
        failure = error
        result.status = 'failed'
        result.error = error instanceof Error ? error.stack : String(error)
        try {
            result.failureState = await state(window)
            result.failureKey = await lastKeySnapshot(window)
            result.failureURL = window.webContents.getURL()
            result.failureScreenshot = await capture(window, label, 'failure')
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
    } finally {
        try {
            window.webContents.setZoomFactor(1)
            window.setContentSize(1920, 1080)
            if (originalSettings) {
                await visit(window, origin, 'word', 'pronounce', waitForResources)
                await updateSettings(window, originalSettings)
            }
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme, waitForResources)
        } catch (cleanupError) {
            result.cleanupError = String(cleanupError)
            if (result.status === 'passed') {
                result.status = 'failed'
                result.error = 'Smoke cleanup failed: ' + String(cleanupError)
                failure = cleanupError
            }
        } finally {
            window.webContents.removeListener('console-message', onConsole)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/practice-shortcuts-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
    if (failure) throw failure
    return result
}

async function runCompactPracticeFooterChecks(window, origin, waitForResources) {
    const initialSize = window.getContentSize()
    const minimum = window.getMinimumSize()
    const layouts = []
    try {
        window.setMinimumSize(0, 0)
        await visit(window, origin, 'word', 'pronounce', waitForResources)
        for (const width of [320, 390, 767, 768, 1440]) {
            window.setContentSize(width, 900)
            await delay(80)
            const sample = await evaluate(window, () => {
                const visible = (element) => element.getClientRects().length > 0
                const footer = document.querySelector('[data-practice-footer]')
                return {
                    width: innerWidth,
                    keys: Array.from(footer.querySelectorAll('kbd')).filter(visible).length,
                    readVisible: visible(
                        footer.querySelector('[data-practice-footer-item="read-aloud"]'),
                    ),
                    directions: ['previous', 'next'].map((id) => {
                        const button = footer.querySelector(
                            '[data-practice-footer-item="' + id + '"]',
                        )
                        return {
                            id,
                            text: button.innerText.trim(),
                            icon: visible(button.querySelector('svg')),
                            label: button.getAttribute('aria-label'),
                            width: button.getBoundingClientRect().width,
                            height: button.getBoundingClientRect().height,
                            path: button.querySelector('path').getAttribute('d'),
                        }
                    }),
                    demoTools: Boolean(document.querySelector('[data-practice-demo-tools]')),
                    quickOral: Boolean(document.querySelector('[data-practice-quick-oral]')),
                    pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
                }
            })
            assert.equal(sample.demoTools, false)
            assert.equal(sample.quickOral, false)
            assert.equal(sample.pageOverflow, false)
            assert.ok(sample.directions.every((item) => item.icon))
            if (width < 768) {
                assert.equal(sample.keys, 0)
                assert.equal(sample.readVisible, false)
                for (const direction of sample.directions) {
                    assert.equal(direction.text, '')
                    near(direction.width, 40, 'mobile arrow width')
                    near(direction.height, 40, 'mobile arrow height')
                }
            } else {
                assert.equal(sample.readVisible, true)
                assert.ok(sample.keys > 0)
                assert.equal(sample.directions[0].text, '上一题')
                assert.equal(sample.directions[1].text, '下一题')
            }
            layouts.push(sample)
        }
        await focusContent(window)
        await press(window, 'V')
        await expectState(
            window,
            { dialogs: 0, oralStage: 'idle', index: 0 },
            'word pronunciation blocks V',
        )
        window.setContentSize(390, 900)
        const path = layouts[0].directions[1].path
        let completed = false
        for (let attempt = 0; attempt < 12; attempt++) {
            const before = await state(window)
            const next = await evaluate(window, () => {
                const button = document.querySelector('[data-practice-footer-item="next"]')
                return {
                    label: button.getAttribute('aria-label'),
                    text: button.innerText.trim(),
                    path: button.querySelector('path').getAttribute('d'),
                }
            })
            assert.equal(next.label, '下一题')
            assert.equal(next.text, '')
            assert.equal(next.path, path, 'last item keeps the same arrow')
            await click(window, '[data-practice-footer-item="next"]')
            await waitFor(
                window,
                (index) =>
                    Boolean(document.querySelector('[aria-label="关闭完成练习"]')) ||
                    Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex) >
                        index,
                'next arrow advances or completes directly',
                before.index,
            )
            completed = await evaluate(window, () =>
                Boolean(document.querySelector('[aria-label="关闭完成练习"]')),
            )
            if (completed) break
        }
        assert.equal(completed, true, 'last normal arrow opens completion')
        assert.equal(
            await evaluate(window, () => document.querySelectorAll('[role="dialog"]').length),
            1,
        )
        return { layouts, wordPronounceQuickOralDisabled: true, lastArrowCompletesDirectly: true }
    } finally {
        window.setMinimumSize(...minimum)
        window.setContentSize(...initialSize)
    }
}

module.exports = { runPracticeShortcutChecks, runCompactPracticeFooterChecks }
