const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')

const preferencesKey = 'english-learning-preferences-v1'
const themeKey = 'english-learning-theme'
const rememberButton = 'button[aria-label="记住当前单词"]'
const nextButton = '[data-practice-footer-action="question.next"]'
const previousButton = '[data-practice-footer-action="question.previous"]'

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function snapshot(window) {
    return evaluate(window, () => {
        const progress = document.querySelector('[data-practice-progress]')
        const fill = progress?.firstElementChild
        const trackWidth = progress?.getBoundingClientRect().width ?? 0
        const fillWidth = fill?.getBoundingClientRect().width ?? 0
        const feedback = document.querySelector('[data-word-remember-feedback]')
        const svg = feedback?.querySelector('svg')
        return {
            url: location.href,
            viewport: [innerWidth, innerHeight],
            index: Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex),
            stage: document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState,
            paused: document.querySelector('[data-practice-paused]')?.dataset.practicePaused,
            heading: document.querySelector('h1')?.textContent.trim(),
            frontWord:
                document
                    .querySelector('[data-word-deck-front] [data-practice-english]')
                    ?.textContent.trim() ?? null,
            words: Array.from(
                document.querySelectorAll('[data-word-deck] [data-swap-index]'),
                (card) => card.querySelector('[data-practice-english]')?.textContent.trim(),
            ),
            cards: Array.from(
                document.querySelectorAll('[data-word-deck] [data-swap-index]'),
                (card) => {
                    const style = getComputedStyle(card)
                    const rect = card.getBoundingClientRect()
                    const image = card.querySelector('[data-word-card-image], img')
                    return {
                        index: Number(card.dataset.swapIndex),
                        word: card.querySelector('[data-practice-english]')?.textContent.trim(),
                        front: card.hasAttribute('data-word-deck-front'),
                        near: card.hasAttribute('data-word-deck-next'),
                        far: card.hasAttribute('data-word-deck-third'),
                        ariaHidden: card.getAttribute('aria-hidden'),
                        inert: card.inert,
                        opacity: Number(style.opacity),
                        visibility: style.visibility,
                        width: rect.width,
                        height: rect.height,
                        imageReady: Boolean(image?.complete && image.naturalWidth > 0),
                    }
                },
            ),
            remaining: document.querySelectorAll('[data-word-deck] [data-swap-index]').length,
            remembered: Number(progress?.getAttribute('aria-valuenow')),
            total: Number(progress?.getAttribute('aria-valuemax')),
            valueText: progress?.getAttribute('aria-valuetext'),
            trackWidth,
            fillWidth,
            fillRatio: trackWidth === 0 ? 0 : fillWidth / trackWidth,
            fillTarget: fill?.style.width,
            transition: fill ? getComputedStyle(fill).transitionProperty : null,
            feedbackCount: document.querySelectorAll('[data-word-remember-feedback]').length,
            feedbackSvg: svg
                ? {
                      width: svg.getBoundingClientRect().width,
                      height: svg.getBoundingClientRect().height,
                      paths: svg.querySelectorAll('path').length,
                      pathSignals: Array.from(svg.querySelectorAll('path'))
                          .slice(0, 12)
                          .map((path) => path.getAttribute('d')?.slice(0, 65)),
                      groups: Array.from(svg.querySelectorAll('g'))
                          .slice(0, 20)
                          .map((group) => ({
                              opacity: group.getAttribute('opacity'),
                              transform: group.getAttribute('transform'),
                          })),
                  }
                : null,
            rememberDisabled: document.querySelector('button[aria-label="记住当前单词"]')?.disabled,
            rememberBusy: document
                .querySelector('button[aria-label="记住当前单词"]')
                ?.getAttribute('aria-busy'),
            completion: Boolean(document.querySelector('[data-practice-completion]')),
            completionCount:
                document.querySelector('[data-completion-count]')?.textContent.trim() ?? null,
            dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).map((dialog) =>
                dialog.textContent.slice(0, 100),
            ),
        }
    })
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
        if (await evaluate(window, operation, ...args)) return
        await delay(35)
    }
    throw new Error(
        'Remember timeout: ' + description + ' ' + JSON.stringify(await snapshot(window)),
    )
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const button = document.querySelector(target)
            if (
                !button ||
                button.disabled ||
                button.closest('[inert]') ||
                !button.getClientRects().length
            )
                throw new Error('Missing enabled remember action: ' + target)
            button.focus()
            button.click()
        },
        selector,
    )
}

