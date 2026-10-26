import assert from 'node:assert/strict'
import test from 'node:test'
import type { ShortcutPreferences } from '../../../features/learning-settings'
import type { PracticeFamily, PracticeMode } from './practice-demo'
import { practiceDemos } from './practice-demo'
import { resolvePracticePrimary } from './practice-primary'
import { resolvePracticeShortcut } from './practice-shortcuts'
import type { PracticeKeyInput, PracticeShortcutContext } from './practice-shortcuts'

const values: ShortcutPreferences = Object.freeze({
    previousShortcut: 'Shift + ArrowLeft',
    nextShortcut: 'Shift + ArrowRight',
    playShortcut: 'Shift + L',
    masteredShortcut: 'Shift + J',
    unfamiliarShortcut: 'Shift + K',
})

function input(key: string, changes: Partial<PracticeKeyInput> = {}): PracticeKeyInput {
    return { key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...changes }
}

function context(changes: Partial<PracticeShortcutContext> = {}): PracticeShortcutContext {
    return {
        family: 'word',
        mode: 'pronounce',
        phase: 'answering',
        oralStage: 'idle',
        hasTarget: true,
        showEvaluation: true,
        panelVisible: false,
        scope: 'question',
        ready: true,
        values,
        ...changes,
    }
}

test('纯指法保持切题与提交命令，所有题态禁用朗读、口语、答案和知识快捷键', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        const active = context({
            family: 'typing',
            mode: 'typing',
            phase,
            answerInputCommands: true,
        })
        for (const target of ['content', 'answer-input'] as const) {
            for (const key of ['L', 'J', 'K'])
                assert.equal(
                    resolvePracticeShortcut(input(key, { shiftKey: true }), active, target),
                    null,
                )
            for (const key of ['V', 'ArrowDown', 'ArrowUp'])
                assert.equal(resolvePracticeShortcut(input(key), active, target), null)
            assert.equal(
                resolvePracticeShortcut(input('ArrowLeft', { shiftKey: true }), active, target),
                'question.previous',
            )
            assert.equal(
                resolvePracticeShortcut(input('ArrowRight', { shiftKey: true }), active, target),
                'question.next',
            )
            assert.equal(
                resolvePracticeShortcut(input('Enter'), active, target),
                'practice.primary',
            )
        }
    }
})

test('所有真实作答模式显式启用输入命令，普通编辑器保持隔离', (): void => {
    const active = context({ mode: 'spell', answerInputCommands: true, panelVisible: true })
    for (const [key, changes, expected] of [
        ['ArrowDown', {}, 'practice.panel.show'],
        ['ArrowUp', {}, 'practice.panel.hide'],
        ['L', { shiftKey: true }, 'practice.readAloud'],
        ['J', { shiftKey: true }, 'practice.markMastered'],
        ['K', { shiftKey: true }, 'practice.markUnfamiliar'],
        ['Enter', {}, 'practice.primary'],
    ] as const) {
        assert.equal(resolvePracticeShortcut(input(key, changes), active, 'answer-input'), expected)
        assert.equal(resolvePracticeShortcut(input(key, changes), active, 'editor'), null)
        assert.equal(
            resolvePracticeShortcut(
                input(key, changes),
                { ...active, scope: 'blocked' },
                'answer-input',
            ),
            null,
        )
    }
    for (const key of ['v', ' ', 'a', 'ArrowLeft', 'ArrowRight'])
        assert.equal(resolvePracticeShortcut(input(key), active, 'answer-input'), null)
    assert.equal(
        resolvePracticeShortcut(input('V'), { ...active, phase: 'correct' }, 'answer-input'),
        'practice.oral',
    )
    assert.equal(
        resolvePracticeShortcut(
            input('V'),
            { ...active, phase: 'correct', showEvaluation: false },
            'answer-input',
        ),
        null,
    )
    for (const [key, expected] of [
        ['ArrowDown', 'practice.panel.show'],
        ['ArrowUp', 'practice.panel.hide'],
        ['Enter', 'practice.primary'],
    ] as const)
        assert.equal(
            resolvePracticeShortcut(input(key), { ...active, mode: 'dictate' }, 'answer-input'),
            expected,
        )
    for (const mode of ['translate', 'typing', 'meaning', 'guess'] as const)
        assert.equal(
            resolvePracticeShortcut(
                input('L', { shiftKey: true }),
                { ...active, mode },
                'answer-input',
            ),
            'practice.readAloud',
        )
    assert.equal(resolvePracticeShortcut(input(' '), active, 'content'), 'practice.contextual')
    const custom = { ...active, values: { ...values, nextShortcut: 'Shift + N' } }
    assert.equal(
        resolvePracticeShortcut(input('N', { shiftKey: true }), custom, 'answer-input'),
        'question.next',
    )
    assert.equal(
        resolvePracticeShortcut(input('A', { shiftKey: true }), custom, 'answer-input'),
        null,
    )
})

