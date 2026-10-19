const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')

const inputSelector = 'input[data-practice-answer-input]'
const storageKeys = [
    'english-learning-preferences-v1',
    'english-learning-practice-toolbar-options-v1',
    'english-learning-theme',
]
const consumers = [
    ['word-basic', 'spell', ['woman']],
    ['word-basic', 'dictate', ['woman']],
    ['sentence-basic', 'translate', ['we', 'read', 'books', 'together']],
    ['picture-basic', 'translate', ['brush', 'teeth']],
    ['audio-basic', 'translate', ['we', 'read', 'books', 'together']],
    ['video-basic', 'translate', ['we', 'read', 'books', 'together']],
    ['typing-basic', 'typing', ['we', 'read', 'books', 'together']],
    ['picture-basic', 'typing', ['Nice', 'to', 'meet', 'you']],
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error('Timed out: word slot input ' + description)
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'document and images ready',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function visit(window, origin, demo, mode) {
    await settle(window)
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () =>
            document.querySelector('main[data-toolbar-ready="true"]') &&
            document.querySelector('[data-word-slot-input]') &&
            document.querySelector('input[data-practice-answer-input]') &&
            document.querySelector('[data-practice-paused="false"]'),
        demo + ':' + mode + ' ready',
    )
    await settle(window)
}

async function snapshot(window) {
    return evaluate(
        window,
        (selector) => {
            const input = document.querySelector(selector)
            const root = document.querySelector('[data-word-slot-input]')
            const rect = root?.getBoundingClientRect()
            return {
                value: input?.value,
                selection: [input?.selectionStart, input?.selectionEnd],
                focused: document.activeElement === input,
                phase: document.querySelector('[data-practice-phase]')?.dataset.practicePhase,
                index: Number(
                    document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
                ),
                paused: document.querySelector('[data-practice-paused]')?.dataset.practicePaused,
                viewport: [innerWidth, innerHeight],
                devicePixelRatio,
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                theme: document.documentElement.dataset.theme,
                root: rect
                    ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    : null,
                fontSize: root ? getComputedStyle(root).fontSize : null,
                slots: Array.from(root?.querySelectorAll('[data-word-slot]') ?? [], (slot) => {
                    const bounds = slot.getBoundingClientRect()
                    const scroll = slot.parentElement
                    const scrollBounds = scroll?.getBoundingClientRect()
                    const answer = slot.querySelector('[data-word-slot-answer]')
                    const text = answer?.firstChild
                    let lastGlyph = null
                    if (text?.nodeType === Node.TEXT_NODE && text.textContent.length > 0) {
                        const range = document.createRange()
                        range.setStart(text, text.textContent.length - 1)
                        range.setEnd(text, text.textContent.length)
                        const glyph = range.getBoundingClientRect()
                        lastGlyph = { left: glyph.left, right: glyph.right }
                    }
                    return {
                        index: Number(slot.dataset.wordSlot),
                        target: slot.dataset.wordSlotTarget,
                        value: slot.dataset.wordSlotValue,
                        active: slot.dataset.wordSlotActive === 'true',
                        start: Number(slot.dataset.wordSlotStart),
                        end: Number(slot.dataset.wordSlotEnd),
                        tabIndex: slot.tabIndex,
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                        bottom: bounds.bottom,
                        paddingRight: getComputedStyle(slot).paddingRight,
                        border: getComputedStyle(slot).borderBottomWidth,
                        placeholderVisibility: getComputedStyle(
                            slot.querySelector('[data-word-slot-placeholder]'),
                        ).visibility,
                        answer: answer?.textContent,
                        answerScrollWidth: answer?.scrollWidth,
                        lastGlyph,
                        scrollWidth: scroll?.scrollWidth,
                        clientWidth: scroll?.clientWidth,
                        scrollHeight: scroll?.scrollHeight,
                        clientHeight: scroll?.clientHeight,
                        scrollLeft: scroll?.scrollLeft,
                        scrollBounds: scrollBounds
                            ? {
                                  left: scrollBounds.left,
                                  right: scrollBounds.right,
                                  bottom: scrollBounds.bottom,
                              }
                            : null,
                        scrollOverflow: scroll ? getComputedStyle(scroll).overflowX : null,
                        scrollOverflowY: scroll ? getComputedStyle(scroll).overflowY : null,
                    }
                }),
                punctuation: Array.from(
                    root?.querySelectorAll('[data-word-slot-punctuation]') ?? [],
                    (element) => element.textContent,
                ),
                submissionMessages: Array.from(document.querySelectorAll('[role="status"]'))
                    .map((element) => element.textContent)
                    .filter((text) => text?.includes('本地作答已提交')),
                keys: window.__wordInputSmokeKeys ?? [],
            }
        },
        inputSelector,
    )
}

