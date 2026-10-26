const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { isExportedPageRequest } = require('./login-request-kind.cjs')

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function capturePractice(window) {
    // DOM 断言完成不代表合成帧已更新；只等待有限的主题过渡，不等待装饰循环动画。
    await evaluate(window, async () => {
        await document.fonts.ready
        await Promise.allSettled(Array.from(document.images, (image) => image.decode()))
        const painted = () =>
            new Promise((resolveFrame) =>
                requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
            )
        await painted()
        const transitions = document.getAnimations().filter((animation) => {
            const pseudoElement = animation.effect?.pseudoElement
            return (
                pseudoElement?.startsWith('::view-transition') ||
                animation.animationName?.includes('view-transition')
            )
        })
        await Promise.allSettled(transitions.map((animation) => animation.finished))
        await painted()
    })
    await delay(100)
    return window.webContents.capturePage()
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 80; attempt++) {
        if (await evaluate(window, operation, ...args)) return
        await delay(75)
    }
    throw new Error('Timed out: practice ' + description)
}

async function clickText(window, text, selector = 'body') {
    await evaluate(
        window,
        (label, scopeSelector) => {
            const scope = document.querySelector(scopeSelector)
            if (!scope) throw new Error('Missing practice action scope: ' + scopeSelector)
            const button = Array.from(scope.querySelectorAll('button')).find(
                (element) =>
                    (() => {
                        const accessible = element.getAttribute('aria-label')
                        const readable = element.cloneNode(true)
                        readable
                            .querySelectorAll('[aria-hidden="true"],kbd')
                            .forEach((node) => node.remove())
                        return [accessible, readable.textContent].some(
                            (value) =>
                                value !== null &&
                                value.replace(/\s+/g, '') === label.replace(/\s+/g, ''),
                        )
                    })() &&
                    !element.disabled &&
                    !element.closest('[inert]') &&
                    element.getClientRects().length > 0,
            )
            if (!button) throw new Error('Missing practice action: ' + label)
            button.click()
        },
        text,
        selector,
    )
}

async function closeDialog(window) {
    await evaluate(window, () => {
        const button = document.querySelector('[role="dialog"] button[aria-label="关闭对话框"]')
        if (!button) throw new Error('Practice dialog has no close action')
        button.click()
    })
    await waitFor(window, () => !document.querySelector('[role="dialog"]'), 'dialog closed')
}

async function navigate(window, origin, query) {
    await window.loadURL(origin + '/practice/' + query)
    await waitFor(
        window,
        () =>
            location.pathname === '/practice/' &&
            (document.querySelector('[data-practice-header]') !== null ||
                document.body.innerText.includes('练习页 · 第一版演示')),
        'route hydrated ' + query,
    )
}

async function fillAnswer(window, value) {
    await evaluate(
        window,
        (nextValue) => {
            const input = document.querySelector('input[aria-label="练习答案"]')
            if (!input) throw new Error('Missing practice answer input')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                nextValue,
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
        },
        value,
    )
    await waitFor(
        window,
        (expected) => document.querySelector('input[aria-label="练习答案"]')?.value === expected,
        'local answer input',
        value,
    )
}

async function measureReference(window) {
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
                fontFamily: style.fontFamily,
                color: style.color,
            }
        }
        return {
            viewport: [innerWidth, innerHeight],
            theme: document.documentElement.dataset.theme,
            header: box(document.querySelector('[data-practice-header]')),
            progress: box(document.querySelector('[data-practice-progress]')),
            media: box(document.querySelector('[data-practice-media]')),
            videoSlot: box(
                document.querySelector('[data-pure-video-cover]') ??
                    document.querySelector('video')?.parentElement,
            ),
            audioReaderWave: box(document.querySelector('[data-pure-audio-wave-slot]')),
            audioReaderProgress: box(document.querySelector('[data-pure-audio-progress] > div')),
            audioReaderControls: box(document.querySelector('[aria-label="音频控制栏"]')),
            pictureReaderFrame: box(document.querySelector('[data-pure-picture-frame]')),
            pictureReaderPrevious: box(document.querySelector('[aria-label="上一张图片"]')),
            pictureReaderNext: box(document.querySelector('[aria-label="下一张图片"]')),
            articleReaderFrame: box(document.querySelector('[data-pure-article-content]')),
            english: box(document.querySelector('[data-practice-english]')),
            translation: box(document.querySelector('[data-practice-translation]')),
            footer: box(document.querySelector('[data-practice-footer]')),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            mainNavigation: Boolean(document.querySelector('[aria-label="主导航"]')),
        }
    })
}

