const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')
const {
    readToolbarCache,
    resetToolbarCache,
    restoreToolbarCache,
    reloadToolbarPage,
} = require('./additional-toolbar-runtime-smoke.cjs')

const modes = [
    {
        mode: 'listen',
        rows: [
            ['图片', true],
            ['切读', true],
        ],
    },
    { mode: 'read', rows: [] },
    {
        mode: 'translate',
        rows: [
            ['输入方式', '抄写'],
            ['图片', true],
            ['翻译', true],
            ['切读', true],
        ],
    },
    {
        mode: 'check',
        rows: [
            ['图片', true],
            ['切读', true],
        ],
    },
    {
        mode: 'typing',
        rows: [
            ['输入方式', '抄写'],
            ['图片', true],
            ['切读', true],
        ],
    },
    ...['oral', 'blocks'].map((mode) => ({
        mode,
        rows: [
            ['图片', true],
            ['翻译', true],
            ['切读', true],
        ],
    })),
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
    throw new Error('Timed out: audio toolbar ' + description)
}

async function waitForImages(window, scope, description) {
    await waitFor(
        window,
        (selector) => {
            const root = document.querySelector(selector)
            return (
                root !== null &&
                Array.from(root.querySelectorAll('img')).every(
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
                throw new Error('Missing enabled audio toolbar action: ' + target)
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
                    .querySelectorAll('[aria-hidden="true"], kbd')
                    .forEach((node) => node.remove())
                return (
                    (element.getAttribute('aria-label')?.replace(/\s+/g, '') ===
                        label.replace(/\s+/g, '') ||
                        readable.textContent.replace(/\s+/g, '') === label.replace(/\s+/g, '')) &&
                    !element.disabled &&
                    !element.closest('[inert]') &&
                    element.getClientRects().length > 0
                )
            })
            if (!button) throw new Error('Missing audio toolbar action text: ' + label)
            button.focus()
            button.click()
        },
        text,
        scope,
    )
}

async function openOptions(window) {
    await waitFor(
        window,
        () => {
            if (document.querySelector('[data-audio-options]')) return true
            document.querySelector('[data-audio-toolbar] button[aria-label="本模式设置"]')?.click()
            return false
        },
        'local options open and hydrated',
    )
}

async function closeOptions(window) {
    await click(window, '[data-audio-toolbar] button[aria-label="本模式设置"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-audio-options]'),
        'local options close',
    )
}

async function waitBeforeNavigation(window, waitForNetworkIdle) {
    await waitForImages(window, 'body', 'images complete before navigation')
    if (typeof waitForNetworkIdle === 'function') {
        await waitForNetworkIdle(window)
        return
    }
    let quietPasses = 0
    for (let attempt = 0; attempt < 100; attempt++) {
        quietPasses = window.webContents.isLoading() ? 0 : quietPasses + 1
        if (quietPasses >= 5) return
        await delay(100)
    }
    throw new Error('Audio toolbar resources did not settle before navigation')
}

async function assertAudioScope(window) {
    const scope = await evaluate(window, () => ({
        footerKnowledge: Array.from(document.querySelectorAll('[data-practice-footer] button'))
            .map((button) => button.textContent.trim())
            .filter((label) => ['掌握', '不熟'].includes(label)),
        splitChoices: Array.from(document.querySelectorAll('[data-audio-toolbar] button'))
            .map((button) => button.textContent.trim())
            .filter((label) => ['完整', '拆分'].includes(label)),
        splitGroups: document.querySelectorAll('[data-audio-toolbar] [aria-label="句子显示方式"]')
            .length,
        audioCount: document.querySelectorAll('main[aria-label="练习内容"] audio').length,
        listening: Boolean(document.querySelector('[data-audio-listening]')),
        mode: new URLSearchParams(location.search).get('mode'),
    }))
    assert.deepEqual(scope.footerKnowledge, [], 'audio footer has no mastered or unfamiliar action')
    assert.deepEqual(scope.splitChoices, [], 'audio toolbar has no full or split choice')
    assert.equal(scope.splitGroups, 0, 'audio toolbar has no sentence split group')
    assert.equal(scope.listening, scope.mode === 'listen', 'only listening uses the shared surface')
    assert.equal(
        scope.audioCount,
        scope.mode === 'listen' ? 0 : 1,
        'listening uses its separate reading host; other modes keep the technical player',
    )
}