async function focusInput(window, start, end = start) {
    await evaluate(
        window,
        (selector, from, to) => {
            const input = document.querySelector(selector)
            input.focus({ preventScroll: true })
            if (from !== undefined) {
                input.setSelectionRange(from, to)
                input.dispatchEvent(new Event('select', { bubbles: true }))
            }
        },
        inputSelector,
        start,
        end,
    )
}

async function press(window, key, modifiers = []) {
    const sequence = await evaluate(window, () => {
        if (!window.__wordInputSmokeKeys) {
            window.__wordInputSmokeKeys = []
            window.addEventListener(
                'keydown',
                (event) => {
                    const entry = {
                        key: event.key,
                        shift: event.shiftKey,
                        control: event.ctrlKey,
                        meta: event.metaKey,
                        trusted: event.isTrusted,
                    }
                    window.__wordInputSmokeKeys.push(entry)
                    // 原生事件会在监听器之间清空微任务；下一任务才能读取冒泡处理后的结果。
                    setTimeout(() => {
                        entry.prevented = event.defaultPrevented
                    }, 0)
                },
                true,
            )
        }
        return window.__wordInputSmokeKeys.length
    })
    const keyCode = { ArrowLeft: 'Left', ArrowRight: 'Right' }[key] ?? key
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    await waitFor(
        window,
        (prior) => typeof window.__wordInputSmokeKeys[prior]?.prevented === 'boolean',
        'native key finishes dispatching: ' + key,
        sequence,
    )
    const event = await evaluate(window, (index) => window.__wordInputSmokeKeys[index], sequence)
    assert.equal(event.trusted, true, 'keyboard evidence is a Chromium trusted event')
    if (
        !event.prevented &&
        !modifiers.some((modifier) => ['control', 'alt', 'meta'].includes(modifier))
    ) {
        const text =
            key === 'Space'
                ? ' '
                : key === 'Enter'
                  ? '\r'
                  : key.length === 1
                    ? modifiers.includes('shift')
                        ? key.toUpperCase()
                        : key.toLowerCase()
                    : null
        if (text) window.webContents.sendInputEvent({ type: 'char', keyCode: text, modifiers })
    }
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await delay(50)
    return event
}

async function replaceNative(window, text) {
    const current = await snapshot(window)
    await focusInput(window, 0, current.value.length)
    await window.webContents.insertText(text)
    await waitFor(
        window,
        (selector, expected) => document.querySelector(selector)?.value === expected,
        'native text is preserved',
        inputSelector,
        text,
    )
    await settle(window)
}

async function click(window, selector) {
    const point = await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing interactive word input action: ' + target)
            element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            const rect = element.getBoundingClientRect()
            return {
                x: Math.round(rect.x + Math.min(20, rect.width / 2)),
                y: Math.round(rect.y + rect.height / 2),
            }
        },
        selector,
    )
    window.webContents.sendInputEvent({ type: 'mouseMove', ...point })
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        button: 'left',
        clickCount: 1,
        ...point,
    })
    window.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...point })
    await delay(60)
}

function assertGeometry(state, description, zoom = 1) {
    assert.equal(state.overflow, false, description + ': no page horizontal overflow')
    assert.ok(state.root?.width > 0, description + ': visible word input root')
    assert.ok(
        state.root.x >= -1 && state.root.x + state.root.width <= state.viewport[0] + 1,
        description + ': root stays inside the CSS viewport',
    )
    for (const slot of state.slots) {
        assert.equal(slot.tabIndex, -1, description + ': native Tab skips word controls')
        if (zoom === 1) assert.equal(slot.border, '3px', description + ': reference line thickness')
        else {
            const border = Number.parseFloat(slot.border)
            const tolerance = 1 / state.devicePixelRatio
            assert.ok(
                Number.isFinite(border) && Math.abs(border - 3) <= tolerance + 0.000001,
                description +
                    ': 3 CSS px line stays within one physical pixel after zoom quantization',
            )
        }
        assert.equal(slot.placeholderVisibility, 'hidden', description + ': target does not leak')
        assert.ok(slot.width > 0 && slot.height > 0, description + ': real text has geometry')
        assert.equal(
            slot.scrollOverflowY,
            'hidden',
            description + ': word containers do not acquire a vertical scrollbar',
        )
        assert.ok(
            slot.bottom <= slot.scrollBounds.bottom + 1,
            description + ': actual underline remains inside the vertical clipping boundary',
        )
    }
}

function assertEditingEndVisible(state, description) {
    const slot = state.slots[0]
    assert.ok(
        slot.scrollLeft > 0,
        description + ': editing follows the latest character by scrolling the local viewport',
    )
    assert.ok(
        slot.lastGlyph &&
            slot.lastGlyph.left >= slot.scrollBounds.left - 1 &&
            slot.lastGlyph.right <= slot.scrollBounds.right + 1,
        description + ': the actual final glyph is inside the visible local scroll viewport',
    )
}

