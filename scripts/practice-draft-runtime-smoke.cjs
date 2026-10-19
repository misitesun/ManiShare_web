const assert = require('node:assert/strict')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { isAbsolute, resolve } = require('node:path')
const { pathToFileURL } = require('node:url')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const panelSelector = '[data-practice-draft-panel]'
const editorSelector = panelSelector + ' textarea[aria-label="章节草稿"]'
const coursePath = '/awakening/courses/phonetics/'

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(75)
    }
    const state = await evaluate(window, () => ({
        href: location.href,
        panel: document.querySelector('[data-practice-draft-panel]')?.outerHTML.slice(0, 2000),
        phase: document.querySelector('[data-practice-phase]')?.dataset.practicePhase,
        index: document.querySelector('[data-practice-index]')?.dataset.practiceIndex,
        draftValue: document.querySelector('[data-practice-draft-panel] textarea')?.value,
        active: document.activeElement?.outerHTML.slice(0, 300),
    }))
    throw new Error('Timed out: practice draft ' + description + ' ' + JSON.stringify(state))
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled draft action: ' + target)
            element.focus()
            element.click()
        },
        selector,
    )
}

async function clickText(window, text, scope = panelSelector) {
    await evaluate(
        window,
        (label, target) => {
            const container = document.querySelector(target)
            const element = Array.from(container?.querySelectorAll('button,a') ?? []).find(
                (button) => {
                    const copy = button.cloneNode(true)
                    copy.querySelectorAll('[aria-hidden="true"],kbd').forEach((node) =>
                        node.remove(),
                    )
                    return (
                        [button.getAttribute('aria-label'), copy.textContent].some(
                            (value) => value?.replace(/\s+/g, '') === label.replace(/\s+/g, ''),
                        ) &&
                        !button.matches(':disabled') &&
                        !button.closest('[inert]')
                    )
                },
            )
            if (!element) throw new Error('Missing draft action text: ' + label)
            element.focus()
            element.click()
        },
        text,
        scope,
    )
}

async function settle(window) {
    await waitFor(
        window,
        () =>
            document.readyState === 'complete' &&
            Array.from(document.images).every(
                (image) =>
                    image.complete && image.naturalWidth > 0 && image.currentSrc === image.src,
            ),
        'current document images finish',
    )
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
        await Promise.allSettled(
            document
                .getAnimations()
                .filter((animation) => {
                    const timing = animation.effect?.getComputedTiming()
                    return (
                        timing &&
                        Number.isFinite(timing.endTime) &&
                        animation.playState !== 'finished'
                    )
                })
                .map((animation) => animation.finished),
        )
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    })
    // GSAP 的有限滑入不出现在 document.getAnimations()；等待实际平移归零再读几何。
    await waitFor(
        window,
        () => {
            const panel = document.querySelector('[data-practice-draft-panel]')
            if (!panel) return true
            const transform = getComputedStyle(panel).transform
            if (transform === 'none') return true
            const matrix = new DOMMatrixReadOnly(transform)
            return Math.abs(matrix.m41) < 0.01 && Math.abs(matrix.m42) < 0.01
        },
        'finite draft slide finishes before geometry and capture',
    )
}

async function capture(window, path) {
    await settle(window)
    await delay(100)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function visitPractice(window, origin, query) {
    await settle(window)
    await window.loadURL(origin + '/practice/?' + query)
    await waitFor(
        window,
        () => Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice hydration',
    )
    await settle(window)
}

async function openDraft(window) {
    await click(window, '[data-practice-navigation-action="draft"]')
    await waitFor(
        window,
        () =>
            Boolean(
                document.querySelector(
                    '[data-practice-draft-panel] textarea[aria-label="章节草稿"]',
                ),
            ),
        'chapter draft opens',
    )
    await settle(window)
}

async function closeDraft(window) {
    await click(window, panelSelector + ' button[aria-label="关闭草稿纸"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-draft-panel]'),
        'draft closes',
    )
}

async function fillDraft(window, value) {
    await evaluate(
        window,
        (text) => {
            const textarea = document.querySelector(
                '[data-practice-draft-panel] textarea[aria-label="章节草稿"]',
            )
            if (!textarea) throw new Error('Chapter draft textarea missing')
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(
                textarea,
                text,
            )
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        },
        value,
    )
    await waitFor(
        window,
        (text) => document.querySelector('[data-practice-draft-panel] textarea')?.value === text,
        'draft value updates',
        value,
    )
}