async function visitMode(window, origin, mode, waitForNetworkIdle) {
    await waitBeforeNavigation(window, waitForNetworkIdle)
    await resetToolbarCache(window, origin, waitForNetworkIdle)
    await window.loadURL(
        origin + '/practice/?demo=audio-basic&mode=' + mode + '&keep=audio-toolbar-smoke',
    )
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            Boolean(document.querySelector('[data-audio-toolbar]')),
        'route ' + mode,
        mode,
    )
    assert.equal(
        await evaluate(window, () => Boolean(document.querySelector('[data-audio-options]'))),
        false,
        'options start closed',
    )
    assert.equal(
        await evaluate(window, () =>
            document.querySelector('[data-audio-toolbar]')?.getAttribute('aria-label'),
        ),
        '音频练习局部设置',
    )
    await waitForImages(window, 'body', mode + ' images complete')
    await waitFor(
        window,
        (expected) => {
            if (expected === 'listen')
                return (
                    Boolean(document.querySelector('[data-audio-listening]')) &&
                    Boolean(
                        document.querySelector(
                            '[data-audio-listening-controls] button[aria-label="播放"]:enabled, [data-audio-listening-controls] button[aria-label="暂停"]:enabled',
                        ),
                    )
                )
            const audio = document.querySelector('main[aria-label="练习内容"] audio')
            return (
                audio !== null &&
                audio.readyState >= 1 &&
                Number.isFinite(audio.duration) &&
                audio.duration > 0
            )
        },
        mode + ' player or shared reading controls ready',
        mode,
    )
    await assertAudioScope(window)
}