async function checkNativeEditing(window, origin) {
    await visit(window, origin, 'picture-basic', 'translate')
    const empty = await snapshot(window)
    assert.deepEqual(
        empty.slots.map((slot) => slot.target),
        ['brush', 'teeth'],
    )
    await click(window, '[data-word-slot="0"]')
    await window.webContents.insertText('brush')
    await press(window, 'Space')
    let state = await snapshot(window)
    assert.equal(state.value, 'brush ')
    assert.equal(state.slots[1].active, true, 'native space activates the next word')
    await window.webContents.insertText('teeth')
    await settle(window)
    await click(window, '[data-word-slot="0"]')
    state = await snapshot(window)
    assert.equal(state.focused, true)
    assert.deepEqual(state.selection, [5, 5], 'word click places the native caret at word end')
    assert.equal(state.value, 'brush teeth', 'clicking an existing word preserves all input')
    await press(window, 'ArrowRight')
    state = await snapshot(window)
    assert.deepEqual(state.selection, [6, 6])
    assert.equal(state.slots[1].active, true, 'native arrow movement updates the active word')
    await press(window, 'ArrowLeft')
    assert.deepEqual((await snapshot(window)).selection, [5, 5])
    const enter = await press(window, 'Enter')
    state = await snapshot(window)
    assert.equal(enter.prevented, true, 'Enter follows the existing unified submit command')
    assert.equal(state.value, 'brush teeth')
    assert.equal(state.phase, 'answering', 'submit does not manufacture a judgment')
    assert.equal(state.index, 0, 'submit does not advance the question')
    assert.equal(state.submissionMessages.length, 1, 'one visible local submission result')
    await press(window, 'Tab')
    state = await snapshot(window)
    assert.equal(state.focused, false, 'Tab moves to the next native focus target')
    assert.equal(state.value, 'brush teeth', 'Tab does not become a word separator')
    assert.equal(
        state.slots.some((slot) => slot.active),
        false,
    )
    await click(window, '[data-practice-navigation-action="settings"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'settings opens after native Tab',
    )
    await click(window, 'button[aria-label="关闭对话框"]')
    await waitFor(
        window,
        () => !document.querySelector('[role="dialog"]'),
        'settings finishes closing',
    )
    const afterSettings = await snapshot(window)
    assert.equal(
        afterSettings.focused,
        false,
        'closing settings respects its restored native focus',
    )
    assert.equal(afterSettings.value, 'brush teeth', 'settings does not replace input text')
    await replaceNative(window, '')
    await press(window, 'A', ['shift'])
    assert.equal((await snapshot(window)).value, 'A', 'Shift letters remain native uppercase input')
    const controlKey = await press(window, 'A', ['control'])
    assert.equal(controlKey.prevented, false, 'Control+A remains available to native editing')
    const controlSelection = await snapshot(window)
    assert.equal(controlSelection.phase, 'answering')
    assert.equal(controlSelection.index, 0, 'Control+A never dispatches a practice command')
    const selectModifier = process.platform === 'darwin' ? 'meta' : 'control'
    const selectKey = await press(window, 'A', [selectModifier])
    assert.equal(selectKey.prevented, false, 'platform select-all shortcut is not intercepted')
    // 后台宿主不执行macOS菜单加速键；直接发送Chromium编辑命令验证原生选区。
    window.webContents.selectAll()
    await waitFor(
        window,
        (selector) => {
            const input = document.querySelector(selector)
            return input.selectionStart === 0 && input.selectionEnd === 1
        },
        'native host selectAll command',
        inputSelector,
    )
    assert.deepEqual((await snapshot(window)).selection, [0, 1], 'Chromium native host selectAll')
    await window.webContents.insertText('replacement two words')
    await settle(window)
    assert.equal((await snapshot(window)).value, 'replacement two words')
    await press(window, 'Backspace')
    state = await snapshot(window)
    assert.equal(state.value, 'replacement two word', 'native Backspace preserves multiword edits')
    assert.deepEqual(
        state.slots.map((slot) => slot.value),
        ['replacement', 'two word'],
    )
    await focusInput(window, 0, 11)
    await window.webContents.insertText('new')
    await settle(window)
    state = await snapshot(window)
    assert.equal(
        state.value,
        'new two word',
        'native selection replacement keeps the remaining text',
    )
    return {
        evidence:
            'trusted native typing and selection replacement; selectAll uses the Chromium host command, not macOS menu acceleration',
        empty,
        edited: state,
        afterSettings,
        controlKey,
        selectKey,
        controlSelection,
        selectModifier,
    }
}

