const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { runStandalonePanelMotionSmoke } = require('./practice-panel-motion-runtime-smoke.cjs')

const coverSelector = '[data-tilted-cover]'
const routes = [
    '/awakening/',
    '/awakening/courses/phonetics/',
    '/foreign-language-guide/',
    '/foreign-language-guide/courses/winter-speaking/',
    '/profile/learning-progress/',
    '/profile/favorites/',
    '/profile/works/',
    '/profile/notes/?view=course-packages',
    '/profile/notes/courses/ocean-vocabulary/',
    '/pk/',
    '/pk/matching/',
]

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
        true,
    )
}

async function waitFor(window, operation, description, ...args) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
        if (await evaluate(window, operation, ...args)) return
        await delay(50)
    }
    throw new Error('Timed out: tilted cover ' + description)
}

async function listeners(window, expression) {
    const remote = await window.webContents.debugger.sendCommand('Runtime.evaluate', {
        expression,
        objectGroup: 'tilted-cover-check',
    })
    try {
        if (!remote.result.objectId) return []
        const result = await window.webContents.debugger.sendCommand(
            'DOMDebugger.getEventListeners',
            { objectId: remote.result.objectId },
        )
        return result.listeners.map((listener) => listener.type)
    } finally {
        await window.webContents.debugger.sendCommand('Runtime.releaseObjectGroup', {
            objectGroup: 'tilted-cover-check',
        })
    }
}

async function ready(window, selector = coverSelector) {
    const expression = 'document.querySelector(' + JSON.stringify(selector) + ')'
    for (let attempt = 0; attempt < 80; attempt += 1) {
        if ((await listeners(window, expression)).includes('pointermove')) return
        await delay(50)
    }
    throw new Error('Cover native listeners did not mount: ' + selector)
}

async function mouse(window, x, y, type = 'mouseMoved') {
    await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', {
        type,
        x,
        y,
        ...(type === 'mouseMoved' ? {} : { button: 'left', clickCount: 1 }),
    })
}

async function bounds(window, selector) {
    await evaluate(
        window,
        (target) => {
            document.querySelector(target)?.scrollIntoView({ block: 'center' })
        },
        selector,
    )
    async function measure() {
        return evaluate(
            window,
            (target) => {
                const element = document.querySelector(target)
                if (!element) throw new Error('Missing target: ' + target)
                const rect = element.getBoundingClientRect()
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            },
            selector,
        )
    }
    // 缩放跨过侧栏断点时，先等既有侧栏动画和滚动定位结束，再严格比较悬停前后槽位。
    let previous = await measure()
    let stable = 0
    for (let attempt = 0; attempt < 40; attempt += 1) {
        await delay(50)
        const next = await measure()
        stable = ['x', 'y', 'width', 'height'].every(
            (key) => Math.abs(next[key] - previous[key]) < 0.05,
        )
            ? stable + 1
            : 0
        if (stable >= 3) return next
        previous = next
    }
    throw new Error('Cover slot did not settle after responsive reflow')
}

async function click(window, selector) {
    const rect = await bounds(window, selector)
    const x = rect.x + rect.width / 2
    const y = rect.y + rect.height / 2
    await mouse(window, x, y)
    await mouse(window, x, y, 'mousePressed')
    await mouse(window, x, y, 'mouseReleased')
}

async function visit(window, origin, path) {
    // 等待当前可见资源完成，避免整页导航取消前一页尚未解码的图片。
    await waitFor(
        window,
        () =>
            Array.from(document.images).every((image) => {
                const rect = image.getBoundingClientRect()
                return image.loading === 'lazy' && (rect.bottom <= 0 || rect.top >= innerHeight)
                    ? true
                    : image.complete
            }),
        'previous visible images settle',
    )
    await window.loadURL(origin + path)
    await ready(window)
}

async function snapshot(window, selector = coverSelector) {
    return evaluate(
        window,
        (target) => {
            const cover = document.querySelector(target)
            const image = cover.querySelector('img')
            const surface = cover.querySelector('[data-tilted-surface]')
            const style = getComputedStyle(cover)
            const rect = cover.getBoundingClientRect()
            const matrix = new DOMMatrixReadOnly(getComputedStyle(surface).transform)
            return {
                active: cover.dataset.tilted === 'true',
                rotateX: parseFloat(cover.style.getPropertyValue('--cover-rotate-x')) || 0,
                rotateY: parseFloat(cover.style.getPropertyValue('--cover-rotate-y')) || 0,
                glareX: cover.style.getPropertyValue('--cover-glare-x'),
                overflow: style.overflow,
                radius: style.borderTopLeftRadius,
                imageLoaded: image.complete && image.naturalWidth > 0,
                imageFit: getComputedStyle(image).objectFit,
                cursor: getComputedStyle(image).cursor,
                matrix: [matrix.m11, matrix.m22, matrix.m13, matrix.m23],
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                count: document.querySelectorAll('[data-tilted-cover]').length,
                overflowPage: document.documentElement.scrollWidth > innerWidth,
            }
        },
        selector,
    )
}