async function readRows(window) {
    return evaluate(window, () =>
        Array.from(document.querySelector('[data-audio-options]')?.children ?? [])
            .filter((element) => element.tagName === 'DIV')
            .map((element) => {
                const toggle = element.querySelector('[role="switch"]')
                if (toggle)
                    return [
                        toggle.getAttribute('aria-label'),
                        toggle.getAttribute('aria-checked') === 'true',
                    ]
                return [
                    element.getAttribute('aria-label'),
                    element.querySelector('button[aria-pressed="true"]')?.textContent.trim(),
                ]
            }),
    )
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
                color: style.color,
                background: style.backgroundColor,
                cursor: style.cursor,
            }
        }
        const toolbar = document.querySelector('[data-audio-toolbar]')
        const options = document.querySelector('[data-audio-options]')
        const toggle = options?.querySelector('[role="switch"]')
        const track = toggle?.querySelector('[aria-hidden="true"]')
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            timer: box(toolbar?.querySelector('[data-audio-timer]')),
            timerText: box(toolbar?.querySelector('[data-audio-timer] > span')),
            settings: box(toolbar?.querySelector('button[aria-label="本模式设置"]')),
            popover: box(options),
            popoverArrow: box(options?.querySelector(':scope > [aria-hidden="true"]')),
            rows: Array.from(options?.children ?? [])
                .filter((element) => element.tagName === 'DIV')
                .map(box),
            switchLabel: box(toggle?.querySelector('span')),
            switchTrack: box(track),
            switchThumb: box(track?.firstElementChild),
            choices: Array.from(
                options?.querySelectorAll(':scope > [role="group"] button') ?? [],
            ).map((button) => ({
                label: button.textContent.trim(),
                box: box(button),
                selected: button.getAttribute('aria-pressed') === 'true',
            })),
            interactiveCursors: Array.from(toolbar?.querySelectorAll('button') ?? []).map(
                (button) => ({
                    label: button.getAttribute('aria-label'),
                    cursor: getComputedStyle(button).cursor,
                }),
            ),
            toolbarButtonCount: toolbar?.querySelectorAll('button').length ?? 0,
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
    assert.deepEqual(measured.viewport, [1920, 1080])
    assertNear(measured.timer.x, 16, 'timer x')
    assertNear(measured.timer.y, 95, 'timer y')
    assertNear(measured.timer.width, 84, 'timer width')
    assertNear(measured.timer.height, 26, 'timer height')
    assert.equal(measured.timerText.fontSize, '14px')
    assert.equal(measured.timerText.lineHeight, '20px')
    assert.equal(measured.timerText.fontWeight, '400')
    if (definition.rows.length === 0) {
        assert.equal(measured.toolbarButtonCount, 0, 'reading toolbar contains the timer only')
        assert.equal(measured.settings, null)
        assert.equal(measured.popover, null)
    } else {
        assertNear(measured.settings.x, 112, 'settings x')
        assertNear(measured.settings.y, 95, 'settings y')
        assertNear(measured.settings.width, 26, 'settings width')
        assertNear(measured.settings.height, 26, 'settings height')
        assertNear(measured.popover.x, 93, 'popover x')
        assertNear(measured.popover.y, 131, 'popover y')
        assertNear(measured.popover.width, 64, 'popover width')
        assertNear(measured.popover.height, definition.rows.length * 24, 'popover height')
        assertNear(measured.popoverArrow.width, 11, 'popover arrow width')
        assertNear(measured.popoverArrow.height, 6, 'popover arrow height')
        assert.equal(measured.rows.length, definition.rows.length)
        for (const row of measured.rows) assertNear(row.height, 24, 'option row height')
        assert.equal(measured.switchLabel.fontSize, '12px')
        assert.equal(measured.switchLabel.lineHeight, '18px')
        assert.equal(measured.switchLabel.fontWeight, '400')
        assertNear(measured.switchTrack.width, 26, 'switch track width')
        assertNear(measured.switchTrack.height, 14, 'switch track height')
        assertNear(measured.switchThumb.width, 12, 'switch thumb width')
        assertNear(measured.switchThumb.height, 12, 'switch thumb height')
        for (const choice of measured.choices) {
            assertNear(choice.box.width, 27, choice.label + ' choice width')
            assertNear(choice.box.height, 16, choice.label + ' choice height')
            assert.equal(choice.box.fontSize, '10px')
            assert.equal(choice.box.lineHeight, '14px')
            assert.equal(choice.box.fontWeight, '400')
        }
    }
    assert.equal(measured.horizontalOverflow, false)
    assert.equal(measured.toolbarOverflow, false)
    assert.deepEqual(measured.brokenImages, [])
    assert.ok(measured.interactiveCursors.every(({ cursor }) => cursor === 'pointer'))
}

async function answerState(window) {
    return evaluate(window, () => {
        const main = document.querySelector('main[aria-label="练习内容"]')
        return {
            search: location.search,
            progress: document
                .querySelector('[data-practice-progress]')
                ?.getAttribute('aria-valuenow'),
            input: main?.querySelector('input[aria-label="练习答案"]')?.value ?? null,
            english: Array.from(main?.querySelectorAll('[data-practice-english]') ?? []).map(
                (element) => element.textContent,
            ),
            blocks: Array.from(
                main?.querySelectorAll('[aria-label="已选择的词块，点击撤回"] button') ?? [],
            ).map((element) => ({
                text: element.textContent,
                label: element.getAttribute('aria-label'),
                disabled: element.disabled,
            })),
            statuses: Array.from(main?.querySelectorAll('[role="status"]') ?? [])
                .map((element) =>
                    element.closest('section[aria-label$="音频播放器"]')
                        ? null
                        : element.textContent,
                )
                .filter((text) => text !== null),
        }
    })
}

