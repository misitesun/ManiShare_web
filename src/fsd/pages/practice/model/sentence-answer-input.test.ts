import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createSentenceAnswerLayout,
    createSentenceAnswerState,
    editSentenceAnswerSlot,
    getSentenceAnswerEditingSnapshot,
    getSentenceAnswerInputSelection,
    isSentenceAnswerComplete,
    isSentenceAnswerNavigation,
    judgeSentenceAnswerValues,
    moveSentenceAnswerSlot,
    selectSentenceAnswerSlot,
    serializeSentenceAnswer,
    spaceSentenceAnswer,
    submitSentenceAnswer,
} from './sentence-answer-input'

const layout = createSentenceAnswerLayout('give me a hand.')

test('跳格反馈只对应实际导航，边界停留与提交首错定位不播放跳格音', (): void => {
    const initial = createSentenceAnswerState(layout)
    const next = spaceSentenceAnswer(initial, layout, true)
    assert.equal(next.state.activeIndex, 1)
    assert.equal(isSentenceAnswerNavigation(initial, next), true)
    assert.equal(
        isSentenceAnswerNavigation(initial, submitSentenceAnswer(initial, layout, true)),
        true,
    )
    assert.equal(
        isSentenceAnswerNavigation(initial, {
            state: moveSentenceAnswerSlot(initial, -1),
            submission: null,
        }),
        false,
    )
    assert.equal(
        isSentenceAnswerNavigation(next.state, {
            state: moveSentenceAnswerSlot(next.state, -1),
            submission: null,
        }),
        true,
    )
    const lastEmpty = selectSentenceAnswerSlot(initial, 3)
    assert.equal(
        isSentenceAnswerNavigation(lastEmpty, spaceSentenceAnswer(lastEmpty, layout, true)),
        true,
    )
    assert.equal(
        isSentenceAnswerNavigation(lastEmpty, {
            state: moveSentenceAnswerSlot(lastEmpty, 1),
            submission: null,
        }),
        false,
    )
    for (const value of ['give me a hand', 'give wrong a hand']) {
        const filled = selectSentenceAnswerSlot(createSentenceAnswerState(layout, value), 3)
        const submitted = spaceSentenceAnswer(filled, layout, true)
        assert.notEqual(submitted.submission, null)
        assert.equal(isSentenceAnswerNavigation(filled, submitted), false)
        if (!submitted.state.completed) assert.equal(submitted.state.activeIndex, 1)
    }
    const single = createSentenceAnswerLayout('hello')
    const only = createSentenceAnswerState(single)
    assert.equal(isSentenceAnswerNavigation(only, spaceSentenceAnswer(only, single, true)), false)
})

test('指法键盘快照只跟随当前词段及错段替换位置，忽略整句序列化长度', (): void => {
    const initial = createSentenceAnswerState(layout)
    const third = selectSentenceAnswerSlot(initial, 2)
    const editing = editSentenceAnswerSlot(third, layout, 'x')
    const snapshot = getSentenceAnswerEditingSnapshot(layout, editing)
    assert.equal(snapshot.target, 'a')
    assert.equal(snapshot.value, 'x')
    assert.equal(snapshot.cursor, 1)
    const wrong = submitSentenceAnswer(
        { ...editing, values: ['give', 'me', 'x', 'hand'] },
        layout,
        true,
    ).state
    assert.equal(getSentenceAnswerEditingSnapshot(layout, wrong).cursor, 0)
    const corrected = editSentenceAnswerSlot(wrong, layout, 'a')
    assert.equal(getSentenceAnswerEditingSnapshot(layout, corrected).cursor, 1)
    const last = selectSentenceAnswerSlot(corrected, 3)
    assert.equal(getSentenceAnswerEditingSnapshot(layout, last).target, 'hand')
    assert.notEqual(getSentenceAnswerEditingSnapshot(layout, last).slotId, snapshot.slotId)
})

test('空段可以跳过，后段输入不挤到前段，返回后保留各段原文', (): void => {
    const initial = createSentenceAnswerState(layout)
    const second = spaceSentenceAnswer(initial, layout, true).state
    assert.equal(second.activeIndex, 1)
    const edited = editSentenceAnswerSlot(second, layout, 'ww')
    assert.deepEqual(edited.values, ['', 'ww', '', ''])
    assert.deepEqual(moveSentenceAnswerSlot(edited, -1).values, ['', 'ww', '', ''])
    const last = selectSentenceAnswerSlot(edited, 3)
    const submitted = spaceSentenceAnswer(last, layout, true)
    assert.equal(submitted.submission, null)
    assert.equal(submitted.state.activeIndex, 0)
    assert.equal(moveSentenceAnswerSlot(initial, -1).activeIndex, 0)
    assert.equal(moveSentenceAnswerSlot(last, 1).activeIndex, 3)
})

