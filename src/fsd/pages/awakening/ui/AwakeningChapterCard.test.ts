import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { awakeningChapters } from '../model/course-detail'
import { AwakeningChapterCard } from './AwakeningChapterCard'

test('本地演示的13张章节卡均为可访问按钮，VIP锁标不禁用入口', (): void => {
    for (const chapter of awakeningChapters) {
        const markup = renderToStaticMarkup(
            createElement(AwakeningChapterCard, { chapter, onOpen: (): void => undefined }),
        )
        const buttons = markup.match(/<button\b[^>]*>/g) ?? []
        assert.equal(buttons.length, 1)
        const button = buttons[0]
        assert.ok(button)
        assert.match(button, /data-practice-chapter-entry=/)
        assert.match(button, new RegExp(`aria-label="第${chapter.number}章：`))
        assert.doesNotMatch(button, /\bdisabled(?:=|\s|>)/)
        if (chapter.locked) {
            assert.match(button, new RegExp(`aria-describedby="${chapter.id}-demo-access"`))
            assert.match(markup, /VIP章节标识仅作展示，本地演示可体验/)
        }
        assert.equal(button.includes('data-word-chapter-entry=""'), chapter.kind === 1)
    }
})

test('只有六类选择窗入口声明弹窗，独立指法、音标与阅读器使用直接进入文案', (): void => {
    const selectionChapters = new Set([1, 2, 3, 4, 5, 9, 13])
    for (const chapter of awakeningChapters) {
        const markup = renderToStaticMarkup(
            createElement(AwakeningChapterCard, { chapter, onOpen: (): void => undefined }),
        )
        const button = markup.match(/<button\b[^>]*>/)?.[0]
        assert.ok(button)
        if (selectionChapters.has(chapter.number)) {
            assert.match(button, /aria-haspopup="dialog"/)
            assert.match(button, /章：选择/)
        } else {
            assert.doesNotMatch(button, /aria-haspopup/)
            assert.match(button, /章：进入/)
        }
    }
})