async function checkCover(window, selector = coverSelector) {
    await ready(window, selector)
    const rect = await bounds(window, selector)
    assert.ok(rect.width > 0 && rect.height > 0)
    await waitFor(
        window,
        (target) => {
            const image = document.querySelector(target)?.querySelector('img')
            return image?.complete && image.naturalWidth > 0
        },
        'image decoded',
        selector,
    )
    await mouse(window, rect.x + rect.width * 0.2, rect.y + rect.height * 0.2)
    await waitFor(
        window,
        (target) => document.querySelector(target)?.dataset.tilted === 'true',
        'hover activates',
        selector,
    )
    await delay(180)
    const first = await snapshot(window, selector)
    assert.ok(first.rotateX > 0 && first.rotateY < 0)
    assert.ok(Math.abs(first.matrix[2]) > 0.01, 'CSS applies a real 3D rotation')
    assert.equal(first.overflow, 'hidden', 'outer cover clips animated pixels')
    assert.equal(first.imageFit, 'cover')
    assert.equal(first.overflowPage, false)
    for (const key of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(first.rect[key] - rect[key]) < 0.1, 'stable slot: ' + key)
    }
    await mouse(window, rect.x + rect.width * 0.8, rect.y + rect.height * 0.8)
    await delay(180)
    const opposite = await snapshot(window, selector)
    assert.ok(opposite.rotateX < 0 && opposite.rotateY > 0)
    assert.notEqual(first.glareX, opposite.glareX)
    await mouse(window, 0, 0)
    await waitFor(
        window,
        (target) => document.querySelector(target)?.dataset.tilted === undefined,
        'leave resets',
        selector,
    )
    await delay(320)
    const restored = await snapshot(window, selector)
    assert.ok(Math.abs(restored.matrix[0] - 1) < 0.001)
    assert.ok(Math.abs(restored.matrix[1] - 1) < 0.001)
    return { count: first.count, rect, clipped: true, moved: true, restored: true }
}

async function capture(window, name) {
    mkdirSync(resolve('dist'), { recursive: true })
    const path = 'dist/tilted-cover-' + name + '.png'
    writeFileSync(resolve(path), (await window.webContents.capturePage()).toPNG())
    return path
}

