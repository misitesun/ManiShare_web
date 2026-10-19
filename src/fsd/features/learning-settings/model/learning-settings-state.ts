import { createContext } from 'react'
import type { LearningPreferences } from './preferences'
import type { LearningPreferencesState } from './useLearningPreferences'
import type { PracticeBackgroundState } from './usePracticeBackgroundImage'

export interface LearningSettingsSnapshot {
    readonly values: LearningPreferences
    readonly ready: boolean
    readonly saveError: boolean
    readonly background: PracticeBackgroundState
}

export interface LearningSettingsState extends LearningPreferencesState {
    readonly background: PracticeBackgroundState
}

export const LearningSettingsContext = createContext<LearningSettingsState | null>(null)
