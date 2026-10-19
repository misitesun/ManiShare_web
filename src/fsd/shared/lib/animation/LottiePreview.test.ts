import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { LottieData } from './lottie-playback'
import { LottiePreview } from './LottiePreview'

test('静态预渲染不加载播放器或动画数据，多个预览首帧保持确定', (): void => {
    let loads = 0
    async function loadData(): Promise<LottieData> {
        loads += 1
        return { w: 100, h: 100, fr: 30, ip: 0, op: 30, layers: [] }
    }
    const render = (): string =>
        renderToStaticMarkup(
            createElement(
                'div',
                null,
                createElement(LottiePreview, { loadData }),
                createElement(LottiePreview, { loadData, revision: 2 }),
            ),
        )
    assert.equal(render(), render())
    assert.equal(loads, 0)
    assert.doesNotMatch(render(), /<svg|<canvas|data-lottie-status/)
})