async function spellingResult(window) {
    return evaluate(window, () => {
        const result = document.querySelector('[data-word-spelling-result]')
        const oral = document.querySelector('[data-practice-quick-oral]')
        const stats = result?.querySelector('dl')
        const bounds = (element) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fontSize: style.fontSize,
            }
        }
        return {
            phase: document.querySelector('[data-practice-phase]')?.dataset.practicePhase,
            index: Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex),
            result: Boolean(result),
            oral: Boolean(oral),
            oralBounds: bounds(oral),
            statsBounds: bounds(stats),
            statistics: Array.from(
                result?.querySelectorAll('dd') ?? [],
                (node) => node.textContent,
            ),
            answerPanel:
                document
                    .querySelector('[data-practice-answer-panel="answer"]')
                    ?.getAttribute('aria-hidden') === 'false',
            answer: document.querySelector('[data-practice-english]')?.textContent,
            image: document.querySelector('[data-practice-media]')?.getAttribute('src'),
        }
    })
}

async function checkWordSpelling(window, origin, label, report) {
    await visit(window, origin, 'word-basic', 'spell')
    const initial = await spellingResult(window)
    assert.equal(initial.result, false)
    assert.equal(initial.oral, false)
    assert.equal((await snapshot(window)).slots.length, 1)
    await replaceNative(window, 'woman')
    await press(window, 'Space', ['shift'])
    assert.equal((await snapshot(window)).value, 'woman ', 'Shift+Space remains native editing')
    assert.equal(
        (await spellingResult(window)).phase,
        'answering',
        'native input fallback does not submit a modified physical space',
    )
    assert.equal((await snapshot(window)).slots.length, 1)
    await replaceNative(window, 'wrong')
    await press(window, 'Enter')
    let current = await spellingResult(window)
    assert.equal(current.phase, 'incorrect')
    assert.equal(current.index, 0)
    assert.equal(current.result, false)
    assert.equal(current.oral, false)
    assert.equal((await snapshot(window)).value, 'wrong')
    await capture(window, label, 'spelling-incorrect', report)
    await replaceNative(window, 'wom')
    await press(window, 'Space')
    current = await spellingResult(window)
    assert.equal(current.phase, 'incorrect')
    assert.equal(
        (await snapshot(window)).value,
        'wom',
        'physical submit space does not insert another slot',
    )
    await replaceNative(window, 'WOMAN')
    await press(window, 'Space')
    current = await spellingResult(window)
    assert.equal(current.phase, 'correct')
    assert.equal(current.result, true)
    assert.equal(current.oral, true)
    assert.equal(current.answerPanel, true)
    assert.equal(current.answer, 'woman')
    assert.deepEqual(current.statistics, ['3', '1', '33%'])
    assert.equal(current.oralBounds.width, 234)
    assert.equal(current.oralBounds.height, 46)
    assert.equal(current.statsBounds.width, 385)
    assert.equal(current.statsBounds.height, 68)
    await waitFor(
        window,
        () => {
            const panel = document.querySelector('[data-practice-answer-panel="answer"]')
            return (
                panel &&
                Math.abs(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42) < 0.1
            )
        },
        'correct answer panel finishes its entrance',
    )
    await settle(window)
    await capture(window, label, 'spelling-correct', report)
    const responsive = []
    for (const [width, height, zoom] of [
        [1440, 900, 1],
        [1280, 800, 1],
        [1440, 900, 1.25],
        [1440, 900, 1.5],
        [1440, 900, 2],
    ]) {
        window.setContentSize(width, height)
        window.webContents.setZoomFactor(zoom)
        await settle(window)
        await evaluate(window, () => window.scrollTo(0, document.documentElement.scrollHeight))
        await settle(window)
        const reflow = await spellingResult(window)
        const page = await evaluate(window, () => ({
            width: innerWidth,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            footerTop: document.querySelector('[data-practice-footer]').getBoundingClientRect().top,
        }))
        assert.equal(reflow.phase, 'correct')
        assert.equal(page.overflow, false, 'correct result does not widen the page')
        assert.ok(
            reflow.statsBounds.y + reflow.statsBounds.height <= page.footerTop + 1,
            'scrolled result remains above the fixed footer',
        )
        responsive.push({ width, height, zoom, page, result: reflow })
        await capture(window, label, 'spelling-result-' + width + '-zoom-' + zoom, report)
    }
    window.setContentSize(1920, 1080)
    window.webContents.setZoomFactor(1)
    await evaluate(window, () => window.scrollTo(0, 0))
    await settle(window)
    await press(window, 'V')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'correct answer enables oral V',
    )
    await press(window, 'Escape')
    await waitFor(
        window,
        () => !document.querySelector('[role="dialog"]'),
        'oral closes back to correct question',
    )
    assert.deepEqual((await spellingResult(window)).statistics, ['3', '1', '33%'])
    await click(window, '[data-practice-footer-action="question.next"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('input[data-practice-answer-input]')),
        'second spelling question',
    )
    assert.equal((await spellingResult(window)).result, false)
    // 真正的 Chromium insertText，不派发实体 keydown，覆盖软键盘式空格输入路径。
    await replaceNative(window, 'woman')
    await window.webContents.insertText(' ')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-phase]')?.dataset.practicePhase === 'correct',
        'input-only trailing space submits latest value',
    )
    assert.deepEqual((await spellingResult(window)).statistics, ['4', '2', '50%'])
    const words = []
    for (let index = 2; index < 12; index++) {
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('input[data-practice-answer-input]')),
            'added spelling question ' + index,
        )
        const state = await snapshot(window)
        assert.equal(state.index, index)
        assert.equal(state.slots.length, 1)
        const target = state.slots[0].target
        assert.ok(target && target !== 'woman')
        assert.equal(
            (await spellingResult(window)).image,
            initial.image,
            'all spelling questions share the existing image',
        )
        assert.equal((await spellingResult(window)).result, false)
        await replaceNative(window, target)
        await press(window, 'Enter')
        const completed = await spellingResult(window)
        assert.equal(completed.phase, 'correct')
        assert.equal(completed.answer, target)
        assert.equal(completed.answerPanel, true)
        words.push(target)
    }
    assert.equal(new Set(words).size, 10)
    const complete = await spellingResult(window)
    assert.deepEqual(complete.statistics, ['14', '12', '86%'])
    await click(window, '[data-practice-navigation-action="reset"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'spelling reset confirmation',
    )
    await evaluate(window, () => {
        const button = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
            (node) => node.textContent.trim() === '确认重置',
        )
        if (!button) throw new Error('Missing reset confirm')
        button.click()
    })
    await waitFor(
        window,
        () =>
            !document.querySelector('[role="dialog"]') &&
            document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '0',
        'reset returns to first question',
    )
    assert.equal((await spellingResult(window)).result, false)
    await replaceNative(window, 'woman')
    await press(window, 'Enter')
    assert.deepEqual((await spellingResult(window)).statistics, ['1', '1', '100%'])
    return {
        initial,
        firstCorrect: current,
        words,
        complete,
        reset: await spellingResult(window),
        inputOnlySpace: 'native insertText, not OS keyboard acceptance',
        responsive,
    }
}