async function readDraft(window) {
    return evaluate(window, () => {
        const panel = document.querySelector('[data-practice-draft-panel]')
        return {
            scope: panel?.getAttribute('data-draft-scope'),
            value: panel?.querySelector('textarea[aria-label="章节草稿"]')?.value,
        }
    })
}

async function questionState(window) {
    return evaluate(window, () => {
        const session = document.querySelector('[data-practice-phase]')
        return {
            href: location.href,
            phase: session?.getAttribute('data-practice-phase'),
            index: session?.getAttribute('data-practice-index'),
            oralStage: session?.getAttribute('data-practice-oral-stage'),
            progress: document
                .querySelector('[data-practice-progress]')
                ?.getAttribute('aria-valuenow'),
        }
    })
}

async function measure(window) {
    await settle(window)
    return evaluate(window, () => {
        function box(element) {
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
                cursor: style.cursor,
            }
        }
        const panel = document.querySelector('[data-practice-draft-panel]')
        const handle = panel?.querySelector('[data-practice-draft-handle]')
        const buttons = Array.from(panel?.querySelectorAll('button') ?? [])
        const title = panel?.querySelector('h2,h3,[data-practice-draft-title]')
        const textarea = panel?.querySelector('textarea[aria-label="章节草稿"]')
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            panel: box(panel),
            handle: box(handle),
            title: box(title),
            textarea: box(textarea),
            clear: box(buttons.find((button) => button.textContent.trim() === '清空')),
            save: box(buttons.find((button) => button.textContent.trim() === '保存')),
            close: box(panel?.querySelector('button[aria-label="关闭草稿纸"]')),
            modal: panel?.getAttribute('aria-modal'),
            role: panel?.getAttribute('role'),
            inert: Boolean(panel?.closest('[inert]')),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        }
    })
}

function near(actual, expected, description, tolerance = 0.05) {
    assert.ok(
        Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
        description + ': expected ' + expected + ', got ' + actual,
    )
}

function assertReference(snapshot) {
    assert.deepEqual(snapshot.viewport, [1920, 1080])
    near(snapshot.panel.x, 1515.19, 'draft body left')
    near(snapshot.panel.y, 198, 'draft body top')
    near(snapshot.panel.width, 374, 'draft body width')
    near(snapshot.panel.height, 703, 'draft body height')
    near(snapshot.handle.y + snapshot.handle.height, 252.22, 'draft header separator')
    assert.equal(snapshot.title.fontSize, '20px')
    assert.equal(snapshot.textarea.fontSize, '14px')
    for (const [key, x, width] of [
        ['clear', 1531.8, 153],
        ['save', 1718.8, 154],
    ]) {
        near(snapshot[key].x, x, key + ' left')
        near(snapshot[key].y, 841, key + ' top')
        near(snapshot[key].width, width, key + ' width')
        near(snapshot[key].height, 41, key + ' height')
        assert.equal(snapshot[key].fontSize, '18px')
        assert.equal(snapshot[key].cursor, 'pointer')
    }
    assert.equal(snapshot.role, 'dialog')
    assert.equal(snapshot.modal, 'false')
    assert.equal(snapshot.inert, false)
    assert.equal(snapshot.horizontalOverflow, false)
}

function assertInViewport(snapshot, description) {
    const [width, height] = snapshot.viewport
    assert.ok(
        snapshot.panel.x >= -0.1 && snapshot.panel.y >= -0.1,
        description + ' top/left remain reachable',
    )
    assert.ok(
        snapshot.panel.x + snapshot.panel.width <= width + 0.1,
        description + ' right remains reachable',
    )
    assert.ok(
        snapshot.panel.y + snapshot.panel.height <= height + 0.1,
        description + ' bottom remains reachable',
    )
    assert.equal(
        snapshot.horizontalOverflow,
        false,
        description + ' no document horizontal overflow',
    )
    for (const control of ['clear', 'save', 'close']) {
        assert.ok(
            snapshot[control].x >= -0.1 &&
                snapshot[control].x + snapshot[control].width <= width + 0.1,
            description + ' ' + control + ' horizontal reachability',
        )
        assert.ok(
            snapshot[control].y >= -0.1 &&
                snapshot[control].y + snapshot[control].height <= height + 0.1,
            description + ' ' + control + ' vertical reachability',
        )
    }
}