async function switchMode(window, mode) {
    await clickText(window, '模式', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-mode-selector="audio"]')),
        'audio mode selector',
    )
    await waitForImages(window, '[role="dialog"]', 'initial audio selector images')
    await click(window, '[data-practice-mode-option="' + mode + '"]')
    await waitFor(
        window,
        (expected) => {
            const selector = document.querySelector('[data-practice-mode-selector="audio"]')
            const preview = selector?.querySelector('[data-practice-mode-preview]')
            return (
                selector?.getAttribute('data-practice-mode-selected') === expected &&
                preview?.complete &&
                preview.naturalWidth > 0 &&
                preview.currentSrc === preview.src
            )
        },
        'audio preview ' + mode,
        mode,
    )
    await waitForImages(window, '[role="dialog"]', 'selected audio selector images')
    await click(window, '[data-practice-mode-start]')
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            !document.querySelector('[role="dialog"]') &&
            Boolean(document.querySelector('[data-audio-toolbar]')),
        'changed audio mode ' + mode,
        mode,
    )
    await waitForImages(window, 'body', 'changed audio page images ' + mode)
    await assertAudioScope(window)
}

async function checkListeningMediaPreservation(window) {
    await closeOptions(window)
    await evaluate(window, () => {
        const state = {
            originalPlay: HTMLMediaElement.prototype.play,
            element: null,
            replacements: 0,
            originalLoop: false,
            originalMuted: false,
            events: { loadstart: 0, emptied: 0, pause: 0 },
            listeners: [],
        }
        window.audioToolbarReadingCheck = state
        HTMLMediaElement.prototype.play = function (...args) {
            if (
                this instanceof HTMLAudioElement &&
                this.src.includes('/practice-demo/sentence-listening/')
            ) {
                if (state.element === null) {
                    state.element = this
                    state.originalLoop = this.loop
                    state.originalMuted = this.muted
                    this.loop = true
                    this.muted = true
                    for (const name of Object.keys(state.events)) {
                        const handler = () => state.events[name]++
                        this.addEventListener(name, handler)
                        state.listeners.push([name, handler])
                    }
                } else if (state.element !== this) state.replacements++
            }
            return state.originalPlay.apply(this, args)
        }
    })
    try {
        if (
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        '[data-audio-listening-controls] button[aria-label="暂停"]',
                    ),
                ),
            )
        )
            await click(window, '[data-audio-listening-controls] button[aria-label="暂停"]')
        await click(window, '[data-audio-listening-controls] button[aria-label="播放"]')
        await waitFor(
            window,
            () => {
                const audio = window.audioToolbarReadingCheck.element
                return audio && !audio.paused && audio.readyState >= 2 && audio.currentTime > 0
            },
            'shared reading host really plays its local WAV',
        )
        const original = await evaluate(window, () => {
            const state = window.audioToolbarReadingCheck
            state.events = { loadstart: 0, emptied: 0, pause: 0 }
            return {
                source: state.element.src,
                volume: state.element.volume,
                rate: state.element.playbackRate,
            }
        })
        assert.match(original.source, /\/practice-demo\/sentence-listening\/.+\.wav$/)
        await openOptions(window)
        for (const name of ['图片', '切读']) {
            for (const checked of [false, true]) {
                await click(
                    window,
                    '[data-audio-options] [role="switch"][aria-label="' + name + '"]',
                )
                await waitFor(
                    window,
                    (label, expected) =>
                        document
                            .querySelector(
                                '[data-audio-options] [role="switch"][aria-label="' + label + '"]',
                            )
                            ?.getAttribute('aria-checked') === String(expected),
                    'local choice updates independently of manual playback',
                    name,
                    checked,
                )
                if (name === '图片')
                    assert.equal(
                        await evaluate(window, () =>
                            Boolean(
                                document.querySelector(
                                    '[data-audio-listening] [data-practice-media]',
                                ),
                            ),
                        ),
                        checked,
                    )
                const current = await evaluate(window, () => {
                    const state = window.audioToolbarReadingCheck
                    return {
                        source: state.element.src,
                        volume: state.element.volume,
                        rate: state.element.playbackRate,
                        playing: !state.element.paused,
                        replacements: state.replacements,
                        events: { ...state.events },
                    }
                })
                assert.equal(current.source, original.source)
                assert.equal(current.volume, original.volume)
                assert.equal(current.rate, original.rate)
                assert.equal(current.playing, true)
                assert.equal(current.replacements, 0)
                assert.deepEqual(current.events, { loadstart: 0, emptied: 0, pause: 0 })
            }
        }
        await closeOptions(window)
        await click(window, '[data-audio-listening-controls] button[aria-label="暂停"]')
        await waitFor(
            window,
            () => window.audioToolbarReadingCheck.element.paused,
            'manual pause stops the shared reading host',
        )
        const final = await evaluate(window, () => {
            const state = window.audioToolbarReadingCheck
            return {
                source: state.element.src,
                volume: state.element.volume,
                rate: state.element.playbackRate,
                replacements: state.replacements,
                loadstart: state.events.loadstart,
                emptied: state.events.emptied,
            }
        })
        assert.deepEqual(final, { ...original, replacements: 0, loadstart: 0, emptied: 0 })
        await openOptions(window)
        return {
            sharedReadingHost: true,
            localChoicesPreserveElementSourceAndManualPlayback: true,
            manualPausePreserved: true,
            noReload: true,
        }
    } finally {
        await evaluate(window, () => {
            const state = window.audioToolbarReadingCheck
            if (!state) return
            HTMLMediaElement.prototype.play = state.originalPlay
            if (state.element) {
                state.element.pause()
                for (const [name, handler] of state.listeners)
                    state.element.removeEventListener(name, handler)
                state.element.loop = state.originalLoop
                state.element.muted = state.originalMuted
            }
            delete window.audioToolbarReadingCheck
        })
    }
}

