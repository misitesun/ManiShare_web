import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getWordSlotIndex,
    getWordSlotCharacters,
    getWordSlotTextPosition,
    getWordSlotPlaceholder,
    getWordSlotHint,
    getWordSlotSelection,
    getWordSlotView,
    getWordSlotVisibleCaret,
    shouldSubmitWordSlots,
} from './word-slot-input'

test('反馈按调用方码点状态映射，缺字和多字不改写完整原文', (): void => {
    const slot = getWordSlotView('cat', 'c😀s')[0]
    assert.ok(slot)
    assert.deepEqual(
        getWordSlotCharacters(slot, 'c😀s', {
            value: 'c😀s',
            slots: [{ index: 0, states: ['correct', 'incorrect', 'pending'] }],
        }),
        [
            { value: 'c', typed: true, state: 'correct' },
            { value: '😀', typed: true, state: 'incorrect' },
            { value: 's', typed: true, state: 'pending' },
        ],
    )
    for (const [value, states, expected] of [
        ['ca', ['correct', 'correct', 'missing'], ['correct', 'correct', 'missing']],
        [
            'cats',
            ['correct', 'correct', 'correct', 'extra'],
            ['correct', 'correct', 'correct', 'extra'],
        ],
    ] as const) {
        const current = getWordSlotView('cat', value)[0]
        assert.ok(current)
        const view = getWordSlotCharacters(current, value, { value, slots: [{ index: 0, states }] })
        assert.deepEqual(
            view.map((character) => character.state),
            expected,
        )
        assert.equal(
            view
                .filter((character) => character.typed)
                .map((character) => character.value)
                .join(''),
            value,
        )
    }
})

test('反馈不推导比较结果；局部更正、过期快照和无效位置均不染错新文本', (): void => {
    const slot = getWordSlotView('cat', 'dog')[0]
    assert.ok(slot)
    const feedback = {
        value: 'dog',
        slots: [{ index: 0, states: ['pending', 'incorrect', 'incorrect'] as const }],
    }
    assert.deepEqual(
        getWordSlotCharacters(slot, 'dog', feedback).map((character) => character.state),
        ['pending', 'incorrect', 'incorrect'],
    )
    assert.deepEqual(
        getWordSlotCharacters(slot, 'new value', feedback).map((character) => character.state),
        ['pending', 'pending', 'pending'],
    )
    const invalid = getWordSlotCharacters(slot, 'dog', {
        value: 'dog',
        slots: [{ index: 0, states: ['missing', 'extra', 'correct'] }],
    })
    assert.deepEqual(
        invalid.map((character) => character.state),
        ['pending', 'pending', 'correct'],
    )
})

test('拆分文本节点定位保留UTF-16、边界及空节点，不计缺字占位', (): void => {
    const texts = ['W', '😀', 'W']
    for (const [caret, index, offset] of [
        [0, 0, 0],
        [1, 0, 1],
        [2, 1, 1],
        [3, 1, 2],
        [4, 2, 1],
        [100, 2, 1],
    ] as const)
        assert.deepEqual(getWordSlotTextPosition(texts, caret), { index, offset })
    assert.equal(getWordSlotTextPosition([], 0), null)
    assert.deepEqual(getWordSlotTextPosition(['', 'abc'], 2), { index: 1, offset: 2 })
})

test('可视光标扣除实际录入的前缀并夹紧后缀，保留中部UTF-16位置', (): void => {
    const value = 'first “W😀W.”'
    const slot = getWordSlotView('first “word.”', value)[1]
    assert.ok(slot)
    for (const [caret, expected] of [
        [6, 0],
        [7, 0],
        [8, 1],
        [10, 3],
        [11, 4],
        [13, 4],
    ] as const)
        assert.equal(getWordSlotVisibleCaret(value, caret, slot), expected)
    const unquoted = 'first W😀W'
    const unquotedSlot = getWordSlotView('first “word.”', unquoted)[1]
    assert.ok(unquotedSlot)
    assert.equal(getWordSlotVisibleCaret(unquoted, 6, unquotedSlot), 0)
    assert.equal(getWordSlotVisibleCaret(unquoted, 9, unquotedSlot), 3)
    assert.equal(getWordSlotVisibleCaret(unquoted, 10, unquotedSlot), 4)
    const emptySlot = getWordSlotView('word', '')[0]
    assert.ok(emptySlot)
    assert.equal(getWordSlotVisibleCaret('', 0, emptySlot), 0)
})

