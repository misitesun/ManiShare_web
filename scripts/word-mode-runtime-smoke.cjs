const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const modes = [
    ['pronounce', '单词拼读'],
    ['spell', '单词拼写'],
    ['dictate', '单词默写'],
    ['meaning', '句中练义'],
    ['typing', '指法练习'],
    ['oral', '口语评测'],
]
const coursePath = '/awakening/courses/phonetics/'

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
    throw new Error('Timed out: word mode ' + description)
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled word mode action: ' + target)
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
            const container = document.querySelector(selector)
            const element = Array.from(container?.querySelectorAll('button,a') ?? []).find(
                (candidate) => {
                    const readable = candidate.cloneNode(true)
                    readable
                        .querySelectorAll('[aria-hidden="true"], kbd')
                        .forEach((node) => node.remove())
                    return (
                        (candidate.getAttribute('aria-label')?.replace(/\s+/g, '') ===
                            label.replace(/\s+/g, '') ||
                            readable.textContent.replace(/\s+/g, '') ===
                                label.replace(/\s+/g, '')) &&
                        !candidate.disabled &&
                        !candidate.closest('[inert]') &&
                        candidate.getClientRects().length > 0
                    )
                },
            )
            if (!element) throw new Error('Missing word mode action text: ' + label)
            element.focus()
            element.click()
        },
        text,
        scope,
    )
}

async function capture(window, path) {
    // 等待字体、解码与有限主题过渡的实际合成，不等待可能无限循环的装饰动画。
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        const painted = () =>
            new Promise((resolveFrame) =>
                requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
            )
        await painted()
        const transitions = document.getAnimations().filter((animation) => {
            const pseudo = animation.effect?.pseudoElement
            return (
                pseudo?.startsWith('::view-transition') ||
                animation.animationName?.includes('view-transition')
            )
        })
        await Promise.allSettled(transitions.map((animation) => animation.finished))
        await painted()
    })
    await delay(100)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function visitCourse(window, origin) {
    await window.loadURL(origin + coursePath)
    await waitFor(
        window,
        () => Boolean(document.querySelector('button[data-word-chapter-entry]')),
        'course chapter rendered',
    )
    // SSR已有按钮；通过可逆的本地状态变化确认事件挂载，再验证模式入口。
    await waitFor(
        window,
        () => {
            const button = Array.from(document.querySelectorAll('button')).find((element) =>
                ['收藏', '已收藏'].includes(element.textContent.trim()),
            )
            if (button?.textContent.trim() === '已收藏') return true
            button?.click()
            return false
        },
        'course collection action hydrated',
    )
    await clickText(window, '已收藏')
    await waitFor(
        window,
        () =>
            Array.from(document.querySelectorAll('button')).some(
                (button) =>
                    button.textContent.trim() === '收藏' &&
                    button.getAttribute('aria-pressed') === 'false',
            ),
        'course collection restored',
    )
}

async function openCourseSelector(window) {
    await click(window, 'button[data-word-chapter-entry]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-word-mode-selector]')),
        'course selector open',
    )
    await assertSelection(window, 'pronounce')
}

async function assertSelection(window, mode) {
    await waitFor(
        window,
        (expected) => {
            const options = document.querySelectorAll('[data-word-mode-option]')
            const selected = document.querySelectorAll(
                '[data-word-mode-option][aria-pressed="true"]',
            )
            const preview = document.querySelector('[data-word-mode-preview]')
            return (
                options.length === 6 &&
                selected.length === 1 &&
                selected[0].getAttribute('data-word-mode-option') === expected &&
                preview?.complete &&
                preview.naturalWidth === 515 &&
                preview.naturalHeight === 315
            )
        },
        'selected preview ' + mode,
        mode,
    )
}

async function closeSelector(window, action) {
    if (action === 'escape') {
        await evaluate(window, () =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
        )
    } else if (action === 'cancel') {
        await clickText(window, '取消', '[role="dialog"]')
    } else {
        await click(window, 'button[aria-label="关闭模式选择"]')
    }
    await waitFor(
        window,
        () => !document.querySelector('[data-word-mode-selector]'),
        'selector closes with ' + action,
    )
}