test('全部完成态统一按键意图，原生按钮、编辑器、IME与退场阻断不重复派发', (): void => {
    for (const demo of practiceDemos)
        for (const mode of demo.modes) {
            const completed = context({ family: demo.family, mode, scope: 'finish' })
            assert.equal(
                resolvePracticeShortcut(input(' '), completed, 'content'),
                'session.replay',
            )
            assert.equal(
                resolvePracticeShortcut(input('Enter'), completed, 'content'),
                'session.nextChapter',
            )
            // Esc交给最上层TldDialog的关闭链，不在页面再次执行。
            for (const key of ['Escape', 'v', 'ArrowDown', 'ArrowUp'])
                assert.equal(resolvePracticeShortcut(input(key), completed, 'content'), null)
            for (const key of [' ', 'Enter']) {
                assert.equal(resolvePracticeShortcut(input(key), completed, 'native'), null)
                assert.equal(resolvePracticeShortcut(input(key), completed, 'editor'), null)
                assert.equal(
                    resolvePracticeShortcut(input(key, { repeat: true }), completed, 'content'),
                    null,
                )
                assert.equal(
                    resolvePracticeShortcut(
                        input(key, { isComposing: true }),
                        completed,
                        'content',
                    ),
                    null,
                )
                assert.equal(
                    resolvePracticeShortcut(
                        input(key),
                        { ...completed, scope: 'blocked' },
                        'content',
                    ),
                    null,
                )
            }
        }
})

test('固定流程键可匹配且归一化空格和V，不受用户绑定语法限制', (): void => {
    for (const [key, command] of [
        ['Enter', 'practice.primary'],
        [' ', 'practice.contextual'],
        ['Escape', 'practice.dismiss'],
        ['ArrowDown', 'practice.panel.show'],
    ] as const)
        assert.equal(resolvePracticeShortcut(input(key), context(), 'content'), command)
    for (const key of ['v', 'V'])
        assert.equal(
            resolvePracticeShortcut(input(key), context({ family: 'phonetics' }), 'content'),
            'practice.oral',
        )
    assert.equal(
        resolvePracticeShortcut(input('ArrowUp'), context({ panelVisible: true }), 'content'),
        'practice.panel.hide',
    )
    assert.equal(resolvePracticeShortcut(input('ArrowUp'), context(), 'content'), null)
})

test('未就绪、IME、长按、已消费事件、阻断层和普通编辑器均不派发', (): void => {
    const events = [input('Enter'), input('v'), input('L', { shiftKey: true })]
    for (const event of events) {
        assert.equal(resolvePracticeShortcut(event, context({ ready: false }), 'content'), null)
        assert.equal(resolvePracticeShortcut(event, context({ scope: 'blocked' }), 'content'), null)
        assert.equal(resolvePracticeShortcut(event, context(), 'editor'), null)
        for (const flag of ['repeat', 'isComposing', 'defaultPrevented'] as const)
            assert.equal(
                resolvePracticeShortcut({ ...event, [flag]: true }, context(), 'content'),
                null,
            )
    }
})

