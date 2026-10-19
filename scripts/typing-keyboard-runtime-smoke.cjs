const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const answerSelector = '[data-practice-answer-input]'

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(35)
    }
    throw new Error(
        'Timed out: typing keyboard ' + description + ' ' + JSON.stringify(await state(window)),
    )
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
        'all production images load',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const control = document.querySelector(target)
            if (!control || control.matches(':disabled') || control.closest('[inert]'))
                throw new Error('Missing enabled keyboard smoke control: ' + target)
            control.focus()
            control.click()
        },
        selector,
    )
}

async function clickText(window, text, scope = '[role="dialog"]') {
    await evaluate(
        window,
        (label, root) => {
            const control = Array.from(
                document.querySelector(root)?.querySelectorAll('button') ?? [],
            ).find((button) => button.textContent.replace(/\s+/g, '') === label.replace(/\s+/g, ''))
            if (!control || control.matches(':disabled'))
                throw new Error('Missing action: ' + label)
            control.focus()
            control.click()
        },
        text,
        scope,
    )
}

async function state(window) {
    return evaluate(window, () => {
        const keyboard = document.querySelector('[data-typing-keyboard]')
        const session = document.querySelector('[data-practice-phase]')
        function codes(attribute) {
            return Array.from(
                keyboard?.querySelectorAll('[' + attribute + '="true"]') ?? [],
                (key) => key.getAttribute('data-keyboard-key'),
            )
        }
        return {
            href: location.href,
            input: document.querySelector('[data-practice-answer-input]')?.value,
            inputFocused: document.activeElement?.matches('[data-practice-answer-input]') ?? false,
            documentFocused: document.hasFocus(),
            activeElement: document.activeElement?.outerHTML.slice(0, 250),
            recentHostEvents: window.typingSmokeNativeEvents?.slice(-8),
            index: session?.dataset.practiceIndex,
            phase: session?.dataset.practicePhase,
            oral: session?.dataset.practiceOralStage,
            active: keyboard?.getAttribute('data-keyboard-active'),
            hidden: Boolean(keyboard?.closest('[hidden]')),
            target: codes('data-target'),
            shiftTarget: codes('data-shift-target'),
            pressed: codes('data-pressed'),
            errors: codes('data-error'),
            caps: keyboard?.querySelector('[data-caps-lock]')?.getAttribute('data-caps-lock'),
        }
    })
}

async function visit(window, origin, demo = 'sentence-basic', mode = 'typing') {
    await window.loadURL(
        origin + '/practice/?demo=' + demo + '&mode=' + mode + '&keep=keyboard-smoke',
    )
    await waitFor(
        window,
        () =>
            Boolean(
                document.querySelector('main[data-toolbar-ready="true"] [data-typing-keyboard]'),
            ),
        'practice and local settings hydrate',
    )
    await settle(window)
    await evaluate(window, () => {
        const input = document.querySelector('[data-practice-answer-input]')
        if (!input) throw new Error('Practice answer input missing')
        window.typingSmokeNativeEvents = []
        for (const name of ['keydown', 'keyup', 'input', 'paste', 'focus', 'blur'])
            input.addEventListener(name, (event) => {
                window.typingSmokeNativeEvents.push({
                    type: event.type,
                    trusted: event.isTrusted,
                    code: event.code,
                    key: event.key,
                    location: event.location,
                    inputType: event.inputType,
                })
            })
        input.focus()
    })
}

/** 真实宿主输入队列；不通过 value setter 伪造用户键入。 */
function sendKey(window, keyCode, character, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    if (character !== undefined)
        window.webContents.sendInputEvent({ type: 'char', keyCode: character, modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
}

async function type(window, text) {
    for (const character of text) {
        const keyCode = character === ' ' ? 'Space' : character.toUpperCase()
        sendKey(window, keyCode, character)
    }
    await waitFor(
        window,
        (suffix) => document.querySelector('[data-practice-answer-input]')?.value.endsWith(suffix),
        'native typing reaches the answer input',
        text,
    )
}

async function selectRange(window, start, end) {
    await evaluate(
        window,
        (from, to) => {
            const input = document.querySelector('[data-practice-answer-input]')
            input.focus()
            input.setSelectionRange(from, to)
        },
        start,
        end,
    )
}

async function clearInput(window) {
    await evaluate(window, () => {
        const input = document.querySelector('[data-practice-answer-input]')
        input.focus()
        input.select()
    })
    sendKey(window, 'Backspace')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-answer-input]')?.value === '',
        'native Backspace clears the selected input',
    )
}

