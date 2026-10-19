import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createWordRememberSession,
    getWordRememberProgress,
    moveWordRememberSession,
    rememberWord,
    retryWord,
} from './word-remember-session'

const ids = ['woman', 'man', 'girl', 'boy'] as const

test('初始总量固定，空题集不作为已完成练习', (): void => {
    const state = createWordRememberSession(ids)
    assert.deepEqual(state, { remainingIds: ids, rememberedIds: [], index: 0 })
    assert.deepEqual(getWordRememberProgress(state), {
        total: 4,
        remaining: 4,
        remembered: 0,
        percent: 0,
        complete: false,
    })
    const empty = createWordRememberSession([])
    assert.deepEqual(getWordRememberProgress(empty), {
        total: 0,
        remaining: 0,
        remembered: 0,
        percent: 0,
        complete: false,
    })
    assert.equal(moveWordRememberSession(empty, 8), empty)
    assert.equal(rememberWord(empty, 'woman'), empty)
})

test('只有每张卡都记住才完成，记住过程不改变总题数', (): void => {
    let state = createWordRememberSession(ids)
    for (const [index, id] of ids.entries()) {
        state = rememberWord(state, id)
        const progress = getWordRememberProgress(state)
        assert.equal(progress.total, ids.length)
        assert.equal(progress.remembered, index + 1)
        assert.equal(progress.remaining, ids.length - index - 1)
        assert.equal(progress.percent, ((index + 1) / ids.length) * 100)
        assert.equal(progress.complete, index === ids.length - 1)
    }
    assert.deepEqual(state.remainingIds, [])
    assert.deepEqual(state.rememberedIds, ids)
    assert.equal(state.index, 0)
})

test('从末题记住后仍有剩余内容，停在剩余末张而不完成或循环', (): void => {
    const initial = createWordRememberSession(ids)
    const last = moveWordRememberSession(initial, 99)
    const remembered = rememberWord(last, 'boy')
    assert.deepEqual(remembered, {
        remainingIds: ['woman', 'man', 'girl'],
        rememberedIds: ['boy'],
        index: 2,
    })
    assert.equal(getWordRememberProgress(remembered).complete, false)
    assert.equal(getWordRememberProgress(remembered).percent, 25)
    assert.equal(moveWordRememberSession(remembered, 3), remembered)
    const nextRemembered = rememberWord(remembered, 'girl')
    assert.equal(nextRemembered.index, 1)
    assert.deepEqual(nextRemembered.remainingIds, ['woman', 'man'])
})

test('删除当前卡后相同 index 的新 ID 可连续记住，旧 ID 不会误伤新卡', (): void => {
    const initial = createWordRememberSession(ids)
    const first = rememberWord(initial, 'woman')
    assert.equal(first.index, 0)
    assert.equal(first.remainingIds[0], 'man')
    assert.equal(rememberWord(first, 'woman'), first)
    const second = rememberWord(first, 'man')
    assert.equal(second.index, 0)
    assert.equal(second.remainingIds[0], 'girl')
    assert.deepEqual(second.rememberedIds, ['woman', 'man'])
    assert.equal(getWordRememberProgress(second).percent, 50)
})

test('错误题目、迟到动作或重复记住保持同一状态引用', (): void => {
    const initial = createWordRememberSession(ids)
    assert.equal(rememberWord(initial, 'missing'), initial)
    assert.equal(rememberWord(initial, 'girl'), initial)
    const remembered = rememberWord(initial, 'woman')
    assert.equal(rememberWord(remembered, 'woman'), remembered)
    assert.equal(rememberWord(remembered, 'boy'), remembered)
    assert.deepEqual(initial.remainingIds, ids, '转换不修改原始状态')
    assert.deepEqual(initial.rememberedIds, [])
})

test('再来把当前待练卡放到队尾，下一张接位且不增加记住进度', (): void => {
    const initial = createWordRememberSession(ids)
    const retried = retryWord(initial, 'woman')
    assert.deepEqual(retried.remainingIds, ['man', 'girl', 'boy', 'woman'])
    assert.equal(retried.index, 0)
    assert.deepEqual(getWordRememberProgress(retried), getWordRememberProgress(initial))
    assert.deepEqual(initial.remainingIds, ids, '不修改原卡组')

    const middle = moveWordRememberSession(retried, 1)
    const retriedMiddle = retryWord(middle, 'girl')
    assert.deepEqual(retriedMiddle.remainingIds, ['man', 'boy', 'woman', 'girl'])
    assert.equal(retriedMiddle.index, 1)
    assert.equal(retriedMiddle.remainingIds[retriedMiddle.index], 'boy')

    const last = moveWordRememberSession(retriedMiddle, 3)
    const retriedLast = retryWord(last, 'girl')
    assert.deepEqual(retriedLast.remainingIds, retriedMiddle.remainingIds)
    assert.equal(retriedLast.index, 0, '末卡再来后从队首继续')
    assert.deepEqual(getWordRememberProgress(retriedLast), getWordRememberProgress(initial))
})

test('再来只接受当前卡，剩一张时保持原状态', (): void => {
    const initial = createWordRememberSession(ids)
    assert.equal(retryWord(initial, 'girl'), initial)
    assert.equal(retryWord(initial, 'missing'), initial)
    let state = initial
    for (const id of ids.slice(0, -1)) state = rememberWord(state, id)
    assert.equal(retryWord(state, 'boy'), state)
    assert.equal(getWordRememberProgress(state).remembered, 3)
})

test('首尾 clamp 与普通导航不增加进度，重复目标保留原引用', (): void => {
    const initial = createWordRememberSession(ids)
    assert.equal(moveWordRememberSession(initial, -1), initial)
    const last = moveWordRememberSession(initial, Number.POSITIVE_INFINITY)
    assert.equal(last.index, 3)
    assert.equal(moveWordRememberSession(last, 10), last)
    const middle = moveWordRememberSession(last, 1.9)
    assert.equal(middle.index, 1)
    assert.equal(moveWordRememberSession(middle, Number.NaN), middle)
    assert.deepEqual(getWordRememberProgress(middle), getWordRememberProgress(initial))
    assert.equal(moveWordRememberSession(middle, Number.NEGATIVE_INFINITY).index, 0)
})

test('重练从原题目 ID 列表恢复全部卡片并清空记住进度', (): void => {
    let previous = createWordRememberSession(ids)
    for (const id of ids) previous = rememberWord(previous, id)
    assert.equal(getWordRememberProgress(previous).complete, true)
    const restarted = createWordRememberSession(ids)
    assert.deepEqual(restarted.remainingIds, ids)
    assert.deepEqual(restarted.rememberedIds, [])
    assert.equal(restarted.index, 0)
    assert.equal(getWordRememberProgress(restarted).percent, 0)
    assert.equal(getWordRememberProgress(restarted).complete, false)
})

test('初始重复 ID 去重保序且复制输入，避免出现无法完成的同 ID 剩余卡', (): void => {
    const source = ['woman', 'man', 'woman', 'girl']
    const state = createWordRememberSession(source)
    source.push('boy')
    assert.deepEqual(state.remainingIds, ['woman', 'man', 'girl'])
    assert.equal(getWordRememberProgress(state).total, 3)
    const remembered = rememberWord(state, 'woman')
    assert.deepEqual(remembered.remainingIds, ['man', 'girl'])
    assert.equal(getWordRememberProgress(remembered).total, 3)
})