async function checkEditingShortcutPassThrough(window, origin) {
    await visit(window, origin, 'word-basic', 'spell')
    await window.webContents.insertText('shortcut')
    const modifier = process.platform === 'darwin' ? 'meta' : 'control'
    const redo = process.platform === 'darwin' ? ['Z', ['meta', 'shift']] : ['Y', ['control']]
    const checks = []
    for (const [key, modifiers] of [['A', [modifier]], ['Z', [modifier]], redo]) {
        const event = await press(window, key, modifiers)
        const state = await snapshot(window)
        assert.equal(event.prevented, false, 'editing shortcuts are passed to the native host')
        assert.equal(state.phase, 'answering', 'editing shortcut does not judge the answer')
        assert.equal(state.index, 0, 'editing shortcut does not change the question')
        checks.push({ event, state })
    }
    return {
        evidence:
            'trusted shortcut key dispatch verifies product pass-through only; no assertion of OS menu command execution in the hidden host',
        checks,
    }
}

async function checkNativeUndo(window, origin) {
    await visit(window, origin, 'picture-basic', 'translate')
    for (const letter of 'brush') await press(window, letter)
    await click(window, '[data-word-slot="1"]')
    let state = await snapshot(window)
    assert.equal(state.value, 'brush ', 'clicking the absent second word adds one separator')
    assert.equal(state.slots[1].active, true)
    for (const letter of 'teeth') await press(window, letter)
    const completed = await snapshot(window)
    assert.equal(completed.value, 'brush teeth')
    const undo = []
    for (let attempt = 0; attempt < 8 && state.value !== ''; attempt += 1) {
        const previous = (await snapshot(window)).value
        window.webContents.undo()
        await waitFor(
            window,
            (selector, before) => document.querySelector(selector).value !== before,
            'native host undo command',
            inputSelector,
            previous,
        )
        await settle(window)
        state = await snapshot(window)
        assert.notEqual(state.value, previous, 'native undo consumes an actual editing transaction')
        assert.equal(state.phase, 'answering')
        assert.equal(state.index, 0)
        undo.push(state)
    }
    assert.equal(state.value, '', 'undo reaches the original empty input across word clicks')
    const redo = []
    for (let attempt = 0; attempt < undo.length; attempt += 1) {
        const previous = (await snapshot(window)).value
        window.webContents.redo()
        await waitFor(
            window,
            (selector, before) => document.querySelector(selector).value !== before,
            'native host redo command',
            inputSelector,
            previous,
        )
        await settle(window)
        state = await snapshot(window)
        assert.notEqual(state.value, previous, 'native redo restores an editing transaction')
        assert.equal(state.phase, 'answering')
        assert.equal(state.index, 0)
        redo.push(state)
    }
    assert.equal(state.value, completed.value, 'redo restores the complete two-word answer')
    return {
        evidence:
            'trusted native typing and real word click; webContents.undo/redo verify Chromium native editing history in the hidden host, not OS shortcut execution',
        completed,
        undo,
        redo,
    }
}

