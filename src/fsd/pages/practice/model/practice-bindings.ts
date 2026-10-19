import { getEffectiveShortcut } from '../../../features/learning-settings'
import type {
    ShortcutPreferenceKey,
    ShortcutPreferences,
} from '../../../features/learning-settings'
import type { PracticeCommand } from './practice-command-types'

const preferenceBindings: Partial<Record<PracticeCommand, ShortcutPreferenceKey>> = {
    'question.previous': 'previousShortcut',
    'question.next': 'nextShortcut',
    'practice.readAloud': 'playShortcut',
    'practice.markMastered': 'masteredShortcut',
    'practice.markUnfamiliar': 'unfamiliarShortcut',
}

const flowBindings: Partial<Record<PracticeCommand, readonly string[]>> = {
    'practice.primary': ['Enter'],
    'practice.contextual': ['Space'],
    'practice.oral': ['V'],
    'practice.panel.toggle': ['ArrowDown', 'ArrowUp'],
    'practice.panel.show': ['ArrowDown'],
    'practice.panel.hide': ['ArrowUp'],
    'practice.dismiss': ['Escape'],
    'session.replay': ['Space'],
    'session.nextChapter': ['Enter'],
    'session.return': ['Escape'],
}

/** 底栏与键盘共同消费；冲突的历史偏好保留原值，但不宣称可执行。 */
export function getPracticeCommandBindings(
    command: PracticeCommand,
    values: ShortcutPreferences,
): readonly string[] {
    const preference = preferenceBindings[command]
    if (preference) {
        const binding = getEffectiveShortcut(values, preference)
        return binding ? [binding] : []
    }
    return flowBindings[command] ?? []
}
