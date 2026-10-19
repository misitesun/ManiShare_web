import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { storage } from '../../../shared/lib/storage'
import { createAdditionalToolbarOptions } from '../model/additional-toolbar-options'
import type {
    AdditionalToolbarFamily,
    AdditionalToolbarOptions,
} from '../model/additional-toolbar-options'
import type { PracticeFamily, PracticeMode } from '../model/practice-demo'
import { AdditionalPracticeToolbar } from './AdditionalPracticeToolbar'
import { PracticeToolbarOptions, PracticeToolbarTimer } from './PracticeToolbarControls'

interface ToolbarCase {
    readonly family: AdditionalToolbarFamily
    readonly modes: readonly PracticeMode[]
}

const toolbarCases: readonly ToolbarCase[] = [
    { family: 'video', modes: ['listen', 'check', 'translate', 'blocks', 'typing', 'oral'] },
    { family: 'picture', modes: ['listen', 'translate', 'typing', 'oral'] },
    { family: 'guess', modes: ['guess', 'read', 'spell'] },
    { family: 'typing', modes: ['typing'] },
    { family: 'phonetics', modes: ['pronounce', 'oral'] },
    { family: 'audio-reader', modes: ['read'] },
    { family: 'video-reader', modes: ['read'] },
    { family: 'picture-reader', modes: ['read'] },
    { family: 'text-reader', modes: ['read'] },
]

function renderToolbar(
    family: AdditionalToolbarFamily,
    mode: PracticeMode,
    values: AdditionalToolbarOptions = createAdditionalToolbarOptions(family, mode),
    answerVisible = false,
): string {
    return renderToStaticMarkup(
        createElement(AdditionalPracticeToolbar, {
            family,
            mode,
            values,
            answerVisible,
            onChange: (): void => assert.fail('预渲染不得更改练习局部设置'),
            onNotice: (): void => assert.fail('预渲染不得触发用户通知'),
        }),
    )
}

test('九个新增内容族的全部有效模式都预渲染确定的通用计时标识', (): void => {
    for (const { family, modes } of toolbarCases) {
        for (const mode of modes) {
            const html = renderToolbar(family, mode)
            assert.ok(html.includes(`data-practice-toolbar="${family}"`))
            assert.ok(html.includes(`data-practice-timer="${family}"`))
            assert.match(html, /aria-label="练习用时：00时00分00秒"/)
            assert.match(html, />00:00:00<\/span>/)
            assert.equal(html, renderToolbar(family, mode))
            assert.doesNotMatch(html, /data-word-toolbar|data-sentence-toolbar|data-audio-toolbar/)
            assert.doesNotMatch(html, /data-word-timer|data-sentence-timer|data-audio-timer/)
        }
    }
})

test('独立指法、四类阅读器及只读模式只有计时，不暴露设置入口', (): void => {
    const cases: readonly {
        readonly family: AdditionalToolbarFamily
        readonly mode: PracticeMode
    }[] = [
        { family: 'typing', mode: 'typing' },
        { family: 'audio-reader', mode: 'read' },
        { family: 'video-reader', mode: 'read' },
        { family: 'picture-reader', mode: 'read' },
        { family: 'text-reader', mode: 'read' },
        { family: 'video', mode: 'listen' },
        { family: 'picture', mode: 'listen' },
        { family: 'guess', mode: 'read' },
    ]
    for (const { family, mode } of cases) {
        const html = renderToolbar(family, mode)
        assert.doesNotMatch(html, /<button\b|role="switch"|aria-expanded=|aria-controls=/)
        assert.doesNotMatch(html, /aria-label="本模式设置"|aria-label="本模式显示选项"/)
    }
})

test('只有视频和看图沉浸听力采用原稿计时位置，其余模式保留默认布局', (): void => {
    for (const { family, modes } of toolbarCases) {
        for (const mode of modes) {
            const html = renderToolbar(family, mode)
            const toolbar = html.match(/<div\b[^>]*data-practice-toolbar[^>]*>/)?.[0]
            assert.ok(toolbar)
            const listeningReference =
                (family === 'video' || family === 'picture') && mode === 'listen'
            assert.equal(toolbar.includes('design:left-[29px]'), listeningReference)
            assert.equal(toolbar.includes('design:top-[17px]'), listeningReference)
            assert.equal(toolbar.includes('design:left-4'), !listeningReference)
            assert.equal(toolbar.includes('design:top-5'), !listeningReference)
            assert.ok(toolbar.includes('px-4 pt-5'))
            if (family === 'phonetics') assert.ok(toolbar.includes('gap-[10px]'))
        }
    }
})