async function sendKey(window, keyCode, character) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode })
    if (character) window.webContents.sendInputEvent({ type: 'char', keyCode: character })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode })
    await delay(50)
}

async function drag(window, deltaX, deltaY) {
    const point = await evaluate(window, () => {
        const rect = document.querySelector('[data-practice-draft-handle]').getBoundingClientRect()
        return { x: Math.round(rect.x + 60), y: Math.round(rect.y + 20) }
    })
    window.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y })
    window.webContents.sendInputEvent({
        type: 'mouseDown',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
    })
    window.webContents.sendInputEvent({
        type: 'mouseMove',
        x: point.x + deltaX,
        y: point.y + deltaY,
        button: 'left',
    })
    window.webContents.sendInputEvent({
        type: 'mouseUp',
        x: point.x + deltaX,
        y: point.y + deltaY,
        button: 'left',
        clickCount: 1,
    })
    await delay(75)
    return measure(window)
}

async function setTheme(window, origin, theme) {
    if ((await evaluate(window, () => document.documentElement.dataset.theme)) === theme) return
    await settle(window)
    await window.loadURL(origin + '/settings/?tab=appearance')
    const label = theme === 'dark' ? '夜间模式' : '白天模式'
    await waitFor(
        window,
        (name) => {
            const input = document.querySelector('input[aria-label="' + name + '"]')
            return (
                input !== null &&
                !input.matches(':disabled') &&
                document.body.textContent.includes('本机设置已就绪')
            )
        },
        'theme ready',
        label,
    )
    await click(window, 'input[aria-label="' + label + '"]')
    await waitFor(
        window,
        (expected) => document.documentElement.dataset.theme === expected,
        'theme applied',
        theme,
    )
    await settle(window)
}

async function visitCourse(window, origin) {
    await settle(window)
    await window.loadURL(origin + coursePath)
    await waitFor(
        window,
        () => document.querySelectorAll('[data-practice-chapter-entry]').length === 13,
        'course renders',
    )
    // 课程卡存在于SSR；可逆局部收藏变化证明事件挂载，不重试待验收导航。
    await waitFor(
        window,
        () => {
            const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
                ['收藏', '已收藏'].includes(candidate.textContent.trim()),
            )
            if (button?.getAttribute('aria-pressed') === 'true') return true
            button?.click()
            return false
        },
        'course hydrates',
    )
    await clickText(window, '已收藏', 'body')
    await waitFor(
        window,
        () =>
            Array.from(document.querySelectorAll('button')).some(
                (button) =>
                    button.textContent.trim() === '收藏' &&
                    button.getAttribute('aria-pressed') === 'false',
            ),
        'course probe restores collection',
    )
    await settle(window)
}

async function enterChapter(window, chapter) {
    await click(window, '[data-chapter-number="' + chapter + '"] [data-practice-chapter-entry]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-mode-selector="sentence"]')),
        'sentence chapter selection',
    )
    await settle(window)
    await clickText(window, '开始练习', '[data-practice-mode-selector]')
    await waitFor(
        window,
        (expected) => {
            const query = new URLSearchParams(location.search)
            return (
                query.get('demo') === 'sentence-basic' &&
                query.get('sourceCourse') === 'phonetics' &&
                query.get('sourceChapter') === 'chapter-' + expected &&
                Boolean(document.querySelector('main[data-toolbar-ready="true"]'))
            )
        },
        'chapter source navigation',
        chapter,
    )
    await settle(window)
}

async function exitToCourse(window) {
    if (
        await evaluate(window, () => Boolean(document.querySelector('[data-practice-draft-panel]')))
    )
        await closeDraft(window)
    await click(window, '[aria-label="退出练习"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
        'exit confirmation',
    )
    await clickText(window, '退出', '[role="dialog"][aria-modal="true"]')
    await waitFor(
        window,
        (path) =>
            location.pathname === path &&
            document.querySelectorAll('[data-practice-chapter-entry]').length === 13,
        'returns to source course',
        coursePath,
    )
    await settle(window)
}

