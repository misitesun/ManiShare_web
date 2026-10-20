const assert = require('node:assert/strict')
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const {
    runStandalonePanelMotionSmoke,
    runPracticePanelMotionChecks,
} = require('./practice-panel-motion-runtime-smoke.cjs')

let fixtureSource
async function fixtureBundle() {
    if (fixtureSource) return fixtureSource
    const bundled = require('next/dist/compiled/webpack/webpack')
    const directory = resolve('dist/practice-word-spell-public')
    mkdirSync(directory, { recursive: true })
    await new Promise((done, reject) => {
        const compiler = bundled.webpack({
            mode: 'production',
            optimization: { minimize: false },
            target: 'web',
            devtool: false,
            entry: resolve('scripts/practice-word-input-fixture.cjs'),
            output: {
                path: directory,
                filename: 'fixture.js',
                library: { name: 'PracticeWordInputFixture', type: 'var' },
            },
            resolve: { extensions: ['.tsx', '.ts', '.js', '.cjs'] },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [resolve('scripts/practice-word-input-fixture-loader.cjs')],
                    },
                ],
            },
        })
        compiler.run((error, stats) => {
            compiler.close(() => {
                if (error || stats?.hasErrors())
                    reject(error ?? new Error(stats.toString({ all: false, errors: true })))
                else done()
            })
        })
    })
    fixtureSource = readFileSync(resolve(directory, 'fixture.js'), 'utf8')
    return fixtureSource
}

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}
async function waitFor(window, operation, label, ...args) {
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(40)
    }
    throw new Error('Timed out: word spell public ' + label)
}
async function state(window) {
    return evaluate(window, () => {
        const host = document.querySelector('[data-public-input-fixture]') ?? document
        const input = host.querySelector('[data-practice-answer-input]')
        const panel = document.querySelector('[data-practice-answer-panel]')
        return {
            value: input?.value,
            selection: [input?.selectionStart, input?.selectionEnd],
            focused: document.activeElement === input,
            phase: document.querySelector('[data-practice-phase]')?.dataset.practicePhase,
            index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
            panel: Boolean(panel && !panel.hidden && !panel.inert),
            characters: Array.from(
                host.querySelectorAll('[data-word-slot-character]'),
                (element) => ({
                    state: element.dataset.wordSlotCharacter,
                    color: getComputedStyle(element).color,
                    line: getComputedStyle(element).borderBottomColor,
                    lineWidth: getComputedStyle(element).borderBottomWidth,
                    placeholderVisibility: element.querySelector(
                        '[data-word-slot-placeholder-character]',
                    )
                        ? getComputedStyle(
                              element.querySelector('[data-word-slot-placeholder-character]'),
                          ).visibility
                        : null,
                    typed: !element.querySelector('[data-word-slot-placeholder-character]'),
                }),
            ),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }
    })
}
async function focus(window, start, end = start) {
    await evaluate(
        window,
        (from, to) => {
            const host = document.querySelector('[data-public-input-fixture]') ?? document
            const input = host.querySelector('[data-practice-answer-input]')
            input.focus({ preventScroll: true })
            input.setSelectionRange(from, to)
            input.dispatchEvent(new Event('select', { bubbles: true }))
            input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Unidentified' }))
        },
        start,
        end,
    )
    await delay(40)
}
async function press(window, key, modifiers = [], repeat = false, release = true) {
    await evaluate(window, () => {
        window.__publicInputKey = null
        window.addEventListener(
            'keydown',
            (event) => {
                setTimeout(() => {
                    window.__publicInputKey = {
                        key: event.key,
                        prevented: event.defaultPrevented,
                        trusted: event.isTrusted,
                        repeat: event.repeat,
                    }
                }, 0)
            },
            { capture: true, once: true },
        )
    })
    window.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: key,
        modifiers,
        isAutoRepeat: repeat,
    })
    await waitFor(window, () => window.__publicInputKey !== null, 'trusted key')
    const received = await evaluate(window, () => window.__publicInputKey)
    if (
        !received.prevented &&
        !modifiers.some((modifier) => ['control', 'alt', 'meta'].includes(modifier))
    ) {
        const character =
            key === 'Space'
                ? ' '
                : key === 'Enter'
                  ? '\r'
                  : key.length === 1
                    ? modifiers.includes('shift')
                        ? key.toUpperCase()
                        : key.toLowerCase()
                    : null
        if (character)
            window.webContents.sendInputEvent({ type: 'char', keyCode: character, modifiers })
    }
    if (release) window.webContents.sendInputEvent({ type: 'keyUp', keyCode: key, modifiers })
    await delay(40)
    return evaluate(window, () => window.__publicInputKey)
}
async function click(window, selector) {
    await evaluate(
        window,
        (selector) => {
            const button = document.querySelector(selector)
            if (!button || button.disabled || button.closest('[inert]'))
                throw new Error('Missing enabled ' + selector)
            button.click()
        },
        selector,
    )
    await delay(300)
}
async function visit(window, origin, mode = 'spell') {
    await window.loadURL(origin + '/practice/?demo=word-basic&mode=' + mode)
    await waitFor(
        window,
        () =>
            document.querySelector('main[data-toolbar-ready="true"]') &&
            document.querySelector('[data-practice-answer-input]'),
        'question ready',
    )
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'all question images complete',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
    })
}

