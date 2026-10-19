const assert = require('node:assert/strict')
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')
async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}
async function waitFor(window, operation, description, ...args) {
    for (let i = 0; i < 180; i++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(30)
    }
    throw new Error(
        'Presentation timeout: ' + description + ' ' + JSON.stringify(await snapshot(window)),
    )
}
async function snapshot(window) {
    return evaluate(window, () => {
        const stage = document.querySelector('[data-word-deck-stage]')
        const progress = document.querySelector('[data-practice-progress]')
        const geometry = (node) => {
            const b = node.getBoundingClientRect()
            return { x: b.x, y: b.y, width: b.width, height: b.height, bottom: b.bottom }
        }
        const cards = Array.from(document.querySelectorAll('[data-swap-index]')).map((card) => {
            const css = getComputedStyle(card)
            const m = new DOMMatrixReadOnly(css.transform)
            const border = card.querySelector('[data-word-card-border]')
            const surface = card.querySelector('[data-word-card-surface]')
            const surfaceStyle = surface && getComputedStyle(surface)
            return {
                border: {
                    source: border?.currentSrc ?? '',
                    loaded: Boolean(border?.complete && border.naturalWidth > 0),
                    radii: surfaceStyle && [
                        surfaceStyle.borderTopLeftRadius,
                        surfaceStyle.borderTopRightRadius,
                        surfaceStyle.borderBottomRightRadius,
                        surfaceStyle.borderBottomLeftRadius,
                    ],
                },
                word: card.querySelector('[data-practice-english]').textContent.trim(),
                front: card.hasAttribute('data-word-deck-front'),
                fourth: card.hasAttribute('data-word-deck-fourth'),
                inert: card.inert,
                opacity: Number(css.opacity),
                visibility: css.visibility,
                transform: [m.m41, m.m42, m.m43, m.m11, m.m22],
                layer: Number(css.zIndex),
                ...geometry(card),
            }
        })
        return {
            index: Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex),
            phase: stage?.dataset.wordDeckState,
            documentHeight: document.documentElement.scrollHeight,
            viewport: [innerWidth, innerHeight],
            perspective: stage && getComputedStyle(stage).perspective,
            origin: stage && getComputedStyle(stage).perspectiveOrigin,
            cards,
            words: cards.map((card) => card.word),
            visible: cards.filter((card) => card.visibility !== 'hidden' && card.opacity > 0.001),
            front: cards.find((card) => card.front),
            remembered: Number(progress?.getAttribute('aria-valuenow')),
            total: Number(progress?.getAttribute('aria-valuemax')),
        }
    })
}
function assertUniformCardBorders(borders, expectedSource) {
    assert.ok(borders.length > 0, 'word card borders are present')
    const source = expectedSource ?? borders[0].source
    assert.match(source, /\/word-card-gradient-border(?:\.[^/]+)?\.svg(?:\?.*)?$/)
    for (const border of borders) {
        assert.equal(border.source, source, 'every card retains the front gradient resource')
        assert.equal(border.loaded, true, 'every card border resource is loaded')
        assert.deepEqual(
            border.radii,
            ['4%', '4%', '4%', '4%'],
            'every card uses the front contour',
        )
    }
}
async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const el = document.querySelector(target)
            if (!el || el.disabled || el.closest('[inert]'))
                throw new Error('Unavailable ' + target)
            el.focus()
            el.click()
        },
        selector,
    )
}
async function idle(window, word) {
    await waitFor(
        window,
        (expected) =>
            document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState === 'idle' &&
            document
                .querySelector('[data-word-deck-front] [data-practice-english]')
                ?.textContent.trim() === expected,
        'idle ' + word,
        word,
    )
    await delay(80)
}
async function mouse(window, x, y, type = 'mouseMoved', pressed = false) {
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type,
        x,
        y,
        button: pressed || type === 'mouseReleased' ? 'left' : 'none',
        buttons: pressed ? 1 : 0,
        clickCount: type === 'mousePressed' || type === 'mouseReleased' ? 1 : 0,
    })
}
async function capture(window, label, suffix) {
    const path = resolve(
        'dist/card-swap-presentation-' + label.toLowerCase() + '-' + suffix + '.png',
    )
    writeFileSync(path, (await window.webContents.capturePage()).toPNG())
    return path
}
async function runChecks(window, origin, label) {
    const result = { label, status: 'running', screenshots: [] }
    window.setContentSize(1920, 1080)
    window.webContents.setZoomFactor(1)
    window.webContents.setBackgroundThrottling(false)
    window.webContents.debugger.attach('1.3')
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
        enabled: true,
    })
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    try {
        await window.loadURL(origin + '/practice/?demo=word-basic&mode=pronounce')
        await waitFor(
            window,
            () =>
                document.querySelector('main[data-toolbar-ready="true"]') &&
                document.querySelector('[data-word-deck-stage]'),
            'ready',
        )
        await idle(window, 'woman')
        const initial = (result.initial = await snapshot(window))
        assertUniformCardBorders(initial.cards.map((card) => card.border))
        const borderSource = initial.front.border.source
        assert.equal(initial.perspective, '900px')
        assert.equal(initial.visible.length, 4)
        assert.equal(initial.total, 10)
        assert.equal(initial.front.width, 500)
        assert.equal(initial.front.height, 500)
        assert.equal(initial.documentHeight, 1080)
        assert.deepEqual(
            initial.visible.map((card) => card.word),
            initial.words.slice(0, 4),
        )
        assert.deepEqual(
            initial.visible.map((card) => card.transform[2]),
            [0, -80, -160, -240],
        )
        result.screenshots.push(await capture(window, label, 'four-card-rest'))
        await mouse(window, initial.front.x + 80, initial.front.y + 80)
        await delay(1200)
        result.hoverLeft = await snapshot(window)
        await mouse(window, initial.front.x + 420, initial.front.y + 420)
        await delay(1200)
        result.hoverRight = await snapshot(window)
        assertUniformCardBorders(
            result.hoverLeft.cards.map((card) => card.border),
            borderSource,
        )
        assertUniformCardBorders(
            result.hoverRight.cards.map((card) => card.border),
            borderSource,
        )
        assert.notEqual(result.hoverLeft.origin, result.hoverRight.origin)
        assert.ok(Math.abs(result.hoverLeft.visible[1].x - result.hoverRight.visible[1].x) > 1)
        assert.ok(
            Math.abs(result.hoverRight.visible[1].transform[0] - initial.visible[1].transform[0]) >
                1,
        )
        assert.equal(result.hoverRight.front.width, 500)
        result.screenshots.push(await capture(window, label, 'hover-right'))
        await mouse(window, 2, 2)
        await delay(1400)
        for (const expected of ['man', 'girl']) {
            const before = await snapshot(window)
            await evaluate(window, () => {
                const node = document.querySelector('[data-word-deck-front]')
                const trace = { node, active: true, frames: [], final: null }
                window.__presentationTrace = trace
                function frame() {
                    if (!trace.active) return
                    const css = getComputedStyle(node),
                        m = new DOMMatrixReadOnly(css.transform)
                    const visibleCards = Array.from(
                        document.querySelectorAll('[data-swap-index]'),
                    ).filter(
                        (card) =>
                            getComputedStyle(card).visibility !== 'hidden' &&
                            Number(getComputedStyle(card).opacity) > 0.001,
                    )
                    trace.frames.push({
                        time: performance.now(),
                        y: m.m42,
                        z: m.m43,
                        layer: Number(css.zIndex),
                        opacity: Number(css.opacity),
                        connected: node.isConnected,
                        height: document.documentElement.scrollHeight,
                        count: visibleCards.length,
                        borders: visibleCards.map((card) => {
                            const border = card.querySelector('[data-word-card-border]')
                            const surface = card.querySelector('[data-word-card-surface]')
                            const style = surface && getComputedStyle(surface)
                            return {
                                word: card
                                    .querySelector('[data-practice-english]')
                                    ?.textContent.trim(),
                                source: border?.currentSrc ?? '',
                                loaded: Boolean(border?.complete && border.naturalWidth > 0),
                                radii: style && [
                                    style.borderTopLeftRadius,
                                    style.borderTopRightRadius,
                                    style.borderBottomRightRadius,
                                    style.borderBottomLeftRadius,
                                ],
                            }
                        }),
                    })
                    requestAnimationFrame(frame)
                }
                requestAnimationFrame(frame)
            })
            await click(window, '[data-word-card-actions] button[aria-label^="再来"]')
            await idle(window, expected)
            const trace = await evaluate(window, () => {
                const trace = window.__presentationTrace
                trace.active = false
                const css = getComputedStyle(trace.node),
                    m = new DOMMatrixReadOnly(css.transform)
                return {
                    frames: trace.frames,
                    final: {
                        z: m.m43,
                        opacity: Number(css.opacity),
                        visibility: css.visibility,
                        fourth: trace.node.hasAttribute('data-word-deck-fourth'),
                        nodeRetained: trace.node.isConnected,
                    },
                }
            })
            assert.ok(trace.frames.some((frame) => frame.y > 500))
            for (const frame of trace.frames) assertUniformCardBorders(frame.borders, borderSource)
            assert.ok(
                trace.frames.every(
                    (frame) => frame.count <= 4 && frame.height === 1080 && frame.connected,
                ),
            )
            assert.equal(trace.final.z, -240)
            assert.equal(trace.final.opacity, 1)
            assert.equal(trace.final.fourth, true)
            assert.equal(trace.final.nodeRetained, true)
            const after = await snapshot(window)
            assertUniformCardBorders(
                after.cards.map((card) => card.border),
                borderSource,
            )
            assert.equal(after.remembered, 0)
            assert.equal(after.cards.length, 10)
            assert.equal(after.words.at(-1), before.front.word)
            assert.equal(after.visible.length, 4)
            result['retry-' + expected] = { trace, after }
        }
        result.screenshots.push(await capture(window, label, 'retry-tail-remains-visible'))
        await click(window, '[data-practice-footer-action="question.next"]')
        await idle(window, 'boy')
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 'girl')
        result.businessNavigation = await snapshot(window)
        assertUniformCardBorders(
            result.businessNavigation.cards.map((card) => card.border),
            borderSource,
        )
        const front = result.businessNavigation.front
        await mouse(window, front.x + 250, front.y + 100)
        await mouse(window, front.x + 250, front.y + 100, 'mousePressed', true)
        for (const offset of [150, 350, 600]) {
            await mouse(window, front.x + 250, front.y + 100 + offset, 'mouseMoved', true)
            await delay(20)
            const dragging = await snapshot(window)
            assertUniformCardBorders(
                dragging.cards.map((card) => card.border),
                borderSource,
            )
        }
        await mouse(window, front.x + 250, front.y + 700, 'mouseReleased')
        await idle(window, 'boy')
        result.manual = await snapshot(window)
        assertUniformCardBorders(
            result.manual.cards.map((card) => card.border),
            borderSource,
        )
        assert.equal(result.manual.documentHeight, 1080)
        assert.equal(result.manual.remembered, 0)
        assert.ok(
            result.manual.cards
                .filter((card) => card.visibility === 'hidden')
                .every((card) => card.bottom <= 1080),
        )
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 'girl')
        await click(window, 'button[aria-label="记住当前单词"]')
        await idle(window, 'boy')
        result.remembered = await snapshot(window)
        assertUniformCardBorders(
            result.remembered.cards.map((card) => card.border),
            borderSource,
        )
        assert.equal(result.remembered.remembered, 1)
        assert.equal(result.remembered.cards.length, 9)
        assert.equal(result.remembered.words.includes('girl'), false)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await delay(150)
        const reduced = await snapshot(window)
        await mouse(window, reduced.front.x + 420, reduced.front.y + 420)
        await delay(300)
        result.reduced = await snapshot(window)
        assertUniformCardBorders(
            result.reduced.cards.map((card) => card.border),
            borderSource,
        )
        assert.equal(result.reduced.origin, '250px 250px')
        assert.equal(result.reduced.visible[1].transform[0], 32)
        assert.equal(result.reduced.documentHeight, 1080)
        result.status = 'passed'
        console.log(
            'Presentation',
            label,
            'passed: four cards / native hover / retained tail / queue / overflow / remember / reduced',
        )
        return { label, status: 'passed' }
    } finally {
        await evaluate(window, () => {
            if (window.__presentationTrace) window.__presentationTrace.active = false
        })
        window.webContents.debugger.detach()
        writeFileSync(
            resolve('dist/card-swap-presentation-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 2),
        )
    }
}
void runStandalonePanelMotionSmoke({
    reportName: 'card-swap-presentation-runtime-validation',
    runChecks,
    activateWindow: false,
    timeoutMs: 180000,
})