async function assertFeedback(window, code, kind, target) {
    await waitFor(
        window,
        (key, error) => {
            const element = document.querySelector('[data-keyboard-key="' + key + '"]')
            return error
                ? element?.getAttribute('data-error') === 'true' &&
                      element.getAttribute('data-pressed') !== 'true'
                : element?.getAttribute('data-pressed') === 'true' &&
                      element.getAttribute('data-error') !== 'true'
        },
        'native input feedback ' + code + ' ' + kind,
        code,
        kind === 'error',
    )
    const current = await state(window)
    if (target !== undefined) assert.deepEqual(current.target, target)
    return current
}

async function waitIdleFeedback(window) {
    await waitFor(
        window,
        () =>
            !document.querySelector(
                '[data-typing-keyboard] [data-pressed="true"], [data-typing-keyboard] [data-error="true"]',
            ),
        'transient feedback releases',
    )
}

async function setTheme(window, origin, theme) {
    if ((await evaluate(window, () => document.documentElement.dataset.theme)) === theme) return
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'dark' ? '夜间模式' : '白天模式'
    await waitFor(
        window,
        (name) =>
            Boolean(document.querySelector('input[aria-label="' + name + '"]')) &&
            document.body.textContent.includes('本机设置已就绪'),
        'appearance settings hydrate',
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

async function measure(window) {
    return evaluate(window, () => {
        const keyboard = document.querySelector('[data-typing-keyboard]')
        const canvas = keyboard?.querySelector('[data-keyboard-canvas]')
        function box(element) {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
                opacity: Number(style.opacity),
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                fill: style.fill,
                cursor: style.cursor,
                pointerEvents: style.pointerEvents,
                zIndex: style.zIndex,
            }
        }
        const labels = Array.from(keyboard?.querySelectorAll('[data-keyboard-key]') ?? [])
        const hands = keyboard?.querySelector('[data-typing-hands]')
        const firstLabel = labels[0]
        const rowCounts = Array.from(
            keyboard?.querySelectorAll('[data-keyboard-row]') ?? [],
            (row) => row.children.length,
        )
        function keyFill(code) {
            const face = keyboard?.querySelector('[data-keyboard-face="' + code + '"] rect')
            return face ? getComputedStyle(face).fill : null
        }
        return {
            theme: document.documentElement.dataset.theme,
            pageCanvasToken: getComputedStyle(document.documentElement)
                .getPropertyValue('--app-color-canvas')
                .trim(),
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            documentHeight: document.documentElement.scrollHeight,
            scroll: { x: scrollX, y: scrollY },
            keyboard: box(keyboard),
            canvas: box(canvas),
            footer: box(document.querySelector('[data-practice-footer]')),
            hands: box(hands),
            handLayers: Array.from(hands?.querySelectorAll('[opacity]') ?? []).map((element) => ({
                tag: element.tagName,
                opacity: Number(element.getAttribute('opacity')),
            })),
            handBeforeLabels: Boolean(
                hands &&
                firstLabel &&
                hands.compareDocumentPosition(firstLabel) & Node.DOCUMENT_POSITION_FOLLOWING,
            ),
            labelLayerOpacity: firstLabel
                ? Number(getComputedStyle(firstLabel.closest('svg')).opacity)
                : null,
            labelLayerZIndex: firstLabel
                ? getComputedStyle(firstLabel.closest('svg')).zIndex
                : null,
            handCount: hands?.querySelectorAll('[data-hand-side]').length,
            keyCount: labels.length,
            visibleLabels: labels.flatMap((key) =>
                Array.from(key.querySelectorAll('text'), (label) => label.textContent),
            ),
            existingGrayFill: keyFill('CapsLock'),
            letterFill: keyFill('KeyQ'),
            blankKeyFills: labels
                .filter((key) => !key.querySelector('text'))
                .map((key) => ({
                    code: key.getAttribute('data-keyboard-key'),
                    fill: keyFill(key.getAttribute('data-keyboard-key')),
                })),
            rowCounts,
            labels: Object.fromEntries(
                [
                    'KeyQ',
                    'KeyF',
                    'KeyJ',
                    'CapsLock',
                    'Space',
                    'Minus',
                    'Quote',
                    'ShiftLeft',
                    'ShiftRight',
                ].map((code) => {
                    const key = keyboard?.querySelector('[data-keyboard-key="' + code + '"]')
                    return [
                        code,
                        {
                            ...box(key),
                            text: key?.textContent,
                            label: box(key?.querySelector('text')),
                        },
                    ]
                }),
            ),
            frameFill: getComputedStyle(canvas?.querySelector('svg > rect')).fill,
            imageFailures: Array.from(document.images)
                .filter((image) => !image.complete || image.naturalWidth === 0)
                .map((image) => image.src),
        }
    })
}

function assertGeometry(measured, reference = false) {
    assert.equal(measured.keyCount, 61, 'complete ANSI main keyboard has 61 keys')
    assert.deepEqual(measured.rowCounts, [14, 14, 13, 12, 8], 'five complete keyboard rows')
    assert.equal(
        measured.visibleLabels.length,
        30,
        'only letters and four special keys have labels',
    )
    assert.deepEqual(
        measured.visibleLabels.filter((label) => !/^[A-Z]$/.test(label)).sort(),
        ["'", '-', 'CapsLock', 'Space'],
        'other keycaps and all Shift symbol legends remain blank',
    )
    assert.equal(measured.blankKeyFills.length, 31, 'all unlabelled keycaps remain present')
    assert.ok(measured.existingGrayFill, 'existing neutral key color is available')
    for (const key of measured.blankKeyFills)
        assert.equal(
            key.fill,
            measured.existingGrayFill,
            'blank key uses existing gray: ' + key.code,
        )
    assert.notEqual(measured.letterFill, measured.existingGrayFill, 'letter key retains its color')
    for (const code of ['CapsLock', 'Space', 'Minus', 'Quote'])
        assert.ok(measured.labels[code].text, 'special key remains labelled: ' + code)
    assert.match(measured.labels.CapsLock.text, /CapsLock/)
    assert.match(measured.labels.Space.text, /Space/)
    assert.match(measured.labels.Minus.text, /-/)
    assert.ok(measured.labels.Quote.text.includes("'"))
    assert.ok(measured.hands && measured.hands.width > 0, 'hand illustration is rendered')
    assert.equal(measured.handCount, 2, 'both hands remain rendered')
    assert.equal(measured.handBeforeLabels, true, 'hand and label DOM order is stable')
    assert.ok(
        Number(measured.labelLayerZIndex) > Number(measured.hands.zIndex),
        'computed stacking order keeps key labels above the hand illustration',
    )
    assert.equal(measured.labelLayerOpacity, 1, 'hand transparency does not dim the label layer')
    assert.ok(
        measured.hands.opacity < 1 ||
            measured.handLayers.some((layer) => layer.opacity > 0 && layer.opacity < 1),
        'hands use real opacity',
    )
    assert.equal(
        measured.canvas.pointerEvents,
        'none',
        'virtual keyboard does not generate input or capture pointer events',
    )
    assert.equal(measured.labels.KeyQ.label.opacity, 1, 'letter label remains fully opaque')
    assert.deepEqual(measured.imageFailures, [])
    assert.ok(measured.keyboard.width > 0 && measured.canvas.height > 0)
    assert.ok(
        measured.keyboard.x >= -1 && measured.keyboard.right <= measured.viewport.width + 1,
        'keyboard stays inside CSS viewport',
    )
    assert.ok(
        measured.documentWidth <= measured.viewport.width + 1,
        'no document horizontal overflow',
    )
    assert.ok(measured.bodyWidth <= measured.viewport.width + 1, 'no body horizontal overflow')
    if (reference) {
        assert.equal(measured.viewport.width, 1920)
        assert.equal(measured.viewport.height, 1080)
        assert.ok(
            Math.abs(measured.canvas.width - 848) < 1,
            'current owner reference width is 848 CSS px',
        )
        assert.ok(
            Math.abs(measured.canvas.height - 315) < 1,
            'current owner reference height is 315 CSS px',
        )
    }
}

async function capture(window, filename) {
    const path = 'dist/typing-keyboard-' + filename + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function showKeyboardByNaturalScroll(window) {
    const before = await measure(window)
    await evaluate(window, () => {
        document.querySelector('[data-keyboard-canvas]').scrollIntoView({
            block: 'center',
            inline: 'nearest',
            behavior: 'instant',
        })
    })
    await settle(window)
    const after = await measure(window)
    assert.ok(after.canvas.y >= -1, 'natural scrolling reveals the top keyboard row')
    assert.ok(
        after.canvas.bottom <= (after.footer?.y ?? after.viewport.height) + 1,
        'natural scrolling reveals the Space row above the fixed footer',
    )
    return {
        method: 'native scrollIntoView, no layout or scale mutation',
        before: { scroll: before.scroll, canvas: before.canvas, viewport: before.viewport },
        after: { scroll: after.scroll, canvas: after.canvas, viewport: after.viewport },
        documentHeight: after.documentHeight,
    }
}

async function captureKeyboard(window, filename) {
    const naturalScroll = await showKeyboardByNaturalScroll(window)
    const screenshot = await capture(window, filename + '-scrolled')
    const canvas = naturalScroll.after.canvas
    const cropPath = 'dist/typing-keyboard-' + filename + '-keyboard.png'
    writeFileSync(
        resolve(cropPath),
        (
            await window.webContents.capturePage({
                x: Math.floor(canvas.x),
                y: Math.floor(canvas.y),
                width: Math.ceil(canvas.width),
                height: Math.ceil(canvas.height),
            })
        ).toPNG(),
    )
    return { naturalScroll, screenshot, keyboardCrop: cropPath }
}

async function exerciseInput(window, origin, result) {
    await visit(window, origin)
    assert.deepEqual(
        (await state(window)).target,
        ['KeyW'],
        'initial target follows the actual question',
    )
    await type(window, 'w')
    result.correct = await assertFeedback(window, 'KeyW', 'actual', ['KeyE'])
    await type(window, 'x')
    result.incorrect = await assertFeedback(window, 'KeyX', 'error', ['KeyE'])
    await clearInput(window)
    result.backspace = await assertFeedback(window, 'Backspace', 'actual', ['KeyW'])
    const before = await state(window)
    await type(window, ' v')
    const after = await state(window)
    assert.equal(after.input, ' v', 'Space and V stay native answer text')
    assert.equal(after.index, before.index)
    assert.equal(after.phase, before.phase)
    assert.equal(after.oral, before.oral)
    result.spaceAndVDoNotRunCommands = true
    await clearInput(window)
    await type(window, 'we')
    assert.deepEqual((await state(window)).target, ['Space'])
    sendKey(window, 'Space', ' ')
    result.space = await assertFeedback(window, 'Space', 'actual', ['KeyR'])
    await type(window, 'read')
    await selectRange(window, 3, 7)
    await type(window, 'books')
    result.selectionReplacement = await state(window)
    assert.equal(
        result.selectionReplacement.input,
        'we books',
        'native typing replaces the actual selected range',
    )
    assert.deepEqual(result.selectionReplacement.target, ['KeyR'])
    await clearInput(window)
    await type(window, 'we')
    await waitIdleFeedback(window)
    // 宿主原生一次提交多字符，覆盖粘贴结果映射；不读取或改写用户系统剪贴板。
    await window.webContents.insertText(' read')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-answer-input]')?.value === 'we read',
        'native multi-character commit changes the answer input',
    )
    result.nativeMultiCharacterCommit = await assertFeedback(window, 'KeyD', 'actual', ['Space'])
    result.pasteResultMappingLimit =
        '原生insertText一次提交多字符；仅覆盖粘贴等效结果映射，未实测系统Ctrl/Meta+V'
    const trusted = await evaluate(window, () =>
        window.typingSmokeNativeEvents.filter((event) => event.type === 'input'),
    )
    assert.ok(
        trusted.length > 5 && trusted.every((event) => event.trusted),
        'all typing, Backspace, replacement and multi-character commits are native trusted input events',
    )
    result.trustedNativeInputEvents = trusted
    await clearInput(window)
    await type(window, 'w')
    const inputBlurEventStart = await evaluate(window, () => window.typingSmokeNativeEvents.length)
    await evaluate(window, () => document.querySelector('[data-practice-answer-input]').blur())
    await waitFor(
        window,
        (start) =>
            window.typingSmokeNativeEvents
                .slice(start)
                .some((event) => event.type === 'blur' && event.trusted),
        'trusted native input blur event actually arrives',
        inputBlurEventStart,
    )
    await waitIdleFeedback(window)
    result.inputBlurClearsFeedback = true
    await click(window, '[data-practice-navigation-action="report"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-error-feedback]')),
        'actual report modal opens',
    )
    const blocked = await state(window)
    assert.equal(blocked.active, 'false')
    assert.deepEqual(blocked.target, [])
    assert.deepEqual(blocked.pressed, [])
    await click(window, '[data-practice-error-feedback] textarea')
    sendKey(window, 'V', 'v')
    sendKey(window, 'Space', ' ')
    assert.equal(
        (await state(window)).input,
        blocked.input,
        'dialog typing cannot change answer input',
    )
    assert.deepEqual(
        (await state(window)).pressed,
        [],
        'dialog typing cannot light the exercise keyboard',
    )
    await clickText(window, '取消', '[data-practice-error-feedback]')
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'report modal closes')
    await click(window, '[data-practice-footer-action="question.next"]')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
        'real footer moves to next question',
    )
    const moved = await state(window)
    assert.equal(moved.input, '')
    assert.deepEqual(moved.pressed, [])
    assert.deepEqual(moved.target, ['KeyW'])
    result.questionChangeClearsFeedback = true
    await click(window, answerSelector)
    await type(window, 'w')
    await click(window, '[data-practice-navigation-action="reset"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'reset dialog opens',
    )
    await clickText(window, '确认重置')
    await waitFor(
        window,
        () =>
            document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '0' &&
            document.querySelector('[data-practice-answer-input]')?.value === '',
        'confirmed reset clears question and input',
    )
    assert.deepEqual((await state(window)).pressed, [])
    assert.deepEqual((await state(window)).target, ['KeyW'])
    result.resetClearsFeedback = true
}