async function checkCommandsAndLayers(window, origin) {
    await visit(window, origin)
    await focus(window, 0)
    await window.webContents.insertText('native answer')
    await focus(window, 2, 6)
    const before = await state(window)
    for (const key of ['Down', 'Up', 'Down']) {
        const event = await press(window, key)
        assert.equal(event.trusted, true)
        assert.equal(event.prevented, true)
        const after = await state(window)
        assert.equal(after.panel, key === 'Down')
        assert.equal(after.value, before.value)
        assert.deepEqual(after.selection, before.selection)
        assert.equal(after.phase, before.phase)
        assert.equal(after.index, before.index)
        assert.equal(after.focused, true)
    }
    const layers = await evaluate(window, () => {
        const panel = document.querySelector('[data-practice-answer-panel]')
        const root = document.querySelector('[data-practice-phase]')
        const rect = panel.getBoundingClientRect()
        return {
            z: Number(getComputedStyle(panel).zIndex),
            owned: panel.parentElement === root,
            topmost: panel.contains(
                document.elementFromPoint(rect.x + rect.width / 2, rect.y + 20),
            ),
            color: getComputedStyle(panel).getPropertyValue('--app-color-practice-answer'),
            rootColor: getComputedStyle(root).getPropertyValue('--app-color-practice-answer'),
        }
    })
    assert.equal(layers.z, 55)
    assert.equal(layers.owned, true)
    assert.equal(layers.topmost, true)
    assert.equal(layers.color, layers.rootColor)
    await press(window, 'Up')
    await click(window, '[data-word-toolbar] button[aria-label="本模式设置"]')
    // DOM点击仅负责打开既有菜单；后续命令仍为可信键盘，输入焦点保持不变。
    await press(window, 'Down')
    const menuLayers = await evaluate(window, () => {
        const menu = document.querySelector('[data-practice-options-position="portal"]')
        const panel = document.querySelector('[data-practice-answer-panel]')
        return {
            menu: Number(getComputedStyle(menu).zIndex),
            answer: Number(getComputedStyle(panel).zIndex),
            bodyPortal: menu.parentElement === document.body,
        }
    })
    assert.equal(menuLayers.bodyPortal, true)
    assert.ok(menuLayers.answer > menuLayers.menu)
    await click(window, '[data-word-toolbar] button[aria-label="本模式设置"]')
    await press(window, 'Up')
    for (const key of ['L', 'J', 'K']) {
        await focus(window, 2, 6)
        assert.equal((await press(window, key, ['shift'], false, false)).prevented, true)
        assert.equal((await press(window, key, ['shift'], true)).prevented, true)
        assert.equal((await state(window)).value, before.value)
        assert.deepEqual((await state(window)).selection, before.selection)
        const message =
            key === 'L' ? '发音素材未接入' : key === 'J' ? '掌握状态已演示' : '不熟状态已演示'
        await waitFor(
            window,
            (text) => document.body.innerText.includes(text),
            'bound action executes ' + key,
            message,
        )
    }
    assert.equal((await press(window, 'V')).prevented, false, 'unavailable oral V is native')
    await press(window, 'Down')
    await click(window, '[data-practice-navigation-action="settings"]')
    const modal = await evaluate(window, () => ({
        z: Number(
            getComputedStyle(
                document.querySelector('[data-tld-dialog-layer][data-dialog-open="true"]'),
            ).zIndex,
        ),
        blocked: document.querySelector('[data-practice-answer-panel]').inert,
    }))
    assert.equal(modal.blocked, true)
    assert.equal(modal.z, 60)
    await press(window, 'Escape')
    await delay(300)
    await click(window, '[data-practice-navigation-action="draft"]')
    await evaluate(window, () =>
        document.querySelector('[data-practice-draft-panel] textarea').focus(),
    )
    assert.equal((await press(window, 'L', ['shift'])).prevented, false)
    assert.equal(
        await evaluate(
            window,
            () => document.querySelector('[data-practice-draft-panel] textarea').value,
        ),
        'L',
    )
    await visit(window, origin, 'dictate')
    await focus(window, 0)
    assert.equal((await press(window, 'Down')).prevented, false)
    assert.equal((await press(window, 'L', ['shift'])).prevented, false)
    assert.equal((await state(window)).value, 'L')
    return { before, layers, menuLayers, modal, unchangedOtherMode: 'word:dictate' }
}

