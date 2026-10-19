const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

const coursePath = '/awakening/courses/phonetics/'
const selectors = '[data-practice-mode-selector]'
const families = [
    {
        family: 'sentence',
        chapter: '1',
        duplicateChapter: '4',
        demo: 'sentence-basic',
        modes: ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral'],
        frame: { x: 550, y: 229, width: 819, height: 621 },
        gap: 12,
        captionTop: 366,
    },
    {
        family: 'audio',
        chapter: '3',
        demo: 'audio-basic',
        modes: ['listen', 'read', 'check', 'translate', 'blocks', 'typing', 'oral'],
        frame: { x: 550, y: 229, width: 819, height: 621 },
        gap: 12,
        captionTop: 370,
    },
    {
        family: 'video',
        chapter: '5',
        demo: 'video-basic',
        modes: ['listen', 'check', 'translate', 'blocks', 'typing', 'oral'],
        frame: { x: 551, y: 267, width: 819, height: 547 },
        gap: 12,
        captionTop: 366,
    },
    {
        family: 'guess',
        chapter: '9',
        demo: 'guess-basic',
        modes: ['guess', 'read', 'spell'],
        frame: { x: 551, y: 267, width: 819, height: 547 },
        gap: 12,
        captionTop: 366,
    },
    {
        family: 'picture',
        chapter: '13',
        demo: 'picture-basic',
        modes: ['listen', 'translate', 'typing', 'oral'],
        frame: { x: 551, y: 230, width: 820, height: 536 },
        gap: 13,
        captionTop: 366,
    },
]
const directChapters = [
    ['6', 'typing-basic', 'typing'],
    ['7', 'phonetics-basic', 'pronounce'],
    ['8', 'picture-reader', 'read'],
    ['10', 'video-reader', 'read'],
    ['11', 'audio-reader', 'read'],
    ['12', 'text-reader', 'read'],
]
// Figma 原始 imageRef 文件尺寸；515×315 仅是设计稿中的 CSS 预览槽。
const previewSizes = {
    listen: [1604, 981],
    read: [1603, 981],
    check: [1604, 981],
    translate: [1603, 981],
    blocks: [1604, 981],
    typing: [1603, 981],
    oral: [1604, 981],
}

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
    const state = await evaluate(window, () => ({
        href: location.href,
        header: Boolean(document.querySelector('[data-practice-header]')),
        selector: document
            .querySelector('[data-practice-mode-selector]')
            ?.getAttribute('data-practice-mode-selector'),
        alert: document.querySelector('[role="alert"]')?.textContent,
    }))
    throw new Error('Timed out: practice modes ' + description + ' ' + JSON.stringify(state))
}

async function click(window, selector) {
    await evaluate(
        window,
        (target) => {
            const element = document.querySelector(target)
            if (!element || element.matches(':disabled') || element.closest('[inert]'))
                throw new Error('Missing enabled practice modes action: ' + target)
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
                        .querySelectorAll('[aria-hidden="true"],kbd')
                        .forEach((node) => node.remove())
                    return (
                        [candidate.getAttribute('aria-label'), readable.textContent].some(
                            (value) =>
                                value !== null &&
                                value.replace(/\s+/g, '') === label.replace(/\s+/g, ''),
                        ) &&
                        !candidate.disabled &&
                        !candidate.closest('[inert]') &&
                        candidate.getClientRects().length > 0
                    )
                },
            )
            if (!element) throw new Error('Missing practice modes action text: ' + label)
            element.focus()
            element.click()
        },
        text,
        scope,
    )
}

async function stabilize(window) {
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
}

async function capture(window, path) {
    await stabilize(window)
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function visitCourse(window, origin) {
    await window.loadURL(origin + coursePath)
    await waitFor(
        window,
        () => document.querySelectorAll('button[data-practice-chapter-entry]').length === 13,
        'all course chapters render',
    )
    // 章节按钮存在于SSR HTML，不能据此认定React事件已经挂载。
    // 用可逆的本地收藏动作确认水合完成，不重试待验收的导航动作。
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
        'course collection action hydrates',
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
        'course hydration probe restores collection',
    )
}