async function exerciseShiftAndComposition(window, origin, result) {
    await visit(window, origin, 'picture-basic')
    assert.deepEqual((await state(window)).target, ['KeyN'])
    assert.deepEqual(
        (await state(window)).shiftTarget,
        ['ShiftLeft'],
        'uppercase N suggests opposite-hand Shift',
    )
    window.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: 'Shift',
        modifiers: ['shift', 'left'],
    })
    await waitFor(
        window,
        () =>
            Boolean(document.querySelector('[data-keyboard-key="ShiftLeft"][data-pressed="true"]')),
        'native left Shift lights while held',
    )
    sendKey(window, 'N', 'N', ['shift'])
    result.shiftedUppercase = await assertFeedback(window, 'KeyN', 'actual', ['KeyI'])
    assert.equal(result.shiftedUppercase.input, 'N')
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Shift', modifiers: ['left'] })
    await waitFor(
        window,
        () => !document.querySelector('[data-keyboard-key="ShiftLeft"][data-pressed="true"]'),
        'left Shift releases',
    )
    await type(window, 'ice to meet you')
    assert.deepEqual((await state(window)).target, ['Period'])
    sendKey(window, '.', '.')
    result.punctuation = await assertFeedback(window, 'Period', 'actual', [])
    await clearInput(window)
    sendKey(window, 'N', 'n')
    result.caseMismatch = await assertFeedback(window, 'KeyN', 'error', ['KeyN'])
    await clearInput(window)
    const nativeEventStart = await evaluate(window, () => window.typingSmokeNativeEvents.length)
    window.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: 'Shift',
        modifiers: ['shift', 'right'],
    })
    await waitFor(
        window,
        (start) => window.typingSmokeNativeEvents.length > start,
        'native right-modifier Shift injection arrives',
        nativeEventStart,
    )
    const injectedShift = await evaluate(
        window,
        (start) =>
            window.typingSmokeNativeEvents.slice(start).find((event) => event.type === 'keydown'),
        nativeEventStart,
    )
    assert.equal(injectedShift.trusted, true, 'the attempted host Shift injection is trusted')
    if (injectedShift.code === 'ShiftRight') {
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector('[data-keyboard-key="ShiftRight"][data-pressed="true"]'),
                ),
            'native right Shift feedback commits',
        )
        assert.ok(
            (await state(window)).pressed.includes('ShiftRight'),
            'native right Shift lights independently',
        )
        result.rightShift = { method: 'trusted native sendInputEvent', observed: injectedShift }
    } else {
        // 本机Electron43/macOS将Shift accelerator规范为ShiftLeft；禁止假称右侧硬件已实测。
        assert.equal(
            injectedShift.code,
            'ShiftLeft',
            'keyboard follows the actual host-provided code',
        )
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector('[data-keyboard-key="ShiftLeft"][data-pressed="true"]'),
                ),
            'host-provided left Shift feedback commits',
        )
        assert.ok((await state(window)).pressed.includes('ShiftLeft'))
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Shift', modifiers: ['right'] })
        await waitIdleFeedback(window)
        await click(window, answerSelector)
        await waitFor(
            window,
            () => document.activeElement?.matches('[data-practice-answer-input]'),
            'answer input is really focused before synthetic right Shift',
        )
        await evaluate(window, () => {
            document.querySelector('[data-practice-answer-input]').dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    key: 'Shift',
                    code: 'ShiftRight',
                    location: 2,
                    shiftKey: true,
                }),
            )
        })
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector('[data-keyboard-key="ShiftRight"][data-pressed="true"]'),
                ),
            'explicit synthetic right Shift code lights independently',
        )
        assert.equal((await state(window)).pressed.includes('ShiftLeft'), false)
        result.rightShift = {
            method: 'synthetic KeyboardEvent code=ShiftRight',
            attemptedNativeInjection: injectedShift,
            limit: '此macOS宿主的Shift+right注入仍返回ShiftLeft；RightShift/ShiftRight/RShift accelerator探针均返回空code。真实左Shift已实测，右Shift硬件行为待人工验收',
        }
    }
    result.heldShiftBeforeBlur = await state(window)
    assert.equal(
        result.heldShiftBeforeBlur.inputFocused,
        true,
        'held Shift blur starts from the focused answer input',
    )
    const heldShiftBlurEventStart = await evaluate(
        window,
        () => window.typingSmokeNativeEvents.length,
    )
    await evaluate(window, () => document.querySelector('[data-practice-answer-input]').blur())
    await waitFor(
        window,
        (start) =>
            window.typingSmokeNativeEvents
                .slice(start)
                .some((event) => event.type === 'blur' && event.trusted),
        'trusted native held-Shift blur event actually arrives',
        heldShiftBlurEventStart,
    )
    await waitIdleFeedback(window)
    assert.deepEqual((await state(window)).pressed, [], 'blur clears held Shift even without keyup')
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Shift', modifiers: ['right'] })
    result.nativeLeftShift = true
    result.heldShiftBlurClears = { method: result.rightShift.method, cleared: true }
    await click(window, answerSelector)
    await evaluate(window, () => {
        const input = document.querySelector('[data-practice-answer-input]')
        input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }))
        input.dispatchEvent(
            new KeyboardEvent('keydown', {
                bubbles: true,
                key: 'Process',
                keyCode: 229,
                isComposing: true,
            }),
        )
    })
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-typing-keyboard] [data-target="true"]') &&
            !document.querySelector('[data-typing-keyboard] [data-pressed="true"]'),
        'compositionstart commits the candidate-stage visual state',
    )
    const composing = await state(window)
    assert.deepEqual(composing.target, [], 'IME candidate stage does not reveal an ASCII target')
    assert.deepEqual(composing.pressed, [])
    assert.deepEqual(composing.errors, [])
    await evaluate(window, () => {
        const input = document.querySelector('[data-practice-answer-input]')
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'N')
        input.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                data: 'N',
                inputType: 'insertCompositionText',
                isComposing: true,
            }),
        )
    })
    assert.deepEqual(
        (await state(window)).pressed,
        [],
        'synthetic IME candidate update stays silent',
    )
    await evaluate(window, () => {
        const input = document.querySelector('[data-practice-answer-input]')
        input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'N' }))
        input.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                data: 'N',
                inputType: 'insertText',
                isComposing: false,
            }),
        )
    })
    result.syntheticCompositionCommit = await assertFeedback(window, 'KeyN', 'actual', ['KeyI'])
    assert.equal(result.syntheticCompositionCommit.input, 'N')
    await waitIdleFeedback(window)
    result.syntheticCompositionLimit =
        '合成composition事件验证提交时序；未代替系统输入法、候选框或移动软键盘验收'
}

