import assert from 'node:assert/strict'
import test from 'node:test'
import {
    createPracticeErrorFeedbackState,
    practiceErrorFeedbackOptions,
    practiceErrorFeedbackReducer,
    togglePracticeErrorFeedbackType,
    validatePracticeErrorFeedback,
    type PracticeErrorFeedbackType,
} from './practice-error-feedback'

test('反馈初始无选中且描述为空，七种类型保持设计顺序与稳定标识', (): void => {
    assert.deepEqual(createPracticeErrorFeedbackState(), {
        form: { types: [], description: '' },
        hasSubmitted: false,
    })
    assert.deepEqual(practiceErrorFeedbackOptions, [
        { id: 'phonetic', label: '音标错误' },
        { id: 'part-of-speech', label: '词性错误' },
        { id: 'translation', label: '翻译不准' },
        { id: 'spelling', label: '拼写有误' },
        { id: 'sentence-structure', label: '句子成分划分错误' },
        { id: 'pronunciation', label: '发音不准或听不清' },
        { id: 'other', label: '其他' },
    ])
    assert.equal(new Set(practiceErrorFeedbackOptions.map((option) => option.id)).size, 7)
})

test('多选与取消保留其余选择，不修改原集合或产生重复类型', (): void => {
    const original: readonly PracticeErrorFeedbackType[] = ['phonetic', 'translation']
    const expanded = togglePracticeErrorFeedbackType(original, 'other')
    assert.deepEqual(original, ['phonetic', 'translation'])
    assert.deepEqual(expanded, ['phonetic', 'translation', 'other'])
    const removed = togglePracticeErrorFeedbackType(expanded, 'translation')
    assert.deepEqual(expanded, ['phonetic', 'translation', 'other'])
    assert.deepEqual(removed, ['phonetic', 'other'])
    const reselected = togglePracticeErrorFeedbackType(removed, 'translation')
    assert.deepEqual(reselected, ['phonetic', 'other', 'translation'])
    assert.equal(new Set(reselected).size, reselected.length)
    assert.deepEqual(togglePracticeErrorFeedbackType(['other'], 'other'), [])
})

test('提交要求至少一种错误类型和非空描述，空白与换行不能代替描述', (): void => {
    assert.deepEqual(validatePracticeErrorFeedback({ types: [], description: '' }), {
        types: '请选择至少一种错误类型',
        description: '请填写错误描述',
    })
    assert.deepEqual(
        validatePracticeErrorFeedback({ types: ['translation'], description: ' \n\t　' }),
        { description: '请填写错误描述' },
    )
    assert.deepEqual(validatePracticeErrorFeedback({ types: [], description: '翻译有遗漏' }), {
        types: '请选择至少一种错误类型',
    })
    assert.deepEqual(
        validatePracticeErrorFeedback({ types: ['translation'], description: ' 翻译有遗漏\n' }),
        {},
    )
    assert.deepEqual(
        validatePracticeErrorFeedback({ types: ['other'], description: '描述'.repeat(1000) }),
        {},
    )
})

test('提交后保留原始输入，修复字段后可直接派生最新错误而不储存重复错误状态', (): void => {
    const initial = createPracticeErrorFeedbackState()
    const submitted = practiceErrorFeedbackReducer(initial, { type: 'submit' })
    assert.equal(initial.hasSubmitted, false)
    assert.equal(submitted.hasSubmitted, true)
    assert.deepEqual(validatePracticeErrorFeedback(submitted.form), {
        types: '请选择至少一种错误类型',
        description: '请填写错误描述',
    })
    const selected = practiceErrorFeedbackReducer(submitted, {
        type: 'toggle-type',
        errorType: 'pronunciation',
    })
    assert.equal(selected.hasSubmitted, true)
    assert.deepEqual(validatePracticeErrorFeedback(selected.form), {
        description: '请填写错误描述',
    })
    const edited = practiceErrorFeedbackReducer(selected, {
        type: 'edit-description',
        description: '  发音不清晰\n请核对音源  ',
    })
    assert.equal(edited.hasSubmitted, true)
    assert.equal(edited.form.description, '  发音不清晰\n请核对音源  ')
    assert.deepEqual(validatePracticeErrorFeedback(edited.form), {})
    const retried = practiceErrorFeedbackReducer(edited, { type: 'submit' })
    assert.equal(retried, edited)
    assert.deepEqual(retried.form, {
        types: ['pronunciation'],
        description: '  发音不清晰\n请核对音源  ',
    })
    const deselected = practiceErrorFeedbackReducer(retried, {
        type: 'toggle-type',
        errorType: 'pronunciation',
    })
    assert.deepEqual(validatePracticeErrorFeedback(deselected.form), {
        types: '请选择至少一种错误类型',
    })
})

test('关闭或取消时reset清空本轮表单与提交状态，再次打开得到独立空白状态', (): void => {
    let state = createPracticeErrorFeedbackState()
    state = practiceErrorFeedbackReducer(state, { type: 'toggle-type', errorType: 'spelling' })
    state = practiceErrorFeedbackReducer(state, {
        type: 'edit-description',
        description: '末尾少了一个字母',
    })
    state = practiceErrorFeedbackReducer(state, { type: 'submit' })
    const reset = practiceErrorFeedbackReducer(state, { type: 'reset' })
    assert.deepEqual(reset, createPracticeErrorFeedbackState())
    assert.deepEqual(state.form, { types: ['spelling'], description: '末尾少了一个字母' })
    assert.notEqual(reset.form, createPracticeErrorFeedbackState().form)
    assert.equal(
        practiceErrorFeedbackReducer(reset, { type: 'edit-description', description: '' }),
        reset,
    )
})