async function switchSentenceMode(window, mode) {
    await click(window, '[data-practice-navigation-action="mode"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-practice-mode-selector="sentence"]')),
        'practice mode selector',
    )
    await click(window, '[data-practice-mode-option="' + mode + '"]')
    await clickText(window, '开始练习', '[data-practice-mode-selector]')
    await waitFor(
        window,
        (expected) =>
            new URLSearchParams(location.search).get('mode') === expected &&
            !document.querySelector('[data-practice-mode-selector]') &&
            Boolean(document.querySelector('main[data-toolbar-ready="true"]')),
        'practice mode changes',
        mode,
    )
    await settle(window)
}

async function checkMediaContinuity(window, origin) {
    await visitPractice(
        window,
        origin,
        'demo=audio-reader&mode=read&sourceCourse=phonetics&sourceChapter=chapter-11',
    )
    await waitFor(
        window,
        () => {
            const media = document.querySelector('audio')
            return media !== null && media.readyState >= 2 && media.duration > 0
        },
        'technical audio ready',
    )
    await evaluate(window, () => {
        const media = document.querySelector('audio')
        // 仅测试夹具循环，避免2秒样例自然结束被误判为浮窗暂停；不改生产播放设置。
        media.loop = true
        media.muted = true
        window.draftMediaReference = media
        window.draftMediaPauseCount = 0
        window.draftMediaPauseListener = () => {
            window.draftMediaPauseCount += 1
        }
        media.addEventListener('pause', window.draftMediaPauseListener)
        const play = Array.from(media.closest('section').querySelectorAll('button')).find(
            (button) => button.textContent.trim() === '播放',
        )
        if (!play || play.matches(':disabled')) throw new Error('Audio play control is not ready')
        play.click()
    })
    await waitFor(
        window,
        () =>
            !document.querySelector('audio').paused &&
            document.querySelector('audio').currentTime > 0,
        'actual technical audio plays',
    )
    const before = await evaluate(window, () => ({
        position: document.querySelector('audio').currentTime,
        pauseCount: window.draftMediaPauseCount,
    }))
    await openDraft(window)
    await fillDraft(window, '播放期间编辑草稿')
    await delay(150)
    const open = await evaluate(window, () => ({
        sameMedia: document.querySelector('audio') === window.draftMediaReference,
        paused: document.querySelector('audio').paused,
        position: document.querySelector('audio').currentTime,
        pauseCount: window.draftMediaPauseCount,
    }))
    assert.equal(open.sameMedia, true)
    assert.equal(open.paused, false)
    assert.notEqual(open.position, before.position)
    assert.equal(open.pauseCount, before.pauseCount)
    await closeDraft(window)
    const closed = await evaluate(window, () => ({
        paused: document.querySelector('audio').paused,
        pauseCount: window.draftMediaPauseCount,
    }))
    assert.equal(closed.paused, false)
    assert.equal(closed.pauseCount, before.pauseCount)
    await evaluate(window, () => {
        const media = window.draftMediaReference
        media.removeEventListener('pause', window.draftMediaPauseListener)
        media.pause()
        media.loop = false
        delete window.draftMediaReference
        delete window.draftMediaPauseListener
        delete window.draftMediaPauseCount
    })
    return {
        before,
        open,
        closed,
        draftOpenEditAndCloseDoNotPauseOrRemountMedia: true,
        fixture: '同源2秒技术音频；测试夹具loop/muted只用于消除自然结束干扰，不是课程音频兼容验收',
    }
}