async function checkMediaPreservation(window, definition) {
    if (definition.mode === 'listen') return checkListeningMediaPreservation(window)
    const original = await evaluate(window, () => {
        const audio = document.querySelector('main[aria-label="练习内容"] audio')
        if (!audio) throw new Error('Missing audio for local toolbar preservation check')
        const state = {
            element: audio,
            originalLoop: audio.loop,
            originalMuted: audio.muted,
            events: { loadstart: 0, emptied: 0, pause: 0 },
            listeners: [],
        }
        for (const name of Object.keys(state.events)) {
            const handler = () => state.events[name]++
            audio.addEventListener(name, handler)
            state.listeners.push([name, handler])
        }
        audio.loop = true
        audio.muted = true
        window.audioToolbarMediaCheck = state
        return {
            source: audio.getAttribute('src'),
            currentSource: audio.currentSrc,
            volume: audio.volume,
            rate: audio.playbackRate,
        }
    })
    try {
        await clickText(window, '播放', 'section[aria-label$="音频播放器"]')
        await waitFor(
            window,
            () => {
                const audio = document.querySelector('main[aria-label="练习内容"] audio')
                return audio !== null && !audio.paused && audio.currentTime > 0
            },
            'real audio playing before local choices',
        )
        await openOptions(window)
        for (const [name, value] of definition.rows) {
            for (const next of [
                typeof value === 'boolean' ? !value : value === '抄写' ? '默写' : '抄写',
                value,
            ]) {
                if (typeof next === 'boolean')
                    await click(
                        window,
                        '[data-audio-options] [role="switch"][aria-label="' + name + '"]',
                    )
                else await clickText(window, next, '[data-audio-options] [aria-label="输入方式"]')
                await waitFor(
                    window,
                    (label, selected) => {
                        const panel = document.querySelector('[data-audio-options]')
                        return typeof selected === 'boolean'
                            ? panel
                                  ?.querySelector('[role="switch"][aria-label="' + label + '"]')
                                  ?.getAttribute('aria-checked') === String(selected)
                            : panel
                                  ?.querySelector(
                                      '[aria-label="输入方式"] button[aria-pressed="true"]',
                                  )
                                  ?.textContent.trim() === selected
                    },
                    name + ' selected during audio playback',
                    name,
                    next,
                )
                const current = await evaluate(window, () => {
                    const audio = document.querySelector('main[aria-label="练习内容"] audio')
                    const check = window.audioToolbarMediaCheck
                    return {
                        sameElement: audio === check.element,
                        source: audio?.getAttribute('src'),
                        currentSource: audio?.currentSrc,
                        volume: audio?.volume,
                        rate: audio?.playbackRate,
                        playing: audio !== null && !audio.paused,
                        ready: audio !== null && audio.readyState >= 2,
                        events: { ...check.events },
                    }
                })
                assert.equal(current.sameElement, true, name + ' preserves the audio DOM node')
                assert.equal(current.source, original.source, name + ' preserves the audio source')
                assert.equal(
                    current.currentSource,
                    original.currentSource,
                    name + ' preserves the resolved audio source',
                )
                assert.equal(current.volume, original.volume, name + ' preserves audio volume')
                assert.equal(current.rate, original.rate, name + ' preserves audio playback rate')
                assert.equal(current.playing, true, name + ' keeps audio playing')
                assert.equal(current.ready, true, name + ' keeps audio ready')
                assert.deepEqual(
                    current.events,
                    { loadstart: 0, emptied: 0, pause: 0 },
                    name + ' causes no media reload or pause',
                )
            }
        }
        assert.deepEqual(
            await readRows(window),
            definition.rows,
            'media check restores local choices',
        )
        await closeOptions(window)
        await clickText(window, '暂停', 'section[aria-label$="音频播放器"]')
        await waitFor(
            window,
            () => document.querySelector('main[aria-label="练习内容"] audio')?.paused === true,
            'audio pauses after preservation check',
        )
        await openOptions(window)
        return {
            sameElementAndSource: true,
            remainsPlayingAcrossLocalChoices: true,
            noReloadOrPause: true,
        }
    } finally {
        await evaluate(window, () => {
            const state = window.audioToolbarMediaCheck
            if (!state) return
            for (const [name, handler] of state.listeners)
                state.element.removeEventListener(name, handler)
            state.element.loop = state.originalLoop
            state.element.muted = state.originalMuted
            delete window.audioToolbarMediaCheck
        })
    }
}