async function runChecks(window, origin, label) {
    const result = { label, status: 'running', routes: [], interactions: [], screenshots: [] }
    window.webContents.debugger.attach('1.3')
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
        enabled: true,
    })
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    try {
        window.setContentSize(1440, 900)
        for (const path of routes) {
            console.log('Tilted cover ' + label + ' ' + path)
            await visit(window, origin, path)
            result.routes.push({ path, ...(await checkCover(window)) })
        }

        await visit(window, origin, '/profile/notes/?view=course-packages')
        const href = await evaluate(window, () =>
            document.querySelector('[data-tilted-cover]').closest('a').getAttribute('href'),
        )
        await evaluate(window, () => {
            window.__tiltedCoverProbe = document.querySelector('[data-tilted-cover]')
        })
        await click(window, coverSelector)
        await waitFor(
            window,
            (path) => location.pathname === path,
            'original cover navigation',
            href,
        )
        await ready(window)
        assert.equal(await evaluate(window, () => window.__tiltedCoverProbe.isConnected), false)
        assert.deepEqual(await listeners(window, 'window.__tiltedCoverProbe'), [])
        assert.equal(await evaluate(window, () => window.__tiltedCoverProbe.style.length), 0)
        result.interactions.push('cover link and SPA listener/style cleanup')

        for (const path of ['/profile/favorites/', '/profile/works/']) {
            await visit(window, origin, path)
            await evaluate(window, () =>
                document.querySelectorAll('button').forEach((button) => {
                    if (button.textContent.trim() === '编辑') button.dataset.coverEdit = ''
                }),
            )
            await click(window, '[data-cover-edit]')
            await waitFor(
                window,
                () => document.querySelector('article input[type="checkbox"]') !== null,
                'edit overlay',
            )
            await click(window, coverSelector)
            assert.equal(
                await evaluate(window, () => document.querySelector('article input').checked),
                true,
            )
            assert.equal((await snapshot(window)).active, false)
            result.interactions.push(path + ' original selection and static editing')
        }

        await visit(window, origin, '/pk/')
        await click(window, 'button[aria-label="创建房间"]')
        const course = '[role="dialog"] [data-tilted-cover]'
        await ready(window, course)
        result.routes.push({
            path: 'PK course selection dialog',
            ...(await checkCover(window, course)),
        })
        const candidates = await evaluate(window, () =>
            Array.from(document.querySelectorAll('[role="dialog"] label'))
                .filter((label) => label.querySelector('[data-tilted-cover]'))
                .map((label, index) => {
                    label.dataset.coverCandidate = String(index)
                    return label.querySelector('input').getAttribute('aria-label')
                }),
        )
        assert.ok(candidates.length >= 4)
        await click(window, '[data-cover-candidate="1"] [data-tilted-cover]')
        await waitFor(
            window,
            () =>
                document.querySelector('[data-cover-candidate="1"] [data-card-radio="true"]')
                    ?.dataset.checked === 'true',
            'controlled PK selection updates',
        )
        assert.equal(
            await evaluate(
                window,
                () => document.querySelector('[data-cover-candidate="1"] input').checked,
            ),
            true,
        )
        assert.equal(
            await evaluate(
                window,
                () =>
                    getComputedStyle(
                        document.querySelector(
                            '[data-cover-candidate="1"] [data-card-radio="true"]',
                        ),
                    ).zIndex,
            ),
            '10',
        )
        result.interactions.push('PK original course radio selection')
        await delay(80)
        result.screenshots.push(await capture(window, label.toLowerCase() + '-pk-selection'))

        await visit(window, origin, '/foreign-language-guide/courses/winter-speaking/')
        await evaluate(window, () => {
            window.__coverAlerts = []
            window.alert = (message) => window.__coverAlerts.push(message)
        })
        await click(window, 'button[aria-label="播放课程介绍"]')
        assert.deepEqual(await evaluate(window, () => window.__coverAlerts), [
            '课程介绍视频暂未开放',
        ])
        result.interactions.push('original course introduction action')

        await visit(window, origin, '/awakening/')
        const rect = await bounds(window, coverSelector)
        await mouse(window, rect.x + rect.width * 0.25, rect.y + rect.height * 0.25)
        await waitFor(
            window,
            () => document.querySelector('[data-tilted-cover]').dataset.tilted === 'true',
            'before reduced motion',
        )
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        })
        await waitFor(
            window,
            () => document.querySelector('[data-tilted-cover]').dataset.tilted === undefined,
            'dynamic reduced motion',
        )
        await mouse(window, rect.x + rect.width * 0.75, rect.y + rect.height * 0.75)
        await delay(60)
        assert.equal((await snapshot(window)).active, false)
        await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        })
        await waitFor(
            window,
            () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
            'motion preference restored',
        )
        await delay(80)
        await evaluate(window, () => {
            const cover = document.querySelector('[data-tilted-cover]')
            cover.dispatchEvent(
                new PointerEvent('pointermove', {
                    pointerType: 'touch',
                    clientX: 500,
                    clientY: 400,
                }),
            )
        })
        assert.equal((await snapshot(window)).active, false)
        result.interactions.push('dynamic reduced motion; injected touch pointer stays static')

        await mouse(window, 0, 0)
        const restoredRect = await bounds(window, coverSelector)
        await mouse(
            window,
            restoredRect.x + restoredRect.width * 0.3,
            restoredRect.y + restoredRect.height * 0.3,
        )
        await waitFor(
            window,
            () => document.querySelector('[data-tilted-cover]').dataset.tilted === 'true',
            'before blur',
        )
        await evaluate(window, () => window.dispatchEvent(new Event('blur')))
        await waitFor(
            window,
            () => document.querySelector('[data-tilted-cover]').dataset.tilted === undefined,
            'blur event resets',
        )
        result.interactions.push('injected window blur resets the cover')

        for (const theme of ['dark', 'light']) {
            window.setContentSize(1920, 1080)
            await evaluate(
                window,
                (value) => {
                    document.documentElement.dataset.theme = value
                },
                theme,
            )
            await checkCover(window)
            const next = await bounds(window, coverSelector)
            await mouse(window, next.x + next.width * 0.8, next.y + next.height * 0.2)
            await delay(200)
            result.screenshots.push(
                await capture(window, label.toLowerCase() + '-' + theme + '-pc'),
            )
        }
        for (const width of [1280, 1440, 2560]) {
            window.setContentSize(width, 900)
            await checkCover(window)
        }
        window.setContentSize(1920, 1080)
        for (const zoom of [1.25, 1.5, 2]) {
            console.log('Tilted cover ' + label + ' zoom ' + zoom)
            window.webContents.setZoomFactor(zoom)
            await checkCover(window)
        }
        window.webContents.setZoomFactor(1)
        result.interactions.push('PC widths 1280/1440/1920/2560 and real zoom 125/150/200 percent')
        result.status = 'passed'
        return result
    } finally {
        window.webContents.setZoomFactor(1)
        if (window.webContents.debugger.isAttached()) window.webContents.debugger.detach()
    }
}

void runStandalonePanelMotionSmoke({
    reportName: 'tilted-cover-runtime-validation',
    runChecks,
    activateWindow: false,
    timeoutMs: 300000,
})