async function startMedia(window, kind) {
    // 在隔离测试窗口模拟用户激活；不把它当作物理点击或自动播放政策验收。
    await evaluate(
        window,
        async (selector) => {
            const media = document.querySelector(selector)
            if (!media) throw new Error('Missing technical media: ' + selector)
            const player = media.closest('section')
            const play = Array.from(player.querySelectorAll('button')).find((button) =>
                ['播放', '重试播放'].includes(button.textContent.trim()),
            )
            if (!play || play.disabled) throw new Error('Technical media play is unavailable')
            play.click()
            await media.play()
        },
        kind,
    )
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return (
                media !== null &&
                !media.paused &&
                media.currentTime > 0 &&
                media.closest('section').querySelector('[role="status"]')?.textContent === '播放中'
            )
        },
        kind + ' actual playing',
        kind,
    )
}

async function clickMediaAction(window, kind, label) {
    await evaluate(
        window,
        (selector, action) => {
            const media = document.querySelector(selector)
            if (!media) throw new Error('Missing media for action: ' + action)
            const button = Array.from(media.closest('section').querySelectorAll('button')).find(
                (element) => element.textContent.replace(/\s+/g, '') === action,
            )
            if (!button || button.disabled)
                throw new Error('Missing enabled media action: ' + action)
            button.click()
        },
        kind,
        label,
    )
}

async function checkTechnicalMedia(window, origin, kind) {
    const demo = kind === 'audio' ? 'audio-basic' : 'video-basic'
    const mode = kind === 'audio' ? 'read' : 'listen'
    await navigate(window, origin, '?demo=' + demo + '&mode=' + mode + '&keep=practice-smoke')
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return media?.readyState >= 2 && Number.isFinite(media.duration) && media.duration > 0
        },
        kind + ' technical metadata and playable data',
        kind,
    )
    const initial = await evaluate(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            const player = media.closest('section')
            window.practiceMediaEvents = []
            for (const type of ['playing', 'pause', 'timeupdate', 'seeked', 'ended', 'error'])
                media.addEventListener(type, () =>
                    window.practiceMediaEvents.push({ type, time: media.currentTime }),
                )
            return {
                source: new URL(media.currentSrc).pathname,
                duration: media.duration,
                paused: media.paused,
                label: player.innerText.includes('技术验证片段，非课程音视频'),
            }
        },
        kind,
    )
    assert.equal(initial.paused, true, kind + ' does not autoplay on mount')
    assert.equal(initial.label, true, kind + ' is visibly identified as a technical sample')
    assert.ok(Math.abs(initial.duration - 2) < 0.05, kind + ' real two-second duration')
    assert.equal(
        initial.source,
        kind === 'audio'
            ? '/practice-demo/technical-tone.wav'
            : '/practice-demo/technical-video.mp4',
    )
    const geometry = await measureReference(window)
    if (kind === 'video') {
        assert.equal(geometry.videoSlot.width, 1100)
        assert.equal(geometry.videoSlot.height, 618)
    }
    await startMedia(window, kind)
    await clickMediaAction(window, kind, '暂停')
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return media.paused && media.currentTime > 0 && !media.ended
        },
        kind + ' pause preserves progress',
        kind,
    )
    const pausedPosition = await evaluate(
        window,
        (selector) => document.querySelector(selector).currentTime,
        kind,
    )
    await evaluate(
        window,
        (selector) => {
            const player = document.querySelector(selector).closest('section')
            const ranges = player.querySelectorAll('input[type="range"]')
            const change = (input, value) => {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                    input,
                    value,
                )
                input.dispatchEvent(new Event('input', { bubbles: true }))
            }
            change(ranges[0], '1')
            change(ranges[1], '0.35')
            const rate = player.querySelector('select')
            Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(
                rate,
                '1.25',
            )
            rate.dispatchEvent(new Event('change', { bubbles: true }))
        },
        kind,
    )
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return (
                Math.abs(media.currentTime - 1) < 0.1 &&
                media.volume === 0.35 &&
                media.playbackRate === 1.25
            )
        },
        kind + ' actual seek volume and rate',
        kind,
    )
    await clickMediaAction(window, kind, '停止')
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return media.paused && media.currentTime === 0
        },
        kind + ' stop resets actual media',
        kind,
    )
    await startMedia(window, kind)
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return (
                media.ended &&
                media.closest('section').querySelector('[role="status"]')?.textContent ===
                    '播放结束'
            )
        },
        kind + ' actual ended event',
        kind,
    )
    await startMedia(window, kind)
    await clickText(window, '设置', '[data-practice-header]')
    await waitFor(
        window,
        () => Boolean(document.querySelector('[role="dialog"]')),
        'settings blocks media',
    )
    await waitFor(
        window,
        (selector) => {
            const media = document.querySelector(selector)
            return media.paused && media.currentTime === 0
        },
        kind + ' overlay stops actual media',
        kind,
    )
    await closeDialog(window)
    assert.equal(
        await evaluate(window, (selector) => document.querySelector(selector).paused, kind),
        true,
        kind + ' closing settings does not resume media',
    )
    await startMedia(window, kind)
    await evaluate(
        window,
        (selector) => {
            window.practiceOldMedia = document.querySelector(selector)
        },
        kind,
    )
    if (kind === 'video') {
        // 视频听力原稿使用播放器控制栏，没有通用练习底栏。
        window.webContents.focus()
        window.webContents.sendInputEvent({
            type: 'keyDown',
            keyCode: 'Right',
            modifiers: ['shift'],
        })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Right', modifiers: ['shift'] })
    } else await clickText(window, '下一题', '[data-practice-footer]')
    await waitFor(
        window,
        (selector) => {
            const current = document.querySelector(selector)
            return (
                current !== window.practiceOldMedia &&
                window.practiceOldMedia.paused &&
                window.practiceOldMedia.getAttribute('src') === null
            )
        },
        kind + ' question change releases previous element',
        kind,
    )
    const events = await evaluate(window, () => window.practiceMediaEvents)
    assert.ok(events.some((event) => event.type === 'playing'))
    assert.ok(events.some((event) => event.type === 'pause'))
    assert.ok(events.some((event) => event.type === 'ended'))
    assert.equal(
        events.some((event) => event.type === 'error'),
        false,
    )
    return {
        kind,
        initial,
        geometry,
        pausedPosition,
        events,
        realPlaybackPauseStopSeekVolumeRateEnded: true,
        overlayStopsAndDoesNotResume: true,
        questionChangeReleasesPreviousMedia: true,
        activation: '测试脚本模拟用户激活并调用原生play；不证明真实物理手势或自动播放策略',
    }
}