test('只填一段时回车不提交，只向后跳段并保留内容与反馈', (): void => {
    const initial = createSentenceAnswerState(layout)
    const edited = editSentenceAnswerSlot(initial, layout, 'give')
    const result = submitSentenceAnswer(edited, layout, true)
    assert.equal(result.submission, null)
    assert.deepEqual(result.state.values, ['give', '', '', ''])
    assert.deepEqual(result.state.feedback, ['pending', 'pending', 'pending', 'pending'])
    assert.equal(result.state.activeIndex, 1)
    assert.equal(result.state.attempts, 0)
    assert.equal(result.state.completed, false)
})

test('末段空格提交，不以目标字母容量截断输入', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give ww w wwwwwww',
    )
    const result = spaceSentenceAnswer(edited, layout, true)
    assert.deepEqual(result.submission?.values, ['give', 'ww', 'w', 'wwwwwww'])
    assert.deepEqual(result.state.feedback, ['correct', 'incorrect', 'incorrect', 'incorrect'])
})

test('全空不提交且末段回首段，非末段空格只跳段', (): void => {
    const initial = createSentenceAnswerState(layout)
    assert.equal(submitSentenceAnswer(initial, layout, true).submission, null)
    const lastEmpty = spaceSentenceAnswer(selectSentenceAnswerSlot(initial, 3), layout, true)
    assert.equal(lastEmpty.submission, null)
    assert.equal(lastEmpty.state.activeIndex, 0)
    const first = editSentenceAnswerSlot(initial, layout, 'g')
    const result = spaceSentenceAnswer(first, layout, true)
    assert.equal(result.submission, null)
    assert.equal(result.state.activeIndex, 1)
    assert.deepEqual(result.state.values, ['g', '', '', ''])
})

test('各段已有内容时，非末段空格仍只移动，直到末段才提交', (): void => {
    const filled = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give me a hand',
    )
    let current = selectSentenceAnswerSlot(filled, 0)
    for (const next of [1, 2, 3]) {
        const result = spaceSentenceAnswer(current, layout, true)
        assert.equal(result.submission, null)
        assert.equal(result.state.attempts, 0)
        assert.equal(result.state.activeIndex, next)
        assert.deepEqual(result.state.values, ['give', 'me', 'a', 'hand'])
        current = result.state
    }
    const submitted = spaceSentenceAnswer(current, layout, true)
    assert.equal(submitted.state.attempts, 1)
    assert.equal(submitted.state.completed, true)
    assert.deepEqual(submitted.submission?.values, ['give', 'me', 'a', 'hand'])
})

test('只有后段有输入时，末段空格回到首个空段，不判错或增加提交次数', (): void => {
    const last = selectSentenceAnswerSlot(createSentenceAnswerState(layout), 3)
    const edited = editSentenceAnswerSlot(last, layout, 'wrong')
    const result = spaceSentenceAnswer(edited, layout, true)
    assert.equal(result.submission, null)
    assert.equal(result.state.activeIndex, 0)
    assert.deepEqual(result.state.values, ['', '', '', 'wrong'])
    assert.deepEqual(result.state.feedback, ['pending', 'pending', 'pending', 'pending'])
    assert.equal(result.state.attempts, 0)
    assert.equal(result.state.completed, false)
})

test('逐段判题不因trim或跨段拼接后的整句相同而误判正确', (): void => {
    const simple = createSentenceAnswerLayout('we read books together')
    const shifted = ['', 'we', 'read', 'books together']
    assert.equal(serializeSentenceAnswer(simple, shifted).trim(), simple.target)
    assert.equal(judgeSentenceAnswerValues(simple, shifted, true), 'incorrect')
    assert.equal(
        judgeSentenceAnswerValues(simple, ['we read', 'books', 'together', ''], true),
        'incorrect',
    )
})

test('原生多词粘贴保留溢出内容，静态标点不重复写入段值', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give me a hand. extra',
    )
    assert.deepEqual(edited.values, ['give', 'me', 'a', 'hand extra'])
    assert.equal(judgeSentenceAnswerValues(layout, edited.values, true), 'incorrect')
    const correct = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give me a hand.',
    )
    assert.deepEqual(correct.values, ['give', 'me', 'a', 'hand'])
    assert.equal(serializeSentenceAnswer(layout, correct.values), 'give me a hand.')
})