test('原生控件保留Enter空格方向键，作答输入保留字符V空格和裸方向键', (): void => {
    for (const key of ['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
        assert.equal(
            resolvePracticeShortcut(input(key), context({ panelVisible: true }), 'native'),
            null,
        )
    const answering = context({ mode: 'spell' })
    assert.equal(
        resolvePracticeShortcut(input('Enter'), answering, 'answer-input'),
        'practice.primary',
    )
    for (const key of ['v', 'V', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
        assert.equal(resolvePracticeShortcut(input(key), answering, 'answer-input'), null, key)
    assert.equal(
        resolvePracticeShortcut(
            input('ArrowUp'),
            { ...answering, panelVisible: true },
            'answer-input',
        ),
        null,
    )
    assert.equal(
        resolvePracticeShortcut(input('L', { shiftKey: true }), answering, 'answer-input'),
        null,
    )
})

test('精确检查修饰键，固定流程键不接受额外Ctrl Alt Shift Meta', (): void => {
    for (const key of ['Enter', ' ', 'v', 'Escape', 'ArrowDown', 'ArrowUp'])
        for (const modifier of ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const)
            assert.equal(
                resolvePracticeShortcut(
                    input(key, { [modifier]: true }),
                    context({ panelVisible: true }),
                    'content',
                ),
                null,
                `${modifier}:${key}`,
            )
    assert.equal(
        resolvePracticeShortcut(
            input('l', { ctrlKey: true, shiftKey: true }),
            context(),
            'content',
        ),
        null,
    )
    assert.equal(resolvePracticeShortcut(input('l', { metaKey: true }), context(), 'content'), null)
})

test('Shift朗读掌握不熟在内容区生效，输入区保留大写且旧Ctrl不再执行', (): void => {
    for (const [configured, bindings] of [
        [values, ['L', 'J', 'K']],
        [
            {
                ...values,
                playShortcut: 'Shift + A',
                masteredShortcut: 'Shift + M',
                unfamiliarShortcut: 'Shift + Q',
            },
            ['A', 'M', 'Q'],
        ],
    ] as const) {
        const active = context({ mode: 'spell', values: configured })
        const commands = [
            'practice.readAloud',
            'practice.markMastered',
            'practice.markUnfamiliar',
        ] as const
        for (const [index, key] of bindings.entries()) {
            const event = input(key, { shiftKey: true })
            assert.equal(resolvePracticeShortcut(event, active, 'content'), commands[index])
            assert.equal(resolvePracticeShortcut(event, active, 'native'), commands[index])
            assert.equal(resolvePracticeShortcut(event, active, 'answer-input'), null)
            assert.equal(resolvePracticeShortcut(event, active, 'editor'), null)
            assert.equal(resolvePracticeShortcut(input(key), active, 'content'), null)
            assert.equal(
                resolvePracticeShortcut(input(key, { ctrlKey: true }), active, 'content'),
                null,
            )
        }
    }
    assert.equal(
        resolvePracticeShortcut(
            input('ArrowRight', { shiftKey: true }),
            context({ mode: 'spell' }),
            'answer-input',
        ),
        'question.next',
    )
})

test('Shift字符自定义切题也只在输入区外执行，不吞字符或隐式跳题', (): void => {
    const active = context({
        mode: 'spell',
        values: { ...values, nextShortcut: 'Shift + N' },
    })
    assert.equal(
        resolvePracticeShortcut(input('N', { shiftKey: true }), active, 'content'),
        'question.next',
    )
    for (const key of ['N', 'L', 'J', 'K', 'A', '!', '1', '+'])
        assert.equal(
            resolvePracticeShortcut(input(key, { shiftKey: true }), active, 'answer-input'),
            null,
        )
})

test('原生Ctrl编辑组合不派发练习动作，Meta自定义仅在输入区外执行', (): void => {
    for (const key of ['A', 'C', 'X', 'V', 'Z', 'Y']) {
        for (const modifier of ['Ctrl', 'Meta'] as const) {
            const modified = context({
                mode: 'spell',
                values: { ...values, nextShortcut: `${modifier} + ${key}` },
            })
            const event = input(key.toLowerCase(), {
                ctrlKey: modifier === 'Ctrl',
                metaKey: modifier === 'Meta',
            })
            assert.equal(resolvePracticeShortcut(event, modified, 'answer-input'), null)
            assert.equal(
                resolvePracticeShortcut(event, modified, 'content'),
                modifier === 'Meta' ? 'question.next' : null,
            )
        }
    }
})

test('自定义切题优先于默认提示，同一动作在内容和作答输入中均可显式跳题', (): void => {
    const custom = context({
        mode: 'spell',
        values: { ...values, previousShortcut: 'Alt + P', nextShortcut: 'Alt + N' },
    })
    for (const target of ['content', 'answer-input', 'native'] as const) {
        assert.equal(
            resolvePracticeShortcut(input('p', { altKey: true }), custom, target),
            'question.previous',
        )
        assert.equal(
            resolvePracticeShortcut(input('n', { altKey: true }), custom, target),
            'question.next',
        )
        assert.equal(
            resolvePracticeShortcut(input('ArrowLeft', { shiftKey: true }), custom, target),
            null,
        )
        assert.equal(
            resolvePracticeShortcut(input('ArrowRight', { shiftKey: true }), custom, target),
            null,
        )
    }
})

test('冲突用户绑定双方都不派发，不靠动作检查顺序抢键', (): void => {
    const conflict = context({ values: { ...values, playShortcut: values.previousShortcut } })
    assert.equal(
        resolvePracticeShortcut(input('ArrowLeft', { shiftKey: true }), conflict, 'content'),
        null,
    )
    assert.equal(resolvePracticeShortcut(input('L', { shiftKey: true }), conflict, 'content'), null)
    assert.equal(
        resolvePracticeShortcut(input('ArrowRight', { shiftKey: true }), conflict, 'content'),
        'question.next',
    )
})

test('音频视频和纯阅读器不因用户掌握不熟绑定而获得该能力，看图按mode开放', (): void => {
    const unavailable: readonly { readonly family: PracticeFamily; readonly mode: PracticeMode }[] =
        [
            { family: 'audio', mode: 'listen' },
            { family: 'audio', mode: 'oral' },
            { family: 'video', mode: 'translate' },
            { family: 'video', mode: 'blocks' },
            { family: 'audio-reader', mode: 'read' },
            { family: 'picture-reader', mode: 'read' },
            { family: 'word', mode: 'typing' },
            { family: 'sentence', mode: 'read' },
            { family: 'picture', mode: 'typing' },
        ]
    for (const entry of unavailable)
        for (const key of ['j', 'k'])
            assert.equal(
                resolvePracticeShortcut(input(key, { shiftKey: true }), context(entry), 'content'),
                null,
            )
    for (const mode of ['listen', 'translate', 'oral'] as const)
        for (const [key, command] of [
            ['j', 'practice.markMastered'],
            ['k', 'practice.markUnfamiliar'],
        ] as const)
            assert.equal(
                resolvePracticeShortcut(
                    input(key, { shiftKey: true }),
                    context({ family: 'picture', mode }),
                    'content',
                ),
                command,
            )
})

test('面板上下键按模式能力和可见状态解析，不依赖答题阶段', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        for (const entry of [
            { family: 'word', mode: 'spell' },
            { family: 'word', mode: 'typing' },
            { family: 'phonetics', mode: 'pronounce' },
            { family: 'sentence', mode: 'listen' },
            { family: 'audio', mode: 'listen' },
        ] as const) {
            assert.equal(
                resolvePracticeShortcut(
                    input('ArrowDown'),
                    context({ ...entry, phase }),
                    'content',
                ),
                'practice.panel.show',
            )
            assert.equal(
                resolvePracticeShortcut(
                    input('ArrowUp'),
                    context({ ...entry, phase, panelVisible: true }),
                    'content',
                ),
                'practice.panel.hide',
            )
        }
    for (const family of [
        'typing',
        'audio-reader',
        'video-reader',
        'picture-reader',
        'text-reader',
    ] as const)
        for (const key of ['ArrowDown', 'ArrowUp'])
            assert.equal(
                resolvePracticeShortcut(
                    input(key),
                    context({
                        family,
                        mode: family === 'typing' ? 'typing' : 'read',
                        panelVisible: true,
                    }),
                    'content',
                ),
                null,
            )
})

test('句子／音频对应模式及视频自查／指法／口语禁用上下答案键，保留主流程、切题和朗读', (): void => {
    for (const family of ['sentence', 'audio', 'video'] as const)
        for (const mode of family === 'video'
            ? (['check', 'typing', 'oral'] as const)
            : (['read', 'check', 'typing', 'oral'] as const))
            for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
                for (const panelVisible of [false, true]) {
                    const active = context({
                        family,
                        mode,
                        phase,
                        panelVisible,
                        answerInputCommands: mode === 'typing',
                    })
                    for (const key of ['ArrowDown', 'ArrowUp'])
                        for (const target of ['content', 'answer-input'] as const)
                            assert.equal(resolvePracticeShortcut(input(key), active, target), null)
                    assert.equal(
                        resolvePracticeShortcut(
                            input('ArrowLeft', { shiftKey: true }),
                            active,
                            'content',
                        ),
                        'question.previous',
                    )
                    assert.equal(
                        resolvePracticeShortcut(
                            input('ArrowRight', { shiftKey: true }),
                            active,
                            'content',
                        ),
                        'question.next',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input('L', { shiftKey: true }), active, 'content'),
                        'practice.readAloud',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input(' '), active, 'content'),
                        mode === 'read' ? 'practice.readAloud' : 'practice.contextual',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input('Enter'), active, 'content'),
                        'practice.primary',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input('Escape'), active, 'content'),
                        'practice.dismiss',
                    )
                }
})

