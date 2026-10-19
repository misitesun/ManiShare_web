import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getWordCardOutlineRadius } from './word-card-outline'

interface RadiusRatios {
    readonly x: number
    readonly y: number
}

function getRadiusRatios(depth: 'front' | 'near' | 'far'): RadiusRatios {
    const match = /^([\d.]+)% \/ ([\d.]+)%$/.exec(getWordCardOutlineRadius(depth))
    assert.ok(match)
    return { x: Number(match[1]) / 100, y: Number(match[2]) / 100 }
}

test('内容裁切轮廓取自各层原SVG外缘，不将背景卡误用前卡20px圆角', (): void => {
    for (const [depth, asset] of [
        ['front', 'word-card-gradient-border.svg'],
        ['near', 'word-card-back-near.svg'],
        ['far', 'word-card-back-far.svg'],
    ] as const) {
        const svg = readFileSync(new URL(`../assets/${asset}`, import.meta.url), 'utf8')
        const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
        const radius = /<rect[^>]*\brx="([\d.]+)"/.exec(svg)
        assert.ok(viewBox)
        assert.ok(radius)
        const ratio = getRadiusRatios(depth)
        const outerRadius = Number(radius[1]) + 0.5
        assert.ok(Math.abs(ratio.x * Number(viewBox[1]) - outerRadius) < 0.000001)
        assert.ok(Math.abs(ratio.y * Number(viewBox[2]) - outerRadius) < 0.000001)
    }
})

test('500px卡面经过原近远层缩放后，图像与边框的水平垂直半径均为24px', (): void => {
    for (const [depth, scaleX, scaleY] of [
        ['near', 492 / 500, 472 / 500],
        ['far', 492 / 500, 444 / 500],
    ] as const) {
        const radius = getRadiusRatios(depth)
        assert.ok(Math.abs(radius.x * 500 * scaleX - 24) < 0.000001)
        assert.ok(Math.abs(radius.y * 500 * scaleY - 24) < 0.000001)
    }
    assert.equal(getWordCardOutlineRadius('front'), '4% / 4%')
})

test('流式变宽或内容变高时仍按SVG横纵比例裁切，不依赖固定500px画布', (): void => {
    const radius = getRadiusRatios('far')
    assert.ok(Math.abs(radius.x * 250 - (24 * 250) / 492) < 0.000001)
    assert.ok(Math.abs(radius.y * 620 - (24 * 620) / 444) < 0.000001)
    assert.notEqual(radius.x, radius.y, '非正方形原SVG必须保留椭圆裁切比例')
})
