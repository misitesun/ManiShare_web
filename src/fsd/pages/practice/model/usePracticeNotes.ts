'use client'

import { useState } from 'react'
import { getMonotonicMilliseconds } from '../../../shared/lib/time'
import {
    canSavePracticeNote,
    getPracticeNotes,
    initialPracticeNotes,
    reducePracticeNotes,
} from './practice-notes'
import type { PracticeNote, PracticeNoteEditor } from './practice-notes'

export interface PracticeNotes {
    readonly notes: readonly PracticeNote[]
    readonly editor: PracticeNoteEditor | null
    readonly canSave: boolean
    readonly open: (questionId: string) => void
    readonly edit: (text: string) => void
    readonly save: () => void
    readonly remove: (questionId: string) => void
    readonly cancel: () => void
    readonly close: () => void
}

/** 状态留在章节会话；重练保留笔记，离开会话后释放，不写Storage或接口。 */
export function usePracticeNotes(questionIds: readonly string[]): PracticeNotes {
    const [state, setState] = useState(initialPracticeNotes)

    function open(questionId: string): void {
        setState((current) =>
            reducePracticeNotes(current, questionIds, { type: 'open', questionId }),
        )
    }
    function edit(text: string): void {
        setState((current) => reducePracticeNotes(current, questionIds, { type: 'edit', text }))
    }
    function save(): void {
        const now = getMonotonicMilliseconds()
        setState((current) => reducePracticeNotes(current, questionIds, { type: 'save', now }))
    }
    function remove(questionId: string): void {
        setState((current) =>
            reducePracticeNotes(current, questionIds, { type: 'delete', questionId }),
        )
    }
    function cancel(): void {
        setState((current) => reducePracticeNotes(current, questionIds, { type: 'cancel' }))
    }
    function close(): void {
        setState((current) => reducePracticeNotes(current, questionIds, { type: 'close' }))
    }

    return {
        notes: getPracticeNotes(state, questionIds),
        editor: state.editor,
        canSave: canSavePracticeNote(state),
        open,
        edit,
        save,
        remove,
        cancel,
        close,
    }
}