test('修改错段只清该段反馈，全部正确后遵守大小写偏好并冻结提交', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give ww a hand',
    )
    const wrong = submitSentenceAnswer(edited, layout, true).state
    const corrected = editSentenceAnswerSlot(wrong, layout, 'ME')
    assert.deepEqual(corrected.feedback, ['correct', 'pending', 'correct', 'correct'])
    assert.equal(judgeSentenceAnswerValues(layout, corrected.values, false), 'incorrect')
    const result = submitSentenceAnswer(corrected, layout, true)
    assert.equal(result.state.completed, true)
    assert.equal(submitSentenceAnswer(result.state, layout, true).submission, null)
    assert.deepEqual(result.submission?.values, ['give', 'ME', 'a', 'hand'])
})

test('提交首错段整体待替换，首错位置不变及再次提交仍全选该段', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'wwwwww me wrong hand',
    )
    const first = selectSentenceAnswerSlot(edited, 0)
    const wrong = submitSentenceAnswer(first, layout, true).state
    assert.equal(wrong.activeIndex, 0)
    assert.deepEqual(getSentenceAnswerInputSelection(wrong), { start: 0, end: 6 })
    const repeated = submitSentenceAnswer(wrong, layout, true).state
    assert.equal(repeated.activeIndex, 0)
    assert.deepEqual(getSentenceAnswerInputSelection(repeated), { start: 0, end: 6 })
    assert.equal(repeated.attempts, 2)
    const otherWrong = selectSentenceAnswerSlot(repeated, 2)
    assert.deepEqual(getSentenceAnswerInputSelection(otherWrong), { start: 0, end: 5 })
    const correct = selectSentenceAnswerSlot(repeated, 1)
    assert.deepEqual(getSentenceAnswerInputSelection(correct), { start: 2, end: 2 })
})

test('首次覆盖或删除只重置当前错段，后续输入恢复普通编辑且不改变其他段和提交次数', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'wrong me bad hand',
    )
    const wrong = submitSentenceAnswer(edited, layout, true).state
    const replaced = editSentenceAnswerSlot(wrong, layout, 'g')
    assert.deepEqual(replaced.values, ['g', 'me', 'bad', 'hand'])
    assert.deepEqual(replaced.feedback, ['pending', 'correct', 'incorrect', 'correct'])
    assert.deepEqual(getSentenceAnswerInputSelection(replaced), { start: 1, end: 1 })
    assert.equal(replaced.attempts, 1)
    const continued = editSentenceAnswerSlot(replaced, layout, 'gi')
    assert.deepEqual(continued.values, ['gi', 'me', 'bad', 'hand'])
    const cleared = editSentenceAnswerSlot(wrong, layout, '')
    assert.deepEqual(cleared.values, ['', 'me', 'bad', 'hand'])
    assert.deepEqual(cleared.feedback, ['pending', 'correct', 'incorrect', 'correct'])
    assert.deepEqual(getSentenceAnswerInputSelection(cleared), { start: 0, end: 0 })
    assert.equal(cleared.attempts, 1)
})

test('错误段选区使用UTF-16并兼容清空，避免截断组合字符', (): void => {
    const initial = createSentenceAnswerState(layout)
    const edited = editSentenceAnswerSlot(initial, layout, '😀a me a hand')
    const wrong = submitSentenceAnswer(edited, layout, true).state
    assert.deepEqual(getSentenceAnswerInputSelection(wrong), { start: 0, end: 3 })
    const empty = editSentenceAnswerSlot(wrong, layout, '')
    assert.deepEqual(getSentenceAnswerInputSelection(empty), { start: 0, end: 0 })
})

test('第二段清空、末段错误时，空格或回车从末段回到第二段，保留纠错状态', (): void => {
    const sentence = createSentenceAnswerLayout('you drink water')
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(sentence),
        sentence,
        'you bad w',
    )
    const wrong = submitSentenceAnswer(edited, sentence, true).state
    assert.equal(wrong.activeIndex, 1)
    const cleared = editSentenceAnswerSlot(wrong, sentence, '')
    for (const navigate of [spaceSentenceAnswer, submitSentenceAnswer]) {
        const last = navigate(cleared, sentence, true)
        assert.equal(last.submission, null)
        assert.equal(last.state.activeIndex, 2)
        const second = navigate(last.state, sentence, true)
        assert.equal(second.submission, null)
        assert.equal(second.state.activeIndex, 1)
        assert.deepEqual(second.state.values, ['you', '', 'w'])
        assert.deepEqual(second.state.feedback, ['correct', 'pending', 'incorrect'])
        assert.equal(second.state.attempts, 1)
    }
})

