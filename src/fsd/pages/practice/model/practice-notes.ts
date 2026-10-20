export const PRACTICE_NOTE_LIMIT = 1000

export interface PracticeNote {
    readonly questionId: string
    readonly text: string
    /** 仅作本轮经过时间的锚点，不是日期或持久化时间戳。 */
    readonly savedAt: number
}

export interface PracticeNoteEditor {
    readonly questionId: string
    readonly text: string
}

export interface PracticeNotesState {
    readonly entries: Readonly<Record<string, PracticeNote | undefined>>
    readonly editor: PracticeNoteEditor | null
}

export type PracticeNotesAction =
    | { readonly type: 'open'; readonly questionId: string }
    | { readonly type: 'edit'; readonly text: string }
    | { readonly type: 'save'; readonly now: number }
    | { readonly type: 'delete'; readonly questionId: string }
    | { readonly type: 'cancel' }
    | { readonly type: 'close' }

export const initialPracticeNotes: PracticeNotesState = { entries: {}, editor: null }

/** 与原生textarea的maxLength一致；组合输入不截断，超限时禁止保存。 */
export function canSavePracticeNote(state: PracticeNotesState): boolean {
    const editor = state.editor
    return (
        editor !== null &&
        editor.text.trim().length > 0 &&
        editor.text.length <= PRACTICE_NOTE_LIMIT &&
        editor.text !== state.entries[editor.questionId]?.text
    )
}

export function reducePracticeNotes(
    state: PracticeNotesState,
    questionIds: readonly string[],
    action: PracticeNotesAction,
): PracticeNotesState {
    if (action.type === 'open') {
        if (!questionIds.includes(action.questionId)) return state
        return {
            ...state,
            editor: {
                questionId: action.questionId,
                text: state.entries[action.questionId]?.text ?? '',
            },
        }
    }
    if (action.type === 'close') return state.editor ? { ...state, editor: null } : state
    if (action.type === 'delete') {
        if (!questionIds.includes(action.questionId) || !state.entries[action.questionId])
            return state
        const entries = { ...state.entries }
        delete entries[action.questionId]
        return {
            entries,
            editor:
                state.editor?.questionId === action.questionId
                    ? { questionId: action.questionId, text: '' }
                    : state.editor,
        }
    }
    const editor = state.editor
    if (editor === null || !questionIds.includes(editor.questionId)) return state
    if (action.type === 'edit')
        return editor.text === action.text
            ? state
            : { ...state, editor: { ...editor, text: action.text } }
    if (action.type === 'cancel') {
        const text = state.entries[editor.questionId]?.text ?? ''
        return editor.text === text ? state : { ...state, editor: { ...editor, text } }
    }
    if (!canSavePracticeNote(state) || !Number.isFinite(action.now) || action.now < 0) return state
    return {
        ...state,
        entries: {
            ...state.entries,
            [editor.questionId]: {
                questionId: editor.questionId,
                text: editor.text,
                savedAt: action.now,
            },
        },
    }
}

/** 用原始章节题序派生列表，记住删除、卡堆轮转和排序不影响题目归属。 */
export function getPracticeNotes(
    state: PracticeNotesState,
    questionIds: readonly string[],
): readonly PracticeNote[] {
    return [...new Set(questionIds)].flatMap((id) => {
        const note = state.entries[id]
        return note ? [note] : []
    })
}

export function getPracticeNoteAge(savedAt: number, now: number): string {
    if (!Number.isFinite(savedAt) || !Number.isFinite(now)) return '刚刚'
    const minutes = Math.floor(Math.max(0, now - savedAt) / 60000)
    if (minutes < 1) return '不到1分钟前'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    return hours < 24 ? `${hours}小时前` : `${Math.floor(hours / 24)}天前`
}
