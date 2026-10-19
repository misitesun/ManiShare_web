const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')

const cases = [
    ['word', 'word-basic', ['pronounce', 'spell', 'dictate', 'meaning', 'typing', 'oral']],
    [
        'sentence',
        'sentence-basic',
        ['listen', 'read', 'translate', 'check', 'typing', 'oral', 'blocks'],
    ],
    ['audio', 'audio-basic', ['listen', 'read', 'translate', 'check', 'typing', 'oral', 'blocks']],
    ['video', 'video-basic', ['listen', 'translate', 'check', 'typing', 'oral', 'blocks']],
    ['picture', 'picture-basic', ['listen', 'translate', 'typing', 'oral']],
    ['typing', 'typing-basic', ['typing']],
    ['phonetics', 'phonetics-basic', ['pronounce', 'oral']],
    ['guess', 'guess-basic', ['guess', 'read', 'spell']],
    ['audio-reader', 'audio-reader', ['read']],
    ['video-reader', 'video-reader', ['read']],
    ['picture-reader', 'picture-reader', ['read']],
    ['text-reader', 'text-reader', ['read']],
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, message, ...args) {
    for (let attempt = 0; attempt < 160; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(60)
    }
    throw new Error('Timed out: practice timer ' + message)
}

async function visit(window, origin, demo, mode, waitForResources) {
    await window.loadURL(origin + '/practice/?demo=' + demo + '&mode=' + mode)
    await waitFor(
        window,
        () => document.querySelector('main[data-toolbar-ready="true"] [role="timer"]'),
        'ready',
    )
    if (waitForResources) await waitForResources(window)
}

async function snapshot(window) {
    return evaluate(window, () => {
        const timer = document.querySelector('[data-practice-timer]')
        const session = document.querySelector('[data-practice-index]')
        const spy = window.__practiceTimerSmoke
        return {
            seconds: timer ? Number(timer.dataset.practiceElapsedSeconds) : null,
            text: timer?.textContent.trim() ?? null,
            family: timer?.dataset.practiceTimer ?? null,
            aria: timer?.getAttribute('aria-label') ?? null,
            index: session ? Number(session.dataset.practiceIndex) : null,
            activeTasks: spy?.active.size ?? null,
            clearCalls: spy?.clearCalls ?? null,
        }
    })
}

async function waitTick(window, after) {
    await waitFor(
        window,
        (seconds) => {
            const timer = document.querySelector('[data-practice-timer]')
            return timer && Number(timer.dataset.practiceElapsedSeconds) > seconds
        },
        'real elapsed time increases',
        after,
    )
    return snapshot(window)
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const node = document.querySelector(target)
            if (!node || node.closest('[inert]') || node.matches(':disabled'))
                throw new Error('Unavailable: ' + target)
            node.click()
        },
        selector,
    )
}

async function clickDialogText(window, text) {
    await evaluate(
        window,
        (label) => {
            const button = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
                (node) => !node.closest('[inert]') && node.textContent.trim() === label,
            )
            if (!button) throw new Error('Missing dialog action: ' + label)
            button.click()
        },
        text,
    )
}

async function waitDialog(window, title) {
    await waitFor(
        window,
        (text) =>
            Array.from(document.querySelectorAll('[role="dialog"]')).some(
                (node) => !node.closest('[inert]') && node.textContent.includes(text),
            ),
        'dialog ' + title,
        title,
    )
}

async function waitUnblocked(window) {
    await waitFor(
        window,
        () => {
            const timer = document.querySelector('[data-practice-timer]')
            return Boolean(
                timer &&
                !timer.closest('[inert]') &&
                window.__practiceTimerSmoke?.active.size === 1,
            )
        },
        'resume scope and refresh task',
    )
}

