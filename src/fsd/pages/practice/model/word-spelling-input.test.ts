import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getDemoQuestions,
    initialPracticeSession,
    practiceDemos,
    reducePracticeSession,
} from './practice-demo'
import { getDemoWordPhonetics } from './word-phonetics-demo'
import { hasPracticeAnswerInput } from './practice-visibility'
import type { WordPhoneticBreakdown } from './word-phonetics'
import {
    createWordSpellingInputState,
    createWordSpellingLayout,
    deleteWordSpellingInput,
    getWordSpellingLetters,
    getWordSpellingEntryCursor,
    getWordSpellingEditablePositions,
    getPracticeAnswerKeyAction,
    spaceWordSpellingInput,
    clearWordSpellingInputSelection,
    resetEmptyWordSpellingCursor,
    isWordSpellingLetter,
    moveWordSpellingCursor,
    serializeWordSpellingInput,
    submitWordSpellingInput,
    typeWordSpellingInput,
} from './word-spelling-input'

test('聚焦保留模型光标，空输入或过期空位只回到允许的编辑位置', (): void => {
    const layout = createWordSpellingLayout('apple', 'original')
    const empty = createWordSpellingInputState(layout)
    assert.equal(getWordSpellingEntryCursor(empty), 0)
    assert.equal(getWordSpellingEntryCursor({ ...empty, cursor: 4 }), 0)
    const partial = typeWordSpellingInput(empty, 'app')
    assert.equal(getWordSpellingEntryCursor(partial), 3)
    assert.equal(getWordSpellingEntryCursor({ ...partial, cursor: 0 }), 0)
    assert.equal(getWordSpellingEntryCursor({ ...partial, cursor: 4 }), 0)
})

test('十二道模拟拼写题的两种拆分均有完整字母映射，不按IPA字符猜字母', (): void => {
    for (const question of getDemoQuestions('word', 'spell'))
        for (const mode of ['syllables', 'phonics'] as const) {
            const layout = createWordSpellingLayout(question.english, mode, question.wordPhonetics)
            assert.equal(layout.mapped, true, `${question.english}/${mode}`)
            assert.equal(layout.segments.length, question.wordPhonetics?.[mode][0]?.segments.length)
            assert.equal(
                layout.segments
                    .flatMap((segment) => segment.characters.map((character) => character.target))
                    .join(''),
                question.english,
            )
            assert.deepEqual(
                layout.segments.flatMap((segment) => segment.positions),
                Array.from({ length: layout.answer.length }, (_, index) => index),
            )
        }
    const book = createWordSpellingLayout('book', 'phonics', getDemoWordPhonetics('book', '/bʊk/'))
    assert.deepEqual(
        book.segments.map((segment) =>
            segment.characters.map((character) => character.target).join(''),
        ),
        ['b', 'oo', 'k'],
    )
    const woman = getDemoWordPhonetics('woman', '/ˈwʊmən/')
    for (const mode of ['original', 'none'] as const) {
        const layout = createWordSpellingLayout('woman', mode, woman)
        assert.equal(layout.split, false)
        assert.equal(layout.answer.length, 5)
    }
})

test('缺失、过期或覆盖不完整的字母映射回退整词，不错误定位音标', (): void => {
    const fixtures: readonly (WordPhoneticBreakdown | undefined)[] = [
        undefined,
        {
            syllables: [
                { id: 'broken', word: 'book', segments: [{ id: 'b', ipa: 'b', spelling: 'b' }] },
            ],
            phonics: [{ id: 'legacy', word: 'book', segments: [{ id: 'b', ipa: 'bʊk' }] }],
        },
        getDemoWordPhonetics('woman', '/ˈwʊmən/'),
    ]
    for (const breakdown of fixtures) {
        for (const mode of ['syllables', 'phonics'] as const) {
            const layout = createWordSpellingLayout('book', mode, breakdown)
            assert.equal(layout.mapped, false)
            assert.equal(layout.segments.length, 1)
            assert.deepEqual(layout.segments[0]?.positions, [0, 1, 2, 3])
        }
    }
})