async function checkStateLifetime(window, definition, waitForNetworkIdle) {
    const hasInput = await evaluate(window, () =>
        Boolean(document.querySelector('input[aria-label="练习答案"]')),
    )
    if (hasInput) {
        await evaluate(window, () => {
            const input = document.querySelector('input[aria-label="练习答案"]')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                'audio draft',
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await waitFor(
            window,
            () => document.querySelector('input[aria-label="练习答案"]')?.value === 'audio draft',
            'input draft',
        )
    }
    const before = await answerState(window)
    const expected = []
    for (const [name, value] of definition.rows) {
        const next = typeof value === 'boolean' ? !value : value === '默写' ? '抄写' : '默写'
        expected.push([name, next])
        if (typeof value === 'boolean')
            await click(window, '[data-audio-options] [role="switch"][aria-label="' + name + '"]')
        else await clickText(window, next, '[data-audio-options] [aria-label="' + name + '"]')
        await waitFor(
            window,
            (label, selected) => {
                const panel = document.querySelector('[data-audio-options]')
                return typeof selected === 'boolean'
                    ? panel
                          ?.querySelector('[role="switch"][aria-label="' + label + '"]')
                          ?.getAttribute('aria-checked') === String(selected)
                    : panel
                          ?.querySelector(
                              '[aria-label="' + label + '"] button[aria-pressed="true"]',
                          )
                          ?.textContent.trim() === selected
            },
            name + ' selected',
            name,
            next,
        )
        assert.deepEqual(
            await answerState(window),
            before,
            name + ' preserves input, stage, blocks and shown English',
        )
    }
    assert.deepEqual(await readRows(window), expected)
    for (const [name, selector] of [
        ['图片', '[data-practice-media]'],
        ['翻译', '[data-practice-translation]'],
    ]) {
        if (!definition.rows.some(([row]) => row === name)) continue
        assert.equal(
            await evaluate(
                window,
                (target) =>
                    Boolean(document.querySelector('main[aria-label="练习内容"] ' + target)),
                selector,
            ),
            false,
            definition.mode + ' hides real ' + name,
        )
        await click(window, '[data-audio-options] [role="switch"][aria-label="' + name + '"]')
        await waitFor(
            window,
            (target) => Boolean(document.querySelector('main[aria-label="练习内容"] ' + target)),
            definition.mode + ' restores real ' + name,
            selector,
        )
        await click(window, '[data-audio-options] [role="switch"][aria-label="' + name + '"]')
    }
    await closeOptions(window)
    const settingsBefore = await answerState(window)
    await clickText(window, '设置', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"] [aria-label="设置分类"]')),
        'full settings opens',
    )
    await waitForImages(window, '[role="dialog"]', 'full settings images')
    await click(window, '[role="dialog"] button[aria-label="关闭对话框"]')
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'full settings closes')
    assert.deepEqual(
        await answerState(window),
        settingsBefore,
        'full settings preserves answer state',
    )
    await openOptions(window)
    assert.deepEqual(await readRows(window), expected, 'full settings preserves local options')
    await closeOptions(window)
    await clickText(window, '下一题', '[data-practice-footer]')
    await waitFor(
        window,
        () =>
            document.querySelector('[data-practice-progress]')?.getAttribute('aria-valuenow') ===
            '2',
        'next audio question',
    )
    await openOptions(window)
    assert.deepEqual(await readRows(window), expected, 'question change preserves local options')
    await closeOptions(window)
    await switchMode(window, 'read')
    await switchMode(window, definition.mode)
    await openOptions(window)
    assert.deepEqual(await readRows(window), expected, 'mode reentry restores cached options')
    assert.equal((await answerState(window)).input ?? '', '', 'mode reentry clears draft')
    await closeOptions(window)
    await reloadToolbarPage(window, waitForNetworkIdle)
    await openOptions(window)
    assert.deepEqual(await readRows(window), expected, 'refresh restores cached local options')
    await closeOptions(window)
    return {
        localChoicesPreserveAnswerState: true,
        contentUnchangedByCopyOrCut: true,
        imageAndTranslationVisibility: true,
        fullSettingsPreservesInputUrlQuestion: true,
        questionChangePreservesOptions: true,
        modeChangeRestoresCachedOptions: true,
        refreshRestoresCachedOptions: true,
        inputChecked: hasInput,
    }
}

async function press(window, keyCode, modifiers = []) {
    const electronKey = { Enter: 'Return' }[keyCode] ?? keyCode
    window.webContents.focus()
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: electronKey, modifiers })
    if (keyCode === 'Enter')
        window.webContents.sendInputEvent({ type: 'char', keyCode: '\r', modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: electronKey, modifiers })
    await delay(75)
}