async function idle(window, index, remaining, remembered) {
    await waitFor(
        window,
        (expectedIndex, expectedRemaining, expectedRemembered) => {
            const progress = document.querySelector('[data-practice-progress]')
            return (
                document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState ===
                    'idle' &&
                Number(document.querySelector('[data-practice-index]')?.dataset.practiceIndex) ===
                    expectedIndex &&
                document.querySelectorAll('[data-word-deck] [data-swap-index]').length ===
                    expectedRemaining &&
                Number(progress?.getAttribute('aria-valuenow')) === expectedRemembered &&
                !document.querySelector('[data-word-remember-feedback]')
            )
        },
        'idle queue ' + [index, remaining, remembered].join('/'),
        index,
        remaining,
        remembered,
    )
}

async function settledProgress(window, remembered) {
    await waitFor(
        window,
        (expected) => {
            const progress = document.querySelector('[data-practice-progress]')
            if (!progress) return false
            const target =
                (progress.getBoundingClientRect().width * expected) /
                Number(progress.getAttribute('aria-valuemax'))
            return (
                Number(progress.getAttribute('aria-valuenow')) === expected &&
                Math.abs(progress.firstElementChild.getBoundingClientRect().width - target) < 0.1
            )
        },
        'settled remembered progress ' + remembered,
        remembered,
    )
}

async function setMotion(window, reduced) {
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }],
    })
    await waitFor(
        window,
        (expected) => matchMedia('(prefers-reduced-motion: reduce)').matches === expected,
        'motion setting',
        reduced,
    )
    // 媒体查询值先于change监听更新；等待绘制后再操作，避免读取旧引擎的reduce状态。
    await painted(window)
}

async function painted(window) {
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    await delay(80)
}

async function capture(window, label, name, result) {
    await painted(window)
    const path = 'dist/word-remember-' + label.toLowerCase() + '-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    result.screenshots.push(path)
}

function assertTailRequeuePreview(state, expectedWords) {
    assert.equal(state.index, 0, 'last-card retry returns to the front of the remaining queue')
    assert.equal(state.stage, 'idle')
    assert.deepEqual(state.words, expectedWords)
    assert.equal(state.frontWord, expectedWords[0])
    assert.equal(state.cards.filter((card) => card.front).length, 1)
    assert.equal(state.cards.filter((card) => card.near).length, expectedWords.length > 1 ? 1 : 0)
    assert.equal(state.cards.filter((card) => card.far).length, expectedWords.length > 2 ? 1 : 0)
    for (const [index, word] of expectedWords.entries()) {
        const card = state.cards[index]
        assert.equal(card.index, index)
        assert.equal(card.word, word)
        assert.equal(card.front, index === 0)
        assert.equal(card.near, index === 1)
        assert.equal(card.far, index === 2)
        assert.equal(card.ariaHidden, String(index !== 0))
        assert.equal(card.inert, index !== 0)
        assert.ok(card.opacity > 0.99, 'front and all remaining preview cards are visibly present')
        assert.notEqual(card.visibility, 'hidden')
        assert.ok(card.width > 0 && card.height > 0)
        assert.equal(card.imageReady, true, 'remaining preview retains its real image')
    }
}

async function readProgressFrames(window) {
    return evaluate(window, () => window.__wordRememberProgressTrace?.frames ?? [])
}

async function installProgressTrace(window) {
    await evaluate(window, () => {
        const trace = { active: true, raf: 0, frames: [] }
        window.__wordRememberProgressTrace = trace
        function sample() {
            if (!trace.active) return
            const progress = document.querySelector('[data-practice-progress]')
            const track = progress?.getBoundingClientRect().width ?? 0
            const fill = progress?.firstElementChild.getBoundingClientRect().width ?? 0
            trace.frames.push({
                time: performance.now(),
                remembered: Number(progress?.getAttribute('aria-valuenow')),
                remaining: document.querySelectorAll('[data-word-deck] [data-swap-index]').length,
                fillRatio: track ? fill / track : 0,
                stage: document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState,
                feedback: Boolean(document.querySelector('[data-word-remember-feedback]')),
            })
            if (trace.frames.length > 3000) trace.frames.shift()
            trace.raf = requestAnimationFrame(sample)
        }
        sample()
    })
}

