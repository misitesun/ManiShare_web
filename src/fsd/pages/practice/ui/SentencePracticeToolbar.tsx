'use client'

import type { ReactElement } from 'react'
import { sentenceToolbarRows } from '../model/sentence-toolbar-options'
import type { SentenceToolbarMode, SentenceToolbarOptions } from '../model/sentence-toolbar-options'
import { PracticeModeToolbar } from './PracticeModeToolbar'

interface SentencePracticeToolbarProps {
    readonly mode: SentenceToolbarMode
    readonly values: SentenceToolbarOptions
    readonly onChange: (values: SentenceToolbarOptions) => void
    readonly onNotice: (message: string) => void
}

export function SentencePracticeToolbar({
    mode,
    values,
    onChange,
    onNotice,
}: SentencePracticeToolbarProps): ReactElement {
    return (
        <PracticeModeToolbar
            family="sentence"
            rows={sentenceToolbarRows[mode]}
            values={values}
            onValueChange={(row, checked): void => onChange({ ...values, [row]: checked })}
            onNotice={onNotice}
        />
    )
}
