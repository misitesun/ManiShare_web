const { isExportedPageRequest } = require('./login-request-kind.cjs')
const assert = require('node:assert/strict')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

async function evaluate(window, operation, ...args) {
    return window.webContents.executeJavaScript(
        '(' + operation.toString() + ')(...' + JSON.stringify(args) + ')',
    )
}

async function fill(window, name, value) {
    await evaluate(
        window,
        (fieldName, nextValue) => {
            const input = document.querySelector('input[name="' + fieldName + '"]')
            if (!input) throw new Error('Missing login field: ' + fieldName)
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
                input,
                nextValue,
            )
            input.dispatchEvent(new Event('input', { bubbles: true }))
        },
        name,
        value,
    )
}

async function clickText(window, text) {
    await evaluate(
        window,
        (label) => {
            const button = Array.from(document.querySelectorAll('button')).find(
                (element) => element.textContent.replace(/\s+/g, '') === label,
            )
            if (!button) throw new Error('Missing login action: ' + label)
            button.click()
        },
        text,
    )
}

async function loginFlow(window, origin, label, waitFor) {
    const accountRequests = []
    const pageRequests = []
    const pageManifest = JSON.parse(
        readFileSync(resolve('dist/production/.csp-manifest.json'), 'utf8'),
    )
    const exportedPages = new Set(
        Object.keys(pageManifest)
            .filter((path) => path.endsWith('index.html'))
            .map((path) => '/' + path.slice(0, -'index.html'.length)),
    )
    const session = window.webContents.session
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
        const staticPage = isExportedPageRequest(details, origin, exportedPages)
        if (staticPage) pageRequests.push({ path: url.pathname, type: details.resourceType })
        if (
            url.pathname.startsWith('/api/') ||
            ((details.resourceType === 'xhr' || details.resourceType === 'fetch') &&
                !staticPage &&
                !url.pathname.endsWith('.txt') &&
                !url.pathname.startsWith('/_next/'))
        )
            accountRequests.push({
                url: details.url,
                method: details.method,
                path: url.pathname,
                type: details.resourceType,
                search: url.search,
                rsc:
                    Object.entries(details.requestHeaders).find(
                        ([key]) => key.toLowerCase() === 'rsc',
                    )?.[1] ?? null,
                accept:
                    Object.entries(details.requestHeaders).find(
                        ([key]) => key.toLowerCase() === 'accept',
                    )?.[1] ?? null,
            })
        callback({ requestHeaders: details.requestHeaders })
    })
    const result = { label, views: [], accountRequests, pageRequests, zoom: [] }
    const screenshot = async (name) => {
        await waitFor(
            window,
            'Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)',
            'login screenshot assets',
        )
        await new Promise((resolvePaint) => setTimeout(resolvePaint, 250))
        const image = await window.webContents.capturePage()
        writeFileSync(
            resolve('dist', 'login-' + label.toLowerCase() + '-' + name + '.png'),
            image.toPNG(),
        )
    }
    const viewReady = async (view) => {
        await waitFor(
            window,
            'new URLSearchParams(location.search).get("view") === ' +
                JSON.stringify(view) +
                ' && !!document.querySelector("#login-card-title")',
            'login ' + view,
        )
    }
    const feedbackStub = async () => {
        await evaluate(window, () => {
            window.alert = (message) => {
                window.loginTestFeedback = message
            }
        })
    }
    const feedback = async (text) => {
        await waitFor(
            window,
            'String(window.loginTestFeedback).includes(' + JSON.stringify(text) + ')',
            'login feedback',
        )
    }
    try {
        window.setContentSize(1920, 1080)
        window.webContents.setZoomFactor(1)
        await window.loadURL(origin + '/login/?keep=1')
        await waitFor(window, '!!document.querySelector("#login-headline")', 'login introduction')
        await feedbackStub()
        result.introduction = await evaluate(window, () => {
            const measure = (element) => {
                const rect = element.getBoundingClientRect()
                const style = getComputedStyle(element)
                return {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    font: style.fontSize,
                    line: style.lineHeight,
                    weight: style.fontWeight,
                    spacing: style.letterSpacing,
                }
            }
            return {
                primary: measure(document.querySelector('#login-headline > span')),
                secondary: measure(document.querySelector('#login-headline > span:last-child')),
                wings: measure(document.querySelector('section img')),
                logo: measure(document.querySelector('header img')),
            }
        })
        assert.equal(result.introduction.primary.x, 789)
        assert.equal(result.introduction.primary.y, 293)
        assert.equal(result.introduction.secondary.x, 723)
        assert.equal(result.introduction.secondary.y, 405)
        assert.equal(result.introduction.wings.x, 825)
        assert.equal(result.introduction.wings.y, 580)
        await screenshot('welcome')
        await clickText(window, '登录')
        await viewReady('wechat')
        assert.match(await snapshotText(window), /暂不可扫码授权/)
        await screenshot('wechat')
        await clickText(window, '手机号登录')
        await viewReady('phone-password')
        const geometry = await evaluate(window, () => {
            const box = (element) => {
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
            return {
                viewport: [innerWidth, innerHeight],
                card: box(document.querySelector('[data-login-card]')),
                title: box(document.querySelector('#login-card-title')),
                input: box(document.querySelector('#login-account').parentElement),
                inputText: box(document.querySelector('#login-account')),
                submit: box(document.querySelector('button[type="submit"]')),
            }
        })
        result.reference = geometry
        result.maskComposite = await evaluate(
            window,
            () =>
                getComputedStyle(document.querySelector('[data-login-card]').firstElementChild)
                    .maskComposite,
        )
        assert.equal(
            result.maskComposite,
            'exclude, add',
            'glass border must not cover the card contents',
        )
        assert.deepEqual(geometry.viewport, [1920, 1080])
        assert.equal(geometry.card.width, 460)
        assert.equal(geometry.card.height, 610)
        assert.equal(geometry.card.x, 730)
        assert.equal(geometry.card.y, 235)
        assert.equal(geometry.title.fontSize, '22px')
        assert.equal(geometry.title.lineHeight, '31px')
        assert.equal(geometry.input.width, 400)
        assert.equal(geometry.input.height, 46)
        assert.equal(geometry.input.y, 412)
        assert.equal(geometry.inputText.fontSize, '14px')
        const accountIconX = await evaluate(
            window,
            () =>
                document
                    .querySelector('#login-account')
                    .parentElement.querySelector('img')
                    .getBoundingClientRect().x,
        )
        assert.equal(accountIconX, 772)
        result.reference.accountIconX = accountIconX
        assert.equal(geometry.submit.fontSize, '16px')
        assert.equal(geometry.submit.y, 573)
        await screenshot('phone')
        await fill(window, 'account', '13800138000')
        await fill(window, 'password', 'preview-password')
        await evaluate(window, () => document.querySelector('[aria-label="显示密码"]').click())
        await waitFor(
            window,
            'document.querySelector("#login-password").type === "text"',
            'password reveal',
        )
        await evaluate(window, () => document.querySelector('[aria-label="隐藏密码"]').click())
        await waitFor(
            window,
            'document.querySelector("#login-password").type === "password"',
            'password hide',
        )
        await evaluate(window, () => document.querySelector('[aria-label="清空账号"]').click())
        await waitFor(
            window,
            'document.querySelector("#login-account").value === "" && document.activeElement.id === "login-account"',
            'account clear and focus',
        )
        await evaluate(window, () => document.querySelector('form').requestSubmit())
        await waitFor(
            window,
            '!!document.querySelector("#login-account-error")',
            'required account error',
        )
        await fill(window, 'account', '13800138000')
        await evaluate(window, () => document.querySelector('form').requestSubmit())
        await feedback('未登录')
        await clickText(window, '验证码登录')
        await viewReady('phone-code')
        await clickText(window, '发送验证码')
        await waitFor(
            window,
            '!!document.querySelector("#login-account-error")',
            'code account validation',
        )
        await fill(window, 'account', '13800138000')
        await clickText(window, '发送验证码')
        await feedback('未发送验证码')
        await fill(window, 'code', 'preview-code')
        await evaluate(window, () => document.querySelector('form').requestSubmit())
        await feedback('未登录')
        await screenshot('phone-code')
        await clickText(window, '海外邮箱登录')
        await viewReady('email-password')
        await fill(window, 'account', 'preview@example.com')
        await fill(window, 'password', 'preview-password')
        await screenshot('email-filled')
        await clickText(window, '验证码登录')
        await viewReady('email-code')
        await fill(window, 'account', 'preview@example.com')
        await clickText(window, '发送验证码')
        await feedback('邮箱验证码服务尚未接入')
        await screenshot('email-code')
        await clickText(window, '还没有账号？新用户立即注册')
        await viewReady('register-email')
        await evaluate(window, () => document.querySelector('form').requestSubmit())
        await waitFor(
            window,
            '!!document.querySelector("#login-agreed-error")',
            'register agreement required',
        )
        await fill(window, 'account', 'preview@example.com')
        await fill(window, 'code', 'preview-code')
        await fill(window, 'password', 'preview-password')
        await evaluate(window, () => document.querySelector('input[name="agreed"]').click())
        await evaluate(window, () => document.querySelector('form').requestSubmit())
        await feedback('未创建账号')
        await screenshot('register-email')
        await clickText(window, '手机号注册')
        await viewReady('register-phone')
        await screenshot('register-phone')
        await clickText(window, '微信注册')
        await viewReady('register-wechat')
        await screenshot('register-wechat')
        for (const view of [
            'phone-password',
            'phone-code',
            'email-password',
            'email-code',
            'wechat',
            'register-phone',
            'register-email',
            'register-wechat',
        ]) {
            await window.loadURL(origin + '/login/?view=' + view + '&keep=1')
            await viewReady(view)
            const state = await evaluate(window, () => ({
                preserved: new URLSearchParams(location.search).get('keep') === '1',
                inputsEmpty: Array.from(
                    document.querySelectorAll('input:not([type="checkbox"])'),
                ).every((input) => input.value === ''),
                brokenImages: Array.from(document.images)
                    .filter((image) => !image.complete || !image.naturalWidth)
                    .map((image) => image.src),
                overflow: document.documentElement.scrollWidth > innerWidth,
            }))
            await waitFor(
                window,
                'Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)',
                'login assets loaded',
            )
            assert.equal(state.preserved, true)
            assert.equal(state.inputsEmpty, true)
            assert.equal(state.overflow, false)
            result.views.push(view)
        }
        await window.loadURL(origin + '/login/?view=phone-password')
        await viewReady('phone-password')
        result.reflow = []
        for (const [width, height] of [
            [1280, 720],
            [1440, 900],
            [2560, 1440],
        ]) {
            window.setContentSize(width, height)
            await waitFor(
                window,
                'innerWidth === ' + width + ' && innerHeight === ' + height,
                'PC reflow resize settled',
            )
            const state = await evaluate(window, () => ({
                viewport: [innerWidth, innerHeight],
                overflow: document.documentElement.scrollWidth > innerWidth,
                cardWidth: document.querySelector('[data-login-card]').getBoundingClientRect()
                    .width,
            }))
            assert.equal(state.overflow, false)
            assert.equal(state.cardWidth, 460)
            result.reflow.push(state)
        }
        window.setContentSize(1920, 1080)
        await waitFor(
            window,
            'innerWidth === 1920 && innerHeight === 1080',
            'zoom baseline settled',
        )
        for (const zoom of [1.25, 1.5, 2]) {
            window.webContents.setZoomFactor(zoom)
            await waitFor(
                window,
                'Math.abs(innerWidth - ' +
                    1920 / zoom +
                    ') <= 1 && Math.abs(innerHeight - ' +
                    1080 / zoom +
                    ') <= 1',
                'real browser zoom settled',
            )
            const state = await evaluate(window, () => ({
                width: innerWidth,
                height: innerHeight,
                horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
                titleVisible: !!document.querySelector('#login-card-title'),
                inputFont: getComputedStyle(document.querySelector('#login-account')).fontSize,
            }))
            assert.equal(state.horizontalOverflow, false)
            assert.equal(state.titleVisible, true)
            assert.equal(state.inputFont, '14px')
            result.zoom.push({ factor: zoom, ...state })
        }
        window.webContents.setZoomFactor(1)
        await waitFor(window, 'innerWidth === 1920 && innerHeight === 1080', 'zoom reset settled')
        await screenshot('zoom-reset')
        await window.loadURL(origin + '/settings/?tab=appearance')
        await waitFor(
            window,
            '!!document.querySelector(\'input[aria-label="白天模式"]\') && !document.querySelector("fieldset").disabled',
            'login light theme control',
        )
        await evaluate(window, () => document.querySelector('input[aria-label="白天模式"]').click())
        await waitFor(
            window,
            'document.documentElement.dataset.theme === "light"',
            'login light theme',
        )
        await window.loadURL(origin + '/login/?view=phone-password')
        await viewReady('phone-password')
        result.light = await evaluate(window, () => ({
            theme: document.documentElement.dataset.theme,
            foreground: getComputedStyle(document.querySelector('#login-account')).color,
            background: getComputedStyle(document.querySelector('[data-login-card]'))
                .backgroundImage,
            overflow: document.documentElement.scrollWidth > innerWidth,
        }))
        assert.equal(result.light.theme, 'light')
        assert.equal(result.light.foreground, 'rgb(23, 32, 29)')
        assert.equal(result.light.overflow, false)
        await screenshot('light')
        await evaluate(window, () => document.querySelector('header button').click())
        await waitFor(window, '!!document.querySelector("#login-headline")', 'light welcome')
        result.lightWelcome = await evaluate(window, () => ({
            canvas: getComputedStyle(document.querySelector('main')).backgroundColor,
            actionText: getComputedStyle(document.querySelector('section button')).color,
        }))
        assert.equal(result.lightWelcome.canvas, 'rgb(0, 0, 0)')
        assert.equal(result.lightWelcome.actionText, 'rgb(255, 255, 255)')
        await screenshot('light-welcome')
        await window.loadURL(origin + '/settings/?tab=appearance')
        await waitFor(
            window,
            '!!document.querySelector(\'input[aria-label="夜间模式"]\') && !document.querySelector("fieldset").disabled',
            'login restore theme control',
        )
        await evaluate(window, () => document.querySelector('input[aria-label="夜间模式"]').click())
        await waitFor(
            window,
            'document.documentElement.dataset.theme === "dark"',
            'login theme restored',
        )
        assert.deepEqual(
            accountRequests,
            [],
            'frontend authentication must not send account requests',
        )
        result.status = 'passed'
        return result
    } finally {
        window.webContents.setZoomFactor(1)
        window.setContentSize(1440, 900)
        session.webRequest.onBeforeSendHeaders(null)
    }
}

async function snapshotText(window) {
    return evaluate(window, () => document.body.innerText)
}

module.exports = { loginFlow }
