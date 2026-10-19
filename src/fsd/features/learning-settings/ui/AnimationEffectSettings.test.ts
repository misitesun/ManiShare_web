import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultPreferences } from '../model/preferences'
import { AnimationEffectSettings } from './AnimationEffectSettings'
import { LearningAudioWave } from './LearningAudioWave'

function ignore(): void {}

test('七份动画可访问单选，服务端首帧不创建播放器；关闭后不渲染对应预览', (): void => {
    const html = renderToStaticMarkup(
        createElement(AnimationEffectSettings, {
            values: { ...defaultPreferences, correctEffectType: 'lottie-6' },
            update: ignore,
        }),
    )
    assert.equal((html.match(/type="radio"/g) ?? []).length, 7)
    const selected = (html.match(/<input[^>]+>/g) ?? []).find((input) =>
        input.includes('value="lottie-6"'),
    )
    assert.ok(selected?.includes('checked=""'))
    assert.match(html, /章节完成特效预览/)
    assert.doesNotMatch(html, /<svg|<canvas/)
    const disabled = renderToStaticMarkup(
        createElement(AnimationEffectSettings, {
            values: { ...defaultPreferences, correctEffect: false, completionEffect: false },
            update: ignore,
        }),
    )
    assert.doesNotMatch(disabled, /type="radio"|章节完成特效预览/)
})

test('两份声纹实例的渐变ID互不冲突，五种样式与停止状态可确定预渲染', (): void => {
    const two = renderToStaticMarkup(
        createElement(
            'div',
            null,
            createElement(LearningAudioWave, { style: '波形线条' }),
            createElement(LearningAudioWave, { style: '波形线条' }),
        ),
    )
    const ids = [...two.matchAll(/linearGradient id="([^"]+)"/g)].map((match) => match[1])
    assert.equal(ids.length, 2)
    assert.equal(new Set(ids).size, 2)
    for (const style of ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条']) {
        const html = renderToStaticMarkup(
            createElement(LearningAudioWave, { style, active: false }),
        )
        assert.match(html, /data-wave-active="false"/)
        assert.equal(html.includes('<canvas'), false)
    }
})