test('句子与音频口语准备、录音、评分和结果阶段均不响应上下答案键', (): void => {
    for (const family of ['sentence', 'audio'] as const)
        for (const oralStage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const)
            for (const panelVisible of [false, true])
                for (const scope of ['question', 'oral'] as const)
                    for (const key of ['ArrowDown', 'ArrowUp'])
                        assert.equal(
                            resolvePracticeShortcut(
                                input(key),
                                context({ family, mode: 'oral', oralStage, panelVisible, scope }),
                                'content',
                            ),
                            null,
                        )
})

test('句子和音频阅读空格朗读，其他阅读保留滚动，作答内容空格统一发出编辑意图', (): void => {
    for (const family of ['sentence', 'audio'] as const)
        assert.equal(
            resolvePracticeShortcut(input(' '), context({ family, mode: 'read' }), 'content'),
            'practice.readAloud',
        )
    for (const family of ['guess', 'text-reader'] as const)
        assert.equal(
            resolvePracticeShortcut(input(' '), context({ family, mode: 'read' }), 'content'),
            null,
        )
    for (const mode of ['spell', 'dictate', 'translate', 'meaning', 'typing', 'blocks'] as const)
        for (const phase of ['answering', 'incorrect'] as const)
            assert.equal(
                resolvePracticeShortcut(
                    input(' '),
                    context({ mode, phase, answerInputCommands: true }),
                    'content',
                ),
                mode === 'blocks' ? null : 'practice.contextual',
            )
    for (const family of ['audio-reader', 'video-reader', 'picture-reader'] as const)
        assert.equal(
            resolvePracticeShortcut(input(' '), context({ family, mode: 'read' }), 'content'),
            'practice.contextual',
        )
})