test('提交门槛检查所有实际段值，提示、空白或缺少段不能满足门槛', (): void => {
    assert.equal(isSentenceAnswerComplete(layout, ['give', '', 'a', 'hand']), false)
    assert.equal(isSentenceAnswerComplete(layout, ['give', '  ', 'a', 'hand']), false)
    assert.equal(isSentenceAnswerComplete(layout, ['give', 'me', 'a']), false)
    assert.equal(isSentenceAnswerComplete(layout, ['g', 'm', 'a', 'h']), true)
    const full = editSentenceAnswerSlot(createSentenceAnswerState(layout), layout, 'g m a h')
    const result = submitSentenceAnswer(selectSentenceAnswerSlot(full, 0), layout, true)
    assert.deepEqual(result.submission?.values, ['g', 'm', 'a', 'h'])
    assert.equal(result.state.attempts, 1)
    assert.equal(result.state.completed, false)
})

test('错误单字同字覆盖仍清反馈并折叠光标，下一字正常追加且不改其他段', (): void => {
    const sentence = createSentenceAnswerLayout('they play games')
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(sentence),
        sentence,
        'they play g',
    )
    const wrong = submitSentenceAnswer(edited, sentence, true).state
    assert.equal(wrong.activeIndex, 2)
    assert.deepEqual(getSentenceAnswerInputSelection(wrong), { start: 0, end: 1 })
    const replaced = editSentenceAnswerSlot(wrong, sentence, 'g')
    assert.deepEqual(replaced.values, ['they', 'play', 'g'])
    assert.deepEqual(replaced.feedback, ['correct', 'correct', 'pending'])
    assert.deepEqual(getSentenceAnswerInputSelection(replaced), { start: 1, end: 1 })
    assert.equal(replaced.attempts, wrong.attempts)
    const continued = editSentenceAnswerSlot(replaced, sentence, 'ga')
    assert.deepEqual(continued.values, ['they', 'play', 'ga'])
    assert.deepEqual(continued.feedback, ['correct', 'correct', 'pending'])
})

test('末段已判对时，中间错误段重新输入后空格直接提交，无需切到末段', (): void => {
    const sentence = createSentenceAnswerLayout('he writes stories')
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(sentence),
        sentence,
        'he w stories',
    )
    const wrong = submitSentenceAnswer(edited, sentence, true).state
    assert.equal(wrong.activeIndex, 1)
    assert.deepEqual(wrong.feedback, ['correct', 'incorrect', 'correct'])
    const corrected = editSentenceAnswerSlot(wrong, sentence, 'writes')
    const result = spaceSentenceAnswer(corrected, sentence, true)
    assert.deepEqual(result.submission?.values, ['he', 'writes', 'stories'])
    assert.equal(result.state.completed, true)
    assert.equal(result.state.activeIndex, 1)
    assert.equal(result.state.attempts, 2)

    const stillWrong = editSentenceAnswerSlot(wrong, sentence, 'wr')
    const retry = spaceSentenceAnswer(stillWrong, sentence, true)
    assert.deepEqual(retry.submission?.values, ['he', 'wr', 'stories'])
    assert.equal(retry.state.completed, false)
    assert.deepEqual(retry.state.feedback, ['correct', 'incorrect', 'correct'])
    assert.equal(retry.state.activeIndex, 1)
})

test('纠错快捷提交仍要求每段非空，未改动的红色段按空格继续导航', (): void => {
    const sentence = createSentenceAnswerLayout('he writes stories')
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(sentence),
        sentence,
        'he w stories',
    )
    const wrong = submitSentenceAnswer(edited, sentence, true).state
    const untouched = spaceSentenceAnswer(wrong, sentence, true)
    assert.equal(untouched.submission, null)
    assert.equal(untouched.state.activeIndex, 2)
    const cleared = editSentenceAnswerSlot(wrong, sentence, '')
    const last = spaceSentenceAnswer(cleared, sentence, true)
    assert.equal(last.submission, null)
    assert.equal(last.state.activeIndex, 2)
    const back = spaceSentenceAnswer(last.state, sentence, true)
    assert.equal(back.submission, null)
    assert.equal(back.state.activeIndex, 1)
    assert.equal(back.state.attempts, 1)
})

test('后面还有未处理错误时先跳段，最后一个待改段修改后可越过已判对的尾段提交', (): void => {
    const edited = editSentenceAnswerSlot(
        createSentenceAnswerState(layout),
        layout,
        'give bad bad hand',
    )
    const wrong = submitSentenceAnswer(edited, layout, true).state
    const second = editSentenceAnswerSlot(wrong, layout, 'me')
    const third = spaceSentenceAnswer(second, layout, true)
    assert.equal(third.submission, null)
    assert.equal(third.state.activeIndex, 2)
    assert.equal(third.state.attempts, 1)
    const corrected = editSentenceAnswerSlot(third.state, layout, 'a')
    const result = spaceSentenceAnswer(corrected, layout, true)
    assert.deepEqual(result.submission?.values, ['give', 'me', 'a', 'hand'])
    assert.equal(result.state.completed, true)
    assert.equal(result.state.activeIndex, 2)
    assert.equal(result.state.attempts, 2)
})