async function beginRetryMotionTrace(window) {
    await evaluate(window, () => {
        const node = document.querySelector('[data-word-deck-front]')
        const root = document.querySelector('[data-practice-index]')
        const stage = document.querySelector('[data-word-deck-stage]')
        if (!node || !root || !stage) throw new Error('Missing real card for retry motion trace')
        const readBusiness = () => ({
            index: Number(root.dataset.practiceIndex),
            words: Array.from(stage.querySelectorAll('[data-swap-index]'), (card) =>
                card.querySelector('[data-practice-english]')?.textContent.trim(),
            ),
        })
        const initial = readBusiness()
        const trace = {
            active: true,
            raf: 0,
            node,
            stage,
            frames: [],
            commits: [],
            initial,
            signature: JSON.stringify(initial),
            observer: null,
        }
        function observeBusiness() {
            const next = readBusiness()
            const signature = JSON.stringify(next)
            if (signature !== trace.signature) {
                trace.commits.push({ time: performance.now(), ...next })
                trace.signature = signature
            }
        }
        const observer = new MutationObserver(observeBusiness)
        trace.observer = observer
        observer.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['data-practice-index'],
        })
        function sample() {
            if (!trace.active) return
            observeBusiness()
            const style = getComputedStyle(node)
            const matrix = new DOMMatrixReadOnly(style.transform)
            const others = Array.from(stage.querySelectorAll('[data-swap-index]'))
                .filter(
                    (card) =>
                        card !== node &&
                        getComputedStyle(card).visibility !== 'hidden' &&
                        Number(getComputedStyle(card).opacity) > 0.99,
                )
                .map((card) => Number(getComputedStyle(card).zIndex))
            trace.frames.push({
                time: performance.now(),
                x: matrix.m41,
                y: matrix.m42,
                z: matrix.m43,
                opacity: Number(style.opacity),
                documentHeight: document.documentElement.scrollHeight,
                visibleCount: Array.from(stage.querySelectorAll('[data-swap-index]')).filter(
                    (card) =>
                        getComputedStyle(card).visibility !== 'hidden' &&
                        Number(getComputedStyle(card).opacity) > 0.001,
                ).length,
                zIndex: Number(style.zIndex),
                otherMinZ: Math.min(...others),
                otherMaxZ: Math.max(...others),
                connected: node.isConnected,
                stage: stage.dataset.wordDeckState,
                remembered: Number(
                    document
                        .querySelector('[data-practice-progress]')
                        ?.getAttribute('aria-valuenow'),
                ),
                business: readBusiness(),
            })
            trace.raf = requestAnimationFrame(sample)
        }
        window.__wordRememberRetryTrace = trace
        sample()
    })
}