test('空值锁首位；apple输入app时，空格只在已填三位和首空位循环，Enter不导航', (): void => {
    for (const mode of ['original', 'syllables', 'phonics', 'none'] as const) {
        const layout = createWordSpellingLayout('apple', mode)
        const empty = createWordSpellingInputState(layout)
        assert.equal(spaceWordSpellingInput(empty, layout, true).state.cursor, 0)
        assert.equal(deleteWordSpellingInput({ ...empty, cursor: 4 }).cursor, 0)
        let state = typeWordSpellingInput(empty, 'app')
        assert.equal(state.cursor, 3)
        assert.deepEqual(getWordSpellingEditablePositions(state), [0, 1, 2, 3])
        const entered = state.letters
        for (const cursor of [0, 1, 2, 3, 0]) {
            const result = spaceWordSpellingInput(state, layout, true)
            assert.equal(result.value, null)
            state = result.state
            assert.equal(state.cursor, cursor)
            assert.equal(state.letters, entered)
            assert.equal(state.attempts, 0)
            assert.equal(submitWordSpellingInput(state, layout, true).state, state)
        }
        state = typeWordSpellingInput(state, 'A')
        assert.equal(state.cursor, 1)
        assert.deepEqual(state.letters, ['A', 'p', 'p', '', ''])
    }
})

test('删除留空后只允许已填位及首空位；空位再删除只退到前面已有字母', (): void => {
    const layout = createWordSpellingLayout('apple', 'syllables')
    const partial = typeWordSpellingInput(createWordSpellingInputState(layout), 'app')
    const deleted = deleteWordSpellingInput({ ...partial, cursor: 1 })
    assert.deepEqual(deleted.letters, ['a', '', 'p', '', ''])
    assert.equal(deleted.cursor, 1)
    assert.deepEqual(getWordSpellingEditablePositions(deleted), [0, 1, 2])
    assert.equal(moveWordSpellingCursor(deleted, layout).cursor, 2)
    assert.equal(moveWordSpellingCursor({ ...deleted, cursor: 2 }, layout).cursor, 0)
    assert.equal(deleteWordSpellingInput(deleted).cursor, 0)
    assert.equal(
        deleteWordSpellingInput({ ...deleted, cursor: 0, letters: ['', '', 'p', '', ''] }).cursor,
        0,
    )
})

test('定位键及其修饰组合禁止原生定位；IME、已消费命令与全文编辑组合让行', (): void => {
    const event = {
        key: '',
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        defaultPrevented: false,
    }
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End'])
        for (const modifier of [
            {},
            { shiftKey: true },
            { ctrlKey: true },
            { metaKey: true },
            { altKey: true },
        ])
            assert.equal(
                getPracticeAnswerKeyAction({ ...event, ...modifier, key }),
                'block-position',
            )
    assert.equal(getPracticeAnswerKeyAction({ ...event, key: ' ' }), 'space')
    assert.equal(getPracticeAnswerKeyAction({ ...event, key: 'Enter' }), 'submit')
    for (const key of ['ArrowLeft', ' ', 'Enter', 'Backspace']) {
        assert.equal(getPracticeAnswerKeyAction({ ...event, key, isComposing: true }), 'native')
        assert.equal(getPracticeAnswerKeyAction({ ...event, key, keyCode: 229 }), 'native')
        assert.equal(
            getPracticeAnswerKeyAction({ ...event, key, defaultPrevented: true }),
            'native',
        )
    }
    for (const key of ['a', 'c', 'v', 'x'])
        assert.equal(getPracticeAnswerKeyAction({ ...event, key, ctrlKey: true }), 'native')
    assert.equal(getPracticeAnswerKeyAction({ ...event, key: 'z', metaKey: true }), 'undo')
    assert.equal(
        getPracticeAnswerKeyAction({ ...event, key: 'z', metaKey: true, shiftKey: true }),
        'redo',
    )
})

