'use client'

import { useContext } from 'react'
import { LearningSettingsContext } from './learning-settings-state'
import type { LearningSettingsSnapshot, LearningSettingsState } from './learning-settings-state'

export function useLearningSettings(): LearningSettingsState {
    const state = useContext(LearningSettingsContext)
    if (state === null) throw new Error('设置内容必须在 LearningSettingsProvider 内使用。')
    return state
}

export function useLearningSettingsSnapshot(): LearningSettingsSnapshot {
    const { values, ready, saveError, background } = useLearningSettings()
    return { values, ready, saveError, background }
}