/** 仅在当前 smoke 文档注入 insertText 能力故障；不修改业务值或 React 状态。 */
async function checkUnavailableWordInsertion(window, origin) {
    await visit(window, origin, 'picture-basic', 'translate')
    for (const letter of 'brush') await press(window, letter)
    await evaluate(window, () => {
        window.__wordInputExecCommandFixture = {
            descriptor: Object.getOwnPropertyDescriptor(document, 'execCommand'),
            original: Reflect.get(document, 'execCommand'),
            calls: 0,
        }
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            writable: true,
            value(command, ...args) {
                const fixture = window.__wordInputExecCommandFixture
                if (command === 'insertText') {
                    fixture.calls += 1
                    return false
                }
                return fixture.original.call(document, command, ...args)
            },
        })
    })
    try {
        await click(window, '[data-word-slot="1"]')
        const failed = await snapshot(window)
        const calls = await evaluate(window, () => window.__wordInputExecCommandFixture.calls)
        assert.equal(calls, 1, 'fixture intercepts the requested native separator insertion')
        assert.equal(failed.value, 'brush', 'unavailable insertion does not rewrite the raw answer')
        assert.equal(failed.focused, true, 'the native input remains available after failure')
        await press(window, 'Space')
        assert.equal(
            (await snapshot(window)).value,
            'brush ',
            'native space works after insertion failure',
        )
        for (const letter of 'teeth') await press(window, letter)
        const continued = await snapshot(window)
        assert.equal(continued.value, 'brush teeth')
        assert.equal(continued.phase, 'answering')
        assert.equal(continued.index, 0)
        return {
            evidence:
                'DOM capability failure injection: document.execCommand(insertText) returns false; finally restores the original descriptor',
            calls,
            failed,
            continued,
        }
    } finally {
        await evaluate(window, () => {
            const fixture = window.__wordInputExecCommandFixture
            if (fixture.descriptor)
                Object.defineProperty(document, 'execCommand', fixture.descriptor)
            else Reflect.deleteProperty(document, 'execCommand')
            delete window.__wordInputExecCommandFixture
        })
    }
}

/** DOM composition/paste fixtures are explicit synthetic evidence, not OS IME or clipboard acceptance. */
async function checkSyntheticEditing(window) {
    await replaceNative(window, 'first second')
    const injected = await evaluate(
        window,
        (selector) => {
            const input = document.querySelector(selector)
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            ).set
            input.dispatchEvent(
                new CompositionEvent('compositionstart', { bubbles: true, data: '测' }),
            )
            setValue.call(input, 'first 测')
            input.setSelectionRange(7, 7)
            input.dispatchEvent(
                new InputEvent('input', {
                    bubbles: true,
                    data: '测',
                    inputType: 'insertCompositionText',
                    isComposing: true,
                }),
            )
            input.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 229,
                    isComposing: true,
                    bubbles: true,
                }),
            )
            document.querySelector('[data-word-slot="0"]').click()
            return { value: input.value, selection: [input.selectionStart, input.selectionEnd] }
        },
        inputSelector,
    )
    await settle(window)
    const composing = await snapshot(window)
    assert.equal(
        composing.value,
        injected.value,
        'composition does not normalize or replace raw text',
    )
    assert.deepEqual(
        composing.selection,
        injected.selection,
        'word clicks do not rewrite an active composition selection',
    )
    assert.equal(composing.phase, 'answering')
    assert.equal(composing.index, 0)
    await evaluate(
        window,
        (selector) => {
            document
                .querySelector(selector)
                .dispatchEvent(
                    new CompositionEvent('compositionend', { bubbles: true, data: '测' }),
                )
        },
        inputSelector,
    )
    await settle(window)
    const ended = await snapshot(window)
    assert.equal(ended.value, 'first 测')
    await evaluate(
        window,
        (selector) => {
            const input = document.querySelector(selector)
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            ).set
            const value = '  pasted  words!  '
            setValue.call(input, value)
            input.setSelectionRange(value.length, value.length)
            input.dispatchEvent(
                new InputEvent('input', {
                    bubbles: true,
                    data: value,
                    inputType: 'insertFromPaste',
                }),
            )
        },
        inputSelector,
    )
    await settle(window)
    const pasted = await snapshot(window)
    assert.equal(
        pasted.value,
        '  pasted  words!  ',
        'paste input preserves all whitespace and punctuation',
    )
    return {
        evidence:
            'DOM-injected composition and insertFromPaste events; native value setter, no React state injection',
        injected,
        composing,
        ended,
        pasted,
    }
}

