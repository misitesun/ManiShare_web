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
async function waitFor(window, operation, label, ...args) {
    for (let attempt = 0; attempt < 150; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(40)
    }
    const diagnostic = await evaluate(window, () => ({
        index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
        phase: document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState,
        paused: document.querySelector('[data-practice-index]')?.dataset.practicePaused,
        visibility: document.visibilityState,
        cards: Array.from(document.querySelectorAll('[data-swap-index]'), (node) => ({
            index: node.dataset.swapIndex,
            transform: node.style.transform,
            opacity: node.style.opacity,
            front: node.hasAttribute('data-word-deck-front'),
            exiting: node.hasAttribute('data-card-swap-exiting'),
        })),
    }))
    console.log('CardSwap timeout diagnostic:', JSON.stringify(diagnostic))
    throw new Error('Timed out: word card ' + label)
}
async function frames(window) {
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
}
async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const node = document.querySelector(target)
            if (!node || node.disabled || node.closest('[inert]'))
                throw new Error('Unavailable card action ' + target)
            node.focus()
            node.click()
        },
        selector,
    )
}
async function key(window, keyCode, modifiers = []) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await frames(window)
}
async function load(window, origin, mode = 'pronounce') {
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: 2,
        y: 2,
        button: 'none',
        buttons: 0,
    })
    await window.loadURL(
        origin + '/practice/?demo=word-basic&mode=' + mode + '&sourceCourse=phonetics',
    )
    await waitFor(window, () => document.querySelector('main[data-toolbar-ready="true"]'), 'ready')
    if (await evaluate(window, () => document.querySelector('[data-practice-paused="true"]')))
        await click(window, '[data-pause-action="continue"]')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-paused="false"]'),
        'foreground',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
    })
    await frames(window)
}
async function state(window) {
    return evaluate(window, () => {
        function geometry(node) {
            if (!node) return null
            const rect = node.getBoundingClientRect()
            const style = getComputedStyle(node)
            const matrix = new DOMMatrixReadOnly(style.transform)
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                color: style.color,
                opacity: Number(style.opacity),
                matrix: { x: matrix.m41, y: matrix.m42, scaleX: matrix.m11, scaleY: matrix.m22 },
                cursor: style.cursor,
            }
        }
        const root = document.querySelector('[data-practice-index]')
        const stage = document.querySelector('[data-word-deck-stage]')
        const front = document.querySelector('[data-word-deck-front]')
        const progress = document.querySelector('[data-practice-progress]')
        return {
            index: root?.dataset.practiceIndex,
            total: Number(
                document.querySelector('[data-practice-progress]')?.getAttribute('aria-valuemax'),
            ),
            english: front?.querySelector('[data-practice-english]')?.textContent.trim(),
            phase: root?.dataset.practicePhase,
            paused: root?.dataset.practicePaused,
            progress: {
                remembered: Number(progress?.getAttribute('aria-valuenow')),
                track: geometry(progress),
                fill: geometry(progress?.firstElementChild),
                transitionProperty: progress
                    ? getComputedStyle(progress.firstElementChild).transitionProperty
                    : null,
            },
            state: stage?.dataset.wordDeckState,
            stage: geometry(stage),
            front: geometry(front),
            next: geometry(document.querySelector('[data-word-deck-next]')),
            third: geometry(document.querySelector('[data-word-deck-third]')),
            nextWord: document
                .querySelector('[data-word-deck-next] [data-practice-english]')
                ?.textContent.trim(),
            thirdWord: document
                .querySelector('[data-word-deck-third] [data-practice-english]')
                ?.textContent.trim(),
            previous: geometry(document.querySelector('[data-word-deck-previous]')),
            exiting: Array.from(document.querySelectorAll('[data-card-swap-exiting]'), geometry),
            cardBorders: Array.from(document.querySelectorAll('[data-swap-index]'), (card) => {
                const border = card.querySelector('[data-word-card-border]')
                const surface = card.querySelector('[data-word-card-surface]')
                const style = surface && getComputedStyle(surface)
                return {
                    word: card.querySelector('[data-practice-english]')?.textContent.trim(),
                    source: border?.currentSrc ?? '',
                    loaded: Boolean(border?.complete && border.naturalWidth > 0),
                    // 读取未投影surface的计算圆角，避免把3D/页面缩放误当轮廓差异。
                    radii: style && [
                        style.borderTopLeftRadius,
                        style.borderTopRightRadius,
                        style.borderBottomRightRadius,
                        style.borderBottomLeftRadius,
                    ],
                }
            }),
            word: geometry(front?.querySelector('[data-practice-english]')),
            // 朗读声纹也具有role=img；基准量取必须命中woman的音素行。
            phonemes: geometry(front?.querySelector('[role="img"][aria-label="/ˈwʊmən/"]')),
            translation: geometry(front?.querySelector('[data-practice-translation]')),
            actions: Array.from(
                document.querySelectorAll('[data-word-card-actions] button'),
                geometry,
            ),
            actionLabels: Array.from(
                document.querySelectorAll('[data-word-card-actions] button > span:last-child'),
                geometry,
            ),
            backs: ['far', 'near'].map((depth) =>
                geometry(document.querySelector('[data-word-card-back="' + depth + '"]')),
            ),
            guidelines: front
                ? Array.from(front.querySelectorAll('[data-word-card-guideline]'), geometry)
                : [],
            assets: front
                ? Array.from(front.querySelectorAll('img'), (image) => ({
                      source: image.currentSrc,
                      loaded: image.complete && image.naturalWidth > 0,
                      ...geometry(image),
                  }))
                : [],
            controls: front
                ? Array.from(front.querySelectorAll('button'), (button) => ({
                      label: button.getAttribute('aria-label'),
                      ...geometry(button),
                  }))
                : [],
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            viewport: { width: innerWidth, height: innerHeight },
            finish: Boolean(document.querySelector('[data-practice-completion]')),
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
async function idle(window, index) {
    await waitFor(
        window,
        (expected) =>
            document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState === 'idle' &&
            document.querySelector('[data-practice-index]')?.dataset.practiceIndex ===
                String(expected),
        'idle ' + index,
        index,
    )
    await frames(window)
}
async function settledProgress(window, index) {
    await waitFor(
        window,
        () => {
            const track = document.querySelector('[data-practice-progress]')
            const target =
                (track.getBoundingClientRect().width *
                    Number(track.getAttribute('aria-valuenow'))) /
                Number(track.getAttribute('aria-valuemax'))
            return Math.abs(track.firstElementChild.getBoundingClientRect().width - target) < 0.1
        },
        'settled progress ' + index,
    )
}
async function progressSamples(window) {
    return evaluate(window, () =>
        JSON.parse(document.querySelector('[data-practice-progress]').dataset.smokeProgress),
    )
}
async function capture(window, label, suffix) {
    await delay(100)
    await frames(window)
    const path = 'dist/word-pronunciation-' + label.toLowerCase() + '-' + suffix + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}
function near(actual, expected, label, tolerance = 0.1) {
    assert.ok(Math.abs(actual - expected) <= tolerance, label + ': ' + actual + ' != ' + expected)
}
async function startDrag(window, dx, dy = 0, steps = 5, paintMoves = true) {
    const box = (await state(window)).stage
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + 100)
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'none',
        buttons: 0,
    })
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        buttons: 1,
        clickCount: 1,
    })
    for (let index = 1; index <= steps; index++) {
        await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: Math.round(x + (dx * index) / steps),
            y: Math.round(y + (dy * index) / steps),
            button: 'left',
            buttons: 1,
        })
        // 快速单move甩卡立即松手；可视拖动仍等待绘制，避免把帧等待当成用户停顿。
        if (paintMoves) await frames(window)
    }
    return { x: x + dx, y: y + dy }
}
async function release(window, point) {
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: Math.round(point.x),
        y: Math.round(point.y),
        button: 'left',
        buttons: 0,
        clickCount: 1,
    })
    await frames(window)
}
async function flick(window, dx) {
    await evaluate(window, () => {
        const stage = document.querySelector('[data-word-deck-stage]')
        const events = []
        function trace(event) {
            events.push({
                type: event.type,
                x: event.clientX,
                y: event.clientY,
                buttons: event.buttons,
                target: event.target.tagName,
                trusted: event.isTrusted,
                front: Boolean(event.target.closest('[data-word-deck-front]')),
                phase: stage.dataset.wordDeckState,
                time: event.timeStamp,
            })
            stage.dataset.smokeFlick = JSON.stringify(events)
        }
        for (const name of [
            'pointerdown',
            'pointermove',
            'pointerup',
            'pointercancel',
            'lostpointercapture',
        ])
            stage.addEventListener(name, trace, true)
    })
    const box = (await state(window)).stage
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + 100)
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'none',
        buttons: 0,
    })
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        buttons: 1,
        clickCount: 1,
    })
    await frames(window)
    for (const fraction of [0.25, 0.6, 1]) {
        await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: Math.round(x + dx * fraction),
            y,
            button: 'left',
            buttons: 1,
        })
        await delay(12)
    }
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: x + dx,
        y,
        button: 'left',
        buttons: 0,
        clickCount: 1,
    })
    await frames(window)
}
async function swipe(window, direction, label) {
    const before = await state(window)
    const point = await startDrag(window, direction === 'left' ? -210 : 210)
    const dragging = await state(window)
    assert.equal(dragging.state, 'dragging')
    assert.equal(dragging.index, before.index)
    assert.ok(dragging.next.opacity > 0)
    const dragScreenshot = await capture(window, label, direction + '-drag')
    await release(window, point)
    const exiting = await state(window)
    assert.equal(exiting.state, 'next')
    assert.equal(
        Number(exiting.index),
        Number(before.index) + 1,
        'original CardSwap commits the accepted gesture without waiting for every spring',
    )
    assert.ok(
        exiting.exiting.some((card) => card.opacity > 0),
        'outgoing card stays in the original engine',
    )
    const exitScreenshot = await capture(window, label, direction + '-exit')
    return { dragging, exiting, dragScreenshot, exitScreenshot }
}

