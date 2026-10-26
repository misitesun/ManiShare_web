import assert from 'node:assert/strict'
import test from 'node:test'
import { practiceDemos } from './practice-demo'
import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import {
    formatPracticeShortcut,
    getPracticeFooter,
    supportsPracticeKnowledge,
    supportsPracticePanel,
} from './practice-footer'
import type { PracticeFooterContext, PracticeFooterPreferences } from './practice-footer'

const values: PracticeFooterPreferences = {
    playShortcut: 'Shift + L',
    masteredShortcut: 'Shift + J',
    unfamiliarShortcut: 'Shift + K',
    previousShortcut: 'Shift + ArrowLeft',
    nextShortcut: 'Shift + ArrowRight',
}

function context(
    family: PracticeFamily,
    mode: PracticeMode,
    phase: PracticePhase = 'answering',
): PracticeFooterContext {
    return { family, mode, phase, index: 1, total: 3, values }
}

function ids(family: PracticeFamily, mode: PracticeMode): readonly string[] {
    return getPracticeFooter(context(family, mode)).map((item) => item.id)
}

test('全部公开演示组合及音标内部口语在四题态均有确定配置且不重复动作项', (): void => {
    let combinations = 0
    for (const demo of practiceDemos)
        for (const mode of demo.modes) {
            combinations += 1
            for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
                const input = context(demo.family, mode, phase)
                const items = getPracticeFooter(input)
                assert.deepEqual(items, getPracticeFooter(input))
                assert.equal(new Set(items.map((item) => item.id)).size, items.length)
                for (const item of items) {
                    assert.ok(item.label)
                    if (item.kind === 'hint') assert.equal(item.action, undefined)
                }
            }
        }
    assert.equal(combinations, 40)
})

test('原稿的简化底栏和纯内容不继承通用答案朗读或知识按钮', (): void => {
    for (const family of ['sentence', 'audio'] as const)
        assert.deepEqual(ids(family, 'read'), ['previous', 'playback', 'next'])
    assert.deepEqual(ids('guess', 'read'), ['previous', 'navigation', 'next'])
    assert.deepEqual(ids('typing', 'typing'), ['previous', 'navigation', 'next'])
    assert.deepEqual(ids('picture-reader', 'read'), ['previous', 'contextual', 'next'])
    for (const family of ['audio-reader', 'video-reader', 'text-reader'] as const)
        assert.deepEqual(ids(family, 'read'), [])
    assert.deepEqual(ids('video', 'listen'), [])
    const playback = getPracticeFooter(context('audio', 'read'))[1]
    assert.equal(playback?.action, 'practice.readAloud')
    assert.deepEqual(playback?.shortcuts, [])
})

test('知识能力按小模式裁剪，音视频全部排除，看图三种非指法模式保留', (): void => {
    for (const demo of practiceDemos)
        for (const mode of demo.modes) {
            const expected =
                (demo.family === 'word' && mode !== 'typing') ||
                (demo.family === 'sentence' && mode !== 'typing' && mode !== 'read') ||
                (demo.family === 'picture' && mode !== 'typing')
            assert.equal(supportsPracticeKnowledge(demo.family, mode), expected)
            const items = getPracticeFooter(context(demo.family, mode))
            assert.equal(
                items.some((item) => item.id === 'mastered'),
                expected,
            )
            assert.equal(
                items.some((item) => item.id === 'unfamiliar'),
                expected,
            )
        }
    assert.equal(supportsPracticeKnowledge('word', 'read'), false)
})

test('答案面板能力沿导航覆盖，原稿底栏只在原位置绘制独立面板按钮', (): void => {
    for (const demo of practiceDemos)
        for (const mode of demo.modes)
            assert.equal(
                supportsPracticePanel(demo.family, mode),
                ['word', 'sentence', 'audio', 'video', 'picture', 'guess', 'phonetics'].includes(
                    demo.family,
                ),
            )
    assert.ok(supportsPracticePanel('video', 'listen'))
    assert.ok(supportsPracticePanel('sentence', 'oral'))
    assert.ok(!ids('sentence', 'check').includes('panel'))
    const panel = getPracticeFooter({
        ...context('phonetics', 'pronounce'),
        panelVisible: true,
    }).find((item) => item.id === 'panel')
    assert.equal(panel?.label, '详情')
    assert.equal(panel?.action, 'practice.panel.toggle')
    assert.equal(panel?.expanded, true)
    assert.deepEqual(panel?.shortcuts, ['ArrowDown', 'ArrowUp'])
})

