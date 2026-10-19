export type PracticeErrorFeedbackType =
    | 'phonetic'
    | 'part-of-speech'
    | 'translation'
    | 'spelling'
    | 'sentence-structure'
    | 'pronunciation'
    | 'other'

export interface PracticeErrorFeedbackOption {
    readonly id: PracticeErrorFeedbackType
    readonly label: string
}

export const practiceErrorFeedbackOptions: readonly PracticeErrorFeedbackOption[] = [
    { id: 'phonetic', label: '音标错误' },
    { id: 'part-of-speech', label: '词性错误' },
    { id: 'translation', label: '翻译不准' },
    { id: 'spelling', label: '拼写有误' },
    { id: 'sentence-structure', label: '句子成分划分错误' },
    { id: 'pronunciation', label: '发音不准或听不清' },
    { id: 'other', label: '其他' },
]

export interface PracticeErrorFeedbackForm {
    readonly types: readonly PracticeErrorFeedbackType[]
    readonly description: string
}

export interface PracticeErrorFeedbackErrors {
    readonly types?: string
    readonly description?: string
}

export interface PracticeErrorFeedbackState {
    readonly form: PracticeErrorFeedbackForm
    readonly hasSubmitted: boolean
}

export type PracticeErrorFeedbackAction =
    | { readonly type: 'toggle-type'; readonly errorType: PracticeErrorFeedbackType }
    | { readonly type: 'edit-description'; readonly description: string }
    | { readonly type: 'submit' }
    | { readonly type: 'reset' }

export function createPracticeErrorFeedbackState(): PracticeErrorFeedbackState {
    return { form: { types: [], description: '' }, hasSubmitted: false }
}

export function togglePracticeErrorFeedbackType(
    types: readonly PracticeErrorFeedbackType[],
    errorType: PracticeErrorFeedbackType,
): readonly PracticeErrorFeedbackType[] {
    return types.includes(errorType)
        ? types.filter((type) => type !== errorType)
        : [...types, errorType]
}

export function validatePracticeErrorFeedback(
    form: PracticeErrorFeedbackForm,
): PracticeErrorFeedbackErrors {
    return {
        ...(form.types.length === 0 ? { types: '请选择至少一种错误类型' } : {}),
        ...(form.description.trim().length === 0 ? { description: '请填写错误描述' } : {}),
    }
}

/** 仅管理本轮表单；提交不清空、不发送，关闭后由界面显式重置。 */
export function practiceErrorFeedbackReducer(
    state: PracticeErrorFeedbackState,
    action: PracticeErrorFeedbackAction,
): PracticeErrorFeedbackState {
    switch (action.type) {
        case 'toggle-type':
            return {
                ...state,
                form: {
                    ...state.form,
                    types: togglePracticeErrorFeedbackType(state.form.types, action.errorType),
                },
            }
        case 'edit-description':
            return action.description === state.form.description
                ? state
                : { ...state, form: { ...state.form, description: action.description } }
        case 'submit':
            return state.hasSubmitted ? state : { ...state, hasSubmitted: true }
        case 'reset':
            return createPracticeErrorFeedbackState()
    }
}
