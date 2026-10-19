import { practiceDemos } from './practice-demo'
import type { PracticeFamily, PracticeMode } from './practice-demo'
import {
    createWordToolbarOptions,
    isWordToolbarMode,
    wordToolbarRows,
} from './word-toolbar-options'
import type { WordToolbarMode, WordToolbarOptions } from './word-toolbar-options'
import {
    createSentenceToolbarOptions,
    isSentenceToolbarMode,
    sentenceToolbarRows,
} from './sentence-toolbar-options'
import type { SentenceToolbarMode, SentenceToolbarOptions } from './sentence-toolbar-options'
import {
    audioToolbarRows,
    createAudioToolbarOptions,
    isAudioToolbarMode,
} from './audio-toolbar-options'
import type { AudioToolbarMode, AudioToolbarOptions } from './audio-toolbar-options'
import {
    createAdditionalToolbarOptions,
    getAdditionalToolbarRows,
    isAdditionalToolbarFamily,
} from './additional-toolbar-options'
import type {
    AdditionalToolbarFamily,
    AdditionalToolbarOptions,
} from './additional-toolbar-options'

export type PracticeToolbarOptions =
    WordToolbarOptions | SentenceToolbarOptions | AudioToolbarOptions | AdditionalToolbarOptions

export type PracticeToolbarScopeKey = `${PracticeFamily}:${PracticeMode}`
export type PracticeToolbarStoredOptions = Partial<
    WordToolbarOptions & SentenceToolbarOptions & AudioToolbarOptions & AdditionalToolbarOptions
>
export type PracticeToolbarScopes = Partial<
    Record<PracticeToolbarScopeKey, PracticeToolbarStoredOptions>
>

export interface PracticeToolbarPreferences {
    readonly version: 1
    readonly scopes: Readonly<PracticeToolbarScopes>
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getPracticeToolbarScopeKey(
    family: PracticeFamily,
    mode: PracticeMode,
): PracticeToolbarScopeKey {
    return `${family}:${mode}`
}

function getAllowedFields(
    family: PracticeFamily,
    mode: PracticeMode,
): readonly (keyof PracticeToolbarStoredOptions)[] {
    if (!practiceDemos.some((demo) => demo.family === family && demo.modes.includes(mode)))
        return []
    if (family === 'word' && isWordToolbarMode(mode))
        return mode === 'pronounce'
            ? [...wordToolbarRows[mode], 'order', 'language', 'phonetics']
            : mode === 'spell'
              ? [...wordToolbarRows[mode], 'phonetics']
              : wordToolbarRows[mode]
    if (family === 'sentence' && isSentenceToolbarMode(mode)) return sentenceToolbarRows[mode]
    if (family === 'audio' && isAudioToolbarMode(mode)) return audioToolbarRows[mode]
    if (isAdditionalToolbarFamily(family))
        return family === 'phonetics'
            ? ['naturalPhonics']
            : getAdditionalToolbarRows(family, mode, true)
    return []
}

function parseScopeOptions(
    family: PracticeFamily,
    mode: PracticeMode,
    value: unknown,
): PracticeToolbarStoredOptions {
    const result: PracticeToolbarStoredOptions = {}
    if (!isRecord(value)) return result
    for (const field of getAllowedFields(family, mode)) {
        if (!Object.hasOwn(value, field)) continue
        const candidate = value[field]
        if (field === 'order') {
            if (
                candidate === 'sequential' ||
                candidate === 'random' ||
                candidate === 'alphabetical'
            )
                result.order = candidate
        } else if (field === 'language') {
            if (candidate === 'translate' || candidate === 'interpret' || candidate === 'bilingual')
                result.language = candidate
        } else if (field === 'phonetics') {
            if (
                candidate === 'original' ||
                candidate === 'syllables' ||
                candidate === 'phonics' ||
                candidate === 'none'
            )
                result.phonetics = candidate
        } else if (typeof candidate === 'boolean') result[field] = candidate
    }
    return result
}

/** 只恢复已登记玩法的真实控件；缺项或坏值在读取时回退该模式初值。 */
export function parsePracticeToolbarPreferences(value: unknown): PracticeToolbarPreferences {
    const scopes: PracticeToolbarScopes = {}
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.scopes))
        return { version: 1, scopes }
    for (const demo of practiceDemos)
        for (const mode of demo.modes) {
            const key = getPracticeToolbarScopeKey(demo.family, mode)
            if (!Object.hasOwn(value.scopes, key)) continue
            const options = parseScopeOptions(demo.family, mode, value.scopes[key])
            if (Object.keys(options).length > 0) scopes[key] = options
        }
    return { version: 1, scopes }
}

export function getWordToolbarPreferences(
    preferences: PracticeToolbarPreferences,
    mode: WordToolbarMode,
): WordToolbarOptions {
    return {
        ...createWordToolbarOptions(mode),
        ...parseScopeOptions(
            'word',
            mode,
            preferences.scopes[getPracticeToolbarScopeKey('word', mode)],
        ),
    }
}

export function getSentenceToolbarPreferences(
    preferences: PracticeToolbarPreferences,
    mode: SentenceToolbarMode,
): SentenceToolbarOptions {
    return {
        ...createSentenceToolbarOptions(mode),
        ...parseScopeOptions(
            'sentence',
            mode,
            preferences.scopes[getPracticeToolbarScopeKey('sentence', mode)],
        ),
    }
}

export function getAudioToolbarPreferences(
    preferences: PracticeToolbarPreferences,
    mode: AudioToolbarMode,
): AudioToolbarOptions {
    return {
        ...createAudioToolbarOptions(mode),
        ...parseScopeOptions(
            'audio',
            mode,
            preferences.scopes[getPracticeToolbarScopeKey('audio', mode)],
        ),
    }
}

export function getAdditionalToolbarPreferences(
    preferences: PracticeToolbarPreferences,
    family: AdditionalToolbarFamily,
    mode: PracticeMode,
): AdditionalToolbarOptions {
    return {
        ...createAdditionalToolbarOptions(family, mode),
        ...parseScopeOptions(
            family,
            mode,
            preferences.scopes[getPracticeToolbarScopeKey(family, mode)],
        ),
    }
}

export function updatePracticeToolbarPreferences(
    preferences: PracticeToolbarPreferences,
    family: PracticeFamily,
    mode: PracticeMode,
    next: PracticeToolbarOptions,
): PracticeToolbarPreferences {
    const options = parseScopeOptions(family, mode, next)
    if (Object.keys(options).length === 0) return preferences
    return {
        version: 1,
        scopes: {
            ...preferences.scopes,
            [getPracticeToolbarScopeKey(family, mode)]: options,
        },
    }
}