test('猜词及阅读的题面和答案均不以空格或回车切题，保留显式切题与朗读', (): void => {
    for (const mode of ['guess', 'read'] as const) {
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
            for (const panelVisible of [false, true]) {
                const active = context({ family: 'guess', mode, phase, panelVisible })
                for (const target of ['content', 'answer-input', 'native', 'editor'] as const)
                    for (const key of [' ', 'Space', 'Enter'])
                        assert.equal(resolvePracticeShortcut(input(key), active, target), null)
                for (const target of ['content', 'native'] as const) {
                    assert.equal(
                        resolvePracticeShortcut(input('ArrowDown'), active, target),
                        'practice.panel.show',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input('ArrowUp'), active, target),
                        panelVisible ? 'practice.panel.hide' : null,
                    )
                    assert.equal(
                        resolvePracticeShortcut(
                            input('ArrowLeft', { shiftKey: true }),
                            active,
                            target,
                        ),
                        'question.previous',
                    )
                    assert.equal(
                        resolvePracticeShortcut(
                            input('ArrowRight', { shiftKey: true }),
                            active,
                            target,
                        ),
                        'question.next',
                    )
                    assert.equal(
                        resolvePracticeShortcut(input('L', { shiftKey: true }), active, target),
                        'practice.readAloud',
                    )
                    for (const key of ['ArrowLeft', 'ArrowRight'])
                        assert.equal(resolvePracticeShortcut(input(key), active, target), null)
                }
                for (const key of ['ArrowDown', 'ArrowUp'])
                    assert.equal(resolvePracticeShortcut(input(key), active, 'editor'), null)
            }
    }
    assert.equal(
        resolvePracticeShortcut(
            input('Enter'),
            context({ family: 'guess', mode: 'spell' }),
            'content',
        ),
        'practice.primary',
    )
})

test('猜词打词保留单段提交及答案按键，卡内按钮同样可收起，快捷口语不开放', (): void => {
    for (const phase of ['answering', 'incorrect', 'correct', 'revealed'] as const) {
        const active = context({
            family: 'guess',
            mode: 'spell',
            phase,
            panelVisible: true,
            answerInputCommands: true,
        })
        assert.equal(
            resolvePracticeShortcut(input('Enter'), active, 'answer-input'),
            'practice.primary',
        )
        assert.equal(resolvePracticeShortcut(input(' '), active, 'answer-input'), null)
        assert.equal(resolvePracticeShortcut(input(' '), active, 'content'), 'practice.contextual')
        for (const target of ['answer-input', 'native', 'content'] as const) {
            assert.equal(
                resolvePracticeShortcut(input('ArrowDown'), active, target),
                'practice.panel.show',
            )
            assert.equal(
                resolvePracticeShortcut(input('ArrowUp'), active, target),
                'practice.panel.hide',
            )
            assert.equal(
                resolvePracticeShortcut(input('ArrowRight', { shiftKey: true }), active, target),
                'question.next',
            )
            assert.equal(
                resolvePracticeShortcut(input('L', { shiftKey: true }), active, target),
                'practice.readAloud',
            )
            assert.equal(resolvePracticeShortcut(input('V'), active, target), null)
        }
        assert.equal(resolvePracticeShortcut(input('Enter'), active, 'native'), null)
    }
})