async function checkDismissal(window) {
    await click(window, '[data-audio-toolbar] button[aria-label="本模式设置"]')
    await waitFor(
        window,
        () =>
            Boolean(
                document.querySelector('[data-audio-options]')?.contains(document.activeElement),
            ),
        'initial option focus',
    )
    await press(window, 'Escape')
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-audio-options]') &&
            document.activeElement?.getAttribute('aria-label') === '本模式设置',
        'Escape focus return',
    )
    await openOptions(window)
    await evaluate(window, () =>
        document
            .querySelector('[data-practice-progress]')
            .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
    )
    await waitFor(
        window,
        () => !document.querySelector('[data-audio-options]'),
        'outside pointer closes options',
    )
    await openOptions(window)
    await evaluate(window, () => {
        const controls = document.querySelector('[data-audio-options]').querySelectorAll('button')
        controls[controls.length - 1].focus()
    })
    await press(window, 'Tab')
    await waitFor(
        window,
        () => !document.querySelector('[data-audio-options]'),
        'Tab leaves options',
    )
    return {
        initialFocusInsideOptions: true,
        escapeRestoresFocus: true,
        outsidePointerCloses: true,
        tabLeavesOptions: true,
    }
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
    const region = { x: 0, y: 80, width: 220, height: 210 }
    writeFileSync(
        resolve(path),
        (await window.webContents.capturePage(toolbarOnly ? region : undefined)).toPNG(),
    )
    if (!toolbarOnly && path.endsWith('-pc.png'))
        writeFileSync(
            resolve(path.replace(/-pc\.png$/, '-toolbar.png')),
            (await window.webContents.capturePage(region)).toPNG(),
        )
    return path
}