async function capture(window, label, name, result) {
    const path = 'dist/practice-word-input-' + label.toLowerCase() + '-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    result.screenshots.push(path)
}

async function runChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorMinimum = window.getMinimumSize()
    const priorZoom = window.webContents.getZoomFactor()
    const attached = window.webContents.debugger.isAttached()
    let originalStorage
    const result = {
        label,
        status: 'running',
        consumers: [],
        responsive: [],
        screenshots: [],
        limitations: [
            'Hidden production host uses CDP focus emulation; this does not verify native window/background transitions.',
            '390/768 widths are automatic geometry checks; tablet/H5 visuals, touch, OS IME, system keyboard and real devices await user acceptance.',
            'Chromium native insertText verifies editing; DOM-injected composition/paste is recorded separately and does not prove OS IME or clipboard integration.',
            'Native editing commands use webContents.selectAll/undo/redo; trusted Meta/Control shortcuts separately verify product pass-through and do not prove macOS menu acceleration in the hidden host.',
        ],
    }
    try {
        mkdirSync(resolve('dist'), { recursive: true })
        window.setMinimumSize(0, 0)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        if (!attached) window.webContents.debugger.attach('1.3')
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        window.webContents.setBackgroundThrottling(false)
        await window.loadURL(origin + '/practice/')
        await settle(window)
        // 仅为隔离 smoke profile 设置偏好/主题夹具；finally 恢复原始字节，不修改业务存储实现。
        originalStorage = await evaluate(
            window,
            (keys) => keys.map((key) => [key, window.localStorage.getItem(key)]),
            storageKeys,
        )
        await evaluate(
            window,
            (keys) => {
                window.localStorage.setItem(
                    keys[0],
                    JSON.stringify({
                        version: 1,
                        values: {
                            fontSize: '默认',
                            typingSound: false,
                            transitionSound: false,
                            correctSound: false,
                            errorSound: false,
                            completionSound: false,
                            correctEffect: false,
                            completionEffect: false,
                        },
                    }),
                )
                window.localStorage.removeItem(keys[1])
                window.localStorage.setItem(keys[2], JSON.stringify('dark'))
            },
            storageKeys,
        )
        for (const [demo, mode, targets] of consumers) {
            await visit(window, origin, demo, mode)
            const initial = await snapshot(window)
            assert.deepEqual(
                initial.slots.map((slot) => slot.target),
                targets,
                demo + ':' + mode + ' maps actual local data',
            )
            assertGeometry(initial, demo + ':' + mode)
            assert.equal(initial.value, '')
            assert.equal(
                initial.focused,
                true,
                'first usable question accepts direct keyboard input',
            )
            await replaceNative(window, 'ab')
            const entered = await snapshot(window)
            assert.equal(entered.value, 'ab')
            assert.equal(entered.slots[0].value, 'ab')
            assert.equal(entered.phase, 'answering')
            assert.equal(entered.index, 0)
            if (demo === 'picture-basic' && mode === 'typing')
                assert.deepEqual(entered.punctuation, ['.'])
            result.consumers.push({ demo, mode, initial, entered })
        }
        result.wordSpelling = await checkWordSpelling(window, origin, label, result)
        result.nativeEditing = await checkNativeEditing(window, origin)
        result.editingShortcutPassThrough = await checkEditingShortcutPassThrough(window, origin)
        result.nativeUndo = await checkNativeUndo(window, origin)
        result.unavailableWordInsertion = await checkUnavailableWordInsertion(window, origin)
        result.syntheticEditing = await checkSyntheticEditing(window)
        await replaceNative(window, 'keep this answer')
        const pauseEnabled = await evaluate(
            window,
            () =>
                document.querySelector('[data-practice-pause-enabled]')?.dataset
                    .practicePauseEnabled !== 'false',
        )
        if (pauseEnabled) {
            await click(window, '[data-practice-navigation-action="pause"]')
            await waitFor(
                window,
                () => Boolean(document.querySelector('[data-practice-pause]')),
                'pause dialog',
            )
            assert.equal((await snapshot(window)).value, 'keep this answer')
            await click(window, '[data-pause-action="continue"]')
            await waitFor(
                window,
                () =>
                    Boolean(document.querySelector('[data-practice-paused="false"]')) &&
                    !document.querySelector('[data-practice-pause]'),
                'manual resume',
            )
            result.resumed = await snapshot(window)
            assert.equal(
                result.resumed.value,
                'keep this answer',
                'pause/resume preserves native text',
            )
        } else {
            result.pauseAcceptance =
                'Disabled by the current development-stage contract; pause/resume is not exercised.'
            assert.equal(
                await evaluate(window, () =>
                    Boolean(document.querySelector('[data-practice-navigation-action="pause"]')),
                ),
                false,
            )
        }
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
            'next question',
        )
        result.nextQuestion = await snapshot(window)
        assert.equal(result.nextQuestion.value, '', 'question change resets the unified input')
        await visit(window, origin, 'word-basic', 'spell')
        const short = await snapshot(window)
        const longWord = 'pneumonoultramicroscopicsilicovolcanoconiosis'
        await replaceNative(window, longWord)
        const long = await snapshot(window)
        assert.ok(
            long.slots[0].width > short.slots[0].width + 20,
            'long raw text expands its natural word slot',
        )
        const veryLong = 'abcdefghij'.repeat(35)
        await replaceNative(window, veryLong)
        result.longInput = await snapshot(window)
        assertGeometry(result.longInput, 'long word local scrolling')
        assert.equal(result.longInput.value, veryLong, 'very long text is never truncated')
        assert.ok(
            result.longInput.slots[0].scrollWidth > result.longInput.slots[0].clientWidth + 20,
            'very long words scroll within their slot',
        )
        assert.equal(result.longInput.slots[0].scrollOverflow, 'auto')
        assertEditingEndVisible(result.longInput, 'long word')
        await evaluate(window, () => {
            document.querySelector('[data-word-slot="0"]').parentElement.scrollLeft = 0
        })
        await settle(window)
        result.longInputReview = await snapshot(window)
        assert.equal(
            result.longInputReview.slots[0].scrollLeft,
            0,
            'without a new edit, manual scrolling back to review the beginning is preserved',
        )
        const uppercase = 'W'.repeat(160)
        await replaceNative(window, uppercase)
        result.uppercaseInput = await snapshot(window)
        assertGeometry(result.uppercaseInput, 'uppercase long word local scrolling')
        assert.equal(result.uppercaseInput.value, uppercase, 'raw uppercase input is preserved')
        assert.equal(result.uppercaseInput.slots[0].answer, uppercase)
        assert.ok(
            result.uppercaseInput.slots[0].answerScrollWidth <=
                result.uppercaseInput.slots[0].width + 1,
            'visible uppercase glyphs fit the measured word slot without left clipping',
        )
        assert.ok(
            result.uppercaseInput.slots[0].scrollWidth >
                result.uppercaseInput.slots[0].clientWidth + 20,
            'uppercase long words only overflow their local scroll container',
        )
        assert.equal(result.uppercaseInput.slots[0].scrollOverflow, 'auto')
        assertEditingEndVisible(result.uppercaseInput, 'uppercase long word')
        for (const theme of ['dark', 'light']) {
            await evaluate(
                window,
                (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
                storageKeys[2],
                theme,
            )
            await visit(window, origin, 'picture-basic', 'typing')
            await replaceNative(window, 'Nice to')
            for (const [width, height, zoom] of [
                [1920, 1080, 1],
                [1440, 900, 1],
                [1280, 800, 1],
                [1920, 1080, 1.25],
                [1920, 1080, 1.5],
                [1920, 1080, 2],
                [768, 1024, 1],
                [390, 844, 1],
            ]) {
                window.setContentSize(width, height)
                window.webContents.setZoomFactor(zoom)
                await delay(100)
                await settle(window)
                const state = await snapshot(window)
                assertGeometry(state, theme + ' ' + width + ' zoom ' + zoom, zoom)
                assert.equal(state.theme, theme)
                assert.equal(state.value, 'Nice to', 'viewport/zoom does not reset input')
                assert.deepEqual(state.punctuation, ['.'])
                result.responsive.push({
                    width,
                    height,
                    zoom,
                    state,
                    acceptance: width < 1280 ? 'automatic geometry only' : 'PC runtime geometry',
                })
                if (width >= 1280)
                    await capture(window, label, theme + '-' + width + '-zoom-' + zoom, result)
            }
            window.setContentSize(1920, 1080)
            window.webContents.setZoomFactor(1)
        }
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failure = await snapshot(window)
            await capture(window, label, 'failure', result)
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        try {
            if (originalStorage)
                await evaluate(
                    window,
                    (saved) => {
                        for (const [key, value] of saved) {
                            if (value === null) window.localStorage.removeItem(key)
                            else window.localStorage.setItem(key, value)
                        }
                    },
                    originalStorage,
                )
        } finally {
            if (window.webContents.debugger.isAttached()) {
                await window.webContents.debugger.sendCommand(
                    'Emulation.setFocusEmulationEnabled',
                    { enabled: false },
                )
                if (!attached) window.webContents.debugger.detach()
            }
            window.setMinimumSize(...priorMinimum)
            window.setContentSize(...priorSize)
            window.webContents.setZoomFactor(priorZoom)
            writeFileSync(
                resolve('dist/practice-word-input-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'practice-word-input-runtime-validation',
    runChecks,
    activateWindow: false,
    timeoutMs: 240000,
})
