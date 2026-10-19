import assert from 'node:assert/strict'
import test from 'node:test'
import { practiceDemos } from './practice-demo'
import {
    getPracticeContentLines,
    practiceContentDisplayOptions,
    resolvePracticeContentDisplay,
    usesPracticeContentDialog,
} from './practice-content-dialog'

const question = { english: 'Thanks for your message.', translation: '谢谢你的留言。' }

test('专用内容弹窗仅用于单词和句子族，与小模式无关', (): void => {
    for (const demo of practiceDemos) {
        assert.equal(
            usesPracticeContentDialog(demo.family),
            demo.family === 'word' || demo.family === 'sentence',
            demo.id,
        )
    }
})

test('三种显示选项保持设计顺序，空值或未知值默认中文', (): void => {
    assert.deepEqual(practiceContentDisplayOptions, [
        { id: 'chinese', label: '显示中文' },
        { id: 'english', label: '显示英文' },
        { id: 'bilingual', label: '双语显示' },
    ])
    for (const value of ['', 'chinese', 'invalid'])
        assert.equal(resolvePracticeContentDisplay(value), 'chinese')
    assert.equal(resolvePracticeContentDisplay('english'), 'english')
    assert.equal(resolvePracticeContentDisplay('bilingual'), 'bilingual')
})

test('中文和英文模式只输出指定内容，双语保持英文在上、中文在下', (): void => {
    assert.deepEqual(getPracticeContentLines(question, 'chinese'), [
        { language: 'zh-CN', text: question.translation },
    ])
    assert.deepEqual(getPracticeContentLines(question, 'english'), [
        { language: 'en', text: question.english },
    ])
    assert.deepEqual(getPracticeContentLines(question, 'bilingual'), [
        { language: 'en', text: question.english },
        { language: 'zh-CN', text: question.translation },
    ])
})

test('显示层保留题目原文与缺项，不改写或编造内容', (): void => {
    const original = { english: 'a < b & c', translation: '' }
    assert.deepEqual(getPracticeContentLines(original, 'bilingual'), [
        { language: 'en', text: 'a < b & c' },
        { language: 'zh-CN', text: '' },
    ])
    assert.deepEqual(original, { english: 'a < b & c', translation: '' })
})