async function assertSelection(window, configuration, mode) {
    await waitFor(
        window,
        (family, expected, expectedModes, previewSize, thumbnailSize) => {
            const selector = document.querySelector('[data-practice-mode-selector]')
            const options = Array.from(
                selector?.querySelectorAll('[data-practice-mode-option]') ?? [],
            )
            const selected = options.filter(
                (option) => option.getAttribute('aria-pressed') === 'true',
            )
            const preview = selector?.querySelector('[data-practice-mode-preview]')
            return (
                selector?.getAttribute('data-practice-mode-selector') === family &&
                selector.getAttribute('data-practice-mode-selected') === expected &&
                options
                    .map((option) => option.getAttribute('data-practice-mode-option'))
                    .join(',') === expectedModes.join(',') &&
                selected.length === 1 &&
                selected[0].getAttribute('data-practice-mode-option') === expected &&
                preview?.complete &&
                preview.naturalWidth === previewSize[0] &&
                preview.naturalHeight === previewSize[1] &&
                options.every((option) => {
                    const thumbnail = option.querySelector('[data-practice-mode-thumbnail]')
                    return (
                        thumbnail?.complete &&
                        thumbnail.naturalWidth === thumbnailSize &&
                        thumbnail.naturalHeight === thumbnailSize
                    )
                })
            )
        },
        configuration.family + ' selected preview ' + mode,
        configuration.family,
        mode,
        configuration.modes,
        configuration.family === 'guess' ? [1672, 941] : previewSizes[mode],
        configuration.family === 'guess' ? 1672 : 1254,
    )
}

async function openCourseSelector(window, configuration, chapter = configuration.chapter) {
    await click(
        window,
        '[data-chapter-number="' + chapter + '"] button[data-practice-chapter-entry]',
    )
    await assertSelection(window, configuration, configuration.modes[0])
}

async function closeSelector(window, action) {
    if (action === 'escape') {
        await evaluate(window, () =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
        )
    } else if (action === 'cancel') await clickText(window, '取消', selectors)
    else await click(window, 'button[aria-label="关闭模式选择"]')
    await waitFor(
        window,
        () => !document.querySelector('[data-practice-mode-selector]'),
        'selector closes with ' + action,
    )
}

async function assertPracticeRoute(window, demo, mode) {
    await waitFor(
        window,
        (expectedDemo, expectedMode) => {
            const query = new URLSearchParams(location.search)
            return (
                location.pathname === '/practice/' &&
                query.get('demo') === expectedDemo &&
                query.get('mode') === expectedMode &&
                query.get('sourceCourse') === 'phonetics' &&
                Boolean(document.querySelector('[data-practice-header]')) &&
                !document.querySelector('[data-practice-mode-selector]')
            )
        },
        'started ' + demo + '/' + mode,
        demo,
        mode,
    )
}

async function exitToCourse(window) {
    await click(window, 'button[aria-label="退出练习"]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'exit confirmation',
    )
    await click(window, '[data-exit-action="course"]')
    await waitFor(
        window,
        (expected) =>
            location.pathname === expected &&
            document.querySelectorAll('button[data-practice-chapter-entry]').length === 13,
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

async function measureSelector(window) {
    await stabilize(window)
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
                letterSpacing: style.letterSpacing,
            }
        }
        const body = document.querySelector('[data-practice-mode-selector]')
        const options = Array.from(body.querySelectorAll('[data-practice-mode-option]'))
        const buttons = Array.from(body.querySelectorAll('button'))
        const start = buttons.find((button) => button.textContent.trim() === '开始练习')
        const cancel = buttons.find((button) => button.textContent.trim() === '取消')
        const selected = body.querySelector('[data-practice-mode-option][aria-pressed="true"]')
        const dialog = body.closest('[role="dialog"]')
        const frame = dialog.parentElement
        const viewportOverflow = frame.getBoundingClientRect().width > innerWidth
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            frame: box(frame),
            title: box(body.querySelector('[data-practice-mode-title]')),
            options: options.map((option) => ({
                mode: option.getAttribute('data-practice-mode-option'),
                rect: box(option),
                thumbnail: box(option.querySelector('[data-practice-mode-thumbnail]')),
                label: box(option.querySelector('[data-practice-mode-label]')),
            })),
            selectedLabel: box(selected.querySelector('[data-practice-mode-label]')),
            preview: box(body.querySelector('[data-practice-mode-preview]')),
            caption: box(body.querySelector('[data-practice-mode-preview-caption]')),
            start: box(start),
            startLabel: box(start.querySelector('[data-practice-mode-start-label]') ?? start),
            cancel: box(cancel.parentElement),
            cancelLabel: box(cancel),
            horizontalOverflow:
                document.documentElement.scrollWidth > innerWidth || viewportOverflow,
            internalHorizontalOverflow: dialog.scrollWidth > dialog.clientWidth,
            scrollHeight: dialog.scrollHeight,
            clientHeight: dialog.clientHeight,
        }
    })
}

