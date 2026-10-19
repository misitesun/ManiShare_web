import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeContentDialog, PracticeContentList } from './PracticeContentDialog'
import type { PracticeQuestion } from '../model/practice-demo'
import type { PracticeContentDisplay } from '../model/practice-content-dialog'

const questions: readonly PracticeQuestion[] = Array.from({ length: 60 }, (_, index) => ({
    id: `question-${index}`,
    english: `English content ${index}`,
    translation: `中文内容${index}`,
    phonetic: '',
    tokens: [],
}))

function renderList(display: PracticeContentDisplay): string {
    return renderToStaticMarkup(
        createElement(PracticeContentList, {
            questions,
            currentIndex: 12,
            display,
            onSelect: (): void => undefined,
        }),
    )
}

test('长内容列表保留全部题目和顺序，只标识当前题，不在预渲染中裁掉后续数据', (): void => {
    const html = renderList('chinese')
    assert.equal((html.match(/data-practice-content-question="/g) ?? []).length, 60)
    assert.equal((html.match(/aria-current="true"/g) ?? []).length, 1)
    assert.match(html, /第13题，中文内容12/)
    assert.match(html, /第60题，中文内容59/)
    assert.doesNotMatch(html, /English content/)
})

test('三种显示只渲染对应语言，双语顺序和题目文本保持一致', (): void => {
    const english = renderList('english')
    assert.match(english, /lang="en"/)
    assert.doesNotMatch(english, /中文内容|lang="zh-CN"/)
    const bilingual = renderList('bilingual')
    assert.equal((bilingual.match(/lang="en"/g) ?? []).length, 60)
    assert.equal((bilingual.match(/lang="zh-CN"/g) ?? []).length, 60)
    assert.ok(bilingual.indexOf('English content 0') < bilingual.indexOf('中文内容0'))
})

test('空列表有中文空态，弹窗挂载前不读取浏览器或提前创建Portal', (): void => {
    const props = {
        questions: [],
        currentIndex: 0,
        onSelect: (): void => undefined,
    }
    assert.match(
        renderToStaticMarkup(createElement(PracticeContentList, { ...props, display: 'chinese' })),
        /暂无练习内容/,
    )
    assert.equal(
        renderToStaticMarkup(
            createElement(PracticeContentDialog, {
                ...props,
                open: true,
                onClose: (): void => undefined,
            }),
        ),
        '',
    )
})
