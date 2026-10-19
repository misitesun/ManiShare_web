'use client'

import type { ReactElement } from 'react'
import { audioToolbarRows } from '../model/audio-toolbar-options'
import type { AudioToolbarMode, AudioToolbarOptions } from '../model/audio-toolbar-options'
import { PracticeModeToolbar } from './PracticeModeToolbar'

interface AudioPracticeToolbarProps {
    readonly mode: AudioToolbarMode
    readonly values: AudioToolbarOptions
    readonly onChange: (values: AudioToolbarOptions) => void
    readonly onNotice: (message: string) => void
}

export function AudioPracticeToolbar({
    mode,
    values,
    onChange,
    onNotice,
}: AudioPracticeToolbarProps): ReactElement {
    return (
        <PracticeModeToolbar
            family="audio"
            rows={audioToolbarRows[mode]}
            values={values}
            onValueChange={(row, checked): void => onChange({ ...values, [row]: checked })}
            onNotice={onNotice}
        />
    )
}
