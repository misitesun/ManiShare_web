'use client'

import { useState } from 'react'
import { getPracticeDraft, reducePracticeDrafts } from './practice-draft'
import type { PracticeDraftMemory } from './practice-draft'

export interface PracticeDrafts {
    readonly text: string
    readonly savedText: string
    readonly setText: (text: string) => void
    readonly clear: () => void
    readonly save: () => void
}

/** 在不随小模式重挂的页面层调用；scope变化直接派生对应草稿，不在Effect中同步状态。 */
export function usePracticeDrafts(scope: string): PracticeDrafts {
    const [memory, setMemory] = useState<PracticeDraftMemory>({})
    const draft = getPracticeDraft(memory, scope)

    function setText(text: string): void {
        setMemory((current) => reducePracticeDrafts(current, scope, { type: 'edit', text }))
    }

    function clear(): void {
        setMemory((current) => reducePracticeDrafts(current, scope, { type: 'clear' }))
    }

    function save(): void {
        setMemory((current) => reducePracticeDrafts(current, scope, { type: 'save' }))
    }

    return { text: draft.text, savedText: draft.savedText, setText, clear, save }
}