async function installTaskSpy(window) {
    await evaluate(window, () => {
        const originalSet = window.setInterval.bind(window)
        const originalClear = window.clearInterval.bind(window)
        const spy = { active: new Map(), retired: [], clearCalls: 0 }
        spy.restore = () => {
            window.setInterval = originalSet
            window.clearInterval = originalClear
        }
        window.__practiceTimerSmoke = spy
        window.setInterval = (callback, milliseconds, ...args) => {
            const id = originalSet(callback, milliseconds, ...args)
            if (milliseconds === 250 && typeof callback === 'function') spy.active.set(id, callback)
            return id
        }
        window.clearInterval = (id) => {
            spy.clearCalls += 1
            const callback = spy.active.get(id)
            if (callback) spy.retired.push(callback)
            spy.active.delete(id)
            originalClear(id)
        }
    })
}

async function checkLifecycle(window, origin, waitForResources, result) {
    await visit(window, origin, 'word-basic', 'pronounce', waitForResources)
    await installTaskSpy(window)
    await waitTick(window, 1)
    await click(window, '[data-practice-navigation-action="settings"]')
    await waitDialog(window, '设置')
    await waitFor(
        window,
        () => window.__practiceTimerSmoke.active.size === 0,
        'settings clears task',
    )
    const paused = await snapshot(window)
    await delay(1350)
    const frozen = await snapshot(window)
    assert.equal(frozen.seconds, paused.seconds, 'settings freezes real time')
    assert.equal(frozen.activeTasks, 0, 'settings clears refresh task')
    assert.ok(frozen.clearCalls > 0)
    result.interactions.push({ kind: 'settings-blocks', paused, frozen })

    await click(window, 'button[aria-label="关闭对话框"]')
    await waitUnblocked(window)
    const resumed = await waitTick(window, paused.seconds)
    assert.equal(resumed.activeTasks, 1, 'resume schedules exactly one task')
    result.interactions.push({ kind: 'resume', state: resumed })

    await click(window, '[data-practice-footer-action="question.next"]')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
        'next question',
    )
    const next = await snapshot(window)
    assert.ok(next.seconds >= resumed.seconds, 'switch question preserves total elapsed')
    assert.equal(next.activeTasks, 1)
    result.interactions.push({ kind: 'question-preserves-time', state: next })

    await click(window, '[data-practice-navigation-action="reset"]')
    await waitDialog(window, '重置')
    await clickDialogText(window, '确认重置')
    await waitUnblocked(window)
    const reset = await snapshot(window)
    assert.equal(reset.seconds, 0)
    assert.equal(reset.index, 0)
    assert.equal(reset.activeTasks, 1)
    result.interactions.push({ kind: 'reset', state: reset })
    await waitTick(window, 0)

    await click(window, '[data-practice-footer-action="question.next"]')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
        'before completion',
    )
    await click(window, '[data-practice-footer-action="question.next"]')
    await waitDialog(window, '完成练习')
    const completed = await snapshot(window)
    await delay(1250)
    assert.equal((await snapshot(window)).seconds, completed.seconds)
    assert.equal(completed.activeTasks, 0)
    result.interactions.push({ kind: 'completion-stops-time', state: completed })

    await click(window, '[data-completion-action="replay"]')
    await waitUnblocked(window)
    const replayed = await snapshot(window)
    assert.equal(replayed.seconds, 0)
    assert.equal(replayed.activeTasks, 1)
    result.interactions.push({ kind: 'replay', state: replayed })

    await waitTick(window, 0)
    await click(window, '[data-practice-footer-action="question.next"]')
    await waitFor(
        window,
        () => document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '1',
        'before exit completion',
    )
    await click(window, '[data-practice-footer-action="question.next"]')
    await waitDialog(window, '完成练习')
    await click(window, '[data-completion-action="return"]')
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-practice-timer]') &&
            document.querySelector('main section button'),
        'leave session',
    )
    await waitFor(
        window,
        () => window.__practiceTimerSmoke.active.size === 0,
        'exit clears refresh task',
    )
    const exited = await snapshot(window)
    assert.equal(exited.activeTasks, 0, 'leaving route disposes timer task')
    const retired = await evaluate(window, () => {
        const spy = window.__practiceTimerSmoke
        for (const callback of spy.retired) callback()
        return {
            callbacks: spy.retired.length,
            activeTasks: spy.active.size,
            timer: Boolean(document.querySelector('[data-practice-timer]')),
        }
    })
    assert.ok(retired.callbacks > 0)
    assert.deepEqual(
        { activeTasks: retired.activeTasks, timer: retired.timer },
        { activeTasks: 0, timer: false },
    )
    result.interactions.push({ kind: 'exit-cleans-and-stale-callbacks', exited, retired })

    await click(window, 'main section button')
    await waitFor(window, () => document.querySelector('[data-practice-timer]'), 'reenter')
    const reentered = await snapshot(window)
    assert.equal(reentered.seconds, 0)
    assert.equal(reentered.activeTasks, 1)
    result.interactions.push({ kind: 'reenter-from-zero', state: reentered })
    await waitTick(window, 0)
    // 原生History更新让Next卸载仍在计时的会话，不先打开会暂停计时的退出确认。
    await evaluate(window, () => window.history.replaceState(null, '', '/practice/'))
    await waitFor(
        window,
        () =>
            !document.querySelector('[data-practice-timer]') &&
            document.querySelector('main section button') &&
            window.__practiceTimerSmoke.active.size === 0,
        'active navigation unmount clears task',
    )
    const activeExit = await snapshot(window)
    assert.equal(activeExit.activeTasks, 0)
    result.interactions.push({ kind: 'active-session-unmount-cleans', state: activeExit })
}