async function runChecks(window, origin, label) {
    const report = {
        label,
        status: 'running',
        interactions: [],
        responsive: [],
        motionImplementation:
            'Direct CardSwap component; original persistent card engine and frame loop; finite exercise navigation',
    }
    const priorSize = window.getContentSize()
    const priorMinimum = window.getMinimumSize()
    const priorZoom = window.webContents.getZoomFactor()
    try {
        window.setMinimumSize(1, 1)
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        window.webContents.debugger.attach('1.3')
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        })
        report.focusEmulation = true
        await load(window, origin)
        report.sparseReleases = []
        for (let angle = 0; angle < 360; angle += 45) {
            const radians = (angle * Math.PI) / 180
            const point = await startDrag(
                window,
                Math.round(80 * Math.cos(radians)),
                Math.round(80 * Math.sin(radians)),
                1,
                false,
            )
            await release(window, point)
            const expected = angle / 45 + 1
            assert.equal(
                (await state(window)).index,
                String(expected),
                'one-move 80px fling advances at angle ' + angle,
            )
            await idle(window, expected)
            report.sparseReleases.push({ angle, distance: 80, moveEvents: 1, index: expected })
        }
        const finalPosition = await startDrag(window, 30, 0, 1)
        await release(window, { x: finalPosition.x + 150, y: finalPosition.y })
        await idle(window, 9)
        report.releaseFinalPosition = true
        await load(window, origin)
        const heldShort = await startDrag(window, 80, 0, 1)
        await delay(180)
        await release(window, heldShort)
        await idle(window, 0)
        assert.equal(
            (await state(window)).index,
            '0',
            'hold before release removes stale fling velocity',
        )
        report.staleVelocityCleared = true
        const box = (await state(window)).stage
        const originPoint = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + 100) }
        await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            ...originPoint,
            button: 'none',
            buttons: 0,
        })
        await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            ...originPoint,
            button: 'left',
            buttons: 1,
            clickCount: 1,
        })
        await release(window, { x: originPoint.x + 80, y: originPoint.y })
        await idle(window, 1)
        report.releaseWithoutMove = true
        await load(window, origin)
        report.interactions.push(
            'eight-angle single-move short flings, pointerup final position, sparse release and held-short stale velocity',
        )
        console.log('Word pronunciation ' + label + ': sparse release regression passed')
        report.reference = await state(window)
        report.darkScreenshot = await capture(window, label, 'dark-1920')
        writeFileSync(
            resolve('dist/word-pronunciation-' + label.toLowerCase() + '-reference.json'),
            JSON.stringify(report.reference, null, 4),
        )
        const reference = report.reference
        assertUniformCardBorders(reference.cardBorders)
        const borderSource = reference.cardBorders[0].source
        assert.equal(reference.total, 10, 'ten local word pronunciation questions')
        assert.equal(reference.progress.transitionProperty, 'width')
        assert.equal(reference.progress.remembered, 0, 'initial remembered count')
        near(reference.progress.fill.width, 0, 'initial remember progress')
        assert.equal(reference.next.opacity, 1, 'real next card is present at rest')
        assert.equal(reference.third.opacity, 1, 'third real card is present at rest')
        assert.equal(reference.nextWord, 'man')
        assert.equal(reference.thirdWord, 'girl')
        near(reference.stage.x, 710, 'stage x')
        near(reference.stage.y, 228, 'stage y')
        near(reference.stage.width, 500, 'stage width')
        near(reference.stage.height, 500, 'stage height')
        for (const [index, position] of [
            [0, 2],
            [1, 1],
        ]) {
            const back = reference.backs[index]
            const projected = 900 / (900 + position * 80)
            near(back.x, 710 + 250 + (position * 32 - 250) * projected, 'native 3D back x')
            near(back.y, 228 + 250 + (-position * 2 - 250) * projected, 'native 3D back y')
            near(back.width, 500 * projected, 'native 3D back width')
            near(back.height, 500 * projected, 'native 3D back height')
        }
        assert.equal(
            await evaluate(
                window,
                () =>
                    Array.from(document.querySelectorAll('[data-swap-index]')).filter(
                        (card) =>
                            getComputedStyle(card).visibility !== 'hidden' &&
                            Number(getComputedStyle(card).opacity) > 0.999,
                    ).length,
            ),
            4,
            'four real cards are visible at rest',
        )
        near(reference.word.x, 889, 'word x')
        near(reference.word.y, 533, 'word y')
        for (const [index, y] of [540.5, 555.5, 570.5, 585.5].entries()) {
            near(reference.guidelines[index].x, 879, 'guideline x')
            near(reference.guidelines[index].y, y, 'guideline y')
            near(reference.guidelines[index].width, 162, 'guideline width')
            near(reference.guidelines[index].height, 1, 'guideline height')
        }
        assert.equal(reference.word.fontSize, '38px')
        assert.equal(reference.word.fontWeight, '600')
        near(Number.parseFloat(reference.word.letterSpacing), 3.04, 'tracking')
        assert.ok(
            reference.word.height >= 53 && reference.word.height < 55,
            'single normal line box',
        )
        near(reference.phonemes.x, 886, 'phonemes x')
        near(reference.phonemes.y, 607, 'phonemes y')
        near(reference.phonemes.width, 148, 'phonemes width')
        near(reference.phonemes.height, 35, 'phonemes height')
        near(reference.translation.x, 876, 'translation x')
        near(reference.translation.y, 662, 'translation y')
        assert.equal(reference.translation.fontSize, '18px')
        for (const [index, x] of [
            [0, 833],
            [1, 1021],
        ]) {
            near(reference.actions[index].x, x, 'action x')
            near(reference.actions[index].y, 767, 'action y')
            near(reference.actions[index].width, 66, 'action width')
            assert.equal(reference.actionLabels[index].fontSize, '18px')
            near(reference.actionLabels[index].y, 841, 'action label y')
        }
        assert.ok(reference.assets.every((image) => image.loaded))
        near(reference.assets[0].x, 710, 'image x')
        near(reference.assets[0].y, 228, 'image y')
        near(reference.assets[0].width, 500, 'image width')
        near(reference.assets[0].height, 281, 'image height')
        for (const [index, x, y] of [
            [0, 1060, 546],
            [1, 724, 682],
            [2, 770, 682],
            [3, 1164, 682],
        ]) {
            near(reference.controls[index].x, x, 'control x')
            near(reference.controls[index].y, y, 'control y')
            near(reference.controls[index].width, 32, 'control width')
        }
        console.log('Word pronunciation ' + label + ': geometry passed')
        await click(window, '[data-word-card-actions] button[aria-label^="再来"]')
        await idle(window, 0)
        const retried = await state(window)
        assertUniformCardBorders(retried.cardBorders, borderSource)
        assert.equal(retried.english, 'man', 'retry displays the next remaining card')
        assert.equal(retried.nextWord, 'girl', 'retry advances the existing remaining queue')
        assert.equal(retried.progress.remembered, 0, 'retry does not count as remembered')
        assert.equal(retried.total, 10, 'retry preserves the original total')
        assert.equal(retried.finish, false)
        near(retried.progress.fill.width, 0, 'retry leaves remembered progress at zero')
        assert.equal(
            await evaluate(
                window,
                () => document.querySelectorAll('[data-word-deck] [data-swap-index]').length,
            ),
            10,
            'retry does not remove any remaining card',
        )
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-swap-index="9"] [data-practice-english]')
                    ?.textContent.trim(),
            ),
            'woman',
            'retry appends the original current card to the remaining queue tail',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        '[data-word-card-actions] button[aria-label="记住当前单词"]:enabled',
                    ),
                ),
            ),
            true,
        )
        report.interactions.push(
            'retry moves woman to the queue tail, displays man and keeps all ten words unremembered',
        )
        await load(window, origin)
        await evaluate(window, () => {
            const track = document.querySelector('[data-practice-progress]')
            const fill = track.firstElementChild
            const samples = []
            track.dataset.smokeProgress = '[]'
            function record(event) {
                if (event.propertyName !== 'width') return
                samples.push({
                    event: event.type,
                    width: fill.getBoundingClientRect().width,
                    target:
                        (track.getBoundingClientRect().width *
                            Number.parseFloat(fill.style.width)) /
                        100,
                    duration: getComputedStyle(fill).transitionDuration,
                })
                track.dataset.smokeProgress = JSON.stringify(samples)
            }
            fill.addEventListener('transitionrun', record)
            fill.addEventListener('transitionend', record)
        })
        const short = await startDrag(window, 70)
        const shortDragging = await state(window)
        assertUniformCardBorders(shortDragging.cardBorders, borderSource)
        assert.equal(shortDragging.state, 'dragging')
        near(
            shortDragging.progress.fill.width,
            reference.progress.fill.width,
            'drag holds progress',
        )
        await release(window, short)
        const returning = await state(window)
        assertUniformCardBorders(returning.cardBorders, borderSource)
        assert.equal(returning.state, 'returning')
        assert.equal(returning.next.opacity, 1, 'next image never fades during rebound')
        assert.equal(returning.third.opacity, 1)
        assert.ok(Math.abs(returning.next.matrix.x - shortDragging.next.matrix.x) < 5)
        assert.ok(
            returning.next.matrix.x < 32 * (1 + 0.12),
            'preview continues from its current spring position',
        )
        report.rebound = { dragging: shortDragging, returning }
        await idle(window, 0)
        // 静止几何单独移出hover；32/2/80透视不能复用旧二维732/242基准。
        await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: 2,
            y: 2,
            button: 'none',
            buttons: 0,
        })
        await delay(900)
        const restored = await state(window)
        assertUniformCardBorders(restored.cardBorders, borderSource)
        near(restored.front.matrix.x, 0, 'short drag resets')
        near(restored.next.x, reference.next.x, 'next returns to native 3D resting position')
        near(restored.next.y, reference.next.y, 'next native 3D stack y')
        assert.equal(restored.next.opacity, 1, 'next image remains after rebound')
        assert.equal(restored.third.opacity, 1)
        assert.equal(restored.nextWord, shortDragging.nextWord)
        report.rebound.restored = restored
        report.rebound.screenshot = await capture(window, label, 'after-rebound')
        await delay(300)
        assert.equal((await state(window)).next.opacity, 1, 'late cleanup cannot hide next card')
        assert.deepEqual(
            await progressSamples(window),
            [],
            'rebound never starts a progress transition',
        )
        const startsAtRest = await evaluate(window, () => {
            const front = document.querySelector('[data-word-deck-front]')
            document.querySelector('[data-practice-footer-action="question.next"]').click()
            return new DOMMatrixReadOnly(getComputedStyle(front).transform).m41
        })
        near(startsAtRest, 0, 'following button action starts at the current resting position')
        await idle(window, 1)
        await settledProgress(window, 1)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        await settledProgress(window, 0)
        report.progress = await progressSamples(window)
        assert.deepEqual(
            report.progress,
            [],
            'ordinary next and previous never change remembered progress',
        )
        near(
            (await state(window)).progress.fill.width,
            0,
            'navigation leaves remember progress at zero',
        )
        report.interactions.push(
            'next/previous retain their card motion while remembered progress stays zero',
        )
        report.interactions.push(
            'short drag returns both real previews without fading or a later jump',
        )
        report.allAngle = []
        for (const [dx, dy] of [
            [0, 210],
            [0, -210],
            [160, 160],
            [-160, 160],
            [160, -160],
            [-160, -160],
        ]) {
            const point = await startDrag(window, dx, dy)
            const dragging = await state(window)
            assertUniformCardBorders(dragging.cardBorders, borderSource)
            assert.equal(dragging.state, 'dragging', 'all angles enter the drag phase')
            near(dragging.front.matrix.x, dx, 'all angle follows x')
            near(dragging.front.matrix.y, dy, 'all angle follows y')
            assert.equal(
                await evaluate(window, () =>
                    Array.from(document.querySelectorAll('[data-practice-footer] button')).some(
                        (button) =>
                            button.disabled && button.getAttribute('aria-label') !== '上一题',
                    ),
                ),
                false,
                'footer remains usable during drag',
            )
            await release(window, point)
            await idle(window, 1)
            await click(window, '[data-practice-footer-action="question.previous"]')
            await idle(window, 0)
            report.allAngle.push({ dx, dy, followed: true, advancesOnlyNext: true })
        }
        const small = await startDrag(window, 8, 12, 1)
        const smallDragging = await state(window)
        assert.equal(
            smallDragging.state,
            'dragging',
            'a small mostly vertical gesture is not discarded',
        )
        await evaluate(window, () => {
            const stage = document.querySelector('[data-word-deck-stage]')
            const front = document.querySelector('[data-word-deck-front]')
            const frames = []
            let changes = 0
            const observer = new MutationObserver((records) => {
                changes += records.length
            })
            observer.observe(stage, {
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'aria-hidden',
                    'inert',
                    'data-word-deck-front',
                    'data-word-deck-next',
                    'data-word-deck-third',
                    'data-word-card-back',
                ],
            })
            function sample(time) {
                const matrix = new DOMMatrixReadOnly(getComputedStyle(front).transform)
                frames.push({ time, x: matrix.m41, y: matrix.m42 })
                if (frames.length < 45) requestAnimationFrame(sample)
                else {
                    observer.disconnect()
                    stage.dataset.smallMotion = JSON.stringify({ frames, changes })
                }
            }
            requestAnimationFrame(sample)
        })
        await release(window, small)
        assert.equal((await state(window)).state, 'returning')
        await idle(window, 0)
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-word-deck-stage]').dataset.smallMotion),
            'small rebound samples',
        )
        report.smallMotion = await evaluate(window, () =>
            JSON.parse(document.querySelector('[data-word-deck-stage]').dataset.smallMotion),
        )
        assert.ok(
            report.smallMotion.frames.some((frame) => Math.hypot(frame.x, frame.y) > 1),
            'small drag visibly returns instead of snapping',
        )
        assert.ok(
            report.smallMotion.frames.some(
                (frame, index, frames) =>
                    index > 0 &&
                    Math.hypot(frame.x, frame.y) <
                        Math.hypot(frames[index - 1].x, frames[index - 1].y),
            ),
            'small rebound has intermediate positions',
        )
        assert.ok(
            report.smallMotion.changes < 10,
            'stable accessibility and card markers are not rewritten on every frame',
        )
        const commandeered = await startDrag(window, 35, 50)
        await key(window, 'Right', ['shift'])
        assert.equal((await state(window)).index, '1', 'shortcut can take over a held drag')
        await release(window, commandeered)
        await idle(window, 1)
        assert.equal(
            (await state(window)).index,
            '1',
            'later pointerup cannot advance a second time',
        )
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        const footerTakeover = await startDrag(window, -40, 30)
        await click(window, '[data-practice-footer-action="question.next"]')
        await release(window, footerTakeover)
        await idle(window, 1)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        report.interactions.push(
            'all-angle gestures, small diagonal rebound and footer/shortcut takeover while dragging',
        )
        await window.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled', {
            enabled: true,
        })
        report.touchGestures = []
        for (const [dx, dy] of [
            [0, 210],
            [40, -210],
        ]) {
            const box = (await state(window)).stage
            const x = Math.round(box.x + box.width / 2)
            const y = Math.round(box.y + 250)
            await window.webContents.debugger.sendCommand('Input.dispatchTouchEvent', {
                type: 'touchStart',
                touchPoints: [{ x, y, id: 1 }],
            })
            for (let step = 1; step <= 5; step++) {
                await window.webContents.debugger.sendCommand('Input.dispatchTouchEvent', {
                    type: 'touchMove',
                    touchPoints: [{ x: x + (dx * step) / 5, y: y + (dy * step) / 5, id: 1 }],
                })
                await frames(window)
            }
            const touch = await state(window)
            assert.equal(
                touch.state,
                'dragging',
                'browser does not steal the vertical card gesture',
            )
            near(touch.front.matrix.y, dy, 'touch follows vertical distance', 2)
            if (dx)
                assert.ok(
                    Math.abs(touch.front.matrix.scaleY - 1) > 0.0001,
                    'touch retains original rotation feedback',
                )
            const touchAction = await evaluate(
                window,
                () =>
                    getComputedStyle(document.querySelector('[data-word-deck-front]')).touchAction,
            )
            assert.equal(
                touchAction,
                'pinch-zoom',
                'card owns both pan axes and preserves pinch zoom',
            )
            await window.webContents.debugger.sendCommand('Input.dispatchTouchEvent', {
                type: 'touchEnd',
                touchPoints: [],
            })
            await idle(window, 1)
            await click(window, '[data-practice-footer-action="question.previous"]')
            await idle(window, 0)
            report.touchGestures.push({ dx, dy, touchAction, automatedEmulationOnly: true })
        }
        await window.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled', {
            enabled: false,
        })
        await flick(window, 80)
        report.flick = await state(window)
        report.flick.events = await evaluate(window, () =>
            JSON.parse(document.querySelector('[data-word-deck-stage]').dataset.smokeFlick ?? '[]'),
        )
        if (report.flick.state !== 'next') console.log('Flick events:', report.flick.events)
        assert.equal(
            report.flick.index,
            '1',
            'original CardSwap accepts the new selection at release',
        )
        assert.equal(
            report.flick.state,
            'next',
            'speed allows a short 80px fling below the 150px threshold',
        )
        assert.ok(
            report.flick.exiting.some((card) => card.matrix.x > 80),
            'release velocity continues into the exit',
        )
        await idle(window, 1)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        await settledProgress(window, 0)
        report.interactions.push(
            'native short fast fling continues with inertia and only advances once',
        )
        await evaluate(window, () =>
            document.querySelectorAll('[data-swap-index]').forEach((node) => {
                node.dataset.originalInstance = node.dataset.swapIndex
            }),
        )
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-index]').dataset.practiceIndex === '1',
            'immediate first component selection',
        )
        assert.equal((await state(window)).state, 'next')
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            () => document.querySelector('[data-practice-index]').dataset.practiceIndex === '2',
            'continuous component selection',
        )
        assert.equal(
            await evaluate(window, () =>
                Array.from(document.querySelectorAll('[data-swap-index]')).every(
                    (node) => node.dataset.originalInstance === node.dataset.swapIndex,
                ),
            ),
            true,
            'card instances survive React question changes',
        )
        await idle(window, 2)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 1)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        await settledProgress(window, 0)
        report.interactions.push(
            'direct CardSwap retains all card DOM and accepts continuous operations before its springs settle',
        )
        const progressBeforeSwipe = (await progressSamples(window)).length
        report.left = await swipe(window, 'left', label)
        await idle(window, 1)
        await settledProgress(window, 1)
        report.left.progress = (await progressSamples(window)).slice(progressBeforeSwipe)
        assert.deepEqual(
            report.left.progress,
            [],
            'a committed swipe cannot increase remembered progress',
        )
        await click(window, '[data-practice-footer-action="question.previous"]')
        await frames(window)
        const leftRestore = await state(window)
        report.leftRestore = leftRestore
        assert.equal(leftRestore.state, 'previous')
        assert.ok(leftRestore.previous.matrix.x < 0, 'restore follows left history')
        assert.equal(leftRestore.index, '0')
        await idle(window, 0)
        report.right = await swipe(window, 'right', label)
        await idle(window, 1)
        await key(window, 'Left', ['shift'])
        const rightRestore = await state(window)
        report.rightRestore = rightRestore
        assert.equal(rightRestore.state, 'previous')
        assert.ok(rightRestore.previous.matrix.x > 0, 'restore follows right history')
        await idle(window, 0)
        report.interactions.push(
            'both directions advance next; previous restores the retained card instance and exit direction',
        )
        await evaluate(window, () => document.querySelector('[data-practice-index]').focus())
        await key(window, 'Enter')
        await idle(window, 1)
        await key(window, 'Left', ['shift'])
        await idle(window, 0)
        report.interactions.push('existing Enter command uses the same next transition')
        await click(window, '[data-practice-footer-action="question.next"]')
        await frames(window)
        assert.equal((await state(window)).state, 'next')
        await click(window, '[data-practice-navigation-action="reset"]')
        await waitFor(window, () => document.querySelector('[role="dialog"]'), 'reset modal')
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'reset closes')
        await delay(500)
        await idle(window, 1)
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        report.interactions.push(
            'opening a modal cancels motion while retaining the already accepted selection; no later extra advance',
        )
        const cancelled = await startDrag(window, -210)
        await evaluate(window, () =>
            document
                .querySelector('[data-word-deck-front]')
                .dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })),
        )
        await release(window, cancelled)
        await idle(window, 0)
        report.interactions.push('injected pointercancel never commits a next action')
        if (
            await evaluate(
                window,
                () =>
                    document.querySelector('[data-practice-pause-enabled]')?.dataset
                        .practicePauseEnabled === 'true',
            )
        ) {
            const interrupted = await startDrag(window, 210)
            await click(window, '[data-practice-navigation-action="pause"]')
            await release(window, interrupted)
            await waitFor(window, () => document.querySelector('[data-practice-pause]'), 'pause')
            assert.equal((await state(window)).index, '0')
            await delay(500)
            assert.equal((await state(window)).index, '0')
            await click(window, '[data-pause-action="continue"]')
            await idle(window, 0)
            await waitFor(
                window,
                () => !document.querySelector('[data-practice-pause]'),
                'pause exit',
            )
            report.interactions.push(
                'pause cancels the drag and stale animation cannot move the question',
            )
        } else {
            report.interactions.push(
                'pause interruption is not applicable while the development pause feature is disabled; modal cancellation remains covered',
            )
        }
        await click(window, '[data-word-deck-front] button[aria-label="记录当前单词笔记"]')
        await waitFor(window, () => document.querySelector('[role="dialog"]'), 'note')
        assert.equal((await state(window)).index, '0')
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'note closes')
        assert.equal((await state(window)).state, 'idle')
        report.interactions.push('card buttons retain independent click behavior')
        report.demoWords = [reference.english]
        for (let index = 1; index < reference.total; index++) {
            await click(window, '[data-practice-footer-action="question.next"]')
            await idle(window, index)
            const current = await state(window)
            assertUniformCardBorders(current.cardBorders, borderSource)
            assert.equal(current.finish, false)
            // 原版积分在0.001层级误差内停帧，序列更长时透明度可能停在0.999。
            near(
                current.next?.opacity ?? 0,
                index < reference.total - 1 ? 1 : 0,
                'next card visibility',
                0.002,
            )
            near(
                current.third?.opacity ?? 0,
                index < reference.total - 2 ? 1 : 0,
                'third card visibility',
                0.002,
            )
            if (index === reference.total - 1) {
                assert.equal(current.nextWord, undefined, 'last question has no fake next card')
                assert.equal(current.thirdWord, undefined)
            }
            near(current.stage.height, reference.stage.height, 'same demo card height')
            assert.equal(current.assets[0].source, reference.assets[0].source, 'shared demo image')
            assert.ok(current.english)
            report.demoWords.push(current.english)
            if (index === 1)
                report.secondWordScreenshot = await capture(window, label, 'second-word')
        }
        assert.equal(new Set(report.demoWords).size, reference.total, 'ten different demo words')
        await click(window, '[data-practice-footer-action="question.next"]')
        await idle(window, reference.total - 1)
        await delay(100)
        assert.equal(
            (await state(window)).finish,
            false,
            'last-card navigation cannot complete unremembered cards',
        )
        assert.equal((await state(window)).index, String(reference.total - 1))
        near(
            (await state(window)).progress.fill.width,
            0,
            'browsing every card still remembers zero',
        )
        await load(window, origin)
        await idle(window, 0)
        report.interactions.push(
            'footer uses card motion; last next retains the card without completion; reload restores the navigation baseline',
        )
        await click(window, '[data-practice-navigation-action="settings"]')
        await waitFor(window, () => document.querySelector('[role="tab"]'), 'settings')
        await evaluate(window, () =>
            Array.from(document.querySelectorAll('[role="tab"]'))
                .find((item) => {
                    const clone = item.cloneNode(true)
                    clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove())
                    return clone.textContent.trim() === '外观'
                })
                .click(),
        )
        await click(window, 'input[type="radio"][value="light"]')
        await waitFor(
            window,
            () => document.documentElement.dataset.theme === 'light',
            'light theme',
        )
        await click(window, 'button[aria-label="关闭对话框"]')
        await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'settings closes')
        report.lightBorders = (await state(window)).cardBorders
        assertUniformCardBorders(report.lightBorders, borderSource)
        report.lightScreenshot = await capture(window, label, 'light-1920')
        for (const [width, height, zoom] of [
            [1440, 900, 1],
            [1280, 800, 1],
            [1920, 1080, 1.25],
            [1920, 1080, 1.5],
            [1920, 1080, 2],
            [390, 844, 1],
            [768, 1024, 1],
        ]) {
            window.setContentSize(width, height)
            window.webContents.setZoomFactor(zoom)
            await delay(150)
            await frames(window)
            const measured = await state(window)
            assertUniformCardBorders(measured.cardBorders, borderSource)
            assert.equal(measured.overflow, false)
            assert.ok(
                measured.stage.x >= 0 &&
                    measured.stage.x + measured.stage.width <= measured.viewport.width,
            )
            report.responsive.push({ width, height, zoom, measured })
            if (width >= 1280) await capture(window, label, width + '-zoom-' + zoom)
        }
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await delay(150)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await click(window, '[data-practice-footer-action="question.next"]')
        await idle(window, 1)
        await settledProgress(window, 1)
        const reduced = await state(window)
        assertUniformCardBorders(reduced.cardBorders, borderSource)
        report.reducedProgress = reduced.progress
        assert.equal(report.reducedProgress.transitionProperty, 'none')
        await click(window, '[data-practice-footer-action="question.previous"]')
        await idle(window, 0)
        await settledProgress(window, 0)
        report.interactions.push('reduced motion commits next/previous without flight')
        for (const mode of ['spell', 'dictate', 'meaning', 'typing', 'oral']) {
            await load(window, origin, mode)
            assert.equal(
                await evaluate(window, () => Boolean(document.querySelector('[data-word-deck]'))),
                false,
            )
        }
        report.otherWordModes = 5
        report.status = 'passed'
        return report
    } finally {
        if (window.webContents.debugger.isAttached()) window.webContents.debugger.detach()
        window.setMinimumSize(...priorMinimum)
        window.setContentSize(...priorSize)
        window.webContents.setZoomFactor(priorZoom)
        writeFileSync(
            resolve('dist/word-pronunciation-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(report, null, 4),
        )
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'word-pronunciation-runtime-validation',
    runChecks,
    timeoutMs: 360000,
})
