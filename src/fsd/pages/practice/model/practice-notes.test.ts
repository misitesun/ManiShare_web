import assert from 'node:assert/strict'
import test from 'node:test'
import {
    canSavePracticeNote,
    getPracticeNoteAge,
    getPracticeNotes,
    initialPracticeNotes,
    PRACTICE_NOTE_LIMIT,
    reducePracticeNotes,
} from './practice-notes'
import type { PracticeNotesState } from './practice-notes'

const ids = ['woman', 'man', 'girl']

function write(state: PracticeNotesState, questionId: string, text: string): PracticeNotesState {
    return reducePracticeNotes(reducePracticeNotes(state, ids, { type: 'open', questionId }), ids, {
        type: 'edit',
        text,
    })
}

test('本题输入在保存前不进入章节列表，关闭丢弃输入，重开恢复已保存正文', (): void => {
    const draft = write(initialPracticeNotes, 'woman', '今天学习的单词')
    assert.deepEqual(getPracticeNotes(draft, ids), [])
    const closed = reducePracticeNotes(draft, ids, { type: 'close' })
    const reopened = reducePracticeNotes(closed, ids, { type: 'open', questionId: 'woman' })
    assert.equal(reopened.editor?.text, '')
    const saved = reducePracticeNotes(draft, ids, { type: 'save', now: 100 })
    const edited = write(saved, 'woman', '尚未保存的修改')
    const reopenedSaved = reducePracticeNotes(
        reducePracticeNotes(edited, ids, { type: 'close' }),
        ids,
        { type: 'open', questionId: 'woman' },
    )
    assert.equal(reopenedSaved.editor?.text, '今天学习的单词')
    assert.equal(getPracticeNotes(reopenedSaved, ids).length, 1)
})

test('同题重复保存只更新原笔记，保留换行与空白，不新增第二条或误改其他题', (): void => {
    const first = reducePracticeNotes(write(initialPracticeNotes, 'woman', '第一条'), ids, {
        type: 'save',
        now: 10,
    })
    const second = reducePracticeNotes(write(first, 'man', '第二题'), ids, {
        type: 'save',
        now: 20,
    })
    const updated = reducePracticeNotes(write(second, 'woman', '  更新\n正文  '), ids, {
        type: 'save',
        now: 30,
    })
    assert.deepEqual(
        getPracticeNotes(updated, ids).map((note) => [note.questionId, note.text]),
        [
            ['woman', '  更新\n正文  '],
            ['man', '第二题'],
        ],
    )
    assert.equal(updated.entries.woman?.savedAt, 30)
    assert.equal(updated.entries.man, second.entries.man)
    assert.equal(canSavePracticeNote(updated), false)
    assert.equal(reducePracticeNotes(updated, ids, { type: 'save', now: 40 }), updated)
})

test('原始章节身份派生列表，不跟随卡堆删除、重排或上一题改变归属', (): void => {
    let state = initialPracticeNotes
    for (const id of [...ids].reverse())
        state = reducePracticeNotes(write(state, id, id), ids, { type: 'save', now: 50 })
    assert.deepEqual(
        getPracticeNotes(state, ids).map((note) => note.questionId),
        ids,
    )
    assert.deepEqual(
        getPracticeNotes(state, ['girl', 'girl', 'woman']).map((note) => note.questionId),
        ['girl', 'woman'],
    )
    assert.equal(getPracticeNotes(state, ids).length, 3, '可始终按原始列表显示已移出待练的词')
})

test('取消恢复当前题保存值，删除只影响目标；删除当前题可重新添加', (): void => {
    const first = reducePracticeNotes(write(initialPracticeNotes, 'woman', '已保存'), ids, {
        type: 'save',
        now: 10,
    })
    const second = reducePracticeNotes(write(first, 'man', '另一题'), ids, {
        type: 'save',
        now: 20,
    })
    const editing = write(second, 'woman', '未保存')
    const cancelled = reducePracticeNotes(editing, ids, { type: 'cancel' })
    assert.equal(cancelled.editor?.text, '已保存')
    const deletedOther = reducePracticeNotes(editing, ids, { type: 'delete', questionId: 'man' })
    assert.equal(deletedOther.editor, editing.editor)
    const deletedCurrent = reducePracticeNotes(deletedOther, ids, {
        type: 'delete',
        questionId: 'woman',
    })
    assert.deepEqual(getPracticeNotes(deletedCurrent, ids), [])
    assert.equal(deletedCurrent.editor?.text, '')
    const added = reducePracticeNotes(write(deletedCurrent, 'woman', '重新记录'), ids, {
        type: 'save',
        now: 30,
    })
    assert.equal(getPracticeNotes(added, ids).length, 1)
    assert.equal(first.entries.woman?.text, '已保存', '不修改旧状态')
})

test('无题目、未知题目、空白、超限和非法时钟均不能保存或删除其他记录', (): void => {
    assert.equal(
        reducePracticeNotes(initialPracticeNotes, ids, { type: 'open', questionId: 'missing' }),
        initialPracticeNotes,
    )
    assert.equal(
        reducePracticeNotes(initialPracticeNotes, ids, { type: 'save', now: 1 }),
        initialPracticeNotes,
    )
    for (const text of ['', ' \n ', '字'.repeat(PRACTICE_NOTE_LIMIT + 1)]) {
        const draft = write(initialPracticeNotes, 'woman', text)
        assert.equal(canSavePracticeNote(draft), false)
        assert.equal(reducePracticeNotes(draft, ids, { type: 'save', now: 1 }), draft)
    }
    const limit = write(initialPracticeNotes, 'woman', '字'.repeat(PRACTICE_NOTE_LIMIT))
    assert.equal(canSavePracticeNote(limit), true)
    for (const now of [Number.NaN, Number.POSITIVE_INFINITY, -1])
        assert.equal(reducePracticeNotes(limit, ids, { type: 'save', now }), limit)
    const saved = reducePracticeNotes(limit, ids, { type: 'save', now: 0 })
    assert.equal(saved.entries.woman?.text.length, PRACTICE_NOTE_LIMIT)
    assert.equal(reducePracticeNotes(saved, ids, { type: 'delete', questionId: 'missing' }), saved)
    assert.equal(canSavePracticeNote(reducePracticeNotes(limit, ids, { type: 'close' })), false)
})

test('相对时间按本轮真实经过时间计算，边界不受定时器回调次数影响', (): void => {
    assert.equal(getPracticeNoteAge(100, 100), '不到1分钟前')
    assert.equal(getPracticeNoteAge(100, 60099), '不到1分钟前')
    assert.equal(getPracticeNoteAge(100, 60100), '1分钟前')
    assert.equal(getPracticeNoteAge(100, 3600100), '1小时前')
    assert.equal(getPracticeNoteAge(100, 86400100), '1天前')
    assert.equal(getPracticeNoteAge(100, 50), '不到1分钟前')
    assert.equal(getPracticeNoteAge(100, Number.NaN), '刚刚')
})