test('Hi there. 生成两个独立词槽，句号独立展示且原生输入标点不重复', (): void => {
    assert.deepEqual(getWordSlotView('Hi there.', ''), [
        {
            id: 'word-slot-0',
            index: 0,
            target: 'Hi',
            value: '',
            prefix: '',
            suffix: '',
            start: 0,
            end: 0,
        },
        {
            id: 'word-slot-1',
            index: 1,
            target: 'there',
            value: '',
            prefix: '',
            suffix: '.',
            start: 0,
            end: 0,
        },
    ])
    const entered = getWordSlotView('Hi there.', 'hi there.')
    assert.equal(entered[0]?.value, 'hi')
    assert.deepEqual(entered[1], {
        id: 'word-slot-1',
        index: 1,
        target: 'there',
        value: 'there',
        prefix: '',
        suffix: '.',
        start: 3,
        end: 9,
    })
    assert.equal(getWordSlotView('Hi there.', 'hi there..')[1]?.value, 'there.')
})

test('词槽数量由题目决定，连续空白与超额文本保留在末槽及原始 UTF-16 边界', (): void => {
    const source = ' Hi  there.\t'
    const view = getWordSlotView('  Hi \t there.  ', source)
    assert.deepEqual(
        view.map((slot) => slot.target),
        ['Hi', 'there'],
    )
    assert.deepEqual(
        view.map((slot) => slot.value),
        ['', 'Hi  there.\t'],
    )
    assert.deepEqual(
        view.map(({ start, end }) => ({ start, end })),
        [
            { start: 0, end: 0 },
            { start: 1, end: 12 },
        ],
    )
    assert.deepEqual(getWordSlotSelection(source, 3), { value: source, start: 11, end: 11 })
})

test('空目标仍可输入，超出目标的词及错误标点全部可见', (): void => {
    const empty = getWordSlotView('', '')
    assert.equal(empty.length, 1)
    assert.equal(empty[0]?.target, '')
    assert.equal(empty[0]?.value, '')
    assert.deepEqual(
        getWordSlotView('  \t ', 'hello world!').map((slot) => slot.value),
        ['hello world!'],
    )
    const extra = getWordSlotView('Hi there.', 'Hi there? another word!')
    assert.deepEqual(
        extra.map((slot) => slot.value),
        ['Hi', 'there? another word!'],
    )
    assert.equal(extra.length, 2)
    assert.equal(extra[1]?.suffix, '.')
})

test('引号与词尾标点分离展示，词内撇号、连字符和完整原始文本保持', (): void => {
    const target = "“Hi,” don't re-enter."
    const source = "“Hi,” don't re-enter."
    const view = getWordSlotView(target, source)
    assert.deepEqual(
        view.map(({ target: word, value, prefix, suffix }) => ({ word, value, prefix, suffix })),
        [
            { word: 'Hi', value: 'Hi', prefix: '“', suffix: ',”' },
            { word: "don't", value: "don't", prefix: '', suffix: '' },
            { word: 're-enter', value: 're-enter', prefix: '', suffix: '.' },
        ],
    )
    assert.deepEqual(getWordSlotSelection(source, 2), {
        value: source,
        start: source.length,
        end: source.length,
    })
    assert.equal(getWordSlotView('“Hi”', '"Hi"')[0]?.value, '"Hi"')
    assert.deepEqual(getWordSlotView('...', '')[0], {
        id: 'word-slot-0',
        index: 0,
        target: '',
        value: '',
        prefix: '',
        suffix: '...',
        start: 0,
        end: 0,
    })
})