test('全错后改前两位，再编辑已处理位置也继续下一错位，不会因全文已填满卡住', (): void => {
    const breakdown = getDemoWordPhonetics('woman', '/ˈwʊmən/')
    for (const layout of [
        createWordSpellingLayout('woman', 'original', breakdown),
        createWordSpellingLayout('woman', 'syllables', breakdown),
        createWordSpellingLayout('woman', 'phonics', breakdown),
        createWordSpellingLayout('woman', 'syllables'),
    ]) {
        const submitted = submitWordSpellingInput(
            createWordSpellingInputState(layout, 'xxxxx'),
            layout,
            true,
        )
        assert.deepEqual(submitted.state.wrong, [0, 1, 2, 3, 4])
        const corrected = typeWordSpellingInput(submitted.state, 'wo')
        assert.equal(corrected.cursor, 2)
        assert.deepEqual(corrected.wrong, [2, 3, 4])
        for (const cursor of [0, 1])
            for (const deleteFirst of [false, true]) {
                const revisiting = { ...corrected, cursor }
                const before = deleteFirst ? deleteWordSpellingInput(revisiting) : revisiting
                const next = typeWordSpellingInput(before, cursor === 0 ? 'w' : 'o')
                assert.equal(next.cursor, 2)
                assert.deepEqual(next.wrong, [2, 3, 4])
                assert.equal(serializeWordSpellingInput(layout, next), 'woxxx')
                const finished = typeWordSpellingInput(next, 'man')
                assert.deepEqual(finished.wrong, [])
                assert.equal(finished.completed, false)
                assert.equal(finished.attempts, 1)
                const checked = submitWordSpellingInput(finished, layout, true)
                assert.equal(checked.value, 'woman')
                assert.equal(checked.state.completed, true)
                assert.equal(checked.state.attempts, 2)
            }
    }
})

test('填满才校验，仅错位标红；纠错覆盖并定位下一错位，正确后不能重复提交', (): void => {
    const layout = createWordSpellingLayout('woman', 'original')
    const entered = typeWordSpellingInput(createWordSpellingInputState(layout), 'wxmyx')
    assert.deepEqual(entered.wrong, [])
    const wrong = submitWordSpellingInput(entered, layout, true)
    assert.equal(wrong.value, 'wxmyx')
    assert.deepEqual(wrong.state.wrong, [1, 3, 4])
    assert.equal(wrong.state.cursor, 1)
    assert.equal(wrong.state.attempts, 1)
    const navigating = submitWordSpellingInput(wrong.state, layout, true)
    assert.equal(navigating.value, null)
    assert.deepEqual(navigating.state.wrong, [1, 3, 4])
    const first = typeWordSpellingInput(wrong.state, 'o')
    assert.equal(first.cursor, 3)
    assert.deepEqual(first.wrong, [3, 4])
    const corrected = typeWordSpellingInput(first, 'an')
    assert.deepEqual(corrected.wrong, [])
    const result = submitWordSpellingInput(corrected, layout, true)
    assert.equal(result.value, 'woman')
    assert.equal(result.state.completed, true)
    assert.equal(submitWordSpellingInput(result.state, layout, true).value, null)
    assert.equal(typeWordSpellingInput(result.state, 'x'), result.state)
})

test('清除红色只表示该位已修改，重新输入错误字母后仍须整词重新校验', (): void => {
    const layout = createWordSpellingLayout('cat', 'original')
    const wrong = submitWordSpellingInput(createWordSpellingInputState(layout, 'cut'), layout, true)
    const changed = typeWordSpellingInput(wrong.state, 'o')
    assert.deepEqual(changed.wrong, [])
    const retried = submitWordSpellingInput(changed, layout, true)
    assert.deepEqual(retried.state.wrong, [1])
    assert.equal(retried.state.completed, false)
    assert.equal(retried.state.attempts, 2)
})

test('删除先清当前位并保持定位，空位再次删除才向前定位，不移动其他字母', (): void => {
    const layout = createWordSpellingLayout('cat', 'original')
    const state = { ...createWordSpellingInputState(layout, 'cut'), cursor: 1, wrong: [1] }
    const cleared = deleteWordSpellingInput(state)
    assert.deepEqual(cleared.letters, ['c', '', 't'])
    assert.deepEqual(cleared.wrong, [1])
    assert.equal(cleared.cursor, 1)
    assert.equal(deleteWordSpellingInput(cleared).cursor, 0)
    assert.equal(deleteWordSpellingInput(createWordSpellingInputState(layout)).cursor, 0)
    assert.equal(submitWordSpellingInput(cleared, layout, true).value, null)
})