test('有设置行的新增模式初始收起，只提供一个设置按钮，答案态保持相同入口', (): void => {
    const cases: readonly ToolbarCase[] = [
        { family: 'video', modes: ['check', 'translate', 'blocks', 'typing', 'oral'] },
        { family: 'picture', modes: ['translate', 'typing', 'oral'] },
        { family: 'guess', modes: ['guess', 'spell'] },
    ]
    for (const { family, modes } of cases) {
        for (const mode of modes) {
            for (const answerVisible of [false, true]) {
                const html = renderToolbar(family, mode, undefined, answerVisible)
                assert.match(html, /aria-label="本模式设置" aria-expanded="false"/)
                assert.equal((html.match(/<button\b/g) ?? []).length, 1)
                assert.doesNotMatch(html, /aria-controls=|aria-label="本模式显示选项"/)
                assert.doesNotMatch(html, /role="switch"|aria-pressed=/)
            }
        }
    }
})

test('音标练习和其内部口语模式都常驻自然拼读开关，默认开启且受控值可关闭', (): void => {
    for (const mode of ['pronounce', 'oral'] as const) {
        for (const naturalPhonics of [true, false]) {
            const html = renderToolbar('phonetics', mode, {
                ...createAdditionalToolbarOptions('phonetics', mode),
                naturalPhonics,
            })
            assert.match(html, /data-practice-inline="natural-phonics"/)
            assert.ok(html.includes(`role="switch" aria-checked="${naturalPhonics}"`))
            assert.match(html, />自然拼读<\/span>/)
            assert.equal((html.match(/<button\b/g) ?? []).length, 1)
            assert.doesNotMatch(html, /aria-label="本模式设置"|aria-label="音标方案"/)
            assert.doesNotMatch(html, /aria-expanded=|aria-controls=|aria-pressed=/)
        }
    }
})

test('共用计时和展开浮层提供通用内容族标识，并保留原三族选择器', (): void => {
    const families: readonly PracticeFamily[] = [
        'word',
        'sentence',
        'audio',
        ...toolbarCases.map(({ family }) => family),
    ]
    for (const family of families) {
        const timer = renderToStaticMarkup(createElement(PracticeToolbarTimer, { family }))
        const panelProps = {
            family,
            open: true,
            onOpenChange: (): void => assert.fail('预渲染不得更改设置浮层状态'),
            children: createElement('span', null, '局部显示项'),
        }
        const panel = renderToStaticMarkup(createElement(PracticeToolbarOptions, panelProps))
        assert.ok(timer.includes(`data-practice-timer="${family}"`))
        assert.ok(panel.includes(`data-practice-options="${family}"`))
        assert.match(panel, /aria-expanded="true" aria-controls="[^"]+"/)
        assert.match(panel, /role="group" aria-label="本模式显示选项"/)
        for (const legacyFamily of ['word', 'sentence', 'audio'] as const) {
            assert.equal(timer.includes(`data-${legacyFamily}-timer=""`), family === legacyFamily)
            assert.equal(panel.includes(`data-${legacyFamily}-options=""`), family === legacyFamily)
        }
    }
})

test('新增工具栏预渲染不读取或写入偏好存储', (context): void => {
    const get = context.mock.method(storage, 'get', (): never =>
        assert.fail('工具栏预渲染不得读取存储'),
    )
    const set = context.mock.method(storage, 'set', (): never =>
        assert.fail('工具栏预渲染不得写入存储'),
    )
    for (const { family, modes } of toolbarCases) {
        for (const mode of modes) renderToolbar(family, mode)
    }
    assert.equal(get.mock.callCount(), 0)
    assert.equal(set.mock.callCount(), 0)
})