test('目标独立逗号和句末点归入静态后缀，不产生额外可编辑词槽', (): void => {
    const view = getWordSlotView('Hi , there .', 'hi there')
    assert.equal(view.length, 2)
    assert.deepEqual(
        view.map(({ index, target, value, prefix, suffix }) => ({
            index,
            target,
            value,
            prefix,
            suffix,
        })),
        [
            { index: 0, target: 'Hi', value: 'hi', prefix: '', suffix: ',' },
            { index: 1, target: 'there', value: 'there', prefix: '', suffix: '.' },
        ],
    )
    assert.equal(getWordSlotView('Hi there .', '').length, 2)
    assert.deepEqual(
        getWordSlotView('“ Hi there . ”', '').map(({ target, prefix, suffix }) => ({
            target,
            prefix,
            suffix,
        })),
        [
            { target: 'Hi', prefix: '“', suffix: '' },
            { target: 'there', prefix: '', suffix: '.”' },
        ],
    )
    const rawInput = 'hi , there .'
    assert.deepEqual(
        getWordSlotView('Hi , there .', rawInput).map((slot) => slot.value),
        ['hi', ', there '],
    )
    assert.equal(getWordSlotSelection(rawInput, 3).value, rawInput)
})

test('全标点目标保留静态字符和一条可编辑兜底词槽，不消耗多个词索引', (): void => {
    const emptyView = getWordSlotView(' . , ! ? ', '')
    assert.equal(emptyView.length, 1)
    assert.equal(emptyView[0]?.target, '')
    assert.equal(emptyView[0]?.value, '')
    assert.equal(emptyView[0]?.suffix, '.,!?')
    const entered = getWordSlotView(' . , ! ? ', 'anything')
    assert.equal(entered.length, 1)
    assert.equal(entered[0]?.value, 'anything')
    assert.equal(entered[0]?.suffix, '.,!?')
    assert.deepEqual(getWordSlotSelection('', 0), { value: '', start: 0, end: 0 })
})

test('占位测宽使用已输入小写与目标剩余部分，长词和超长输入不截断', (): void => {
    assert.equal(getWordSlotPlaceholder('Hi', ''), 'hi')
    assert.equal(getWordSlotPlaceholder('There', 'TH'), 'there')
    assert.equal(getWordSlotPlaceholder('There', 'xx'), 'xxere')
    assert.equal(getWordSlotPlaceholder('Hi', 'HELLO'), 'hello')
    const longWord = 'Supercalifragilisticexpialidocious'
    assert.equal(getWordSlotPlaceholder(longWord, 'SUPER'), longWord.toLowerCase())
    assert.equal(getWordSlotView('Hi', longWord)[0]?.value, longWord)
    assert.equal(getWordSlotPlaceholder('', 'UNCHANGED'), 'unchanged')
})

test('抄写提示只派生剩余字符，错误和超长原值不回填，Unicode字符保持完整', (): void => {
    assert.equal(getWordSlotHint('Apple', ''), 'apple')
    assert.equal(getWordSlotHint('Apple', 'AP'), 'ple')
    assert.equal(getWordSlotHint('Apple', 'xx'), 'ple')
    assert.equal(getWordSlotHint('Apple', 'APPLES'), '')
    assert.equal(getWordSlotHint('', 'UNCHANGED'), '')
    assert.equal(getWordSlotHint('😀Cat', '😀'), 'cat')
    assert.equal(getWordSlotHint('😀Cat', 'x'), 'cat')
    assert.equal(getWordSlotHint('İ', 'İ'), '')
})

test('原生选区定位按单个空白分词，粘贴、替换后的值直接派生而不归一化', (): void => {
    const pasted = 'Hi  there.\nfriend'
    assert.equal(getWordSlotIndex(pasted, 0), 0)
    assert.equal(getWordSlotIndex(pasted, 2), 0)
    assert.equal(getWordSlotIndex(pasted, 3), 1)
    assert.equal(getWordSlotIndex(pasted, 4), 2)
    assert.equal(getWordSlotIndex(pasted, 10), 2)
    assert.equal(getWordSlotIndex(pasted, 11), 3)
    assert.equal(getWordSlotIndex(pasted, null), 3)
    assert.equal(getWordSlotIndex(pasted, -10), 0)
    assert.equal(getWordSlotIndex(pasted, 1000), 3)
    const selectedStart = 4
    const selectedEnd = 10
    const replaced = pasted.slice(0, selectedStart) + 'you!' + pasted.slice(selectedEnd)
    assert.deepEqual(
        getWordSlotView('Hi there.', replaced).map((slot) => slot.value),
        ['Hi', ' you!\nfriend'],
    )
    assert.equal(getWordSlotIndex(replaced, selectedStart + 'you!'.length), 2)
})

