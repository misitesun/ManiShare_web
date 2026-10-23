import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

function render(reading?: PracticeReadingView): string {
    return renderToStaticMarkup(createElement(PracticeReadingOverlay, { reading }))
}

test('没有朗读展示数据时不渲染遮罩或声纹', (): void => {
    assert.equal(render(), '')
})

test('缺音源显示静态声纹和明确的待接入说明，不创建媒体或播放器', (): void => {
    const html = render({ status: 'pending-source', waveStyle: '默认竖条' })
    assert.match(html, /data-practice-reading-overlay="pending-source"/)
    assert.match(html, /data-wave-active="false"/)
    assert.match(html, /音源待接入/)
    assert.match(html, /role="status" aria-live="polite"/)
    assert.match(html, /pointer-events-none absolute inset-x-0 bottom-0/)
    assert.match(html, /from-media-ink\/80 to-transparent/)
    assert.doesNotMatch(html, /<(?:audio|video|canvas|button)\b/)
})

test('真实playing状态才启用声纹动画，不显示缺源或阻止提示', (): void => {
    const html = render({ status: 'playing', waveStyle: '矩阵方块' })
    assert.match(html, /data-practice-reading-overlay="playing"/)
    assert.match(html, /data-audio-wave="矩阵方块"/)
    assert.match(html, /data-wave-active="true"/)
    assert.doesNotMatch(html, /音源待接入|点击朗读重试/)
    assert.doesNotMatch(html, /<(?:audio|video|canvas|button)\b/)
})

test('播放受阻显示静态声纹和手动重试提示，允许提供具体错误说明', (): void => {
    const blocked = render({ status: 'blocked-playback', waveStyle: '雨滴点阵' })
    assert.match(blocked, /data-wave-active="false"/)
    assert.match(blocked, /点击朗读重试/)
    assert.doesNotMatch(blocked, /音源待接入/)
    const described = render({
        status: 'blocked-playback',
        waveStyle: '雨滴点阵',
        message: '浏览器尚未允许播放，请点击朗读重试。',
    })
    assert.match(described, /浏览器尚未允许播放，请点击朗读重试。/)
})

test('五种设置朗读样式原样传递且缺源首帧可确定预渲染', (): void => {
    for (const waveStyle of ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条']) {
        const reading: PracticeReadingView = { status: 'pending-source', waveStyle }
        const html = render(reading)
        assert.equal(render(reading), html)
        assert.ok(html.includes(`data-audio-wave="${waveStyle}"`))
        assert.match(html, /data-wave-active="false"/)
        assert.doesNotMatch(html, /<(?:audio|video|canvas)\b/)
    }
})

test('紧凑音标遮罩沿用五种朗读动画，不创建媒体或拦截操作', (): void => {
    for (const waveStyle of ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条']) {
        const html = renderToStaticMarkup(
            createElement(PracticeReadingOverlay, {
                reading: { status: 'playing', waveStyle },
                compact: true,
            }),
        )
        assert.match(html, /data-practice-reading-overlay="playing"/)
        assert.ok(html.includes(`data-audio-wave="${waveStyle}"`))
        assert.match(html, /data-wave-active="true"/)
        assert.match(html, /pointer-events-none/)
        assert.doesNotMatch(html, /<(?:audio|video|button)\b/)
    }
})

test('同一播放队列等待下一音段时保留静态遮罩，不显示缺源或重试提示', (): void => {
    const html = render({ status: 'waiting', waveStyle: '默认竖条' })
    assert.match(html, /data-practice-reading-overlay="waiting"/)
    assert.match(html, /data-wave-active="false"/)
    assert.doesNotMatch(html, /音源待接入|点击朗读重试|role="status"/)
})