async function runPracticeDraftChecks(window, origin, label) {
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
        limitations: [
            '草稿仅本次练习内存，退出练习或刷新后不恢复，不是后端保存',
            'PC几何、真实缩放和鼠标拖动不替代平板/H5触摸、软键盘及真机验收',
            '音频为同源技术片段；未使用真实课程媒体、录音或评分服务',
        ],
    }
    let originalTheme
    const onConsole = (event) => {
        if (event.level === 'warning' || event.level === 'error')
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
        await setTheme(window, origin, 'dark')
        await visitCourse(window, origin)
        await enterChapter(window, '1')
        const beforeOpen = await evaluate(window, () => ({
            bodyOverflow: document.body.style.overflow,
            htmlOverflow: document.documentElement.style.overflow,
            computedBodyOverflow: getComputedStyle(document.body).overflow,
            computedHtmlOverflow: getComputedStyle(document.documentElement).overflow,
            inertCount: document.querySelectorAll('[inert]').length,
        }))
        await openDraft(window)
        const dark = await measure(window)
        assertReference(dark)
        const afterOpen = await evaluate(window, () => ({
            bodyOverflow: document.body.style.overflow,
            htmlOverflow: document.documentElement.style.overflow,
            computedBodyOverflow: getComputedStyle(document.body).overflow,
            computedHtmlOverflow: getComputedStyle(document.documentElement).overflow,
            inertCount: document.querySelectorAll('[inert]').length,
        }))
        assert.deepEqual(
            afterOpen,
            beforeOpen,
            'nonmodal draft does not add inert or lock body/html scrolling',
        )
        await fillDraft(window, '第1章草稿：跨题和切换小模式继续保留。')
        const chapterOne = await readDraft(window)
        assert.ok(typeof chapterOne.scope === 'string' && chapterOne.scope.length > 0)
        const darkScreenshot = await capture(
            window,
            'dist/practice-draft-' + label.toLowerCase() + '-dark-pc.png',
        )
        result.themes.push({ theme: 'dark', measured: dark, screenshot: darkScreenshot })
        const firstQuestion = await questionState(window)
        assert.equal(
            await evaluate(window, () => {
                const button = document.querySelector(
                    '[data-practice-footer-action="question.next"]',
                )
                const rect = button.getBoundingClientRect()
                const hit = document.elementFromPoint(
                    rect.x + rect.width / 2,
                    rect.y + rect.height / 2,
                )
                return hit?.closest('button') === button
            }),
            true,
            'draft adds no hit-testing backdrop over the exercise action',
        )
        await click(window, '[data-practice-footer-action="question.next"]')
        await waitFor(
            window,
            (previous) =>
                document.querySelector('[data-practice-index]')?.dataset.practiceIndex !== previous,
            'background next question is operable while draft remains open',
            firstQuestion.index,
        )
        assert.deepEqual(await readDraft(window), chapterOne)
        result.nonmodalBackgroundQuestionNavigationKeepsChapterDraft = true
        await closeDraft(window)
        await openDraft(window)
        assert.deepEqual(await readDraft(window), chapterOne)
        result.closeAndReopenKeepsDraft = true
        await closeDraft(window)
        await switchSentenceMode(window, 'translate')
        await openDraft(window)
        assert.deepEqual(await readDraft(window), chapterOne)
        const editorBefore = await questionState(window)
        await click(window, editorSelector)
        await evaluate(window, () => {
            const editor = document.querySelector('[data-practice-draft-panel] textarea')
            editor.setSelectionRange(editor.value.length, editor.value.length)
        })
        await sendKey(window, 'Return', '\r')
        await sendKey(window, 'Space', ' ')
        await sendKey(window, 'V', 'v')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[data-practice-draft-panel] textarea')
                    ?.value.includes('\n') &&
                document
                    .querySelector('[data-practice-draft-panel] textarea')
                    ?.value.endsWith(' v'),
            'editor accepts Enter Space V as text',
        )
        assert.deepEqual(
            await questionState(window),
            editorBefore,
            'draft editing keys do not reveal, advance or open oral assessment',
        )
        result.editorEnterSpaceVAreLocalAndDoNotTriggerPracticeCommands = true
        await clickText(window, '清空')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-draft-panel] textarea')?.value === '' &&
                /清空/.test(
                    document.querySelector('[data-practice-draft-panel] [role="status"]')
                        ?.textContent ?? '',
                ),
            'clear empties draft and reports local feedback',
        )
        await fillDraft(window, '保存仅在本章当前内存中确认。')
        await clickText(window, '保存')
        await waitFor(
            window,
            () =>
                Boolean(document.querySelector('[data-practice-draft-panel]')) &&
                /保存/.test(
                    document.querySelector('[data-practice-draft-panel] [role="status"]')
                        ?.textContent ?? '',
                ),
            'save confirms in place without closing',
        )
        result.clearAndSaveFeedbackAreLocalAndSaveDoesNotClose = true
        await evaluate(window, () => {
            const controls = Array.from(
                document
                    .querySelector('[data-practice-draft-panel]')
                    .querySelectorAll('button,textarea,input,select,a[href],[tabindex]'),
            ).filter(
                (element) =>
                    !element.matches(':disabled') &&
                    element.tabIndex >= 0 &&
                    element.getClientRects().length > 0,
            )
            controls[controls.length - 1].focus()
        })
        await sendKey(window, 'Tab')
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-practice-draft-panel]')
                    .contains(document.activeElement),
            ),
            false,
            'nonmodal draft does not trap Tab from its last action',
        )
        // 非本窗Escape仍交给练习自身：应打开原暂停窗，草稿不能抢先关闭或吞事件。
        await evaluate(window, () =>
            document.querySelector('[data-practice-navigation-action="draft"]').focus(),
        )
        await sendKey(window, 'Escape')
        await waitFor(
            window,
            () =>
                Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')) &&
                Boolean(document.querySelector('[data-practice-draft-panel]')),
            'outside Escape reaches practice while retaining draft',
        )
        await click(window, '[data-pause-action="close"]')
        await waitFor(
            window,
            () =>
                !document.querySelector('[role="dialog"][aria-modal="true"]') &&
                !document.querySelector('[data-practice-draft-panel]')?.closest('[inert]'),
            'pause closes',
        )
        await click(window, editorSelector)
        await sendKey(window, 'Escape')
        await waitFor(
            window,
            () => !document.querySelector('[data-practice-draft-panel]'),
            'inside Escape closes only the draft',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
            ),
            false,
        )
        result.escapeIsScopedToDraftFocusAndDoesNotCaptureOutsideEvents = true
        await openDraft(window)
        const initialPosition = await measure(window)
        const moved = await drag(window, -300, 40)
        near(moved.panel.x, initialPosition.panel.x - 300, 'drag moves draft horizontally', 1)
        near(moved.panel.y, initialPosition.panel.y + 40, 'drag moves draft vertically', 1)
        const topLeft = await drag(window, -3000, -3000)
        assertInViewport(topLeft, 'drag past top-left')
        const bottomRight = await drag(window, 3000, 3000)
        assertInViewport(bottomRight, 'drag past bottom-right')
        result.drag = { initialPosition, moved, topLeft, bottomRight }
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            const measured = await measure(window)
            assertInViewport(measured, 'PC width ' + width)
            result.pcReflow.push({ width, measured })
        }
        window.setContentSize(1920, 1080)
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            const measured = await measure(window)
            assertInViewport(measured, 'real PC zoom ' + factor)
            result.pageZoom.push({ factor, measured })
        }
        window.webContents.setZoomFactor(1)
        await fillDraft(window, '第1章隔离草稿')
        await exitToCourse(window)
        await enterChapter(window, '4')
        await openDraft(window)
        const chapterFour = await readDraft(window)
        assert.notEqual(
            chapterFour.scope,
            chapterOne.scope,
            'same-demo sentence chapters have distinct draft scopes',
        )
        assert.equal(
            chapterFour.value,
            '',
            'different chapter does not inherit another chapter draft',
        )
        result.chapterScopes = {
            chapterOne,
            chapterFour,
            doesNotPromiseDraftRestorationAfterLeavingPractice: true,
        }
        await fillDraft(window, '刷新后必须清空的本章草稿')
        const beforeRefresh = await readDraft(window)
        await settle(window)
        window.webContents.reload()
        await waitFor(
            window,
            () =>
                Boolean(document.querySelector('main[data-toolbar-ready="true"]')) &&
                !document.querySelector('[data-practice-draft-panel]'),
            'refresh creates a fresh practice',
        )
        await settle(window)
        await openDraft(window)
        const refreshed = await readDraft(window)
        assert.equal(refreshed.scope, beforeRefresh.scope)
        assert.equal(refreshed.value, '')
        result.refreshClearsDraftWithoutLosingChapterScope = true
        await closeDraft(window)
        result.media = await checkMediaContinuity(window, origin)
        await setTheme(window, origin, 'light')
        await visitPractice(
            window,
            origin,
            'demo=sentence-basic&mode=listen&sourceCourse=phonetics&sourceChapter=chapter-1',
        )
        await openDraft(window)
        await fillDraft(window, '浅色主题章节草稿。')
        const light = await measure(window)
        assertReference(light)
        assert.equal(light.theme, 'light')
        result.themes.push({
            theme: 'light',
            measured: light,
            screenshot: await capture(
                window,
                'dist/practice-draft-' + label.toLowerCase() + '-light-pc.png',
            ),
        })
        await closeDraft(window)
        assert.deepEqual(
            result.businessRequests,
            [],
            'chapter draft sends no business or upload request',
        )
        assert.deepEqual(
            result.permissionRequests,
            [],
            'chapter draft requests no microphone or system permission',
        )
        assert.deepEqual(
            result.consoleErrors,
            [],
            'chapter draft has no hydration/CSP/runtime warning or error',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        try {
            result.failureScreenshot = await capture(
                window,
                'dist/practice-draft-' + label.toLowerCase() + '-failure.png',
            )
        } catch (diagnosticError) {
            result.diagnosticError = String(diagnosticError)
        }
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            await evaluate(window, () => {
                const media = window.draftMediaReference
                if (media) {
                    media.removeEventListener('pause', window.draftMediaPauseListener)
                    media.pause()
                    media.loop = false
                }
                delete window.draftMediaReference
                delete window.draftMediaPauseListener
                delete window.draftMediaPauseCount
            })
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            window.webContents.removeListener('console-message', onConsole)
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
            writeFileSync(
                resolve('dist/practice-draft-' + label.toLowerCase() + '-validation.json'),
                JSON.stringify(result, null, 4),
            )
        }
    }
}