test('整词清空重回首位，选区删除或覆盖错误字母仍按同一模型跳下一错位', (): void => {
    for (const layout of [
        createWordSpellingLayout('woman', 'syllables', getDemoWordPhonetics('woman', '/ˈwʊmən/')),
        createWordSpellingLayout('woman', 'syllables'),
    ]) {
        const submitted = submitWordSpellingInput(
            createWordSpellingInputState(layout, 'wdmdn'),
            layout,
            true,
        ).state
        const cleared = clearWordSpellingInputSelection(submitted, 1, 2)
        assert.deepEqual(cleared.wrong, [1, 3])
        const first = typeWordSpellingInput(cleared, 'o')
        assert.equal(first.cursor, 3)
        assert.deepEqual(first.wrong, [3])
        const fixed = typeWordSpellingInput(first, 'a')
        assert.equal(submitWordSpellingInput(fixed, layout, true).state.completed, true)
        const replaced = typeWordSpellingInput(
            clearWordSpellingInputSelection(submitted, 0, 3),
            'wom',
            'selection',
        )
        assert.deepEqual(replaced.letters, ['w', 'o', 'm', 'd', 'n'])
        assert.deepEqual(replaced.wrong, [3])
        assert.equal(replaced.cursor, 3)
        assert.equal(
            submitWordSpellingInput(typeWordSpellingInput(replaced, 'a'), layout, true).state
                .completed,
            true,
        )
        const empty = clearWordSpellingInputSelection(submitted, 0, 5)
        assert.equal(empty.cursor, 0)
        assert.deepEqual(empty.letters, ['', '', '', '', ''])
        assert.deepEqual(empty.wrong, [])
        assert.equal(
            submitWordSpellingInput(typeWordSpellingInput(empty, 'woman'), layout, true).state
                .completed,
            true,
        )
        const last = { ...empty, letters: ['', '', '', '', 'n'], cursor: 4 }
        assert.equal(deleteWordSpellingInput(last).cursor, 0)
        assert.equal(resetEmptyWordSpellingCursor({ ...empty, cursor: 4 }).cursor, 0)
    }
})

test('先删除再输入与直接覆盖都跳过正确字母，逐个处理待纠错位置后才能重新提交', (): void => {
    const breakdown = getDemoWordPhonetics('woman', '/ˈwʊmən/')
    for (const mode of ['original', 'syllables', 'phonics', 'none'] as const)
        for (const deleteFirst of [false, true]) {
            const layout = createWordSpellingLayout('woman', mode, breakdown)
            const submitted = submitWordSpellingInput(
                createWordSpellingInputState(layout, 'wdmdn'),
                layout,
                true,
            )
            assert.deepEqual(submitted.state.wrong, [1, 3])
            assert.equal(submitted.state.cursor, 1)
            const beforeFirst = deleteFirst
                ? deleteWordSpellingInput(submitted.state)
                : submitted.state
            assert.deepEqual(beforeFirst.wrong, [1, 3])
            assert.equal(beforeFirst.cursor, 1)
            const first = typeWordSpellingInput(beforeFirst, 'o')
            assert.equal(first.cursor, 3)
            assert.deepEqual(first.wrong, [3])
            assert.equal(first.attempts, 1)
            const beforeLast = deleteFirst ? deleteWordSpellingInput(first) : first
            const last = typeWordSpellingInput(beforeLast, 'a')
            assert.deepEqual(last.wrong, [])
            assert.equal(last.completed, false)
            assert.equal(last.attempts, 1)
            const checked = submitWordSpellingInput(last, layout, true)
            assert.equal(checked.value, 'woman')
            assert.equal(checked.state.completed, true)
            assert.equal(checked.state.attempts, 2)
        }
})