async function finishRetryMotionTrace(window) {
    await evaluate(window, async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    return evaluate(window, () => {
        const trace = window.__wordRememberRetryTrace
        if (!trace) throw new Error('Retry motion trace was not installed')
        trace.active = false
        cancelAnimationFrame(trace.raf)
        trace.observer.disconnect()
        const matrix = new DOMMatrixReadOnly(getComputedStyle(trace.node).transform)
        const cards = Array.from(trace.stage.querySelectorAll('[data-swap-index]'))
        return {
            initial: trace.initial,
            frames: trace.frames,
            commits: trace.commits,
            sameNodeAtTail: cards.at(-1) === trace.node,
            final: {
                x: matrix.m41,
                y: matrix.m42,
                z: matrix.m43,
                opacity: Number(getComputedStyle(trace.node).opacity),
                visibility: getComputedStyle(trace.node).visibility,
                zIndex: Number(getComputedStyle(trace.node).zIndex),
                connected: trace.node.isConnected,
                exiting: trace.node.hasAttribute('data-card-swap-exiting'),
                word: trace.node.querySelector('[data-practice-english]')?.textContent.trim(),
            },
        }
    })
}

function assertRetryMotion(trace, expectedWords, remembered) {
    assert.ok(trace.frames.length > 5, 'normal retry exposes a continuous native DOM trajectory')
    assert.ok(
        trace.frames.every((frame) => frame.connected),
        'the same real card DOM survives down, layer change and reinsertion',
    )
    assert.equal(trace.sameNodeAtTail, true, 'the outgoing DOM becomes the actual final queue item')
    assert.equal(trace.final.connected, true)
    assert.equal(trace.final.exiting, false, 'retry settles as a real tail card instead of gone')
    assert.equal(trace.final.word, trace.initial.words[trace.initial.index])
    assert.equal(trace.final.opacity, 1, 'retried card remains visibly inserted at the back')
    assert.notEqual(trace.final.visibility, 'hidden')
    assert.ok(trace.final.z < 0, 'the returning card uses real 3D depth')
    assert.ok(
        trace.frames.every((frame) => frame.visibleCount <= 4),
        'no fifth card replenishes before the original returns',
    )
    assert.ok(
        trace.frames.every((frame) => frame.documentHeight <= 1080),
        'motion does not enlarge the reference document',
    )
    const lowered = trace.frames.findIndex(
        (frame) => frame.y > 500 && frame.zIndex < frame.otherMinZ,
    )
    assert.ok(
        lowered > 0,
        'after passing card clearance the outgoing card drops below every other card',
    )
    const down = trace.frames.slice(0, lowered + 1)
    assert.ok(
        down.some((frame) => frame.y > 500),
        'retry travels DOWN beyond the 500px reference card',
    )
    assert.ok(
        down.every((frame) => Math.abs(frame.x) < 0.5),
        'the DOWN exit keeps x near zero before tail reinsertion',
    )
    assert.ok(
        down.some((frame) => frame.y > 50 && frame.zIndex > frame.otherMaxZ),
        'the outgoing card starts in front before clearing the deck',
    )
    const returnFrames = trace.frames.slice(lowered)
    const peak = returnFrames.reduce(
        (best, frame, index) => (frame.y > returnFrames[best].y ? index : best),
        0,
    )
    const returning = returnFrames.slice(peak)
    assert.ok(
        returning.filter((frame) => frame.y > trace.final.y + 5).length >= 3,
        'the same spring provides intermediate return positions',
    )
    assert.ok(
        returning.some((frame, index) => index > 0 && frame.y < returning[index - 1].y - 0.5),
        'y decreases continuously toward the real tail slot',
    )
    for (let index = 1; index < returning.length; index += 1) {
        const before = returning[index - 1]
        const after = returning[index]
        if (after.time - before.time <= 50)
            assert.ok(
                Math.abs(after.y - before.y) < 250,
                'tail reinsertion has no one-frame vertical teleport',
            )
    }
    const initialSignature = JSON.stringify(trace.initial)
    for (const frame of trace.frames) {
        assert.equal(frame.remembered, remembered, 'retry cannot increase remembered progress')
        if (frame.y > trace.final.y + 10)
            assert.equal(
                JSON.stringify(frame.business),
                initialSignature,
                'the business queue is not reordered during down or return motion',
            )
    }
    assert.equal(
        trace.commits.length,
        1,
        'retry commits one business queue change after the spring returns',
    )
    assert.equal(trace.commits[0].index, 0)
    assert.deepEqual(trace.commits[0].words, expectedWords)
    const last = trace.frames.at(-1)
    assert.ok(
        Math.abs(last.y - trace.final.y) < 0.1,
        'the trajectory finishes at the settled tail slot',
    )
}

async function navigate(window, target, remaining, remembered) {
    let state = await snapshot(window)
    while (state.index !== target) {
        const next = state.index + (target > state.index ? 1 : -1)
        await click(window, target > state.index ? nextButton : previousButton)
        await idle(window, next, remaining, remembered)
        state = await snapshot(window)
        assert.equal(state.remembered, remembered, 'navigation cannot add remembered words')
    }
}

async function waitForFeedback(window) {
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-word-remember-feedback] svg path')),
        'real Lottie SVG frame',
    )
    const state = await snapshot(window)
    assert.equal(state.feedbackCount, 1)
    assert.equal(state.rememberBusy, 'true')
    assert.equal(state.rememberDisabled, true)
    assert.ok(state.feedbackSvg.paths > 0)
    return state
}

async function openSettings(window) {
    await click(window, '[data-practice-navigation-action="settings"]')
    await waitFor(
        window,
        () =>
            Boolean(
                document.querySelector('[role="dialog"] [role="tablist"][aria-label="设置分类"]'),
            ),
        'full settings opens',
    )
    await waitFor(
        window,
        () =>
            Array.from(document.querySelectorAll('[role="dialog"] img')).every(
                (image) => image.complete && image.naturalWidth > 0,
            ),
        'settings images settle',
    )
}

async function closeSettings(window) {
    await click(window, '[role="dialog"] button[aria-label="关闭对话框"]')
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'settings closes')
}

