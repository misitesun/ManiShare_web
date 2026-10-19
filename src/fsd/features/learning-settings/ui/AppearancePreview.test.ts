import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultPreferences, preferenceGroups, parsePreferences } from '../model/preferences'
import { AppearancePreview } from './AppearancePreview'

test('外观按确认顺序展示五个模块，题目与答案音标的默认值相互独立', (): void => {
    assert.deepEqual(
        preferenceGroups.appearance.map(({ title }) => title),
        ['主题相关', '答题页面颜色', '答题显示', '答案显示', '声纹设置'],
    )
    const html = renderToStaticMarkup(
        createElement(AppearancePreview, { values: defaultPreferences }),
    )
    assert.doesNotMatch(html, /aria-label="答题音标"/)
    assert.match(html, /aria-label="答案音标"/)
    assert.match(html, /词性 · 感叹词/)
    assert.match(html, /Hello! · 语法结构/)
    assert.doesNotMatch(html, /data-grammar-fill|预览答题正确特效|预览课程完成特效/)
})

test('答案音标、词性、语法文字分别响应设置，不与答题音标或填充色捆绑', (): void => {
    const values = parsePreferences({
        version: 1,
        values: {
            ...defaultPreferences,
            showPhonetics: true,
            showAnswerPhonetics: false,
            showPartOfSpeech: false,
            showGrammarText: true,
            showGrammarFill: true,
        },
    })
    const html = renderToStaticMarkup(createElement(AppearancePreview, { values }))
    assert.match(html, /aria-label="答题音标"/)
    assert.doesNotMatch(html, /aria-label="答案音标"|词性 · 感叹词/)
    assert.match(html, /Hello! · 语法结构/)
    assert.match(html, /data-grammar-fill/)
    const hidden = renderToStaticMarkup(
        createElement(AppearancePreview, { values: { ...values, showGrammarText: false } }),
    )
    assert.doesNotMatch(hidden, /语法结构|data-grammar-fill/)
})