async function measureSelector(window) {
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
            }
        }
        const body = document.querySelector('[data-word-mode-selector]')
        const options = Array.from(body.querySelectorAll('[data-word-mode-option]'))
        const start = Array.from(body.querySelectorAll('button')).find(
            (button) => button.textContent.trim() === '开始练习',
        )
        const selected = body.querySelector('[data-word-mode-option][aria-pressed="true"]')
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            frame: box(body.closest('[role="dialog"]').parentElement),
            title: box(body.querySelector('[data-word-mode-title]')),
            options: options.map((option) => ({
                mode: option.getAttribute('data-word-mode-option'),
                rect: box(option),
                thumbnail: box(option.querySelector('[data-word-mode-thumbnail]')),
            })),
            selectedLabel: box(selected.querySelector('[data-word-mode-label]') ?? selected),
            preview: box(body.querySelector('[data-word-mode-preview]')),
            start: box(start),
            startLabel: box(start.querySelector('[data-word-mode-start-label]') ?? start),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        }
    })
}

function assertReference(reference) {
    assert.deepEqual(reference.viewport, [1920, 1080])
    const { x, y, width, height } = reference.frame
    assert.deepEqual({ x, y, width, height }, { x: 550, y: 266, width: 819, height: 547 })
    assert.equal(reference.title.fontSize, '24px')
    assert.equal(reference.title.fontWeight, '500')
    assert.equal(reference.title.lineHeight, '24px')
    for (const [index, option] of reference.options.entries()) {
        assert.equal(option.rect.width, 232)
        assert.equal(option.rect.height, 62)
        assert.equal(option.thumbnail.width, 46)
        assert.equal(option.thumbnail.height, 46)
        if (index > 0) assert.equal(option.rect.y - reference.options[index - 1].rect.y - 62, 12)
    }
    assert.equal(reference.selectedLabel.fontSize, '16px')
    assert.equal(reference.selectedLabel.fontWeight, '500')
    assert.equal(reference.selectedLabel.lineHeight, '16px')
    assert.equal(reference.preview.width, 515)
    assert.equal(reference.preview.height, 315)
    assert.equal(reference.start.width, 515)
    assert.equal(reference.start.height, 48)
    assert.equal(reference.startLabel.fontSize, '18px')
    assert.equal(reference.startLabel.fontWeight, '500')
    assert.equal(reference.startLabel.lineHeight, '18px')
    assert.equal(reference.horizontalOverflow, false)
}

async function exitToCourse(window) {
    await click(window, 'button[aria-label="退出练习"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'exit confirmation',
    )
    await clickText(window, '退出', '[role="dialog"]')
    await waitFor(
        window,
        (expected) =>
            location.pathname === expected &&
            Boolean(document.querySelector('button[data-word-chapter-entry]')),
        'exit returns source course',
        coursePath,
    )
}

async function setTheme(window, origin, theme) {
    if ((await evaluate(window, () => document.documentElement.dataset.theme)) === theme) return
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
        'theme applied ' + theme,
        theme,
    )
}

async function openPracticeSelector(window, currentMode) {
    await clickText(window, '模式', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[data-word-mode-selector]')),
        'practice reuses word selector',
    )
    await assertSelection(window, currentMode)
}

async function assertPracticeRoute(window, mode) {
    await waitFor(
        window,
        (expected) => {
            const query = new URLSearchParams(location.search)
            return (
                location.pathname === '/practice/' &&
                query.get('demo') === 'word-basic' &&
                query.get('mode') === expected &&
                query.get('sourceCourse') === 'phonetics' &&
                Boolean(document.querySelector('[data-practice-header]')) &&
                !document.querySelector('[data-word-mode-selector]')
            )
        },
        'started mode ' + mode,
        mode,
    )
}

