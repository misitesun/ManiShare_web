'use client'

import type { ReactElement, ReactNode } from 'react'
import { useLearningPreferences } from './useLearningPreferences'
import { usePracticeBackgroundImage } from './usePracticeBackgroundImage'
import { LearningSettingsContext } from './learning-settings-state'
import type { LearningSettingsState } from './learning-settings-state'

export function LearningSettingsProvider({
    children,
}: {
    readonly children: ReactNode
}): ReactElement {
    const preferences = useLearningPreferences()
    const background = usePracticeBackgroundImage()
    const state: LearningSettingsState = {
        ...preferences,
        ready: preferences.ready && background.ready,
        background,
    }

    return (
        <LearningSettingsContext.Provider value={state}>
            {children}
        </LearningSettingsContext.Provider>
    )
}
