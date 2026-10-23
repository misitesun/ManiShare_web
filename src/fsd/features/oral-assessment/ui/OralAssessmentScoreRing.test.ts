import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OralAssessmentScoreRing } from './OralAssessmentScoreRing'
import { OralAssessmentScore } from './OralAssessmentScore'
import { createOralAssessmentSample } from '../model/oral-assessment'

test('紧凑圆环只展示归一化总分，进度与可访问数值一致', (): void => {
    for (const [input, score] of [
        [96, 96],
        [-10, 0],
        [120, 100],
        [NaN, 0],
        [85.99, 85.9],
    ] as const) {
        const html = renderToStaticMarkup(
            createElement(OralAssessmentScoreRing, { score: input, compact: true, animate: true }),
        )
        assert.equal(html.match(/role="meter"/g)?.length, 1)
        assert.match(html, new RegExp(`aria-valuenow="${score}"`))
        assert.ok(html.includes(`stroke-dasharray="${score} 100"`))
        assert.doesNotMatch(html, /准确度|流畅度|完整度|PERFECT|<button/)
    }
})

test('原详细评分继续展示等级和三项指标，不增加第四个计量值', (): void => {
    const result = createOralAssessmentSample(
        { id: 'hat', text: 'hat', translation: '帽子', kind: 'word' },
        96,
    )
    const html = renderToStaticMarkup(createElement(OralAssessmentScore, { result }))
    assert.match(html, /PERFECT/)
    assert.match(html, /准确度/)
    assert.match(html, /流畅度/)
    assert.match(html, /完整度/)
    assert.equal(html.match(/role="meter"/g)?.length, 3)
    assert.match(html, /data-oral-score-ring="default"/)
})