test('句子与音频听力保留上下答案提示，阅读、自查、指法和口语保留手动能力且无独立答案项', (): void => {
    for (const family of ['sentence', 'audio'] as const) {
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
            const items = getPracticeFooter(context(family, 'listen', phase))
            assert.equal(items.filter((item) => item.id === 'panel').length, 1)
            const panel = items.find((item) => item.id === 'panel')
            assert.equal(panel?.label, '答案')
            assert.equal(panel?.action, 'practice.panel.toggle')
            assert.deepEqual(panel?.shortcuts, ['ArrowDown', 'ArrowUp'])
        }
        for (const mode of ['read', 'check', 'typing', 'oral'] as const) {
            assert.equal(supportsPracticePanel(family, mode), true)
            assert.equal(ids(family, mode).includes('panel'), false)
        }
    }
})

test('猜词补充上下答案快捷键入口，不新增空格或回车切题提示', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        for (const panelVisible of [false, true]) {
            const items = getPracticeFooter({ ...context('guess', 'guess', phase), panelVisible })
            assert.deepEqual(
                items.map((item) => item.id),
                ['previous', 'read-aloud', 'panel', 'navigation', 'next'],
            )
            const panel = items.find((item) => item.id === 'panel')
            assert.equal(panel?.label, '答案')
            assert.equal(panel?.action, 'practice.panel.toggle')
            assert.equal(panel?.expanded, panelVisible)
            assert.deepEqual(panel?.shortcuts, ['ArrowDown', 'ArrowUp'])
            assert.equal(
                items.some((item) =>
                    item.shortcuts.some((key) => key === 'Space' || key === 'Enter'),
                ),
                false,
            )
        }
})

test('输入与结果提示分别使用提交和下一题，答后不保留跳格提示', (): void => {
    for (const family of ['sentence', 'audio', 'video', 'picture'] as const) {
        const input = getPracticeFooter(context(family, 'translate'))
        assert.deepEqual(
            input.map((item) => item.id),
            [
                'previous',
                'input',
                ...(family === 'sentence' || family === 'picture' ? ['mastered'] : []),
                'read-aloud',
                'primary',
                'panel',
                ...(family === 'sentence' || family === 'picture' ? ['unfamiliar'] : []),
                'navigation',
                'next',
            ],
        )
        assert.deepEqual(input.find((item) => item.id === 'primary')?.shortcuts, ['Enter'])
        assert.equal(input.find((item) => item.id === 'primary')?.label, '提交')
        assert.deepEqual(
            input.find((item) => item.id === 'input')?.shortcuts,
            family === 'sentence' || family === 'audio' ? ['Space', '← / →'] : ['← / →'],
        )
        for (const phase of ['revealed', 'correct'] as const) {
            const result = getPracticeFooter(context(family, 'translate', phase))
            assert.equal(
                result.some((item) => item.id === 'input'),
                false,
            )
            assert.equal(result.find((item) => item.id === 'primary')?.label, '下一题')
            assert.deepEqual(result.find((item) => item.id === 'primary')?.shortcuts, [
                'Enter',
                'Space',
            ])
        }
    }
    for (const [family, mode] of [
        ['word', 'typing'],
        ['sentence', 'blocks'],
        ['guess', 'guess'],
    ] as const)
        assert.equal(
            getPracticeFooter(context(family, mode)).some((item) => item.id === 'primary'),
            false,
        )
    assert.equal(
        getPracticeFooter(context('audio', 'check', 'incorrect')).find(
            (item) => item.id === 'primary',
        )?.label,
        '显示答案',
    )
})