async function runWordModeChecks(window, origin, label) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const application = new URL(origin)
    const manifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const exportedFiles = new Set(manifest.files.map((path) => '/' + path))
    const exportedPages = new Set(manifest.routes)
    const session = window.webContents.session
    const businessRequests = []
    const permissionRequests = []
    let originalTheme
    const result = {
        label,
        status: 'running',
        businessRequests,
        permissionRequests,
        previews: [],
        screenshots: [],
        limitations: [
            '课程第2章只连接本地单词示例，不代表正式章节题库或会员权限接入',
            '这里只使用弹窗Escape和系统页面缩放，不实现或测试练习全局按键逻辑',
            'PC基准与重排已检查；平板/H5视觉及真机兼容仍待用户验收',
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
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await visitCourse(window, origin)
        originalTheme = await evaluate(window, () => document.documentElement.dataset.theme)
        await setTheme(window, origin, 'dark')
        await visitCourse(window, origin)
        const entries = await evaluate(window, () => {
            const buttons = document.querySelectorAll('button[data-word-chapter-entry]')
            const cards = Array.from(document.querySelectorAll('[data-awakening-chapter-card]'))
            return {
                count: buttons.length,
                chapterCount: cards.length,
                label: buttons[0]?.getAttribute('aria-label'),
                interactiveChapters: cards
                    .filter(
                        (card) =>
                            card.matches('button,a,[role="button"]') ||
                            card.querySelector('button,a,[role="button"]'),
                    )
                    .map((card) => card.getAttribute('data-chapter-number')),
            }
        })
        assert.equal(entries.count, 1)
        assert.equal(entries.chapterCount, 13)
        assert.deepEqual(
            entries.interactiveChapters,
            Array.from({ length: 13 }, (_, index) => String(index + 1)),
        )
        result.wordEntryIsUniqueAndAllThirteenLocalChaptersAreConnected = true
        await waitFor(
            window,
            () => {
                const images = Array.from(
                    document.querySelectorAll(
                        '[data-chapter-kind="picture-word"] [role="img"] img',
                    ),
                )
                return (
                    images.length === 2 &&
                    images.every((image) => image.complete && image.naturalWidth > 0)
                )
            },
            'picture word chapter badge images loaded',
        )
        const pictureWordChapter = await evaluate(window, () => {
            const card = document.querySelector('[data-chapter-kind="picture-word"]')
            const badge = card?.querySelector('[role="img"][aria-label="看图学词"]')
            return {
                number: card?.getAttribute('data-chapter-number'),
                label: badge?.getAttribute('aria-label'),
                badgeWidth: badge?.getBoundingClientRect().width,
                badgeHeight: badge?.getBoundingClientRect().height,
                images: Array.from(badge?.querySelectorAll('img') || []).map((image) => ({
                    src: image.currentSrc || image.src,
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    width: image.getBoundingClientRect().width,
                    height: image.getBoundingClientRect().height,
                })),
            }
        })
        assert.equal(pictureWordChapter.number, '13')
        assert.equal(pictureWordChapter.label, '看图学词')
        assert.equal(pictureWordChapter.badgeWidth, 45)
        assert.equal(pictureWordChapter.badgeHeight, 41)
        assert.equal(pictureWordChapter.images.length, 2)
        assert.deepEqual(
            pictureWordChapter.images.map(({ naturalWidth, naturalHeight, width, height }) => ({
                naturalWidth,
                naturalHeight,
                width,
                height,
            })),
            [
                { naturalWidth: 45, naturalHeight: 41, width: 45, height: 41 },
                { naturalWidth: 18, naturalHeight: 18, width: 18, height: 18 },
            ],
        )
        result.pictureWordChapter = pictureWordChapter
        await evaluate(window, () => {
            document.querySelector('[data-chapter-kind="picture-word"]')?.scrollIntoView({
                block: 'nearest',
            })
        })
        await capture(window, 'dist/picture-word-' + label.toLowerCase() + '-pc.png')
        await evaluate(window, () => {
            const region = document.querySelector('[aria-label="课程简介与章节列表"]')
            if (region) region.scrollTop = 0
        })
        await openCourseSelector(window)
        await capture(window, 'dist/word-mode-' + label.toLowerCase() + '-dark-pronounce-pc.png')
        result.reference = await measureSelector(window)
        assertReference(result.reference)
        const thumbnails = await evaluate(window, () =>
            Array.from(document.querySelectorAll('[data-word-mode-thumbnail]')).map((image) => ({
                src: image.currentSrc || image.src,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
            })),
        )
        assert.equal(thumbnails.length, 6)
        assert.equal(new Set(thumbnails.map((image) => image.src)).size, 6)
        for (const image of thumbnails) {
            assert.equal(image.naturalWidth, 1254)
            assert.equal(image.naturalHeight, 1254)
        }
        result.thumbnails = thumbnails
        const courseUrl = await evaluate(window, () => location.href)
        for (const action of ['cancel', 'close', 'escape']) {
            await click(window, '[data-word-mode-option="oral"]')
            await assertSelection(window, 'oral')
            await closeSelector(window, action)
            await waitFor(
                window,
                () => document.activeElement?.matches('button[data-word-chapter-entry]'),
                action + ' restores chapter focus',
            )
            assert.equal(await evaluate(window, () => location.href), courseUrl)
            await openCourseSelector(window)
        }
        result.closeCancelEscapeDiscardSelectionAndRestoreFocus = true
        for (const [mode, title] of modes) {
            await click(window, '[data-word-mode-option="' + mode + '"]')
            await assertSelection(window, mode)
            assert.equal(await evaluate(window, () => location.href), courseUrl)
            const preview = await evaluate(window, () => {
                const image = document.querySelector('[data-word-mode-preview]')
                return {
                    src: image.currentSrc || image.src,
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    caption: document
                        .querySelector('[data-word-mode-preview-caption]')
                        ?.textContent.trim(),
                }
            })
            assert.equal(preview.caption, title)
            assert.equal(
                thumbnails.some((image) => image.src === preview.src),
                false,
            )
            const path = 'dist/word-mode-' + label.toLowerCase() + '-dark-' + mode + '-pc.png'
            result.screenshots.push(await capture(window, path))
            result.previews.push({ mode, title, ...preview })
            await clickText(window, '开始练习', '[data-word-mode-selector]')
            await assertPracticeRoute(window, mode)
            await exitToCourse(window)
            await openCourseSelector(window)
        }
        assert.equal(new Set(result.previews.map((image) => image.src)).size, 6)
        result.sixModePreviewsStayLocalUntilStartAndReturnToCourse = true
        await closeSelector(window, 'cancel')
        await window.loadURL(
            origin +
                '/practice/?demo=word-basic&mode=spell&sourceCourse=phonetics&keep=word-mode-smoke',
        )
        await assertPracticeRoute(window, 'spell')
        const initialProgress = await evaluate(window, () =>
            document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow'),
        )
        await clickText(window, '下一题', '[data-practice-footer]')
        await waitFor(
            window,
            (initial) =>
                document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow') !==
                initial,
            'question advances before draft preservation',
            initialProgress,
        )
        await evaluate(window, () => {
            const input = document.querySelector('input[aria-label="练习答案"]')
            if (!input) throw new Error('Word spelling input is missing')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                'local-word-mode-typed',
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
            window.wordModeSavedInput = input
        })
        await waitFor(
            window,
            () =>
                document.querySelector('input[aria-label="练习答案"]')?.value ===
                'local-word-mode-typed',
            'word spelling input is locally editable',
        )
        const snapshot = await evaluate(window, () => ({
            search: location.search,
            value: document.querySelector('input[aria-label="练习答案"]').value,
            progress: document
                .querySelector('[data-practice-progress]')
                .getAttribute('aria-valuenow'),
        }))
        for (const action of ['cancel', 'escape']) {
            await openPracticeSelector(window, 'spell')
            await click(window, '[data-word-mode-option="dictate"]')
            await assertSelection(window, 'dictate')
            await closeSelector(window, action)
            const preserved = await evaluate(window, () => ({
                search: location.search,
                value: document.querySelector('input[aria-label="练习答案"]').value,
                progress: document
                    .querySelector('[data-practice-progress]')
                    .getAttribute('aria-valuenow'),
                sameInput:
                    document.querySelector('input[aria-label="练习答案"]') ===
                    window.wordModeSavedInput,
            }))
            assert.deepEqual(preserved, { ...snapshot, sameInput: true })
        }
        result.practiceCancelAndEscapePreserveInputProgressAndRoute = true
        await openPracticeSelector(window, 'spell')
        await clickText(window, '开始练习', '[data-word-mode-selector]')
        await assertPracticeRoute(window, 'spell')
        const sameMode = await evaluate(window, () => ({
            search: location.search,
            value: document.querySelector('input[aria-label="练习答案"]').value,
            progress: document
                .querySelector('[data-practice-progress]')
                .getAttribute('aria-valuenow'),
            sameInput:
                document.querySelector('input[aria-label="练习答案"]') ===
                window.wordModeSavedInput,
        }))
        assert.deepEqual(sameMode, { ...snapshot, sameInput: true })
        result.sameModeStartDoesNotRemountSession = true
        await openPracticeSelector(window, 'spell')
        await click(window, '[data-word-mode-option="dictate"]')
        await assertSelection(window, 'dictate')
        await clickText(window, '开始练习', '[data-word-mode-selector]')
        await assertPracticeRoute(window, 'dictate')
        await waitFor(
            window,
            () => Boolean(document.querySelector('input[aria-label="练习答案"]')),
            'new mode initializes answer input',
        )
        const changed = await evaluate(window, () => ({
            value: document.querySelector('input[aria-label="练习答案"]').value,
            progress: document
                .querySelector('[data-practice-progress]')
                .getAttribute('aria-valuenow'),
            sameInput:
                document.querySelector('input[aria-label="练习答案"]') ===
                window.wordModeSavedInput,
            source: new URLSearchParams(location.search).get('sourceCourse'),
            keep: new URLSearchParams(location.search).get('keep'),
        }))
        assert.deepEqual(changed, {
            value: '',
            progress: initialProgress,
            sameInput: false,
            source: 'phonetics',
            keep: 'word-mode-smoke',
        })
        await exitToCourse(window)
        result.changedModeClearsRoundInputAndKeepsSourceCourseAndOtherQuery = true
        await setTheme(window, origin, 'light')
        await visitCourse(window, origin)
        await openCourseSelector(window)
        const lightPath = 'dist/word-mode-' + label.toLowerCase() + '-light-pronounce-pc.png'
        result.screenshots.push(await capture(window, lightPath))
        result.lightReference = await measureSelector(window)
        assertReference(result.lightReference)
        assert.equal(result.lightReference.theme, 'light')
        result.pcReflow = []
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            await delay(75)
            const measured = await measureSelector(window)
            assert.equal(measured.horizontalOverflow, false, 'word selector overflows at ' + width)
            result.pcReflow.push({ width, measured })
        }
        window.setContentSize(1920, 1080)
        result.pageZoom = []
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            await delay(75)
            const measured = await measureSelector(window)
            assert.equal(
                measured.horizontalOverflow,
                false,
                'word selector overflows at zoom ' + factor,
            )
            result.pageZoom.push({ factor, measured })
        }
        assert.deepEqual(businessRequests, [], 'word selection sends no business requests')
        assert.deepEqual(permissionRequests, [], 'word selection requests no microphone permission')
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        throw error
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1920, 1080)
        try {
            if (originalTheme === 'dark' || originalTheme === 'light')
                await setTheme(window, origin, originalTheme)
        } finally {
            session.webRequest.onBeforeSendHeaders(null)
            session.setPermissionRequestHandler(null)
            window.webContents.setZoomFactor(priorZoom)
            window.setContentSize(...priorSize)
        }
    }
}

module.exports = { runWordModeChecks }
