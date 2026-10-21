import assert from 'node:assert/strict'
import test from 'node:test'
import { getDemoQuestions, initialPracticeSession, reducePracticeSession } from './practice-demo'
import { getDemoWordPhonetics } from './word-phonetics-demo'
import type { WordPhoneticBreakdown } from './word-phonetics'
import {
    createWordSpellingInputState,
    createWordSpellingLayout,
    deleteWordSpellingInput,
    getWordSpellingLetters,
    isWordSpellingLetter,
    moveWordSpellingCursor,
    serializeWordSpellingInput,
    submitWordSpellingInput,
    typeWordSpellingInput,
} from './word-spelling-input'

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

test('未填满的空格只导航，字母模式逐位循环，分段模式跳下一段首字母', (): void => {
    const breakdown = getDemoWordPhonetics('woman', '/ˈwʊmən/')
    const plain = createWordSpellingLayout('woman', 'original', breakdown)
    const initial = createWordSpellingInputState(plain)
    const moved = submitWordSpellingInput(initial, plain, true)
    assert.equal(moved.value, null)
    assert.equal(moved.state.cursor, 1)
    assert.equal(moved.state.attempts, 0)
    assert.equal(moveWordSpellingCursor(initial, plain, -1).cursor, 4)
    const split = createWordSpellingLayout('woman', 'syllables', breakdown)
    assert.equal(submitWordSpellingInput(initial, split, true).state.cursor, 2)
    assert.equal(moveWordSpellingCursor({ ...initial, cursor: 3 }, split).cursor, 0)
    assert.equal(moveWordSpellingCursor(initial, split, -1).cursor, 2)
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

test('删除先清当前位并保持定位，空位再次删除才向前循环，不移动其他字母', (): void => {
    const layout = createWordSpellingLayout('cat', 'original')
    const state = { ...createWordSpellingInputState(layout, 'cut'), cursor: 1, wrong: [1] }
    const cleared = deleteWordSpellingInput(state)
    assert.deepEqual(cleared.letters, ['c', '', 't'])
    assert.deepEqual(cleared.wrong, [1])
    assert.equal(cleared.cursor, 1)
    assert.equal(deleteWordSpellingInput(cleared).cursor, 0)
    assert.equal(deleteWordSpellingInput(createWordSpellingInputState(layout)).cursor, 2)
    assert.equal(submitWordSpellingInput(cleared, layout, true).value, null)
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
