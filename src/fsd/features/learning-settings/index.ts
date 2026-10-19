export { LearningSettingsProvider } from './model/LearningSettingsProvider'
export { useLearningSettingsSnapshot } from './model/useLearningSettings'
export type { LearningSettingsSnapshot } from './model/learning-settings-state'
export { LearningSettingsEditor } from './ui/LearningSettingsEditor'
export type { LearningSettingsEditorProps } from './ui/LearningSettingsEditor'
export { PracticeBackgroundSurface } from './ui/PracticeBackgroundSurface'
export { getBackgroundPresetColor, resolvePreferenceColor } from './model/practice-background'
export { getPreviewAppearance } from './model/appearance-preview'
export {
    captureShortcut,
    getEffectiveShortcut,
    isSettingsTab,
    matchesShortcut,
    resolveSettingsTab,
    shortcutError,
    shortcutFields,
} from './model/preferences'
export type {
    LearningPreferences,
    SettingsTab,
    ShortcutInput,
    ShortcutPreferenceKey,
    ShortcutPreferences,
} from './model/preferences'
export type { PracticeBackgroundImage } from './model/practice-background'
export type { PracticeBackgroundState } from './model/usePracticeBackgroundImage'
export { LearningAudioWave } from './ui/LearningAudioWave'
export { getLearningAnimation, resolveCorrectAnimationId } from './model/feedback-animations'
export type { LearningAnimationId } from './model/feedback-animations'