test('自查空格保留揭晓流程，答案态再推进下一题', (): void => {
    for (const family of ['sentence', 'audio'] as const)
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
            assert.equal(
                resolvePracticeShortcut(
                    input(' '),
                    context({ family, mode: 'check', phase }),
                    'content',
                ),
                'practice.contextual',
            )
            assert.equal(
                resolvePracticePrimary({
                    family,
                    mode: 'check',
                    phase,
                    oralStage: 'idle',
                    quickOral: false,
                }),
                phase === 'revealed' || phase === 'correct' ? 'next' : 'reveal',
            )
        }
})

test('快捷口语遵守目标、设置和题态门控，输入字母与纯阅读器不被抢占', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        for (const key of ['v', 'V'])
            assert.equal(
                resolvePracticeShortcut(
                    input(key),
                    context({ mode: 'pronounce', phase }),
                    'content',
                ),
                null,
            )
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        assert.equal(
            resolvePracticeShortcut(input('v'), context({ mode: 'spell', phase }), 'content'),
            phase === 'correct' ? 'practice.oral' : null,
        )
    for (const changes of [{ hasTarget: false }, { showEvaluation: false }] as const)
        assert.equal(resolvePracticeShortcut(input('v'), context(changes), 'content'), null)
    for (const family of ['audio-reader', 'video-reader', 'picture-reader', 'text-reader'] as const)
        assert.equal(
            resolvePracticeShortcut(input('v'), context({ family, mode: 'read' }), 'content'),
            null,
        )
    assert.equal(
        resolvePracticeShortcut(
            input('v'),
            context({ mode: 'oral', showEvaluation: false }),
            'content',
        ),
        'practice.oral',
    )
})

test('口语作用域只解析当前阶段流程，评测中不重入也不透传底层切题', (): void => {
    for (const oralStage of ['idle', 'recording', 'result'] as const)
        for (const [key, command] of [
            ['Enter', 'practice.primary'],
            [' ', 'practice.contextual'],
            ['v', 'practice.oral'],
        ] as const)
            assert.equal(
                resolvePracticeShortcut(
                    input(key),
                    context({ scope: 'oral', oralStage }),
                    'content',
                ),
                command,
            )
    for (const oralStage of ['evaluating', 'error'] as const)
        for (const key of ['Enter', ' ', 'v'])
            assert.equal(
                resolvePracticeShortcut(
                    input(key),
                    context({ scope: 'oral', oralStage }),
                    'content',
                ),
                null,
            )
    for (const oralStage of ['idle', 'recording', 'evaluating', 'result', 'error'] as const) {
        const oral = context({ scope: 'oral', oralStage })
        assert.equal(
            resolvePracticeShortcut(input('ArrowRight', { shiftKey: true }), oral, 'content'),
            null,
        )
        assert.equal(resolvePracticeShortcut(input('l', { ctrlKey: true }), oral, 'content'), null)
        assert.equal(resolvePracticeShortcut(input('Enter'), oral, 'answer-input'), null)
    }
})

test('音频全部模式及题态不开放掌握和不熟快捷键，阅读空格只控制本题朗读', (): void => {
    for (const mode of [
        'listen',
        'read',
        'check',
        'translate',
        'blocks',
        'typing',
        'oral',
    ] as const)
        for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
            for (const target of ['content', 'answer-input'] as const)
                for (const key of ['J', 'K'])
                    assert.equal(
                        resolvePracticeShortcut(
                            input(key, { shiftKey: true }),
                            context({ family: 'audio', mode, phase, answerInputCommands: true }),
                            target,
                        ),
                        null,
                    )
    assert.equal(
        resolvePracticeShortcut(input(' '), context({ family: 'audio', mode: 'read' }), 'content'),
        'practice.readAloud',
    )
})
