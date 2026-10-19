import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import rememberAnimation from '../assets/word-card-remember.json'
import { WordRememberFeedback } from './WordRememberFeedback'

test('记住反馈素材保留原始数据和60fps连续时间轴，自包含且没有图片、字体或表达式', (): void => {
    const data = readFileSync(new URL('../assets/word-card-remember.json', import.meta.url))
    assert.equal(data.byteLength, 54178)
    assert.equal(
        createHash('sha256').update(data).digest('hex'),
        '1e30bd5a764bbe2dac93f7388e03c590f1ff3e3810e4e9f84b2aa1568d08c87f',
    )
    assert.equal(rememberAnimation.w, 1080)
    assert.equal(rememberAnimation.h, 1080)
    assert.equal(rememberAnimation.fr, 60)
    assert.equal(rememberAnimation.ip, 0)
    assert.equal(rememberAnimation.op, 151)
    assert.equal(
        (rememberAnimation.op - rememberAnimation.ip) / rememberAnimation.fr / 1.5,
        151 / 90,
    )
    assert.deepEqual(rememberAnimation.assets, [])
    assert.deepEqual(
        rememberAnimation.layers.map((layer) => layer.nm),
        ['Shape Layer 3', 'Tick', 'Circle 3', 'Elements - 1', 'Elements - 2'],
    )
    assert.doesNotMatch(data.toString('utf8'), /"(?:fonts|chars|refId)"|https?:\/\/|"x"\s*:\s*"/)
})

test('未激活时不渲染动画槽或调用完成回调', (): void => {
    const html = renderToStaticMarkup(
        createElement(WordRememberFeedback, {
            active: false,
            onComplete: (): void => assert.fail('预渲染不得完成业务动作'),
        }),
    )
    assert.equal(html, '')
})

test('激活首帧确定且只渲染绝对定位装饰槽，不在预渲染创建播放器或完成动作', (): void => {
    let completed = 0
    function render(): string {
        return renderToStaticMarkup(
            createElement(WordRememberFeedback, {
                active: true,
                onComplete: (): void => {
                    completed += 1
                },
            }),
        )
    }
    const html = render()
    assert.equal(render(), html)
    assert.equal(completed, 0)
    assert.match(html, /data-word-remember-feedback="true"/)
    assert.match(html, /aria-hidden="true"/)
    assert.match(html, /pointer-events-none absolute left-0 top-0/)
    assert.match(html, /size-\[66px\]/)
    assert.match(html, /data-word-remember-player="true"/)
    assert.match(html, /size-\[158\.4px\]/)
    assert.doesNotMatch(html, /<(?:svg|canvas|audio|video|button)\b|data-lottie-status/)
})