async function exerciseGuess(window, origin, result) {
    await visit(window, origin, 'guess-basic', 'spell')
    assert.deepEqual((await state(window)).target, [], 'guess spell keeps the answer hidden')
    assert.deepEqual((await state(window)).shiftTarget, [])
    await type(window, 'q')
    const actual = await assertFeedback(window, 'KeyQ', 'actual', [])
    assert.deepEqual(
        actual.errors,
        [],
        'guess spell only reports actual input without correctness feedback',
    )
    await click(window, '[data-practice-toolbar="guess"] button[aria-label="本模式设置"]')
    await click(window, '[data-practice-options="guess"] [role="switch"][aria-label="键盘"]')
    await waitFor(
        window,
        () => document.querySelector('[data-guess-keyboard]')?.hidden === true,
        'guess keyboard hides through its real toolbar switch',
    )
    await click(window, answerSelector)
    await type(window, 'w')
    const hidden = await state(window)
    assert.equal(hidden.active, 'false')
    assert.equal(hidden.hidden, true)
    assert.deepEqual(hidden.pressed, [])
    assert.deepEqual(hidden.target, [])
    assert.deepEqual(hidden.errors, [])
    result.guess = { actual, hidden }
    await click(window, '[data-practice-toolbar="guess"] button[aria-label="本模式设置"]')
    await click(window, '[data-practice-options="guess"] [role="switch"][aria-label="键盘"]')
    await waitFor(
        window,
        () => document.querySelector('[data-guess-keyboard]')?.hidden === false,
        'guess keyboard restores through the toolbar',
    )
    assert.deepEqual(
        (await state(window)).pressed,
        [],
        'restored keyboard cannot replay hidden input',
    )
}

