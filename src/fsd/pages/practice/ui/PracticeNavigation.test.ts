import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PracticeFamily } from '../model/practice-demo'
import { PracticeNavigation } from './PracticeNavigation'

function renderNavigation(family: PracticeFamily): string {
    return renderToStaticMarkup(
        createElement(PracticeNavigation, {
            family,
            onAction: (): never => assert.fail('预渲染不得派发练习导航动作'),
        }),
    )
}

function readActions(markup: string): readonly string[] {
    return Array.from(markup.matchAll(/data-practice-navigation-action="([^"]+)"/g), (match) => {
        const action = match[1]
        if (!action) throw new Error('导航动作缺少标识')
        return action
    })
}

test('完整游戏开发阶段提供八项原生按钮，不渲染暂停，图标具有独立可访问名称', (): void => {
    for (const family of ['word', 'sentence', 'audio', 'video', 'picture'] as const) {
        const html = renderNavigation(family)
        assert.deepEqual(readActions(html), [
            'answer',
            'content',
            'mode',
            'reset',
            'report',
            'draft',
            'settings',
            'fullscreen',
        ])
        assert.match(html, /<nav aria-label="练习工具"/)
        assert.equal((html.match(/<button\b/g) ?? []).length, 9, '八项宽屏动作加一个小屏菜单触发器')
        assert.match(html, /aria-label="更多练习操作" aria-haspopup="menu" aria-expanded="false"/)
        assert.equal((html.match(/<img alt=""/g) ?? []).length, 8)
        assert.match(html, /aria-label="切换全屏" data-practice-navigation-action="fullscreen"/)
        assert.equal(html, renderNavigation(family))
    }
})

test('简化游戏不渲染已删除入口，阅读器只保留草稿、设置和全屏', (): void => {
    const cases: readonly {
        readonly family: PracticeFamily
        readonly actions: readonly string[]
    }[] = [
        {
            family: 'typing',
            actions: ['content', 'reset', 'draft', 'settings', 'fullscreen'],
        },
        {
            family: 'phonetics',
            actions: ['content', 'reset', 'draft', 'settings', 'fullscreen'],
        },
        {
            family: 'guess',
            actions: ['answer', 'mode', 'reset', 'draft', 'settings', 'fullscreen'],
        },
        { family: 'audio-reader', actions: ['draft', 'settings', 'fullscreen'] },
        { family: 'video-reader', actions: ['draft', 'settings', 'fullscreen'] },
        { family: 'picture-reader', actions: ['draft', 'settings', 'fullscreen'] },
        { family: 'text-reader', actions: ['draft', 'settings', 'fullscreen'] },
    ]
    for (const { family, actions } of cases) {
        const html = renderNavigation(family)
        assert.deepEqual(readActions(html), actions)
        assert.equal((html.match(/<button\b/g) ?? []).length, actions.length + 1)
        for (const action of [
            'answer',
            'content',
            'mode',
            'pause',
            'reset',
            'report',
            'draft',
            'settings',
            'fullscreen',
        ]) {
            if (!actions.includes(action))
                assert.doesNotMatch(html, new RegExp(`data-practice-navigation-action="${action}"`))
        }
        for (const button of html.matchAll(/<button\b([^>]+)>/g)) {
            assert.match(button[1] ?? '', /type="button"/)
            assert.match(button[1] ?? '', /aria-label="[^"]+"/)
            assert.match(button[1] ?? '', /cursor-pointer/)
            assert.match(button[1] ?? '', /focus-visible:outline/)
        }
    }
})