function assertBox(actual, expected, description) {
    assert.ok(actual, description + ' exists')
    for (const [property, value] of Object.entries(expected))
        assert.equal(actual[property], value, description + ' ' + property)
}

function assertReference(reference, configuration) {
    const { frame } = configuration
    assert.deepEqual(reference.viewport, [1920, 1080])
    assertBox(reference.frame, frame, configuration.family + ' frame')
    assertBox(
        reference.title,
        {
            x: frame.x + 24,
            y: frame.y + 24,
            fontSize: '24px',
            lineHeight: '24px',
            fontWeight: '500',
        },
        configuration.family + ' title',
    )
    assert.equal(
        reference.title.letterSpacing === 'normal' ? 0 : parseFloat(reference.title.letterSpacing),
        0,
        configuration.family + ' title has no added letter spacing',
    )
    for (const [index, option] of reference.options.entries()) {
        assertBox(
            option.rect,
            {
                x: frame.x + 24,
                y: frame.y + 85 + index * (62 + configuration.gap),
                width: 232,
                height: 62,
            },
            configuration.family + ' option ' + option.mode,
        )
        assertBox(option.thumbnail, { width: 46, height: 46 }, configuration.family + ' thumbnail')
        assertBox(
            option.label,
            { fontSize: '16px', lineHeight: '16px' },
            configuration.family + ' option label',
        )
    }
    assertBox(
        reference.selectedLabel,
        { fontWeight: '500' },
        configuration.family + ' selected label',
    )
    assertBox(
        reference.preview,
        {
            x: frame.x + 280,
            y: frame.y + 83,
            width: 515,
            height: 315,
        },
        configuration.family + ' preview',
    )
    assertBox(
        reference.start,
        {
            x: frame.x + 280,
            y: frame.y + 418,
            width: 515,
            height: 48,
        },
        configuration.family + ' start',
    )
    assertBox(
        reference.startLabel,
        {
            fontSize: '18px',
            lineHeight: '18px',
            fontWeight: '500',
        },
        configuration.family + ' start label',
    )
    assertBox(
        reference.caption,
        {
            y: frame.y + configuration.captionTop,
            fontSize: '16px',
            lineHeight: '16px',
            fontWeight: '400',
        },
        configuration.family + ' caption',
    )
    assertBox(reference.cancel, { y: frame.y + 486, height: 25 }, configuration.family + ' cancel')
    assertBox(
        reference.cancelLabel,
        { fontSize: '18px', lineHeight: '18px', fontWeight: '400' },
        configuration.family + ' cancel label',
    )
    assert.equal(reference.horizontalOverflow, false)
    assert.equal(reference.internalHorizontalOverflow, false)
}

async function previewDetails(window) {
    return evaluate(window, () => {
        const body = document.querySelector('[data-practice-mode-selector]')
        const image = body.querySelector('[data-practice-mode-preview]')
        return {
            src: image.currentSrc || image.src,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            caption: body.querySelector('[data-practice-mode-preview-caption]').textContent.trim(),
            selectedLabel: body
                .querySelector('[aria-pressed="true"] [data-practice-mode-label]')
                .textContent.trim(),
            thumbnails: Array.from(body.querySelectorAll('[data-practice-mode-thumbnail]')).map(
                (thumbnail) => ({
                    src: thumbnail.currentSrc || thumbnail.src,
                    naturalWidth: thumbnail.naturalWidth,
                    naturalHeight: thumbnail.naturalHeight,
                }),
            ),
        }
    })
}