test('猜词打词底栏同时标明回车和空格提交，不改变其他猜词模式的切题限制', (): void => {
    for (const phase of ['answering', 'incorrect', 'correct', 'revealed'] as const) {
        const items = getPracticeFooter(context('guess', 'spell', phase))
        assert.deepEqual(
            items.map((item) => item.id),
            ['previous', 'read-aloud', 'primary', 'panel', 'navigation', 'next'],
        )
        assert.deepEqual(items.find((item) => item.id === 'primary')?.shortcuts, ['Enter', 'Space'])
    }
})

test('口语根据同一受控阶段显示开始停止、评测阻断、回放及重录', (): void => {
    const base = context('audio', 'oral')
    for (const oralStage of ['idle', 'recording'] as const) {
        const primary = getPracticeFooter({ ...base, oralStage }).find(
            (item) => item.id === 'primary',
        )
        assert.equal(primary?.label, oralStage === 'idle' ? '开始录音' : '结束录音')
        assert.deepEqual(primary?.shortcuts, ['Enter', 'Space', 'V'])
    }
    const evaluating = getPracticeFooter({ ...base, oralStage: 'evaluating' }).find(
        (item) => item.id === 'primary',
    )
    assert.equal(evaluating?.disabled, true)
    assert.equal(evaluating?.action, undefined)
    assert.deepEqual(evaluating?.shortcuts, [])
    const result = getPracticeFooter({ ...base, oralStage: 'result' })
    assert.deepEqual(
        result
            .filter((item) => ['primary', 'contextual', 'oral'].includes(item.id))
            .map((item) => ({
                label: item.label,
                action: item.action,
                shortcuts: item.shortcuts,
            })),
        [
            { label: '下一题', action: 'practice.primary', shortcuts: ['Enter'] },
            { label: '回放录音', action: 'practice.contextual', shortcuts: ['Space'] },
            { label: '重新录制', action: 'practice.oral', shortcuts: ['V'] },
        ],
    )
})

test('有效配置驱动提示，冲突键位不被宣称可用且边界仅禁用两端按钮', (): void => {
    const base = context('word', 'spell')
    const items = getPracticeFooter({
        ...base,
        index: 0,
        values: { ...values, playShortcut: 'Alt + P', previousShortcut: 'Alt + ArrowLeft' },
    })
    assert.deepEqual(items.find((item) => item.id === 'read-aloud')?.shortcuts, ['Alt + P'])
    assert.deepEqual(items.find((item) => item.id === 'navigation')?.shortcuts, [
        'Alt + ArrowLeft',
        'Shift + ArrowRight',
    ])
    assert.equal(items[0]?.disabled, true)
    assert.equal(items.at(-1)?.disabled, false)
    const conflicting = getPracticeFooter({ ...base, values: { ...values, playShortcut: 'Space' } })
    assert.deepEqual(conflicting.find((item) => item.id === 'read-aloud')?.shortcuts, [])
    assert.equal(getPracticeFooter({ ...base, index: 2 }).at(-1)?.disabled, false)
    assert.equal(getPracticeFooter({ ...base, index: 2 }).at(-1)?.label, '下一题')
    assert.equal(getPracticeFooter({ ...base, total: 0 }).at(-1)?.disabled, true)
    assert.equal(formatPracticeShortcut('Alt + ArrowLeft'), 'Alt+←')
    assert.equal(formatPracticeShortcut('Shift + ArrowRight'), 'Shift+→')
    assert.equal(formatPracticeShortcut('Space'), '空格')
})

test('音频七模式不出现知识操作，分段输入的空格跳格提示与句子一致', (): void => {
    for (const mode of [
        'listen',
        'read',
        'check',
        'translate',
        'blocks',
        'typing',
        'oral',
    ] as const)
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
            assert.equal(supportsPracticeKnowledge('audio', mode), false)
            assert.ok(
                getPracticeFooter(context('audio', mode, phase)).every(
                    (item) => item.id !== 'mastered' && item.id !== 'unfamiliar',
                ),
            )
        }
    assert.deepEqual(
        getPracticeFooter(context('audio', 'translate')).find((item) => item.id === 'input')
            ?.shortcuts,
        ['Space', '← / →'],
    )
})