async function runPracticeChecks(window, origin, label, report) {
    const priorSize = window.getContentSize()
    const priorZoom = window.webContents.getZoomFactor()
    const application = new URL(origin)
    const exportManifest = JSON.parse(
        readFileSync(resolve('dist/production/.export-manifest.json'), 'utf8'),
    )
    const exportedFiles = new Set(exportManifest.files.map((path) => '/' + path))
    const exportedPages = new Set(exportManifest.routes)
    const businessRequests = []
    const permissionRequests = []
    const staticRequests = []
    const session = window.webContents.session
    const result = {
        label,
        status: 'running',
        businessRequests,
        permissionRequests,
        staticRequests,
        media: [],
        limitations: [
            '真实判题和录音评分未接入；本helper只以视频听力Shift+→验证切题释放，完整按键、作用域和面板契约由新增专项另测',
            '技术样例不代表课程素材或任何设置音色；视频没有音轨',
            '媒体测试使用脚本模拟用户激活，不替代真实手势策略验收',
            '拒绝播放、格式失败、迟到Promise和跨实例互斥由控制器替身单测覆盖，不冒充本脚本浏览器故障注入验收',
            '只执行1920px PC运行时检查，平板/H5视觉与真机兼容待用户验收',
            '几何记录当前隔离测试偏好；不为截图改写已持久化设置',
        ],
    }
    if (report) {
        report.practice ??= []
        report.practice.push(result)
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
            (details.method === 'GET' || details.method === 'HEAD') &&
            exportedFiles.has(url.pathname)
        if (exportedPage || exportedAsset)
            staticRequests.push({ path: url.pathname, type: details.resourceType })
        if (
            url.pathname.startsWith('/api/') ||
            !['GET', 'HEAD'].includes(details.method) ||
            (!sameApplication && ['https:', 'http:'].includes(url.protocol)) ||
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
        await navigate(window, origin, '?keep=practice-smoke')
        const catalog = await evaluate(window, () =>
            Array.from(document.querySelectorAll('main section h2')).map(
                (element) => element.textContent,
            ),
        )
        assert.equal(catalog.length, 12)
        assert.ok(catalog.includes('看图学词'))
        assert.ok(catalog.includes('独立指法'))
        result.catalog = catalog
        await evaluate(window, () => {
            const section = Array.from(document.querySelectorAll('main section')).find(
                (element) => element.querySelector('h2')?.textContent === '句子游戏',
            )
            const action = Array.from(section.querySelectorAll('button')).find(
                (button) => button.textContent.trim() === '中译英',
            )
            action.click()
        })
        await waitFor(
            window,
            () =>
                new URLSearchParams(location.search).get('mode') === 'translate' &&
                Boolean(document.querySelector('input[aria-label="练习答案"]')),
            'catalog starts explicit translation demo',
        )
        assert.equal(
            await evaluate(window, () => new URLSearchParams(location.search).get('keep')),
            'practice-smoke',
        )
        await fillAnswer(window, 'We read books together.')
        const beforeSettings = await evaluate(window, () => ({
            search: location.search,
            value: document.querySelector('input[aria-label="练习答案"]').value,
            progress: document
                .querySelector('[data-practice-progress]')
                .getAttribute('aria-valuenow'),
        }))
        await clickText(window, '设置', '[data-practice-header]')
        await waitFor(
            window,
            () =>
                Boolean(
                    document.querySelector(
                        '[role="dialog"] [role="tablist"][aria-label="设置分类"]',
                    ),
                ),
            'full settings editor',
        )
        const tabs = await evaluate(window, () =>
            Array.from(document.querySelectorAll('[role="dialog"] [role="tab"]')).map((element) =>
                (() => {
                    const readable = element.cloneNode(true)
                    readable
                        .querySelectorAll('[aria-hidden="true"],kbd')
                        .forEach((node) => node.remove())
                    return readable.textContent.trim()
                })(),
            ),
        )
        assert.deepEqual(tabs, ['发音', '专项', '答题', '特效', '外观', '快捷键', '系统'])
        for (const tab of tabs) {
            await clickText(window, tab, '[role="dialog"] [role="tablist"]')
            await waitFor(
                window,
                (name) =>
                    document
                        .querySelector('[role="dialog"] [role="tabpanel"]')
                        ?.getAttribute('aria-label') === name,
                'settings tab ' + tab,
                tab,
            )
        }
        await clickText(window, '外观', '[role="dialog"] [role="tablist"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('button[aria-label="编辑答题颜色"]')),
            'appearance color action',
        )
        await evaluate(window, () =>
            document.querySelector('button[aria-label="编辑答题颜色"]').click(),
        )
        await waitFor(
            window,
            () => document.querySelectorAll('[role="dialog"]').length === 2,
            'nested color dialog',
        )
        await evaluate(window, () =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
        )
        await waitFor(
            window,
            () =>
                document.querySelectorAll('[role="dialog"]').length === 1 &&
                document.querySelector('[role="dialog"]').contains(document.activeElement),
            'Escape closes only color child',
        )
        await clickText(window, '快捷键', '[role="dialog"] [role="tablist"]')
        await evaluate(window, () => {
            const button = Array.from(
                document.querySelectorAll('[role="dialog"] [role="tabpanel"] button'),
            ).find((item) => item.textContent.trim().startsWith('编辑'))
            if (!button) throw new Error('Missing shortcut edit action')
            button.click()
        })
        await waitFor(
            window,
            () => document.querySelectorAll('[role="dialog"]').length === 2,
            'nested shortcut dialog',
        )
        await evaluate(window, () =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
        )
        await waitFor(
            window,
            () =>
                document.querySelectorAll('[role="dialog"]').length === 1 &&
                document.querySelector('[role="dialog"]').contains(document.activeElement),
            'Escape closes only shortcut child',
        )
        result.nestedSettingsDialogsKeepParentAndFocus = true
        await closeDialog(window)
        const afterSettings = await evaluate(window, () => ({
            search: location.search,
            value: document.querySelector('input[aria-label="练习答案"]').value,
            progress: document
                .querySelector('[data-practice-progress]')
                .getAttribute('aria-valuenow'),
        }))
        assert.deepEqual(afterSettings, beforeSettings)
        result.settingsSevenTabsPreserveInputUrlProgress = true
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-demo-tools]')),
            ),
            false,
            'demo tools are removed',
        )
        await evaluate(window, () =>
            document.querySelector('[data-practice-footer-item="primary"]').click(),
        )
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-phase]')?.dataset.practicePhase ===
                    'answering' &&
                document.querySelector('input[aria-label="练习答案"]')?.value ===
                    'We read books together.' &&
                !document.querySelector('[data-practice-quick-oral]'),
            'submission preserves ungraded input without exposing quick oral',
        )
        result.submissionPreservesUngradedInput = true
        await clickText(window, '模式', '[data-practice-header]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[role="dialog"]')),
            'mode chooser',
        )
        await clickText(window, '指法练习', '[role="dialog"]')
        assert.equal(
            await evaluate(window, () => new URLSearchParams(location.search).get('mode')),
            'translate',
        )
        await clickText(window, '开始练习', '[role="dialog"]')
        await waitFor(
            window,
            () =>
                new URLSearchParams(location.search).get('mode') === 'typing' &&
                Boolean(document.querySelector('[aria-label="指法键盘演示"]')),
            'mode changes URL and content',
        )
        assert.equal(
            await evaluate(window, () => new URLSearchParams(location.search).get('keep')),
            'practice-smoke',
        )
        result.modeSwitchPreservesOtherQuery = true
        await navigate(window, origin, '?demo=missing-demo&mode=translate')
        assert.match(
            await evaluate(window, () => document.querySelector('[role="alert"]').textContent),
            /未找到/,
        )
        await navigate(window, origin, '?demo=video-basic&mode=read')
        assert.match(
            await evaluate(window, () => document.querySelector('[role="alert"]').textContent),
            /不支持/,
        )
        result.invalidDemoAndUnsupportedMode = true
        await navigate(window, origin, '?demo=word-basic&mode=dictate')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-practice-media]')),
            'dictation initial image',
        )
        assert.equal(
            await evaluate(
                window,
                () =>
                    Boolean(document.querySelector('input[aria-label="练习答案"]')) &&
                    !document.querySelector('[data-practice-quick-oral]'),
            ),
            true,
        )
        result.dictationRemainsUngraded = true
        await navigate(window, origin, '?demo=phonetics-basic&mode=pronounce')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[aria-label="音标练习示例"]')),
            'phonetics target',
        )
        await clickText(window, '内容', '[data-practice-header]')
        await waitFor(
            window,
            () =>
                document.querySelector('[role="dialog"]')?.innerText.includes('understand') &&
                !document.querySelector('[role="dialog"]')?.innerText.includes('woman'),
            'phonetics content uses the displayed word',
        )
        await closeDialog(window)
        await clickText(window, '快捷口语评测', 'main[aria-label="练习内容"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[role="dialog"] [aria-label="口语评测演示"]')),
            'phonetics visible target allows quick oral',
        )
        await closeDialog(window)
        result.phoneticsUsesConsistentTargetAndQuickOral = true
        await navigate(window, origin, '?demo=sentence-basic&mode=oral')
        await clickText(window, '开始录音演示', '[aria-label="口语评测演示"]')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[aria-label="口语评测演示"]')
                    .innerText.includes('演示计时 00:01'),
            'oral simulation timer',
        )
        await clickText(window, '重置', '[data-practice-header]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[role="dialog"]')),
            'reset confirmation',
        )
        await clickText(window, '确认重置', '[role="dialog"]')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[aria-label="口语评测演示"]')
                    .innerText.includes('待录音（演示）') &&
                document
                    .querySelector('[aria-label="口语评测演示"]')
                    .innerText.includes('演示计时 00:00'),
            'first-question reset clears oral state and timer',
        )
        result.firstQuestionResetClearsOralSimulation = true
        await clickText(window, '开始录音演示', '[aria-label="口语评测演示"]')
        await clickText(window, '结束录音演示', '[aria-label="口语评测演示"]')
        await clickText(window, '展示示例结果', '[aria-label="口语评测演示"]')
        assert.match(
            await evaluate(
                window,
                () => document.querySelector('[aria-label="口语评测演示"]').innerText,
            ),
            /固定演示数据/,
        )
        await clickText(window, '下一题', '[data-practice-footer]')
        await waitFor(
            window,
            () =>
                document
                    .querySelector('[aria-label="口语评测演示"]')
                    .innerText.includes('待录音（演示）'),
            'question switch clears oral simulation',
        )
        result.oralResultsExplicitlySimulatedAndQuestionLocal = true
        result.media.push(await checkTechnicalMedia(window, origin, 'audio'))
        result.media.push(await checkTechnicalMedia(window, origin, 'video'))
        await navigate(window, origin, '?demo=video-reader&mode=read')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-pure-video-cover]')),
            'video reader geometry',
        )
        result.videoReaderReference = await measureReference(window)
        assert.equal(result.videoReaderReference.videoSlot.width, 1200)
        assert.equal(result.videoReaderReference.videoSlot.height, 700)
        assert.equal(result.videoReaderReference.videoSlot.x, 360)
        assert.equal(result.videoReaderReference.videoSlot.y, 226)
        assert.equal(result.videoReaderReference.progress, null)
        assert.doesNotMatch(
            await evaluate(window, () => document.querySelector('h1').textContent),
            /[（(]\s*\d+\s*\/\s*\d+\s*[）)]/,
        )
        assert.equal(
            await evaluate(window, () => Boolean(document.querySelector('audio, video'))),
            false,
            'pure video remains a static cover until media integration',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('[data-practice-quick-oral]')),
            ),
            false,
        )
        result.pureReadersNeverOfferQuickOral = true
        await navigate(window, origin, '?demo=audio-reader&mode=read')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-pure-audio-reader] [data-audio-wave]')),
            'audio reader uses the settings waveform preview',
        )
        result.audioReaderReference = await measureReference(window)
        assert.equal(result.audioReaderReference.audioReaderWave.x, 712)
        assert.equal(result.audioReaderReference.audioReaderWave.y, 275)
        assert.equal(result.audioReaderReference.audioReaderWave.width, 496)
        assert.equal(result.audioReaderReference.audioReaderWave.height, 280)
        assert.equal(result.audioReaderReference.audioReaderProgress.x, 583)
        assert.equal(result.audioReaderReference.audioReaderProgress.y, 565)
        assert.equal(result.audioReaderReference.audioReaderProgress.width, 755)
        assert.equal(result.audioReaderReference.audioReaderProgress.height, 8)
        assert.equal(result.audioReaderReference.audioReaderControls.y, 615)
        assert.equal(result.audioReaderReference.audioReaderControls.x, 944)
        assert.equal(result.audioReaderReference.audioReaderControls.width, 32)
        assert.equal(result.audioReaderReference.progress, null)
        assert.doesNotMatch(
            await evaluate(window, () => document.querySelector('h1').textContent),
            /[（(]\s*\d+\s*\/\s*\d+\s*[）)]/,
        )
        assert.equal(
            await evaluate(
                window,
                () => document.querySelectorAll('[aria-label="音频控制栏"] button').length,
            ),
            1,
        )
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-pure-audio-reader] [data-audio-wave]')
                    .getAttribute('data-wave-active'),
            ),
            'false',
        )
        await evaluate(window, () => document.querySelector('[aria-label="播放声纹预览"]').click())
        await waitFor(
            window,
            () =>
                Boolean(document.querySelector('[aria-label="暂停声纹预览"]')) &&
                document
                    .querySelector('[data-pure-audio-reader] [data-audio-wave]')
                    ?.getAttribute('data-wave-active') === 'true',
            'pure audio preview starts',
        )
        await evaluate(window, () => document.querySelector('[aria-label="暂停声纹预览"]').click())
        await waitFor(
            window,
            () =>
                Boolean(document.querySelector('[aria-label="播放声纹预览"]')) &&
                document
                    .querySelector('[data-pure-audio-reader] [data-audio-wave]')
                    ?.getAttribute('data-wave-active') === 'false',
            'pure audio preview pauses',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(document.querySelector('audio, video, [data-practice-quick-oral]')),
            ),
            false,
            'pure audio is a waveform preview without a media source or quick oral entry',
        )
        await navigate(window, origin, '?demo=picture-reader&mode=read')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-pure-picture-frame]')),
            'picture carousel mounted',
        )
        result.pictureReaderReference = await measureReference(window)
        assert.equal(result.pictureReaderReference.pictureReaderFrame.x, 410)
        assert.equal(result.pictureReaderReference.pictureReaderFrame.y, 173)
        assert.equal(result.pictureReaderReference.pictureReaderFrame.width, 1100)
        assert.equal(result.pictureReaderReference.pictureReaderFrame.height, 733)
        assert.equal(result.pictureReaderReference.pictureReaderPrevious.x, 424)
        assert.equal(result.pictureReaderReference.pictureReaderNext.x, 1444)
        assert.equal(result.pictureReaderReference.progress.height, 3)
        for (const [selector, expected] of [
            ['[aria-label="上一张图片"]', 4],
            ['[data-practice-footer-item="next"]', 0],
            ['[aria-label="查看第3张图片"]', 2],
        ]) {
            await evaluate(window, (target) => document.querySelector(target).click(), selector)
            await waitFor(
                window,
                (index) =>
                    document.querySelector('[data-practice-index]')?.dataset.practiceIndex ===
                        String(index) &&
                    document.querySelector('[data-pure-picture-frame]')?.dataset
                        .pictureSwitching === 'false',
                'picture selection settles',
                expected,
            )
            assert.equal(
                await evaluate(window, () =>
                    document
                        .querySelector('[aria-current="true"][aria-label^="查看第"]')
                        ?.getAttribute('aria-label'),
                ),
                `查看第${expected + 1}张图片`,
            )
        }
        await evaluate(window, () => document.querySelector('[data-practice-index]').focus())
        window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
        window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' })
        await waitFor(
            window,
            () =>
                document.querySelector('[data-practice-index]')?.dataset.practiceIndex === '3' &&
                document.querySelector('[data-pure-picture-frame]')?.dataset.pictureSwitching ===
                    'false',
            'space advances carousel once',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        'audio, video, [data-practice-quick-oral], [data-practice-english]',
                    ),
                ),
            ),
            false,
        )
        result.pictureReaderLoopsWithoutCompletion = true
        await navigate(window, origin, '?demo=text-reader&mode=read')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[data-pure-article-content]')),
            'empty article reader mounted',
        )
        result.articleReaderReference = await measureReference(window)
        assert.equal(result.articleReaderReference.articleReaderFrame.x, 410)
        assert.equal(result.articleReaderReference.articleReaderFrame.y, 170)
        assert.equal(result.articleReaderReference.articleReaderFrame.width, 1100)
        assert.equal(result.articleReaderReference.articleReaderFrame.height, 740)
        assert.equal(result.articleReaderReference.progress.height, 3)
        assert.equal(result.articleReaderReference.footer, null)
        assert.equal(result.articleReaderReference.media, null)
        assert.equal(
            await evaluate(window, () =>
                document.querySelector('[aria-label="文章阅读进度"]').getAttribute('aria-valuenow'),
            ),
            '0',
        )
        assert.equal(
            await evaluate(window, () =>
                document.querySelector('[aria-label="文章阅读进度"]').getAttribute('aria-valuemax'),
            ),
            '100',
        )
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[aria-label="文章阅读进度"] > div').style.width,
            ),
            '0%',
        )
        assert.doesNotMatch(
            await evaluate(window, () => document.querySelector('h1').textContent),
            /[（(]\s*\d+\s*\/\s*\d+\s*[）)]/,
        )
        assert.equal(
            await evaluate(window, () =>
                document
                    .querySelector('[data-pure-article-reader]')
                    .getAttribute('data-article-empty'),
            ),
            'true',
        )
        assert.equal(
            await evaluate(window, () =>
                Boolean(
                    document.querySelector(
                        'audio, video, input, [data-practice-quick-oral], [data-practice-english]',
                    ),
                ),
            ),
            false,
        )
        await navigate(window, origin, '?demo=word-basic&mode=pronounce')
        await waitFor(
            window,
            () =>
                Array.from(document.images).every(
                    (image) => image.complete && image.naturalWidth > 0,
                ),
            'reference images loaded',
        )
        result.reference = await measureReference(window)
        assert.deepEqual(result.reference.viewport, [1920, 1080])
        assert.equal(result.reference.header.height, 72)
        assert.equal(result.reference.progress.height, 3)
        assert.equal(result.reference.media.width, 500)
        assert.equal(result.reference.media.height, 281)
        assert.equal(result.reference.media.x, 710)
        assert.equal(result.reference.media.y, 228)
        assert.equal(result.reference.horizontalOverflow, false)
        assert.equal(result.reference.mainNavigation, false)
        assert.equal(result.reference.english.fontSize, '38px')
        assert.equal(result.reference.english.fontWeight, '600')
        assert.equal(result.reference.english.lineHeight, '38px')
        assert.equal(result.reference.english.letterSpacing, '3.04px')
        assert.equal(result.reference.footer.y, 980)
        const image = await capturePractice(window)
        const screenshot = 'practice-' + label.toLowerCase() + '-pc.png'
        writeFileSync(resolve('dist', screenshot), image.toPNG())
        result.screenshot = 'dist/' + screenshot
        result.visualSurvey = []
        for (const view of [
            ['sentence', '?demo=sentence-basic&mode=translate'],
            ['self-check', '?demo=sentence-basic&mode=check'],
            ['blocks', '?demo=sentence-basic&mode=blocks'],
            ['picture', '?demo=picture-basic&mode=translate'],
            ['video', '?demo=video-basic&mode=listen'],
            ['phonetics', '?demo=phonetics-basic&mode=pronounce'],
            ['typing', '?demo=typing-basic&mode=typing'],
            ['spelling', '?demo=word-basic&mode=spell'],
            ['dictation', '?demo=word-basic&mode=dictate'],
        ]) {
            await navigate(window, origin, view[1])
            await waitFor(
                window,
                () =>
                    Array.from(document.images).every(
                        (image) => image.complete && image.naturalWidth > 0,
                    ),
                'visual survey images ' + view[0],
            )
            if (view[0] === 'blocks') {
                for (const word of ['we', 'read', 'books'])
                    await clickText(window, word, '[aria-label="句子练习"]')
                await waitFor(
                    window,
                    () =>
                        document.querySelectorAll('[aria-label="已选择的词块，点击撤回"] button')
                            .length === 3,
                    'blocks keeps explicit local selection',
                )
                const tray = await evaluate(window, () => {
                    const rect = document
                        .querySelector('[aria-label="已选择的词块，点击撤回"]')
                        .getBoundingClientRect()
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                })
                assert.deepEqual(tray, { x: 563, y: 565, width: 794, height: 163 })
            }
            const measured = await measureReference(window)
            assert.equal(measured.horizontalOverflow, false, 'reference overflow ' + view[0])
            if (view[0] === 'spelling') {
                assert.equal(measured.media.x, 710)
                assert.equal(measured.media.y, 228)
                assert.equal(measured.media.width, 500)
                assert.equal(measured.media.height, 281)
            }
            if (view[0] === 'dictation') {
                assert.equal(measured.media.x, 745)
                assert.equal(measured.media.y, 220)
                assert.equal(measured.media.width, 430)
                assert.equal(measured.media.height, 242)
            }
            if (view[0] === 'sentence') {
                assert.equal(measured.media.x, 745)
                assert.equal(measured.media.y, 336)
                assert.equal(measured.translation.y, 602)
                const lines = await evaluate(window, () =>
                    Array.from(
                        document.querySelectorAll(
                            '[aria-label="句子练习"] label > [aria-hidden="true"] > span',
                        ),
                    ).map((element) => {
                        const rect = element.getBoundingClientRect()
                        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    }),
                )
                assert.deepEqual(lines, [
                    { x: 710, y: 723, width: 59, height: 3 },
                    { x: 807, y: 723, width: 83, height: 3 },
                    { x: 915, y: 723, width: 112, height: 3 },
                    { x: 1052, y: 723, width: 157, height: 3 },
                ])
            }
            if (view[0] === 'self-check') {
                assert.equal(measured.media.x, 745)
                assert.equal(measured.media.y, 245)
                assert.equal(measured.english.y, 532)
                assert.equal(measured.english.fontSize, '40px')
                assert.equal(measured.english.color, 'rgb(255, 255, 255)')
                assert.equal(measured.translation, null)
            }
            const surveyImage = await capturePractice(window)
            const surveyPath = 'dist/practice-' + label.toLowerCase() + '-' + view[0] + '-pc.png'
            writeFileSync(resolve(surveyPath), surveyImage.toPNG())
            result.visualSurvey.push({ view: view[0], measured, screenshot: surveyPath })
        }
        await navigate(window, origin, '?demo=word-basic&mode=pronounce')
        await clickText(window, '设置', '[data-practice-header]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('[role="dialog"] [role="tablist"]')),
            'settings before theme check',
        )
        await clickText(window, '外观', '[role="dialog"] [role="tablist"]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('input[aria-label="白天模式"]')),
            'practice theme choice',
        )
        await evaluate(window, () => document.querySelector('input[aria-label="白天模式"]').click())
        await waitFor(
            window,
            () => document.documentElement.dataset.theme === 'light',
            'practice light theme',
        )
        await closeDialog(window)
        const light = await measureReference(window)
        assert.equal(light.english.color, 'rgb(16, 187, 130)')
        assert.equal(light.horizontalOverflow, false)
        const lightActionFilters = await evaluate(window, () =>
            Array.from(document.querySelectorAll('[aria-label="单词拼读卡片"] button > img'))
                .slice(0, 4)
                .map((element) => getComputedStyle(element).filter),
        )
        assert.deepEqual(lightActionFilters, Array(4).fill('invert(1)'))
        const lightPath = 'dist/practice-' + label.toLowerCase() + '-light-pc.png'
        writeFileSync(resolve(lightPath), (await capturePractice(window)).toPNG())
        result.lightTheme = {
            measured: light,
            actionFilters: lightActionFilters,
            screenshot: lightPath,
        }
        await clickText(window, '设置', '[data-practice-header]')
        await waitFor(
            window,
            () => Boolean(document.querySelector('input[aria-label="夜间模式"]')),
            'practice dark theme choice',
        )
        await evaluate(window, () => document.querySelector('input[aria-label="夜间模式"]').click())
        await waitFor(
            window,
            () => document.documentElement.dataset.theme === 'dark',
            'practice restores dark theme',
        )
        await closeDialog(window)
        result.pcReflow = []
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            await delay(75)
            const measured = await measureReference(window)
            assert.equal(measured.horizontalOverflow, false, 'PC responsive overflow at ' + width)
            result.pcReflow.push({ width, measured })
        }
        window.setContentSize(1920, 1080)
        result.pageZoom = []
        for (const factor of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(factor)
            await delay(75)
            const measured = await measureReference(window)
            assert.equal(measured.horizontalOverflow, false, 'real page zoom overflow at ' + factor)
            result.pageZoom.push({ factor, measured })
        }
        assert.deepEqual(businessRequests, [], 'static practice sends no business requests')
        assert.deepEqual(
            permissionRequests,
            [],
            'oral demonstrations request no microphone permissions',
        )
        result.status = 'passed'
        return result
    } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : String(error)
        throw error
    } finally {
        session.webRequest.onBeforeSendHeaders(null)
        session.setPermissionRequestHandler(null)
        window.webContents.setZoomFactor(priorZoom)
        window.setContentSize(...priorSize)
    }
}

module.exports = { runPracticeChecks }