module.exports = { runPracticeDraftChecks }

function describeStandaloneError(error) {
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

/** 使用真实生产host/protocol/preload；外部runner提供预览服务和独立profile。 */
async function runStandaloneDraftSmoke() {
    const { app, BrowserWindow } = require('electron')
    const projectRoot = resolve(__dirname, '..')
    const reportPath = resolve(projectRoot, 'dist/practice-draft-runtime-validation.json')
    const report = {
        environment: 'production',
        electron: process.versions.electron,
        status: 'running',
        practiceDraft: [],
        consoleErrors: [],
        networkFailures: [],
        host: {},
    }
    const observedSessions = new Set()
    const observedWindows = new Map()
    const consoleListeners = new Map()
    let finished = false
    let deadline
    function saveReport() {
        mkdirSync(resolve(projectRoot, 'dist'), { recursive: true })
        writeFileSync(reportPath, JSON.stringify(report, null, 4))
    }
    function finish(error) {
        if (finished) return
        finished = true
        clearTimeout(deadline)
        report.status = error === undefined ? 'passed' : 'failed'
        if (error !== undefined) report.error = describeStandaloneError(error)
        saveReport()
        for (const [contents, listener] of consoleListeners) {
            if (!contents.isDestroyed()) contents.removeListener('console-message', listener)
        }
        for (const observed of observedSessions) {
            observed.webRequest.onCompleted(null)
            observed.webRequest.onErrorOccurred(null)
        }
        process.removeListener('uncaughtException', failUnhandled)
        process.removeListener('unhandledRejection', failUnhandled)
        if (error !== undefined) console.error('Practice draft standalone failed:', error)
        else console.log('Practice draft standalone passed: Electron and Web')
        app.exit(error === undefined ? 0 : 1)
    }
    function failUnhandled(error) {
        finish(error)
    }
    function observe(window, label) {
        observedWindows.set(window.webContents.id, label)
        const onConsole = (event) => {
            if (event.level === 'warning' || event.level === 'error')
                report.consoleErrors.push({ label, message: event.message })
        }
        consoleListeners.set(window.webContents, onConsole)
        window.webContents.on('console-message', onConsole)
        const observed = window.webContents.session
        if (observedSessions.has(observed)) return
        observedSessions.add(observed)
        observed.webRequest.onCompleted((details) => {
            if (details.statusCode >= 400)
                report.networkFailures.push({
                    label: observedWindows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    status: details.statusCode,
                    resourceType: details.resourceType,
                })
        })
        observed.webRequest.onErrorOccurred((details) => {
            if (details.error !== 'net::ERR_ABORTED')
                report.networkFailures.push({
                    label: observedWindows.get(details.webContentsId) ?? 'unattributed',
                    url: details.url,
                    error: details.error,
                    resourceType: details.resourceType,
                })
        })
    }
    async function runEnvironment(window, origin, label) {
        const position = report.practiceDraft.length
        report.practiceDraft.push({ label, status: 'running' })
        console.log('Practice draft ' + label + ' start')
        try {
            report.practiceDraft[position] = await runPracticeDraftChecks(window, origin, label)
            console.log('Practice draft ' + label + ' complete')
        } catch (error) {
            report.practiceDraft[position] = {
                label,
                status: 'failed',
                error: describeStandaloneError(error),
                detailReport: 'dist/practice-draft-' + label.toLowerCase() + '-validation.json',
            }
            throw error
        }
    }
    try {
        if (process.env.DESKTOP_SMOKE !== '1')
            throw new Error('Standalone draft smoke requires DESKTOP_SMOKE=1')
        const profile = process.env.DESKTOP_SMOKE_USER_DATA
        if (!profile || !isAbsolute(profile))
            throw new Error('Standalone draft smoke requires an absolute DESKTOP_SMOKE_USER_DATA')
        if (resolve(profile) === resolve(app.getPath('userData')))
            throw new Error('Draft smoke profile must differ from the normal Electron userData')
        if (process.env.DESKTOP_RENDERER_URL !== undefined)
            throw new Error('Standalone draft smoke must load production englishlearning protocol')
        const webOrigin = process.env.SMOKE_WEB_ORIGIN
        if (!webOrigin) throw new Error('Standalone draft smoke requires SMOKE_WEB_ORIGIN')
        const preview = new URL(webOrigin)
        if (
            !['http:', 'https:'].includes(preview.protocol) ||
            preview.pathname !== '/' ||
            preview.search ||
            preview.hash
        )
            throw new Error('SMOKE_WEB_ORIGIN must be an HTTP(S) origin without path or query')
        process.chdir(projectRoot)
        app.setAppPath(projectRoot)
        app.setPath('userData', profile)
        process.on('uncaughtException', failUnhandled)
        process.on('unhandledRejection', failUnhandled)
        deadline = setTimeout(() => {
            finish(new Error('Standalone practice draft smoke exceeded its 240 second deadline'))
        }, 240000)
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
            if (production) break
            await delay(75)
        }
        assert.ok(production, 'real application host creates its production window')
        for (let attempt = 0; attempt < 100 && production.webContents.isLoading(); attempt++)
            await delay(75)
        assert.equal(
            production.webContents.isLoading(),
            false,
            'initial real-host navigation completes',
        )
        await waitFor(
            production,
            () => document.readyState === 'complete' && document.body.textContent.trim().length > 0,
            'initial real host document completes',
        )
        await settle(production)
        production.webContents.setBackgroundThrottling(false)
        const preferences = production.webContents.getLastWebPreferences()
        assert.equal(preferences.sandbox, true)
        assert.equal(preferences.contextIsolation, true)
        assert.equal(preferences.nodeIntegration, false)
        assert.equal(
            await evaluate(production, () => window.learningDesktop.getAppVersion()),
            app.getVersion(),
            'real preload and IPC respond',
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
        await waitFor(
            browser,
            () =>
                document.readyState === 'complete' && document.body.textContent.includes('练习页'),
            'Web practice document loads',
        )
        await settle(browser)
        await runEnvironment(browser, preview.origin, 'Web')
        assert.deepEqual(
            report.networkFailures,
            [],
            'standalone draft has zero unexpected resource failures',
        )
        assert.deepEqual(
            report.consoleErrors,
            [],
            'standalone draft has zero hydration/CSP/runtime warnings or errors',
        )
        finish()
    } catch (error) {
        finish(error)
    }
}

const isStandaloneDraftEntry =
    require.main === module ||
    (process.type === 'browser' &&
        process.argv.slice(1).some((argument) => resolve(argument) === __filename))
if (isStandaloneDraftEntry) void runStandaloneDraftSmoke()