async function checkPanelReflow(window, origin, label) {
    const samples = []
    await visit(window, origin)
    for (const [width, height, zoom] of [
        [1920, 1080, 1],
        [1440, 900, 1],
        [1920, 1080, 1.25],
        [1920, 1080, 1.5],
        [1920, 1080, 2],
    ]) {
        window.setContentSize(width, height)
        window.webContents.setZoomFactor(zoom)
        await focus(window, 0)
        await press(window, 'Down')
        await delay(300)
        const geometry = await evaluate(window, () => {
            const panel = document.querySelector('[data-practice-answer-panel]')
            const rect = panel.getBoundingClientRect()
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                bottom: rect.bottom,
                viewport: [innerWidth, innerHeight],
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
            }
        })
        assert.equal(geometry.overflow, false)
        assert.ok(geometry.x >= 0 && geometry.x + geometry.width <= geometry.viewport[0] + 1)
        assert.ok(geometry.y >= 0 && geometry.bottom <= geometry.viewport[1])
        if (zoom === 1)
            writeFileSync(
                resolve(
                    'dist/practice-word-spell-public/' +
                        label.toLowerCase() +
                        '-answer-' +
                        width +
                        '.png',
                ),
                await window.webContents.capturePage().then((image) => image.toPNG()),
            )
        samples.push({ width, height, zoom, geometry })
        await press(window, 'Up')
    }
    window.setContentSize(1920, 1080)
    window.webContents.setZoomFactor(1)
    await window.loadURL(origin + '/practice/?demo=phonetics-basic&mode=pronounce')
    await waitFor(
        window,
        () =>
            document
                .querySelector('[data-practice-answer-panel="phonetics"]')
                ?.parentElement?.hasAttribute('data-practice-phase'),
        'phonetics portal belongs to practice root',
    )
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'phonetics images finish before navigation',
    )
    return { samples, phoneticsPortal: true }
}