test('连续三个错位删除后输入立即依次跳转，不把尚未填回的空位视为已处理', (): void => {
    const layout = createWordSpellingLayout('woman', 'original')
    let state = submitWordSpellingInput(
        createWordSpellingInputState(layout, 'wdddn'),
        layout,
        true,
    ).state
    for (const [position, letter, remaining, next] of [
        [1, 'o', [2, 3], 2],
        [2, 'm', [3], 3],
        [3, 'a', [], 4],
    ] as const) {
        assert.equal(state.cursor, position)
        state = deleteWordSpellingInput(state)
        assert.equal(state.letters[position], '')
        assert.ok(state.wrong.includes(position))
        assert.equal(submitWordSpellingInput(state, layout, true).value, null)
        state = typeWordSpellingInput(state, letter)
        assert.deepEqual(state.wrong, remaining)
        assert.equal(state.cursor, next)
    }
    assert.equal(submitWordSpellingInput(state, layout, true).state.completed, true)
})

test('任意字母替换均推进纠错，仍拼错时只在重新提交后标红；剩余错位在前方时循环定位', (): void => {
    const layout = createWordSpellingLayout('woman', 'original')
    const submitted = submitWordSpellingInput(
        createWordSpellingInputState(layout, 'wdmdn'),
        layout,
        true,
    )
    const changed = typeWordSpellingInput(deleteWordSpellingInput(submitted.state), 'x')
    assert.equal(changed.cursor, 3)
    assert.deepEqual(changed.wrong, [3])
    const finished = typeWordSpellingInput(changed, 'a')
    assert.deepEqual(finished.wrong, [])
    const retried = submitWordSpellingInput(finished, layout, true)
    assert.equal(retried.value, 'wxman')
    assert.deepEqual(retried.state.wrong, [1])
    assert.equal(retried.state.completed, false)
    const laterFirst = typeWordSpellingInput({ ...submitted.state, cursor: 3 }, 'a')
    assert.equal(laterFirst.cursor, 1)
    assert.deepEqual(laterFirst.wrong, [1])
})

test('大小写遵守设置，静态标点和词间空白不占字母位，组合结果只接收英文', (): void => {
    const layout = createWordSpellingLayout('“Hi, there!”', 'none')
    const state = typeWordSpellingInput(createWordSpellingInputState(layout), 'Hithere')
    assert.equal(serializeWordSpellingInput(layout, state), '“Hi, there!”')
    assert.equal(submitWordSpellingInput(state, layout, false).state.completed, true)
    const upper = createWordSpellingInputState(layout, 'HITHERE')
    assert.equal(submitWordSpellingInput(upper, layout, true).state.completed, true)
    assert.deepEqual(submitWordSpellingInput(upper, layout, false).state.wrong, [1, 2, 3, 4, 5, 6])
    assert.deepEqual(getWordSpellingLetters('中A1b😀'), ['A', 'b'])
    assert.deepEqual(getWordSpellingLetters('ＨｉſK'), [])
    assert.equal(isWordSpellingLetter('ſ'), false)
    assert.equal(isWordSpellingLetter('K'), false)
})

test('实际校验才进入页面统计；跳格和纠错导航不计提交，答对沿原去重统计', (): void => {
    const layout = createWordSpellingLayout('cat', 'original')
    let state = createWordSpellingInputState(layout)
    let session = initialPracticeSession
    const navigation = submitWordSpellingInput(state, layout, true)
    assert.equal(navigation.value, null)
    assert.equal(navigation.state.attempts, 0)
    state = moveWordSpellingCursor(navigation.state, layout, -1)
    for (const input of ['cut', 'a']) {
        state = typeWordSpellingInput(state, input)
        const result = submitWordSpellingInput(state, layout, true)
        state = result.state
        if (result.value !== null)
            session = reducePracticeSession(session, {
                type: 'submit-spelling',
                value: result.value,
                target: 'cat',
                ignoreCase: true,
            })
    }
    assert.deepEqual(session.spellingStatistics, { submissions: 2, correct: 1 })
    assert.equal(session.phase, 'correct')
})