async function runFamilyChecks(window, origin, label, configuration, screenshots) {
    await visitCourse(window, origin)
    await openCourseSelector(window, configuration)
    const reference = await measureSelector(window)
    assertReference(reference, configuration)
    const courseUrl = await evaluate(window, () => location.href)
    const lastMode = configuration.modes[configuration.modes.length - 1]
    for (const action of ['cancel', 'close', 'escape']) {
        await click(window, '[data-practice-mode-option="' + lastMode + '"]')
        await assertSelection(window, configuration, lastMode)
        await closeSelector(window, action)
        assert.equal(await evaluate(window, () => location.href), courseUrl)
        await waitFor(
            window,
            (chapter) =>
                document.activeElement?.matches(
                    '[data-chapter-number="' + chapter + '"] button[data-practice-chapter-entry]',
                ),
            configuration.family + ' ' + action + ' restores chapter focus',
            configuration.chapter,
        )
        await openCourseSelector(window, configuration)
    }
    const previews = []
    for (const mode of configuration.modes) {
        await click(window, '[data-practice-mode-option="' + mode + '"]')
        await assertSelection(window, configuration, mode)
        assert.equal(await evaluate(window, () => location.href), courseUrl)
        const preview = await previewDetails(window)
        assert.equal(preview.caption, preview.selectedLabel)
        assert.equal(
            new Set(preview.thumbnails.map((image) => image.src)).size,
            configuration.modes.length,
        )
        assert.equal(
            preview.thumbnails.some((image) => image.src === preview.src),
            false,
        )
        previews.push({ mode, ...preview })
        if (mode === configuration.modes[0] || mode === lastMode)
            screenshots.push(
                await capture(
                    window,
                    'dist/practice-mode-' +
                        label.toLowerCase() +
                        '-' +
                        configuration.family +
                        '-dark-' +
                        mode +
                        '-pc.png',
                ),
            )
        await clickText(window, '开始练习', selectors)
        await assertPracticeRoute(window, configuration.demo, mode)
        await exitToCourse(window)
        await openCourseSelector(window, configuration)
    }
    assert.equal(new Set(previews.map((preview) => preview.src)).size, configuration.modes.length)
    await closeSelector(window, 'cancel')
    if (configuration.duplicateChapter) {
        await openCourseSelector(window, configuration, configuration.duplicateChapter)
        await clickText(window, '开始练习', selectors)
        await assertPracticeRoute(window, configuration.demo, configuration.modes[0])
        await exitToCourse(window)
    }
    return {
        family: configuration.family,
        chapter: configuration.chapter,
        reference,
        previews,
        duplicateChapter: configuration.duplicateChapter,
        closeCancelEscapeDiscardSelectionAndRestoreFocus: true,
        everyModePreviewsLocallyAndStartsOnlyOnConfirmation: true,
    }
}

async function openPracticeSelector(window, configuration, mode) {
    await clickText(window, '模式', '[data-practice-header]')
    await assertSelection(window, configuration, mode)
}

async function readSession(window) {
    return evaluate(window, () => ({
        search: location.search,
        value: document.querySelector('input[aria-label="练习答案"]')?.value ?? null,
        progress: document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow'),
        sameInput:
            document.querySelector('input[aria-label="练习答案"]') ===
            window.practiceModesSavedInput,
        sameSession:
            document.querySelector('[data-practice-header]') === window.practiceModesSavedHeader,
        phase: document.querySelector('[data-practice-phase]').getAttribute('data-practice-phase'),
        answerVisible: ['revealed', 'correct'].includes(
            document.querySelector('[data-practice-phase]').getAttribute('data-practice-phase'),
        ),
    }))
}