test('单词和短语分别固定一条与三条线，尾空白不会增加词槽，超额录入仍可编辑', (): void => {
    for (const value of ['', 'woman', 'woman ', 'woman   ', 'woman another word']) {
        const slots = getWordSlotView('woman', value)
        assert.equal(slots.length, 1)
        assert.equal(slots[0]?.value, value)
        assert.deepEqual(getWordSlotSelection(value, 0, 'woman'), {
            value,
            start: value.length,
            end: value.length,
        })
    }
    for (const value of ['', 'how ', 'how are ', 'how are you', 'how are you   '])
        assert.equal(getWordSlotView('how are you', value).length, 3)
    const extra = 'how are you again'
    assert.equal(getWordSlotView('how are you', extra)[2]?.value, 'you again')
    assert.deepEqual(getWordSlotSelection(extra, 2, 'how are you'), {
        value: extra,
        start: extra.length,
        end: extra.length,
    })
})

test('末槽普通空格可提交，不用词长猜测正确性；未填完、中部光标和选区继续原生编辑', (): void => {
    for (const value of ['woman', 'wom', 'wrong', 'woman '])
        assert.equal(shouldSubmitWordSlots('woman', value, value.length, value.length), true)
    assert.equal(shouldSubmitWordSlots('how are you', 'how are you', 11, 11), true)
    for (const value of ['', 'how', 'how are', 'how  you'])
        assert.equal(shouldSubmitWordSlots('how are you', value, value.length, value.length), false)
    assert.equal(shouldSubmitWordSlots('woman', 'woman', 2, 2), false)
    assert.equal(shouldSubmitWordSlots('woman', 'woman', 0, 5), false)
})

test('点击空词及尚不存在的第二词只补必要空格，点击已有词仅将光标置词末', (): void => {
    assert.deepEqual(getWordSlotSelection('', 0), { value: '', start: 0, end: 0 })
    assert.deepEqual(getWordSlotSelection('', 1), { value: ' ', start: 1, end: 1 })
    assert.deepEqual(getWordSlotSelection('Hi', 1), { value: 'Hi ', start: 3, end: 3 })
    assert.deepEqual(getWordSlotSelection('Hi', 2), { value: 'Hi  ', start: 4, end: 4 })
    assert.deepEqual(getWordSlotSelection('Hi ', 1), { value: 'Hi ', start: 3, end: 3 })
    assert.deepEqual(getWordSlotSelection('Hi  there.', 1), {
        value: 'Hi  there.',
        start: 3,
        end: 3,
    })
    assert.deepEqual(getWordSlotSelection('Hi  there.', 2), {
        value: 'Hi  there.',
        start: 10,
        end: 10,
    })
    assert.deepEqual(getWordSlotSelection('Hi\tthere.', 2), {
        value: 'Hi\tthere. ',
        start: 10,
        end: 10,
    })
    assert.deepEqual(getWordSlotSelection('Hi there.', 0), { value: 'Hi there.', start: 2, end: 2 })
})

test('Unicode 字符与组合输入结果沿用原生 UTF-16 选区，不推断物理按键或改写内容', (): void => {
    const value = '🙂 café 汉字'
    const view = getWordSlotView('🙂 café 汉字', value)
    assert.deepEqual(
        view.map(({ start, end }) => ({ start, end })),
        [
            { start: 0, end: 2 },
            { start: 3, end: 7 },
            { start: 8, end: 10 },
        ],
    )
    assert.equal(getWordSlotIndex(value, 2), 0)
    assert.equal(getWordSlotIndex(value, 3), 1)
    assert.deepEqual(getWordSlotSelection(value, 2), { value, start: 10, end: 10 })
    const composingValue = 'Hi ni'
    const committedValue = 'Hi 你'
    assert.equal(getWordSlotView('Hi there.', composingValue)[1]?.value, 'ni')
    assert.equal(getWordSlotView('Hi there.', committedValue)[1]?.value, '你')
})