async function runPracticeTimerChecks(window, origin, label, waitForResources, options = {}) {
    const result = {
        label,
        status: 'running',
        modes: [],
        interactions: [],
        screenshots: [],
        consoleErrors: [],
        businessRequests: [],
        permissionRequests: [],
    }
    const onConsole = (event) => {
        if (event.level === 'error' || event.level === 'warning')
            result.consoleErrors.push(event.message)
    }
    window.webContents.on('console-message', onConsole)
    const session = window.webContents.session
    session.setPermissionRequestHandler((_contents, permission, callback) => {
        result.permissionRequests.push(permission)
        callback(false)
    })
    session.webRequest.onBeforeSendHeaders((details, callback) => {
        const url = new URL(details.url)
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(origin).origin)
        )
            result.businessRequests.push({ url: details.url, method: details.method })
        callback({ requestHeaders: details.requestHeaders })
    })
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        for (const [family, demo, modes] of options.lifecycleOnly ? [] : cases) {
            for (const mode of modes) {
                await visit(window, origin, demo, mode, waitForResources)
                const initial = await snapshot(window)
                assert.equal(initial.family, family)
                assert.match(initial.text, /^\d{2,}:\d{2}:\d{2}$/)
                assert.match(initial.aria, /^练习用时：/)
                const ticking = await waitTick(window, initial.seconds)
                const [hours, minutes, seconds] = ticking.text.split(':').map(Number)
                assert.equal(hours * 3600 + minutes * 60 + seconds, ticking.seconds)
                result.modes.push({ family, mode, initial, ticking })
            }
            console.log(label + ' timer modes checked: ' + result.modes.length)
        }
        if (!options.lifecycleOnly) assert.equal(result.modes.length, 40)
        await checkLifecycle(window, origin, waitForResources, result)
        await visit(window, origin, 'word-basic', 'pronounce', waitForResources)
        await waitTick(window, 0)
        if (waitForResources) await waitForResources(window)
        const screenshot = resolve('dist', 'practice-timer-' + label.toLowerCase() + '.png')
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(screenshot, (await window.webContents.capturePage()).toPNG())
        result.screenshots.push(screenshot)
        assert.deepEqual(result.consoleErrors, [])
        assert.deepEqual(result.businessRequests, [])
        assert.deepEqual(result.permissionRequests, [])
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.stack : String(error)
        throw error
    } finally {
        await evaluate(window, () => {
            window.__practiceTimerSmoke?.restore()
            delete window.__practiceTimerSmoke
        })
        window.webContents.removeListener('console-message', onConsole)
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(
            resolve('dist', 'practice-timer-' + label.toLowerCase() + '-validation.json'),
            JSON.stringify(result, null, 4),
        )
    }
}

module.exports = { runPracticeTimerChecks }