/** 可被未来总runner复用；调用方提供已构建的生产窗口与同源入口。 */
async function runTypingKeyboardChecks(window, origin, label) {
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
        businessRequests: [],
        permissionRequests: [],
        consoleErrors: [],
        themes: [],
        pcReflow: [],
        pageZoom: [],
        limitations: ['PC生产Web与Electron运行时；平板/H5视觉、触摸、系统输入法与软键盘待用户验收'],
    }
    let originalTheme
    let focusEmulated = false
    let ownsDebugger = false
    const onConsole = (event) => {
        if (event.level === 'warning' || event.level === 'error')
            result.consoleErrors.push(event.message)
    }
    window.webContents.on('console-message', onConsole)
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.webContentsId > 0 && details.webContentsId !== window.webContents.id) {
            callback({ requestHeaders: details.requestHeaders })
            return
        }
        const url = new URL(details.url)
        const sameApplication =
            url.protocol === application.protocol && url.host === application.host
        const page = isExportedPageRequest(details, origin, exportedPages)
        const asset =
            sameApplication &&
            ['GET', 'HEAD'].includes(details.method) &&
            exportedFiles.has(url.pathname)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!sameApplication && ['http:', 'https:'].includes(url.protocol)) ||
            (['xhr', 'fetch'].includes(details.resourceType) && !page && !asset)
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
        window.webContents.setBackgroundThrottling(false)
        if (!(await evaluate(window, () => document.hasFocus()))) {
            ownsDebugger = !window.webContents.debugger.isAttached()
            if (ownsDebugger) window.webContents.debugger.attach('1.3')
            await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
                enabled: true,
            })
            focusEmulated = true
            await waitFor(window, () => document.hasFocus(), 'hidden host uses CDP focus emulation')
        }
        result.hostFocus = {
            method: focusEmulated
                ? 'CDP Emulation.setFocusEmulationEnabled'
                : 'already focused host',
            limit: '隐藏自动化窗口使用浏览器焦点仿真产生trusted focus/blur；不代表已实测系统窗口切换或抢占用户桌面焦点',
        }
        await setTheme(window, origin, 'dark')
        await visit(window, origin)
        const dark = await measure(window)
        assertGeometry(dark, true)
        result.themes.push({
            theme: 'dark',
            measured: dark,
            screenshot: await capture(window, label.toLowerCase() + '-dark-pc'),
            keyboardView: await captureKeyboard(window, label.toLowerCase() + '-dark-pc'),
        })
        await exerciseInput(window, origin, result)
        await exerciseShiftAndComposition(window, origin, result)
        await exerciseGuess(window, origin, result)
        await visit(window, origin)
        for (const width of [1440, 1280]) {
            window.setContentSize(width, 900)
            await settle(window)
            const measured = await measure(window)
            assertGeometry(measured)
            result.pcReflow.push({
                width,
                measured,
                naturalScroll: await showKeyboardByNaturalScroll(window),
                screenshot: await capture(window, label.toLowerCase() + '-pc-' + width),
            })
        }
        window.setContentSize(1920, 1080)
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            await settle(window)
            const measured = await measure(window)
            assertGeometry(measured)
            assert.ok(
                Math.abs(measured.viewport.width - 1920 / factor) <= 1,
                'real zoom changes CSS viewport',
            )
            result.pageZoom.push({
                factor,
                measured,
                naturalScroll: await showKeyboardByNaturalScroll(window),
                screenshot: await capture(window, label.toLowerCase() + '-zoom-' + factor),
            })
        }
        window.webContents.setZoomFactor(1)
        await setTheme(window, origin, 'light')
        await visit(window, origin)
        const light = await measure(window)
        assertGeometry(light, true)
        assert.equal(light.theme, 'light')
        assert.equal(
            light.frameFill,
            dark.frameFill,
            'both themes inherit the documented fixed keyboard illustration palette',
        )
        assert.notEqual(
            light.pageCanvasToken,
            dark.pageCanvasToken,
            'the surrounding page theme really changes',
        )
        result.themes.push({
            theme: 'light',
            measured: light,
            screenshot: await capture(window, label.toLowerCase() + '-light-pc'),
            keyboardView: await captureKeyboard(window, label.toLowerCase() + '-light-pc'),
        })
        assert.deepEqual(result.businessRequests, [], 'keyboard adds zero business requests')
        assert.deepEqual(result.permissionRequests, [], 'keyboard requests zero system permissions')
        assert.deepEqual(result.consoleErrors, [], 'keyboard has zero console warnings/errors')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = describeError(error)
        try {
            result.failureScreenshot = await capture(window, label.toLowerCase() + '-failure')
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            if (focusEmulated && window.webContents.debugger.isAttached())
                await window.webContents.debugger.sendCommand(
                    'Emulation.setFocusEmulationEnabled',
                    { enabled: false },
                )
            if (ownsDebugger && window.webContents.debugger.isAttached())
                window.webContents.debugger.detach()
            window.webContents.removeListener('console-message', onConsole)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/typing-keyboard-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runTypingKeyboardChecks }

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
async function runStandaloneTypingKeyboardSmoke() {
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
            resolve(projectRoot, 'dist/typing-keyboard-runtime-validation.json'),
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
        if (error === undefined) console.log('Typing keyboard passed: Electron and Web')
        else console.error('Typing keyboard failed:', error)
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
        console.log('Typing keyboard ' + label + ' start')
        try {
            report.environments[index] = await runTypingKeyboardChecks(window, origin, label)
            console.log('Typing keyboard ' + label + ' complete')
        } catch (error) {
            report.environments[index] = {
                label,
                status: 'failed',
                error: describeError(error),
                detailReport: 'dist/typing-keyboard-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Typing keyboard smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (
            !profile ||
            !isAbsolute(profile) ||
            resolve(profile) === resolve(app.getPath('userData'))
        )
            throw new Error('Typing keyboard smoke requires an isolated absolute userData profile')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Typing keyboard smoke must use the production protocol')
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
            () => finish(new Error('Typing keyboard smoke exceeded 240 seconds')),
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
if (isStandaloneEntry) void runStandaloneTypingKeyboardSmoke()