async function checkFeedback(window, origin, label) {
    await visit(window, origin)
    await window.webContents.executeJavaScript(await fixtureBundle())
    await evaluate(window, () => {
        const host = document.createElement('div')
        host.dataset.publicInputFixture = 'true'
        Object.assign(host.style, {
            position: 'fixed',
            top: '150px',
            left: '24px',
            width: '280px',
            zIndex: '56',
        })
        document.querySelector('[data-practice-phase]').append(host)
        window.__publicInputFixture = PracticeWordInputFixture.mount(host)
    })
    try {
        const scenarios = []
        for (const [value, states] of [
            ['cx', ['correct', 'incorrect', 'missing']],
            ['cats', ['correct', 'correct', 'correct', 'extra']],
            ['cat', ['correct', 'correct', 'correct']],
        ]) {
            await evaluate(
                window,
                (value, states) =>
                    window.__publicInputFixture.update({
                        target: 'cat',
                        value,
                        feedback: { value, slots: [{ index: 0, states }] },
                    }),
                value,
                states,
            )
            const current = await state(window)
            assert.equal(current.value, value)
            assert.deepEqual(
                current.characters.map((character) => character.state),
                states,
            )
            for (const character of current.characters)
                if (['incorrect', 'missing', 'extra'].includes(character.state))
                    assert.equal(character.line, character.color)
            for (const character of current.characters) assert.equal(character.lineWidth, '3px')
            if (value === 'cx') {
                assert.notEqual(current.characters[0].color, current.characters[1].color)
                assert.equal(current.characters[2].placeholderVisibility, 'hidden')
                for (const theme of ['dark', 'light']) {
                    await evaluate(
                        window,
                        (theme) => {
                            document.documentElement.dataset.theme = theme
                        },
                        theme,
                    )
                    await delay(80)
                    writeFileSync(
                        resolve(
                            'dist/practice-word-spell-public/' +
                                label.toLowerCase() +
                                '-feedback-' +
                                theme +
                                '.png',
                        ),
                        await window.webContents.capturePage().then((image) => image.toPNG()),
                    )
                }
            }
            scenarios.push(current)
        }
        await focus(window, 1, 2)
        await window.webContents.insertText('o')
        assert.equal((await state(window)).value, 'cot')
        assert.ok(
            (await state(window)).characters.every((character) => character.state === 'pending'),
            'stale feedback never colors new input',
        )
        await evaluate(window, () =>
            window.__publicInputFixture.update({
                feedback: {
                    value: 'cot',
                    slots: [{ index: 0, states: ['correct', 'pending', 'incorrect'] }],
                },
            }),
        )
        assert.deepEqual(
            (await state(window)).characters.map((character) => character.state),
            ['correct', 'pending', 'incorrect'],
        )
        await window.webContents.undo()
        await delay(80)
        assert.equal((await state(window)).value, 'cat')
        await window.webContents.redo()
        await delay(80)
        assert.equal((await state(window)).value, 'cot')
        await evaluate(window, () => {
            const value = 'W😀' + 'W'.repeat(100)
            window.__publicInputFixture.update({
                target: value + 'abc',
                value,
                feedback: {
                    value,
                    slots: [
                        {
                            index: 0,
                            states: Array.from(value)
                                .map(() => 'incorrect')
                                .concat(['missing', 'missing', 'missing']),
                        },
                    ],
                },
            })
        })
        await focus(window, 1)
        await focus(window, 103)
        const scrollEnd = await evaluate(
            window,
            () =>
                document.querySelector('[data-public-input-fixture] [data-word-slot-scroll]')
                    .scrollLeft,
        )
        const diagnostic = await evaluate(window, () => {
            const host = document.querySelector('[data-public-input-fixture]')
            const scroll = host.querySelector('[data-word-slot-scroll]')
            const answer = host.querySelector('[data-word-slot-answer]')
            return {
                scroll: scroll.scrollLeft,
                width: scroll.clientWidth,
                extent: scroll.scrollWidth,
                answerWidth: answer.getBoundingClientRect().width,
                input: host.querySelector('input').selectionStart,
                typed: answer.querySelectorAll('[data-word-slot-placeholder-character]').length,
            }
        })
        assert.ok(
            scrollEnd > 0,
            'split text caret scrolls to the end without Range errors: ' +
                JSON.stringify(diagnostic),
        )
        await focus(window, 2)
        assert.ok(
            (await evaluate(
                window,
                () =>
                    document.querySelector('[data-public-input-fixture] [data-word-slot-scroll]')
                        .scrollLeft,
            )) < scrollEnd,
            'UTF16 middle position returns to the left',
        )
        await evaluate(window, () => {
            const scroll = document.querySelector(
                '[data-public-input-fixture] [data-word-slot-scroll]',
            )
            scroll.scrollLeft = 100
            window.__publicInputFixture.update({ phase: 'incorrect' })
        })
        assert.equal(
            await evaluate(
                window,
                () =>
                    document.querySelector('[data-public-input-fixture] [data-word-slot-scroll]')
                        .scrollLeft,
            ),
            100,
            'feedback-only render preserves manual scroll',
        )
        const native = await state(window)
        assert.equal(native.selection[0], 2)
        assert.equal(native.overflow, false)
        for (const theme of ['dark', 'light']) {
            await evaluate(
                window,
                (theme) => {
                    document.documentElement.dataset.theme = theme
                },
                theme,
            )
            writeFileSync(
                resolve(
                    'dist/practice-word-spell-public/' + label.toLowerCase() + '-' + theme + '.png',
                ),
                await window.webContents.capturePage().then((image) => image.toPNG()),
            )
        }
        return {
            scenarios,
            native,
            scrollEnd,
            evidence:
                'Isolated fixture bundles and mounts the actual React component; supplied feedback is a test fixture, not word-game comparison integration.',
        }
    } finally {
        await evaluate(window, () => {
            window.__publicInputFixture.unmount()
            document.querySelector('[data-public-input-fixture]').remove()
        })
    }
}

async function runChecks(window, origin, label) {
    const attached = window.webContents.debugger.isAttached()
    const report = {
        label,
        status: 'running',
        limitations: [
            'Fixture feedback does not implement word-owner comparison or correction snapshots.',
            'OS IME, touch, tablet and H5 visuals await user acceptance.',
        ],
    }
    try {
        window.setContentSize(1920, 1080)
        report.panelMotion = await runPracticePanelMotionChecks(window, origin, label)
        if (!attached) window.webContents.debugger.attach('1.3')
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        report.commandsAndLayers = await checkCommandsAndLayers(window, origin)
        await fixtureBundle()
        report.panelReflow = await checkPanelReflow(window, origin, label)
        report.feedback = await checkFeedback(window, origin, label)
        report.status = 'passed'
        return report
    } catch (error) {
        report.status = 'failed'
        report.error = String(error)
        throw error
    } finally {
        if (window.webContents.debugger.isAttached()) {
            await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
                enabled: false,
            })
            if (!attached) window.webContents.debugger.detach()
        }
        writeFileSync(
            resolve('dist/practice-word-spell-public-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(report, null, 4),
        )
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'practice-word-spell-public-runtime-validation',
    runChecks,
    activateWindow: false,
    timeoutMs: 240000,
})