async function runSessionPreservation(window, origin, configuration) {
    const currentMode = configuration.family === 'guess' ? 'spell' : 'translate'
    await window.loadURL(
        origin +
            '/practice/?demo=' +
            configuration.demo +
            '&mode=' +
            currentMode +
            '&sourceCourse=phonetics&keep=practice-modes-smoke',
    )
    await assertPracticeRoute(window, configuration.demo, currentMode)
    const initialProgress = await evaluate(window, () =>
        document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow'),
    )
    await clickText(window, '下一题', '[data-practice-footer]')
    await waitFor(
        window,
        (initial) =>
            document.querySelector('[data-practice-progress]').getAttribute('aria-valuenow') !==
            initial,
        'question advances before session check',
        initialProgress,
    )
    await waitFor(
        window,
        () => Boolean(document.querySelector('input[aria-label="练习答案"]')),
        'editable input',
    )
    await evaluate(window, () => {
        const input = document.querySelector('input[aria-label="练习答案"]')
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
            input,
            'local-practice-modes-typed',
        )
        input.dispatchEvent(new Event('input', { bubbles: true }))
        window.practiceModesSavedInput = input
        window.practiceModesSavedHeader = document.querySelector('[data-practice-header]')
    })
    await waitFor(
        window,
        () =>
            document.querySelector('input[aria-label="练习答案"]')?.value ===
            'local-practice-modes-typed',
        'input value updates',
    )
    const snapshot = await readSession(window)
    for (const action of ['cancel', 'close', 'escape']) {
        await openPracticeSelector(window, configuration, currentMode)
        await click(window, '[data-practice-mode-option="' + configuration.modes[0] + '"]')
        await closeSelector(window, action)
        assert.deepEqual(await readSession(window), snapshot)
    }
    await openPracticeSelector(window, configuration, currentMode)
    await clickText(window, '开始练习', selectors)
    await assertPracticeRoute(window, configuration.demo, currentMode)
    assert.deepEqual(await readSession(window), snapshot)
    // 非公开题态由组件夹具和状态单测覆盖；模式窗只验证真实可达的会话状态。

    await openPracticeSelector(window, configuration, currentMode)
    await click(window, '[data-practice-mode-option="' + configuration.modes[0] + '"]')
    await clickText(window, '开始练习', selectors)
    await assertPracticeRoute(window, configuration.demo, configuration.modes[0])
    const changed = await readSession(window)
    assert.equal(changed.sameSession, false)
    assert.equal(changed.sameInput, false)
    assert.equal(changed.answerVisible, false)
    assert.equal(changed.progress, initialProgress)
    assert.ok(changed.value === null || changed.value === '')
    const query = new URLSearchParams(changed.search)
    assert.equal(query.get('keep'), 'practice-modes-smoke')
    assert.equal(query.get('sourceCourse'), 'phonetics')
    await exitToCourse(window)
    return {
        family: configuration.family,
        currentMode,
        canceledInputPhaseProgressAndQueryPreserved: true,
        sameModeDoesNotRemount: true,
        changedModeResetsSessionAndPreservesSourceAndOtherQuery: true,
    }
}

async function assertReflow(window, configuration) {
    const widths = []
    for (const width of [1280, 1440, 2560]) {
        window.setContentSize(width, 900)
        const measured = await measureSelector(window)
        assert.equal(
            measured.horizontalOverflow,
            false,
            configuration.family + ' overflows at ' + width,
        )
        assert.equal(measured.internalHorizontalOverflow, false)
        widths.push({ width, measured })
    }
    window.setContentSize(1920, 1080)
    const zoom = []
    for (const factor of [1.25, 1.5, 2]) {
        window.webContents.setZoomFactor(factor)
        const measured = await measureSelector(window)
        assert.equal(
            measured.horizontalOverflow,
            false,
            configuration.family + ' overflows at zoom ' + factor,
        )
        assert.equal(measured.internalHorizontalOverflow, false)
        const reachable = await evaluate(window, () => {
            const body = document.querySelector('[data-practice-mode-selector]')
            const cancel = Array.from(body.querySelectorAll('button')).find(
                (button) => button.textContent.trim() === '取消',
            )
            cancel.scrollIntoView({ block: 'nearest' })
            cancel.focus()
            const rect = cancel.getBoundingClientRect()
            return (
                document.activeElement === cancel &&
                rect.top >= 0 &&
                rect.bottom <= innerHeight &&
                rect.left >= 0 &&
                rect.right <= innerWidth
            )
        })
        assert.equal(
            reachable,
            true,
            configuration.family + ' cancel remains reachable at zoom ' + factor,
        )
        zoom.push({ factor, measured })
    }
    window.webContents.setZoomFactor(1)
    return { family: configuration.family, widths, zoom }
}