async function runChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const attached = window.webContents.debugger.isAttached()
    let originalStorage
    const result = {
        label,
        status: 'running',
        states: {},
        cancellations: [],
        tailRequeuePreviews: [],
        retryMotion: [],
        reducedCommits: [],
        screenshots: [],
        limitations: [
            '本地会话记住状态，不接后台、不跨刷新保存；仅PC1920自动专项，平板/H5视觉和真机待用户验收。',
        ],
    }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        if (!attached) window.webContents.debugger.attach('1.3')
        await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
            enabled: true,
        })
        window.webContents.setBackgroundThrottling(false)
        await setMotion(window, false)
        await window.loadURL(origin + '/practice/')
        originalStorage = await evaluate(
            window,
            (preferences, theme) => ({
                preferences: window.localStorage.getItem(preferences),
                theme: window.localStorage.getItem(theme),
            }),
            preferencesKey,
            themeKey,
        )
        await evaluate(
            window,
            (preferences, theme) => {
                let saved = {}
                try {
                    saved =
                        JSON.parse(window.localStorage.getItem(preferences) ?? '{}')?.values ?? {}
                } catch {}
                window.localStorage.setItem(
                    preferences,
                    JSON.stringify({
                        version: 1,
                        values: {
                            ...saved,
                            fontSize: '默认',
                            transitionSound: false,
                            typingSound: false,
                            correctSound: false,
                            errorSound: false,
                            completionSound: false,
                            correctEffect: false,
                            completionEffect: false,
                        },
                    }),
                )
                window.localStorage.setItem(theme, 'dark')
            },
            preferencesKey,
            themeKey,
        )
        await window.loadURL(origin + '/practice/?demo=word-basic&mode=pronounce')
        await waitFor(
            window,
            () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
            'practice ready',
        )
        await waitFor(
            window,
            () =>
                Array.from(document.images).every(
                    (image) => image.complete && image.naturalWidth > 0,
                ),
            'word images loaded',
        )
        await idle(window, 0, 10, 0)
        await settledProgress(window, 0)
        result.states.initial = await snapshot(window)
        const initialWords = result.states.initial.words
        assert.equal(new Set(initialWords).size, 10)
        assert.equal(result.states.initial.total, 10)
        assert.equal(result.states.initial.fillWidth, 0)
        assert.equal(result.states.initial.transition, 'width')

        // 独立交错场景：再来先移队尾，记住只移除新的当前卡；随后重新加载恢复主专项基线。
        await setMotion(window, false)
        await beginRetryMotionTrace(window)
        await click(window, '[data-word-card-actions] button[aria-label^="再来"]')
        await waitFor(
            window,
            () => {
                const trace = window.__wordRememberRetryTrace
                const frame = trace?.frames.at(-1)
                return frame?.y > 100 && frame.zIndex > 1000
            },
            'retry moves downward above the deck',
        )
        await capture(window, label, 'retry-downward', result)
        await waitFor(
            window,
            () => {
                const frame = window.__wordRememberRetryTrace?.frames.at(-1)
                return frame?.y > 50 && frame.zIndex < frame.otherMinZ
            },
            'retry returns from below behind the deck',
        )
        await capture(window, label, 'retry-tail-reinsertion', result)
        await waitFor(
            window,
            (word) =>
                document
                    .querySelector('[data-word-deck-front] [data-practice-english]')
                    ?.textContent.trim() === word &&
                document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState === 'idle',
            'retry moves the initial word to the queue tail',
            initialWords[1],
        )
        await idle(window, 0, 10, 0)
        const firstRetryMotion = await finishRetryMotionTrace(window)
        result.retryMotion.push({ remaining: 10, trace: firstRetryMotion })
        assertRetryMotion(firstRetryMotion, [...initialWords.slice(1), initialWords[0]], 0)
        result.states.retryRequeued = await snapshot(window)
        assert.equal(result.states.retryRequeued.frontWord, initialWords[1])
        assert.equal(result.states.retryRequeued.words.at(-1), initialWords[0])
        assert.equal(result.states.retryRequeued.total, 10)
        assert.equal(result.states.retryRequeued.fillWidth, 0)
        await setMotion(window, true)
        await click(window, rememberButton)
        await idle(window, 0, 9, 1)
        await settledProgress(window, 1)
        result.states.retryThenRemember = await snapshot(window)
        assert.equal(result.states.retryThenRemember.frontWord, initialWords[2])
        assert.equal(result.states.retryThenRemember.words.at(-1), initialWords[0])
        assert.equal(result.states.retryThenRemember.words.includes(initialWords[1]), false)
        assert.equal(result.states.retryThenRemember.total, 10)
        assert.equal(result.states.retryThenRemember.remembered, 1)
        assert.equal(result.states.retryThenRemember.completion, false)
        await capture(window, label, 'retry-then-remember', result)
        await window.loadURL(origin + '/practice/?demo=word-basic&mode=pronounce')
        await waitFor(
            window,
            () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
            'reload after the independent retry-remember scenario',
        )
        await idle(window, 0, 10, 0)
        await settledProgress(window, 0)
        result.states.interleavedReset = await snapshot(window)
        assert.deepEqual(result.states.interleavedReset.words, initialWords)

        await setMotion(window, false)
        await beginRetryMotionTrace(window)
        await click(window, '[data-word-card-actions] button[aria-label^="再来"]')
        await waitFor(
            window,
            () => {
                const frame = window.__wordRememberRetryTrace?.frames.at(-1)
                return frame?.y > 50 && frame.zIndex < frame.otherMinZ
            },
            'retry reaches its returning stage before cancellation',
        )
        await openSettings(window)
        await closeSettings(window)
        await idle(window, 0, 10, 0)
        await delay(1100)
        const canceledRetry = await snapshot(window)
        const canceledRetryTrace = await finishRetryMotionTrace(window)
        assert.deepEqual(canceledRetry.words, initialWords, 'canceled return does not reorder')
        assert.equal(canceledRetry.frontWord, initialWords[0])
        assert.equal(canceledRetry.remembered, 0)
        assert.equal(canceledRetryTrace.commits.length, 0, 'canceled return cannot commit late')
        result.cancellations.push({
            kind: 'retry-tail-return-settings',
            state: canceledRetry,
            trace: canceledRetryTrace,
        })
        await setMotion(window, false)
        await installProgressTrace(window)
        await click(window, nextButton)
        await idle(window, 1, 10, 0)
        await click(window, previousButton)
        await idle(window, 0, 10, 0)
        await setMotion(window, true)
        await navigate(window, 9, 10, 0)
        await click(window, nextButton)
        await idle(window, 9, 10, 0)
        result.states.lastNext = await snapshot(window)
        assert.equal(result.states.lastNext.completion, false)
        assert.equal(result.states.lastNext.fillWidth, 0)
        await navigate(window, 0, 10, 0)
        await setMotion(window, false)

        const beforeFirstFrames = (await readProgressFrames(window)).length
        await click(window, rememberButton)
        result.states.lottieRing = await waitForFeedback(window)
        await capture(window, label, 'lottie-ring', result)
        await evaluate(window, () => {
            const button = document.querySelector('button[aria-label="记住当前单词"]')
            for (let attempt = 0; attempt < 5; attempt += 1) button.click()
        })
        assert.equal(
            (await snapshot(window)).remaining,
            10,
            'feedback does not delete the card early',
        )
        await delay(900)
        result.states.lottieTickConfetti = await snapshot(window)
        assert.equal(
            result.states.lottieTickConfetti.feedbackCount,
            1,
            'repeated clicks cannot start duplicate feedback',
        )
        assert.equal(result.states.lottieTickConfetti.remembered, 0)
        await capture(window, label, 'lottie-tick-confetti', result)
        await waitFor(
            window,
            () => {
                const progress = document.querySelector('[data-practice-progress]')
                const fill = progress?.firstElementChild.getBoundingClientRect().width ?? 0
                const width = progress?.getBoundingClientRect().width ?? 0
                return (
                    Number(progress?.getAttribute('aria-valuenow')) === 1 &&
                    fill > 0 &&
                    fill < width * 0.1 - 0.1
                )
            },
            'remember progress exposes a real intermediate width',
        )
        result.states.progressIntermediate = await snapshot(window)
        await capture(window, label, 'progress-transition', result)
        await idle(window, 0, 9, 1)
        await settledProgress(window, 1)
        result.states.firstRemembered = await snapshot(window)
        assert.equal(result.states.firstRemembered.frontWord, initialWords[1])
        assert.equal(result.states.firstRemembered.total, 10)
        assert.equal(result.states.firstRemembered.words.includes(initialWords[0]), false)
        assert.ok(result.states.firstRemembered.heading.includes('1/9'))
        await evaluate(window, () =>
            document.querySelector('[data-practice-footer-action="question.previous"]').click(),
        )
        await idle(window, 0, 9, 1)
        result.progressFrames = (await readProgressFrames(window)).slice(beforeFirstFrames)
        assert.ok(
            result.progressFrames.some((frame) => frame.fillRatio > 0 && frame.fillRatio < 0.1),
            'remembering animates progress between 0 and 10 percent',
        )
        assert.ok(
            result.progressFrames.every(
                (frame) => frame.remembered === 0 || frame.remembered === 1,
            ),
            'duplicate clicks commit one remembered word',
        )

        await setMotion(window, true)
        await navigate(window, 8, 9, 1)
        await click(window, rememberButton)
        await idle(window, 7, 8, 2)
        await settledProgress(window, 2)
        result.states.lastRememberedWithRemaining = await snapshot(window)
        assert.equal(result.states.lastRememberedWithRemaining.frontWord, initialWords[8])
        assert.equal(result.states.lastRememberedWithRemaining.completion, false)
        assert.equal(
            result.states.lastRememberedWithRemaining.words.includes(initialWords[9]),
            false,
        )
        await setMotion(window, false)

        const pauseEnabled = await evaluate(
            window,
            () =>
                document.querySelector('[data-practice-pause-enabled]')?.dataset
                    .practicePauseEnabled === 'true',
        )
        if (!pauseEnabled)
            result.limitations.push(
                '当前开发阶段统一关闭暂停；暂停取消场景不适用，继续验证设置与真实视口变化取消。',
            )
        const cancellationCases = pauseEnabled
            ? ['pause-feedback', 'settings-exit', 'resize-exit']
            : ['settings-exit', 'resize-exit']
        for (const cancellation of cancellationCases) {
            const before = await snapshot(window)
            let resized
            await click(window, rememberButton)
            if (cancellation === 'pause-feedback') {
                await waitForFeedback(window)
                await click(window, '[data-practice-navigation-action="pause"]')
                await waitFor(
                    window,
                    () => Boolean(document.querySelector('[data-practice-pause]')),
                    'pause cancels remember feedback',
                )
                await delay(2000)
                await click(window, '[data-pause-action="continue"]')
                await waitFor(
                    window,
                    () => !document.querySelector('[data-practice-pause]'),
                    'continue after cancelled feedback',
                )
            } else if (cancellation === 'settings-exit') {
                await waitFor(
                    window,
                    () =>
                        document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState ===
                        'dismiss',
                    'remember starts card exit',
                )
                result.states.beforeExitCancellation = await snapshot(window)
                await openSettings(window)
                await delay(1800)
                await closeSettings(window)
            } else {
                await waitFor(
                    window,
                    () =>
                        document.querySelector('[data-word-deck-stage]')?.dataset.wordDeckState ===
                        'dismiss',
                    'remember starts exit before a real viewport resize',
                )
                window.setContentSize(1440, 900)
                await idle(window, before.index, 8, 2)
                await delay(1000)
                resized = await snapshot(window)
                assert.deepEqual(resized.viewport, [1440, 900])
                assert.equal(resized.feedbackCount, 0)
                assert.equal(resized.remembered, before.remembered)
                assert.deepEqual(resized.words, before.words)
                await capture(window, label, 'resize-cancels-dismiss', result)
                window.setContentSize(1920, 1080)
                await waitFor(
                    window,
                    () => innerWidth === 1920 && innerHeight === 1080,
                    'restore viewport after cancelled dismissal',
                )
            }
            await idle(window, before.index, 8, 2)
            await delay(250)
            const after = await snapshot(window)
            assert.equal(
                after.frontWord,
                before.frontWord,
                'cancelled action cannot remove the old card later',
            )
            assert.deepEqual(after.words, before.words)
            assert.equal(after.remembered, before.remembered)
            assert.equal(after.feedbackCount, 0)
            assert.equal(after.completion, false)
            result.cancellations.push({
                cancellation,
                before,
                after,
                ...(resized ? { resized } : {}),
            })
        }

        await setMotion(window, true)
        for (let remembered = 3; remembered <= 10; remembered += 1) {
            let before = await snapshot(window)
            if (before.remaining === 3 || before.remaining === 2) {
                await setMotion(window, false)
                await navigate(window, before.remaining - 1, before.remaining, before.remembered)
                const lastBeforeRetry = await snapshot(window)
                await beginRetryMotionTrace(window)
                await click(window, '[data-word-card-actions] button[aria-label^="再来"]')
                await idle(window, 0, before.remaining, before.remembered)
                const tailRetryMotion = await finishRetryMotionTrace(window)
                result.retryMotion.push({ remaining: before.remaining, trace: tailRetryMotion })
                assertRetryMotion(tailRetryMotion, lastBeforeRetry.words, before.remembered)
                await painted(window)
                const early = await snapshot(window)
                const previews = {
                    remaining: before.remaining,
                    lastBeforeRetry,
                    early,
                    late: null,
                }
                result.tailRequeuePreviews.push(previews)
                assertTailRequeuePreview(early, lastBeforeRetry.words)
                assert.equal(early.remembered, before.remembered)
                await delay(1000)
                const late = await snapshot(window)
                assertTailRequeuePreview(late, lastBeforeRetry.words)
                assert.equal(late.remembered, before.remembered)
                previews.late = late
                await capture(window, label, 'tail-retry-' + before.remaining + '-previews', result)
                await setMotion(window, true)
                before = await snapshot(window)
            }
            await click(window, rememberButton)
            await evaluate(window, () => {
                const button = document.querySelector('button[aria-label="记住当前单词"]')
                if (button?.disabled) button.click()
            })
            if (remembered < 10)
                await idle(
                    window,
                    Math.min(before.index, 9 - remembered),
                    10 - remembered,
                    remembered,
                )
            else
                await waitFor(
                    window,
                    () => Boolean(document.querySelector('[data-practice-completion]')),
                    'all words remembered opens completion',
                )
            await settledProgress(window, remembered)
            await painted(window)
            const state = await snapshot(window)
            result.reducedCommits.push(state)
            assert.equal(state.remembered, remembered)
            assert.equal(state.total, 10)
            assert.equal(state.remaining, 10 - remembered)
            assert.equal(state.completion, remembered === 10)
            assert.equal(state.feedbackCount, 0)
            assert.deepEqual(
                state.words,
                before.words.filter((_, index) => index !== before.index),
                'the actual current front is the only card remembered after tail retry',
            )
            if (state.remaining > 0) {
                const front = state.cards.find((card) => card.front)
                assert.ok(front, 'remaining queue has a real front card')
                assert.equal(front.opacity, 1, 'remembered last card reveals the remaining front')
                assert.equal(front.visibility, 'visible')
                assert.ok(
                    Math.abs(front.width - 500) < 0.2,
                    'remaining front retains reference width',
                )
                assert.ok(
                    Math.abs(front.height - 500) < 0.2,
                    'remaining front retains reference height',
                )
            }
        }
        result.states.completed = await snapshot(window)
        assert.equal(result.states.completed.completionCount, '10')
        assert.equal(result.states.completed.fillRatio, 1)
        await capture(window, label, 'all-remembered', result)
        await click(window, '[data-completion-action="replay"]')
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-completion]'),
            'completion replay closes',
        )
        await idle(window, 0, 10, 0)
        await settledProgress(window, 0)
        result.states.replayed = await snapshot(window)
        assert.deepEqual(result.states.replayed.words, initialWords)
        assert.equal(result.states.replayed.frontWord, initialWords[0])
        assert.equal(result.states.replayed.total, 10)
        assert.equal(result.states.replayed.fillWidth, 0)
        await capture(window, label, 'replay-restored', result)
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failure = await snapshot(window)
            result.failureFrames = (await readProgressFrames(window)).slice(-100)
            if (await evaluate(window, () => Boolean(window.__wordRememberRetryTrace)))
                result.failureRetryMotion = await finishRetryMotionTrace(window)
            await capture(window, label, 'failure', result)
        } catch (failure) {
            result.diagnosticError = String(failure)
        }
        throw error
    } finally {
        try {
            await evaluate(
                window,
                (preferences, theme, saved) => {
                    const trace = window.__wordRememberProgressTrace
                    if (trace) {
                        trace.active = false
                        cancelAnimationFrame(trace.raf)
                    }
                    const retry = window.__wordRememberRetryTrace
                    if (retry) {
                        retry.active = false
                        cancelAnimationFrame(retry.raf)
                        retry.observer.disconnect()
                    }
                    if (!saved) return
                    if (saved.preferences === null) window.localStorage.removeItem(preferences)
                    else window.localStorage.setItem(preferences, saved.preferences)
                    if (saved.theme === null) window.localStorage.removeItem(theme)
                    else window.localStorage.setItem(theme, saved.theme)
                },
                preferencesKey,
                themeKey,
                originalStorage,
            )
        } finally {
            await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
                features: [],
            })
            await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
                enabled: false,
            })
            if (!attached && window.webContents.debugger.isAttached())
                window.webContents.debugger.detach()
            window.setContentSize(...priorSize)
            window.webContents.setZoomFactor(priorZoom)
            mkdirSync(resolve('dist'), { recursive: true })
            writeFileSync(
                resolve('dist/word-remember-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'word-remember-runtime-validation',
    runChecks,
    activateWindow: false,
    timeoutMs: 240000,
})