async function setTheme(window, origin, theme, waitForNetworkIdle) {
    if (
        await evaluate(
            window,
            (expected) => document.documentElement.dataset.theme === expected,
            theme,
        )
    ) {
        await waitForImages(window, 'body', 'current theme images complete ' + theme)
        return
    }
    await waitBeforeNavigation(window, waitForNetworkIdle)
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
    await waitForImages(window, 'body', 'changed theme images complete ' + theme)
}

async function runAudioToolbarChecks(window, origin, label, waitForNetworkIdle) {
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
            '计时、默写/抄写与切读保持本地演示，不新增输入判题、切读音源或麦克风能力；音频模式不提供完整/拆分',
            '局部设置按内容族与小模式缓存，切回和刷新恢复；输入保持原单题会话边界',
            'PC计算样式、几何、重排及真实页面缩放由脚本检查，平板/H5视觉和真机兼容待用户验收',
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
        await setTheme(window, origin, 'dark', waitForNetworkIdle)
        for (const definition of modes) {
            await visitMode(window, origin, definition.mode, waitForNetworkIdle)
            if (definition.rows.length > 0) await openOptions(window)
            await assertAudioScope(window)
            assert.deepEqual(
                await readRows(window),
                definition.rows,
                definition.mode + ' row order and defaults',
            )
            const reference = await measure(window)
            assertReference(reference, definition)
            const screenshot = await capture(
                window,
                'dist/audio-toolbar-' + label.toLowerCase() + '-' + definition.mode + '-pc.png',
            )
            const entry = {
                mode: definition.mode,
                reference,
                screenshot,
                toolbarScreenshot: screenshot.replace(/-pc\.png$/, '-toolbar.png'),
            }
            if (definition.rows.length > 0) {
                entry.media = await checkMediaPreservation(window, definition)
                entry.lifetime = await checkStateLifetime(window, definition, waitForNetworkIdle)
                entry.dismissal = await checkDismissal(window)
            }
            result.modes.push(entry)
        }
        await setTheme(window, origin, 'light', waitForNetworkIdle)
        result.lightTheme = []
        for (const definition of modes) {
            await visitMode(window, origin, definition.mode, waitForNetworkIdle)
            if (definition.rows.length > 0) await openOptions(window)
            await assertAudioScope(window)
            const reference = await measure(window)
            assertReference(reference, definition)
            assert.equal(reference.theme, 'light')
            const toolbarScreenshot = await capture(
                window,
                'dist/audio-toolbar-' +
                    label.toLowerCase() +
                    '-light-' +
                    definition.mode +
                    '-toolbar.png',
                true,
            )
            result.lightTheme.push({ mode: definition.mode, reference, toolbarScreenshot })
            if (definition.rows.length > 0) await closeOptions(window)
        }
        await setTheme(window, origin, 'dark', waitForNetworkIdle)
        result.pcReflow = []
        result.pageZoom = []
        for (const mode of ['listen', 'read', 'translate']) {
            await visitMode(window, origin, mode, waitForNetworkIdle)
            if (mode !== 'read') await openOptions(window)
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
                assert.equal(
                    await evaluate(
                        window,
                        () => getComputedStyle(document.documentElement).fontSize,
                    ),
                    '16px',
                    'zoom keeps root font size',
                )
                result.pageZoom.push({ mode, factor, measured })
            }
            window.webContents.setZoomFactor(1)
            if (mode !== 'read') await closeOptions(window)
        }
        assert.deepEqual(businessRequests, [], 'audio toolbar sends no business requests')
        assert.deepEqual(permissionRequests, [], 'audio toolbar requests no microphone permission')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failure = await evaluate(window, () => ({
                url: location.href,
                activeElement: document.activeElement?.outerHTML ?? null,
                options: document.querySelector('[data-audio-options]')?.outerHTML ?? null,
            }))
            result.failureScreenshot = await capture(
                window,
                'dist/audio-toolbar-' + label.toLowerCase() + '-failure.png',
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
                await setTheme(window, origin, originalTheme, waitForNetworkIdle)
        } finally {
            await restoreToolbarCache(window, originalToolbarCache)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/audio-toolbar-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runAudioToolbarChecks }