async function runPracticeModesChecks(window, origin, label) {
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
        families: [],
        directChapters: [],
        sessionPreservation: [],
        lightReferences: [],
        pcReflow: [],
        screenshots: [],
        limitations: [
            '13章只连接本地示例，VIP标识不代表真实会员校验或后台题库',
            '本helper的弹窗Escape仅验证基础关闭与会话保留；练习按键绑定、作用域与题态动作由新增专项另测',
            '精确几何和页面缩放仅覆盖PC；平板/H5视觉和真机兼容待用户验收',
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
        const entries = await evaluate(window, () => {
            const cards = Array.from(document.querySelectorAll('[data-awakening-chapter-card]'))
            return cards.map((card) => ({
                chapter: card.getAttribute('data-chapter-number'),
                entries: card.querySelectorAll('button[data-practice-chapter-entry]').length,
                enabled: !card.querySelector('button[data-practice-chapter-entry]')?.disabled,
                vip: Boolean(
                    card.querySelector('[aria-label="VIP章节标识仅作展示，本地演示可体验"]'),
                ),
            }))
        })
        assert.deepEqual(
            entries.map(({ chapter, entries: count, enabled }) => ({ chapter, count, enabled })),
            Array.from({ length: 13 }, (_, index) => ({
                chapter: String(index + 1),
                count: 1,
                enabled: true,
            })),
        )
        assert.deepEqual(
            entries.filter((entry) => entry.vip).map((entry) => entry.chapter),
            Array.from({ length: 11 }, (_, index) => String(index + 3)),
            'VIP badges remain visible while local chapter entries are enabled',
        )
        result.chapterEntries = entries
        await setTheme(window, origin, 'dark')
        for (const configuration of families)
            result.families.push(
                await runFamilyChecks(window, origin, label, configuration, result.screenshots),
            )
        for (const [chapter, demo, mode] of directChapters) {
            await visitCourse(window, origin)
            await click(
                window,
                '[data-chapter-number="' + chapter + '"] button[data-practice-chapter-entry]',
            )
            await assertPracticeRoute(window, demo, mode)
            await exitToCourse(window)
            result.directChapters.push({
                chapter,
                demo,
                mode,
                opensWithoutSelector: true,
                returnsToSourceCourse: true,
            })
        }
        for (const configuration of families)
            result.sessionPreservation.push(
                await runSessionPreservation(window, origin, configuration),
            )
        await setTheme(window, origin, 'light')
        for (const configuration of families) {
            await visitCourse(window, origin)
            await openCourseSelector(window, configuration)
            const reference = await measureSelector(window)
            assertReference(reference, configuration)
            assert.equal(reference.theme, 'light')
            result.lightReferences.push({ family: configuration.family, reference })
            for (const mode of [
                configuration.modes[0],
                configuration.modes[configuration.modes.length - 1],
            ]) {
                await click(window, '[data-practice-mode-option="' + mode + '"]')
                await assertSelection(window, configuration, mode)
                result.screenshots.push(
                    await capture(
                        window,
                        'dist/practice-mode-' +
                            label.toLowerCase() +
                            '-' +
                            configuration.family +
                            '-light-' +
                            mode +
                            '-pc.png',
                    ),
                )
            }
            if (configuration.family === 'sentence' || configuration.family === 'picture')
                result.pcReflow.push(await assertReflow(window, configuration))
            await closeSelector(window, 'cancel')
        }
        assert.deepEqual(businessRequests, [], 'practice mode selection sends no business requests')
        assert.deepEqual(
            permissionRequests,
            [],
            'practice mode selection requests no microphone permission',
        )
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

async function runPracticeSessionChecks(window, origin) {
    const configurations = families.filter(
        (entry) => entry.family === 'sentence' || entry.family === 'guess',
    )
    assert.equal(configurations.length, 2)
    const results = []
    for (const configuration of configurations)
        results.push(await runSessionPreservation(window, origin, configuration))
    return results
}

module.exports = { runPracticeModesChecks, runPracticeSessionChecks }