test('所有现有文字作答模式使用相同空格范围、全错覆盖、自动跳错和重新校验', (): void => {
    for (const demo of practiceDemos)
        for (const mode of demo.modes.filter(hasPracticeAnswerInput)) {
            const question = getDemoQuestions(demo.family, mode)[0]
            assert.ok(question, `${demo.family}:${mode}`)
            const alphabet =
                demo.family === 'word' && (mode === 'spell' || mode === 'dictate')
                    ? 'latin'
                    : mode === 'typing'
                      ? 'typing'
                      : 'text'
            const layout = createWordSpellingLayout(
                question.english,
                'syllables',
                undefined,
                alphabet,
            )
            assert.ok(layout.answer.length > 2)
            let state = typeWordSpellingInput(
                createWordSpellingInputState(layout),
                layout.answer.map((letter) => (letter.toLowerCase() === 'x' ? 'z' : 'x')).join(''),
                'cursor',
                alphabet,
            )
            state = spaceWordSpellingInput(state, layout, true).state
            assert.deepEqual(
                state.wrong,
                layout.answer.map((_, index) => index),
            )
            assert.equal(state.cursor, 0)
            assert.equal(spaceWordSpellingInput(state, layout, true).state.cursor, 1)
            state = typeWordSpellingInput(
                state,
                layout.answer.slice(0, 2).join(''),
                'cursor',
                alphabet,
            )
            assert.equal(state.cursor, 2)
            assert.equal(getWordSpellingEntryCursor(state), 2)
            state = typeWordSpellingInput(
                state,
                layout.answer.slice(2).join(''),
                'cursor',
                alphabet,
            )
            assert.deepEqual(state.wrong, [])
            assert.equal(state.completed, false)
            const result = spaceWordSpellingInput(state, layout, true)
            assert.equal(result.state.completed, true)
            assert.equal(result.state.attempts, 2)
            assert.equal(result.value, question.english)
        }
})

test('文字与数字共享推进，UTF16全文删除不拆坏Unicode码点', (): void => {
    const layout = createWordSpellingLayout('Hi 中文 𝒜2!', 'syllables', undefined, 'text')
    let state = typeWordSpellingInput(
        createWordSpellingInputState(layout),
        'Hi中文𝒜2',
        'cursor',
        'text',
    )
    assert.equal(serializeWordSpellingInput(layout, state), 'Hi 中文 𝒜2!')
    assert.equal(submitWordSpellingInput(state, layout, false).state.completed, true)
    state = clearWordSpellingInputSelection(state, 4, 6)
    assert.equal(state.letters[4], '')
    assert.equal(state.letters[5], '2')
    assert.equal(state.cursor, 4)
})

test('指法保留标点录入；普通文字模式提供静态标点，二者光标导航规则相同', (): void => {
    const target = 'Hi, there!'
    const layout = createWordSpellingLayout(target, 'syllables', undefined, 'typing')
    let state = typeWordSpellingInput(
        createWordSpellingInputState(layout),
        'Hi',
        'cursor',
        'typing',
    )
    assert.equal(state.cursor, 2)
    assert.equal(layout.answer[state.cursor], ',')
    assert.equal(submitWordSpellingInput(state, layout, false).value, null)
    state = typeWordSpellingInput(state, ',there!', 'cursor', 'typing')
    assert.equal(submitWordSpellingInput(state, layout, false).value, target)
    assert.equal(createWordSpellingInputState(layout, target).letters.join(''), 'Hi,there!')
    const text = createWordSpellingLayout(target, 'syllables', undefined, 'text')
    assert.equal(text.answer.join(''), 'Hithere')
})

test('连续纠错粘贴在待改位完成时停止，不反复覆盖最后一个正确位置', (): void => {
    const layout = createWordSpellingLayout('apple', 'original')
    const state = submitWordSpellingInput(
        createWordSpellingInputState(layout, 'xxple'),
        layout,
        true,
    ).state
    const edited = typeWordSpellingInput(state, 'apple')
    assert.equal(edited.letters.join(''), 'apple')
    assert.deepEqual(edited.wrong, [])
    assert.equal(edited.completed, false)
})
